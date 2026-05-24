// 简历页面代码雨效果
(function() {
    // 只在简历页面执行
    if (!window.location.pathname.includes('/resume/')) return;

    // 创建 canvas 元素
    var canvas = document.createElement('canvas');
    canvas.id = 'matrix-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
    document.body.insertBefore(canvas, document.body.firstChild);

    var ctx = canvas.getContext('2d');

    // 设置 canvas 大小
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // 代码雨字符
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    var charArray = chars.split('');

    // 每列的字符
    var columns = Math.floor(canvas.width / 20);
    var drops = [];

    for (var i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100;
    }

    // 绘制函数
    function draw() {
        // 半透明黑色覆盖，产生拖尾效果
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#4ade80'; // 绿色
        ctx.font = '15px monospace';

        for (var i = 0; i < drops.length; i++) {
            // 随机选择字符
            var text = charArray[Math.floor(Math.random() * charArray.length)];

            // 绘制字符
            ctx.fillText(text, i * 20, drops[i] * 20);

            // 如果字符到达底部，重新开始
            if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }

            drops[i]++;
        }
    }

    // 动画循环
    setInterval(draw, 50);
})();
