# 内容服务（拾光集 / 灵感集 / 帧藏 后台）

给博客加的一个轻量内容后台。在网页上填表就能增删「拾光集」的照片、「灵感集」的条目
和「帧藏」的视频，不用改代码、不用重新构建部署。

## 用起来是怎样的

1. 打开 https://worldpeace.top/manage/
2. 输入管理密码登录
3. 选「📸 拾光集」「✨ 灵感集」或「🎬 帧藏」→ 点「+ 新增」→ 填表 → 保存
4. 刷新 https://worldpeace.top/photos/ 、/shares/ 或 /movies/ 就能看到

照片支持拖拽上传图片（jpg / png / webp / gif / avif，单张 ≤ 8MB）。
灵感集支持填分类、日期、标题、描述、外链。

## 结构

| 文件 | 作用 |
| --- | --- |
| `server.js` | 服务本体。零 npm 依赖，只用 Node 内置模块 |
| `admin.html` | 管理页（单文件，含样式和逻辑） |
| `Dockerfile` | 镜像定义（node:22-alpine） |
| `seed.json` | 初始数据，第一次部署时导入 |

## 数据放在哪

服务器上 `/opt/security-platform/content-data/`：

```
photos.json     拾光集数据
shares.json     灵感集数据
movies.json     帧藏数据
uploads/        上传的图片（按内容哈希命名，同图不会重复占空间）
```

写入用「临时文件 + rename」，避免写一半断电导致 JSON 损坏。

## 接口

公开（只读，允许跨域，博客前端用）：

```
GET /content-api/photos       # nginx → /api/public/photos
GET /content-api/shares
GET /content-api/movies
GET /content-img/<file>       # nginx → /uploads/<file>
```

后台（需要 `Authorization: Bearer <token>`）：

```
POST   /manage/api/login                  {"password":"..."} → {token}
GET    /manage/api/items/photos|shares|movies
POST   /manage/api/items/photos|shares|movies
PUT    /manage/api/items/photos|shares|movies/<id>
DELETE /manage/api/items/photos|shares|movies/<id>
POST   /manage/api/upload                 {"filename":"x.jpg","data":"data:image/jpeg;base64,..."}
```

## 安全措施

- 密码登录；token 用 HMAC 签名、7 天过期，服务端不存会话
- 登录失败限流：同一 IP 10 分钟内失败 8 次后拒绝
- 上传校验 MIME + 文件魔数，只允许 5 种图片格式
- 上传文件名按内容哈希生成，不接受客户端指定的路径
- 字段全部做长度截断和 URL 协议白名单，避免被注入奇怪内容
- 写接口不开 CORS，只能从同源后台调用
- 容器 `no-new-privileges`，内存 200m / CPU 0.3 限额

## 重新部署

改完 `server.js` 或 `admin.html` 之后：

```powershell
# 上传 + 重建镜像 + 重启容器
scp -i $key deploy/content-service/server.js `
    deploy/content-service/admin.html `
    deploy/content-service/Dockerfile `
    ubuntu@43.153.19.168:/opt/security-platform/content-service/

ssh -i $key ubuntu@43.153.19.168 `
  "cd /opt/security-platform/content-service && sudo docker build -t content-service:1.0 . && cd /opt/security-platform && sudo docker compose up -d content-service"
```

## 两个坑（部署时踩过）

1. **改 nginx 配置不能用 `mv`。** `blog.conf` 是**按文件**挂载进容器的，
   `mv` 会换掉 inode，容器里的还是旧文件。要么 `cat 新文件 > 老文件`，要么改完
   重启 `blog-nginx` 容器让它重新解析挂载。
2. **密码和 token 密钥在 `compose.yaml` 的 `content-service.environment` 里**，
   改完要 `docker compose up -d content-service` 才会生效。

## 备份

数据都在 `/opt/security-platform/content-data/`，直接打包这个目录即可：

```bash
sudo tar czf ~/content-data-$(date +%F).tar.gz -C /opt/security-platform content-data
```

---

## 帧藏（视频）

字段：标题、描述、日期、图标、标签、视频地址、封面图。

- **视频地址**填站内 mp4/webm（如 `/movies/videos/xxx.mp4`）时，卡片里直接内嵌播放；
  填 B站 / YouTube 这类外链时，整块封面可点击跳转，并显示 ▶ 角标。
- **封面图**可留空。留空时卡片显示图标占位；本地视频用封面当 `poster`。
- 视频文件放在 `source/movies/videos/`，`*.mp4` / `*.ts` 已在 `.gitignore` 里，
  不会进公开仓库，但构建时会上传到服务器。
- 页面靠 `source/js/collection.js` 读 `GET /content-api/movies` 渲染，
  容器是 `source/movies/index.md` 里的 `<div class="video-grid" id="video-grid">`。

> 封面字段走的是和照片同一套上传接口（`/manage/api/upload`），服务端只接受
> `/content-img/...`、`/img/...` 或 `http(s)://` 三种形式；视频地址只接受
> `/movies/videos/...` 或 `http(s)://`，避免被塞进 `javascript:` 之类的协议。

## 后记：文章管理（方案 C）与统计

### 文章管理

后台的「文章」标签用来写文章草稿，**保存后不会自动上线**——这是刻意的：
Hexo 是静态站，文章要经过构建，而且这样文章仍然进 git、可回档。

1. 在 `/manage/` → 「文章」→「新增」，填标题/日期/分类/标签/封面/摘要/正文
   正文支持 Markdown，带工具栏和实时预览
2. 保存后是一条草稿，存在服务器上
3. 本地执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\publish-drafts.ps1          # 只写文件，先本地预览
powershell -ExecutionPolicy Bypass -File .\publish-drafts.ps1 -Deploy  # 写文件 + 部署上线
```

脚本会登录后台、把草稿写成 `source/_posts/<标题>.md`（带 front-matter），
再把草稿标记为已发布。密码存在 `tools\.admin-password.txt`（已 gitignore）。

### 统计面板

「统计」标签显示：

| 指标 | 来源 |
| --- | --- |
| 总访问量 / 总访客 | busuanzi（服务端缓存 10 分钟） |
| 文章数 | 站点构建输出的 `/js/content-index.json` |
| 评论 / 待审核 | Waline 管理接口（缓存 5 分钟） |
| 照片 / 灵感 / 草稿 | 本地数据文件 |
| 上传图片数 / 占用空间 | 扫描 uploads 目录 |

两个坑：
1. **busuanzi 必须要 Referer 头**，缺了直接 400。
2. 它的响应是 `try{cb({"site_uv":1,...});}catch(e){}`，
   用贪婪的 `/\{[\s\S]*\}/` 会把 `try{` 和 `catch(e){}` 一起框进去导致 JSON.parse 失败，
   要用 `/\(\s*(\{[\s\S]*?\})\s*\)/` 精确取回调里的对象。

### 改密码

「设置」里有两种：

- **后台登录密码**：scrypt 加盐哈希存 `content-data/auth.json`，改完立刻生效
- **评论账号密码**：代理到 Waline 的 `PUT /api/user`，改完服务端会同步更新内存里的凭据