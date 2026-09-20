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
        shares: BASE + 'shares'
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

    // ---------- 拉取 ----------
    function load(kind, render) {
        var box = document.getElementById(kind === 'photos' ? 'photo-grid' : 'share-root');
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
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
    document.addEventListener('pjax:complete', init);
})();