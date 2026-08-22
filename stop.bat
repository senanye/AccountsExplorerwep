@echo off
title myuser - Stop Server

echo.
echo  Stopping myuser server...
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)
taskkill /IM node.exe /F >nul 2>&1

echo  [OK] Server stopped.
echo.
timeout /t 2 >nul
