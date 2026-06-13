const { app, BrowserWindow, shell, ipcMain, session, net } = require('electron');
const path   = require('path');
const fs     = require('fs');
const https  = require('https');
const os     = require('os');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');

// Promisified exec — used everywhere instead of execSync so spawning external
// processes (tasklist, reg, powershell) never blocks Electron's main-process
// event loop. Synchronous execSync froze the UI for ~1s on every Performance poll.
const execAsync = promisify(exec);

// Per-account PID tracking so we can kill only that account's Roblox process.
const accountPidMap = {};

async function getRobloxPids() {
  try {
    const { stdout: out } = await execAsync(
      'tasklist /FI "IMAGENAME eq RobloxPlayerBeta.exe" /FO CSV /NH',
      { encoding: 'utf-8', windowsHide: true, timeout: 5000 },
    );
    return out.split('\n')
      .map(l => l.trim())
      .filter(l => l.toLowerCase().startsWith('"robloxplayerbeta'))
      .map(l => parseInt(l.split(',')[1]?.replace(/"/g, '') ?? '', 10))
      .filter(p => !isNaN(p));
  } catch { return []; }
}

// Pin userData to a stable location so localStorage survives between launches.
// Without this, portable exes can resolve to different temp paths each run,
// causing a fresh localStorage (and lost accounts) every startup.
app.setPath('userData', path.join(app.getPath('appData'), 'RobloxAccountManager'));

const IS_PACKAGED = app.isPackaged;
const LOGIN_PARTITION = 'roblox-login-temp';

// ── Logging ───────────────────────────────────────────────────────────────────
const LOG_PATH = () => path.join(app.getPath('userData'), 'ram.log');

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(' ')}\n`;
  try { fs.appendFileSync(LOG_PATH(), line); } catch {}
  console.log(...args);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    title: 'Poob Roblox Account Manager',
    backgroundColor: '#050816',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    show: false,
  });

  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (IS_PACKAGED) {
    win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  } else {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

ipcMain.handle('get-log-path', () => LOG_PATH());
ipcMain.handle('open-log', () => shell.openPath(LOG_PATH()));

// ── App settings (multi-instance, etc.) ──────────────────────────────────────
const settingsFilePath = () => path.join(app.getPath('userData'), 'settings.json');

function loadAppSettings() {
  try {
    const p = settingsFilePath();
    if (!fs.existsSync(p)) return {};
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return {}; }
}

function saveAppSettings(settings) {
  try {
    const p = settingsFilePath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(settings, null, 2), 'utf-8');
  } catch {}
}

// ── Password protection ───────────────────────────────────────────────────────

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

ipcMain.handle('get-password-settings', () => {
  const s = loadAppSettings();
  return { enabled: !!s.passwordEnabled, hasPassword: !!s.passwordHash };
});

ipcMain.handle('set-password', (_event, password) => {
  const s = loadAppSettings();
  s.passwordHash = hashPassword(password);
  saveAppSettings(s);
  return true;
});

ipcMain.handle('verify-password', (_event, password) => {
  const s = loadAppSettings();
  if (!s.passwordHash) return true;
  return hashPassword(password) === s.passwordHash;
});

ipcMain.handle('set-password-enabled', (_event, enabled) => {
  const s = loadAppSettings();
  s.passwordEnabled = enabled;
  if (!enabled) delete s.passwordHash;
  saveAppSettings(s);
  return true;
});

// ── Roblox process detection ──────────────────────────────────────────────────

ipcMain.handle('check-roblox-running', async () => {
  const names = ['RobloxPlayerBeta.exe', 'RobloxPlayer.exe'];
  for (const name of names) {
    try {
      const { stdout: out } = await execAsync(`tasklist /FI "IMAGENAME eq ${name}" /NH`, {
        encoding: 'utf-8', timeout: 3000, windowsHide: true,
      });
      if (out.toLowerCase().includes(name.toLowerCase())) return true;
    } catch { /* ignore */ }
  }
  return false;
});

// ── Multi-instance mutex ──────────────────────────────────────────────────────
// Roblox's bootstrapper checks for "ROBLOX_singletonMutex" before launching.
// If the mutex exists but is owned by a non-Roblox process (us), it can't find
// an existing Roblox window to activate and falls through, launching normally.
// This lets multiple accounts run simultaneously — same technique as ic3w0lf22/RAM.
let mutexProc = null;

function enableMultiInstance() {
  if (mutexProc) return;
  const script = [
    'try {',
    '  $m = New-Object System.Threading.Mutex($true, "ROBLOX_singletonMutex");',
    '  [System.Threading.Thread]::Sleep([System.Threading.Timeout]::Infinite)',
    '} catch {}',
  ].join(' ');
  mutexProc = spawn(
    'powershell',
    ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', script],
    { windowsHide: true, stdio: 'ignore' },
  );
  mutexProc.on('exit', () => { mutexProc = null; });
  log('multi-instance: mutex held (ROBLOX_singletonMutex)');
}

function disableMultiInstance() {
  if (!mutexProc) return;
  try { mutexProc.kill(); } catch {}
  mutexProc = null;
  log('multi-instance: mutex released');
}

ipcMain.handle('get-multi-instance', () => mutexProc !== null);

ipcMain.handle('set-multi-instance', (_event, enabled) => {
  if (enabled) enableMultiInstance();
  else disableMultiInstance();
  const s = loadAppSettings();
  s.multiInstance = enabled;
  saveAppSettings(s);
  return mutexProc !== null;
});

// ── Roblox login popup ────────────────────────────────────────────────────────
ipcMain.handle('login-with-roblox', async () => {
  const loginSes = session.fromPartition(LOGIN_PARTITION);
  await loginSes.clearStorageData();

  return new Promise((resolve) => {
    const popup = new BrowserWindow({
      width: 520,
      height: 700,
      title: 'Sign in to Roblox',
      autoHideMenuBar: true,
      resizable: true,
      webPreferences: {
        session: loginSes,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });

    popup.webContents.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    );

    popup.loadURL('https://www.roblox.com/login');

    let resolved = false;

    const onCookieChanged = async (_event, cookie, _cause, removed) => {
      if (cookie.name !== '.ROBLOSECURITY' || removed || resolved) return;
      resolved = true;
      loginSes.cookies.removeListener('changed', onCookieChanged);

      const cookieValue = cookie.value;

      let username = 'Unknown';
      let userId = null;
      let avatarUrl = null;

      try {
        const resp = await loginSes.fetch('https://users.roblox.com/v1/users/authenticated');
        if (resp.ok) {
          const data = await resp.json();
          username = data.name || 'Unknown';
          userId = data.id ?? null;
        }
      } catch { /* keep Unknown on network error */ }

      if (userId) {
        try {
          const thumbResp = await loginSes.fetch(
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=48x48&format=Png&isCircular=false`,
          );
          if (thumbResp.ok) {
            const thumbData = await thumbResp.json();
            avatarUrl = thumbData.data?.[0]?.imageUrl ?? null;
          }
        } catch { /* ignore */ }
      }

      setTimeout(() => {
        popup.destroy();
        resolve({ username, cookie: cookieValue, userId: userId ? String(userId) : null, avatarUrl });
      }, 700);
    };

    loginSes.cookies.on('changed', onCookieChanged);

    popup.on('closed', () => {
      loginSes.cookies.removeListener('changed', onCookieChanged);
      if (!resolved) resolve(null);
    });
  });
});

// ── HTTPS helper (avoids net::ERR_FAILED from Electron net.fetch) ─────────────
function httpsPost(url, headers, body = '{}') {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const buf = Buffer.from(body, 'utf-8');
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: { ...headers, 'Content-Length': buf.byteLength },
    }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => resolve({
        ok:     res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode,
        header: name => res.headers[name.toLowerCase()] ?? null,
        body:   data,
      }));
    });
    req.on('error', reject);
    req.write(buf);
    req.end();
  });
}

// ── Launch Roblox game ────────────────────────────────────────────────────────
const ROBLOX_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Reference implementation (ic3w0lf22) uses Brookhaven as the Referer — matches what
// the Roblox launcher sends and is required for the auth ticket request to succeed.
const TICKET_HEADERS = (cookie, csrf) => ({
  'User-Agent': ROBLOX_UA,
  'Cookie': `.ROBLOSECURITY=${cookie}`,
  'Content-Type': 'application/json;charset=UTF-8',
  'Referer': 'https://www.roblox.com/games/4924922222/Brookhaven-RP',
  ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
});

// Matches reference: two joined random numbers, ~12 digits total
function makeBrowserTrackerId() {
  const a = Math.floor(Math.random() * 75000) + 100000;
  const b = Math.floor(Math.random() * 800000) + 100000;
  return String(a) + String(b);
}

ipcMain.handle('launch-game', async (_event, { cookie, placeId, jobId, fpsLimit, accountId }) => {
  if (!cookie) {
    log('launch-game: no cookie');
    return { ok: false, error: 'No cookie stored for this account.' };
  }

  log(`launch-game: placeId=${placeId || 'none'} cookieLen=${cookie.length}`);

  try {
    // No place ID — open Roblox client home. launchmode:app rejects auth tickets;
    // the client keeps its own session after any authenticated game launch.
    if (!placeId) {
      await shell.openExternal('roblox-player:1+launchmode:app');
      log('launch-game: opened Roblox home (no place ID)');
      return { ok: true };
    }

    // Step 1 — POST without CSRF; Roblox returns 403 + x-csrf-token header
    const r1 = await httpsPost('https://auth.roblox.com/v1/authentication-ticket/', TICKET_HEADERS(cookie, null));
    log(`launch-game step1: status=${r1.status} body=${r1.body.slice(0, 200)}`);

    const csrfToken = r1.header('x-csrf-token');
    if (!csrfToken) {
      const msg = `CSRF fetch failed (HTTP ${r1.status}). Cookie may be invalid or expired — try re-adding the account.`;
      log('launch-game:', msg);
      return { ok: false, error: msg };
    }

    log('launch-game: got CSRF token');

    // Step 2 — POST with CSRF token; Roblox returns 200 + rbx-authentication-ticket header
    const r2 = await httpsPost('https://auth.roblox.com/v1/authentication-ticket/', TICKET_HEADERS(cookie, csrfToken));
    log(`launch-game step2: status=${r2.status} body=${r2.body.slice(0, 200)}`);

    if (!r2.ok) {
      const msg = `Auth ticket request failed (HTTP ${r2.status}): ${r2.body.slice(0, 200)}`;
      log('launch-game:', msg);
      return { ok: false, error: msg };
    }

    const ticket = r2.header('rbx-authentication-ticket');
    if (!ticket) {
      const msg = `No auth ticket in response (HTTP ${r2.status}). Body: ${r2.body.slice(0, 200)}`;
      log('launch-game:', msg);
      return { ok: false, error: msg };
    }

    log('launch-game: got auth ticket');

    const now = Date.now();
    const browserTrackerId = makeBrowserTrackerId();

    // Step 3 — build game launcher URL matching reference implementation exactly:
    //   .ashx (not .aspx), browserTrackerId in both the query string and as a
    //   separate segment, channel: empty, LaunchExp:InApp at the end.
    const requestType = jobId ? 'RequestGameJob' : 'RequestGame';
    const jobParam   = jobId ? `&gameId=${jobId}` : '';
    const placeLauncherUrl = `https://assetgame.roblox.com/game/PlaceLauncher.ashx?request=${requestType}&browserTrackerId=${browserTrackerId}&placeId=${placeId}${jobParam}&isPlayTogetherGame=false`;

    const launchUrl = [
      'roblox-player:1',
      'launchmode:play',
      `gameinfo:${ticket}`,
      `launchtime:${now}`,
      `placelauncherurl:${encodeURIComponent(placeLauncherUrl)}`,
      `browsertrackerid:${browserTrackerId}`,
      'robloxLocale:en_us',
      'gameLocale:en_us',
      'channel:',
      'LaunchExp:InApp',
    ].join('+');

    // Write FPS cap before launch, then keep rewriting every second for 20s.
    // The Roblox bootstrapper (RobloxPlayerLauncher.exe) can overwrite
    // ClientAppSettings.json while it runs; polling ensures our value wins
    // by the time RobloxPlayerBeta.exe actually starts and reads the file.
    if (typeof fpsLimit === 'number') {
      await applyFpsCap(fpsLimit);
      // Re-write every second for 20s — the bootstrapper can overwrite
      // ClientAppSettings.json while it runs, so we keep winning until the
      // client actually starts. Runs for unlimited too (now a written value).
      const deadline = Date.now() + 20000;
      const iv = setInterval(() => {
        if (Date.now() > deadline) { clearInterval(iv); return; }
        applyFpsCap(fpsLimit);
      }, 1000);
    }

    log(`launch-game: opening url (trackerId=${browserTrackerId})`);
    const pidsBefore = await getRobloxPids();
    await shell.openExternal(launchUrl);
    if (accountId != null) {
      setTimeout(async () => {
        const pidsAfter = await getRobloxPids();
        const newPid = pidsAfter.find(p => !pidsBefore.includes(p));
        if (newPid) { accountPidMap[accountId] = newPid; log(`launch-game: mapped accountId=${accountId} -> PID ${newPid}`); }
      }, 5000);
    }
    return { ok: true };
  } catch (err) {
    log('launch-game exception:', String(err));
    return { ok: false, error: String(err) };
  }
});

// ── File-based account persistence ───────────────────────────────────────────
// Stores accounts.json in the stable userData directory so they survive
// portable-exe restarts regardless of temp-path variation.

const accountsFilePath = () => path.join(app.getPath('userData'), 'accounts.json');

ipcMain.handle('load-accounts', () => {
  try {
    const p = accountsFilePath();
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return []; }
});

ipcMain.handle('save-accounts', (_event, accounts) => {
  try {
    const p = accountsFilePath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(accounts), 'utf-8');
    return true;
  } catch { return false; }
});

// ── Roblox presence polling ───────────────────────────────────────────────────
// Uses the account's own cookie so presence works even on private profiles.
// Returns a map of robloxUserId (string) → presence object.

ipcMain.handle('get-presence', async (_event, accts) => {
  // accts: Array<{ robloxUserId: string; cookie: string }>
  if (!accts || accts.length === 0) return {};

  const result = {};

  // Each account uses its own cookie — this guarantees lastLocation (game name)
  // is always visible regardless of privacy settings, because you can always see
  // your own presence data when authenticated as yourself.
  await Promise.allSettled(accts.map(async ({ robloxUserId, cookie }) => {
    if (!robloxUserId || !cookie) return;
    const uid = parseInt(robloxUserId, 10);
    if (isNaN(uid)) return;
    try {
      const resp = await net.fetch('https://presence.roblox.com/v1/presence/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `.ROBLOSECURITY=${cookie}`,
        },
        body: JSON.stringify({ userIds: [uid] }),
      });
      if (!resp.ok) return;
      const data = await resp.json();
      const p = (data.userPresences ?? []).find(x => x.userId === uid);
      if (p) result[robloxUserId] = p;
    } catch { /* ignore individual failures */ }
  }));

  return result;
});

// ── Roblox account stats ──────────────────────────────────────────────────────
// Fetches robux balance (needs own cookie), join date (batched), friends count,
// and followers count for a list of accounts. Returns partial results on failure.

ipcMain.handle('get-roblox-stats', async (_event, accts) => {
  // accts: Array<{ robloxUserId: string; cookie: string }>
  if (!accts || accts.length === 0) return {};

  const result = {};
  for (const { robloxUserId } of accts) {
    result[robloxUserId] = { robux: null, joinDate: null, friends: null, followers: null };
  }

  const firstCookie = accts.find(a => a.cookie)?.cookie;
  const authHeader  = firstCookie ? { 'Cookie': `.ROBLOSECURITY=${firstCookie}` } : {};

  // Per-account: join date, robux (own cookie), friends, followers in parallel
  await Promise.allSettled(accts.map(async ({ robloxUserId: uid, cookie }) => {
    await Promise.allSettled([
      // Join date — GET /v1/users/{uid} returns the `created` field (batch POST does not)
      (async () => {
        try {
          const r = await net.fetch(`https://users.roblox.com/v1/users/${uid}`, {
            headers: authHeader,
          });
          if (r.ok) {
            const d = await r.json();
            if (result[uid]) result[uid].joinDate = d.created ?? null;
          }
        } catch { /* ignore */ }
      })(),

      // Robux — requires this account's own cookie
      (async () => {
        if (!cookie) return;
        try {
          const r = await net.fetch(`https://economy.roblox.com/v1/users/${uid}/currency`, {
            headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` },
          });
          if (r.ok) {
            const d = await r.json();
            if (result[uid]) result[uid].robux = d.robux ?? null;
          }
        } catch { /* ignore */ }
      })(),

      // Friends count — public
      (async () => {
        try {
          const r = await net.fetch(`https://friends.roblox.com/v1/users/${uid}/friends/count`, {
            headers: authHeader,
          });
          if (r.ok) {
            const d = await r.json();
            if (result[uid]) result[uid].friends = d.count ?? null;
          }
        } catch { /* ignore */ }
      })(),

      // Followers count — public
      (async () => {
        try {
          const r = await net.fetch(`https://friends.roblox.com/v1/users/${uid}/followers/count`, {
            headers: authHeader,
          });
          if (r.ok) {
            const d = await r.json();
            if (result[uid]) result[uid].followers = d.count ?? null;
          }
        } catch { /* ignore */ }
      })(),
    ]);
  }));

  return result;
});

// ── Performance: system stats ─────────────────────────────────────────────────

function sampleCpuTimes() {
  return os.cpus().map(cpu => {
    const t = cpu.times;
    return { idle: t.idle, total: t.user + t.nice + t.sys + t.idle + t.irq };
  });
}

ipcMain.handle('get-system-stats', async () => {
  const s1 = sampleCpuTimes();
  await new Promise(r => setTimeout(r, 250));
  const s2 = sampleCpuTimes();
  let idleDelta = 0, totalDelta = 0;
  for (let i = 0; i < s1.length; i++) {
    idleDelta  += s2[i].idle  - s1[i].idle;
    totalDelta += s2[i].total - s1[i].total;
  }
  const cpu = totalDelta > 0 ? Math.round(((totalDelta - idleDelta) / totalDelta) * 100) : 0;
  const ramTotal = os.totalmem();
  return { cpu, ramUsed: ramTotal - os.freemem(), ramTotal };
});

// ── Performance: Roblox processes ────────────────────────────────────────────
// Two-sample CPU% via Get-Process .CPU delta over 500 ms, all inside one PS call.

ipcMain.handle('get-roblox-processes', async () => {
  try {
    const script = [
      "$s1=Get-Process -Name RobloxPlayerBeta,RobloxPlayer -ErrorAction SilentlyContinue|Select-Object @{N='p';E={$_.Id}},@{N='c';E={$_.CPU}},@{N='r';E={$_.WorkingSet64}},@{N='n';E={$_.ProcessName}}",
      "if($null -eq $s1){Write-Output '[]';exit}",
      "Start-Sleep -Milliseconds 500",
      "$s2=Get-Process -Name RobloxPlayerBeta,RobloxPlayer -ErrorAction SilentlyContinue|Select-Object @{N='p';E={$_.Id}},@{N='c';E={$_.CPU}},@{N='r';E={$_.WorkingSet64}},@{N='n';E={$_.ProcessName}}",
      "$cores=[System.Environment]::ProcessorCount",
      "$out=@($s2|ForEach-Object{$two=$_;$one=$s1|Where-Object{$_.p -eq $two.p}|Select-Object -First 1;$d=if($one){[math]::Max(0,$two.c-$one.c)}else{0};@{pid=$two.p;name=$two.n;cpu=[math]::Round([math]::Min($d/0.5/$cores*100,100),1);ram=$two.r}})",
      "if($out.Count -eq 0){'[]'}else{$out|ConvertTo-Json -Compress}",
    ].join(';');
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    const { stdout: out } = await execAsync(`powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`, {
      encoding: 'utf-8', timeout: 10000, windowsHide: true,
    });
    const raw = (out || '').trim();
    if (!raw || raw === 'null' || raw === '[]') return [];
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    return arr.map(p => ({
      pid: Number(p.pid ?? 0),
      name: String(p.name ?? 'Roblox'),
      cpu: Number(p.cpu ?? 0),
      ram: Number(p.ram ?? 0),
    }));
  } catch (err) {
    log('get-roblox-processes:', String(err).slice(0, 200));
    return [];
  }
});

// ── Performance: Roblox FPS cap ───────────────────────────────────────────────
// Path priority: (1) running Roblox exe path, (2) registry, (3) newest version-* folder.
// Written before shell.openExternal so Roblox reads it on startup.

// Gets the exe path of a currently-running Roblox player process.
async function getRobloxExeFromProcess() {
  try {
    const script = '(Get-Process -Name RobloxPlayerBeta,RobloxPlayer -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Path)';
    const enc = Buffer.from(script, 'utf16le').toString('base64');
    const { stdout } = await execAsync(`powershell -NoProfile -NonInteractive -EncodedCommand ${enc}`, {
      encoding: 'utf-8', timeout: 5000, windowsHide: true,
    });
    const out = (stdout || '').trim();
    if (out && /\.exe$/i.test(out) && /roblox/i.test(out)) {
      log('fps: running process exe:', out);
      return out;
    }
  } catch {}
  return null;
}

async function getRobloxVersionFolderFromRegistry() {
  // Try multiple registry keys. roblox\shell\open\command must exist for
  // shell.openExternal('roblox://...') to work, so it's the most reliable source.
  const keys = [
    'HKEY_CLASSES_ROOT\\roblox\\shell\\open\\command',
    'HKEY_CLASSES_ROOT\\roblox-player\\shell\\open\\command',
    'HKEY_CLASSES_ROOT\\roblox\\DefaultIcon',
    'HKEY_CLASSES_ROOT\\roblox-player\\DefaultIcon',
  ];
  for (const key of keys) {
    try {
      const { stdout: out } = await execAsync(`reg query "${key}" /ve`, {
        encoding: 'utf-8', timeout: 3000, windowsHide: true,
      });
      for (const line of out.split(/\r?\n/)) {
        if (!line.includes('REG_SZ')) continue;
        const afterReg = line.slice(line.indexOf('REG_SZ') + 6).trim();
        // Handles: "C:\...\foo.exe" "%1"  OR  C:\...\foo.exe,0
        const quoted = afterReg.match(/^"([^"]+\.exe)"/i);
        if (quoted) {
          const dir = path.dirname(quoted[1]);
          if (fs.existsSync(dir)) { log('fps: reg dir from', key.split('\\').pop(), ':', dir); return dir; }
        }
        const plain = afterReg.replace(/,\s*\d+\s*$/, '').replace(/\s+".*/, '').trim();
        if (/\.exe$/i.test(plain)) {
          const dir = path.dirname(plain);
          if (fs.existsSync(dir)) { log('fps: reg dir from', key.split('\\').pop(), ':', dir); return dir; }
        }
      }
    } catch {}
  }
  log('fps: all registry lookups failed');
  return null;
}

async function getRobloxSettingsPaths() {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const seen = new Set();
  const results = [];
  const add = (p) => { if (p && !seen.has(p)) { seen.add(p); results.push(p); } };

  // 1. Running Roblox process — most reliable when Roblox is already open
  const runningExe = await getRobloxExeFromProcess();
  if (runningExe) add(path.join(path.dirname(runningExe), 'ClientSettings', 'ClientAppSettings.json'));

  // 2. Registry lookup — identifies the registered (usually current) version
  const regDir = await getRobloxVersionFolderFromRegistry();
  if (regDir) add(path.join(regDir, 'ClientSettings', 'ClientAppSettings.json'));

  // 3. All version-* folders, newest first — catches auto-updated installs the registry missed
  try {
    const versionsDir = path.join(localAppData, 'Roblox', 'Versions');
    if (fs.existsSync(versionsDir)) {
      const dirs = fs.readdirSync(versionsDir)
        .filter(n => n.startsWith('version-'))
        .map(n => {
          try {
            const fp = path.join(versionsDir, n);
            return fs.statSync(fp).isDirectory() ? { n, mtime: fs.statSync(fp).mtimeMs } : null;
          } catch { return null; }
        })
        .filter(Boolean)
        .sort((a, b) => b.mtime - a.mtime);
      for (const { n } of dirs) add(path.join(versionsDir, n, 'ClientSettings', 'ClientAppSettings.json'));
      if (dirs.length) log('fps: version dirs (newest first):', dirs.map(d => d.n).join(', '));
    }
  } catch {}

  // 4. Classic fallback
  add(path.join(localAppData, 'Roblox', 'ClientSettings', 'ClientAppSettings.json'));

  log('fps: candidate paths:', results.join(' | '));
  return results;
}

// Sentinel written for "unlimited". Roblox caps at 60 when the flag is ABSENT,
// so unlocking means writing a very high target — never deleting the key.
// (Matches ic3w0lf22 RAM, which writes 240 for its UnlockFPS option.)
const FPS_UNLIMITED = 9999;

// FPS values the live memory patch scans for. The patcher finds the frame-delay
// double (1/fps) currently in the running client and rewrites it, so this list
// must include every framerate the client could currently be at:
//   • Roblox's own in-game "Maximum Framerate" presets: 60, 120, 144, 240
//   • this app's FPS preset buttons:                    15, 30, 45, 60, 90, 120, 144, 240
//   • common monitor refresh rates:                     24, 48, 50, 75, 100, 165, 200, 360, 480
//   • the unlimited sentinels:                          9999, 10000
// The current/previous value is also added at patch time. Keep the UI presets in
// src/pages/Performance.tsx (FPS_PRESETS) a subset of this list.
const FPS_SEARCH_VALUES = [
  15, 24, 30, 45, 48, 50, 60, 72, 75, 90, 100, 120, 140, 144, 165, 180,
  200, 240, 280, 300, 360, 480, 500, 1000, FPS_UNLIMITED, 10000,
];

async function applyFpsCap(fps) {
  const paths = await getRobloxSettingsPaths();
  const target = fps > 0 ? fps : FPS_UNLIMITED;
  let written = false;
  for (const p of paths) {
    try {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      let s = {};
      if (fs.existsSync(p)) {
        try { s = JSON.parse(fs.readFileSync(p, 'utf-8')); } catch {}
      }
      s.DFIntTaskSchedulerTargetFps = target;
      fs.writeFileSync(p, JSON.stringify(s), 'utf-8');
      log(`fps: wrote ${fps > 0 ? fps + ' fps' : 'unlimited (' + FPS_UNLIMITED + ')'} → ${p}`);
      written = true;
    } catch (err) {
      log('fps: write error:', p, String(err).slice(0, 120));
    }
  }
  return written;
}

ipcMain.handle('get-fps-cap', async () => {
  for (const p of await getRobloxSettingsPaths()) {
    try {
      if (!fs.existsSync(p)) continue;
      const s = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (s.DFIntTaskSchedulerTargetFps !== undefined) {
        const v = Number(s.DFIntTaskSchedulerTargetFps);
        // Our unlimited sentinel reads back as 0 ("Unlimited") for the UI.
        return v >= FPS_UNLIMITED ? 0 : v;
      }
    } catch {}
  }
  return 0;
});

ipcMain.handle('set-fps-cap', (_event, fps) => applyFpsCap(fps));

ipcMain.handle('get-fps-paths', async () => {
  const paths = await getRobloxSettingsPaths();
  return paths.map(p => {
    const exists = fs.existsSync(p);
    let fpsCap = null;
    if (exists) {
      try {
        const s = JSON.parse(fs.readFileSync(p, 'utf-8'));
        const v = s.DFIntTaskSchedulerTargetFps;
        fpsCap = v === undefined ? null : (Number(v) >= FPS_UNLIMITED ? 0 : Number(v));
      } catch {}
    }
    return { path: p, exists, fpsCap };
  });
});

// Patches the FPS cap in a running Roblox process using the same technique as
// axstin/rbxfpsunlocker: scans the Roblox exe's code section for the x64
// instruction pattern that references the TaskScheduler singleton, then inside
// that object finds the frame-delay field (stored as 1.0/fps, not fps itself)
// and overwrites it with 1.0/newFps.
// Returns "patched:N", "no_process", "access_denied", "no_scheduler",
// "no_frame_delay", or "error".
ipcMain.handle('patch-fps-live', (_event, fps, prevFps) => {
  return new Promise((resolve) => {
    // newFps: target fps (0 = unlimited). Do NOT default to 60 — let C# handle <=0 as unlimited.
    const newFps = Number(fps);
    // curFps: what is currently in Roblox's memory. 0/undefined → assume Roblox default of 60.
    const curFps = (Number(prevFps) > 0) ? Number(prevFps) : 60.0;
    // C# array literal of every framerate we scan for (see FPS_SEARCH_VALUES).
    const fpsLiteral = FPS_SEARCH_VALUES.map(v => Number(v).toFixed(1)).join(', ');
    const psScript = `
$newFps = [double]${newFps}
$curFps = [double]${curFps}

Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class RbxFpsPatch {
    [DllImport("kernel32.dll")] static extern IntPtr OpenProcess(uint a, bool b, int c);
    [DllImport("kernel32.dll")] static extern bool ReadProcessMemory(IntPtr h, IntPtr a, byte[] b, int s, out int r);
    [DllImport("kernel32.dll")] static extern bool WriteProcessMemory(IntPtr h, IntPtr a, byte[] b, int s, out int w);
    [DllImport("kernel32.dll")] static extern bool VirtualQueryEx(IntPtr h, IntPtr a, out MBI m, uint s);
    [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);

    [StructLayout(LayoutKind.Sequential)]
    struct MBI {
        public IntPtr BaseAddress, AllocationBase;
        public uint AllocationProtect, _p1;
        public IntPtr RegionSize;
        public uint State, Protect, Type, _p2;
    }

    public static string Patch(int pid, double newFps, double curFps) {
        IntPtr h = OpenProcess(0x1F0FFF, false, pid);
        if (h == IntPtr.Zero) return "access_denied";
        try {
            double newDelay = newFps <= 0 ? 1.0/10000.0 : 1.0/newFps;
            byte[] repl = BitConverter.GetBytes(newDelay);

            // Scan for the frame-delay double (stored as 1/fps). We don't know what
            // the client is currently running at — it may be Roblox's 60 default, the
            // user's in-game graphics FPS setting (e.g. 240), or a previous cap. So we
            // search every common framerate, not just the last value we wrote. Without
            // this, changing FPS only worked when Roblox happened to be at 60.
            var targets = new List<byte[]>();
            var seenDelays = new HashSet<string>();
            double[] searchFps = new double[] {
                curFps > 0 ? curFps : 60.0,  // last value we wrote, if any
                ${fpsLiteral},               // injected from FPS_SEARCH_VALUES
            };
            foreach (double kf in searchFps) {
                double d = 1.0 / kf;
                if (Math.Abs(d - newDelay) < 1e-15) continue; // already the target value
                string key = BitConverter.ToString(BitConverter.GetBytes(d));
                if (!seenDelays.Add(key)) continue;
                targets.Add(BitConverter.GetBytes(d));
            }
            if (targets.Count == 0) return "no_targets";

            MBI mbi = new MBI();
            uint mbiSz = (uint)Marshal.SizeOf(mbi);
            IntPtr addr = IntPtr.Zero;
            int patched = 0, tried = 0;
            var hits = new List<string>();

            while (VirtualQueryEx(h, addr, out mbi, mbiSz)) {
                long rsz  = mbi.RegionSize.ToInt64();
                long rbase = mbi.BaseAddress.ToInt64();

                bool scan = mbi.State   == 0x1000   // MEM_COMMIT
                         && mbi.Type    == 0x20000   // MEM_PRIVATE
                         && (mbi.Protect == 0x04     // PAGE_READWRITE
                          || mbi.Protect == 0x40)    // PAGE_EXECUTE_READWRITE
                         && rsz >= 8
                         && rsz < 300L*1024*1024;

                if (scan) {
                    tried++;
                    int readSz = (int)Math.Min(rsz, 8L*1024*1024);
                    byte[] buf = new byte[readSz]; int read = 0;
                    if (ReadProcessMemory(h, mbi.BaseAddress, buf, readSz, out read) && read >= 8) {
                        for (int i = 0; i <= read - 8; i += 4) {
                            foreach (byte[] target in targets) {
                                if (buf[i] != target[0]) continue;
                                bool match = true;
                                for (int j = 1; j < 8; j++) { if (buf[i+j] != target[j]) { match=false; break; } }
                                if (!match) continue;

                                long pa = rbase + i;
                                int w = 0;
                                WriteProcessMemory(h, new IntPtr(pa), repl, 8, out w);

                                byte[] rb = new byte[8]; int r2 = 0;
                                ReadProcessMemory(h, new IntPtr(pa), rb, 8, out r2);
                                bool ok = true;
                                for (int j = 0; j < 8; j++) { if (rb[j] != repl[j]) { ok=false; break; } }
                                hits.Add("0x" + pa.ToString("X") + "=" + (ok ? "ok" : "fail"));
                                patched++;
                                break;
                            }
                        }
                    }
                }

                if (rsz <= 0) break;
                long next = rbase + rsz;
                if (next >= unchecked((long)0x7FFFFFFF0000L)) break;
                addr = new IntPtr(next);
            }

            if (patched == 0) return "no_match:tried=" + tried;
            return "patched:" + patched + ":[" + string.Join(",", hits) + "]";
        } finally { CloseHandle(h); }
    }
}
'@

$procs = Get-Process -Name 'RobloxPlayerBeta','RobloxPlayer' -ErrorAction SilentlyContinue
if (-not $procs) { Write-Output 'no_process'; exit }
$total = 0; $patched = 0
foreach ($p in $procs) {
    $r = [RbxFpsPatch]::Patch($p.Id, $newFps, $curFps)
    if ($r -match '^patched:(\d+)') { $total += [int]$Matches[1]; $patched++ }
}
if ($total -eq 0) { Write-Output "no_match:procs=$($procs.Count)" }
else { Write-Output "patched:$total:clients=$patched/$($procs.Count)" }
`;
    const runOnce = (label, onDone) => {
      const tmpFile = path.join(os.tmpdir(), `rbxfps_${Date.now()}.ps1`);
      try { fs.writeFileSync(tmpFile, psScript, 'utf-8'); }
      catch (e) { onDone('error_tmp'); return; }
      exec(
        `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
        { encoding: 'utf-8', timeout: 45000 },
        (err, stdout, stderr) => {
          try { fs.unlinkSync(tmpFile); } catch {}
          const out = (stdout || '').trim();
          const se  = (stderr || '').trim();
          const r = out || (se ? `ps_error: ${se.slice(0, 200)}` : 'error');
          log(`patch-fps-live [${label}]:`, r.slice(0, 120));
          onDone(r);
        },
      );
    };

    // Initial patch — resolve immediately so the UI updates.
    runOnce('1', (result) => {
      resolve(result);
      // Re-patch every second for 5s to prevent Roblox resetting the value.
      if (result.startsWith('patched') || result.startsWith('no_match')) {
        let n = 2;
        const iv = setInterval(() => {
          runOnce(String(n), () => {});
          if (++n > 6) clearInterval(iv);
        }, 1000);
      }
    });
  });
});

// ── Kill Roblox processes ─────────────────────────────────────────────────────

ipcMain.handle('kill-roblox-pid', async (_event, pid) => {
  try {
    await execAsync(`taskkill /F /PID ${Number(pid)}`, {
      encoding: 'utf-8', timeout: 5000, windowsHide: true,
    });
    log(`kill-roblox-pid: killed PID ${pid}`);
    return true;
  } catch (err) {
    log('kill-roblox-pid error:', String(err).slice(0, 200));
    return false;
  }
});

ipcMain.handle('get-account-pid', (_event, accountId) => {
  return accountPidMap[accountId] ?? null;
});

ipcMain.handle('kill-all-roblox', async () => {
  let killed = false;
  for (const name of ['RobloxPlayerBeta', 'RobloxPlayer']) {
    try {
      await execAsync(`taskkill /F /IM ${name}.exe`, {
        encoding: 'utf-8', timeout: 5000, windowsHide: true,
      });
      killed = true;
    } catch {}
  }
  log(`kill-all-roblox: ${killed ? 'processes terminated' : 'none found'}`);
  return killed;
});

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Restore multi-instance setting from last session
  const savedSettings = loadAppSettings();
  if (savedSettings.multiInstance) enableMultiInstance();

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  disableMultiInstance();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
