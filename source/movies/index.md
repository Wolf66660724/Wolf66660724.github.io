---
title: 记忆片段
date: 2025-11-20 12:00:00
type: "movies"
comments: false
top_img: /img/pages/movies-bg.jpg
---

<div align="center">

# 🎬 记忆片段

这里记录着那些珍贵的时光片段，每一个视频都是值得珍藏的回忆。

</div>

---

## 📹 视频列表

<div class="video-gallery">

<h3>🎥 精选视频</h3>

<div class="video-grid">

<!-- 视频示例（已移除大文件）：
<div class="video-item">
  <div class="video-thumbnail">
    <video class="video-player" controls preload="metadata">
      <source src="/movies/videos/Sony Bravia OLED 4K Demo.mp4" type="video/mp4">
      你的浏览器不支持 video 标签。
    </video>
  </div>
  <div class="video-info">
    <h4 class="video-title">Sony Bravia OLED 4K Demo</h4>
    <p class="video-description">Sony Bravia OLED 4K 演示视频</p>
    <div class="video-meta">
      <span class="video-date">2025-11-20</span>
      <span class="video-tags">
        <span class="tag">4K</span>
        <span class="tag">演示</span>
      </span>
    </div>
  </div>
</div>
-->

<!-- 不可用视频示例（已注释，不显示）：
<div class="video-item video-unavailable">
  <div class="video-thumbnail">
    <div class="video-placeholder">
      <div class="placeholder-icon">⚠️</div>
      <div class="placeholder-text">需要转换格式</div>
    </div>
  </div>
  <div class="video-info">
    <h4 class="video-title">Samsung Travel With My Pet HDR UHD 4K Demo</h4>
    <p class="video-description">当前为 .ts 格式，建议转换为 .mp4 以获得更好的浏览器兼容性。</p>
    <div class="video-meta">
      <span class="video-date">2025-11-20</span>
      <span class="video-tags">
        <span class="tag tag-warning">需转换</span>
        <span class="tag">4K</span>
        <span class="tag">HDR</span>
      </span>
    </div>
  </div>
</div>

<div class="video-item video-unavailable">
  <div class="video-thumbnail">
    <div class="video-placeholder">
      <div class="placeholder-icon">⚠️</div>
      <div class="placeholder-text">需要转换格式</div>
    </div>
  </div>
  <div class="video-info">
    <h4 class="video-title">Samsung Wonderland Demo</h4>
    <p class="video-description">当前为 .ts 格式，建议转换为 .mp4 以获得更好的浏览器兼容性。</p>
    <div class="video-meta">
      <span class="video-date">2025-11-20</span>
      <span class="video-tags">
        <span class="tag tag-warning">需转换</span>
        <span class="tag">演示</span>
        <span class="tag">Samsung</span>
      </span>
    </div>
  </div>
</div>
-->

</div>

</div>



<style>
.video-gallery {
  margin: 30px 0;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
  margin-top: 20px;
}

.video-item {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.video-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

[data-theme="dark"] .video-item {
  background: #1f1f1f;
}

.video-thumbnail {
  width: 100%;
  background: #000;
}

.video-player {
  width: 100%;
  height: auto;
  display: block;
}

.video-info {
  padding: 15px;
}

.video-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #333;
}

[data-theme="dark"] .video-title {
  color: #e0e0e0;
}

.video-description {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px 0;
  line-height: 1.6;
}

[data-theme="dark"] .video-description {
  color: #aaa;
}

.video-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.video-tags {
  display: flex;
  gap: 6px;
}

.tag {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  color: #667eea;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.tag-warning {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.2) 0%, rgba(255, 87, 34, 0.2) 100%);
  color: #ff9800;
}

.video-item.video-unavailable {
  opacity: 0.7;
  cursor: not-allowed;
}

.video-placeholder {
  width: 100%;
  padding: 50px 0;
  text-align: center;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  color: #666;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.placeholder-text {
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: 1fr;
  }
}
</style>
