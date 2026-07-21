---
title: 美好瞬间
date: 2025-11-20 12:00:00
type: "photos"
comments: false
top_img: /img/pages/photos-bg.jpg
---

<div align="center">

# 📸 美好瞬间

这里记录着生活中的每一个美好瞬间，每一张照片都承载着珍贵的回忆。

</div>

---

## 🖼️ 相册

<div class="photo-gallery">

<div class="photo-grid">

<!-- 在这里添加你的照片 -->
<!-- 示例：
<div class="photo-item">
  <div class="photo-thumbnail">
    <img src="/photos/images/example.jpg" alt="照片描述" loading="lazy">
  </div>
  <div class="photo-info">
    <h4 class="photo-title">照片标题</h4>
    <p class="photo-description">照片描述</p>
    <div class="photo-meta">
      <span class="photo-date">2025-11-20</span>
      <span class="tag">标签</span>
    </div>
  </div>
</div>
-->

</div>

</div>

<!--
## 📝 使用说明

- 将照片放在 `source/photos/images/` 目录下
- 复制上面的 `photo-item` 结构，替换图片路径和文字内容即可
- 推荐使用 `.jpg` 或 `.png` 格式
- 建议压缩图片以提升加载速度
-->

---

<style>
.photo-gallery {
  margin: 30px 0;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  margin-top: 20px;
}

.photo-item {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.photo-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

[data-theme="dark"] .photo-item {
  background: #1f1f1f;
}

.photo-thumbnail {
  width: 100%;
  background: #000;
  overflow: hidden;
}

.photo-thumbnail img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.3s ease;
}

.photo-item:hover .photo-thumbnail img {
  transform: scale(1.05);
}

.photo-info {
  padding: 15px;
}

.photo-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #333;
}

[data-theme="dark"] .photo-title {
  color: #e0e0e0;
}

.photo-description {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px 0;
  line-height: 1.6;
}

[data-theme="dark"] .photo-description {
  color: #aaa;
}

.photo-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.tag {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  color: #667eea;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

[data-theme="dark"] .tag {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  color: #a8c0ff;
}

@media (max-width: 768px) {
  .photo-grid {
    grid-template-columns: 1fr;
  }
}
</style>

