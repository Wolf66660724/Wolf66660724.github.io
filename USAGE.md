---
title: 博客使用指南
---

# 📖 博客使用指南

> 本文档记录本博客的所有操作流程，包括写作、构建、部署、版本管理和回档。

---

## 📂 目录结构概览

| 路径 | 说明 |
|------|------|
| `source/_posts/` | **文章目录**，放 `.md` 文件 |
| `source/about/` | 关于页面 |
| `source/links/` | 友链页面 |
| `source/comments/` | 留言板 |
| `source/music/` | 音乐页面 |
| `source/photos/` | 相册页面 |
| `source/movies/` | 记忆片段（视频）页面 |
| `source/shares/` | 灵感分享页面 |
| `source/resume/` | 个人简历页面 |
| `source/resources/` | 资源收藏页面 |
| `source/_data/link.yml` | 友链数据（9 个分类） |
| `source/css/custom.css` | 自定义样式 |
| `source/js/` | 自定义 JS（每日一句、音乐播放器、访客地图、矩阵雨） |
| `themes/butterfly/` | Butterfly 主题文件 |
| `_config.yml` | Hexo 主配置 |
| `_config.butterfly.yml` | Butterfly 主题配置 |

---

## ✍️ 写文章

### 新建文章

在 `source/_posts/` 下创建 `.md` 文件，格式如下：

```markdown
---
title: 文章标题
date: 2026-07-21 20:00:00
tags:
  - 标签1
  - 标签2
categories:
  - 分类名
cover: /img/posts/文章目录/cover.jpg
---

文章正文内容...
```

### Front-matter 字段说明

| 字段 | 必填 | 说明 |
|:----:|:----:|------|
| `title` | 是 | 文章标题 |
| `date` | 是 | 发布日期，格式 `YYYY-MM-DD HH:mm:ss` |
| `tags` | 否 | 标签列表，用于归类 |
| `categories` | 否 | 分类，可以只写一个 |
| `cover` | 否 | 封面图路径 |

### 图片资源

文章配图放到 `source/img/posts/文章标题/` 目录下，然后在 Markdown 中用 `/img/posts/文章标题/xxx.jpg` 引用。

---

## 🚀 构建与部署

### 本地预览

```bash
npx hexo clean       # 清理缓存
npx hexo generate    # 生成静态文件
npx hexo server      # 启动本地服务，访问 http://localhost:4000
```

### 部署到线上

```bash
npx hexo deploy
```

这会将 `public/` 目录推送到 `Wolf66660724/Wolf66660724.github.io` 仓库的 `main` 分支，自动更新网站 `worldpeace.top`。

---

## 🔄 版本控制（回档）

> 博客源码用 Git 管理，部署的 `main` 分支和源码 `source` 分支互不干扰。

### 日常提交

```bash
git add -A
git commit -m "feat: 新增文章《xxx》"
git tag v1.2          # 每次改动打一个标签
git push origin source --tags    # 推送源码到远程
```

### 查看历史版本

```bash
git log --oneline --decorate --tags
```

### 回档到某个版本

```bash
# 回到 v1.0（初始版本）
git checkout v1.0

# 回到 v1.1（当前功能补全版本）
git checkout v1.1

# 回档后如需继续修改，创建新分支：
git checkout -b hotfix v1.0
```

### 当前标签一览

| 标签 | 说明 |
|:----:|------|
| `v1.0` | 初始版本，博客基础框架 |
| `v1.1` | 功能补全：内容填充、视觉增强、版本控制、SEO |

---

## ⚙️ 常用配置修改

### 修改社交链接

编辑 `_config.butterfly.yml` 中的 `social:` 区块：

```yaml
social:
  fab fa-github: https://github.com/用户名 || Github
  fa fa-book-open: https://blog.csdn.net/用户名 || CSDN
  fas fa-rss: /atom.xml || RSS || '#ff8c00'
```

### 修改友链

编辑 `source/_data/link.yml`，按已有格式添加即可。

### 修改页脚信息

编辑 `_config.butterfly.yml` 中的 `footer:` 区块。

### 添加页面

1. 在 `source/` 下新建文件夹和 `index.md`
2. 在 `_config.butterfly.yml` 的 `menu:` 中添加导航入口
3. 构建验证

---

## 🧩 自定义功能一览

| 功能 | 文件 | 说明 |
|------|------|------|
| 每日一句 | `source/js/daily-quote.js` | 侧栏公告模块，随机展示名言 |
| 悬浮音乐播放器 | `source/js/music-player.js` + `source/css/music-player.css` | 右下角浮动，支持拖拽，3 首歌 |
| 访客地理位置 | `source/js/visitor-map.js` | 通过 ipify + ipapi 展示访客位置 |
| 简历矩阵雨 | `source/js/matrix-rain.js` | 只在 `/resume/` 页面生效的 Matrix 特效 |
| 自定义卡片样式 | `source/css/custom.css` | 侧栏各模块渐变色、悬停动效、滚动条等 |

---

## 🔍 其他功能

- **搜索**：页面右下角搜索图标，支持本地全文搜索
- **明暗主题**：右下角切换按钮
- **繁简体转换**：右下角「繁」按钮
- **阅读模式**：右下角书本图标，去除干扰只看正文
- **文章分享**：文章底部分享按钮
- **打赏**：文章末尾打赏弹窗（微信 + 支付宝）
- **评论**：Twikoo 评论系统（Vercel 部署）
- **RSS 订阅**：`/atom.xml` 或 `/rss2.xml`
- **站点地图**：`/sitemap.xml`

---

> 最后更新：2026-07-21
