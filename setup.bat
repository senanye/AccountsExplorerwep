@echo off
title Accounts Explorer - Installation Setup

echo.
echo  ============================================
echo   Accounts Explorer - Installation Setup
echo  ============================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [!] Node.js is NOT installed on this machine.
    echo.
    echo  Would you like to open the Node.js download page? (Y/N)
    set /p OPEN_BROWSER=
    if /i "%OPEN_BROWSER%"=="Y" (
        start https://nodejs.org/en/download
        echo.
        echo  Please install Node.js LTS version, then re-run this setup.
    )
    echo.
    pause
    exit /b 1
)

echo  [OK] Node.js is installed.
echo.

:: Install npm dependencies
echo  [INFO] Installing application dependencies...
echo.
npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Failed to install dependencies!
    echo.
    pause
    exit /b 1
)

echo.
echo  [OK] Dependencies installed successfully!
echo.

:: Configure database
echo  ============================================
echo   Database Configuration
echo  ============================================
echo.
echo  Enter SQL Server connection details:
echo.

set /p DB_SERVER=  Server IP or Name: 
set /p DB_PORT=    Port [1433]: 
set /p DB_NAME=    Database name [hc]: 
set /p DB_USER=    Username [sa]: 
set /p DB_PASS=    Password: 

if "%DB_PORT%"=="" set DB_PORT=1433
if "%DB_NAME%"=="" set DB_NAME=hc
if "%DB_USER%"=="" set DB_USER=sa

(
    echo {
    echo   "server": "%DB_SERVER%",
    echo   "port": "%DB_PORT%",
    echo   "database": "%DB_NAME%",
    echo   "username": "%DB_USER%",
    echo   "password": "%DB_PASS%"
    echo }
) > db_config.json

echo.
echo  [OK] Database configuration saved to db_config.json
echo.

:: Create desktop shortcut
echo  Creating desktop shortcut...

set SCRIPT_DIR=%~dp0
set SHORTCUT_PATH=%USERPROFILE%\Desktop\Accounts Explorer.lnk

powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%SCRIPT_DIR%start.bat'; $Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; $Shortcut.Description = 'Accounts Explorer Web Application'; $Shortcut.Save()" 2>nul

if exist "%SHORTCUT_PATH%" (
    echo  [OK] Desktop shortcut created!
) else (
    echo  [INFO] Could not create desktop shortcut. Run start.bat manually.
)

echo.
echo  ============================================
echo   Installation Complete!
echo  ============================================
echo.
echo  To start the application, run: start.bat
echo.

set /p START_NOW=  Start the application now? (Y/N): 
if /i "%START_NOW%"=="Y" (
    start "" "%SCRIPT_DIR%start.bat"
)

pause
