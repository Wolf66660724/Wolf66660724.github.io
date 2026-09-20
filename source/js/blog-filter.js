/**
 * 「博文」页筛选
 * 页面列表本身是构建时渲染好的静态 HTML，这里只负责点筛选按钮时显示/隐藏。
 * 分类和标签可以叠加（同时命中才算），再点一次取消。
 */
(function () {
    'use strict';

    function init() {
        var root = document.getElementById('blog-page');
        if (!root || root.dataset.ready === '1') return;
        root.dataset.ready = '1';

        var items = Array.prototype.slice.call(root.querySelectorAll('.blog-item'));
        var status = document.getElementById('blog-filter-status');
        var empty = document.getElementById('blog-empty');
        var active = { category: null, tag: null };

        function listOf(s) { return (s || '').split(',').filter(Boolean); }

        function apply() {
            var shown = 0;
            items.forEach(function (it) {
                var cats = listOf(it.getAttribute('data-categories'));
                var tags = listOf(it.getAttribute('data-tags'));
                var ok = (!active.category || cats.indexOf(active.category) > -1) &&
                         (!active.tag || tags.indexOf(active.tag) > -1);
                it.hidden = !ok;
                if (ok) shown++;
            });

            // 空掉的月份 / 年份分组一起收起来
            root.querySelectorAll('.blog-month').forEach(function (m) {
                var any = Array.prototype.some.call(m.querySelectorAll('.blog-item'), function (i) { return !i.hidden; });
                m.hidden = !any;
            });
            root.querySelectorAll('.blog-year').forEach(function (y) {
                var any = Array.prototype.some.call(y.querySelectorAll('.blog-month'), function (m) { return !m.hidden; });
                y.hidden = !any;
            });

            if (status) status.textContent = '共 ' + shown + ' 篇';
            if (empty) empty.hidden = shown > 0;
        }

        function syncChips() {
            root.querySelectorAll('.blog-chip').forEach(function (c) {
                var t = c.getAttribute('data-filter');
                var v = c.getAttribute('data-value');
                var on = (t === 'all' && !active.category && !active.tag) ||
                         (t === 'category' && active.category === v) ||
                         (t === 'tag' && active.tag === v);
                c.classList.toggle('is-active', on);
            });
        }

        root.addEventListener('click', function (e) {
            var chip = e.target.closest('.blog-chip');
            if (!chip) return;
            var type = chip.getAttribute('data-filter');
            var value = chip.getAttribute('data-value');

            if (type === 'all') {
                active.category = null;
                active.tag = null;
            } else if (type === 'category') {
                active.category = active.category === value ? null : value;
            } else if (type === 'tag') {
                active.tag = active.tag === value ? null : value;
            }
            syncChips();
            apply();
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
    document.addEventListener('pjax:complete', init);
})();