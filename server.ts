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

// MikroTik Hotspot /login endpoint
app.get(['/login', '/login.html', '/alogin', '/alogin.html'], (req, res) => {
  const isCallBack = req.query.var === 'callBack';
  const username = req.query.username as string;
  const domain = (req.query.domain as string) || '';

  if (isCallBack) {
    if (username) {
      // Extract @speed suffix from username if present (e.g. 123456@2M)
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

    // Initial check (before login submitted)
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

  // Regular direct request
  res.sendFile(path.join(__dirname, 'index.html'));
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

  // Direct page request
  res.cookie('hotspot_is_logged_in', sessionState.isLoggedIn ? '1' : '0', { path: '/' });
  res.sendFile(path.join(__dirname, 'index.html'));
});

// MikroTik Hotspot /logout endpoint
app.get(['/logout', '/logout.html'], (req, res) => {
  sessionState.isLoggedIn = false;
  res.cookie('hotspot_is_logged_in', '0', { path: '/' });
  const isCallBack = req.query.var === 'callBack';

  if (isCallBack) {
    return res.json({
      logged_in: 'no',
      action: 'onLoggedOut',
    });
  }

  res.redirect('/');
});

// Serve static assets from project root and specific subfolders
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

app.use('/fonts', express.static(path.join(__dirname, 'fonts')));
app.use('/adimg', express.static(path.join(__dirname, 'adimg')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/config', express.static(path.join(__dirname, 'config')));
app.use('/2024', express.static(path.join(__dirname, '2024')));
app.use(express.static(__dirname));

// Fallback route to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Hotspot Server] Running on http://0.0.0.0:${PORT}`);
});
