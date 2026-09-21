/**
 * 日历模块
 *   1. 侧边栏「今日黄历」卡片（滚动到可视区才加载库）
 *   2. /calendar/ 日历页：月历 + 黄历详情 + 博客内容联动
 *
 * 依赖：
 *   /js/lunar.min.js        —— lunar-javascript（MIT，本地自托管）
 *   /js/content-index.json  —— 构建时由 scripts/calendar-data.js 生成
 */
(function () {
    'use strict';

    var LUNAR_URL = '/js/lunar.min.js';
    var INDEX_URL = '/js/content-index.json';
    var CAL_PAGE = '/calendar/';
    var WEEK_CN = ['日', '一', '二', '三', '四', '五', '六'];

    var lunarPromise = null;
    var indexPromise = null;

    // ---------------- 加载器 ----------------
    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = resolve;
            s.onerror = function () { reject(new Error('加载失败: ' + src)); };
            document.head.appendChild(s);
        });
    }

    function loadLunar() {
        if (!lunarPromise) lunarPromise = loadScript(LUNAR_URL);
        return lunarPromise;
    }

    function loadIndex() {
        if (!indexPromise) {
            // no-cache = 每次都跟服务器校验一下（没变会走 304，很便宜），
            // 否则刚部署完的访客可能还在用浏览器里缓存的旧索引。
            indexPromise = fetch(INDEX_URL, { credentials: 'same-origin', cache: 'no-cache' })
                .then(function (r) { return r.ok ? r.json() : { items: [] }; })
                .catch(function () { return { items: [] }; });
        }
        return indexPromise;
    }

    // ---------------- 工具 ----------------
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function byDate(items) {
        var map = {};
        (items || []).forEach(function (it) { (map[it.date] = map[it.date] || []).push(it); });
        return map;
    }
    function el(tag, cls, html) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html != null) e.innerHTML = html;
        return e;
    }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }

    function getLunar(date) {
        if (!window.Solar) return null;
        try { return window.Solar.fromDate(date).getLunar(); } catch (e) { return null; }
    }

    // 某天的农历短标签：节气 > 节日 > 初一显示月份 > 农历日
    function lunarShort(solar, lunar) {
        try {
            var jq = lunar.getJieQi();
            if (jq) return jq;
            var fes = lunar.getFestivals().concat(solar.getFestivals(), solar.getOtherFestivals() || []);
            if (fes.length) return fes[0];
            if (lunar.getDayInChinese() === '初一') return lunar.getMonthInChinese() + '月';
            return lunar.getDayInChinese();
        } catch (e) { return ''; }
    }

    // ---------------- 侧边栏卡片 ----------------
    function renderSidebarCard(host) {
        var today = new Date();
        var solar = window.Solar.fromDate(today);
        var lunar = solar.getLunar();

        var yi = (lunar.getDayYi() || []).join(' ');
        var ji = (lunar.getDayJi() || []).join(' ');

        host.innerHTML =
            '<div class="cal-card-head">' +
                '<span class="cal-card-icon">📅</span>' +
                '<span class="cal-card-title">今日黄历</span>' +
                '<a class="cal-card-more" href="' + CAL_PAGE + '">日历 ›</a>' +
            '</div>' +
            '<div class="cal-card-body">' +
                '<div class="cal-card-date">' +
                    '<strong>' + (today.getMonth() + 1) + '月' + today.getDate() + '日</strong>' +
                    '<span>星期' + WEEK_CN[today.getDay()] + '</span>' +
                '</div>' +
                '<div class="cal-card-lunar">' + esc(lunar.toString()) + '</div>' +
                '<div class="cal-card-gz">' + esc(lunar.getYearInGanZhi() + '年【' + lunar.getYearShengXiao() + '年】' +
                    lunar.getMonthInGanZhi() + '月 ' + lunar.getDayInGanZhi() + '日') + '</div>' +
                '<div class="cal-yiji">' +
                    '<div class="cal-line cal-yi"><b>宜</b><span>' + esc(yi) + '</span></div>' +
                    '<div class="cal-line cal-ji"><b>忌</b><span>' + esc(ji) + '</span></div>' +
                '</div>' +
            '</div>';
    }

    function mountSidebarCard() {
        var aside = document.querySelector('.aside-content');
        if (!aside || document.querySelector('.cal-card')) return;
        var anchor = aside.querySelector('.card-announcement') || aside.querySelector('.card-widget');
        var card = el('div', 'card-widget cal-card');
        card.innerHTML = '<div class="cal-skeleton">黄历加载中…</div>';
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(card, anchor.nextSibling);
        else aside.appendChild(card);

        var start = function () {
            loadLunar().then(function () { renderSidebarCard(card); }).catch(function () {});
        };
        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (en.isIntersecting) { io.disconnect(); start(); }
                });
            }, { rootMargin: '200px' });
            io.observe(card);
        } else { start(); }
    }

    // ---------------- 日历页 ----------------
    function fmtYiJi(list) { return (list || []).join(' '); }

    function renderDetail(box, date, lunar, items) {
        var solar = window.Solar.fromDate(date);
        var rows = [];

        rows.push('<div class="cal-d-head">' +
            '<div class="cal-d-day">' + date.getDate() + '</div>' +
            '<div class="cal-d-meta">' +
                '<div class="cal-d-full">' + solar.toYmd() + ' 星期' + WEEK_CN[date.getDay()] + ' · ' + solar.getXingZuo() + '座</div>' +
                '<div class="cal-d-lunar">' + esc(lunar.toString()) + '</div>' +
                '<div class="cal-d-gz">' + esc(lunar.getYearInGanZhi() + '年【' + lunar.getYearShengXiao() + '年】' +
                    lunar.getMonthInGanZhi() + '月 ' + lunar.getDayInGanZhi() + '日') + '</div>' +
            '</div></div>');

        rows.push('<div class="cal-yiji cal-yiji-lg">' +
            '<div class="cal-line cal-yi"><b>宜</b><span>' + esc(fmtYiJi(lunar.getDayYi())) + '</span></div>' +
            '<div class="cal-line cal-ji"><b>忌</b><span>' + esc(fmtYiJi(lunar.getDayJi())) + '</span></div>' +
        '</div>');

        var facts = [
            ['冲煞', lunar.getDayChongDesc() + ' 煞' + lunar.getDaySha()],
            ['值神', lunar.getDayTianShen() + '（' + lunar.getDayTianShenType() + '）'],
            ['建除', lunar.getZhiXing() + '日'],
            ['星宿', lunar.getXiu() + '宿'],
            ['吉神', (lunar.getDayJiShen() || []).join(' ')],
            ['凶煞', (lunar.getDayXiongSha() || []).join(' ')],
            ['彭祖', lunar.getPengZuGan() + '；' + lunar.getPengZuZhi()],
            ['方位', '财神 ' + lunar.getDayPositionCai() + ' · 喜神 ' + lunar.getDayPositionXi() +
                ' · 福神 ' + lunar.getDayPositionFu()],
            ['胎神', lunar.getDayPositionTai()]
        ];
        var nextJq = null;
        try { var nj = lunar.getNextJieQi(); if (nj) nextJq = nj.getName() + ' ' + nj.getSolar().toYmd(); } catch (e) {}
        if (nextJq) facts.push(['近节气', nextJq]);

        rows.push('<div class="cal-facts">' + facts.map(function (f) {
            return '<div class="cal-fact"><span class="cal-fact-k">' + esc(f[0]) + '</span>' +
                '<span class="cal-fact-v">' + esc(f[1]) + '</span></div>';
        }).join('') + '</div>');

        if (items && items.length) {
            rows.push('<div class="cal-d-content"><div class="cal-d-content-title">这一天记录了</div>' +
                items.map(function (it) {
                    // 索引里的 url 现在是绝对路径；这里再兜一层，
                    // 防止相对路径在 /calendar/ 下被解析成 /calendar/2026/... 而 404
                    var href = it.url || '#';
                    if (href !== '#' && !/^(?:https?:|mailto:|\/)/.test(href)) {
                        href = '/' + href.replace(/^\.?\/+/, '');
                    }
                    var ext = /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '';
                    return '<a class="cal-content-item" href="' + esc(href) + '"' + ext + '>' +
                        '<span class="cal-content-icon">' + it.icon + '</span>' +
                        '<span class="cal-content-title">' + esc(it.title) + '</span>' +
                        '<span class="cal-content-label">' + esc(it.label) + '</span></a>';
                }).join('') + '</div>');
        } else {
            rows.push('<div class="cal-d-content cal-d-empty">这一天还没有记录</div>');
        }

        box.innerHTML = rows.join('');
    }

    function renderCalendarPage(root, content) {
        var records = byDate(content.items);
        var today = new Date();
        var todayKey = ymd(today);
        var state = { y: today.getFullYear(), m: today.getMonth(), selected: today };

        root.innerHTML =
            '<div class="cal-wrap">' +
                '<div class="cal-main">' +
                    '<div class="cal-toolbar">' +
                        '<button class="cal-nav" data-act="prev" aria-label="上个月">‹</button>' +
                        '<div class="cal-title"></div>' +
                        '<button class="cal-nav" data-act="next" aria-label="下个月">›</button>' +
                        '<button class="cal-today" data-act="today">回到今天</button>' +
                    '</div>' +
                    '<div class="cal-weekdays">' + WEEK_CN.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>' +
                    '<div class="cal-grid"></div>' +
                    '<div class="cal-legend">' +
                        '<span><i class="cal-dot cal-dot-post"></i>文章</span>' +
                        '<span><i class="cal-dot cal-dot-share"></i>灵感集</span>' +
                        '<span><i class="cal-dot cal-dot-photo"></i>拾光集</span>' +
                        '<span><i class="cal-dot cal-dot-movie"></i>帧藏</span>' +
                    '</div>' +
                '</div>' +
                '<div class="cal-side"><div class="cal-detail"></div></div>' +
            '</div>';

        var titleEl = root.querySelector('.cal-title');
        var gridEl = root.querySelector('.cal-grid');
        var detailEl = root.querySelector('.cal-detail');

        function draw() {
            titleEl.textContent = state.y + ' 年 ' + (state.m + 1) + ' 月';

            var first = new Date(state.y, state.m, 1);
            var startOffset = first.getDay();                 // 周日为一周开头
            var daysInMonth = new Date(state.y, state.m + 1, 0).getDate();
            var cells = [];

            for (var i = 0; i < startOffset; i++) {
                var pd = new Date(state.y, state.m, i - startOffset + 1);
                cells.push({ date: pd, other: true });
            }
            for (var d = 1; d <= daysInMonth; d++) {
                cells.push({ date: new Date(state.y, state.m, d), other: false });
            }
            while (cells.length % 7 !== 0) {
                var last = cells[cells.length - 1].date;
                cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), other: true });
            }

            gridEl.innerHTML = cells.map(function (c) {
                var key = ymd(c.date);
                var solar = window.Solar.fromDate(c.date);
                var lunar = solar.getLunar();
                var items = records[key] || [];
                var types = {};
                items.forEach(function (it) { types[it.type] = true; });
                var dots = ['post', 'share', 'photo', 'movie'].filter(function (t) { return types[t]; })
                    .map(function (t) { return '<i class="cal-dot cal-dot-' + t + '"></i>'; }).join('');
                var cls = 'cal-cell' + (c.other ? ' is-other' : '') +
                    (key === todayKey ? ' is-today' : '') +
                    (key === ymd(state.selected) ? ' is-selected' : '') +
                    (items.length ? ' has-content' : '');
                return '<button class="' + cls + '" data-date="' + key + '">' +
                    '<span class="cal-num">' + c.date.getDate() + '</span>' +
                    '<span class="cal-lunar">' + esc(lunarShort(solar, lunar)) + '</span>' +
                    '<span class="cal-dots">' + dots + '</span>' +
                '</button>';
            }).join('');
        }

        function select(date) {
            state.selected = date;
            var lunar = getLunar(date);
            if (lunar) renderDetail(detailEl, date, lunar, records[ymd(date)] || []);
            draw();
        }

        root.addEventListener('click', function (e) {
            var cell = e.target.closest('.cal-cell');
            if (cell) {
                var parts = cell.getAttribute('data-date').split('-');
                state.y = +parts[0]; state.m = +parts[1] - 1;
                select(new Date(state.y, state.m, +parts[2]));
                return;
            }
            var btn = e.target.closest('[data-act]');
            if (!btn) return;
            var act = btn.getAttribute('data-act');
            if (act === 'prev') { state.m--; if (state.m < 0) { state.m = 11; state.y--; } draw(); }
            if (act === 'next') { state.m++; if (state.m > 11) { state.m = 0; state.y++; } draw(); }
            if (act === 'today') { state.y = today.getFullYear(); state.m = today.getMonth(); select(today); }
        });

        draw();
        select(today);
    }

    // ---------------- 初始化 ----------------
    function init() {
        var page = document.getElementById('calendar-page');
        if (page && !page.dataset.ready) {
            page.dataset.ready = '1';
            Promise.all([loadLunar(), loadIndex()]).then(function (res) {
                renderCalendarPage(page, res[1]);
            }).catch(function () {
                page.innerHTML = '<div class="cal-skeleton">日历加载失败，刷新试试</div>';
            });
        }
        mountSidebarCard();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
    document.addEventListener('pjax:complete', init);
})();