'use strict'

/**
 * 日历用的内容索引（构建时生成，输出 /js/content-index.json）
 *
 * 数据来源：
 *   1. 文章  —— site.posts（结构化，最可靠）
 *   2. 灵感集 / 拾光集 / 帧藏 —— 解析对应页面源码里的日期标签：
 *        <span class="share-date">2025-11-15</span>
 *        <span class="photo-date">2025-11-15</span>
 *        <span class="video-date">2025-11-15</span>
 *      值为「待添加 / 待上传」这类非日期文本时自动跳过，
 *      以后你把日期填上，日历上就会自动出现，不用改代码。
 */

const fs = require('fs')
const path = require('path')

const SECTIONS = [
  { dir: 'shares', type: 'share', label: '灵感集', icon: '✨', block: /<article class="share-card">/g, dateClass: 'share-date', titleTag: 'h3', url: '/shares/' },
  { dir: 'photos', type: 'photo', label: '拾光集', icon: '📸', block: /<div class="photo-card">/g, dateClass: 'photo-date', titleTag: 'h4', url: '/photos/' },
  { dir: 'movies', type: 'movie', label: '帧藏', icon: '🎬', block: /<div class="video-item/g, dateClass: 'video-date', titleTag: 'h4', url: '/movies/' }
]

function stripTags (s) {
  return String(s || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

function parseSection (baseDir, sec) {
  const file = path.join(baseDir, 'source', sec.dir, 'index.md')
  if (!fs.existsSync(file)) return []
  const raw = fs.readFileSync(file, 'utf8')

  // 按卡片容器切块
  const parts = raw.split(sec.block).slice(1)
  const out = []

  parts.forEach(block => {
    const dateMatch = block.match(new RegExp('<span class="' + sec.dateClass + '">([^<]*)</span>'))
    if (!dateMatch) return
    const dateText = stripTags(dateMatch[1])
    const m = dateText.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
    if (!m) return                                   // 「待添加」「待上传」直接跳过
    const date = m[1] + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[3]).padStart(2, '0')

    const titleMatch = block.match(new RegExp('<' + sec.titleTag + '[^>]*>([\\s\\S]*?)</' + sec.titleTag + '>'))
    const title = titleMatch ? stripTags(titleMatch[1]) : sec.label

    const hrefMatch = block.match(/<a\s[^>]*href="([^"]+)"/)
    let url = sec.url
    if (hrefMatch && hrefMatch[1] && hrefMatch[1] !== '#' && !/^https?:/.test(hrefMatch[1])) {
      url = hrefMatch[1]
    } else if (hrefMatch && /^https?:/.test(hrefMatch[1])) {
      url = hrefMatch[1]                                // 站外链接保留
    }

    out.push({
      date,
      type: sec.type,
      icon: sec.icon,
      label: sec.label,
      title,
      url
    })
  })

  return out
}

hexo.extend.generator.register('calendar-index', function (locals) {
  const items = []

  locals.posts.sort('-date').forEach(post => {
    items.push({
      date: post.date.format('YYYY-MM-DD'),
      type: 'post',
      icon: '📝',
      label: '文章',
      title: post.title,
      url: post.path || '/'
    })
  })

  const baseDir = hexo.base_dir
  SECTIONS.forEach(sec => {
    try { items.push(...parseSection(baseDir, sec)) } catch (e) { /* 解析失败不影响构建 */ }
  })

  // 按日期倒序，方便前端直接取最近一条
  items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  return [{
    path: 'js/content-index.json',
    data: JSON.stringify({ generated: new Date().toISOString(), total: items.length, items })
  }]
})