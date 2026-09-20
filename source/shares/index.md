---
title: 灵感集
subtitle: "记录灵感，发现美好"
date: 2025-11-27 12:00:00
type: "shares"
comments: true
top_img: /img/pages/share-bg.jpg
---

<div align="center">

# ✨ 灵感集 | Inspiring Reads

> 记录那些值得被一读再读的好文章、好工具、好设计，帮你快速定位灵感与方法论。

</div>

---

<div id="share-root"></div>

<style>
.share-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
    margin: 20px 0;
}
.share-category {
    margin: 28px 0 0;
    padding-left: 12px;
    border-left: 4px solid var(--theme-color, #667eea);
    font-size: 1.15em;
}
.share-card {
    background: var(--card-bg, #fff);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.share-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.1);
}
.share-card h3 {
    margin: 12px 0 8px;
    font-size: 1.05em;
    line-height: 1.5;
}
.share-card p {
    color: var(--secondtext, #666);
    font-size: 0.9em;
    line-height: 1.7;
    margin-bottom: 12px;
}
.share-card a {
    color: var(--theme-color, #667eea);
    font-size: 0.9em;
    font-weight: 500;
}
.share-card a:hover {
    text-decoration: underline;
}
.share-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
}
.share-tag {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 0.75em;
    font-weight: 500;
}
.share-tag.design { background: #fce7f3; color: #be185d; }
.share-tag.tech { background: #dbeafe; color: #1d4ed8; }
.share-tag.reading { background: #fef3c7; color: #b45309; }
.share-tag.tool { background: #d1fae5; color: #059669; }
.share-date { color: #999; font-size: 0.8em; }
.collection-state {
    text-align: center;
    padding: 40px 0;
    color: var(--secondtext, #666);
    font-size: 0.95em;
}
</style>