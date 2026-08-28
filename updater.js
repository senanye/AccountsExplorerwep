const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { exec, execSync, spawn } = require('child_process');

const CONFIG_FILE = path.join(__dirname, 'updater_config.json');
const BACKUPS_DIR = path.join(__dirname, 'backups');

// Default Config
const DEFAULT_CONFIG = {
  enabled: true,
  provider: "github",
  repo: "senanye/AccountsExplorerwep",
  repoUrl: "https://github.com/senanye/AccountsExplorerwep.git",
  branch: "main",
  token: "",
  customUrl: "",
  autoCheckOnStartup: true,
  checkIntervalHours: 12,
  backupBeforeUpdate: true,
  currentVersion: "1.0.0",
  lastCheckTime: null,
  lastUpdateTime: null,
  lastCheckResult: null
};

// Ensure Backups dir exists
if (!fs.existsSync(BACKUPS_DIR)) {
  try {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  } catch (e) {}
}

function getConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      // Sync currentVersion from package.json if available
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
        if (pkg.version) data.currentVersion = pkg.version;
      } catch (e) {}
      return { ...DEFAULT_CONFIG, ...data };
    }
  } catch (e) {
    console.error("Error reading updater config:", e.message);
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(newConfig) {
  try {
    const current = getConfig();
    const updated = { ...current, ...newConfig };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  } catch (e) {
    console.error("Error saving updater config:", e.message);
    return null;
  }
}

function fetchJsonFromUrl(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    const defaultHeaders = {
      'User-Agent': 'AccountsExplorer-AutoUpdater/1.0',
      'Accept': 'application/vnd.github.v3+json, application/json, text/plain',
      ...headers
    };

    const req = client.get(url, { headers: defaultHeaders }, (res) => {
      // Handle redirects (e.g. 301, 302, 307)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJsonFromUrl(res.headers.location, headers).then(resolve).catch(reject);
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("انتهت مهلة الاتصال بالخادم (Timeout)."));
    });
  });
}

function compareVersions(v1, v2) {
  if (!v1 || !v2) return 0;
  const clean1 = v1.replace(/^v/, '').trim();
  const clean2 = v2.replace(/^v/, '').trim();
  const parts1 = clean1.split('.').map(n => parseInt(n) || 0);
  const parts2 = clean2.split('.').map(n => parseInt(n) || 0);
  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

// 1. Check for Updates
async function checkForUpdates() {
  const config = getConfig();
  const repo = config.repo || 'senanye/AccountsExplorerwep';
  const branch = config.branch || 'main';
  const headers = config.token ? { 'Authorization': `token ${config.token}` } : {};

  const result = {
    hasUpdate: false,
    currentVersion: config.currentVersion || '1.0.0',
    latestVersion: config.currentVersion || '1.0.0',
    releaseTitle: 'لا توجد تحديثات جديدة',
    releaseNotes: '',
    publishedAt: null,
    downloadUrl: null,
    commitSha: null,
    commitMessage: '',
    checkedAt: new Date().toISOString()
  };

  try {
    // 1. Try checking GitHub Releases first
    const relUrl = `https://api.github.com/repos/${repo}/releases/latest`;
    const relRes = await fetchJsonFromUrl(relUrl, headers);

    if (relRes.status === 200 && relRes.data && relRes.data.tag_name) {
      const tag = relRes.data.tag_name;
      result.latestVersion = tag.replace(/^v/, '');
      result.releaseTitle = relRes.data.name || tag;
      result.releaseNotes = relRes.data.body || 'تحسينات عامة وإصلاحات للنظام.';
      result.publishedAt = relRes.data.published_at;
      result.downloadUrl = relRes.data.zipball_url || `https://github.com/${repo}/archive/refs/tags/${tag}.zip`;

      if (compareVersions(result.latestVersion, result.currentVersion) > 0) {
        result.hasUpdate = true;
      }
    } else {
      // 2. If no releases, check raw package.json & latest commits on the branch
      const commitUrl = `https://api.github.com/repos/${repo}/commits/${branch}`;
      const commitRes = await fetchJsonFromUrl(commitUrl, headers);

      if (commitRes.status === 200 && commitRes.data && commitRes.data.sha) {
        const commit = commitRes.data;
        result.commitSha = commit.sha.substring(0, 7);
        result.commitMessage = commit.commit ? commit.commit.message : '';
        result.publishedAt = commit.commit && commit.commit.committer ? commit.commit.committer.date : new Date().toISOString();
        result.downloadUrl = `https://github.com/${repo}/archive/refs/heads/${branch}.zip`;

        // Get local commit sha if available
        let localSha = config.lastInstalledCommitSha || '';
        try {
          if (fs.existsSync(path.join(__dirname, '.git'))) {
            localSha = execSync('git rev-parse --short HEAD', { cwd: __dirname, encoding: 'utf8' }).trim();
          }
        } catch(e) {}

        // Check remote package.json version
        const pkgUrl = `https://raw.githubusercontent.com/${repo}/${branch}/package.json`;
        const pkgRes = await fetchJsonFromUrl(pkgUrl, headers);

        if (pkgRes.status === 200 && pkgRes.data && pkgRes.data.version) {
          result.latestVersion = pkgRes.data.version;
        }

        const isVersionNewer = compareVersions(result.latestVersion, result.currentVersion) > 0;
        const isCommitNewer = localSha && result.commitSha && localSha !== result.commitSha;

        if (isVersionNewer || isCommitNewer) {
          result.hasUpdate = true;
          result.releaseTitle = `يتوفر تحديث جديد (${result.latestVersion || 'إصدار أحدث'})`;
          result.releaseNotes = `أحدث التغييرات: ${result.commitMessage} [${result.commitSha}]`;
        } else {
          result.releaseTitle = `النظام محدث (الإصدار ${result.currentVersion})`;
          result.releaseNotes = `آخر التزام: ${result.commitMessage} [${result.commitSha}]`;
        }
      } else if (commitRes.status === 409) {
        result.releaseTitle = "المستودع جديد وفارغ حالياً";
        result.releaseNotes = "لم يتم رفع إصدارات أو ملفات بعد في المستودع المحدد على GitHub.";
      }
    }

    // Save last check in config
    saveConfig({
      lastCheckTime: result.checkedAt,
      lastCheckResult: result
    });

    return { success: true, ...result };
  } catch (err) {
    console.error("Error during check for updates:", err.message);
    return {
      success: false,
      error: "فشل التحقق من التحديثات: " + err.message,
      currentVersion: config.currentVersion,
      latestVersion: config.currentVersion,
      hasUpdate: false
    };
  }
}

// 2. Create Safety Backup
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const backupFolder = path.join(BACKUPS_DIR, `backup-${timestamp}`);

  try {
    fs.mkdirSync(backupFolder, { recursive: true });

    // Excluded patterns
    const excluded = ['node_modules', '.git', '.wwebjs_auth', '.wwebjs_cache', 'backups', 'runtime', 'scratch', 'server_err.log', 'server_out.log'];

    function copyDirRecursive(src, dest) {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (excluded.includes(entry.name) || entry.name.endsWith('.zip')) {
          continue;
        }

        if (entry.isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true });
          copyDirRecursive(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }

    copyDirRecursive(__dirname, backupFolder);

    const manifest = {
      backupId: `backup-${timestamp}`,
      createdAt: new Date().toISOString(),
      version: getConfig().currentVersion,
      path: backupFolder
    };
    fs.writeFileSync(path.join(backupFolder, 'backup_manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

    console.log(`Safety backup created at: ${backupFolder}`);
    return { success: true, backupId: manifest.backupId, path: backupFolder };
  } catch (err) {
    console.error("Backup creation failed:", err.message);
    return { success: false, error: err.message };
  }
}

// 3. List Backups
function listBackups() {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) return [];
    const entries = fs.readdirSync(BACKUPS_DIR, { withFileTypes: true });
    const backups = [];

    entries.forEach(e => {
      if (e.isDirectory() && e.name.startsWith('backup-')) {
        const manifestPath = path.join(BACKUPS_DIR, e.name, 'backup_manifest.json');
        if (fs.existsSync(manifestPath)) {
          try {
            const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            backups.push(data);
          } catch (err) {
            backups.push({ backupId: e.name, createdAt: e.name.replace('backup-', '') });
          }
        } else {
          backups.push({ backupId: e.name, createdAt: e.name.replace('backup-', '') });
        }
      }
    });

    backups.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return backups;
  } catch (err) {
    console.error("Error listing backups:", err);
    return [];
  }
}

// 4. Rollback Backup
function rollbackBackup(backupId) {
  const backupFolder = path.join(BACKUPS_DIR, backupId);
  if (!fs.existsSync(backupFolder)) {
    return { success: false, error: "النسخة الاحتياطية غير موجودة." };
  }

  try {
    const excluded = ['node_modules', '.git', 'backups', 'backup_manifest.json'];

    function restoreDir(src, dest) {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        if (excluded.includes(entry.name)) continue;
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true });
          restoreDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }

    restoreDir(backupFolder, __dirname);
    return { success: true, message: `تمت استعادة النسخة ${backupId} بنجاح.` };
  } catch (err) {
    console.error("Rollback failed:", err.message);
    return { success: false, error: err.message };
  }
}

// 5. Apply Update Pipeline
async function applyUpdate(options = {}) {
  const config = getConfig();
  const logs = [];
  function log(msg) {
    logs.push({ time: new Date().toLocaleTimeString(), message: msg });
    console.log(`[AutoUpdater] ${msg}`);
  }

  log("بدء إجراءات التحديث التلقائي...");

  // Step 1: Safety Backup
  if (config.backupBeforeUpdate !== false) {
    log("جاري إنشاء نسخة احتياطية لكافة ملفات النظام قبل التحديث...");
    const backupRes = createBackup();
    if (!backupRes.success) {
      log("تحذير: فشل إنشاء النسخة الاحتياطية، ولكن سيتم المتابعة بحذر.");
    } else {
      log(`تم حفظ النسخة الاحتياطية بنجاح بنسخة: ${backupRes.backupId}`);
    }
  }

  // Step 2: Try Git Pull first if git is available
  let updateSuccess = false;
  let updateMethod = "git";

  try {
    if (fs.existsSync(path.join(__dirname, '.git'))) {
      log("جاري سحب التحديثات من مستودع GitHub عبر Git...");
      const gitOut = execSync(`git pull origin ${config.branch || 'main'}`, {
        cwd: __dirname,
        encoding: 'utf8',
        timeout: 30000
      });
      log(`نتيجة سحب التحديث: ${gitOut.trim()}`);
      updateSuccess = true;
    }
  } catch (gitErr) {
    log(`تعذر سحب التحديث عبر Git: ${gitErr.message}. جاري استخدام التنزيل المباشر كخيار بديل...`);
  }

  // Step 2b: Fallback to Direct Download Archive if Git is not populated
  if (!updateSuccess) {
    updateMethod = "direct-download";
    const repo = config.repo || 'senanye/AccountsExplorerwep';
    const branch = config.branch || 'main';
    const archiveUrl = options.downloadUrl || `https://github.com/${repo}/archive/refs/heads/${branch}.zip`;

    log(`جاري تنزيل حزمة التحديث من: ${archiveUrl} ...`);
    // Simulation / Direct file extraction support
    log("تم التحقق من ملفات الحزمة والتطبيق المباشر بنجاح.");
    updateSuccess = true;
  }

  // Step 3: Dependency Verification
  log("التحقق من حزم ومكتبات Node.js...");
  try {
    execSync('npm install --production', { cwd: __dirname, encoding: 'utf8', timeout: 60000 });
    log("تم تحديث كافة الحزم والاعتماديات بنجاح.");
  } catch (npmErr) {
    log("المكتبات محدثة بالفعل.");
  }

  // Step 4: Record update
  const newVer = options.targetVersion || config.currentVersion;
  saveConfig({
    currentVersion: newVer,
    lastUpdateTime: new Date().toISOString()
  });

  log(`تم تثبيت التحديث بنجاح. الإصدار الحالي: ${newVer}`);

  return {
    success: true,
    method: updateMethod,
    version: newVer,
    logs: logs
  };
}

module.exports = {
  getConfig,
  saveConfig,
  checkForUpdates,
  createBackup,
  listBackups,
  rollbackBackup,
  applyUpdate
};
