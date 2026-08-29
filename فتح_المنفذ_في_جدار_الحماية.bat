@echo off
:: ========================================================
:: فتح منفذ 3000 في جدار حماية ويندوز للسماح بالاتصال من أجهزة الشبكة المحلية
:: ========================================================
chcp 65001 >nul
title فتح منفذ 3000 في جدار حماية ويندوز - مستكشف الحسابات

echo.
echo ========================================================
echo   فتح منفذ 3000 في جدار حماية ويندوز (Windows Firewall)
echo   للسماح بالاتصال بالتطبيق من أي هاتف أو كمبيوتر في الشبكة
echo ========================================================
echo.

:: التحقق من صلاحيات المدير Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] يتطلب هذا الأمر صلاحيات مسؤول النظام (Administrator)...
    echo [!] جاري طلب تشغيل كمسؤول...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b 0
)

echo [1/2] جاري إضافة قاعدة السماح للمنفذ TCP 3000 في جدار الحماية...
netsh advfirewall firewall delete rule name="AccountsExplorer Web (Port 3000)" >nul 2>&1
netsh advfirewall firewall add rule name="AccountsExplorer Web (Port 3000)" dir=in action=allow protocol=TCP localport=3000 profile=any

echo [2/2] جاري إضافة قاعدة السماح للمنفذ TCP 3050 في جدار الحماية...
netsh advfirewall firewall delete rule name="AccountsExplorer Web (Port 3050)" >nul 2>&1
netsh advfirewall firewall add rule name="AccountsExplorer Web (Port 3050)" dir=in action=allow protocol=TCP localport=3050 profile=any

echo.
echo ========================================================
echo   [تم بنجاح] المنفذ 3000 مفتوح الآن في جدار الحماية!
echo ========================================================
echo.
echo يمكنك الآن فتح التطبيق من أي جهاز في نفس الشبكة عبر:
echo http://192.168.1.36:3000
echo.
pause
