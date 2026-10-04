<#
.SYNOPSIS
    EduTransit - Single-Window Unified Multi-Service Orchestrator
    Runs Backend (FastAPI), Frontend (Next.js 3D Radar), and Mobile (Flutter Web)
    inside ONE single console window using background background jobs.
    Streams color-coded logs directly to this window and saves them to logs/.
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "EduTransit // Unified Platform Orchestrator (Single Window)"

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$MobileDir = Join-Path $RootDir "mobile"
$LogsDir = Join-Path $RootDir "logs"

if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null
}

$Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
$OrchestratorLog = Join-Path $LogsDir "orchestrator.log"
$BackendLog = Join-Path $LogsDir "backend.log"
$FrontendLog = Join-Path $LogsDir "frontend.log"
$MobileLog = Join-Path $LogsDir "mobile.log"

"[$Timestamp] === Unified Orchestrator Started ===" | Out-File -FilePath $OrchestratorLog -Append -Encoding utf8

Clear-Host
Write-Host "====================================================================" -ForegroundColor Red
Write-Host "    EduTransit // Unified Multi-Service Orchestrator               " -ForegroundColor Yellow
Write-Host "  100% Software-Only - Zero-Hardware-Dependent - Day-Scholar Safety" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Red
Write-Host "  [Single Console Mode] All 3 services running in this single process" -ForegroundColor Green
Write-Host "  Press [CTRL+C] at any time to cleanly stop all background services." -ForegroundColor Magenta
Write-Host "--------------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

# 1. Environment Verification
Write-Host "[1/4] Checking System Environments..." -ForegroundColor Yellow

$pythonCmd = Get-Command "python" -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Host " [!] Python not found in PATH." -ForegroundColor Red
    exit 1
}

$npmCmd = Get-Command "npm" -ErrorAction SilentlyContinue
if (-not $npmCmd) {
    Write-Host " [!] Node.js/npm not found in PATH." -ForegroundColor Red
    exit 1
}

$flutterCmd = Get-Command "flutter" -ErrorAction SilentlyContinue

Write-Host "  [OK] Python: $($pythonCmd.Source)" -ForegroundColor Green
Write-Host "  [OK] NPM:    $($npmCmd.Source)" -ForegroundColor Green
if ($flutterCmd) {
    Write-Host "  [OK] Flutter: $($flutterCmd.Source)" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Flutter not detected in PATH. Mobile service will be skipped." -ForegroundColor Yellow
}
Write-Host ""

# 2. Launch Background Processes (No separate windows!)
$jobs = @()

# (A) Backend Job
Write-Host "[2/4] Starting Backend Telematics Service (Port 8000)..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    param($dir, $logFile)
    Set-Location $dir
    $env:PYTHONPATH = "."
    $env:PYTHONUNBUFFERED = "1"
    $env:PYTHONIOENCODING = "utf-8"
    cmd /c "python -u -m uvicorn app.main:app --host 0.0.0.0 --port 8000 2>&1" | Out-String -Stream | Tee-Object -FilePath $logFile -Append
} -ArgumentList $BackendDir, $BackendLog
$jobs += [PSCustomObject]@{ Name = "BACKEND "; Job = $backendJob; Color = "Cyan" }

# Give backend a moment to bind port 8000
Start-Sleep -Seconds 2

# (B) Frontend Job
Write-Host "[3/4] Starting Frontend Next.js 3D Fleet Radar (Port 3000)..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    param($dir, $logFile)
    Set-Location $dir
    cmd /c "npm run dev 2>&1" | Out-String -Stream | Tee-Object -FilePath $logFile -Append
} -ArgumentList $FrontendDir, $FrontendLog
$jobs += [PSCustomObject]@{ Name = "FRONTEND"; Job = $frontendJob; Color = "Green" }

# (C) Mobile Job (if Flutter is installed)
if ($flutterCmd) {
    Write-Host "[4/4] Starting Mobile Client Flutter Web (Port 5000)..." -ForegroundColor Yellow
    $mobileJob = Start-Job -ScriptBlock {
        param($dir, $logFile)
        Set-Location $dir
        cmd /c "flutter run -d chrome --release --web-port 5000 2>&1" | Out-String -Stream | Tee-Object -FilePath $logFile -Append
    } -ArgumentList $MobileDir, $MobileLog
    $jobs += [PSCustomObject]@{ Name = "MOBILE  "; Job = $mobileJob; Color = "Magenta" }
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Green
Write-Host "             ALL SERVICES ACTIVE IN BACKGROUND JOBS                 " -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Green
Write-Host "  [API] Backend API & Docs:   http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  [MAP] 3D Fleet Radar:       http://localhost:3000" -ForegroundColor Green
if ($flutterCmd) {
    Write-Host "  [APP] Mobile Commuter App:  http://localhost:5000" -ForegroundColor Magenta
}
Write-Host "====================================================================" -ForegroundColor Green
Write-Host "Streaming unified live log output below (Press Ctrl+C to terminate):" -ForegroundColor Gray
Write-Host ""

# Open 3D Radar in browser automatically
Start-Process "http://localhost:3000"

# 3. Unified Stream Polling Loop with Clean Cancellation
try {
    while ($true) {
        $anyRunning = $false
        foreach ($item in $jobs) {
            $job = $item.Job
            if ($job.State -eq 'Running') {
                $anyRunning = $true
            }
            # Receive any new stdout/stderr lines from background job
            $lines = Receive-Job -Job $job
            if ($lines) {
                foreach ($line in $lines) {
                    $text = if ($line -is [System.Management.Automation.ErrorRecord]) {
                        $line.Exception.Message
                    } elseif ($line.TargetObject) {
                        $line.TargetObject.ToString()
                    } else {
                        $line.ToString()
                    }
                    if ($text -and $text.Trim()) {
                        Write-Host "[$($item.Name)] " -ForegroundColor $item.Color -NoNewline
                        Write-Host $text
                    }
                }
            }
        }

        if (-not $anyRunning) {
            Write-Host "All background services have completed or exited." -ForegroundColor Yellow
            break
        }

        Start-Sleep -Milliseconds 250
    }
} finally {
    Write-Host ""
    Write-Host "Terminating all background services..." -ForegroundColor Red
    foreach ($item in $jobs) {
        if ($item.Job) {
            Stop-Job -Job $item.Job -ErrorAction SilentlyContinue
            Remove-Job -Job $item.Job -Force -ErrorAction SilentlyContinue
            Write-Host "  [OK] $($item.Name) stopped." -ForegroundColor DarkGray
        }
    }
    # Clean up any lingering python / node child processes
    Get-Process -Name "python", "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*$RootDir*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "All services stopped cleanly. Orchestrator closed." -ForegroundColor Green
}
