# 标签页面图片目录

此目录用于存放标签页面的背景图片。

## 📁 文件结构

```
img/tags/
├── default-tag-bg.jpg    # 默认标签背景图（可选）
├── 技术.jpg              # 单个标签的背景图
├── 生活.jpg
└── ...
```

## 📝 使用方法

### 全局标签背景图

在 `_config.butterfly.yml` 中设置所有标签页面的默认背景：

```yaml
tag_img: /img/tags/default-tag-bg.jpg
```

### 单个标签背景图

为特定标签设置专属背景图：

```yaml
tag_per_img:
  - 技术: /img/tags/技术.jpg
  - 生活: /img/tags/生活.jpg
  - 旅行: /img/tags/旅行.jpg
  - 美食: /img/tags/美食.jpg
```

## 💡 说明

- 标签背景图会显示在标签页面的顶部
- 如果设置了 `tag_per_img`，特定标签会使用对应的背景图
- 如果未设置特定标签的背景图，会使用 `tag_img` 或默认背景
- 建议图片尺寸：1920x400 像素或类似比例

