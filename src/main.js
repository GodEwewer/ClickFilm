const { app, BrowserWindow, ipcMain, screen, globalShortcut, session, desktopCapturer, dialog } = require('electron');
const { execFile } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let mainWindow;
let cursorTimer;
let trackerStartedAt = 0;
let mouseHook;

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

function cursorPayload(kind = 'move') {
  const point = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(point);
  const bounds = display.bounds;
  return {
    kind,
    at: Date.now(),
    x: Math.max(0, Math.min(1, (point.x - bounds.x) / bounds.width)),
    y: Math.max(0, Math.min(1, (point.y - bounds.y) / bounds.height)),
    displayId: String(display.id)
  };
}

function sendTrackerEvent(kind) {
  if (!trackerStartedAt || !mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send('tracker:event', cursorPayload(kind));
}

function startMouseHook() {
  try {
    const { uIOhook, UiohookKey } = require('uiohook-napi');
    mouseHook = uIOhook;
    mouseHook.on('mousedown', event => {
      if (event.button === 1 || event.button === 0) sendTrackerEvent('click');
    });
    mouseHook.start();
    return true;
  } catch (error) {
    console.warn('Global mouse hook unavailable:', error.message);
    return false;
  }
}

function stopTracker() {
  trackerStartedAt = 0;
  if (cursorTimer) clearInterval(cursorTimer);
  cursorTimer = null;
  if (mouseHook) {
    try { mouseHook.stop(); } catch {}
    mouseHook = null;
  }
  globalShortcut.unregister('CommandOrControl+Shift+Z');
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(['media', 'display-capture'].includes(permission));
  });

  session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
    const sources = await desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 0, height: 0 } });
    const primary = screen.getPrimaryDisplay();
    const preferred = sources.find(source => String(source.display_id) === String(primary.id)) || sources[0];
    callback({ video: preferred, audio: 'loopback' });
  }, { useSystemPicker: true });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  stopTracker();
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('tracker:start', () => {
  stopTracker();
  trackerStartedAt = Date.now();
  const hookAvailable = startMouseHook();
  cursorTimer = setInterval(() => sendTrackerEvent('move'), 33);
  globalShortcut.register('CommandOrControl+Shift+Z', () => sendTrackerEvent('click'));
  return { startedAt: trackerStartedAt, hookAvailable };
});

ipcMain.handle('tracker:stop', () => {
  stopTracker();
  return true;
});

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

  return new Promise(resolve => {
    const args = [
      '-y', '-i', tempFile,
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      '-c:a', 'aac', '-b:a', '192k',
      choice.filePath
    ];
    execFile(ffmpeg, args, async error => {
      await fs.promises.unlink(tempFile).catch(() => {});
      if (error) resolve({ canceled: false, ok: false, error: error.message });
      else resolve({ canceled: false, ok: true, path: choice.filePath });
    });
  });
});
