// 音乐播放器控制脚本
(function() {
    let isRotating = false;
    let longPressTimer = null;
    let isLongPress = false;
    let isDragging = false;
    const dragOffset = { x: 0, y: 0 };
    let progressPath = null;
    let progressLength = 0;
    let globalEventsBound = false;
    let currentPlayingSrc = null; // 保存当前播放的音频源路径
    let currentTrackIndex = -1; // 当前播放的歌曲索引
    
    // 歌曲列表
    const musicPlaylist = [
        { src: '/music/songs/周杰伦 - 发如雪.mp3', title: '发如雪', artist: '周杰伦' },
        { src: '/music/songs/粥粥和小伙 _ 粥粥 - 就这样爱着你.ogg', title: '就这样爱着你', artist: '粥粥和小伙 _ 粥粥' },
        { src: '/music/songs/许嵩 - 有何不可.mp3', title: '有何不可', artist: '许嵩' }
    ];

    // 切换播放器显示/隐藏
    function toggleMusicPlayer() {
        const player = document.getElementById('persistent-music-player');
        if (player) {
            player.classList.toggle('minimized');
        }
    }

    // 最小化播放器
    function minimizeMusicPlayer() {
        const player = document.getElementById('persistent-music-player');
        if (player) {
            player.classList.add('minimized');
        }
    }

    // 切换旋转动画
    function toggleRotation() {
        const player = document.getElementById('persistent-music-player');
        const btn = document.querySelector('.music-toggle-btn');
        
        if (player && btn) {
            isRotating = !isRotating;
            if (isRotating) {
                player.classList.add('rotating');
            } else {
                player.classList.remove('rotating');
            }
        }
    }

    // 桌面端右键切换旋转
    function handleRightClick(e) {
        const btn = document.querySelector('.music-toggle-btn');
        if (btn && btn.contains(e.target)) {
            e.preventDefault();
            toggleRotation();
        }
    }

    // 移动端长按切换旋转
    function handleTouchStart(e) {
        const btn = document.querySelector('.music-toggle-btn');
        if (btn && btn.contains(e.target)) {
            isLongPress = false;
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                toggleRotation();
            }, 1000);
        }
    }

    function handleTouchEnd(e) {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        // 如果不是长按，则执行正常的点击切换
        if (!isLongPress) {
            const btn = document.querySelector('.music-toggle-btn');
            if (btn && btn.contains(e.target)) {
                toggleMusicPlayer();
            }
        }
        isLongPress = false;
    }

    function setVisualMeta(title, artist) {
        const visualTitle = document.querySelector('.music-visual-title');
        const visualArtist = document.querySelector('.music-visual-artist');
        const nowTitle = document.querySelector('.now-playing-title');
        const nowArtist = document.querySelector('.now-playing-artist');
        if (visualTitle) visualTitle.textContent = title || '待播放';
        if (visualArtist) visualArtist.textContent = artist || '未知歌手';
        if (nowTitle) nowTitle.textContent = title || '未播放';
        if (nowArtist) nowArtist.textContent = artist || '--';
    }

    function setVisualState(isPlaying) {
        const visual = document.querySelector('.music-visual');
        if (visual) visual.classList.toggle('playing', Boolean(isPlaying));
    }

    function initProgressRing() {
        progressPath = document.getElementById('song-time') || document.querySelector('.music-progress-path');
        if (!progressPath) return;
        if (progressPath.tagName && progressPath.tagName.toLowerCase() === 'circle') {
            const radius = parseFloat(progressPath.getAttribute('r')) || 0;
            progressLength = 2 * Math.PI * radius;
        } else if (typeof progressPath.getTotalLength === 'function') {
            progressLength = progressPath.getTotalLength();
        } else {
            progressLength = 2000;
        }
        progressPath.style.strokeDasharray = progressLength;
        progressPath.style.strokeDashoffset = progressLength;
    }

    function updateProgressRing(current, duration) {
        if (!progressPath || !duration || duration === Infinity) return;
        const progress = Math.min(Math.max(current / duration, 0), 1);
        const offset = progressLength - progressLength * progress;
        progressPath.style.strokeDashoffset = offset;
    }

    function resetProgressRing() {
        if (!progressPath) return;
        progressPath.style.strokeDashoffset = progressLength;
    }

    function initPlaylistMarker() {}

    // 切换当前播放/暂停
    function toggleCurrentTrack() {
        const audio = document.getElementById('music-audio');
        if (!audio || !audio.src) return;
        if (audio.paused) {
            audio.play().catch(err => console.warn('播放失败', err));
        } else {
            audio.pause();
        }
    }
    
    // 播放/暂停切换（供按钮调用）
    function togglePlayPause() {
        const audio = document.getElementById('music-audio');
        if (!audio) return;
        
        // 如果没有音频源，播放第一首
        if (!audio.src || audio.src.length === 0) {
            if (musicPlaylist.length > 0) {
                playTrackByIndex(0);
            }
            return;
        }
        
        // 切换播放/暂停
        if (audio.paused) {
            audio.play().catch(err => console.warn('播放失败', err));
        } else {
            audio.pause();
        }
    }
    
    // 播放指定索引的歌曲
    function playTrackByIndex(index) {
        if (index < 0 || index >= musicPlaylist.length) return;
        
        const track = musicPlaylist[index];
        currentTrackIndex = index;
        currentPlayingSrc = track.src;
        
        const audio = document.getElementById('music-audio');
        if (!audio) return;
        
        // 停止当前播放
        audio.pause();
        audio.currentTime = 0;
        resetProgressRing();
        
        // 更新显示信息
        setVisualMeta(track.title, track.artist);
        const nowTitle = document.querySelector('.now-playing-title');
        const nowArtist = document.querySelector('.now-playing-artist');
        if (nowTitle) nowTitle.textContent = track.title;
        if (nowArtist) nowArtist.textContent = track.artist;
        
        // 尝试多种编码方式播放
        function tryPlayAudio(audioSrc, attempt = 1) {
            // 设置新的音频源
            audio.src = audioSrc;
            audio.load();
            
            // 播放
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('播放成功:', audioSrc);
                        updatePlayPauseButton(false);
                    })
                    .catch(err => {
                        console.error(`播放失败 (方式${attempt}):`, err, audioSrc);
                        
                        // 如果第一次失败，尝试其他编码方式
                        if (attempt === 1) {
                            // 方式2: 只编码文件名部分
                            const pathParts = track.src.split('/');
                            const fileName = pathParts.pop();
                            const basePath = pathParts.join('/');
                            const encodedFileName = encodeURIComponent(fileName);
                            tryPlayAudio(basePath + '/' + encodedFileName, 2);
                        } else if (attempt === 2) {
                            // 方式3: 编码整个路径
                            tryPlayAudio(encodeURI(track.src), 3);
                        } else if (attempt === 3) {
                            // 方式4: 尝试直接使用原始路径（不编码）
                            tryPlayAudio(track.src, 4);
                        } else {
                            // 所有方式都失败
                            updatePlayPauseButton(true);
                            const isMflac = audioSrc.toLowerCase().endsWith('.mflac');
                            let errorMsg = '音乐播放失败！\n\n';
                            
                            if (isMflac) {
                                errorMsg += '⚠️ 主要问题：.mflac格式不被浏览器原生支持！\n\n';
                                errorMsg += '解决方案：\n';
                                errorMsg += '1. 将.mflac文件转换为.mp3格式\n';
                                errorMsg += '2. 使用格式转换工具（如格式工厂、FFmpeg等）\n';
                                errorMsg += '3. 转换后更新播放器中的文件扩展名\n\n';
                            } else {
                                errorMsg += '可能的原因：\n';
                                errorMsg += '1. 文件路径不正确\n';
                                errorMsg += '2. 文件不存在\n';
                                errorMsg += '3. 文件格式不支持\n\n';
                            }
                            
                            errorMsg += '当前尝试的路径: ' + audioSrc;
                            
                            // 使用更友好的提示方式
                            if (window.Snackbar) {
                                window.Snackbar.show({
                                    text: isMflac ? '⚠️ .mflac格式不支持，请转换为.mp3格式' : '音乐播放失败，请检查文件路径',
                                    pos: 'top-center',
                                    actionText: '知道了',
                                    duration: 5000
                                });
                            } else {
                                alert(errorMsg);
                            }
                        }
                    });
            }
        }
        
        // 开始尝试播放（方式1: 编码文件名）
        const pathParts = track.src.split('/');
        const fileName = pathParts.pop();
        const basePath = pathParts.join('/');
        const encodedFileName = encodeURIComponent(fileName);
        tryPlayAudio(basePath + '/' + encodedFileName, 1);
    }
    
    // 播放上一首
    function playPreviousTrack() {
        if (musicPlaylist.length === 0) return;
        
        let prevIndex;
        if (currentTrackIndex <= 0) {
            prevIndex = musicPlaylist.length - 1; // 循环到最后一首
        } else {
            prevIndex = currentTrackIndex - 1;
        }
        
        playTrackByIndex(prevIndex);
    }
    
    // 播放下一首
    function playNextTrack() {
        if (musicPlaylist.length === 0) return;
        
        let nextIndex;
        if (currentTrackIndex >= musicPlaylist.length - 1) {
            nextIndex = 0; // 循环到第一首
        } else {
            nextIndex = currentTrackIndex + 1;
        }
        
        playTrackByIndex(nextIndex);
    }
    
    // 更新播放/暂停按钮状态
    function updatePlayPauseButton(isPaused) {
        const btn = document.querySelector('.music-play-pause-btn');
        if (btn) {
            btn.textContent = isPaused ? '▶' : '⏸';
        }
    }


    function initDrag() {
        const wrapper = document.getElementById('persistent-music-player');
        if (!wrapper || wrapper.dataset.dragBound === 'true') return;

        // 判断是否应该忽略该元素 - 只忽略真正的交互元素
        const shouldIgnore = target => {
            if (!target) return true;
            
            // 直接点击按钮、链接、输入框等
            const tagName = target.tagName;
            if (tagName === 'BUTTON' || tagName === 'A' || tagName === 'INPUT' || tagName === 'AUDIO') {
                return true;
            }
            
            // 检查是否在可点击元素内（播放按钮）
            const playBtn = target.closest('.music-play-btn');
            if (playBtn) {
                return true;
            }
            
            // 检查是否在控制按钮区域（但允许拖拽控制区域外的部分）
            const controls = target.closest('.music-controls');
            if (controls) {
                // 如果点击的是控制按钮本身，忽略；否则允许拖拽
                return target.closest('button') !== null;
            }
            
            // 其他所有区域都允许拖拽
            return false;
        };

        // 清除所有文本选择
        const clearSelection = () => {
            try {
                if (window.getSelection) {
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        selection.removeAllRanges();
                    }
                }
                if (document.selection && document.selection.empty) {
                    document.selection.empty();
                }
            } catch (e) {}
        };

        const startDrag = e => {
            // 检查是否应该忽略
            if (shouldIgnore(e.target)) {
                return;
            }
            
            // 立即阻止默认行为
            e.preventDefault();
            e.stopPropagation();
            
            // 清除文本选择
            clearSelection();
            
            // 计算偏移量
            const eventPoint = e.touches ? e.touches[0] : e;
            const rect = wrapper.getBoundingClientRect();
            dragOffset.x = eventPoint.clientX - rect.left;
            dragOffset.y = eventPoint.clientY - rect.top;
            
            // 立即启动拖拽状态
            isDragging = true;
            wrapper.classList.add('dragging');
            
            // 禁用文本选择
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            document.body.style.mozUserSelect = 'none';
            document.body.style.msUserSelect = 'none';
            
            // 绑定全局事件
            const handleMove = (event) => {
                if (!isDragging) return;
                event.preventDefault();
                clearSelection();
                
                const point = event.touches ? event.touches[0] : event;
                const playerRect = wrapper.getBoundingClientRect();
                let left = point.clientX - dragOffset.x;
                let top = point.clientY - dragOffset.y;
                
                // 限制在视口内
                const maxLeft = window.innerWidth - playerRect.width - 10;
                const maxTop = window.innerHeight - playerRect.height - 10;
                left = Math.max(10, Math.min(left, maxLeft));
                top = Math.max(10, Math.min(top, maxTop));
                
                wrapper.style.left = `${left}px`;
                wrapper.style.top = `${top}px`;
                wrapper.style.right = 'auto';
                wrapper.style.bottom = 'auto';
            };
            
            const handleEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                wrapper.classList.remove('dragging');
                
                // 恢复文本选择
                document.body.style.userSelect = '';
                document.body.style.webkitUserSelect = '';
                document.body.style.mozUserSelect = '';
                document.body.style.msUserSelect = '';
                
                // 移除事件监听
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

        // 绑定事件
        wrapper.addEventListener('mousedown', startDrag, { passive: false });
        wrapper.addEventListener('touchstart', startDrag, { passive: false });
        
        // 阻止文本选择
        wrapper.addEventListener('selectstart', e => {
            if (!shouldIgnore(e.target)) {
                e.preventDefault();
            }
        });
        
        wrapper.dataset.dragBound = 'true';
    }

    // 播放音乐（保留用于兼容，但主要使用playTrackByIndex）
    function playMusic(btn) {
        // 如果btn存在，尝试从data属性获取信息
        if (btn && btn.closest) {
            const musicItem = btn.closest('.music-item');
            if (musicItem) {
                const src = musicItem.getAttribute('data-src');
                const index = musicPlaylist.findIndex(track => track.src === src);
                if (index !== -1) {
                    playTrackByIndex(index);
                    return;
                }
            }
        }
        
        // 如果没有找到，播放第一首
        if (musicPlaylist.length > 0) {
            playTrackByIndex(0);
        }
    }
    
    // 监听音频播放状态
    function initAudioEvents() {
        const audio = document.getElementById('music-audio');
        if (!audio) return;
        if (audio.dataset.eventsBound === 'true') return;
        
        audio.addEventListener('play', function() {
            setVisualState(true);
            updatePlayPauseButton(false);
        });
        
        audio.addEventListener('pause', function() {
            setVisualState(false);
            updatePlayPauseButton(true);
        });
        
        audio.addEventListener('ended', function() {
            setVisualState(false);
            resetProgressRing();
            updatePlayPauseButton(true);
            // 自动播放下一首
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
            const currentSrc = audio.src;
            const errorCode = audio.error ? audio.error.code : 'unknown';
            const errorMessage = audio.error ? audio.error.message : '未知错误';
            
            console.error('错误详情:', {
                code: errorCode,
                message: errorMessage,
                src: currentSrc
            });
            
            // 错误代码说明：
            // MEDIA_ERR_ABORTED (1): 用户中止
            // MEDIA_ERR_NETWORK (2): 网络错误
            // MEDIA_ERR_DECODE (3): 解码错误（通常是格式不支持）
            // MEDIA_ERR_SRC_NOT_SUPPORTED (4): 格式不支持或文件不存在
            
            if (errorCode === 4) {
                console.warn('文件格式可能不支持或文件不存在');
            }
        });

        audio.dataset.eventsBound = 'true';
    }

    // 初始化
    function initMusicPlayer() {
        // 绑定全局函数
        window.toggleMusicPlayer = toggleMusicPlayer;
        window.minimizeMusicPlayer = minimizeMusicPlayer;
        window.playMusic = playMusic;
        window.toggleCurrentTrack = toggleCurrentTrack;
        window.togglePlayPause = togglePlayPause;
        window.playPreviousTrack = playPreviousTrack;
        window.playNextTrack = playNextTrack;

        if (!globalEventsBound) {
            document.addEventListener('contextmenu', handleRightClick);
            document.addEventListener('touchstart', handleTouchStart, { passive: true });
            document.addEventListener('touchend', handleTouchEnd, { passive: true });
            globalEventsBound = true;
        }

        // 初始化音频事件
        initAudioEvents();
        initProgressRing();
        resetProgressRing();
        initDrag();
        initPlaylistMarker();
        setVisualMeta('待播放', '未知歌手');
        setVisualState(false);

        const circlePlay = document.getElementById('play');
        const circlePause = document.getElementById('pause');
        [circlePlay, circlePause].forEach(btn => {
            if (btn && btn.dataset.bound !== 'true') {
                btn.addEventListener('click', toggleCurrentTrack);
                btn.dataset.bound = 'true';
            }
        });

        // 标记按钮已绑定事件
        const btn = document.querySelector('.music-toggle-btn');
        if (btn) {
            btn.setAttribute('data-events-bound', 'true');
        }
    }

    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMusicPlayer);
    } else {
        initMusicPlayer();
    }

    // 支持PJAX重新加载
    if (window.pjax) {
        document.addEventListener('pjax:complete', initMusicPlayer);
    }
})();

