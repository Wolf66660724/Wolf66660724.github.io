'use strict'

/**
 * 「博文」页的时间轴 + 筛选（构建时渲染成静态 HTML）
 *
 * 用法：在页面 markdown 里写 {% blog_timeline %}
 *
 * 为什么在构建时渲染而不是前端拉 JSON：
 *   - 文章列表直接进 HTML，搜索引擎和禁用 JS 的情况都能看到内容
 *   - 前端脚本只负责「点筛选按钮时显示/隐藏」，逻辑极简、不容易出问题
 */

function esc (s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripHtml (html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

hexo.extend.tag.register('blog_timeline', function () {
  const posts = hexo.locals.get('posts').sort('-date')

  // 注意：tag 回调里的 this 没有 url_for，这里按站点根路径自己拼
  const root = (hexo.config.root || '/').replace(/\/+$/, '')
  const urlFor = p => {
    const s = String(p == null ? '' : p)
    if (/^(https?:)?\/\//.test(s)) return s
    return root + '/' + s.replace(/^\//, '')
  }

  // ---- 统计分类 / 标签 ----
  const catMap = new Map()
  const tagMap = new Map()

  posts.forEach(post => {
    const cats = post.categories ? post.categories.toArray() : []
    cats.forEach(c => catMap.set(c.name, (catMap.get(c.name) || 0) + 1))
    const tags = post.tags ? post.tags.toArray() : []
    tags.forEach(t => tagMap.set(t.name, (tagMap.get(t.name) || 0) + 1))
  })

  const sortDesc = (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh')

  const catChips = [...catMap.entries()].sort(sortDesc)
    .map(([name, n]) => `<button class="blog-chip" data-filter="category" data-value="${esc(name)}">${esc(name)}<em>${n}</em></button>`)
    .join('')

  const tagChips = [...tagMap.entries()].sort(sortDesc)
    .map(([name, n]) => `<button class="blog-chip" data-filter="tag" data-value="${esc(name)}">${esc(name)}<em>${n}</em></button>`)
    .join('')

  // ---- 按年 / 月分组 ----
  const years = new Map()
  posts.forEach(post => {
    const y = post.date.format('YYYY')
    const m = post.date.format('MM')
    if (!years.has(y)) years.set(y, new Map())
    const months = years.get(y)
    if (!months.has(m)) months.set(m, [])
    months.get(m).push(post)
  })

  const blocks = []
  for (const [year, months] of years) {
    const monthBlocks = []
    for (const [month, list] of months) {
      const items = list.map(post => {
        const cats = (post.categories ? post.categories.toArray() : []).map(c => c.name)
        const tags = (post.tags ? post.tags.toArray() : []).map(t => t.name)
        const cover = post.cover || ''
        const raw = post.description || stripHtml(post.excerpt || post.content || '').slice(0, 90)

        const catHtml = cats.length
          ? `<span class="blog-item-cats">${cats.map(c => `<a href="${urlFor('/categories/' + c + '/')}">${esc(c)}</a>`).join('')}</span>`
          : ''
        const tagHtml = tags.length
          ? `<span class="blog-item-tags">${tags.map(t => `<a href="${urlFor('/tags/' + t + '/')}">#${esc(t)}</a>`).join('')}</span>`
          : ''

        return `<article class="blog-item" data-categories="${esc(cats.join(','))}" data-tags="${esc(tags.join(','))}">
  ${cover ? `<a class="blog-item-cover" href="${urlFor(post.path)}" style="background-image:url('${esc(cover)}')"></a>` : ''}
  <div class="blog-item-body">
    <a class="blog-item-title" href="${urlFor(post.path)}">${esc(post.title)}</a>
    <div class="blog-item-meta">
      <time class="blog-item-date">${post.date.format('YYYY-MM-DD')}</time>
      ${catHtml}${tagHtml}
    </div>
    ${raw ? `<p class="blog-item-excerpt">${esc(raw)}${raw.length >= 90 ? '…' : ''}</p>` : ''}
  </div>
</article>`
      }).join('\n')

      monthBlocks.push(`<section class="blog-month">
  <h3 class="blog-month-title"><span>${month}</span> 月</h3>
  <div class="blog-month-items">${items}</div>
</section>`)
    }

    blocks.push(`<section class="blog-year">
  <h2 class="blog-year-title">${year}</h2>
  ${monthBlocks.join('\n')}
</section>`)
  }

  return `<div class="blog-page" id="blog-page">
  <div class="blog-filters">
    <div class="blog-filter-row">
      <span class="blog-filter-label">分类</span>
      <button class="blog-chip is-active" data-filter="all" data-value="">全部<em>${posts.length}</em></button>${catChips}
    </div>
    <div class="blog-filter-row">
      <span class="blog-filter-label">标签</span>
      ${tagChips || '<span class="blog-filter-none">还没有标签</span>'}
    </div>
    <div class="blog-filter-status" id="blog-filter-status">共 ${posts.length} 篇</div>
  </div>
  <div class="blog-timeline">${blocks.join('\n')}</div>
  <div class="blog-empty" id="blog-empty" hidden>没有符合条件的文章</div>
</div>`
})