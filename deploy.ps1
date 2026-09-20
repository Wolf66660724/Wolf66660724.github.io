<#
  部署脚本：本地构建 Hexo 博客 -> 上传到腾讯云服务器 -> 同步到 nginx 静态目录
  站点：https://worldpeace.top

  用法：
    powershell -ExecutionPolicy Bypass -File .\deploy.ps1
    powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -SkipBuild
    powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -NoBackup
#>
[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [switch]$NoBackup
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

$repoRoot  = $PSScriptRoot
$publicDir = Join-Path $repoRoot 'public'
$hexo      = Join-Path $repoRoot 'node_modules\.bin\hexo.cmd'
$tarName   = 'blog-public.tar.gz'
$tarPath   = Join-Path $env:TEMP $tarName

$SshOpts = @('-i', $SshKey, '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new')
$Target  = "$SshUser@$SshHost"

function Invoke-Remote([string]$Command) {
    & ssh @SshOpts $Target $Command
    if ($LASTEXITCODE -ne 0) { throw "远程命令执行失败 (exit $LASTEXITCODE)" }
}

# ---------- 1. 构建 ----------
if (-not $SkipBuild) {
    Write-Host '[1/5] 构建站点 ...' -ForegroundColor Cyan
    if (-not (Test-Path $hexo)) { throw "未找到 Hexo：$hexo，请先执行 npm install" }

    if (Test-Path $publicDir) {
        for ($i = 1; $i -le 3; $i++) {
            try { Remove-Item $publicDir -Recurse -Force -ErrorAction Stop; break }
            catch { Start-Sleep -Seconds 2 }
        }
    }

    & $hexo generate
    if ($LASTEXITCODE -ne 0) { throw 'Hexo 构建失败' }
    if (-not (Test-Path (Join-Path $publicDir 'index.html'))) { throw '构建产物缺少 index.html' }
} else {
    Write-Host '[1/5] 跳过构建（-SkipBuild）' -ForegroundColor Yellow
}

if (-not (Test-Path $publicDir)) { throw "未找到构建产物目录：$publicDir" }

# ---------- 2. 静态资源按内容哈希加版本号（绕开 CDN 长效缓存）----------
Write-Host '[2/5] 为静态资源加版本号 ...' -ForegroundColor Cyan

$imgPattern  = '(/img/[A-Za-z0-9._%/-]+\.(?:png|jpe?g|gif|svg|webp|ico))(["''])'
$allPattern  = '(/img/[A-Za-z0-9._%/-]+\.(?:png|jpe?g|gif|svg|webp|ico)|/css/[A-Za-z0-9._-]+\.css|/js/[A-Za-z0-9._/-]+\.js)(["''])'

function Get-AssetHash([string]$urlPath) {
    $rel = $urlPath.TrimStart('/').Replace('/', '\')
    $file = Join-Path $publicDir $rel
    if (Test-Path -LiteralPath $file) { return (Get-FileHash -LiteralPath $file -Algorithm MD5).Hash.Substring(0, 8).ToLower() }
    return $null
}

function Invoke-VersionReplace([string]$text, [string]$pattern, [hashtable]$map) {
    $sb = New-Object System.Text.StringBuilder
    $last = 0
    foreach ($m in [regex]::Matches($text, $pattern)) {
        $p = $m.Groups[1].Value
        $v = $map[$p]
        if ($v) {
            [void]$sb.Append($text.Substring($last, $m.Index - $last))
            [void]$sb.Append($p).Append('?v=').Append($v).Append($m.Groups[2].Value)
            $last = $m.Index + $m.Length
        }
    }
    if ($last -eq 0) { return $null }
    [void]$sb.Append($text.Substring($last))
    return $sb.ToString()
}

# 第一趟：先给 CSS 里引用的图片加版本号（让 CSS 内容定型）
$imgPaths = @()
foreach ($f in (Get-ChildItem $publicDir -Recurse -File -Include *.css, *.html)) {
    $t = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    foreach ($m in [regex]::Matches($t, $imgPattern)) { $imgPaths += $m.Groups[1].Value }
}
$imgMap = @{}
foreach ($p in ($imgPaths | Sort-Object -Unique)) {
    $h = Get-AssetHash $p
    if ($h) { $imgMap[$p] = $h }
}
$cssTouched = 0
foreach ($f in (Get-ChildItem $publicDir -Recurse -File -Filter *.css)) {
    $t = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $out = Invoke-VersionReplace -text $t -pattern $imgPattern -map $imgMap
    if ($out) { [System.IO.File]::WriteAllText($f.FullName, $out, (New-Object System.Text.UTF8Encoding($false))); $cssTouched++ }
}

# 第二趟：此时所有文件内容已定型，统一算哈希
$allPaths = @()
foreach ($f in (Get-ChildItem $publicDir -Recurse -File -Include *.html)) {
    $t = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    foreach ($m in [regex]::Matches($t, $allPattern)) { $allPaths += $m.Groups[1].Value }
}
$verMap = @{}
foreach ($p in ($allPaths | Sort-Object -Unique)) {
    $h = Get-AssetHash $p
    if ($h) { $verMap[$p] = $h }
}

# 第三趟：给 HTML 里的资源加版本号
$htmlTouched = 0
foreach ($f in (Get-ChildItem $publicDir -Recurse -File -Include *.html)) {
    $t = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $out = Invoke-VersionReplace -text $t -pattern $allPattern -map $verMap
    if ($out) { [System.IO.File]::WriteAllText($f.FullName, $out, (New-Object System.Text.UTF8Encoding($false))); $htmlTouched++ }
}
Write-Host "      CSS $cssTouched 个 / HTML $htmlTouched 个，资源 $($verMap.Count) 项"
# ---------- 3. 打包 ----------
Write-Host '[3/5] 打包构建产物 ...' -ForegroundColor Cyan
if (Test-Path $tarPath) { Remove-Item $tarPath -Force }
& tar -czf $tarPath -C $publicDir .
if ($LASTEXITCODE -ne 0) { throw '打包失败' }
Write-Host ("      大小 {0} MB" -f [math]::Round((Get-Item $tarPath).Length / 1MB, 2))

# ---------- 4. 上传 ----------
Write-Host '[4/5] 上传到服务器 ...' -ForegroundColor Cyan
& scp @SshOpts $tarPath "${Target}:/tmp/$tarName"
if ($LASTEXITCODE -ne 0) { throw '上传失败' }

# ---------- 5. 备份 + 发布 ----------
Write-Host '[5/5] 备份线上版本并发布 ...' -ForegroundColor Cyan
$stamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'
$lines = @('set -e')
if (-not $NoBackup) {
    $lines += "sudo mkdir -p $RemoteBak"
    $lines += "sudo tar -czf $RemoteBak/blog-$stamp.tar.gz -C $RemoteWeb ."
    $lines += "echo 'backup saved: $RemoteBak/blog-$stamp.tar.gz'"
}
$lines += "sudo find $RemoteWeb -mindepth 1 -maxdepth 1 ! -name '.well-known' -exec rm -rf {} +"
$lines += "sudo tar -xzf /tmp/$tarName -C $RemoteWeb"
$lines += "sudo find $RemoteWeb -type d -exec chmod 755 {} +"
$lines += "sudo find $RemoteWeb -type f -exec chmod 644 {} +"
$lines += "rm -f /tmp/$tarName"
$lines += "echo DEPLOY_OK"
Invoke-Remote ($lines -join "`n")

# ---------- 校验 ----------
Start-Sleep -Seconds 2
$resp = Invoke-WebRequest -Uri $SiteUrl -UseBasicParsing -TimeoutSec 20
Write-Host ("      $SiteUrl -> {0}, {1} 字节" -f $resp.StatusCode, $resp.Content.Length) -ForegroundColor Green
Write-Host '部署完成。' -ForegroundColor Green
