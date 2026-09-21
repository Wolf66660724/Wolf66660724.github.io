// 访问者地理位置显示 - 美化版
(function() {
    var visitorData = null;

    // 接口返回的字段直接拼进 innerHTML，先转义一道
    function esc(v) {
        return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    // 国家代码 -> 中文名（ipinfo.io 只返回 CN 这样的国家代码）
    var COUNTRY_NAMES = {
        CN: '中国', HK: '中国香港', MO: '中国澳门', TW: '中国台湾',
        US: '美国', JP: '日本', KR: '韩国', SG: '新加坡', MY: '马来西亚',
        TH: '泰国', VN: '越南', PH: '菲律宾', ID: '印度尼西亚', IN: '印度',
        GB: '英国', DE: '德国', FR: '法国', NL: '荷兰', RU: '俄罗斯',
        CA: '加拿大', AU: '澳大利亚', BR: '巴西'
    };

    // 有些接口返回的是国名（China）而非国码（CN），统一归一化
    var NAME_TO_CODE = {
        'CHINA': 'CN', 'UNITED STATES': 'US', 'JAPAN': 'JP', 'SINGAPORE': 'SG',
        'SOUTH KOREA': 'KR', 'KOREA': 'KR', 'UNITED KINGDOM': 'GB', 'GERMANY': 'DE',
        'FRANCE': 'FR', 'CANADA': 'CA', 'AUSTRALIA': 'AU', 'RUSSIA': 'RU',
        'INDIA': 'IN', 'BRAZIL': 'BR', 'NETHERLANDS': 'NL', 'THAILAND': 'TH',
        'VIETNAM': 'VN', 'MALAYSIA': 'MY', 'INDONESIA': 'ID', 'PHILIPPINES': 'PH'
    };

    // 城市坐标校正表：备用接口（ip.sb 等）有「城市名对、坐标错」的情况，
    // 命中时用本表坐标覆盖，保证地图标记落在正确城市。
    var CITY_COORDS = {
        'Beijing': [39.90, 116.41],      'Shanghai': [31.23, 121.47],
        'Tianjin': [39.13, 117.20],      'Chongqing': [29.56, 106.55],
        'Shijiazhuang': [38.04, 114.51], 'Taiyuan': [37.87, 112.55],
        'Hohhot': [40.84, 111.75],       'Shenyang': [41.81, 123.43],
        'Changchun': [43.82, 125.32],    'Harbin': [45.80, 126.53],
        'Nanjing': [32.06, 118.80],      'Hangzhou': [30.27, 120.16],
        'Hefei': [31.86, 117.28],        'Fuzhou': [26.07, 119.30],
        'Nanchang': [28.68, 115.86],     'Jinan': [36.65, 117.12],
        'Zhengzhou': [34.75, 113.63],    'Wuhan': [30.59, 114.31],
        'Changsha': [28.23, 112.94],     'Guangzhou': [23.13, 113.26],
        'Nanning': [22.82, 108.32],      'Haikou': [20.04, 110.32],
        'Chengdu': [30.57, 104.07],      'Guiyang': [26.65, 106.63],
        'Kunming': [25.04, 102.71],      'Lhasa': [29.65, 91.14],
        "Xi'an": [34.34, 108.94],        'Lanzhou': [36.06, 103.83],
        'Xining': [36.62, 101.78],       'Yinchuan': [38.49, 106.23],
        'Urumqi': [43.83, 87.62],        'Shenzhen': [22.54, 114.06],
        'Suzhou': [31.30, 120.58],       'Qingdao': [36.07, 120.38],
        'Dalian': [38.91, 121.61],       'Xiamen': [24.48, 118.09]
    };

    // 从城市名里取坐标（兼容 'Hefei' / '合肥' / '安徽, 合肥' 之类的写法）
    function lookupCityCoords(name) {
        if (!name) return null;
        var key = String(name).trim();
        if (CITY_COORDS[key]) return CITY_COORDS[key];
        // 模糊匹配：城市名可能带后缀或前后缀
        for (var k in CITY_COORDS) {
            if (key.indexOf(k) >= 0) return CITY_COORDS[k];
        }
        return null;
    }

    function getVisitorLocation() {
        // 主力 ipinfo.io：实测对中国 IP 城市与经纬度都准确
        //（ipwho.is 会把合肥的 IP 标成北京，故降级为备用）
        var sources = [
            {
                url: 'https://ipinfo.io/json',
                map: function (d) {
                    var loc = String(d.loc || '').split(',');
                    return {
                        ip: d.ip, city: d.city, region: d.region,
                        country: d.country, org: d.org,
                        lat: parseFloat(loc[0]), lon: parseFloat(loc[1])
                    };
                }
            },
            {
                url: 'https://api.ip.sb/geoip',
                map: function (d) {
                    return {
                        ip: d.ip, city: d.city, region: d.region, country: d.country,
                        org: d.isp || d.organization,
                        lat: d.latitude, lon: d.longitude
                    };
                }
            },
            {
                url: 'https://ipwho.is/',
                map: function (d) {
                    return {
                        ip: d.ip, city: d.city, region: d.region, country: d.country,
                        org: d.connection && d.connection.org,
                        lat: d.latitude, lon: d.longitude
                    };
                }
            }
        ];

        function useGeo(d) {
            var now = new Date();
            var pad = function (n) { return String(n).padStart(2, '0'); };
            var timeStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' +
                pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());

            var rawCountry = String(d.country || '').trim().toUpperCase();
            var code = NAME_TO_CODE[rawCountry] || rawCountry;
            // 命中校正表时以表内坐标为准（备用接口的经纬度可能不准）
            var fixed = lookupCityCoords(d.city);
            visitorData = {
                ip: d.ip || 'Unknown',
                city: d.city || '',
                region: d.region || '',
                country: COUNTRY_NAMES[code] || (rawCountry.length > 3 ? d.country : code) || '',
                lat: fixed ? fixed[0] : d.lat,
                lon: fixed ? fixed[1] : d.lon,
                isp: d.org || '',
                time: timeStr
            };

            renderAnnouncement();
            renderMapCard();
            loadMap();
        }

        function trySource(i) {
            if (i >= sources.length) {
                console.log('获取位置信息失败：所有地理接口都不可用');
                renderAnnouncement();
                return;
            }
            var s = sources[i];
            fetch(s.url)
                .then(function (r) { return r.json(); })
                .then(function (raw) {
                    var d = s.map(raw);
                    if (!d || !d.city || isNaN(d.lat) || isNaN(d.lon)) {
                        throw new Error('数据不完整');
                    }
                    useGeo(d);
                })
                .catch(function (err) {
                    console.log('地理接口失败，换下一个:', s.url, err && err.message);
                    trySource(i + 1);
                });
        }

        trySource(0);
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
                    // IPv6 最长 39 个字符，单独占一整行并允许断行，
                    // 否则它会把右边几格挤变形
                    '<div style="grid-column:1/-1;display:flex;align-items:baseline;gap:4px;min-width:0;">' +
                        '<span style="color:#718096;flex:0 0 auto;">IP</span>' +
                        '<span style="color:#4299e1;font-family:monospace;font-weight:500;min-width:0;overflow-wrap:anywhere;word-break:break-all;line-height:1.45;">' + esc(visitorData.ip) + '</span>' +
                    '</div>' +
                    '<div style="display:flex;align-items:center;gap:4px;min-width:0;"><span style="color:#718096;flex:0 0 auto;">📍</span><span style="color:#4a5568;min-width:0;overflow-wrap:anywhere;">' + esc(visitorData.city) + '</span></div>' +
                    '<div style="display:flex;align-items:center;gap:4px;min-width:0;"><span style="color:#718096;flex:0 0 auto;">🌐</span><span style="color:#4a5568;min-width:0;overflow-wrap:anywhere;">' + esc(visitorData.country) + '</span></div>' +
                    '<div style="display:flex;align-items:center;gap:4px;min-width:0;"><span style="color:#718096;flex:0 0 auto;">🕐</span><span style="color:#4a5568;min-width:0;overflow-wrap:anywhere;">' + esc(visitorData.time) + '</span></div>' +
                '</div>' +
            '</div>';

        // 插入到公告下方
        announcement.parentNode.insertBefore(mapCard, announcement.nextSibling);

        // 创建悬浮放大容器（PJAX 重挂时先清掉旧的，避免叠加）
        var oldExpanded = document.getElementById('expanded-map-container');
        if (oldExpanded && oldExpanded.parentNode) oldExpanded.parentNode.removeChild(oldExpanded);
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
        var cached = null;
        try { cached = localStorage.getItem('world-map-v1'); } catch (e) {}
        var getGeo = cached ? Promise.resolve(JSON.parse(cached))
            : fetch('/js/world-map.json')
                .then(function(r) { return r.json(); })
                .then(function(g) { try { localStorage.setItem('world-map-v1', JSON.stringify(g)); } catch (e) {} return g; });
        getGeo
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
        html += '<g transform="translate(' + markerX + ',' + (markerY - 38) + ')"><rect x="-55" y="-12" width="110" height="22" rx="4" fill="rgba(5,242,242,0.15)" stroke="rgba(5,242,242,0.5)" stroke-width="1"/><text x="0" y="4" text-anchor="middle" fill="#05f2f2" font-size="11" font-weight="bold" font-family="monospace">📍 ' + esc(visitorData.city) + '</text></g>';
        html += '</svg></div>';
        html += '<div style="padding:12px 18px;border-top:1px solid rgba(48,55,69,0.3);background:rgba(0,0,0,0.15);display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;font-size:11px;">';
        html += '<span style="color:#7e8e9e;min-width:0;overflow-wrap:anywhere;word-break:break-all;">IP: <span style="color:#05f2f2;font-family:monospace;">' + esc(visitorData.ip) + '</span></span>';
        html += '<span style="color:#7e8e9e;min-width:0;overflow-wrap:anywhere;">📍 <span style="color:#a7bcd1;">' + esc(visitorData.city) + ', ' + esc(visitorData.country) + '</span></span>';
        html += '<span style="color:#7e8e9e;min-width:0;overflow-wrap:anywhere;">🕐 <span style="color:#a7bcd1;">' + esc(visitorData.time) + '</span></span>';
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

    // ---------- PJAX 换页后重新挂载 ----------
    // 侧边栏在 #body-wrap 里面，PJAX 换页会被换掉，这里补一次渲染。
    function remount() {
        if (document.querySelector('.card-map')) return;      // 已经挂过了
        if (!document.querySelector('.card-announcement')) return;
        if (visitorData) {
            // 位置数据还在内存里，直接重绘，不再打一次接口
            renderAnnouncement();
            renderMapCard();
            loadMap();
        } else {
            getVisitorLocation();
        }
    }

    setTimeout(getVisitorLocation, 1500);
    document.addEventListener('pjax:complete', remount);
})();
