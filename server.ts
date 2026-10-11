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

// In-memory simulation state for MikroTik Hotspot session (Al-Khalid Net)
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

// Helper to format uptime into Arabic-friendly / Hotspot-friendly string
function getUptimeString(startTime: number): string {
  const diffSecs = Math.floor((Date.now() - startTime) / 1000);
  const hours = Math.floor(diffSecs / 3600);
  const minutes = Math.floor((diffSecs % 3600) / 60);
  const seconds = diffSecs % 60;
  if (hours > 0) return `${hours}h${minutes}m${seconds}s`;
  if (minutes > 0) return `${minutes}m${seconds}s`;
  return `${seconds}s`;
}

// Function to render MikroTik template files with live simulated variables
function renderMikrotikTemplate(filePath: string, state: typeof sessionState): string {
  if (!fs.existsSync(filePath)) return '';
  let content = fs.readFileSync(filePath, 'utf-8');

  // Handle $(if var == "") ... $(else) ... $(endif)
  if (content.includes('$(if var == "")')) {
    const startIdx = content.indexOf('$(if var == "")');
    const elseIdx = content.indexOf('$(else)');
    const endIdx = content.lastIndexOf('$(endif)');
    if (startIdx !== -1 && elseIdx !== -1 && endIdx !== -1) {
      content = content.substring(startIdx + '$(if var == "")'.length, elseIdx);
    }
  }

  // Handle simple conditions
  content = content.replace(/\$\(if login-by-mac != ['"]yes['"]\)([\s\S]*?)\$\(endif\)/g, '$1');
  content = content.replace(/\$\(if logged-in == ['"]yes['"]\)([\s\S]*?)\$\(endif\)/g, state.isLoggedIn ? '$1' : '');
  content = content.replace(/\$\(if logged-in != ['"]yes['"]\)([\s\S]*?)\$\(endif\)/g, !state.isLoggedIn ? '$1' : '');
  content = content.replace(/\$\(if logged-in\)([\s\S]*?)\$\(endif\)/g, state.isLoggedIn ? '$1' : '');
  content = content.replace(/\$\(if remain-bytes-total\)([\s\S]*?)\$\(endif\)/g, '$1');
  content = content.replace(/\$\(if session-time-left\)([\s\S]*?)\$\(endif\)/g, '$1');
  content = content.replace(/\$\(if refresh-timeout\)([\s\S]*?)\$\(endif\)/g, '');
  content = content.replace(/\$\(if domain\)([\s\S]*?)\$\(else\)([\s\S]*?)\$\(endif\)/g, state.speed ? '$1' : '$2');
  content = content.replace(/\$\(if error\)([\s\S]*?)\$\(endif\)/g, '');

  // Replace MikroTik variables
  content = content.replace(/\$\(username\)/g, state.isLoggedIn ? state.username : '');
  content = content.replace(/\$\(ip\)/g, state.ip);
  content = content.replace(/\$\(mac-esc\)/g, state.mac.replace(/:/g, '%3A'));
  content = content.replace(/\$\(mac\)/g, state.mac);
  content = content.replace(/\$\(bytes-in\)/g, String(state.bytesIn));
  content = content.replace(/\$\(bytes-out\)/g, String(state.bytesOut));
  content = content.replace(/\$\(remain-bytes-total\)/g, String(state.remainBytes));
  content = content.replace(/\$\(uptime\)/g, getUptimeString(state.startTime));
  content = content.replace(/\$\(session-time-left\)/g, '4h15m');
  content = content.replace(/\$\(refresh-timeout-secs\)/g, '10');
  content = content.replace(/\$\(domain\)/g, state.speed || '@2M');
  content = content.replace(/\$\(identity\)/g, 'الخالد نت');
  content = content.replace(/\$\(trial\)/g, 'no');
  content = content.replace(/\$\(logged-in\)/g, state.isLoggedIn ? 'yes' : 'no');
  content = content.replace(/\$\(link-login\)/g, '/login');
  content = content.replace(/\$\(link-login-only\)/g, '/login');
  content = content.replace(/\$\(link-logout\)/g, '/logout');
  content = content.replace(/\$\(link-status\)/g, '/status');
  content = content.replace(/\$\(link-redirect\)/g, '/status');
  content = content.replace(/\$\(link-redirect-esc\)/g, '%2Fstatus');
  content = content.replace(/\$\(chap-id\)/g, '01');
  content = content.replace(/\$\(chap-challenge\)/g, 'abc123challenge');

  return content;
}

// POST /login - Handle native login form submit from MikroTik portal
app.post(['/login', '/login.html'], (req, res) => {
  const username = req.body.username || req.query.username || '123456';
  const speed = req.body.speed || req.query.speed || '@2M';
  const combinedUsername = username.includes('@') ? username : `${username}${speed}`;

  sessionState.isLoggedIn = true;
  sessionState.username = combinedUsername;
  sessionState.speed = speed || '@2M';
  sessionState.startTime = Date.now();

  res.cookie('hotspot_is_logged_in', '1', { path: '/' });

  // Native MikroTik behavior redirects to status
  return res.redirect('/status');
});

// GET / or /login - Login page or AJAX status query
app.get(['/', '/login', '/login.html'], (req, res) => {
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
        link_logout: '/logout',
        link_status: '/status',
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
      nas_id: 'AlKhalidNet-MikroTik',
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

  // If already logged in, native MikroTik redirects to status
  if (sessionState.isLoggedIn) {
    res.cookie('hotspot_is_logged_in', '1', { path: '/' });
    return res.redirect('/status');
  }

  res.clearCookie('hotspot_is_logged_in', { path: '/' });
  const rendered = renderMikrotikTemplate(path.join(__dirname, 'login.html'), sessionState);
  res.send(rendered);
});

// GET /status - Serve dedicated status page with live simulated metrics
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

  // If not logged in, simulate captive portal redirect to login
  if (!sessionState.isLoggedIn) {
    res.clearCookie('hotspot_is_logged_in', { path: '/' });
    return res.redirect('/login');
  }

  res.cookie('hotspot_is_logged_in', '1', { path: '/' });
  const rendered = renderMikrotikTemplate(path.join(__dirname, 'status.html'), sessionState);
  res.send(rendered);
});

// POST /logout - Handle native logout form submit
app.post(['/logout', '/logout.html'], (req, res) => {
  sessionState.isLoggedIn = false;
  res.clearCookie('hotspot_is_logged_in', { path: '/' });
  const rendered = renderMikrotikTemplate(path.join(__dirname, 'logout.html'), sessionState);
  res.send(rendered);
});

// GET /logout - Handle logout link click or AJAX logout
app.get(['/logout', '/logout.html'], (req, res) => {
  sessionState.isLoggedIn = false;
  res.clearCookie('hotspot_is_logged_in', { path: '/' });
  const isCallBack = req.query.var === 'callBack';

  if (isCallBack) {
    return res.json({
      logged_in: 'no',
      action: 'onLoggedOut',
    });
  }

  const rendered = renderMikrotikTemplate(path.join(__dirname, 'logout.html'), sessionState);
  res.send(rendered);
});

// GET /alogin - Post-login redirection page
app.get(['/alogin', '/alogin.html'], (req, res) => {
  const rendered = renderMikrotikTemplate(path.join(__dirname, 'alogin.html'), sessionState);
  res.send(rendered);
});

// Control Panel routes
app.get(['/dashboard', '/dashboard.html', '/admin', '/admin.html', '/control', '/control.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Public API endpoints for Notifications / Announcements system
app.get('/api/v1/public/content', (req, res) => {
  res.json({
    success: true,
    data: {
      notifications: [],
      announcements: []
    }
  });
});

// Dynamic ad images discovery endpoint
app.get('/api/v1/ad-images', (req, res) => {
  try {
    const adimgPath = path.join(__dirname, 'adimg');
    if (fs.existsSync(adimgPath)) {
      const files = fs.readdirSync(adimgPath)
        .filter(file => /\.(jpe?g|png|webp|gif|svg)$/i.test(file))
        .sort((a, b) => {
          const numA = parseInt(a, 10);
          const numB = parseInt(b, 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.localeCompare(b, undefined, { numeric: true });
        });
      return res.json({ success: true, images: files });
    }
    return res.json({ success: true, images: [] });
  } catch (err) {
    return res.json({ success: false, images: [] });
  }
});

app.use('/fonts', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=604800');
  next();
}, express.static(path.join(__dirname, 'fonts')));

app.use('/adimg', express.static(path.join(__dirname, 'adimg')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/config', express.static(path.join(__dirname, 'config')));
app.use('/2024', express.static(path.join(__dirname, '2024')));
app.use(express.static(__dirname));

// Fallback route to login
app.get('*', (req, res) => {
  const rendered = renderMikrotikTemplate(path.join(__dirname, 'login.html'), sessionState);
  res.send(rendered);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Hotspot Server] Running on http://0.0.0.0:${PORT}`);
});
