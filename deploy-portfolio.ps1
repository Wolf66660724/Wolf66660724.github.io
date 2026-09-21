<#
  部署 3D 简历站（portfolio-itom）到博客服务器
  站点：https://portfolio.worldpeace.top

  用法：
    powershell -ExecutionPolicy Bypass -File .\deploy-portfolio.ps1
    powershell -ExecutionPolicy Bypass -File .\deploy-portfolio.ps1 -SkipBuild
    powershell -ExecutionPolicy Bypass -File .\deploy-portfolio.ps1 -SkipNginx   # 只传静态文件，不动配置
#>
[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [switch]$SkipNginx
)

$ErrorActionPreference = 'Stop'

$SshKey  = 'C:\Users\26462\.ssh\id_ed25519_tencent_43_153_19_168'
$SshUser = 'ubuntu'
$SshHost = '43.153.19.168'
$SiteUrl = 'https://portfolio.worldpeace.top/'

$repoRoot = $PSScriptRoot
$projDir  = Join-Path $repoRoot "portfolio-itom"
$distDir  = Join-Path $projDir "dist"
$vite     = Join-Path $projDir "node_modules\.bin\vite.cmd"
$tarName  = 'portfolio-public.tar.gz'
$tarPath  = Join-Path $env:TEMP $tarName
$cfgDir   = Join-Path $repoRoot "deploy\portfolio"

$SshOpts = @('-i', $SshKey, '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new')
$Target  = "$SshUser@$SshHost"

# ---------- 1. 构建 ----------
if ($SkipBuild) {
    Write-Host '[1/4] 跳过构建（-SkipBuild）' -ForegroundColor Yellow
} else {
    Write-Host '[1/4] 构建 3D 简历站 ...' -ForegroundColor Cyan
    if (-not (Test-Path $vite)) { throw "未找到 vite：$vite，请先在 portfolio-itom 里装依赖" }
    Push-Location $projDir
    try {
        & $vite build
        if ($LASTEXITCODE -ne 0) { throw "vite 构建失败" }
    } finally { Pop-Location }
}

if (-not (Test-Path (Join-Path $distDir "index.html"))) { throw "缺少构建产物：$distDir\index.html" }

# ---------- 2. 打包 ----------
Write-Host '[2/4] 打包 ...' -ForegroundColor Cyan
if (Test-Path $tarPath) { Remove-Item $tarPath -Force }
& tar -czf $tarPath -C $distDir .
if ($LASTEXITCODE -ne 0) { throw '打包失败' }
Write-Host ("      {0} MB" -f [math]::Round((Get-Item $tarPath).Length / 1MB, 2))

# ---------- 3. 上传 ----------
Write-Host '[3/4] 上传 ...' -ForegroundColor Cyan
& scp @SshOpts $tarPath "${Target}:/tmp/$tarName"
if ($LASTEXITCODE -ne 0) { throw '上传失败' }

if (-not $SkipNginx) {
    $uploads = @{ "nginx-blog.conf" = "blog.conf.new"; "compose.yaml.patched" = "compose.yaml.new"; "remote-deploy.sh" = "remote-deploy.sh" }
    foreach ($f in $uploads.Keys) {
        $p = Join-Path $cfgDir $f
        if (-not (Test-Path $p)) { throw "缺少配置：$p" }
        & scp @SshOpts $p "${Target}:/tmp/$($uploads[$f])"
        if ($LASTEXITCODE -ne 0) { throw "上传 $f 失败" }
    }
}

# ---------- 4. 服务器端发布 ----------
Write-Host '[4/4] 服务器发布 ...' -ForegroundColor Cyan
& ssh @SshOpts $Target "bash /tmp/remote-deploy.sh"
if ($LASTEXITCODE -ne 0) { throw '远程发布失败' }

Write-Host ''
Write-Host '部署完成。' -ForegroundColor Green
Write-Host '若域名还没解析，请在 Cloudflare 加一条：portfolio -> A -> 43.153.19.168（代理可开）' -ForegroundColor Yellow
