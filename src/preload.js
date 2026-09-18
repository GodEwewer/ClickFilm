const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clickfilm', {
  setRecordingHotkey: accelerator => ipcRenderer.invoke('hotkey:set', accelerator),
  onRecordingToggle: callback => {
    const listener = () => callback();
    ipcRenderer.on('recording:toggle', listener);
    return () => ipcRenderer.removeListener('recording:toggle', listener);
  },
  exportMp4: bytes => ipcRenderer.invoke('export:mp4', bytes)
});
