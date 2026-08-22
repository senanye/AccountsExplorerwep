@echo off
title Accounts Explorer Packager
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0package_app.ps1"
pause
