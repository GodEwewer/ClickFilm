const { app, BrowserWindow, ipcMain, session, desktopCapturer, dialog, globalShortcut } = require('electron');
const { execFile, spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let mainWindow;
let recordingAccelerator = 'CommandOrControl+Shift+R';
let selectedCaptureSourceId = null;
let audioCaptures = [];
let audioSessionDir = null;
let currentRecordingFile = null;

function registerRecordingHotkey(accelerator = recordingAccelerator) {
  globalShortcut.unregister(recordingAccelerator);
  const registered = globalShortcut.register(accelerator, () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send('recording:toggle');
  });
  if (registered) recordingAccelerator = accelerator;
  else globalShortcut.register(recordingAccelerator, () => mainWindow?.webContents.send('recording:toggle'));
  return { ok: registered, accelerator: recordingAccelerator };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 840,
    minWidth: 920,
    minHeight: 680,
    backgroundColor: '#090b12',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function resolveFfmpegPath() {
  const binary = require('ffmpeg-static');
  return binary.includes('app.asar') ? binary.replace('app.asar', 'app.asar.unpacked') : binary;
}

function resolveAudioHelperPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'native', 'ApplicationLoopback.exe')
    : path.join(__dirname, '..', 'native', 'bin', 'ApplicationLoopback.exe');
}

function ffmpegNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function buildZoomExpressions(zooms) {
  let zoom = '1';
  let x = '(iw-iw/zoom)/2';
  let y = '(ih-ih/zoom)/2';
  [...zooms].reverse().forEach(item => {
    const start = ffmpegNumber(item.startMs) / 1000;
    const duration = Math.max(.1, ffmpegNumber(item.durationMs, 1500) / 1000);
    const end = start + duration;
    const transition = Math.min(.3, duration * .25);
    const scale = Math.max(1, ffmpegNumber(item.scale, 1.65));
    const focusX = Math.max(0, Math.min(1, ffmpegNumber(item.x, .5)));
    const focusY = Math.max(0, Math.min(1, ffmpegNumber(item.y, .5)));
    const animated = `if(lt(in_time-${start},${transition}),1+(${scale}-1)*(in_time-${start})/${transition},if(gt(in_time,${end - transition}),1+(${scale}-1)*(${end}-in_time)/${transition},${scale}))`;
    zoom = `if(between(in_time,${start},${end}),${animated},${zoom})`;
    x = `if(between(in_time,${start},${end}),(iw-iw/zoom)*${focusX},${x})`;
    y = `if(between(in_time,${start},${end}),(ih-ih/zoom)*${focusY},${y})`;
  });
  return { zoom, x, y };
}

function buildVideoFilter(spec) {
  const sourceWidth = Math.max(2, Math.round(ffmpegNumber(spec.sourceWidth, 1920) / 2) * 2);
  const sourceHeight = Math.max(2, Math.round(ffmpegNumber(spec.sourceHeight, 1080) / 2) * 2);
  const zooms = Array.isArray(spec.zooms) ? spec.zooms : [];
  const expressions = buildZoomExpressions(zooms);
  const filters = [];
  let input = '[0:v]';
  if (zooms.length) {
    filters.push(`${input}zoompan=z='${expressions.zoom}':x='${expressions.x}':y='${expressions.y}':d=1:fps=30:s=${sourceWidth}x${sourceHeight}[zoomed]`);
    input = '[zoomed]';
  }
  if (spec.background === 'none') {
    filters.push(`${input}setsar=1[videoout]`);
    return filters;
  }
  const sizes = { landscape: [1920, 1080], portrait: [1080, 1920], square: [1080, 1080] };
  const [width, height] = sizes[spec.format] || sizes.landscape;
  const margin = spec.format === 'portrait' ? Math.round(width * .065) : Math.round(Math.min(width, height) * .075);
  const backgrounds = {
    aurora: ['0x4f5ee7', '0xb454cf'], ocean: ['0x076585', '0x45b5aa'],
    sunset: ['0xf857a6', '0xff5858'], midnight: ['0x111625', '0x111625']
  };
  const [start, end] = backgrounds[spec.background] || backgrounds.aurora;
  filters.push(`gradients=s=${width}x${height}:c0=${start}:c1=${end}:x0=0:y0=0:x1=${width}:y1=${height}[bg]`);
  filters.push(`${input}scale=${width - margin * 2}:${height - margin * 2}:force_original_aspect_ratio=decrease[foreground]`);
  filters.push(`[bg][foreground]overlay=(W-w)/2:(H-h)/2:shortest=1,setsar=1[videoout]`);
  return filters;
}

async function stopAudioCaptures() {
  const captures = audioCaptures;
  audioCaptures = [];
  await Promise.all(captures.map(capture => new Promise(resolve => {
    if (capture.process.exitCode !== null) return resolve();
    const timeout = setTimeout(() => { capture.process.kill(); resolve(); }, 5000);
    capture.process.once('exit', () => { clearTimeout(timeout); resolve(); });
    capture.process.stdin.on('error', () => {});
    capture.process.stdin.end('\n');
  })));
  return captures.map(capture => capture.file).filter(file => fs.existsSync(file));
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(['media', 'display-capture'].includes(permission));
  });

  session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
    const sources = await desktopCapturer.getSources({ types: ['window'], thumbnailSize: { width: 0, height: 0 } });
    const selected = sources.find(source => source.id === selectedCaptureSourceId);
    if (!selected) return callback({});
    callback({ video: selected });
  });

  createWindow();
  registerRecordingHotkey();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  audioCaptures.forEach(capture => capture.process.kill());
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => globalShortcut.unregisterAll());

ipcMain.handle('hotkey:set', (_event, accelerator) => registerRecordingHotkey(accelerator));

ipcMain.handle('capture:list-sources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['window'],
    thumbnailSize: { width: 320, height: 180 },
    fetchWindowIcons: true
  });
  return sources
    .filter(source => source.name && source.name !== 'ClickFilm')
    .map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      icon: source.appIcon?.toDataURL() || null
    }));
});

ipcMain.handle('capture:select-source', (_event, sourceId) => {
  selectedCaptureSourceId = String(sourceId || '');
  return Boolean(selectedCaptureSourceId);
});

ipcMain.handle('audio:list-apps', async () => {
  if (process.platform !== 'win32') return [];
  const script = "Get-Process | Where-Object { $_.MainWindowTitle -ne '' -and $_.Id -ne $PID } | Select-Object Id,ProcessName,MainWindowTitle | ConvertTo-Json -Compress";
  return new Promise(resolve => execFile('powershell.exe', ['-NoProfile', '-Command', script], { windowsHide: true }, (error, stdout) => {
    if (error || !stdout.trim()) return resolve([]);
    try {
      const parsed = JSON.parse(stdout);
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      resolve(rows.map(row => ({ pid: Number(row.Id), name: row.ProcessName, title: row.MainWindowTitle })).filter(row => row.pid));
    } catch { resolve([]); }
  }));
});

ipcMain.handle('audio:start', async (_event, pids) => {
  await stopAudioCaptures();
  if (!Array.isArray(pids) || !pids.length) return { ok: true, count: 0 };
  const helper = resolveAudioHelperPath();
  if (!fs.existsSync(helper)) return { ok: false, error: 'The per-app audio helper is missing from this build.' };
  audioSessionDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'clickfilm-audio-'));
  audioCaptures = pids.map((pid, index) => {
    const file = path.join(audioSessionDir, `app-${index}-${pid}.wav`);
    const child = spawn(helper, [String(pid), 'includetree', file], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    child.on('error', () => {});
    return { process: child, file, pid };
  });
  return { ok: true, count: audioCaptures.length };
});

ipcMain.handle('audio:stop', async () => ({ ok: true, files: await stopAudioCaptures() }));

ipcMain.handle('recording:store', async (_event, bytes) => {
  if (currentRecordingFile) await fs.promises.unlink(currentRecordingFile).catch(() => {});
  currentRecordingFile = path.join(os.tmpdir(), `clickfilm-source-${Date.now()}.webm`);
  await fs.promises.writeFile(currentRecordingFile, Buffer.from(bytes));
  return { ok: true };
});

ipcMain.handle('recording:clear', async () => {
  if (currentRecordingFile) await fs.promises.unlink(currentRecordingFile).catch(() => {});
  currentRecordingFile = null;
  return true;
});

ipcMain.handle('export:mp4', async (_event, payload) => {
  const choice = await dialog.showSaveDialog(mainWindow, {
    title: 'Save ClickFilm video',
    defaultPath: `ClickFilm-${new Date().toISOString().slice(0, 10)}.mp4`,
    filters: [{ name: 'MP4 video', extensions: ['mp4'] }]
  });
  if (choice.canceled || !choice.filePath) return { canceled: true };

  const tempFile = currentRecordingFile || path.join(os.tmpdir(), `clickfilm-${Date.now()}.webm`);
  const bytes = payload?.bytes;
  const spec = payload?.spec || { background: 'none', format: 'landscape', zooms: [] };
  if (!currentRecordingFile && bytes) await fs.promises.writeFile(tempFile, Buffer.from(bytes));
  if (!fs.existsSync(tempFile)) return { canceled: false, ok: false, error: 'The local source recording is missing.' };
  const ffmpeg = resolveFfmpegPath();

  const audioFiles = audioSessionDir
    ? (await fs.promises.readdir(audioSessionDir).catch(() => [])).filter(name => name.endsWith('.wav')).map(name => path.join(audioSessionDir, name))
    : [];
  return new Promise(resolve => {
    const args = ['-y', '-i', tempFile];
    audioFiles.forEach(file => args.push('-i', file));
    const filters = buildVideoFilter(spec);
    if (audioFiles.length > 1) {
      const inputs = audioFiles.map((_file, index) => `[${index + 1}:a]`).join('');
      filters.push(`${inputs}amix=inputs=${audioFiles.length}:duration=longest:normalize=0[aout]`);
    }
    args.push('-filter_complex', filters.join(';'), '-map', '[videoout]');
    if (audioFiles.length === 1) args.push('-map', '1:a:0');
    else if (audioFiles.length > 1) args.push('-map', '[aout]');
    args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
    if (audioFiles.length) args.push('-c:a', 'aac', '-b:a', '192k');
    args.push(choice.filePath);
    execFile(ffmpeg, args, async error => {
      await fs.promises.unlink(tempFile).catch(() => {});
      if (tempFile === currentRecordingFile) currentRecordingFile = null;
      if (audioSessionDir) await fs.promises.rm(audioSessionDir, { recursive: true, force: true }).catch(() => {});
      audioSessionDir = null;
      if (error) resolve({ canceled: false, ok: false, error: error.message });
      else resolve({ canceled: false, ok: true, path: choice.filePath });
    });
  });
});
