#!/usr/bin/env bash
# 在博客服务器上发布 3D 简历站。由 deploy-portfolio.ps1 上传后调用。
# 注意：blog.conf 是按文件挂进容器的，必须原地覆盖（mv 会换 inode，容器里还是旧文件）。
set -euo pipefail

REMOTE_DIR=/opt/security-platform/portfolio-public
REMOTE_BAK=/opt/security-platform/backups
REMOTE_COMPOSE=/opt/security-platform/compose.yaml
REMOTE_CONF=/opt/security-platform/nginx/conf.d/blog.conf
STAMP=$(date +%Y-%m-%d-%H%M%S)
TAR=/tmp/portfolio-public.tar.gz
NEW_CONF=/tmp/blog.conf.new
NEW_COMPOSE=/tmp/compose.yaml.new
HOST=portfolio.worldpeace.top

echo "== 1. 备份 =="
sudo mkdir -p "$REMOTE_BAK"
if [ -d "$REMOTE_DIR" ] && [ -n "$(ls -A "$REMOTE_DIR" 2>/dev/null)" ]; then
  sudo tar -czf "$REMOTE_BAK/portfolio-$STAMP.tar.gz" -C "$REMOTE_DIR" .
  echo "   站点备份: $REMOTE_BAK/portfolio-$STAMP.tar.gz"
else
  echo "   首次部署，没有旧站点可备份"
fi
sudo cp "$REMOTE_CONF" "$REMOTE_BAK/blog.conf.bak-$STAMP"
sudo cp "$REMOTE_COMPOSE" "$REMOTE_BAK/compose.yaml.bak-$STAMP"
echo "   配置备份: blog.conf.bak-$STAMP / compose.yaml.bak-$STAMP"

echo "== 2. 发布静态文件 =="
sudo mkdir -p "$REMOTE_DIR"
sudo find "$REMOTE_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
sudo tar -xzf "$TAR" -C "$REMOTE_DIR"
sudo find "$REMOTE_DIR" -type d -exec chmod 755 {} +
sudo find "$REMOTE_DIR" -type f -exec chmod 644 {} +
echo "   文件数: $(sudo find "$REMOTE_DIR" -type f | wc -l)"

echo "== 3. 安装配置 =="
sudo cat "$NEW_CONF" > "$REMOTE_CONF"
sudo cp "$NEW_COMPOSE" "$REMOTE_COMPOSE"
rm -f "$TAR" "$NEW_CONF" "$NEW_COMPOSE"

echo "== 4. 重建 nginx 让新挂载生效 =="
cd /opt/security-platform
sudo docker compose config -q
sudo docker compose up -d blog-nginx
sleep 3
sudo docker exec blog-nginx nginx -t
sudo docker ps --filter name=blog-nginx --format '{{.Names}} {{.Status}}'

echo "== 5. 服务器本地校验（走 https + Host 头，绕过 DNS）=="
probe() {
  local label="$1" path="$2"
  local out
  out=$(sudo docker exec blog-nginx wget -qS -O /dev/null --no-check-certificate --header="Host: $HOST" "https://127.0.0.1$path" 2>&1 | grep -m1 'HTTP/' | tr -d '\r' || true)
  printf '   %-22s %s\n' "$label" "${out:-无响应}"
}
probe "首页" "/"
probe "纹理" "/textures/paper-texture.webp"
probe "字体" "/fonts/HuawenHupo.ttf"
probe "音效" "/sounds/szumwiatru.mp3"
probe "SPA 路由" "/gallery"
probe "JS bundle" "/assets/index-DUvL0fnS.js"

echo -n "   gzip 预压缩:          "
sudo docker exec blog-nginx wget -qS -O /dev/null --no-check-certificate --header="Host: $HOST" --header='Accept-Encoding: gzip' "https://127.0.0.1/assets/index-DUvL0fnS.js" 2>&1 | grep -i -m1 'Content-Encoding' | tr -d '\r' || echo '（未启用）'

echo "DEPLOY_OK"
