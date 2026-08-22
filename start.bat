@echo off
title myuser - Web Application
set APP_DIR=%~dp0
set NODE_EXE=%APP_DIR%runtime\node.exe

echo.
echo  ============================================
echo   myuser - Web Application
echo  ============================================
echo.

:: Use bundled node.exe if available, else system node
if exist "%NODE_EXE%" (
    echo  [OK] Using bundled Node.js runtime.
) else (
    where node >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo  [ERROR] Node.js runtime not found!
        echo  Please install Node.js from: https://nodejs.org
        echo.
        pause
        exit /b 1
    )
    set NODE_EXE=node
    echo  [OK] Using system Node.js.
)
echo.

:: ---- Check and configure db_config.json ----
if not exist "%APP_DIR%db_config.json" (
    echo  [INFO] Creating default db_config.json ...
    (
        echo {
        echo   "server": "localhost",
        echo   "port": "1433",
        echo   "database": "hc",
        echo   "username": "sa",
        echo   "password": ""
        echo }
    ) > "%APP_DIR%db_config.json"
)

:: Read current server from config
for /f "tokens=2 delims=:, " %%a in ('findstr /i "server" "%APP_DIR%db_config.json"') do (
    set DB_SERVER=%%~a
)

:: If server is still the default developer IP, force user to reconfigure
if "%DB_SERVER%"=="192.168.1.99" (
    echo  ============================================
    echo   [!] Database Not Configured
    echo   Please update db_config.json with your
    echo   SQL Server details, then save and close.
    echo  ============================================
    echo.
    notepad "%APP_DIR%db_config.json"
    echo.
    echo  Press any key after saving your settings...
    pause >nul
)

:: ---- Start Server ----
if "%PORT%"=="" set PORT=3050

echo  ============================================
echo   Server starting on port %PORT%...
echo  ============================================
echo.
echo    http://localhost:%PORT%
echo.
echo   Press Ctrl+C to stop the server.
echo  ============================================
echo.

"%NODE_EXE%" "%APP_DIR%server.js"

echo.
echo  [!] Server stopped.
echo.
pause
