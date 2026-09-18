const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clickfilm', {
  startTracker: () => ipcRenderer.invoke('tracker:start'),
  stopTracker: () => ipcRenderer.invoke('tracker:stop'),
  onTrackerEvent: callback => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('tracker:event', listener);
    return () => ipcRenderer.removeListener('tracker:event', listener);
  },
  exportMp4: bytes => ipcRenderer.invoke('export:mp4', bytes)
});
