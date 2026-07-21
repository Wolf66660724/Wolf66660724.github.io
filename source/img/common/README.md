# 通用图片资源目录

此目录用于存放网站通用的图片资源。

## 📁 文件列表

- `favicon.png` - 网站图标（显示在浏览器标签页）
- `avatar.jpg` - 用户头像（显示在侧边栏等位置）
- `404.jpg` - 404错误页面图片（文章图片加载失败时显示）
- `friend_404.gif` - 友链404图片（友链加载失败时显示）
- `error-page.png` - 错误页面背景图

## 📝 使用方法

### 网站图标（Favicon）

在 `_config.butterfly.yml` 中设置：

```yaml
favicon: /img/common/favicon.png
```

**建议：**
- 尺寸：32x32 或 64x64 像素
- 格式：PNG（支持透明）或 ICO
- 文件大小：建议小于 50KB

### 用户头像

在 `_config.butterfly.yml` 中设置：

```yaml
avatar:
  img: /img/common/avatar.jpg
  effect: true  # 是否启用头像特效
```

**建议：**
- 尺寸：200x200 像素（正方形）
- 格式：JPG 或 PNG
- 建议使用圆形头像或正方形头像

### 错误图片

在 `_config.butterfly.yml` 中设置：

```yaml
error_img:
  flink: /img/common/friend_404.gif      # 友链404图片
  post_page: /img/common/404.jpg         # 文章图片404

error_404:
  enable: true
  subtitle: 'Page Not Found'
  background: /img/common/error-page.png  # 404页面背景
```

## 💡 说明

- 这些图片是网站的基础资源，建议保持稳定
- 更换这些图片后，需要重新生成和部署网站
- 建议使用压缩后的图片以提升加载速度

