<#
  回滚脚本：查看并恢复腾讯云服务器上的历史备份

  用法：
    powershell -ExecutionPolicy Bypass -File .\rollback.ps1 -List
    powershell -ExecutionPolicy Bypass -File .\rollback.ps1 -Restore blog-2026-09-17-213000.tar.gz
#>
[CmdletBinding()]
param(
    [switch]$List,
    [string]$Restore
)

$ErrorActionPreference = 'Stop'

# ==================== 配置 ====================
$SshKey    = 'C:\Users\26462\.ssh\id_ed25519_tencent_43_153_19_168'
$SshUser   = 'ubuntu'
$SshHost   = '43.153.19.168'
$RemoteWeb = '/opt/security-platform/blog-public'
$RemoteBak = '/opt/security-platform/backups'
$SiteUrl   = 'https://worldpeace.top/'
# ==============================================

$SshOpts = @('-i', $SshKey, '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new')
$Target  = "$SshUser@$SshHost"

function Invoke-Remote([string]$Command) {
    & ssh @SshOpts $Target $Command
    if ($LASTEXITCODE -ne 0) { throw "远程命令执行失败 (exit $LASTEXITCODE)" }
}

if ($List -or (-not $Restore)) {
    Write-Host '服务器上的博客备份（新 -> 旧）：' -ForegroundColor Cyan
    Invoke-Remote "sudo ls -1t $RemoteBak/blog-*.tar.gz 2>/dev/null | head -30 || echo '（暂无备份）'"
    if (-not $Restore) {
        Write-Host ''
        Write-Host '恢复某个版本：' -ForegroundColor Yellow
        Write-Host '  powershell -ExecutionPolicy Bypass -File .\rollback.ps1 -Restore blog-YYYY-MM-DD-HHmmss.tar.gz'
    }
    return
}

# ---------- 恢复 ----------
$file = $Restore
if ($file -notmatch '^[A-Za-z0-9._-]+$') { throw '备份文件名不合法，只允许字母数字、点、下划线和短横线' }

Write-Host "即将回滚到：$file" -ForegroundColor Yellow
Write-Host '回滚前会先备份当前线上版本。' -ForegroundColor Yellow

$stamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'
$lines = @('set -e')
$lines += "test -f $RemoteBak/$file || { echo 'ERROR: 备份不存在'; exit 1; }"
$lines += "sudo mkdir -p $RemoteBak"
$lines += "sudo tar -czf $RemoteBak/blog-rollback-$stamp.tar.gz -C $RemoteWeb ."
$lines += "echo 'current site backed up: $RemoteBak/blog-rollback-$stamp.tar.gz'"
$lines += "sudo find $RemoteWeb -mindepth 1 -maxdepth 1 ! -name '.well-known' -exec rm -rf {} +"
$lines += "sudo tar -xzf $RemoteBak/$file -C $RemoteWeb"
$lines += "sudo find $RemoteWeb -type d -exec chmod 755 {} +"
$lines += "sudo find $RemoteWeb -type f -exec chmod 644 {} +"
$lines += "echo ROLLBACK_OK"
Invoke-Remote ($lines -join "`n")

Start-Sleep -Seconds 2
$resp = Invoke-WebRequest -Uri $SiteUrl -UseBasicParsing -TimeoutSec 20
Write-Host ("      $SiteUrl -> {0}, {1} 字节" -f $resp.StatusCode, $resp.Content.Length) -ForegroundColor Green
Write-Host '回滚完成。' -ForegroundColor Green
