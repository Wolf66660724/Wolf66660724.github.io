// 音乐播放器控制脚本
(function() {
    let isRotating = false;
    let longPressTimer = null;
    let isLongPress = false;

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

    // 播放音乐
    function playMusic(btn) {
        const musicItem = btn.closest('.music-item');
        const audio = document.getElementById('music-audio');
        let src = musicItem.getAttribute('data-src');
        const title = musicItem.getAttribute('data-title');
        const artist = musicItem.getAttribute('data-artist');
        
        if (!audio || !src) {
            console.error('音频元素或路径不存在');
            return;
        }
        
        // 处理文件路径：尝试多种编码方式
        function tryPlayAudio(audioSrc, attempt = 1) {
            console.log(`尝试播放 (方式${attempt}):`, audioSrc);
            
            // 先停止当前播放
            audio.pause();
            audio.currentTime = 0;
            
            // 设置新的音频源
            audio.src = audioSrc;
            
            // 加载音频
            audio.load();
            
            // 尝试播放
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('播放成功:', audioSrc);
                        // 更新当前播放信息
                        const nowPlayingTitle = document.querySelector('.now-playing-title');
                        const nowPlayingArtist = document.querySelector('.now-playing-artist');
                        if (nowPlayingTitle) nowPlayingTitle.textContent = title;
                        if (nowPlayingArtist) nowPlayingArtist.textContent = artist;
                        
                        // 更新UI状态
                        document.querySelectorAll('.music-item').forEach(item => {
                            item.classList.remove('playing');
                        });
                        document.querySelectorAll('.music-play-btn').forEach(b => {
                            b.textContent = '▶';
                            b.classList.remove('playing');
                        });
                        
                        musicItem.classList.add('playing');
                        btn.textContent = '⏸';
                        btn.classList.add('playing');
                        
                        // 显示音频控件
                        audio.style.display = 'block';
                    })
                    .catch(err => {
                        console.error(`播放失败 (方式${attempt}):`, err, audioSrc);
                        
                        // 如果第一次失败，尝试其他编码方式
                        if (attempt === 1) {
                            // 方式2: 只编码文件名部分
                            const pathParts = src.split('/');
                            const fileName = pathParts.pop();
                            const basePath = pathParts.join('/');
                            const encodedFileName = encodeURIComponent(fileName);
                            tryPlayAudio(basePath + '/' + encodedFileName, 2);
                        } else if (attempt === 2) {
                            // 方式3: 编码整个路径
                            tryPlayAudio(encodeURI(src), 3);
                        } else if (attempt === 3) {
                            // 方式4: 尝试直接使用原始路径（不编码）
                            tryPlayAudio(src, 4);
                        } else {
                            // 所有方式都失败
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
                            
                            btn.textContent = '▶';
                            btn.classList.remove('playing');
                            musicItem.classList.remove('playing');
                        }
                    });
            }
        }
        
        // 开始尝试播放（方式1: 编码文件名）
        const pathParts = src.split('/');
        const fileName = pathParts.pop();
        const basePath = pathParts.join('/');
        const encodedFileName = encodeURIComponent(fileName);
        tryPlayAudio(basePath + '/' + encodedFileName, 1);
    }
    
    // 监听音频播放状态
    function initAudioEvents() {
        const audio = document.getElementById('music-audio');
        if (!audio) return;
        
        audio.addEventListener('play', function() {
            const playingItem = document.querySelector('.music-item.playing');
            if (playingItem) {
                const btn = playingItem.querySelector('.music-play-btn');
                if (btn) {
                    btn.textContent = '⏸';
                }
            }
        });
        
        audio.addEventListener('pause', function() {
            const playingItem = document.querySelector('.music-item.playing');
            if (playingItem) {
                const btn = playingItem.querySelector('.music-play-btn');
                if (btn) {
                    btn.textContent = '▶';
                }
            }
        });
        
        audio.addEventListener('ended', function() {
            const playingItem = document.querySelector('.music-item.playing');
            if (playingItem) {
                playingItem.classList.remove('playing');
                const btn = playingItem.querySelector('.music-play-btn');
                if (btn) {
                    btn.textContent = '▶';
                    btn.classList.remove('playing');
                }
            }
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
    }

    // 初始化
    function initMusicPlayer() {
        // 绑定全局函数
        window.toggleMusicPlayer = toggleMusicPlayer;
        window.minimizeMusicPlayer = minimizeMusicPlayer;
        window.playMusic = playMusic;

        // 绑定右键事件（桌面端）
        document.addEventListener('contextmenu', handleRightClick);

        // 绑定触摸事件（移动端）
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        // 初始化音频事件
        initAudioEvents();

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

