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
                    loadMap();
                }
            })
            .catch(function(err) {
                console.log('获取位置信息失败:', err);
            });
    }

    function renderAnnouncement() {
        var announcement = document.querySelector('.card-announcement .announcement_content');
        if (!announcement) return;

        announcement.innerHTML =
            // 欢迎语
            '<div style="margin-bottom:12px;">' +
                '<div style="color:#333;font-size:15px;font-weight:600;">welcome to my Blog</div>' +
            '</div>' +
            // 地图卡片
            '<div onclick="expandMap()" style="background:linear-gradient(145deg,rgba(30,40,60,0.9),rgba(40,55,80,0.9));border-radius:10px;border:1px solid rgba(80,100,140,0.3);cursor:pointer;transition:all 0.3s ease;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.2);">' +
                // 标题栏
                '<div style="padding:10px 14px;border-bottom:1px solid rgba(80,100,140,0.2);display:flex;align-items:center;gap:8px;">' +
                    '<span style="font-size:14px;">🗺️</span>' +
                    '<span style="color:#05f2f2;font-size:13px;font-weight:600;">清茶地图</span>' +
                '</div>' +
                // 地图
                '<div style="padding:8px 12px;">' +
                    '<div id="mini-map-loading" style="text-align:center;padding:25px;color:#05f2f2;font-size:11px;">加载中...</div>' +
                    '<div id="mini-map-svg" style="display:none;border-radius:6px;overflow:hidden;"></div>' +
                '</div>' +
                // 信息栏
                '<div style="padding:10px 14px;border-top:1px solid rgba(80,100,140,0.2);background:rgba(0,0,0,0.1);">' +
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:10px;">' +
                        '<div style="display:flex;align-items:center;gap:5px;">' +
                            '<span style="color:#7e8e9e;">IP</span>' +
                            '<span style="color:#05f2f2;font-family:monospace;">' + visitorData.ip + '</span>' +
                        '</div>' +
                        '<div style="display:flex;align-items:center;gap:5px;">' +
                            '<span style="color:#7e8e9e;">📍</span>' +
                            '<span style="color:#a7bcd1;">' + visitorData.city + '</span>' +
                        '</div>' +
                        '<div style="display:flex;align-items:center;gap:5px;">' +
                            '<span style="color:#7e8e9e;">🌐</span>' +
                            '<span style="color:#a7bcd1;">' + visitorData.country + '</span>' +
                        '</div>' +
                        '<div style="display:flex;align-items:center;gap:5px;">' +
                            '<span style="color:#7e8e9e;">🕐</span>' +
                            '<span style="color:#a7bcd1;">' + visitorData.time + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        // 创建悬浮放大容器
        var expandedContainer = document.createElement('div');
        expandedContainer.id = 'expanded-map-container';
        expandedContainer.style.cssText = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:10000;background:rgba(0,0,0,0.7);backdrop-filter:blur(5px);';
        expandedContainer.onclick = function(e) {
            if (e.target === expandedContainer) collapseMap();
        };
        document.body.appendChild(expandedContainer);

        // 添加动画样式
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
                document.getElementById('mini-map-loading').style.display = 'none';
                document.getElementById('mini-map-svg').style.display = 'block';
                document.getElementById('mini-map-svg').innerHTML = buildMiniMap(geojson);
            })
            .catch(function(err) {
                document.getElementById('mini-map-loading').textContent = '加载失败';
            });
    }

    function buildMiniMap(geojson) {
        var markerX = (visitorData.lon + 180) * (1000 / 360);
        var markerY = (90 - visitorData.lat) * (500 / 180);

        var svg = '<svg viewBox="0 0 1000 500" style="width:100%;height:auto;">';
        svg += getMapDefs();
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

        svg += '<circle cx="' + markerX + '" cy="' + markerY + '" r="25" fill="url(#markerGlow)"/>';
        svg += '<circle cx="' + markerX + '" cy="' + markerY + '" r="8" fill="none" stroke="#05f2f2" stroke-width="1" opacity="0.8"><animate attributeName="r" values="5;20;5" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite"/></circle>';
        svg += '<circle cx="' + markerX + '" cy="' + markerY + '" r="5" fill="#05f2f2" filter="url(#glow)"/>';
        svg += '<circle cx="' + markerX + '" cy="' + markerY + '" r="2" fill="#fff"/>';
        svg += '</svg>';
        return svg;
    }

    function buildExpandedMap(geojson) {
        var markerX = (visitorData.lon + 180) * (1000 / 360);
        var markerY = (90 - visitorData.lat) * (500 / 180);

        var html =
            '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:92%;max-width:950px;background:linear-gradient(180deg,rgba(13,21,39,0.98),rgba(21,31,52,0.99));border-radius:14px;overflow:hidden;border:1px solid rgba(48,55,69,0.5);box-shadow:0 25px 80px rgba(0,0,0,0.6);animation:slideUp 0.35s ease;">' +
            // 头部
            '<div style="padding:14px 18px;border-bottom:1px solid rgba(48,55,69,0.3);display:flex;justify-content:space-between;align-items:center;background:rgba(5,242,242,0.03);">' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                    '<span style="font-size:18px;">🗺️</span>' +
                    '<span style="color:#05f2f2;font-size:15px;font-weight:600;">清茶地图</span>' +
                '</div>' +
                '<div style="display:flex;gap:8px;align-items:center;">' +
                    '<button onclick="mapZoomIn()" style="width:34px;height:34px;border:none;background:rgba(5,242,242,0.12);color:#05f2f2;border-radius:8px;cursor:pointer;font-size:18px;font-weight:bold;transition:all 0.2s;">+</button>' +
                    '<button onclick="mapZoomOut()" style="width:34px;height:34px;border:none;background:rgba(5,242,242,0.12);color:#05f2f2;border-radius:8px;cursor:pointer;font-size:18px;font-weight:bold;transition:all 0.2s;">−</button>' +
                    '<button onclick="mapReset()" style="height:34px;padding:0 14px;border:none;background:rgba(5,242,242,0.12);color:#05f2f2;border-radius:8px;cursor:pointer;font-size:12px;transition:all 0.2s;">重置</button>' +
                    '<button onclick="collapseMap()" style="height:34px;padding:0 14px;border:none;background:rgba(245,108,108,0.15);color:#f56c6c;border-radius:8px;cursor:pointer;font-size:12px;transition:all 0.2s;">关闭</button>' +
                '</div>' +
            '</div>' +
            // 地图
            '<div id="expanded-map-content" style="padding:12px;height:420px;cursor:grab;overflow:hidden;">' +
                '<svg id="expanded-map-svg" viewBox="0 0 1000 500" style="width:100%;height:100%;transition:transform 0.3s ease;transform-origin:center center;">';

        html += getMapDefs();
        html += '<rect fill="#0d1527" width="1000" height="500"/>';
        html += '<defs><pattern id="exp-grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(5,242,242,0.04)" stroke-width="0.5"/></pattern></defs>';
        html += '<rect fill="url(#exp-grid)" width="1000" height="500"/>';

        geojson.features.forEach(function(feature) {
            var path = getPath(feature);
            if (path) {
                var isChina = feature.properties.name === 'China';
                var fill = isChina ? 'url(#chinaGrad)' : 'rgba(5,242,242,0.08)';
                var stroke = isChina ? 'rgba(5,242,242,0.9)' : 'rgba(5,242,242,0.25)';
                html += '<path d="' + path + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + (isChina ? '1.5' : '0.4') + (isChina ? '" filter="url(#softGlow)"' : '"') + ' style="transition: fill 0.3s ease;" onmouseover="this.setAttribute(\'fill\',\'rgba(5,242,242,0.18)\')" onmouseout="this.setAttribute(\'fill\',\'' + fill + '\')"/>';
            }
        });

        // 标记点
        html += '<circle cx="' + markerX + '" cy="' + markerY + '" r="40" fill="url(#markerGlow)"/>';
        html += '<circle cx="' + markerX + '" cy="' + markerY + '" r="15" fill="none" stroke="#05f2f2" stroke-width="1.5" opacity="0.8"><animate attributeName="r" values="8;35;8" dur="2.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0;0.8" dur="2.5s" repeatCount="indefinite"/></circle>';
        html += '<circle cx="' + markerX + '" cy="' + markerY + '" r="10" fill="none" stroke="#05f2f2" stroke-width="1" opacity="0.6"><animate attributeName="r" values="5;25;5" dur="2.5s" repeatCount="indefinite" begin="0.8s"/><animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite" begin="0.8s"/></circle>';
        html += '<circle cx="' + markerX + '" cy="' + markerY + '" r="7" fill="#05f2f2" filter="url(#glow)"><animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite"/></circle>';
        html += '<circle cx="' + markerX + '" cy="' + markerY + '" r="3" fill="#fff"/>';
        html += '<g transform="translate(' + markerX + ',' + (markerY - 38) + ')"><rect x="-55" y="-12" width="110" height="22" rx="4" fill="rgba(5,242,242,0.15)" stroke="rgba(5,242,242,0.5)" stroke-width="1"/><text x="0" y="4" text-anchor="middle" fill="#05f2f2" font-size="11" font-weight="bold" font-family="monospace">📍 ' + visitorData.city + '</text></g>';

        html += '</svg></div>' +
            // 信息栏
            '<div style="padding:12px 18px;border-top:1px solid rgba(48,55,69,0.3);background:rgba(0,0,0,0.15);display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;font-size:11px;">' +
                '<span style="color:#7e8e9e;">IP: <span style="color:#05f2f2;font-family:monospace;">' + visitorData.ip + '</span></span>' +
                '<span style="color:#7e8e9e;">📍 <span style="color:#a7bcd1;">' + visitorData.city + ', ' + visitorData.country + '</span></span>' +
                '<span style="color:#7e8e9e;">🕐 <span style="color:#a7bcd1;">' + visitorData.time + '</span></span>' +
                '<span style="color:#7e8e9e;">📡 <span style="color:#a7bcd1;">' + visitorData.isp + '</span></span>' +
            '</div>' +
            '</div>';

        return html;
    }

    function getMapDefs() {
        return '<defs>' +
            '<linearGradient id="chinaGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#05f2f2;stop-opacity:0.7"/><stop offset="100%" style="stop-color:#439aff;stop-opacity:0.7"/></linearGradient>' +
            '<filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
            '<filter id="softGlow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
            '<radialGradient id="markerGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" style="stop-color:#05f2f2;stop-opacity:0.6"/><stop offset="100%" style="stop-color:#05f2f2;stop-opacity:0"/></radialGradient>' +
            '</defs>';
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

    function initExpandedMapInteraction() {
        var content = document.getElementById('expanded-map-content');
        if (!content) return;

        var scale = 1, translateX = 0, translateY = 0;
        var dragging = false, startX = 0, startY = 0;

        content.addEventListener('wheel', function(e) {
            e.preventDefault();
            var delta = e.deltaY > 0 ? -0.15 : 0.15;
            scale = Math.max(0.5, Math.min(6, scale + delta));
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
            if (svg) {
                svg.style.transform = 'scale(' + s + ') translate(' + (tx / s) + 'px, ' + (ty / s) + 'px)';
            }
            window._mapState = { scale: s, translateX: tx, translateY: ty };
        }

        window._updateTransform = updateTransform;
    }

    window.mapZoomIn = function() {
        var state = window._mapState;
        if (state && window._updateTransform) {
            state.scale = Math.min(6, state.scale + 0.5);
            window._updateTransform(state.scale, state.translateX, state.translateY);
        }
    };

    window.mapZoomOut = function() {
        var state = window._mapState;
        if (state && window._updateTransform) {
            state.scale = Math.max(0.5, state.scale - 0.5);
            window._updateTransform(state.scale, state.translateX, state.translateY);
        }
    };

    window.mapReset = function() {
        if (window._updateTransform) {
            window._updateTransform(1, 0, 0);
        }
    };

    setTimeout(getVisitorLocation, 1500);
})();
