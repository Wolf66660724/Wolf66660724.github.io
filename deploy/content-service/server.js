'use strict'

/**
 * 博客内容服务（拾光集 / 灵感集的后台）
 *
 * 设计要点：
 *   - 零 npm 依赖，只用 Node 内置模块，避免打包和供应链风险
 *   - 数据以 JSON 文件存在挂载卷里，写入用「临时文件 + rename」保证原子性
 *   - 图片以 base64 上传后落盘，按内容哈希命名（同图不会重复占空间）
 *   - 鉴权：密码换 token，token 用 HMAC 签名带过期时间，不需要会话存储
 *
 * 路由：
 *   GET    /                       管理页（admin.html）
 *   GET    /api/public/photos      公开读取照片（博客前端用）
 *   GET    /api/public/shares      公开读取灵感
 *   POST   /api/login              密码换 token
 *   GET    /api/items/:type        列表（需鉴权）
 *   POST   /api/items/:type        新增（需鉴权）
 *   PUT    /api/items/:type/:id    修改（需鉴权）
 *   DELETE /api/items/:type/:id    删除（需鉴权）
 *   POST   /api/upload             上传图片（需鉴权）
 *   GET    /uploads/:file          读取已上传的图片
 */

const http = require('http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const PORT = Number(process.env.PORT || 8790)
const DATA_DIR = process.env.DATA_DIR || '/data'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''
const TOKEN_SECRET = process.env.TOKEN_SECRET || crypto.randomBytes(32).toString('hex')
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000
const BODY_LIMIT = 12 * 1024 * 1024

// 评论系统 Waline：合并后台用，登录时顺带换一个 Waline 的 token
const SITE_URL = process.env.SITE_URL || 'https://worldpeace.top'
const WALINE_API = process.env.WALINE_API || ''
const WALINE_EMAIL = process.env.WALINE_EMAIL || ''
const WALINE_PASSWORD = process.env.WALINE_PASSWORD || ''

const UPLOAD_DIR = path.join(DATA_DIR, 'uploads')
const TYPES = { photos: 'photos', shares: 'shares' }
const ALLOWED_IMAGE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif'
}

if (!ADMIN_PASSWORD) console.warn('[warn] 未设置 ADMIN_PASSWORD，后台登录会全部失败')

// ---------- 存储 ----------
function ensureDirs () {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

function dataFile (type) {
  return path.join(DATA_DIR, type + '.json')
}

function readItems (type) {
  try {
    const raw = fs.readFileSync(dataFile(type), 'utf8')
    const obj = JSON.parse(raw)
    return Array.isArray(obj.items) ? obj.items : []
  } catch (e) {
    return []
  }
}

function writeItems (type, items) {
  const tmp = dataFile(type) + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify({ updated: new Date().toISOString(), items }, null, 2), 'utf8')
  fs.renameSync(tmp, dataFile(type))
}

// ---------- 管理密码 ----------
// 初始密码来自环境变量；一旦在后台改过，就写到数据目录的 auth.json（scrypt 加盐哈希），
// 以后以文件里的为准，改密码不用动 compose、不用重启。
function authFile () {
  return path.join(DATA_DIR, 'auth.json')
}

function readAuth () {
  try { return JSON.parse(fs.readFileSync(authFile(), 'utf8')) } catch (e) { return null }
}

function writeAuth (passwordHash, by) {
  const tmp = authFile() + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify({ passwordHash, changedAt: new Date().toISOString(), changedBy: by || '' }, null, 2), 'utf8')
  fs.renameSync(tmp, authFile())
}

function hashPassword (pw) {
  const salt = crypto.randomBytes(16).toString('hex')
  const key = crypto.scryptSync(pw, salt, 32).toString('hex')
  return 'scrypt:' + salt + ':' + key
}

function verifyPassword (pw, stored) {
  if (!stored) return !!ADMIN_PASSWORD && pw === ADMIN_PASSWORD   // 还没改过，用环境变量里的初始密码
  const parts = String(stored).split(':')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const test = crypto.scryptSync(pw, parts[1], 32).toString('hex')
  const a = Buffer.from(test, 'utf8')
  const b = Buffer.from(parts[2], 'utf8')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function currentAuth () {
  const a = readAuth()
  return a && a.passwordHash ? a : null
}

function newId (prefix) {
  return prefix + '_' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex')
}

// ---------- token ----------
function sign (exp) {
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url')
  const mac = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url')
  return payload + '.' + mac
}

function validToken (token) {
  if (!token || token.indexOf('.') < 0) return false
  const [payload, mac] = token.split('.')
  const expect = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url')
  if (mac.length !== expect.length) return false
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expect))) return false
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return typeof exp === 'number' && exp > Date.now()
  } catch (e) { return false }
}

// 登录失败限流：同一 IP 10 分钟内最多失败 8 次
const loginFails = new Map()
function tooManyFails (ip) {
  const rec = loginFails.get(ip)
  if (!rec) return false
  if (Date.now() - rec.first > 10 * 60 * 1000) { loginFails.delete(ip); return false }
  return rec.count >= 8
}
function noteFail (ip) {
  const rec = loginFails.get(ip)
  if (!rec || Date.now() - rec.first > 10 * 60 * 1000) loginFails.set(ip, { count: 1, first: Date.now() })
  else rec.count++
}

// ---------- HTTP 工具 ----------
function send (res, code, obj, headers) {
  const body = typeof obj === 'string' ? obj : JSON.stringify(obj)
  res.writeHead(code, Object.assign({
    'Content-Type': typeof obj === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }, headers || {}))
  res.end(body)
}

function readBody (req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', c => {
      size += c.length
      if (size > BODY_LIMIT) { reject(new Error('body too large')); req.destroy(); return }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function jsonBody (req) {
  return readBody(req).then(t => { try { return JSON.parse(t || '{}') } catch (e) { return {} } })
}

function authed (req) {
  const h = req.headers.authorization || ''
  const m = h.match(/^Bearer\s+(.+)$/i)
  return m ? validToken(m[1]) : false
}

function clientIp (req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown'
}

// ---------- 字段清洗 ----------
function str (v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max)
}
function safeImagePath (v) {
  let s = str(v, 300)
  // 兼容历史数据里写的 /uploads/xxx（那是服务内部路径，公网访问不到）
  s = s.replace(/^\/uploads\//, '/content-img/')
  return /^\/content-img\/[A-Za-z0-9._-]+$/.test(s) ? s : ''
}
// 视频封面：允许上传的图片路径，或站内 /img/... 路径
function safeMediaPath (v) {
  const s = str(v, 300)
  if (!s) return ''
  if (/^\/content-img\/[A-Za-z0-9._-]+$/.test(s)) return s
  if (/^\/img\/[A-Za-z0-9._\-\/]+$/.test(s)) return s
  if (/^https?:\/\//i.test(s)) return s
  return ''
}

// 视频地址：站内视频文件 或 站外链接（B站/YouTube 等）
function safeMediaUrl (v) {
  const s = str(v, 800)
  if (!s) return ''
  if (/^\/movies\/videos\/[A-Za-z0-9._%\-\/]+$/.test(s)) return s
  if (/^https?:\/\//i.test(s)) return s
  return ''
}

function safeUrl (v) {
  const s = str(v, 800)
  if (!s || s === '#') return '#'
  return /^https?:\/\//i.test(s) ? s : '#'
}

function normalize (type, body, base) {
  if (type === 'photos') {
    return Object.assign(base || {}, {
      title: str(body.title, 80),
      desc: str(body.desc, 200),
      date: /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : '',
      image: safeImagePath(body.image),
      icon: str(body.icon, 8) || '🖼️'
    })
  }
  if (type === 'movies') {
    return Object.assign(base || {}, {
      title: str(body.title, 120),
      desc: str(body.desc, 300),
      date: /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : '',
      tags: str(body.tags, 200),
      cover: safeMediaPath(body.cover),
      url: safeMediaUrl(body.url),
      icon: str(body.icon, 8) || '🎬'
    })
  }
  if (type === 'drafts') {
    // 正文要保留换行，不能用 str()（它会清掉控制字符）
    const content = String(body.content == null ? '' : body.content).replace(/\r\n/g, '\n').slice(0, 200000)
    return Object.assign(base || {}, {
      title: str(body.title, 120),
      slug: str(body.slug, 80),
      date: str(body.date, 19),
      categories: str(body.categories, 200),
      tags: str(body.tags, 200),
      cover: str(body.cover, 300),
      excerpt: str(body.excerpt, 300),
      content,
      status: body.status === 'published' ? 'published' : 'draft',
      publishedAt: str(body.publishedAt, 30)
    })
  }
  return Object.assign(base || {}, {
    title: str(body.title, 120),
    desc: str(body.desc, 300),
    date: /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : '',
    category: str(body.category, 20) || '未分类',
    url: safeUrl(body.url)
  })
}

// ---------- 图片上传 ----------
function saveImage (filename, dataUrl) {
  const m = String(dataUrl || '').match(/^data:([a-z/+.-]+);base64,([A-Za-z0-9+/=]+)$/i)
  if (!m) throw new Error('图片格式不正确')
  const mime = m[1].toLowerCase()
  const ext = ALLOWED_IMAGE[mime]
  if (!ext) throw new Error('只支持 jpg / png / webp / gif / avif')
  const buf = Buffer.from(m[2], 'base64')
  if (buf.length === 0) throw new Error('图片内容为空')
  if (buf.length > 8 * 1024 * 1024) throw new Error('图片超过 8MB')

  // 按魔数复核一次，别只信客户端声明的 mime
  const hex = buf.slice(0, 12).toString('hex').toLowerCase()
  const ok =
    (ext === 'jpg' && hex.startsWith('ffd8ff')) ||
    (ext === 'png' && hex.startsWith('89504e47')) ||
    (ext === 'gif' && hex.startsWith('474946')) ||
    (ext === 'webp' && hex.startsWith('52494646') && hex.slice(16, 24) === 'webp') ||
    (ext === 'avif' && hex.slice(8, 16) === '66747970')
  if (!ok) throw new Error('图片内容与格式不符')

  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16)
  const name = hash + '.' + ext
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf)
  // 返回公网路径：/uploads/ 是服务内部路径，外部要走 nginx 的 /content-img/
  return '/content-img/' + name
}

// ---------- Waline 联动 ----------
// 评论后台是独立应用（Waline），登录时用配置好的管理员账号换一个它的 token，
// 前端拿到后写进 sessionStorage.TOKEN，内嵌的 Waline 后台就直接是登录态了。
// 运行时可变：在后台改了 Waline 密码后，这里也要跟着变
const walineCred = { password: WALINE_PASSWORD }

function walineLogin () {
  if (!WALINE_API || !WALINE_EMAIL || !walineCred.password) return Promise.resolve(null)
  return fetch(WALINE_API + '/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: WALINE_EMAIL, password: walineCred.password, code: '' })
  }).then(function (r) { return r.json() }).then(function (j) {
    if (!j || j.errno !== 0 || !j.data || !j.data.token) return null
    return { token: j.data.token, name: j.data.display_name || '', avatar: j.data.avatar || '' }
  }).catch(function () { return null })
}

// ---------- 统计 ----------
// busuanzi 每请求一次就 +1，所以这里缓存 10 分钟，避免后台刷新把访问量刷上去
let bsCache = { t: 0, v: null }
function busuanziStats () {
  if (bsCache.v && Date.now() - bsCache.t < 10 * 60 * 1000) return Promise.resolve(bsCache.v)
  // busuanzi 会校验 Referer，缺了直接 400
  return fetch('https://busuanzi.ibruce.info/busuanzi?jsonpCallback=cb', {
    headers: { Referer: SITE_URL + '/', 'User-Agent': 'Mozilla/5.0 (compatible; content-service)' }
  })
    .then(function (r) {
      return r.text().then(function (txt) {
        if (!r.ok) {
          console.warn('[busuanzi] HTTP ' + r.status + ' body=' + String(txt).slice(0, 120))
          return null
        }
        // 响应长这样：try{cb({"site_uv":1,"page_pv":2});}catch(e){}
        // 注意不能用贪婪的 /\{[\s\S]*\}/，那样会把 try{ 和 catch(e){} 一起框进去
        const m = String(txt).match(/\(\s*(\{[\s\S]*?\})\s*\)/)
        if (!m) { console.warn('[busuanzi] 响应里没有 JSON: ' + String(txt).slice(0, 120)); return null }
        const j = JSON.parse(m[1])
        const v = { sitePv: j.site_pv, siteUv: j.site_uv }
        bsCache = { t: Date.now(), v }
        return v
      })
    })
    .catch(function (e) {
      console.warn('[busuanzi] 请求异常: ' + e.message + (e.cause ? ' (' + (e.cause.code || e.cause.message) + ')' : ''))
      return null
    })
}

// 评论总数（走 Waline 管理接口）
let cmCache = { t: 0, v: null }
function commentCount () {
  if (cmCache.v && Date.now() - cmCache.t < 5 * 60 * 1000) return Promise.resolve(cmCache.v)
  return walineLogin().then(function (w) {
    if (!w) return null
    // Waline 不返回评论总数，但 pageSize=1 时 totalPages 就等于总数
    return fetch(WALINE_API + '/api/comment?type=list&owner=all&page=1&pageSize=1', {
      headers: { Authorization: 'Bearer ' + w.token }
    }).then(function (r) { return r.json() }).then(function (j) {
      const d = j && j.data
      if (!d) return null
      const v = {
        total: typeof d.totalPages === 'number' ? d.totalPages : null,
        waiting: d.waitingCount != null ? d.waitingCount : null,
        spam: d.spamCount != null ? d.spamCount : null
      }
      cmCache = { t: Date.now(), v }
      return v
    })
  }).catch(function () { return null })
}

// 文章数：站点构建时会输出 /js/content-index.json，里面带全部文章
let artCache = { t: 0, v: null }
function articleCount () {
  if (artCache.v !== null && Date.now() - artCache.t < 30 * 60 * 1000) return Promise.resolve(artCache.v)
  return fetch(SITE_URL + '/js/content-index.json')
    .then(function (r) { return r.json() })
    .then(function (j) {
      const n = (j.items || []).filter(function (x) { return x.type === 'post' }).length
      artCache = { t: Date.now(), v: n }
      return n
    })
    .catch(function () { return null })
}

function imageStats () {
  try {
    const files = fs.readdirSync(UPLOAD_DIR)
    let bytes = 0
    files.forEach(function (f) { try { bytes += fs.statSync(path.join(UPLOAD_DIR, f)).size } catch (e) {} })
    return { count: files.length, bytes }
  } catch (e) { return { count: 0, bytes: 0 } }
}

// ---------- 路由 ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const p = decodeURIComponent(url.pathname)
  const method = req.method

  try {
    // 管理页
    if (method === 'GET' && (p === '/' || p === '/index.html')) {
      const html = fs.readFileSync(path.join(__dirname, 'admin.html'))
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
      return res.end(html)
    }

    // 公开读取
    const pub = p.match(/^\/api\/public\/(photos|shares|movies)$/)
    if (method === 'GET' && pub) {
      const items = readItems(pub[1])
      // 只读接口放开 CORS，方便本地预览（localhost:4000）直接读线上数据；
      // 写接口不放开，只在同源后台里用
      return send(res, 200, { items }, {
        'Cache-Control': 'public, max-age=30',
        'Access-Control-Allow-Origin': '*'
      })
    }

    // 已上传的图片
    const up = p.match(/^\/uploads\/([A-Za-z0-9._-]+)$/)
    if (method === 'GET' && up) {
      const file = path.join(UPLOAD_DIR, up[1])
      if (!fs.existsSync(file)) return send(res, 404, 'not found')
      const ext = path.extname(file).slice(1).toLowerCase()
      const type = Object.keys(ALLOWED_IMAGE).find(k => ALLOWED_IMAGE[k] === ext) || 'application/octet-stream'
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable', 'Access-Control-Allow-Origin': '*' })
      return fs.createReadStream(file).pipe(res)
    }

    // 登录
    if (method === 'POST' && p === '/api/login') {
      const ip = clientIp(req)
      if (tooManyFails(ip)) return send(res, 429, { error: '尝试次数过多，请 10 分钟后再试' })
      const body = await jsonBody(req)
      const authNow = currentAuth()
      if (!verifyPassword(body.password, authNow && authNow.passwordHash)) {
        noteFail(ip)
        return send(res, 401, { error: '密码不对' })
      }
      loginFails.delete(ip)
      const out = { token: sign(Date.now() + TOKEN_TTL_MS), ttl: TOKEN_TTL_MS }
      const w = await walineLogin()
      if (w) out.waline = w
      return send(res, 200, out)
    }

    // 以下都需要鉴权
    if (p.startsWith('/api/')) {
      if (!authed(req)) return send(res, 401, { error: '未登录或登录已过期' })

      // 统计面板数据
      if (method === 'GET' && p === '/api/stats') {
        const photos = readItems('photos')
        const shares = readItems('shares')
        const movies = readItems('movies')
        const drafts = readItems('drafts')
        const img = imageStats()
        const [visits, comments, articles] = await Promise.all([busuanziStats(), commentCount(), articleCount()])
        return send(res, 200, {
          visits,
          comments,
          articles,
          content: {
            photos: photos.length,
            shares: shares.length,
            movies: movies.length,
            drafts: drafts.filter(function (d) { return d.status !== 'published' }).length,
            published: drafts.filter(function (d) { return d.status === 'published' }).length
          },
          images: img
        })
      }

      // 修改 Waline（评论系统）账号的密码
      if (method === 'POST' && p === '/api/waline-password') {
        const body = await jsonBody(req)
        const np = String(body.newPassword || '')
        if (np.length < 8) return send(res, 400, { error: '新密码至少 8 位' })
        if (!np || np !== body.confirmPassword) return send(res, 400, { error: '两次输入的新密码不一致' })
        const w = await walineLogin()
        if (!w) return send(res, 400, { error: '拿不到 Waline 登录态，检查 WALINE_* 配置' })
        const r = await fetch(WALINE_API + '/api/user', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + w.token },
          body: JSON.stringify({ password: np })
        })
        const j = await r.json().catch(function () { return {} })
        if (!r.ok || j.errno !== 0) return send(res, 400, { error: j.errmsg || 'Waline 拒绝了这次修改' })
        // 密码变了，同步更新服务端存的凭据，否则下次登录换不到 token
        if (WALINE_PASSWORD) process.env.WALINE_PASSWORD = np
        walineCred.password = np
        return send(res, 200, { ok: true, note: '下次登录会自动用新密码换 token' })
      }

      // 当前账号信息
      if (method === 'GET' && p === '/api/account') {
        const a = currentAuth()
        return send(res, 200, {
          usesEnvPassword: !a,
          passwordChangedAt: a ? a.changedAt : null,
          walineEmail: WALINE_EMAIL || '',
          waline: !!WALINE_API
        })
      }

      // 改密码
      if (method === 'POST' && p === '/api/password') {
        const body = await jsonBody(req)
        const a = currentAuth()
        if (!verifyPassword(body.oldPassword, a && a.passwordHash)) {
          return send(res, 400, { error: '原密码不对' })
        }
        const np = String(body.newPassword || '')
        if (np.length < 8) return send(res, 400, { error: '新密码至少 8 位' })
        if (np === body.oldPassword) return send(res, 400, { error: '新密码不能和原密码相同' })
        writeAuth(hashPassword(np), clientIp(req))
        return send(res, 200, { ok: true })
      }

      if (method === 'POST' && p === '/api/upload') {
        const body = await jsonBody(req)
        return send(res, 200, { url: saveImage(body.filename, body.data) })
      }

      const item = p.match(/^\/api\/items\/(photos|shares|movies|drafts)(?:\/([A-Za-z0-9_]+))?$/)
      if (item) {
        const type = item[1]
        const id = item[2]
        let list = readItems(type)

        if (method === 'GET' && !id) return send(res, 200, { items: list })

        if (method === 'POST' && !id) {
          const body = await jsonBody(req)
          const rec = normalize(type, body, { id: newId({ photos: 'p', shares: 's', movies: 'm', drafts: 'd' }[type] || 'x'), created: new Date().toISOString() })
          if (!rec.title) return send(res, 400, { error: '标题不能为空' })
          list.unshift(rec)
          writeItems(type, list)
          return send(res, 200, { item: rec })
        }

        const idx = list.findIndex(x => x.id === id)
        if (idx < 0) return send(res, 404, { error: '找不到这条内容' })

        if (method === 'PUT') {
          const body = await jsonBody(req)
          const rec = normalize(type, body, list[idx])
          if (!rec.title) return send(res, 400, { error: '标题不能为空' })
          rec.updated = new Date().toISOString()
          list[idx] = rec
          writeItems(type, list)
          return send(res, 200, { item: rec })
        }

        if (method === 'DELETE') {
          list.splice(idx, 1)
          writeItems(type, list)
          return send(res, 200, { ok: true })
        }
      }
    }

    return send(res, 404, { error: 'not found' })
  } catch (e) {
    return send(res, 400, { error: e.message || '请求处理失败' })
  }
})

ensureDirs()
server.listen(PORT, '0.0.0.0', () => {
  console.log('[content-service] listening on ' + PORT + ', data dir = ' + DATA_DIR)
})