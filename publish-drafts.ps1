<#
  把后台写的文章草稿拉到本地，写成 Hexo 文章，然后（可选）部署上线。
  这是「方案 C」：在网页上写，本地一条命令发布，文章照样进 git。

  用法：
    powershell -ExecutionPolicy Bypass -File .\publish-drafts.ps1          # 只写文件
    powershell -ExecutionPolicy Bypass -File .\publish-drafts.ps1 -Deploy  # 写文件并部署

  密码：第一次会提示输入，之后存在 tools\.admin-password.txt（已在 .gitignore 里）
#>
[CmdletBinding()]
param(
    [switch]$Deploy,
    [string]$ApiBase = 'https://worldpeace.top/manage'
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$repoRoot = $PSScriptRoot
$postDir  = Join-Path $repoRoot 'source\_posts'
$pwFile   = Join-Path $repoRoot 'tools\.admin-password.txt'

if (-not (Test-Path $postDir)) { throw "找不到文章目录：$postDir" }

# ---------- 登录 ----------
$password = ''
if (Test-Path $pwFile) { $password = (Get-Content -LiteralPath $pwFile -Raw).Trim() }
if (-not $password) {
    $sec = Read-Host '请输入内容后台密码' -AsSecureString
    $password = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
}

function Api([string]$method, [string]$path, $body, [string]$token) {
    $headers = @{ 'Content-Type' = 'application/json' }
    if ($token) { $headers['Authorization'] = "Bearer $token" }
    $req = @{ Uri = "$ApiBase/$path"; Method = $method; Headers = $headers; UseBasicParsing = $true; TimeoutSec = 40 }
    if ($body) { $req['Body'] = [System.Text.Encoding]::UTF8.GetBytes(($body | ConvertTo-Json -Depth 6 -Compress)) }
    $r = Invoke-WebRequest @req
    $txt = if ($r.Content -is [byte[]]) { [System.Text.Encoding]::UTF8.GetString($r.Content) } else { [string]$r.Content }
    if ($txt) { return ($txt | ConvertFrom-Json) } else { return $null }
}

Write-Host '登录中…' -ForegroundColor Cyan
try {
    $login = Api 'POST' 'api/login' @{ password = $password } $null
} catch {
    throw "登录失败：$($_.Exception.Message)"
}
$token = $login.token
if (-not $token) { throw '登录失败：没有拿到 token' }

# 密码可用就记下来，省得每次输
$dir = Split-Path -Parent $pwFile
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
[IO.File]::WriteAllText($pwFile, $password, (New-Object System.Text.UTF8Encoding $false))

# ---------- 取草稿 ----------
Write-Host '读取草稿…' -ForegroundColor Cyan
$data = Api 'GET' 'api/items/drafts' $null $token
$drafts = @($data.items | Where-Object { $_.status -ne 'published' })
if ($drafts.Count -eq 0) {
    Write-Host '没有待发布的草稿。' -ForegroundColor Yellow
    if ($Deploy) { Write-Host '（仍然按你的要求跑一次部署）' -ForegroundColor Yellow }
    else { return }
}

function Clean([string]$s) {
    $bad = [IO.Path]::GetInvalidFileNameChars() + [char[]]'\/:*?"<>|'
    foreach ($c in $bad) { $s = $s.Replace([string]$c, '_') }
    return $s.Trim()
}

$written = @()
$i = 0
foreach ($d in $drafts) {
    $i++
    $title = Clean($d.title)
    if (-not $title) { Write-Host "  跳过一条没有标题的草稿" -ForegroundColor Yellow; continue }

    $file = Join-Path $postDir "$title.md"
    $exists = Test-Path $file

    $fm = @()
    $fm += '---'
    $fm += "title: $($d.title)"
    $fm += "date: $(if ($d.date) { $d.date } else { (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') })"
    if ($d.cover) { $fm += "cover: $($d.cover)" }
    $cats = @($d.categories -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    if ($cats.Count) {
        $fm += 'categories:'
        $cats | ForEach-Object { $fm += "  - $_" }
    }
    $tags = @($d.tags -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    if ($tags.Count) {
        $fm += 'tags:'
        $tags | ForEach-Object { $fm += "  - $_" }
    }
    $fm += '---'
    $fm += ''

    $content = ($fm -join "`n") + "`n" + ($d.content -replace "`r`n", "`n") + "`n"
    [IO.File]::WriteAllText($file, $content, (New-Object System.Text.UTF8Encoding $false))

    $mark = if ($exists) { '已覆盖' } else { '新增' }
    Write-Host "  [$i/$($drafts.Count)] $mark  $title.md  （$($cats.Count) 分类 / $($tags.Count) 标签）" -ForegroundColor Green

    # 标记为已发布
    $body = @{
        title = $d.title; slug = $d.slug; date = $d.date
        categories = $d.categories; tags = $d.tags; cover = $d.cover
        excerpt = $d.excerpt; content = $d.content
        status = 'published'; publishedAt = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
    }
    Api 'PUT' "api/items/drafts/$($d.id)" $body $token | Out-Null
    $written += $title
}

Write-Host ""
Write-Host "完成：写入 $($written.Count) 篇文章" -ForegroundColor Cyan

if ($Deploy) {
    Write-Host '开始部署…' -ForegroundColor Cyan
    & (Join-Path $repoRoot 'deploy.ps1')
} else {
    Write-Host '接下来可以：' -ForegroundColor Yellow
    Write-Host '  1) 切到 D:\git\Blog，用 hexo server 本地预览'
    Write-Host '  2) 确认没问题后跑 .\deploy.ps1 部署，或直接重跑本脚本加 -Deploy'
}