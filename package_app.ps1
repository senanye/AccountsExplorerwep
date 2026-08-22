$AppDir = $PSScriptRoot
Set-Location $AppDir

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Accounts Explorer - Fast Packaging Tool" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$ZipFile = Join-Path $AppDir "AccountsExplorer.zip"
if (Test-Path $ZipFile) {
    Write-Host "[INFO] Deleting old AccountsExplorer.zip ..." -ForegroundColor Yellow
    Remove-Item $ZipFile -Force
}

Write-Host "[INFO] Packaging application files and node_modules using tar..." -ForegroundColor Green
$Files = @(
    "public",
    "runtime",
    "node_modules",
    "server.js",
    "package.json",
    "package-lock.json",
    "setup.bat",
    "start.bat",
    "stop.bat",
    "db_config.json",
    "README.md"
)

# Dynamically find the launcher batch file by excluding developer bat scripts
$Launcher = Get-ChildItem -Path $AppDir -Filter "*.bat" | Where-Object {
    $_.Name -notin @("setup.bat", "start.bat", "stop.bat", "package_app.bat")
} | Select-Object -First 1

if ($Launcher) {
    $Files += $Launcher.Name
}

# Only package files that actually exist
$ExistingFiles = $Files | Where-Object { Test-Path (Join-Path $AppDir $_) }

# Use Windows built-in tar utility for fast zip compression
tar -a -cf "$ZipFile" $ExistingFiles

if (Test-Path $ZipFile) {
    Get-ChildItem -Path $AppDir -Filter "*.zip" | Where-Object { $_.Name -ne "AccountsExplorer.zip" -and $_.Name -ne ".wwebjs_auth.zip" } | ForEach-Object {
        Copy-Item $ZipFile $_.FullName -Force
    }
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  [OK] Packaging Completed Successfully!" -ForegroundColor Green
    Write-Host "  File generated: AccountsExplorer.zip" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[ERROR] Packaging failed." -ForegroundColor Red
}



