---
title: 博客使用指南
---

# 📖 博客使用指南

> 本文档记录本博客的所有操作流程，包括写作、构建、部署、版本管理和回档。

---

## 📂 目录结构概览

| 路径 | 说明 |
|------|------|
| source/_posts/ | **文章目录**，放 .md 文件 |
| source/about/ | 关于页面 |
| source/links/ | 友链页面 |
| source/comments/ | 留言板 |
| source/music/ | 音乐页面 |
| source/photos/ | 相册页面 |
| source/movies/ | 记忆片段（视频）页面 |
| source/shares/ | 灵感分享页面 |
| source/resume/ | 个人简历页面 |
| source/resources/ | 资源收藏页面 |
| source/_data/link.yml | 友链数据（9 个分类） |
| source/css/custom.css | 自定义样式 |
| source/js/ | 自定义 JS（每日一句、音乐播放器、访客地图、矩阵雨） |
| 	hemes/butterfly/ | Butterfly 主题文件 |
| _config.yml | Hexo 主配置 |
| _config.butterfly.yml | Butterfly 主题配置 |

---

## ✍️ 写文章

### 新建文章

在 source/_posts/ 下创建 .md 文件，格式如下：

`markdown
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
`

### Front-matter 字段说明

| 字段 | 必填 | 说明 |
|:----:|:----:|------|
| 	itle | 是 | 文章标题 |
| date | 是 | 发布日期 |
| 	ags | 否 | 标签列表 |
| categories | 否 | 分类 |
| cover | 否 | 封面图路径 |

### 图片资源

文章配图放到 source/img/posts/文章标题/ 目录下，Markdown 中用 /img/posts/文章标题/xxx.jpg 引用。

---

## 🚀 构建与部署

### 本地预览

`ash
hexo clean       # 清理缓存
hexo generate    # 生成静态文件
hexo server      # 启动本地服务，访问 http://localhost:4000
`

### 部署到线上

`ash
hexo deploy
`

推送到 Wolf66660724.github.io 的 main 分支，更新网站 worldpeace.top。

---

## 🔄 版本控制（回档）

> 源码用 Git 管理在 source 分支，部署文件在 main 分支。

### 日常提交

`ash
git add -A
git commit -m "feat: 新增文章《xxx》"
git tag v1.2      # 打标签
git push origin main:source --tags  # 推送源码+标签
`

### 回档

`ash
git log --oneline --decorate --tags      # 查看历史
git checkout tags/v1.2  # 切换到指定版本                        # 回到初始版本
git checkout -b hotfix v1.0              # 从旧版本创建分支修改
`

### 标签一览

| 标签 | 说明 |
|:----:|------|
| 1.0 | 初始版本，博客基础框架 |
| 1.1 | 功能补全：内容填充、视觉增强、版本控制、SEO |
| 1.1.1 | 新增 USAGE.md 使用文档 |

---

## ⚙️ 常用配置修改

### 社交链接

编辑 _config.butterfly.yml 中 social: 区块。

### 友链

编辑 source/_data/link.yml。

### 页脚

编辑 _config.butterfly.yml 中 ooter: 区块。

### 添加新页面

1. source/ 下新建文件夹和 index.md
2. _config.butterfly.yml 的 menu: 中添加导航入口
3. 构建验证

---

## 🧩 自定义功能一览

| 功能 | 文件 | 说明 |
|------|------|------|
| 每日一句 | source/js/daily-quote.js | 侧栏公告模块 |
| 悬浮音乐播放器 | source/js/music-player.js + source/css/music-player.css | 右下角浮动，可拖拽 |
| 访客地理位置 | source/js/visitor-map.js | 展示访客位置 |
| 简历矩阵雨 | source/js/matrix-rain.js | /resume/ 页面 Matrix 特效 |
| 自定义卡片样式 | source/css/custom.css | 渐变色、悬停动效、滚动条 |

---

## 🔍 其他功能

- 搜索：右下角搜索图标，本地全文搜索
- 明暗主题：右下角切换
- 繁简体转换：右下角「繁」按钮
- 阅读模式：右下角书本图标
- 文章分享：文章底部
- 打赏：微信 + 支付宝
- 评论：Twikoo（Vercel 部署）
- RSS：/atom.xml
- 站点地图：/sitemap.xml

---

> 最后更新：2026-07-21
