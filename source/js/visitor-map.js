// 访问者地理位置显示 - 美化版
(function() {
    var visitorData = null;

    function getVisitorLocation() {
        fetch('https://api.ipify.org?format=json')
            .then(function(r) { return r.json(); })
            .then(function(ipData) {
                return fetch('https://ipapi.co/' + ipData.ip + '/json/')
                    .then(function(r) { return r.json(); })
                    .then(function(data) {
                        data.ip = ipData.ip;
                        return data;
                    });
            })
            .then(function(data) {
                if (data && data.city) {
                    var now = new Date();
                    var timeStr = now.getFullYear() + '-' +
                        String(now.getMonth() + 1).padStart(2, '0') + '-' +
                        String(now.getDate()).padStart(2, '0') + ' ' +
                        String(now.getHours()).padStart(2, '0') + ':' +
                        String(now.getMinutes()).padStart(2, '0');

                    visitorData = {
                        ip: data.ip || 'Unknown',
                        city: data.city,
                        region: data.region || '',
                        country: data.country_name || '',
                        lat: data.latitude,
                        lon: data.longitude,
                        isp: data.org || '',
                        time: timeStr
                    };

                    renderAnnouncement();
                    renderMapCard();
                    loadMap();
                } else {
                    renderAnnouncement();
                }
            })
            .catch(function(err) {
                console.log('获取位置信息失败:', err);
                renderAnnouncement();
            });
    }

    // 渲染公告模块（welcome + 创意内容）
    function renderAnnouncement() {
        var announcement = document.querySelector('.card-announcement .announcement_content');
        if (!announcement) return;

        var now = new Date();
        var hour = now.getHours();
        var greeting = '';
        if (hour < 6) greeting = '夜深了，注意休息';
        else if (hour < 12) greeting = '早安，新的一天开始了';
        else if (hour < 14) greeting = '午安，记得吃饭';
        else if (hour < 18) greeting = '下午好，继续加油';
        else if (hour < 22) greeting = '晚上好，放松一下';
        else greeting = '夜深了，早点休息';

        announcement.innerHTML =
            '<div style="text-align:center;padding:12px 0;">' +
                '<div style="font-size:28px;margin-bottom:8px;">' + (hour >= 6 && hour < 18 ? '☀️' : '🌙') + '</div>' +
                '<div style="color:#333;font-size:15px;font-weight:600;margin-bottom:4px;">welcome to my Blog</div>' +
                '<div style="color:#888;font-size:12px;">' + greeting + '</div>' +
            '</div>';
    }

    // 渲染地图模块（单独的卡片）
    function renderMapCard() {
        var announcement = document.querySelector('.card-announcement');
        if (!announcement) return;

        var mapCard = document.createElement('div');
        mapCard.className = 'card-widget card-map';
        mapCard.style.cssText = 'margin-bottom:20px;padding:0;overflow:hidden;background:linear-gradient(135deg,rgba(230,244,255,0.8),rgba(240,248,255,0.8));';
        mapCard.innerHTML =
            '<div style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.05);display:flex;align-items:center;gap:8px;">' +
                '<span style="font-size:16px;">🗺️</span>' +
                '<span style="color:#2c5282;font-size:14px;font-weight:600;">访客地图</span>' +
            '</div>' +
            '<div style="padding:10px 14px;">' +
                '<div id="mini-map-loading" style="text-align:center;padding:20px;color:#4299e1;font-size:12px;">加载中...</div>' +
                '<div id="mini-map-svg" style="display:none;border-radius:8px;overflow:hidden;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.1);" onclick="expandMap()"></div>' +
            '</div>' +
            '<div style="padding:10px 16px;border-top:1px solid rgba(0,0,0,0.05);background:rgba(255,255,255,0.5);">' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">' +
                    '<div style="display:flex;align-items:center;gap:4px;"><span style="color:#718096;">IP</span><span style="color:#4299e1;font-family:monospace;font-weight:500;">' + visitorData.ip + '</span></div>' +
                    '<div style="display:flex;align-items:center;gap:4px;"><span style="color:#718096;">📍</span><span style="color:#4a5568;">' + visitorData.city + '</span></div>' +
                    '<div style="display:flex;align-items:center;gap:4px;"><span style="color:#718096;">🌐</span><span style="color:#4a5568;">' + visitorData.country + '</span></div>' +
                    '<div style="display:flex;align-items:center;gap:4px;"><span style="color:#718096;">🕐</span><span style="color:#4a5568;">' + visitorData.time + '</span></div>' +
                '</div>' +
            '</div>';

        // 插入到公告下方
        announcement.parentNode.insertBefore(mapCard, announcement.nextSibling);

        // 创建悬浮放大容器
        var expandedContainer = document.createElement('div');
        expandedContainer.id = 'expanded-map-container';
        expandedContainer.style.cssText = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:10000;background:rgba(0,0,0,0.7);backdrop-filter:blur(5px);';
        expandedContainer.onclick = function(e) { if (e.target === expandedContainer) collapseMap(); };
        document.body.appendChild(expandedContainer);

        if (!document.getElementById('map-animations')) {
            var style = document.createElement('style');
            style.id = 'map-animations';
            style.textContent = '@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(30px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}';
            document.head.appendChild(style);
        }
    }

    function loadMap() {
        fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
            .then(function(r) { return r.json(); })
            .then(function(geojson) {
                window._mapGeoJSON = geojson;
                var loading = document.getElementById('mini-map-loading');
                var svg = document.getElementById('mini-map-svg');
                if (loading) loading.style.display = 'none';
                if (svg) {
                    svg.style.display = 'block';
                    svg.innerHTML = buildMiniMap(geojson);
                }
            })
            .catch(function(err) {
                var loading = document.getElementById('mini-map-loading');
                if (loading) loading.textContent = '加载失败';
            });
    }

    function buildMiniMap(geojson) {
        var markerX = (visitorData.lon + 180) * (1000 / 360);
        var markerY = (90 - visitorData.lat) * (500 / 180);

        var svg = '<svg viewBox="0 0 1000 500" style="width:100%;height:auto;">';
        svg += '<defs><linearGradient id="chinaGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#05f2f2;stop-opacity:0.7"/><stop offset="100%" style="stop-color:#439aff;stop-opacity:0.7"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
        svg += '<rect fill="#0d1527" width="1000" height="500" rx="4"/>';
        svg += '<defs><pattern id="mini-grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(5,242,242,0.04)" stroke-width="0.5"/></pattern></defs>';
        svg += '<rect fill="url(#mini-grid)" width="1000" height="500"/>';

        geojson.features.forEach(function(feature) {
            var path = getPath(feature);
            if (path) {
                var isChina = feature.properties.name === 'China';
                var fill = isChina ? 'url(#chinaGrad)' : 'rgba(5,242,242,0.08)';
                var stroke = isChina ? 'rgba(5,242,242,0.9)' : 'rgba(5,242,242,0.25)';
                svg += '<path d="' + path + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + (isChina ? '1.5' : '0.4') + '"/>';
            }
        });

        svg += '<circle cx="' + markerX + '" cy="' + markerY + '" r="25" fill="rgba(5,242,242,0.2)"/>';
        svg += '<circle cx="' + markerX + '" cy="' + markerY + '" r="8" fill="none" stroke="#05f2f2" stroke-width="1" opacity="0.8"><animate attributeName="r" values="5;20;5" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite"/></circle>';
        svg += '<circle cx="' + markerX + '" cy="' + markerY + '" r="5" fill="#05f2f2" filter="url(#glow)"/>';
        svg += '<circle cx="' + markerX + '" cy="' + markerY + '" r="2" fill="#fff"/>';
        svg += '</svg>';
        return svg;
    }

    function getPath(feature) {
        var coords = feature.geometry.coordinates;
        var path = '';
        if (feature.geometry.type === 'Polygon') {
            coords.forEach(function(ring) { path += coordsToPath(ring); });
        } else if (feature.geometry.type === 'MultiPolygon') {
            coords.forEach(function(polygon) {
                polygon.forEach(function(ring) { path += coordsToPath(ring); });
            });
        }
        return path;
    }

    function coordsToPath(coords) {
        var path = '';
        coords.forEach(function(coord, i) {
            var x = (coord[0] + 180) * (1000 / 360);
            var y = (90 - coord[1]) * (500 / 180);
            path += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
        });
        return path + 'Z';
    }

    window.expandMap = function() {
        if (!window._mapGeoJSON || !visitorData) return;
        var container = document.getElementById('expanded-map-container');
        if (container) {
            container.style.display = 'block';
            container.innerHTML = buildExpandedMap(window._mapGeoJSON);
            initExpandedMapInteraction();
        }
    };

    window.collapseMap = function() {
        var container = document.getElementById('expanded-map-container');
        if (container) {
            container.style.display = 'none';
            container.innerHTML = '';
        }
    };

    function buildExpandedMap(geojson) {
        var markerX = (visitorData.lon + 180) * (1000 / 360);
        var markerY = (90 - visitorData.lat) * (500 / 180);

        var html = '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:92%;max-width:950px;background:linear-gradient(180deg,rgba(13,21,39,0.98),rgba(21,31,52,0.99));border-radius:14px;overflow:hidden;border:1px solid rgba(48,55,69,0.5);box-shadow:0 25px 80px rgba(0,0,0,0.6);animation:slideUp 0.35s ease;">';
        html += '<div style="padding:14px 18px;border-bottom:1px solid rgba(48,55,69,0.3);display:flex;justify-content:space-between;align-items:center;background:rgba(5,242,242,0.03);">';
        html += '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:18px;">🗺️</span><span style="color:#05f2f2;font-size:15px;font-weight:600;">清茶地图</span></div>';
        html += '<div style="display:flex;gap:8px;align-items:center;">';
        html += '<button onclick="mapZoomIn()" style="width:34px;height:34px;border:none;background:rgba(5,242,242,0.12);color:#05f2f2;border-radius:8px;cursor:pointer;font-size:18px;font-weight:bold;">+</button>';
        html += '<button onclick="mapZoomOut()" style="width:34px;height:34px;border:none;background:rgba(5,242,242,0.12);color:#05f2f2;border-radius:8px;cursor:pointer;font-size:18px;font-weight:bold;">−</button>';
        html += '<button onclick="mapReset()" style="height:34px;padding:0 14px;border:none;background:rgba(5,242,242,0.12);color:#05f2f2;border-radius:8px;cursor:pointer;font-size:12px;">重置</button>';
        html += '<button onclick="collapseMap()" style="height:34px;padding:0 14px;border:none;background:rgba(245,108,108,0.15);color:#f56c6c;border-radius:8px;cursor:pointer;font-size:12px;">关闭</button>';
        html += '</div></div>';
        html += '<div id="expanded-map-content" style="padding:12px;height:420px;cursor:grab;overflow:hidden;">';
        html += '<svg id="expanded-map-svg" viewBox="0 0 1000 500" style="width:100%;height:100%;transition:transform 0.3s ease;transform-origin:center center;">';
        html += '<defs><linearGradient id="chinaGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#05f2f2;stop-opacity:0.7"/><stop offset="100%" style="stop-color:#439aff;stop-opacity:0.7"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
        html += '<rect fill="#0d1527" width="1000" height="500"/>';
        html += '<defs><pattern id="exp-grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(5,242,242,0.04)" stroke-width="0.5"/></pattern></defs>';
        html += '<rect fill="url(#exp-grid)" width="1000" height="500"/>';

        geojson.features.forEach(function(feature) {
            var path = getPath(feature);
            if (path) {
                var isChina = feature.properties.name === 'China';
                var fill = isChina ? 'url(#chinaGrad)' : 'rgba(5,242,242,0.08)';
                var stroke = isChina ? 'rgba(5,242,242,0.9)' : 'rgba(5,242,242,0.25)';
                html += '<path d="' + path + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + (isChina ? '1.5' : '0.4') + '"/>';
            }
        });

        html += '<circle cx="' + markerX + '" cy="' + markerY + '" r="40" fill="rgba(5,242,242,0.2)"/>';
        html += '<circle cx="' + markerX + '" cy="' + markerY + '" r="15" fill="none" stroke="#05f2f2" stroke-width="1.5" opacity="0.8"><animate attributeName="r" values="8;35;8" dur="2.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0;0.8" dur="2.5s" repeatCount="indefinite"/></circle>';
        html += '<circle cx="' + markerX + '" cy="' + markerY + '" r="10" fill="none" stroke="#05f2f2" stroke-width="1" opacity="0.6"><animate attributeName="r" values="5;25;5" dur="2.5s" repeatCount="indefinite" begin="0.8s"/><animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite" begin="0.8s"/></circle>';
        html += '<circle cx="' + markerX + '" cy="' + markerY + '" r="7" fill="#05f2f2" filter="url(#glow)"><animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite"/></circle>';
        html += '<circle cx="' + markerX + '" cy="' + markerY + '" r="3" fill="#fff"/>';
        html += '<g transform="translate(' + markerX + ',' + (markerY - 38) + ')"><rect x="-55" y="-12" width="110" height="22" rx="4" fill="rgba(5,242,242,0.15)" stroke="rgba(5,242,242,0.5)" stroke-width="1"/><text x="0" y="4" text-anchor="middle" fill="#05f2f2" font-size="11" font-weight="bold" font-family="monospace">📍 ' + visitorData.city + '</text></g>';
        html += '</svg></div>';
        html += '<div style="padding:12px 18px;border-top:1px solid rgba(48,55,69,0.3);background:rgba(0,0,0,0.15);display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;font-size:11px;">';
        html += '<span style="color:#7e8e9e;">IP: <span style="color:#05f2f2;font-family:monospace;">' + visitorData.ip + '</span></span>';
        html += '<span style="color:#7e8e9e;">📍 <span style="color:#a7bcd1;">' + visitorData.city + ', ' + visitorData.country + '</span></span>';
        html += '<span style="color:#7e8e9e;">🕐 <span style="color:#a7bcd1;">' + visitorData.time + '</span></span>';
        html += '</div></div>';
        return html;
    }

    function initExpandedMapInteraction() {
        var content = document.getElementById('expanded-map-content');
        if (!content) return;
        var scale = 1, translateX = 0, translateY = 0;
        var dragging = false, startX = 0, startY = 0;

        content.addEventListener('wheel', function(e) {
            e.preventDefault();
            scale = Math.max(0.5, Math.min(6, scale + (e.deltaY > 0 ? -0.15 : 0.15)));
            updateTransform(scale, translateX, translateY);
        });

        content.addEventListener('mousedown', function(e) {
            dragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            content.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', function(e) {
            if (!dragging) return;
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateTransform(scale, translateX, translateY);
        });

        document.addEventListener('mouseup', function() {
            dragging = false;
            var c = document.getElementById('expanded-map-content');
            if (c) c.style.cursor = 'grab';
        });

        window._mapState = { scale: scale, translateX: translateX, translateY: translateY };
        function updateTransform(s, tx, ty) {
            var svg = document.getElementById('expanded-map-svg');
            if (svg) svg.style.transform = 'scale(' + s + ') translate(' + (tx / s) + 'px, ' + (ty / s) + 'px)';
            window._mapState = { scale: s, translateX: tx, translateY: ty };
        }
        window._updateTransform = updateTransform;
    }

    window.mapZoomIn = function() { var s = window._mapState; if (s && window._updateTransform) { s.scale = Math.min(6, s.scale + 0.5); window._updateTransform(s.scale, s.translateX, s.translateY); } };
    window.mapZoomOut = function() { var s = window._mapState; if (s && window._updateTransform) { s.scale = Math.max(0.5, s.scale - 0.5); window._updateTransform(s.scale, s.translateX, s.translateY); } };
    window.mapReset = function() { if (window._updateTransform) window._updateTransform(1, 0, 0); };

    setTimeout(getVisitorLocation, 1500);
})();
