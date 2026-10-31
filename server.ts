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

// Serve static assets directly (css, js, images, zip, etc.)
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use(express.static(__dirname));

// Session simulation state for the MikroTik Hotspot
interface SessionState {
  isLoggedIn: boolean;
  username: string;
  speed: string;
  domain: string;
  bytesIn: number;
  bytesOut: number;
  remainBytes: number;
  startTime: number;
  ip: string;
  mac: string;
}

let sessionState: SessionState = {
  isLoggedIn: false,
  username: '777723089',
  speed: '512K/1M',
  domain: '512K/1M|0|pm|all|*no**|non***',
  bytesIn: 18454937,
  bytesOut: 75239424,
  remainBytes: 2147483648, // 2 GB
  startTime: Date.now() - 3600000,
  ip: '192.168.88.25',
  mac: '44:65:7F:8A:2B:11',
};

// Periodic simulated byte counter increment
setInterval(() => {
  if (sessionState.isLoggedIn) {
    sessionState.bytesIn += Math.floor(Math.random() * 50000) + 10000;
    sessionState.bytesOut += Math.floor(Math.random() * 120000) + 25000;
    if (sessionState.remainBytes > 0) {
      sessionState.remainBytes = Math.max(0, sessionState.remainBytes - 130000);
    }
  }
}, 2000);

// Helper for human-readable byte formats
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GiB`;
}

// Helper for uptime format
function getUptimeString(startTime: number): string {
  const diffSecs = Math.floor((Date.now() - startTime) / 1000);
  const hours = Math.floor(diffSecs / 3600);
  const minutes = Math.floor((diffSecs % 3600) / 60);
  const seconds = diffSecs % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// Function to render MikroTik template with variables dynamically without touching files on disk
function renderMikrotikTemplate(filePath: string, req: express.Request): string {
  let content = fs.readFileSync(filePath, 'utf-8');

  const uptime = getUptimeString(sessionState.startTime);
  const bytesInNice = formatBytes(sessionState.bytesIn);
  const bytesOutNice = formatBytes(sessionState.bytesOut);
  const remainBytesNice = formatBytes(sessionState.remainBytes);
  const errorMsg = (req.query.error as string) || '';

  // Process MikroTik conditionals $(if ...)...$(endif)
  content = content.replace(/\$\(if chap-id\)[\s\S]*?\$\(endif\)/gi, '');
  content = content.replace(/\$\(if refresh-timeout\)[\s\S]*?\$\(endif\)/gi, '');
  content = content.replace(/\$\(if advert-pending == 'yes'\)[\s\S]*?\$\(endif\)/gi, '');
  content = content.replace(/\$\(if login-by == 'trial'\)[\s\S]*?\$\(endif\)/gi, '');
  content = content.replace(/\$\(if session-time-left\)[\s\S]*?\$\(endif\)/gi, '');
  content = content.replace(/\$\(if blocked == 'yes'\)[\s\S]*?\$\(endif\)/gi, '');
  content = content.replace(/\$\(if login-by-mac != 'yes'\)/gi, '');

  if (errorMsg) {
    content = content.replace(/\$\(if error\)([\s\S]*?)\$\(endif\)/gi, '$1');
  } else {
    content = content.replace(/\$\(if error\)[\s\S]*?\$\(endif\)/gi, '');
  }

  // Replace MikroTik variables
  const replacements: Record<string, string> = {
    '$(link-login-only)': '/login',
    '$(link-status)': '/status',
    '$(link-logout)': '/logout',
    '$(link-orig)': '/status',
    '$(link-orig-esc)': '/status',
    '$(username)': sessionState.username,
    '$(uptime)': uptime,
    '$(bytes-in-nice)': bytesInNice,
    '$(bytes-out-nice)': bytesOutNice,
    '$(bytes-in)': String(sessionState.bytesIn),
    '$(bytes-out)': String(sessionState.bytesOut),
    '$(remain-bytes-total-nice)': remainBytesNice,
    '$(remain-bytes-total)': String(sessionState.remainBytes),
    '$(session-time-left)': '4h 15m',
    '$(ip)': sessionState.ip,
    '$(mac)': sessionState.mac,
    '$(domain)': sessionState.domain,
    '$(error)': errorMsg,
  };

  for (const [key, val] of Object.entries(replacements)) {
    content = content.split(key).join(val);
  }

  // Clean any remaining unparsed $(...) macros safely
  content = content.replace(/\$\([a-zA-Z0-9_-]+\)/g, '');

  return content;
}

// /login routes (GET and POST)
app.get(['/login', '/login.html'], (req, res) => {
  const isCallBack = req.query.var === 'callBack';
  if (isCallBack) {
    return res.json({
      logged_in: sessionState.isLoggedIn ? 'yes' : 'no',
      username: sessionState.username,
      mac: sessionState.mac,
      ip: sessionState.ip,
      uptime: getUptimeString(sessionState.startTime),
      bytes_in: String(sessionState.bytesIn),
      bytes_out: String(sessionState.bytesOut),
    });
  }

  const loginFile = path.join(__dirname, 'login.html');
  if (fs.existsSync(loginFile)) {
    const rendered = renderMikrotikTemplate(loginFile, req);
    return res.setHeader('Content-Type', 'text/html; charset=UTF-8').send(rendered);
  }
  return res.status(404).send('login.html not found');
});

app.post(['/login', '/login.html'], (req, res) => {
  const username = (req.body.username as string) || (req.query.username as string) || '777723089';
  const speed = (req.body.speed as string) || (req.query.speed as string) || '512K/1M';

  sessionState.isLoggedIn = true;
  sessionState.username = username;
  sessionState.speed = speed;
  sessionState.domain = speed.startsWith('@') ? speed.slice(1) : speed;
  sessionState.startTime = Date.now();

  res.cookie('hotspot_is_logged_in', '1', { path: '/' });
  res.redirect('/status');
});

// /status routes
app.get(['/status', '/status.html'], (req, res) => {
  const isCallBack = req.query.var === 'callBack';
  if (isCallBack) {
    return res.json({
      logged_in: sessionState.isLoggedIn ? 'yes' : 'no',
      username: sessionState.username,
      mac: sessionState.mac,
      ip: sessionState.ip,
      uptime: getUptimeString(sessionState.startTime),
      bytes_in: String(sessionState.bytesIn),
      bytes_out: String(sessionState.bytesOut),
      remain_bytes_total: String(sessionState.remainBytes),
    });
  }

  const statusFile = path.join(__dirname, 'status.html');
  if (fs.existsSync(statusFile)) {
    const rendered = renderMikrotikTemplate(statusFile, req);
    return res.setHeader('Content-Type', 'text/html; charset=UTF-8').send(rendered);
  }
  return res.status(404).send('status.html not found');
});

// /logout routes
app.get(['/logout', '/logout.html'], (req, res) => {
  sessionState.isLoggedIn = false;
  res.clearCookie('hotspot_is_logged_in', { path: '/' });

  const logoutFile = path.join(__dirname, 'logout.html');
  if (fs.existsSync(logoutFile)) {
    const rendered = renderMikrotikTemplate(logoutFile, req);
    return res.setHeader('Content-Type', 'text/html; charset=UTF-8').send(rendered);
  }
  return res.redirect('/login');
});

// /alogin and /rlogin routes
app.get(['/alogin', '/alogin.html'], (req, res) => {
  const aloginPath = path.join(__dirname, 'alogin.html');
  if (fs.existsSync(aloginPath)) {
    return res.sendFile(aloginPath);
  }
  res.redirect('/status');
});

app.get(['/rlogin', '/rlogin.html'], (req, res) => {
  const rloginPath = path.join(__dirname, 'rlogin.html');
  if (fs.existsSync(rloginPath)) {
    return res.sendFile(rloginPath);
  }
  res.redirect('/login');
});

// Root URL handler
app.get(['/', '/index.html'], (req, res) => {
  if (sessionState.isLoggedIn) {
    return res.redirect('/status');
  }
  const loginFile = path.join(__dirname, 'login.html');
  if (fs.existsSync(loginFile)) {
    const rendered = renderMikrotikTemplate(loginFile, req);
    return res.setHeader('Content-Type', 'text/html; charset=UTF-8').send(rendered);
  }
  return res.status(404).send('Portal not found');
});

// Direct hamza11.zip download endpoint
app.get('/hamza11.zip', (req, res) => {
  const zipFile = path.join(__dirname, 'hamza11.zip');
  if (fs.existsSync(zipFile)) {
    return res.sendFile(zipFile);
  }
  res.status(404).send('hamza11.zip not found');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Hotspot Server] Running on http://0.0.0.0:${PORT}`);
});
