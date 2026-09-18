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

ipcMain.handle('export:mp4', async (_event, bytes) => {
  const choice = await dialog.showSaveDialog(mainWindow, {
    title: 'Save ClickFilm video',
    defaultPath: `ClickFilm-${new Date().toISOString().slice(0, 10)}.mp4`,
    filters: [{ name: 'MP4 video', extensions: ['mp4'] }]
  });
  if (choice.canceled || !choice.filePath) return { canceled: true };

  const tempFile = path.join(os.tmpdir(), `clickfilm-${Date.now()}.webm`);
  await fs.promises.writeFile(tempFile, Buffer.from(bytes));
  const ffmpeg = resolveFfmpegPath();

  const audioFiles = audioSessionDir
    ? (await fs.promises.readdir(audioSessionDir).catch(() => [])).filter(name => name.endsWith('.wav')).map(name => path.join(audioSessionDir, name))
    : [];
  return new Promise(resolve => {
    const args = ['-y', '-i', tempFile];
    audioFiles.forEach(file => args.push('-i', file));
    if (audioFiles.length === 1) args.push('-map', '0:v:0', '-map', '1:a:0');
    else if (audioFiles.length > 1) {
      const inputs = audioFiles.map((_file, index) => `[${index + 1}:a]`).join('');
      args.push('-filter_complex', `${inputs}amix=inputs=${audioFiles.length}:duration=longest:normalize=0[aout]`, '-map', '0:v:0', '-map', '[aout]');
    } else args.push('-map', '0:v:0');
    args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
    if (audioFiles.length) args.push('-c:a', 'aac', '-b:a', '192k');
    args.push(choice.filePath);
    execFile(ffmpeg, args, async error => {
      await fs.promises.unlink(tempFile).catch(() => {});
      if (audioSessionDir) await fs.promises.rm(audioSessionDir, { recursive: true, force: true }).catch(() => {});
      audioSessionDir = null;
      if (error) resolve({ canceled: false, ok: false, error: error.message });
      else resolve({ canceled: false, ok: true, path: choice.filePath });
    });
  });
});
