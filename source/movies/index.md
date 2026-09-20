---
title: 帧藏
subtitle: "每一帧都是时光的标本"
date: 2025-11-20 12:00:00
type: "movies"
comments: false
top_img: /img/pages/movies-bg.jpg
---

<div align="center">

# 🎬 帧藏

> 每一帧都是时光的标本，每一段视频都是记忆的琥珀。

</div>

---

<div class="video-gallery-wrapper">

<div class="video-intro">
<p>把珍贵的瞬间装进影像里，偶尔翻出来看看，仍然能感受到当时的心跳。</p>
</div>

<div class="video-grid" id="video-grid"></div>

</div>

<style>
.video-gallery-wrapper {
    max-width: 1200px;
    margin: 0 auto;
}
.video-intro {
    text-align: center;
    font-size: 1.05em;
    line-height: 1.8;
    margin-bottom: 30px;
    color: var(--secondtext, #666);
}
.video-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}
.video-item {
    background: var(--card-bg, #fff);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.video-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}
.video-thumbnail {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
    background: #000;
}
.video-thumbnail video {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
    background: #000;
}
.video-thumbnail.video-has-cover {
    background-size: cover;
    background-position: center;
}
.video-play-badge {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.28);
    transition: background 0.25s ease;
}
.video-item:hover .video-play-badge { background: rgba(0,0,0,0.42); }
.video-play-badge span {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: rgba(255,255,255,0.92);
    color: #1f2937;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    padding-left: 4px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}
.video-placeholder-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1e1b4b, #0f172a, #0c0f21);
    gap: 10px;
}
.video-placeholder-icon {
    font-size: 2.5em;
    opacity: 0.6;
}
.video-placeholder-text {
    color: rgba(255,255,255,0.4);
    font-size: 0.85em;
}
.video-info {
    padding: 15px;
}
.video-info h4 {
    margin: 0 0 8px 0;
    font-size: 1.05em;
}
.video-info p {
    margin: 0 0 12px 0;
    color: var(--secondtext, #666);
    font-size: 0.9em;
    line-height: 1.6;
}
.video-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}
.video-date {
    color: #999;
    font-size: 0.8em;
}
.tag {
    display: inline-block;
    padding: 1px 8px;
    border-radius: 4px;
    font-size: 0.75em;
    background: rgba(102,126,234,0.1);
    color: var(--theme-color, #667eea);
    margin-right: 4px;
}
.collection-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 40px 0;
    color: var(--secondtext, #666);
    font-size: 0.95em;
}
</style>