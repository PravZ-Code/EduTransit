[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "EduTransit - Mobile Commuter & Driver App (Port 5000)"
$RootDir = Split-Path -Parent $PSScriptRoot
$MobileDir = Join-Path $RootDir "mobile"
$LogsDir = Join-Path $RootDir "logs"

if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null
}

$MobileLog = Join-Path $LogsDir "mobile.log"
Set-Location $MobileDir

Write-Host "==================================================" -ForegroundColor Red
Write-Host " EduTransit Mobile Commuter App (Port 5000)       " -ForegroundColor Yellow
Write-Host " Dual-Mode: Driver Cabin HUD & Student/Parent UI  " -ForegroundColor Cyan
Write-Host " URL:       http://localhost:5000                " -ForegroundColor Cyan
Write-Host " Log File:  $MobileLog                           " -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Red

flutter run -d chrome --release --web-port 5000 2>&1 | Out-String -Stream | Tee-Object -FilePath $MobileLog -Append
