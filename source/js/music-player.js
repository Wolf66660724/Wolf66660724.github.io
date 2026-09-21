// 音乐播放器：APlayer 提供播放能力，外面保留自研的悬浮拖拽 / 收起 / 旋转唱片
(function () {
    'use strict';

    // ============ 配置 ============
    // 音源：netease = 网易云，tencent = QQ 音乐
    var SERVER = 'netease';
    // 歌单 ID（想换歌单改这一行即可）
    //   网易云：歌单链接里的那串数字，如 https://music.163.com/#/playlist?id=2619366284
    //   QQ 音乐：歌单链接里的 dissid，如 https://y.qq.com/n/ryqq/playlist/7707261125
    var PLAYLIST_ID = '2619366284';
    // 是否额外加载在线歌单（540 首那个）。
    // 现在是「只放自己的歌」，想开回来把 false 改成 true 即可。
    var ENABLE_ONLINE_PLAYLIST = false;
    // Meting 接口，按顺序尝试（公共接口不稳定，多备几个）
    var METING_APIS = [
        'https://api.injahow.cn/meting/',
        'https://api.i-meto.com/meting/api'
    ];
    // 自己的歌单（在线歌单关闭时，这就是播放器的全部曲目）
    var LOCAL_TRACKS = [
        { name: '私奔 (Live)', artist: '郑钧 / 耿斯汉', url: '/music/songs/郑钧 _ 耿斯汉 - 私奔.mp3', cover: '/music/covers/私奔-郑钧 _ 耿斯汉.jpg', lrc: '/music/lrc/私奔-郑钧 _ 耿斯汉.lrc' },
        { name: '恋爱的犀牛', artist: '黄雨篱', url: '/music/songs/黄雨篱 - 恋爱的犀牛.mp3', cover: '/music/covers/恋爱的犀牛-黄雨篱.jpg', lrc: '/music/lrc/恋爱的犀牛-黄雨篱.lrc' },
        { name: '发如雪', artist: '周杰伦', url: '/music/songs/周杰伦 - 发如雪.mp3', cover: '/music/covers/faxue.jpg', lrc: '/music/lrc/faxue.lrc' },
        { name: '就这样爱着你', artist: '粥粥和小伙', url: '/music/songs/粥粥和小伙 _ 粥粥 - 就这样爱着你.ogg', cover: '/music/covers/aizheni.jpg', lrc: '/music/lrc/aizheni.lrc' },
        { name: '有何不可', artist: '许嵩', url: '/music/songs/许嵩 - 有何不可.mp3', cover: '/music/covers/youhebuk.webp', lrc: '/music/lrc/youhebuk.lrc' },
        { name: '别怕有我在', artist: '李怡然同学', url: '/music/songs/李怡然同学 - 别怕有我在.mp3', cover: '/music/covers/别怕有我在-李怡然同学.jpg', lrc: '/music/lrc/别怕有我在-李怡然同学.lrc' }
    ];
    // 缓存按「音源 + 歌单 ID」分开存，换歌单不会读到旧数据
    var CACHE_KEY = 'music-playlist-v1-' + SERVER + '-' + PLAYLIST_ID;
    var CACHE_TTL = 6 * 60 * 60 * 1000;   // 歌单缓存 6 小时
    var DRAG_THRESHOLD = 5;
    // APlayer 的主题色：白天薄荷蓝，夜里粉色
    var THEME_COLOR_LIGHT = '#5aa9e6';
    var THEME_COLOR_DARK = '#ff7ab8';
    // ================================

    var ap = null;
    var isDragging = false;
    var hasDragged = false;
    var listObserver = null;
    var dragOffset = { x: 0, y: 0 };

    function panel() { return document.getElementById('persistent-music-player'); }

    // ---------- 歌单数据 ----------
    function normalize(list) {
        if (!Array.isArray(list)) return [];
        return list.filter(function (t) { return t && t.name && t.url; }).map(function (t) {
            return {
                name: t.name,
                artist: t.artist || '未知歌手',
                url: t.url,
                cover: t.pic || t.cover || '',
                lrc: t.lrc || ''
            };
        });
    }

    function readCache() {
        try {
            var raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            var obj = JSON.parse(raw);
            if (!obj || !obj.t || Date.now() - obj.t > CACHE_TTL) return null;
            return obj.list && obj.list.length ? obj.list : null;
        } catch (e) { return null; }
    }

    function writeCache(list) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), list: list })); } catch (e) {}
    }

    function loadOnlinePlaylist(done) {
        var cached = readCache();
        if (cached) { done(null, cached); return; }
        (function tryApi(i) {
            if (i >= METING_APIS.length) { done(new Error('所有 Meting 接口都不可用')); return; }
            var url = METING_APIS[i] + '?server=' + SERVER + '&type=playlist&id=' + PLAYLIST_ID;
            fetch(url, { credentials: 'omit' })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    var list = normalize(data);
                    if (!list.length) throw new Error('歌单为空');
                    writeCache(list);
                    done(null, list);
                })
                .catch(function () { tryApi(i + 1); });
        })(0);
    }

    // ---------- 明暗主题联动 ----------
    function isDarkMode() {
        return document.documentElement.getAttribute('data-theme') === 'dark'
            || (document.body && document.body.classList.contains('DarkMode'));
    }

    function applyPlayerTheme() {
        if (!ap || typeof ap.theme !== 'function') return;
        try { ap.theme(isDarkMode() ? THEME_COLOR_DARK : THEME_COLOR_LIGHT); } catch (e) {}
    }

    var themeObserver = null;
    function watchTheme() {
        if (themeObserver || !window.MutationObserver) return;
        themeObserver = new MutationObserver(function () { applyPlayerTheme(); });
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        if (document.body) {
            themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }
    }

    // ---------- 顶栏“正在播放” ----------
    function setHeaderTitle(text) {
        var el = document.querySelector('#persistent-music-player .player-header-title');
        if (!el) return;
        el.textContent = text;
        el.title = text;
    }

    function currentText() {
        if (!ap || !ap.list || !ap.list.audios.length) return '音乐';
        var i = typeof ap.list.index === 'number' ? ap.list.index : 0;
        var t = ap.list.audios[i];
        return t ? t.name + (t.artist ? ' · ' + t.artist : '') : '音乐';
    }

    // ---------- 歌单封面：给每一行配一张小封面 ----------
    function decorateList() {
        var ol = document.querySelector('#aplayer-slot .aplayer-list ol');
        if (!ol || !ap || !ap.list) return;
        var audios = ap.list.audios;
        if (listObserver) listObserver.disconnect();
        for (var i = 0; i < ol.children.length; i++) {
            var li = ol.children[i];
            if (li.dataset.coverDone === 'true') continue;
            var t = audios[i];
            if (!t || !t.cover) continue;
            var img = document.createElement('img');
            img.className = 'mp-li-cover';
            img.alt = '';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.addEventListener('error', function () { this.classList.add('is-broken'); });
            img.src = t.cover;
            li.insertBefore(img, li.firstChild);
            li.classList.add('mp-has-cover');
            li.dataset.coverDone = 'true';
        }
        if (listObserver) listObserver.observe(ol, { childList: true });
    }

    function watchList() {
        var ol = document.querySelector('#aplayer-slot .aplayer-list ol');
        if (!ol || !window.MutationObserver) { decorateList(); return; }
        if (!listObserver) {
            listObserver = new MutationObserver(function () { decorateList(); });
        } else {
            listObserver.disconnect();
        }
        listObserver.observe(ol, { childList: true });
        decorateList();
    }

    // ---------- APlayer ----------
    function createPlayer(audioList) {
        var slot = document.getElementById('aplayer-slot');
        if (!slot || typeof APlayer !== 'function') return;
        if (ap) { try { ap.destroy(); } catch (e) {} ap = null; }

        // APlayer 会把 .aplayer 类名加在传入的容器上，这里多包一层，
        // 既让 `#aplayer-slot .aplayer` 的样式能命中，也避免污染外壳节点。
        slot.innerHTML = '';
        var mount = document.createElement('div');
        mount.className = 'mp-aplayer-mount';
        slot.appendChild(mount);

        ap = new APlayer({
            container: mount,
            fixed: false,
            mini: false,
            autoplay: false,
            theme: isDarkMode() ? THEME_COLOR_DARK : THEME_COLOR_LIGHT,
            loop: 'all',
            order: 'list',
            preload: 'none',
            lrcType: 3,
            volume: 0.7,
            mutex: true,
            listFolded: false,
            listMaxHeight: '220px',
            audio: audioList
        });

        // 播放时让左下角唱片图标转起来（原来的小设计）
        ap.on('play', function () {
            var p = panel(); if (p) p.classList.add('rotating');
            setHeaderTitle(currentText());
        });
        ap.on('pause', function () { var p = panel(); if (p) p.classList.remove('rotating'); });
        ap.on('ended', function () { var p = panel(); if (p) p.classList.remove('rotating'); });
        ap.on('listswitch', function () { setHeaderTitle(currentText()); });

        window._aplayer = ap;
        setTimeout(watchList, 60);
    }

    // ---------- 交互：展开 / 收起 ----------
    function toggleMusicPlayer() {
        if (hasDragged) return;
        var p = panel();
        if (!p) return;
        p.classList.toggle('minimized');
        if (!p.classList.contains('minimized')) {
            setHeaderTitle(currentText());
            // 等展开动画（.35s）走完再按最终宽度校正
            setTimeout(clampIntoView, 400);
        }
    }

    // 拖到屏幕边缘后展开，面板可能超出可视区域；这里把它拉回来
    function clampIntoView() {
        var p = panel();
        if (!p) return;
        if (!p.style.left && !p.style.top) return;   // 没被拖过就不动它
        var r = p.getBoundingClientRect();
        var curLeft = parseFloat(p.style.left);
        var curTop = parseFloat(p.style.top);
        if (isNaN(curLeft)) curLeft = r.left;
        if (isNaN(curTop)) curTop = r.top;
        var left = Math.max(8, Math.min(curLeft, window.innerWidth - r.width - 8));
        var top = Math.max(8, Math.min(curTop, window.innerHeight - r.height - 8));
        p.style.left = left + 'px';
        p.style.top = top + 'px';
        p.style.right = 'auto';
        p.style.bottom = 'auto';
    }

    function minimizeMusicPlayer() {
        var p = panel();
        if (p) p.classList.add('minimized');
    }

    function bindControls() {
        var p = panel();
        if (!p) return;

        var t = p.querySelector('.music-toggle-btn');
        if (t && t.dataset.bound !== 'true') {
            t.addEventListener('click', function (e) { e.preventDefault(); toggleMusicPlayer(); });
            t.dataset.bound = 'true';
        }

        var m = p.querySelector('.music-minimize-btn');
        if (m && m.dataset.bound !== 'true') {
            m.addEventListener('click', function (e) { e.preventDefault(); minimizeMusicPlayer(); });
            m.dataset.bound = 'true';
        }
    }

    // ---------- 交互：拖拽（把手只放在标题栏，避免和播放器按钮冲突）----------
    function initDrag() {
        var p = panel();
        if (!p || p.dataset.dragBound === 'true') return;

        var startDrag = function (e) {
            // 收起状态：整个圆钮都可以拖；展开状态：只有标题栏可以拖
            if (!p.classList.contains('minimized')) {
                var header = p.querySelector('.player-header');
                if (!header || !header.contains(e.target)) return;
                if (e.target.closest('button, input, a')) return;   // 标题栏上的收起按钮不触发拖拽
            }
            var pt = e.touches ? e.touches[0] : e;
            var rect = p.getBoundingClientRect();
            dragOffset.x = pt.clientX - rect.left;
            dragOffset.y = pt.clientY - rect.top;
            isDragging = true;
            hasDragged = false;

            var move = function (ev) {
                if (!isDragging) return;
                var q = ev.touches ? ev.touches[0] : ev;
                if (Math.abs(q.clientX - pt.clientX) > DRAG_THRESHOLD || Math.abs(q.clientY - pt.clientY) > DRAG_THRESHOLD) {
                    hasDragged = true;
                    p.classList.add('dragging');
                }
                if (!hasDragged) return;
                ev.preventDefault();
                var r = p.getBoundingClientRect();
                var left = Math.max(8, Math.min(q.clientX - dragOffset.x, window.innerWidth - r.width - 8));
                var top = Math.max(8, Math.min(q.clientY - dragOffset.y, window.innerHeight - r.height - 8));
                p.style.left = left + 'px';
                p.style.top = top + 'px';
                p.style.right = 'auto';
                p.style.bottom = 'auto';
            };

            var end = function () {
                if (!isDragging) return;
                isDragging = false;
                p.classList.remove('dragging');
                document.body.style.userSelect = '';
                setTimeout(function () { hasDragged = false; }, 120);
                document.removeEventListener('mousemove', move);
                document.removeEventListener('touchmove', move);
                document.removeEventListener('mouseup', end);
                document.removeEventListener('touchend', end);
            };

            document.body.style.userSelect = 'none';
            document.addEventListener('mousemove', move, { passive: false });
            document.addEventListener('touchmove', move, { passive: false });
            document.addEventListener('mouseup', end);
            document.addEventListener('touchend', end);
        };

        p.addEventListener('mousedown', startDrag, { passive: false });
        p.addEventListener('touchstart', startDrag, { passive: false });
        p.dataset.dragBound = 'true';
    }

    // ---------- 初始化 ----------
    function initMusicPlayer() {
        window.toggleMusicPlayer = toggleMusicPlayer;
        window.minimizeMusicPlayer = minimizeMusicPlayer;
        if (!document.getElementById('aplayer-slot')) return;

        // PJAX 换页时只替换 #body-wrap，播放器面板在它外面，会原样留下来。
        // 这种情况绝不能重建播放器：destroy + new 会把正在播的歌打断并从头开始。
        // 只补一下绑定就行。
        if (ap) {
            applyPlayerTheme();
            bindControls();
            initDrag();
            return;
        }

        // 先用本地曲目把播放器立起来（秒开，不等网络）
        createPlayer(normalize(LOCAL_TRACKS));
        applyPlayerTheme();
        watchTheme();
        bindControls();
        initDrag();

        // 只有开关打开时才去拉在线歌单
        if (!ENABLE_ONLINE_PLAYLIST) return;
        loadOnlinePlaylist(function (err, online) {
            if (err || !online || !online.length) {
                if (err) console.log('[music] 在线歌单不可用，仅使用本地曲目:', err.message);
                return;
            }
            if (!ap) return;
            ap.list.add(online);
            setTimeout(watchList, 80);
            console.log('[music] 在线歌单已加载 ' + online.length + ' 首');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMusicPlayer);
    } else {
        initMusicPlayer();
    }
    window.addEventListener('resize', clampIntoView);
    document.addEventListener('pjax:complete', initMusicPlayer);
})();