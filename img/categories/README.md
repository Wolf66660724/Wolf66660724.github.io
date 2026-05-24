# 分类页面图片目录

此目录用于存放分类页面的背景图片。

## 📁 文件结构

```
img/categories/
├── default-category-bg.jpg    # 默认分类背景图（可选）
├── 技术分享.jpg              # 单个分类的背景图
├── 生活随笔.jpg
└── ...
```

## 📝 使用方法

### 全局分类背景图

在 `_config.butterfly.yml` 中设置所有分类页面的默认背景：

```yaml
category_img: /img/categories/default-category-bg.jpg
```

### 单个分类背景图

为特定分类设置专属背景图：

```yaml
category_per_img:
  - 技术分享: /img/categories/技术分享.jpg
  - 生活随笔: /img/categories/生活随笔.jpg
  - 项目展示: /img/categories/项目展示.jpg
  - 旅行日记: /img/categories/旅行日记.jpg
```

## 💡 说明

- 分类背景图会显示在分类页面的顶部
- 如果设置了 `category_per_img`，特定分类会使用对应的背景图
- 如果未设置特定分类的背景图，会使用 `category_img` 或默认背景
- 建议图片尺寸：1920x400 像素或类似比例

