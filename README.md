# Accounts Explorer Web Application
# نظام حسابات إكسبلورر - تطبيق الويب

## متطلبات التشغيل / Requirements

- **Node.js** v18 أو أحدث - https://nodejs.org
- **SQL Server** متصل بالشبكة
- **Windows** 10/11

---

## التثبيت لأول مرة / First Time Setup

1. قم بتشغيل ملف `setup.bat` كمدير
2. اتبع التعليمات لإدخال بيانات SQL Server
3. سيتم إنشاء اختصار على سطح المكتب تلقائياً

```
Double-click: setup.bat
```

---

## التشغيل اليومي / Daily Start

```
Double-click: start.bat
```

افتح المتصفح على / Open browser at:
```
http://localhost:3000
```

---

## إيقاف السيرفر / Stop Server

```
Double-click: stop.bat
```
أو اضغط `Ctrl+C` في نافذة السيرفر

---

## إعداد قاعدة البيانات / Database Config

يمكن تعديل ملف `db_config.json` يدوياً:

```json
{
  "server": "YOUR_SERVER_IP",
  "port": "1433",
  "database": "hc",
  "username": "sa",
  "password": "YOUR_PASSWORD"
}
```

---

## ملفات المشروع / Project Files

| الملف | الوصف |
|-------|-------|
| `start.bat` | تشغيل التطبيق |
| `stop.bat` | إيقاف التطبيق |
| `setup.bat` | التثبيت لأول مرة |
| `server.js` | السيرفر الرئيسي |
| `db_config.json` | إعدادات قاعدة البيانات |
| `public/` | ملفات الواجهة |

---

## المنفذ الافتراضي / Default Port

السيرفر يعمل على المنفذ **3000**  
لتغييره: `set PORT=8080 && node server.js`

---

## الدعم الفني / Support

في حالة وجود مشاكل، تحقق من:
1. أن Node.js مثبت بشكل صحيح
2. أن بيانات SQL Server صحيحة في `db_config.json`
3. أن المنفذ 3000 غير مستخدم من برنامج آخر
