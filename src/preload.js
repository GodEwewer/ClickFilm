const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clickfilm', {
  setRecordingHotkey: accelerator => ipcRenderer.invoke('hotkey:set', accelerator),
  listCaptureSources: () => ipcRenderer.invoke('capture:list-sources'),
  selectCaptureSource: sourceId => ipcRenderer.invoke('capture:select-source', sourceId),
  onRecordingToggle: callback => {
    const listener = () => callback();
    ipcRenderer.on('recording:toggle', listener);
    return () => ipcRenderer.removeListener('recording:toggle', listener);
  },
  exportMp4: bytes => ipcRenderer.invoke('export:mp4', bytes)
});
