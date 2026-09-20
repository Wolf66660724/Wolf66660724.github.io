/**
 * 拾光集 / 灵感集 渲染
 *
 * 内容不再写死在页面里，改成从内容服务读：
 *   GET /content-api/photos
 *   GET /content-api/shares
 * 后台地址 /manage/，在那里增删改，页面刷新即可看到。
 */
(function () {
    'use strict';

    // 本地预览（localhost）时直接读线上内容服务，省得再起一套；
    // 线上访问走同源相对路径。
    var IS_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    var BASE = IS_LOCAL ? 'https://worldpeace.top/content-api/' : '/content-api/';
    var API = {
        photos: BASE + 'photos',
        shares: BASE + 'shares',
        movies: BASE + 'movies'
    };

    // 分类 -> 标签配色（沿用原来的四个颜色，未知分类按名字散列选一个）
    var TAG_CLASS = { '设计': 'design', '技术': 'tech', '阅读': 'reading', '工具': 'tool' };
    var FALLBACK = ['design', 'tech', 'reading', 'tool'];

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }
    function tagClass(name) {
        if (TAG_CLASS[name]) return TAG_CLASS[name];
        var h = 0;
        for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
        return FALLBACK[h % FALLBACK.length];
    }
    function fmtDate(s) {
        if (!s) return '';
        var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return m ? m[1] + '-' + m[2] + '-' + m[3] : String(s);
    }
    function state(box, text, cls) {
        box.innerHTML = '<p class="collection-state ' + (cls || '') + '">' + esc(text) + '</p>';
    }

    // ---------- 拾光集 ----------
    function renderPhotos(items) {
        var grid = document.getElementById('photo-grid');
        if (!grid) return;
        if (!items.length) return state(grid, '相册还是空的，去 /manage/ 添加第一张吧');

        grid.innerHTML = items.map(function (it) {
            var media = it.image
                ? '<div class="photo-placeholder photo-has-image" style="background-image:url(\'' + esc(it.image) + '\')"></div>'
                : '<div class="photo-placeholder"><div class="placeholder-icon">' + esc(it.icon || '🖼️') + '</div></div>';
            var date = it.date ? '<span class="photo-date">' + esc(fmtDate(it.date)) + '</span>' : '';
            return '<div class="photo-card">' + media +
                '<div class="photo-info"><h4>' + esc(it.title) + '</h4>' +
                (it.desc ? '<p>' + esc(it.desc) + '</p>' : '') + date + '</div></div>';
        }).join('');
    }

    // ---------- 灵感集 ----------
    function renderShares(items) {
        var root = document.getElementById('share-root');
        if (!root) return;
        if (!items.length) return state(root, '还没有灵感记录，去 /manage/ 添加第一条吧');

        // 按分类分组，保持出现顺序
        var order = [], groups = {};
        items.forEach(function (it) {
            var c = it.category || '未分类';
            if (!groups[c]) { groups[c] = []; order.push(c); }
            groups[c].push(it);
        });

        root.innerHTML = order.map(function (cat) {
            var cards = groups[cat].map(function (it) {
                var href = it.url && it.url !== '#' ? it.url : '';
                var link = href
                    ? '<a href="' + esc(href) + '" target="_blank" rel="noopener">阅读全文 →</a>'
                    : '';
                return '<article class="share-card">' +
                    '<div class="share-meta">' +
                        '<span class="share-tag ' + tagClass(cat) + '">' + esc(cat) + '</span>' +
                        (it.date ? '<span class="share-date">' + esc(fmtDate(it.date)) + '</span>' : '') +
                    '</div>' +
                    '<h3>' + esc(it.title) + '</h3>' +
                    (it.desc ? '<p>' + esc(it.desc) + '</p>' : '') + link +
                    '</article>';
            }).join('');
            return '<h2 class="share-category">' + esc(cat) + '</h2><div class="share-grid">' + cards + '</div>';
        }).join('');
    }

    // ---------- 帧藏 ----------
    function isLocalVideo(url) {
        return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url || '');
    }

    function renderMovies(items) {
        var grid = document.getElementById('video-grid');
        if (!grid) return;
        if (!items.length) return state(grid, '还没有视频，去 /manage/ 添加第一条吧');

        grid.innerHTML = items.map(function (it) {
            var tags = (it.tags || '').split(',').map(function (x) { return x.trim() })
                .filter(Boolean).map(function (x) { return '<span class="tag">' + esc(x) + '</span>' }).join('');

            var info = '<div class="video-info"><h4>' + esc(it.title) + '</h4>' +
                (it.desc ? '<p>' + esc(it.desc) + '</p>' : '') +
                '<div class="video-meta">' +
                    (it.date ? '<span class="video-date">' + esc(fmtDate(it.date)) + '</span>' : '<span></span>') +
                    '<span class="video-tags">' + tags + '</span>' +
                '</div></div>';

            var inner;
            if (isLocalVideo(it.url)) {
                // 站内视频：直接在卡片里播
                inner = '<video controls preload="metadata"' +
                    (it.cover ? ' poster="' + esc(it.cover) + '"' : '') +
                    ' src="' + esc(it.url) + '"></video>';
                return '<div class="video-item"><div class="video-thumbnail">' + inner + '</div>' + info + '</div>';
            }

            if (it.cover) {
                inner = '<div style="width:100%;height:100%;background-size:cover;background-position:center;' +
                    'background-image:url(\'' + esc(it.cover) + '\')"></div>' +
                    (it.url ? '<div class="video-play-badge"><span>▶</span></div>' : '');
            } else {
                inner = '<div class="video-placeholder-content">' +
                    '<span class="video-placeholder-icon">' + esc(it.icon || '🎬') + '</span>' +
                    '<span class="video-placeholder-text">' + (it.url ? '点击查看' : '还没有视频地址') + '</span></div>';
            }

            // 有外链就整块可点，没有就只是展示
            var thumb = it.url
                ? '<a class="video-thumbnail" href="' + esc(it.url) + '" target="_blank" rel="noopener">' + inner + '</a>'
                : '<div class="video-thumbnail">' + inner + '</div>';

            return '<div class="video-item">' + thumb + info + '</div>';
        }).join('');
    }

    // ---------- 拉取 ----------
    var BOX = { photos: 'photo-grid', shares: 'share-root', movies: 'video-grid' };

    function load(kind, render) {
        var box = document.getElementById(BOX[kind]);
        if (!box) return;
        state(box, '加载中…', 'is-loading');

        fetch(API[kind], { credentials: 'omit' })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function (data) { render(data.items || []); })
            .catch(function () {
                state(box, '内容加载失败，刷新页面重试', 'is-error');
            });
    }

    function init() {
        if (document.getElementById('photo-grid')) load('photos', renderPhotos);
        if (document.getElementById('share-root')) load('shares', renderShares);
        if (document.getElementById('video-grid')) load('movies', renderMovies);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
    document.addEventListener('pjax:complete', init);
})();