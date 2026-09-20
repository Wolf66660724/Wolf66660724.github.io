$ErrorActionPreference = 'Stop'
$key = "$env:USERPROFILE\.ssh\id_ed25519_tencent_43_153_19_168"
$host_ = 'ubuntu@43.153.19.168'
$remote = '/opt/security-platform/content-service/'

Write-Host '== 上传 server.js / admin.html ==' -ForegroundColor Cyan
scp -i $key -o StrictHostKeyChecking=accept-new `
  deploy/content-service/server.js `
  deploy/content-service/admin.html `
  deploy/content-service/Dockerfile `
  "${host_}:${remote}"
if ($LASTEXITCODE -ne 0) { throw "scp failed: $LASTEXITCODE" }

Write-Host '== 重建镜像并重启容器 ==' -ForegroundColor Cyan
ssh -i $key -o StrictHostKeyChecking=accept-new $host_ `
  "cd /opt/security-platform/content-service && sudo docker build -t content-service:1.0 . && cd /opt/security-platform && sudo docker compose up -d content-service && sleep 2 && sudo docker ps --filter name=content-service --format '{{.Names}} {{.Status}}'"
if ($LASTEXITCODE -ne 0) { throw "remote build failed: $LASTEXITCODE" }

Write-Host '== 健康检查 ==' -ForegroundColor Cyan
Start-Sleep -Seconds 3
$r = Invoke-WebRequest -Uri 'https://worldpeace.top/content-api/movies' -UseBasicParsing -TimeoutSec 30
Write-Output ("movies api status = " + $r.StatusCode)
Write-Output ($r.Content.Substring(0, [Math]::Min(300, $r.Content.Length)))
