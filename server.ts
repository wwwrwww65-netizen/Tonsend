import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from root directory (such as hamza11.zip)
app.use(express.static(__dirname));

// In-memory simulation state for MikroTik Hotspot session
let sessionState = {
  isLoggedIn: false,
  username: '123456@2M',
  speed: '@2M',
  updateOption: '_Uon',
  bytesIn: 14680064,
  bytesOut: 58720256,
  remainBytes: 2147483648, // 2 GB
  startTime: Date.now(),
  ip: '10.0.0.25',
  mac: '64:6E:97:A1:B2:C3',
};

// Periodic simulated traffic increments if logged in
setInterval(() => {
  if (sessionState.isLoggedIn) {
    sessionState.bytesIn += Math.floor(Math.random() * 45000) + 5000;
    sessionState.bytesOut += Math.floor(Math.random() * 95000) + 15000;
    if (sessionState.remainBytes > 0) {
      sessionState.remainBytes = Math.max(0, sessionState.remainBytes - 120000);
    }
  }
}, 2000);

// Helper to format uptime
function getUptimeString(startTime: number): string {
  const diffSecs = Math.floor((Date.now() - startTime) / 1000);
  const hours = Math.floor(diffSecs / 3600);
  const minutes = Math.floor((diffSecs % 3600) / 60);
  const seconds = diffSecs % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// Download endpoint for hamza11.zip
app.get(['/download', '/download/hamza11.zip'], (req, res) => {
  const zipPath = path.join(__dirname, 'hamza11.zip');
  if (fs.existsSync(zipPath)) {
    return res.download(zipPath, 'hamza11.zip');
  }
  return res.status(404).send('File hamza11.zip not found');
});

// MikroTik Hotspot /login endpoint
app.get(['/login', '/login.html', '/alogin', '/alogin.html'], (req, res) => {
  const isCallBack = req.query.var === 'callBack';
  const username = req.query.username as string;
  const domain = (req.query.domain as string) || '';

  if (isCallBack) {
    if (username) {
      const speedMatch = username.match(/@(512K|1M|2M|4M|8M|12M|[0-9]+[KMkm])$/i);
      const extractedSpeed = speedMatch ? `@${speedMatch[1].toUpperCase()}` : (domain.split('_')[0] || '');

      sessionState.isLoggedIn = true;
      sessionState.username = username;
      sessionState.speed = extractedSpeed;
      sessionState.updateOption = domain.includes('_Uoff') ? '_Uoff' : '_Uon';
      sessionState.startTime = Date.now();

      const rawToken = `m056fd9fdfdsffsdffdfd1697455${sessionState.username}dsfd6571fgfgfgfgdf53sdfdsfgsd14`;

      return res.json({
        logged_in: 'yes',
        username: sessionState.username,
        mac: sessionState.mac,
        link_login_only: '/login',
        sspeed: `${sessionState.speed}_`,
        update: sessionState.updateOption,
        ip: sessionState.ip,
        bytes_in: String(sessionState.bytesIn),
        bytes_out: String(sessionState.bytesOut),
        remain_bytes_total: String(sessionState.remainBytes),
        session_time_left: '4h30m',
        uptime: getUptimeString(sessionState.startTime),
        bytesm: rawToken,
        session_time_left_secs: '16200',
        uptime_secs: '300',
        trial: 'no',
        login_by: 'username',
        action: 'onLoggedIn',
      });
    }

    const rawToken = `m056fd9fdfdsffsdffdfd1697455${sessionState.username}dsfd6571fgfgfgfgdf53sdfdsfgsd14`;

    return res.json({
      logged_in: sessionState.isLoggedIn ? 'yes' : 'no',
      link_login_only: '/login',
      link_logout: '/logout',
      link_status: '/status',
      nas_id: 'MikroTik-Hotspot-Server',
      ip: sessionState.ip,
      mac: sessionState.mac,
      trial: 'no',
      username: sessionState.isLoggedIn ? sessionState.username : '',
      sspeed: `${sessionState.speed}_`,
      update: sessionState.updateOption,
      bytes_in: String(sessionState.bytesIn),
      bytes_out: String(sessionState.bytesOut),
      remain_bytes_total: String(sessionState.remainBytes),
      session_time_left: '4h15m',
      uptime: getUptimeString(sessionState.startTime),
      bytesm: rawToken,
      action: 'onLoginStart',
    });
  }

  renderServerPage(req, res);
});

// MikroTik Hotspot /status endpoint
app.get(['/status', '/status.html'], (req, res) => {
  const isCallBack = req.query.var === 'callBack';

  if (isCallBack) {
    const rawToken = `m056fd9fdfdsffsdffdfd1697455${sessionState.username}dsfd6571fgfgfgfgdf53sdfdsfgsd14`;

    return res.json({
      logged_in: sessionState.isLoggedIn ? 'yes' : 'no',
      mac: sessionState.mac,
      sspeed: `${sessionState.speed}_`,
      update: sessionState.updateOption,
      ip: sessionState.ip,
      bytes_in: String(sessionState.bytesIn),
      bytes_out: String(sessionState.bytesOut),
      remain_bytes_total: String(sessionState.remainBytes),
      session_time_left: '4h15m',
      uptime: getUptimeString(sessionState.startTime),
      bytesm: rawToken,
      trial: 'no',
      username: sessionState.username,
      action: 'onStatusQuery',
    });
  }

  renderServerPage(req, res);
});

// MikroTik Hotspot /logout endpoint
app.get(['/logout', '/logout.html'], (req, res) => {
  sessionState.isLoggedIn = false;
  const isCallBack = req.query.var === 'callBack';

  if (isCallBack) {
    return res.json({
      logged_in: 'no',
      action: 'onLoggedOut',
    });
  }

  res.redirect('/?logged=no');
});

// API Info endpoint
app.get('/api/server-info', (req, res) => {
  const zipPath = path.join(__dirname, 'hamza11.zip');
  const exists = fs.existsSync(zipPath);
  let size = 0;
  if (exists) {
    size = fs.statSync(zipPath).size;
  }

  res.json({
    status: 'online',
    port: PORT,
    files: {
      hamza11_zip: {
        exists,
        filename: 'hamza11.zip',
        size_bytes: size,
        size_formatted: `${(size / (1024 * 1024)).toFixed(2)} MB`,
        download_url: '/hamza11.zip'
      }
    },
    session: sessionState
  });
});

// Built-in status and control dashboard
function renderServerPage(req: express.Request, res: express.Response) {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  const zipPath = path.join(__dirname, 'hamza11.zip');
  const zipExists = fs.existsSync(zipPath);
  const zipSize = zipExists ? (fs.statSync(zipPath).size / (1024 * 1024)).toFixed(2) : '0';

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>خادم ميكروتك | MikroTik Server</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 1rem;
      max-width: 640px;
      width: 100%;
      padding: 2rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      margin-bottom: 1.25rem;
    }
    .badge .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
    }
    h1 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 0.5rem;
    }
    p.desc {
      color: #94a3b8;
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .file-box {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 0.75rem;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .file-info {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .file-icon {
      font-size: 2rem;
      background: #0f172a;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.5rem;
      border: 1px solid #334155;
    }
    .file-name {
      font-weight: 600;
      color: #f1f5f9;
      font-size: 1rem;
      direction: ltr;
      text-align: right;
    }
    .file-meta {
      font-size: 0.8rem;
      color: #94a3b8;
      margin-top: 0.2rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #2563eb;
      color: #ffffff;
      padding: 0.65rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 0.15s ease;
    }
    .btn:hover {
      background: #1d4ed8;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .stat-item {
      background: #0f172a;
      border: 1px solid #1e293b;
      padding: 0.85rem;
      border-radius: 0.5rem;
    }
    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
      margin-bottom: 0.25rem;
    }
    .stat-value {
      font-size: 0.95rem;
      font-weight: 600;
      color: #cbd5e1;
      font-family: monospace;
    }
    .endpoints {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 0.5rem;
      padding: 1rem;
    }
    .endpoints-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }
    .endpoint-link {
      display: block;
      color: #60a5fa;
      font-family: monospace;
      font-size: 0.85rem;
      text-decoration: none;
      padding: 0.25rem 0;
      direction: ltr;
      text-align: left;
    }
    .endpoint-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="dot"></span>
      <span>الخادم يعمل بنجاح (Active &amp; Online)</span>
    </div>
    <h1>خادم ميكروتك (MikroTik Server)</h1>
    <p class="desc">تم تنظيف المشروع والاحتفاظ بملفات السيرفر الأساسية وملف الأرشيف المضغوط المطلوب بنجاح.</p>

    <div class="file-box">
      <div class="file-info">
        <div class="file-icon">📦</div>
        <div>
          <div class="file-name">hamza11.zip</div>
          <div class="file-meta">الحجم: ${zipSize} ميغابايت &bull; حالة الملف: ${zipExists ? 'جاهز ومتوفر' : 'غير متوفر'}</div>
        </div>
      </div>
      <a href="/hamza11.zip" class="btn" download>تحميل الملف</a>
    </div>

    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-label">منفذ الخادم (Port)</div>
        <div class="stat-value">${PORT}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">نواة التشغيل (Runtime)</div>
        <div class="stat-value">Node.js + Express</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">حالة الجلسة (Session)</div>
        <div class="stat-value">${sessionState.isLoggedIn ? 'متصل (Logged in)' : 'غير متصل (Idle)'}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">مدة التشغيل (Uptime)</div>
        <div class="stat-value">${getUptimeString(sessionState.startTime)}</div>
      </div>
    </div>

    <div class="endpoints">
      <div class="endpoints-title">نقاط الاتصال البرمجية المتوفرة (API Endpoints):</div>
      <a href="/hamza11.zip" class="endpoint-link">GET /hamza11.zip</a>
      <a href="/api/server-info" class="endpoint-link">GET /api/server-info</a>
      <a href="/status?var=callBack" class="endpoint-link">GET /status?var=callBack</a>
      <a href="/login?var=callBack" class="endpoint-link">GET /login?var=callBack</a>
    </div>
  </div>
</body>
</html>`;

  res.send(html);
}

// Fallback route
app.get('*', (req, res) => {
  renderServerPage(req, res);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Hotspot Server] Running on http://0.0.0.0:${PORT}`);
});
