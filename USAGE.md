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
| tags | 否 | 标签列表 |
| categories | 否 | 分类 |
| cover | 否 | 封面图路径 |

### 图片资源

文章配图放到 source/img/posts/文章标题/ 目录下，Markdown 中用 /img/posts/文章标题/xxx.jpg 引用。

---

## 🚀 构建与部署

### 本地预览

```bash
hexo clean       # 清理缓存
hexo generate    # 生成静态文件
hexo server      # 启动本地服务，访问 http://localhost:4000
```

### 部署到线上

站点部署在自建服务器（腾讯云 43.153.19.168，Docker + Nginx），**不再使用 GitHub Pages**。

```powershell
# 一键构建 + 上传 + 发布（推荐）
powershell -ExecutionPolicy Bypass -File .\deploy.ps1

# 跳过构建，直接发布现有 public 目录
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -SkipBuild
```

部署流程：

1. 本地执行 hexo generate，生成静态文件到 public/
2. 打包并上传到服务器 /tmp/
3. 服务器端先把当前线上版本备份到 /opt/security-platform/backups/
4. 清空静态目录（保留 .well-known）并解压新版本
5. 校验 https://worldpeace.top/ 返回状态

> hexo deploy 已停用（_config.yml 中 deploy.type 为空）。

### 服务器端结构

| 路径 | 说明 |
|------|------|
| /opt/security-platform/blog-public | nginx 静态根目录（容器挂载，只读） |
| /opt/security-platform/blog-source | 服务器上的源码克隆 |
| /opt/security-platform/backups | 每次部署前的自动备份 |
| /opt/security-platform/nginx/conf.d/blog.conf | nginx 站点配置 |

---

## 🔄 版本控制（回档）

> 源码用 Git 管理并推送到 GitHub 的 source 分支；线上静态文件由部署脚本管理，每次部署前自动备份。

### 日常提交

```bash
git add -A
git commit -m "feat: 新增文章《xxx》"
git tag v1.3                          # 打标签
git push origin main:source --tags    # 推送源码 + 标签到 GitHub
```

### 回档方式一：源码版本（Git）

```bash
git log --oneline --decorate --tags                     # 查看历史
git checkout tags/v1.3                                  # 切换到指定版本
powershell -ExecutionPolicy Bypass -File .\deploy.ps1   # 重新发布该版本
```

### 回档方式二：线上静态文件（服务器备份）

```powershell
# 查看服务器上的历史备份
powershell -ExecutionPolicy Bypass -File .\rollback.ps1 -List

# 回滚到指定备份（回滚前会自动备份当前线上版本）
powershell -ExecutionPolicy Bypass -File .\rollback.ps1 -Restore blog-2026-09-17-213000.tar.gz
```

### 标签一览

| 标签 | 说明 |
|:----:|------|
| v1.0 | 初始版本，博客基础框架 |
| v1.1 | 功能补全：内容填充、视觉增强、版本控制、SEO |
| v1.1.1 | 新增 USAGE.md 使用文档 |
| v1.2 | 页面标题左对齐楷体、修复明暗切换动画、新博文与排版美化 |
| v1.3 | 部署迁移到自建服务器，新增 deploy.ps1 / rollback.ps1 |
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
