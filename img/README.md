# 图片资源管理规范

本文档说明了博客中图片资源的文件夹结构和引用路径规范。

## 📁 文件夹结构

```
source/img/
├── pages/              # 页面背景图
│   ├── home-bg.jpg    # 首页背景
│   ├── about-bg.jpg   # 关于页面背景
│   ├── categories-bg.jpg
│   ├── tags-bg.jpg
│   ├── archive-bg.jpg
│   ├── photos-bg.jpg
│   ├── movies-bg.jpg
│   ├── links-bg.jpg
│   ├── comments-bg.jpg
│   ├── resume-bg.jpg
│   └── default-bg.jpg  # 默认背景
│
├── posts/              # 文章图片
│   ├── {文章标题1}/   # 按文章标题组织
│   │   ├── cover.jpg  # 文章封面图（用于归档页面显示）
│   │   ├── image1.jpg # 文章内容图片
│   │   └── image2.png
│   └── {文章标题2}/
│       └── ...
│
├── photos/             # 相册图片
│   ├── 2025/
│   │   ├── 01/
│   │   └── 02/
│   └── ...
│
├── movies/             # 电影相关图片
│   └── thumbnails/    # 视频缩略图
│       └── ...
│
├── music/              # 音乐相关图片
│   └── covers/        # 音乐封面图
│       └── ...
│
├── tags/               # 标签页面图片
│   ├── {标签名1}.jpg  # 单个标签的背景图
│   └── {标签名2}.jpg
│
├── categories/         # 分类页面图片
│   ├── {分类名1}.jpg  # 单个分类的背景图
│   └── {分类名2}.jpg
│
├── links/              # 友链相关图片
│   ├── {友链名}-avatar.jpg  # 友链头像
│   └── ...
│
├── common/             # 通用图片资源
│   ├── favicon.png     # 网站图标
│   ├── avatar.jpg      # 用户头像
│   ├── 404.jpg         # 404错误图片
│   ├── friend_404.gif  # 友链404图片
│   └── error-page.png  # 错误页面背景
│
└── resources/          # 其他资源图片
    └── ...
```

## 📝 引用路径规范

### 1. 页面背景图

**路径格式：** `/img/pages/{模块名}-bg.jpg`

**示例：**
```yaml
# 在页面 front-matter 中
top_img: /img/pages/about-bg.jpg
```

**可用模块：**
- `home` - 首页
- `about` - 关于页面
- `categories` - 分类页面
- `tags` - 标签页面
- `archive` - 归档页面背景
- `photos` - 相册页面
- `movies` - 电影页面
- `links` - 友链页面
- `comments` - 评论页面
- `resume` - 简历页面
- `default` - 默认背景

### 2. 文章封面图（Cover）

**路径格式：** `/img/posts/{文章标题}/cover.jpg`

**用途：** 用于归档页面显示文章缩略图，以及首页文章卡片显示

**示例：**
```yaml
---
title: 我的文章标题
date: 2025-11-20
cover: /img/posts/我的文章标题/cover.jpg
# 或者使用颜色
# cover: '#49B1F5'
---
```

**建议：**
- 封面图建议尺寸：1200x600 像素（2:1 比例）
- 推荐使用 `.jpg` 格式以减小文件大小
- 如果不想显示封面图，设置 `cover: false`

### 3. 文章内容图片

**路径格式：** `/img/posts/{文章标题}/{图片文件名}`

**示例：**
```markdown
![图片描述](/img/posts/记录生活的开始/example.jpg)
```

**建议：**
- 每篇文章的图片放在以文章标题命名的文件夹中
- 图片文件名使用小写字母、数字和连字符，避免空格和特殊字符
- 推荐使用 `.jpg`、`.png` 或 `.webp` 格式
- 建议压缩图片以提升加载速度
- 封面图命名为 `cover.jpg`，其他内容图片使用描述性名称

### 4. 相册图片

**路径格式：** `/img/photos/{年份}/{月份}/{图片文件名}`

**示例：**
```html
<img src="/img/photos/2025/11/photo1.jpg" alt="照片描述" loading="lazy">
```

**建议：**
- 按年份和月份组织照片
- 使用懒加载 (`loading="lazy"`) 提升性能
- 建议为每张照片添加描述性的文件名

### 5. 电影/视频缩略图

**路径格式：** `/img/movies/thumbnails/{视频文件名}.jpg`

**示例：**
```html
<img src="/img/movies/thumbnails/video1.jpg" alt="视频缩略图">
```

**注意：**
- 视频文件本身仍放在 `source/movies/videos/` 目录
- 缩略图统一放在 `img/movies/thumbnails/` 目录

### 6. 音乐封面图

**路径格式：** `/img/music/covers/{音乐文件名}.{扩展名}`

**示例：**
```yaml
# 在音乐播放器配置中
- name: 歌曲名称
  artist: 艺术家
  url: /music/songs/song.mp3
  cover: /img/music/covers/song-cover.jpg
```

**注意：**
- 音乐文件放在 `source/music/songs/` 目录
- 封面图统一放在 `img/music/covers/` 目录
- 建议封面图尺寸：300x300 像素（正方形）

### 7. 友链图片

**路径格式：** `/img/links/{友链名称}.{扩展名}`

**示例：**
```yaml
# 在友链配置中
- name: 示例网站
  avatar: /img/links/example-avatar.jpg
  url: https://example.com
```

### 8. 标签页面图片

**路径格式：** `/img/tags/{标签名}.jpg`

**全局标签背景图：**
```yaml
# 在 _config.butterfly.yml 中
tag_img: /img/tags/default-tag-bg.jpg
```

**单个标签背景图：**
```yaml
# 在 _config.butterfly.yml 中
tag_per_img:
  - 技术: /img/tags/技术.jpg
  - 生活: /img/tags/生活.jpg
  - 旅行: /img/tags/旅行.jpg
```

### 9. 分类页面图片

**路径格式：** `/img/categories/{分类名}.jpg`

**全局分类背景图：**
```yaml
# 在 _config.butterfly.yml 中
category_img: /img/categories/default-category-bg.jpg
```

**单个分类背景图：**
```yaml
# 在 _config.butterfly.yml 中
category_per_img:
  - 技术分享: /img/categories/技术分享.jpg
  - 生活随笔: /img/categories/生活随笔.jpg
  - 项目展示: /img/categories/项目展示.jpg
```

### 10. 友链图片

**路径格式：** `/img/links/{友链名称}-avatar.{扩展名}`

**示例：**
```yaml
# 在 source/_data/link.yml 中
- name: 示例网站
  link: https://example.com
  avatar: /img/links/example-avatar.jpg
  descr: 网站描述
```

**建议：**
- 友链头像建议尺寸：64x64 或 128x128 像素（正方形）
- 推荐使用 `.jpg` 或 `.png` 格式
- 如果使用外部链接，可以直接使用 URL

### 11. 通用图片资源

**网站图标（Favicon）：**
```yaml
# 在 _config.butterfly.yml 中
favicon: /img/common/favicon.png
```

**用户头像：**
```yaml
# 在 _config.butterfly.yml 中
avatar:
  img: /img/common/avatar.jpg
  effect: true
```

**错误图片：**
```yaml
# 在 _config.butterfly.yml 中
error_img:
  flink: /img/common/friend_404.gif
  post_page: /img/common/404.jpg

error_404:
  background: /img/common/error-page.png
```

### 12. 其他资源图片

**路径格式：** `/img/resources/{资源名称}.{扩展名}`

**示例：**
```markdown
![资源图片](/img/resources/icon.png)
```

**用途：**
- 网站通用图标
- 装饰性图片
- 其他临时图片资源

## 🔄 迁移现有图片

### 页面背景图迁移

现有的页面背景图位于 `source/img/` 根目录，建议保持现状或按需迁移到 `img/pages/`。

如果迁移，需要更新以下文件中的引用：
- `_config.butterfly.yml` 中的 `index_img`、`archive_img` 等配置
- 各页面 `index.md` 文件中的 `top_img` 字段

### 文章图片迁移

如果已有文章使用了其他路径的图片，建议：
1. 将图片移动到对应的 `img/posts/{文章标题}/` 目录
2. 更新文章中的图片引用路径

## ✅ 最佳实践

1. **命名规范**
   - 使用小写字母、数字和连字符
   - 避免空格和特殊字符
   - 使用描述性的文件名

2. **图片优化**
   - 压缩图片以减少文件大小
   - 使用适当的格式（JPG 用于照片，PNG 用于图标/透明图）
   - 考虑使用 WebP 格式以获得更好的压缩率

3. **路径一致性**
   - 统一使用 `/img/` 作为图片根路径
   - 保持文件夹结构清晰有序
   - 避免在多个位置存放相同图片

4. **性能考虑**
   - 使用懒加载 (`loading="lazy"`)
   - 为重要图片添加适当的 `alt` 属性
   - 考虑使用 CDN 加速图片加载

## 📋 完整使用示例

### 文章完整示例

**文章文件：** `source/_posts/我的第一篇文章.md`
```yaml
---
title: 我的第一篇文章
date: 2025-11-20 12:00:00
tags:
  - 技术
  - 教程
categories:
  - 技术分享
cover: /img/posts/我的第一篇文章/cover.jpg
top_img: /img/posts/我的第一篇文章/top-bg.jpg
---

## 文章内容

这是文章的正文内容。

![示例图片1](/img/posts/我的第一篇文章/image1.jpg)

![示例图片2](/img/posts/我的第一篇文章/image2.png)
```

**对应的文件夹结构：**
```
source/img/posts/我的第一篇文章/
├── cover.jpg      # 文章封面（归档页面和首页显示）
├── top-bg.jpg     # 文章顶部背景图
├── image1.jpg     # 文章内容图片1
└── image2.png     # 文章内容图片2
```

### 归档页面图片显示

归档模块会自动显示文章的封面图（如果设置了 `cover` 字段）。确保：

1. **启用归档封面图显示：**
```yaml
# 在 _config.butterfly.yml 中
cover:
  archives_enable: true  # 启用归档页面封面图
```

2. **在文章 front-matter 中设置封面：**
```yaml
---
title: 文章标题
cover: /img/posts/文章标题/cover.jpg
# 或者使用颜色
# cover: '#49B1F5'
# 或者禁用封面
# cover: false
---
```

3. **封面图建议：**
   - 尺寸：1200x600 像素（2:1 比例）
   - 格式：JPG（文件更小）或 PNG（支持透明）
   - 文件大小：建议控制在 200KB 以内

## 🔄 迁移现有图片

### 页面背景图迁移

现有的页面背景图位于 `source/img/` 根目录，建议保持现状或按需迁移到 `img/pages/`。

如果迁移，需要更新以下文件中的引用：
- `_config.butterfly.yml` 中的 `index_img`、`archive_img` 等配置
- 各页面 `index.md` 文件中的 `top_img` 字段

### 文章图片迁移

如果已有文章使用了其他路径的图片，建议：
1. 将图片移动到对应的 `img/posts/{文章标题}/` 目录
2. 更新文章中的图片引用路径
3. 如果文章有封面图，命名为 `cover.jpg` 并设置 `cover` 字段

### 音乐封面图迁移

如果音乐封面图在 `source/music/covers/` 目录，建议：
1. 将封面图移动到 `img/music/covers/` 目录
2. 更新音乐播放器配置中的封面图路径

## ✅ 最佳实践

1. **命名规范**
   - 使用小写字母、数字和连字符
   - 避免空格和特殊字符（中文文件名可以使用，但建议使用英文）
   - 使用描述性的文件名
   - 文章文件夹名称与文章标题保持一致

2. **图片优化**
   - 压缩图片以减少文件大小
   - 使用适当的格式（JPG 用于照片，PNG 用于图标/透明图）
   - 考虑使用 WebP 格式以获得更好的压缩率
   - 封面图建议尺寸：1200x600 像素
   - 内容图片建议宽度不超过 1200 像素

3. **路径一致性**
   - 统一使用 `/img/` 作为图片根路径
   - 保持文件夹结构清晰有序
   - 避免在多个位置存放相同图片
   - 文章图片统一放在 `img/posts/{文章标题}/` 目录

4. **性能考虑**
   - 使用懒加载 (`loading="lazy"`) 对于非关键图片
   - 为重要图片添加适当的 `alt` 属性（SEO 和可访问性）
   - 考虑使用 CDN 加速图片加载
   - 封面图会自动优化显示

5. **归档页面图片**
   - 确保每篇文章都有封面图以获得更好的视觉效果
   - 封面图会在归档页面以缩略图形式显示
   - 如果不想显示封面图，设置 `cover: false`

## 📌 注意事项

- **归档模块**：已移除图片显示功能，归档页面不再显示文章封面图，但可以设置页面背景图
- **文章封面图**：在文章 front-matter 中设置 `cover` 字段可在首页显示，但不会在归档页面显示
- **归档页面背景**：在 `_config.butterfly.yml` 中设置 `archive_img` 来配置归档页面的背景图
- **所有路径**：都是相对于 `source/` 目录的
- **部署**：部署后，`source/` 目录下的文件会被复制到 `public/` 目录
- **大小写**：确保图片文件名和路径大小写一致（某些服务器区分大小写）
- **中文路径**：支持中文文件名和路径，但建议使用英文以避免编码问题
- **相对路径**：在 Markdown 中使用绝对路径（以 `/` 开头）引用图片
- **封面图类型**：`cover` 字段可以设置为图片路径（字符串）或颜色值（如 `'#49B1F5'`）或 `false`（禁用）

