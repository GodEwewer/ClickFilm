const { app, BrowserWindow, ipcMain, session, desktopCapturer, dialog, globalShortcut } = require('electron');
const { execFile } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let mainWindow;
let recordingAccelerator = 'CommandOrControl+Shift+R';

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
  registerRecordingHotkey();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => globalShortcut.unregisterAll());

ipcMain.handle('hotkey:set', (_event, accelerator) => registerRecordingHotkey(accelerator));

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
