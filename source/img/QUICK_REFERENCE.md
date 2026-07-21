# 图片路径快速参考指南

本文档提供了所有模块图片路径的快速参考。

## 📋 路径速查表

| 模块 | 路径格式 | 示例 |
|------|---------|------|
| **页面背景** | `/img/pages/{模块}-bg.jpg` | `/img/pages/about-bg.jpg` |
| **文章封面** | `/img/posts/{文章标题}/cover.jpg` | `/img/posts/我的文章/cover.jpg` |
| **文章内容图** | `/img/posts/{文章标题}/{图片名}` | `/img/posts/我的文章/image1.jpg` |
| **相册图片** | `/img/photos/{年}/{月}/{图片名}` | `/img/photos/2025/11/photo1.jpg` |
| **视频缩略图** | `/img/movies/thumbnails/{视频名}.jpg` | `/img/movies/thumbnails/video1.jpg` |
| **音乐封面** | `/img/music/covers/{歌曲名}.jpg` | `/img/music/covers/song1.jpg` |
| **标签背景** | `/img/tags/{标签名}.jpg` | `/img/tags/技术.jpg` |
| **分类背景** | `/img/categories/{分类名}.jpg` | `/img/categories/技术分享.jpg` |
| **友链头像** | `/img/links/{友链名}-avatar.jpg` | `/img/links/example-avatar.jpg` |
| **网站图标** | `/img/common/favicon.png` | `/img/common/favicon.png` |
| **用户头像** | `/img/common/avatar.jpg` | `/img/common/avatar.jpg` |
| **错误图片** | `/img/common/404.jpg` | `/img/common/404.jpg` |

## 🎯 常用场景

### 1. 新建文章并添加图片

```yaml
# source/_posts/新文章.md
---
title: 新文章
date: 2025-11-20
cover: /img/posts/新文章/cover.jpg
---

![图片](/img/posts/新文章/image1.jpg)
```

**文件夹结构：**
```
source/img/posts/新文章/
├── cover.jpg
└── image1.jpg
```

### 2. 设置页面背景

```yaml
# source/about/index.md
---
title: 关于我
type: "about"
top_img: /img/pages/about-bg.jpg
---
```

### 3. 配置标签背景

```yaml
# _config.butterfly.yml
tag_per_img:
  - 技术: /img/tags/技术.jpg
  - 生活: /img/tags/生活.jpg
```

### 4. 配置分类背景

```yaml
# _config.butterfly.yml
category_per_img:
  - 技术分享: /img/categories/技术分享.jpg
  - 生活随笔: /img/categories/生活随笔.jpg
```

### 5. 添加友链

```yaml
# source/_data/link.yml
- name: 示例网站
  link: https://example.com
  avatar: /img/links/example-avatar.jpg
  descr: 网站描述
```

### 6. 添加音乐

```yaml
# 音乐播放器配置
- name: 歌曲名称
  artist: 艺术家
  url: /music/songs/song.mp3
  cover: /img/music/covers/song-cover.jpg
```

## 📁 完整文件夹结构

```
source/img/
├── pages/              # 页面背景图
│   ├── home-bg.jpg
│   ├── about-bg.jpg
│   └── ...
├── posts/              # 文章图片
│   ├── {文章标题}/
│   │   ├── cover.jpg
│   │   └── ...
├── photos/             # 相册图片
│   └── {年}/{月}/
├── movies/             # 电影相关
│   └── thumbnails/
├── music/              # 音乐相关
│   └── covers/
├── tags/               # 标签背景
├── categories/         # 分类背景
├── links/              # 友链头像
├── common/             # 通用资源
│   ├── favicon.png
│   ├── avatar.jpg
│   └── ...
└── resources/          # 其他资源
```

## ⚙️ 配置文件位置

| 配置项 | 配置文件 | 说明 |
|--------|---------|------|
| `index_img` | `_config.butterfly.yml` | 首页背景 |
| `archive_img` | `_config.butterfly.yml` | 归档页面背景 |
| `tag_img` | `_config.butterfly.yml` | 标签页面背景 |
| `tag_per_img` | `_config.butterfly.yml` | 单个标签背景 |
| `category_img` | `_config.butterfly.yml` | 分类页面背景 |
| `category_per_img` | `_config.butterfly.yml` | 单个分类背景 |
| `favicon` | `_config.butterfly.yml` | 网站图标 |
| `avatar` | `_config.butterfly.yml` | 用户头像 |
| `cover` | 文章 front-matter | 文章封面 |
| `top_img` | 页面 front-matter | 页面顶部背景 |
| `avatar` | `source/_data/link.yml` | 友链头像 |

## 🔗 相关文档

- [完整规范文档](./README.md) - 详细的图片管理规范
- [文章图片说明](./posts/README.md) - 文章图片使用指南
- [页面背景说明](./pages/README.md) - 页面背景图使用指南
- [标签图片说明](./tags/README.md) - 标签背景图使用指南
- [分类图片说明](./categories/README.md) - 分类背景图使用指南
- [通用资源说明](./common/README.md) - 通用图片资源说明
- [音乐封面说明](./music/covers/README.md) - 音乐封面图使用指南

