// 文章打赏弹层：桌面端靠 hover 展开，触屏端点一下按钮切换。
// 原本只写了 CSS :hover —— 手机上属于“粘滞悬停”，各浏览器表现不一致，
// iOS Safari 点 <button> 也不一定会给 :focus，所以这里显式处理触屏。
(function () {
    'use strict';

    function isTouchDevice() {
        return !!(window.matchMedia && window.matchMedia('(hover: none)').matches);
    }

    // 用事件委托：PJAX 换页后不需要重新绑定
    document.addEventListener('click', function (e) {
        if (!e.target || !e.target.closest) return;
        var btn = e.target.closest('.post-reward .reward-button');
        if (!btn || !isTouchDevice()) return;

        var wrap = btn.closest('.post-reward');
        if (wrap) wrap.classList.toggle('reward-open');
    });

    // 点别处收起
    document.addEventListener('click', function (e) {
        if (!e.target || !e.target.closest) return;
        if (e.target.closest('.post-reward')) return;
        document.querySelectorAll('.post-reward.reward-open').forEach(function (el) {
            el.classList.remove('reward-open');
        });
    });
})();