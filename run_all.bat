@echo off
title EduTransit Master Launcher
echo ====================================================================
echo     EduTransit // Intelligent Educational Transport Platform       
echo   100% Software-Only - Zero-Hardware-Dependent - Day-Scholar Safety
echo ====================================================================
echo.
echo [Live Logging Enabled] All service traces will be recorded in .\logs\
echo.
echo Launching services via PowerShell orchestrator...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_all.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] An error occurred while executing run_all.ps1.
    pause
)
