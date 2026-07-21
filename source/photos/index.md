---
title: 美好瞬间
date: 2025-11-20 12:00:00
type: "photos"
comments: false
top_img: /img/pages/photos-bg.jpg
---

<div align="center">

# 📸 美好瞬间

> "拍照是凝固时光的艺术，每一帧都值得被珍藏。"

</div>

---

## 🖼️ 相册

<div class="photo-gallery-wrapper">

<div class="photo-grid">

<div class="photo-card">
  <div class="photo-placeholder">
    <div class="placeholder-icon">🌅</div>
  </div>
  <div class="photo-info">
    <h4>旅途风景</h4>
    <p>那些走过的路，见过的山与海</p>
    <span class="photo-date">待添加</span>
  </div>
</div>

<div class="photo-card">
  <div class="photo-placeholder">
    <div class="placeholder-icon">🍜</div>
  </div>
  <div class="photo-info">
    <h4>美食记录</h4>
    <p>人间烟火气，最抚凡人心</p>
    <span class="photo-date">待添加</span>
  </div>
</div>

<div class="photo-card">
  <div class="photo-placeholder">
    <div class="placeholder-icon">🌆</div>
  </div>
  <div class="photo-info">
    <h4>城市黄昏</h4>
    <p>日落尤其温柔，人间皆是浪漫</p>
    <span class="photo-date">待添加</span>
  </div>
</div>

<div class="photo-card">
  <div class="photo-placeholder">
    <div class="placeholder-icon">🌸</div>
  </div>
  <div class="photo-info">
    <h4>花与自然</h4>
    <p>在细节里发现世界的美好</p>
    <span class="photo-date">待添加</span>
  </div>
</div>

<div class="photo-card">
  <div class="photo-placeholder">
    <div class="placeholder-icon">🐱</div>
  </div>
  <div class="photo-info">
    <h4>动物朋友</h4>
    <p>那些可爱的小生命们</p>
    <span class="photo-date">待添加</span>
  </div>
</div>

<div class="photo-card">
  <div class="photo-placeholder">
    <div class="placeholder-icon">🏙️</div>
  </div>
  <div class="photo-info">
    <h4>城市夜空</h4>
    <p>万家灯火，总有一盏为我而亮</p>
    <span class="photo-date">待添加</span>
  </div>
</div>

</div>

</div>

<style>
.photo-gallery-wrapper {
    max-width: 1200px;
    margin: 0 auto;
}
.photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    padding: 20px 0;
}
.photo-card {
    background: var(--card-bg, #fff);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.photo-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}
.photo-placeholder {
    width: 100%;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #e0f2fe, #fce7f3, #fef9c3);
    font-size: 3em;
}
[data-theme="dark"] .photo-placeholder {
    background: linear-gradient(135deg, #1e293b, #312e81, #3b0764);
}
.photo-info {
    padding: 15px;
}
.photo-info h4 {
    margin: 0 0 8px 0;
    font-size: 1.1em;
}
.photo-info p {
    margin: 0 0 10px 0;
    color: var(--secondtext, #666);
    font-size: 0.9em;
}
.photo-date {
    color: var(--theme-color, #667eea);
    font-size: 0.85em;
}
</style>
