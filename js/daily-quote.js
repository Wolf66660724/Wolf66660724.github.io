// 每日一句 - 合并到公告模块
(function() {
    // 名言/歌词列表
    var quotes = [
        { text: "生活不是等待暴风雨过去，而是学会在雨中跳舞。", author: "维维安·格林" },
        { text: "你不能控制风向，但可以调整风帆。", author: "吉米·迪恩" },
        { text: "生活是一面镜子，你对它笑，它就对你笑。", author: "萨克雷" },
        { text: "不要等待机会，而要创造机会。", author: "林肯" },
        { text: "成功不是终点，失败也不是终结，重要的是继续前进的勇气。", author: "丘吉尔" },
        { text: "没有选择会是唯一的路。", author: "Mr.wolf" },
        { text: "遗憾是常态，但生活还要继续。", author: "Mr.wolf" },
        { text: "你在抱怨什么呢，为明天到来的事，说人生像是没有意义。", author: "Mr.wolf" },
        { text: "这不是你自己的问题，人终归要好好去生活。", author: "Mr.wolf" },
        { text: "人生就像骑自行车，要保持平衡就要不断前进。", author: "爱因斯坦" },
        { text: "过去属于死神，未来属于自己。", author: "雪莱" },
        { text: "千里之行，始于足下。", author: "老子" },
        { text: "学而不思则罔，思而不学则殆。", author: "孔子" },
        { text: "天行健，君子以自强不息。", author: "《周易》" },
        { text: "路漫漫其修远兮，吾将上下而求索。", author: "屈原" },
        { text: "生活不止眼前的苟且，还有诗和远方。", author: "高晓松" },
        { text: "愿你出走半生，归来仍是少年。", author: "苏轼" },
        { text: "我们都在阴沟里，但仍有人仰望星空。", author: "王尔德" },
        { text: "人生没有彩排，每一天都是现场直播。", author: "佚名" },
        { text: "做你自己，因为别人都有人做了。", author: "奥斯卡·王尔德" },
        { text: "世界上只有一种英雄主义，就是认清生活的真相后依然热爱生活。", author: "罗曼·罗兰" },
        { text: "不要因为走得太远，而忘记了为什么出发。", author: "纪伯伦" },
        { text: "你若盛开，蝴蝶自来；你若精彩，天自安排。", author: "佚名" },
        { text: "生活总会给你答案，但不会马上把一切都告诉你。", author: "佚名" },
        { text: "愿你所有的情深意重，都能换来岁月温柔。", author: "佚名" },
        { text: "你要悄悄拔尖，然后惊艳所有人。", author: "佚名" }
    ];

    // 根据日期选择固定的名言
    function getDailyQuote() {
        var today = new Date();
        var dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        var index = dayOfYear % quotes.length;
        return quotes[index];
    }

    // 渲染每日一句到公告模块
    function renderDailyQuote() {
        var quote = getDailyQuote();
        var announcement = document.querySelector('.card-announcement .announcement_content');
        if (!announcement) return;

        // 在公告内容末尾追加每日一句
        var quoteHtml =
            '<div style="margin-top:16px;padding:12px;background:linear-gradient(135deg,rgba(237,242,247,0.8),rgba(237,247,250,0.8));border-radius:10px;border:1px solid rgba(0,0,0,0.04);">' +
                '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">' +
                    '<span style="font-size:12px;">✨</span>' +
                    '<span style="color:#4a5568;font-size:11px;font-weight:600;">每日一句</span>' +
                '</div>' +
                '<div style="font-size:13px;color:#4a5568;font-style:italic;line-height:1.6;">"' + quote.text + '"</div>' +
                '<div style="font-size:10px;color:#a0aec0;margin-top:6px;text-align:right;">—— ' + quote.author + '</div>' +
            '</div>';

        announcement.innerHTML += quoteHtml;
    }

    // 延迟执行，等待 visitor-map.js 渲染完成
    function checkAndRender() {
        var announcement = document.querySelector('.card-announcement .announcement_content');
        if (announcement && announcement.innerHTML.indexOf('welcome') !== -1 && announcement.innerHTML.indexOf('每日一句') === -1) {
            renderDailyQuote();
        } else if (!announcement) {
            setTimeout(checkAndRender, 500);
        }
    }
    setTimeout(checkAndRender, 4000);

    // 暗黑模式适配
    if (!document.getElementById('daily-quote-styles')) {
        var style = document.createElement('style');
        style.id = 'daily-quote-styles';
        style.textContent = '[data-theme="dark"] .card-announcement .announcement_content { color: #ccc; }';
        document.head.appendChild(style);
    }
})();
