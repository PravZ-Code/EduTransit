<#
.SYNOPSIS
    EduTransit Multi-Port Concurrent Launcher
    Launches all 5 dedicated apps concurrently on their designated ports:
      - Port 3000: College Monitoring / Transport Supervisor Dashboard (/)
      - Port 3001: Parents App (/parents)
      - Port 3002: K-12 App (/k12)
      - Port 3003: College Students App (/college)
      - Port 3004: Drivers App (/driver)
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "EduTransit // Multi-Port Multi-App Launcher (:3000-:3004)"

$RootDir = Split-Path -Parent $PSScriptRoot
$FrontendDir = Join-Path $RootDir "frontend"
$BackendDir = Join-Path $RootDir "backend"
$LogsDir = Join-Path $RootDir "logs"

if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null
}

Clear-Host
Write-Host "====================================================================" -ForegroundColor Red
Write-Host "    EduTransit // Multi-Port Suite Concurrent Launcher              " -ForegroundColor Yellow
Write-Host "====================================================================" -ForegroundColor Red
Write-Host "  Port 3000 -> College Monitoring / Supervisor Dashboard (/)" -ForegroundColor Cyan
Write-Host "  Port 3001 -> Parents Journey Assurance App (/parents)" -ForegroundColor Green
Write-Host "  Port 3002 -> K-12 Guardian School Bus App (/k12)" -ForegroundColor Yellow
Write-Host "  Port 3003 -> College CampusPass & Shuttles App (/college)" -ForegroundColor Blue
Write-Host "  Port 3004 -> Driver Cabin HUD App (/driver)" -ForegroundColor Magenta
Write-Host "--------------------------------------------------------------------" -ForegroundColor Gray
Write-Host "  Press [CTRL+C] at any time to cleanly stop all apps." -ForegroundColor Magenta
Write-Host "====================================================================" -ForegroundColor Red
Write-Host ""

$ports = @(
    @{ Port = 3000; Name = "SUPERVISOR"; Path = "/"; Color = "Cyan" },
    @{ Port = 3001; Name = "PARENTS   "; Path = "/parents"; Color = "Green" },
    @{ Port = 3002; Name = "K-12      "; Path = "/k12"; Color = "Yellow" },
    @{ Port = 3003; Name = "COLLEGE   "; Path = "/college"; Color = "Blue" },
    @{ Port = 3004; Name = "DRIVER    "; Path = "/driver"; Color = "Magenta" }
)

$jobs = @()

foreach ($item in $ports) {
    $port = $item.Port
    $name = $item.Name
    $logFile = Join-Path $LogsDir "port_$port.log"
    Write-Host "[+] Launching $name on http://localhost:$port$($item.Path)..." -ForegroundColor $item.Color

    $job = Start-Job -ScriptBlock {
        param($dir, $p, $log)
        Set-Location $dir
        cmd /c "npx next start -p $p 2>&1" | Out-String -Stream | Tee-Object -FilePath $log -Append
    } -ArgumentList $FrontendDir, $port, $logFile

    $jobs += [PSCustomObject]@{ Name = $name; Port = $port; Job = $job; Color = $item.Color; Path = $item.Path }
}

Write-Host ""
Write-Host "All 5 port servers are launching in background jobs!" -ForegroundColor Green
Write-Host ""

# Open apps in default browser tabs
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"
Start-Process "http://localhost:3001"
Start-Process "http://localhost:3002"
Start-Process "http://localhost:3003"
Start-Process "http://localhost:3004"

try {
    while ($true) {
        $anyRunning = $false
        foreach ($item in $jobs) {
            if ($item.Job.State -eq 'Running') {
                $anyRunning = $true
            }
            $lines = Receive-Job -Job $item.Job
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
                        Write-Host "[:$($item.Port) $($item.Name)] " -ForegroundColor $item.Color -NoNewline
                        Write-Host $text
                    }
                }
            }
        }
        if (-not $anyRunning) { break }
        Start-Sleep -Milliseconds 300
    }
} finally {
    Write-Host ""
    Write-Host "Stopping all port services..." -ForegroundColor Red
    foreach ($item in $jobs) {
        Stop-Job -Job $item.Job -ErrorAction SilentlyContinue
        Remove-Job -Job $item.Job -Force -ErrorAction SilentlyContinue
    }
    Write-Host "All 5 port services cleanly terminated." -ForegroundColor Green
}
