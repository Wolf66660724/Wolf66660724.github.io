// 音乐播放器控制脚本
(function() {
    var isDragging = false;
    var hasDragged = false;
    var dragOffset = { x: 0, y: 0 };
    var progressPath = null;
    var progressLength = 0;
    var currentPlayingSrc = null;
    var currentTrackIndex = -1;

    // 歌曲列表
    var musicPlaylist = [
        { src: '/music/songs/周杰伦 - 发如雪.mp3', title: '发如雪', artist: '周杰伦' },
        { src: '/music/songs/粥粥和小伙 _ 粥粥 - 就这样爱着你.ogg', title: '就这样爱着你', artist: '粥粥和小伙 _ 粥粥' },
        { src: '/music/songs/许嵩 - 有何不可.mp3', title: '有何不可', artist: '许嵩' }
    ];

    // 切换播放器显示/隐藏
    function toggleMusicPlayer() {
        if (hasDragged) return;
        var player = document.getElementById('persistent-music-player');
        if (player) {
            player.classList.toggle('minimized');
            if (!player.classList.contains('minimized')) {
                player.style.transform = '';
            }
        }
    }

    // 最小化播放器
    function minimizeMusicPlayer() {
        var player = document.getElementById('persistent-music-player');
        if (player) {
            player.classList.add('minimized');
        }
    }

    function setVisualMeta(title, artist) {
        var songEl = document.getElementById('song');
        var artistEl = document.getElementById('artist');
        if (songEl) songEl.textContent = title || '待播放';
        if (artistEl) artistEl.textContent = artist || '未知歌手';
    }

    function initProgressRing() {
        progressPath = document.getElementById('song-time');
        if (!progressPath) return;
        progressLength = 1500;
        progressPath.style.strokeDasharray = progressLength;
        progressPath.style.strokeDashoffset = progressLength;
    }

    function updateProgressRing(current, duration) {
        if (!progressPath || !duration || duration === Infinity) return;
        var progress = Math.min(Math.max(current / duration, 0), 1);
        var offset = progressLength - progressLength * progress;
        progressPath.style.strokeDashoffset = offset;
    }

    function resetProgressRing() {
        if (!progressPath) return;
        progressPath.style.strokeDashoffset = progressLength;
    }

    // 切换当前播放/暂停
    function toggleCurrentTrack() {
        var audio = document.getElementById('music-audio');
        if (!audio) return;

        if (!audio.src || audio.src.length === 0 || currentTrackIndex === -1) {
            if (musicPlaylist.length > 0) {
                playTrackByIndex(0);
            }
            return;
        }

        if (audio.paused) {
            audio.play().catch(function(err) { console.warn('播放失败', err); });
        } else {
            audio.pause();
        }
    }

    // 播放指定索引的歌曲
    function playTrackByIndex(index) {
        if (index < 0 || index >= musicPlaylist.length) return;

        var track = musicPlaylist[index];
        currentTrackIndex = index;
        currentPlayingSrc = track.src;

        var audio = document.getElementById('music-audio');
        if (!audio) return;

        audio.pause();
        audio.currentTime = 0;
        resetProgressRing();

        setVisualMeta(track.title, track.artist);
        updateActiveTrack();

        function tryPlayAudio(audioSrc, attempt) {
            audio.src = audioSrc;
            audio.load();

            var playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(function() {
                        console.log('播放成功:', audioSrc);
                        updatePlayPauseIcon(false);
                    })
                    .catch(function(err) {
                        console.error('播放失败 (方式' + attempt + '):', err, audioSrc);

                        if (attempt === 1) {
                            var pathParts = track.src.split('/');
                            var fileName = pathParts.pop();
                            var basePath = pathParts.join('/');
                            var encodedFileName = encodeURIComponent(fileName);
                            tryPlayAudio(basePath + '/' + encodedFileName, 2);
                        } else if (attempt === 2) {
                            tryPlayAudio(encodeURI(track.src), 3);
                        } else if (attempt === 3) {
                            tryPlayAudio(track.src, 4);
                        } else {
                            updatePlayPauseIcon(true);
                            console.error('所有播放方式都失败');
                        }
                    });
            }
        }

        var pathParts = track.src.split('/');
        var fileName = pathParts.pop();
        var basePath = pathParts.join('/');
        var encodedFileName = encodeURIComponent(fileName);
        tryPlayAudio(basePath + '/' + encodedFileName, 1);
    }

    // 播放上一首
    function playPreviousTrack() {
        if (musicPlaylist.length === 0) return;

        var prevIndex;
        if (currentTrackIndex <= 0) {
            prevIndex = musicPlaylist.length - 1;
        } else {
            prevIndex = currentTrackIndex - 1;
        }

        playTrackByIndex(prevIndex);
    }

    // 播放下一首
    function playNextTrack() {
        if (musicPlaylist.length === 0) return;

        var nextIndex;
        if (currentTrackIndex >= musicPlaylist.length - 1) {
            nextIndex = 0;
        } else {
            nextIndex = currentTrackIndex + 1;
        }

        playTrackByIndex(nextIndex);
    }

    // 更新播放/暂停图标和状态文字
    function updatePlayPauseIcon(isPaused) {
        // 更新控制按钮图标
        var playBtn = document.querySelector('.ctrl-play');
        if (playBtn) {
            playBtn.innerHTML = isPaused
                ? '<i class="fas fa-play" style="margin-left: 3px;"></i>'
                : '<i class="fas fa-pause"></i>';
        }

        // 更新圆形中心的播放/暂停按钮
        var circlePlay = document.getElementById('play');
        var circlePause = document.getElementById('pause');
        if (circlePlay) circlePlay.style.display = isPaused ? 'flex' : 'none';
        if (circlePause) circlePause.style.display = isPaused ? 'none' : 'flex';

        // 更新状态文字
        var statusEl = document.querySelector('.player-header-title');
        if (!statusEl) {
            // 创建状态文字元素（如果不存在）
            var player = document.getElementById('player');
            if (player) {
                var header = document.createElement('div');
                header.className = 'player-header';
                header.innerHTML = '<span class="player-header-title">🎵 待播放</span>';
                player.insertBefore(header, player.firstChild);
                statusEl = header.querySelector('.player-header-title');
            }
        }
        if (statusEl) {
            if (currentTrackIndex === -1) {
                statusEl.textContent = '🎵 待播放';
            } else if (isPaused) {
                statusEl.textContent = '⏸ 已暂停';
            } else {
                statusEl.textContent = '🎵 正在播放';
            }
        }
    }

    // 更新当前播放高亮
    function updateActiveTrack() {
        var items = document.querySelectorAll('.music-item');
        items.forEach(function(item, i) {
            item.classList.toggle('active', i === currentTrackIndex);
        });
    }

    // 初始化拖拽
    function initDrag() {
        var wrapper = document.getElementById('persistent-music-player');
        if (!wrapper || wrapper.dataset.dragBound === 'true') return;

        var shouldIgnore = function(target) {
            if (!target) return true;
            var tagName = target.tagName;
            if (tagName === 'BUTTON' || tagName === 'A' || tagName === 'INPUT' || tagName === 'AUDIO') {
                return true;
            }
            if (target.closest('.music-play-btn')) return true;
            if (target.closest('.ctrl-btn') || target.closest('.music-minimize-btn')) {
                return true;
            }
            return false;
        };

        var startX, startY;
        var DRAG_THRESHOLD = 5;

        var startDrag = function(e) {
            if (shouldIgnore(e.target)) return;

            var eventPoint = e.touches ? e.touches[0] : e;
            startX = eventPoint.clientX;
            startY = eventPoint.clientY;

            var rect = wrapper.getBoundingClientRect();
            dragOffset.x = eventPoint.clientX - rect.left;
            dragOffset.y = eventPoint.clientY - rect.top;

            isDragging = true;
            hasDragged = false;

            var handleMove = function(event) {
                if (!isDragging) return;

                var point = event.touches ? event.touches[0] : event;
                var deltaX = Math.abs(point.clientX - startX);
                var deltaY = Math.abs(point.clientY - startY);

                if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
                    if (!hasDragged) {
                        hasDragged = true;
                        wrapper.classList.add('dragging');
                        document.body.style.userSelect = 'none';
                    }

                    event.preventDefault();

                    var playerRect = wrapper.getBoundingClientRect();
                    var left = point.clientX - dragOffset.x;
                    var top = point.clientY - dragOffset.y;

                    var maxLeft = window.innerWidth - playerRect.width - 10;
                    var maxTop = window.innerHeight - playerRect.height - 10;
                    left = Math.max(10, Math.min(left, maxLeft));
                    top = Math.max(10, Math.min(top, maxTop));

                    wrapper.style.left = left + 'px';
                    wrapper.style.top = top + 'px';
                    wrapper.style.right = 'auto';
                    wrapper.style.bottom = 'auto';
                }
            };

            var handleEnd = function() {
                if (!isDragging) return;
                isDragging = false;
                wrapper.classList.remove('dragging');
                document.body.style.userSelect = '';

                setTimeout(function() {
                    hasDragged = false;
                }, 100);

                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('mouseup', handleEnd);
                document.removeEventListener('touchend', handleEnd);
                document.removeEventListener('mouseleave', handleEnd);
            };

            document.addEventListener('mousemove', handleMove, { passive: false });
            document.addEventListener('touchmove', handleMove, { passive: false });
            document.addEventListener('mouseup', handleEnd);
            document.addEventListener('touchend', handleEnd);
            document.addEventListener('mouseleave', handleEnd);
        };

        wrapper.addEventListener('mousedown', startDrag, { passive: false });
        wrapper.addEventListener('touchstart', startDrag, { passive: false });

        wrapper.dataset.dragBound = 'true';
    }

    // 播放音乐（从列表点击）
    function playMusic(btn) {
        if (btn && btn.closest) {
            var musicItem = btn.closest('.music-item');
            if (musicItem) {
                var src = musicItem.getAttribute('data-src');
                var index = musicPlaylist.findIndex(function(track) { return track.src === src; });
                if (index !== -1) {
                    playTrackByIndex(index);
                    return;
                }
            }
        }

        if (musicPlaylist.length > 0) {
            playTrackByIndex(0);
        }
    }

    // 监听音频播放状态
    function initAudioEvents() {
        var audio = document.getElementById('music-audio');
        if (!audio) return;
        if (audio.dataset.eventsBound === 'true') return;

        audio.addEventListener('play', function() {
            updatePlayPauseIcon(false);
        });

        audio.addEventListener('pause', function() {
            updatePlayPauseIcon(true);
        });

        audio.addEventListener('ended', function() {
            updatePlayPauseIcon(true);
            resetProgressRing();
            playNextTrack();
        });

        audio.addEventListener('loadedmetadata', function() {
            updateProgressRing(audio.currentTime, audio.duration);
        });

        audio.addEventListener('timeupdate', function() {
            updateProgressRing(audio.currentTime, audio.duration);
        });

        audio.addEventListener('error', function(e) {
            console.error('音频加载错误:', e);
        });

        audio.dataset.eventsBound = 'true';
    }

    // 初始化
    function initMusicPlayer() {
        window.toggleMusicPlayer = toggleMusicPlayer;
        window.minimizeMusicPlayer = minimizeMusicPlayer;
        window.playMusic = playMusic;
        window.toggleCurrentTrack = toggleCurrentTrack;
        window.playPreviousTrack = playPreviousTrack;
        window.playNextTrack = playNextTrack;

        initAudioEvents();
        initProgressRing();
        resetProgressRing();
        initDrag();
        setVisualMeta('待播放', '未知歌手');
        updatePlayPauseIcon(true);

        // 确保状态文字存在
        var player = document.getElementById('player');
        if (player && !player.querySelector('.player-header')) {
            var header = document.createElement('div');
            header.className = 'player-header';
            header.innerHTML = '<span class="player-header-title">🎵 待播放</span>';
            player.insertBefore(header, player.firstChild);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMusicPlayer);
    } else {
        initMusicPlayer();
    }

    if (window.pjax) {
        document.addEventListener('pjax:complete', initMusicPlayer);
    }
})();
