// 简历页面代码雨效果
// 注意：开了 PJAX 之后换页不会重新执行这个脚本，
// 所以进出 /resume/ 要靠自己开关，否则会一直挂在别的页面上。
(function() {
    var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    var canvas = null;
    var ctx = null;
    var drops = [];
    var timer = null;

    function isResumePage() {
        return window.location.pathname.indexOf('/resume/') !== -1;
    }

    function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        var columns = Math.floor(canvas.width / 20);
        drops = [];
        for (var i = 0; i < columns; i++) drops[i] = Math.random() * -100;
    }

    function draw() {
        if (!ctx || !canvas) return;
        // 半透明黑色覆盖，产生拖尾效果
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#4ade80';
        ctx.font = '15px monospace';
        for (var i = 0; i < drops.length; i++) {
            var text = CHARS[Math.floor(Math.random() * CHARS.length)];
            ctx.fillText(text, i * 20, drops[i] * 20);
            if (drops[i] * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }

    function stop() {
        if (timer) { clearInterval(timer); timer = null; }
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        canvas = null;
        ctx = null;
        drops = [];
    }

    function start() {
        if (!isResumePage()) { stop(); return; }
        if (timer) return;                       // 已经在跑
        canvas = document.createElement('canvas');
        canvas.id = 'matrix-canvas';
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
        document.body.insertBefore(canvas, document.body.firstChild);
        ctx = canvas.getContext('2d');
        resize();
        timer = setInterval(draw, 50);
    }

    window.addEventListener('resize', resize);
    start();
    document.addEventListener('pjax:complete', start);
})();
