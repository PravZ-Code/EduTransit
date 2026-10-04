[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "EduTransit - 3D Live Fleet Radar (Port 3000)"
$RootDir = Split-Path -Parent $PSScriptRoot
$FrontendDir = Join-Path $RootDir "frontend"
$LogsDir = Join-Path $RootDir "logs"

if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null
}

$FrontendLog = Join-Path $LogsDir "frontend.log"
Set-Location $FrontendDir

Write-Host "==================================================" -ForegroundColor Red
Write-Host " EduTransit 3D Fleet Radar Dashboard (Port 3000) " -ForegroundColor Yellow
Write-Host " OpenFreeMap 3D Buildings & Isometric Tracking    " -ForegroundColor Cyan
Write-Host " URL:       http://localhost:3000                " -ForegroundColor Cyan
Write-Host " Log File:  $FrontendLog                         " -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Red

npm run dev 2>&1 | Out-String -Stream | Tee-Object -FilePath $FrontendLog -Append
