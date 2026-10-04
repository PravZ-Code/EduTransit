[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "EduTransit - Backend Telematics (Port 8000)"
$RootDir = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $RootDir "backend"
$LogsDir = Join-Path $RootDir "logs"

if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null
}

$BackendLog = Join-Path $LogsDir "backend.log"
Set-Location $BackendDir

$env:PYTHONPATH = "."
$env:PYTHONUNBUFFERED = "1"
$env:PYTHONIOENCODING = "utf-8"

Write-Host "==================================================" -ForegroundColor Red
Write-Host " EduTransit Telematics Engine (Port 8000)        " -ForegroundColor Yellow
Write-Host " WebSocket: ws://localhost:8000/api/v1/ws/telemetry" -ForegroundColor Cyan
Write-Host " Docs:      http://localhost:8000/docs           " -ForegroundColor Cyan
Write-Host " Log File:  $BackendLog                          " -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Red

python -u -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload 2>&1 | Out-String -Stream | Tee-Object -FilePath $BackendLog -Append
