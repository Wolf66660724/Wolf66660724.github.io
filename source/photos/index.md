---
title: 拾光集
subtitle: "每一帧都值得被收藏"
date: 2025-11-20 12:00:00
type: "photos"
comments: false
top_img: /img/pages/photos-bg.jpg
---

<div align="center">

# 📸 拾光集

> "拍照是凝固时光的艺术，每一帧都值得被收藏。"

</div>

---

<div class="photo-gallery-wrapper">

<div class="photo-grid" id="photo-grid"></div>

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
.photo-placeholder.photo-has-image {
    background-size: cover;
    background-position: center;
    font-size: 0;
}
[data-theme="dark"] .photo-placeholder {
    background: linear-gradient(135deg, #1e293b, #312e81, #3b0764);
}
[data-theme="dark"] .photo-placeholder.photo-has-image {
    background: center/cover no-repeat;
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
.collection-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 40px 0;
    color: var(--secondtext, #666);
    font-size: 0.95em;
}
</style>