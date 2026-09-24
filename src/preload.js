const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clickfilm', {
  setRecordingHotkey: accelerator => ipcRenderer.invoke('hotkey:set', accelerator),
  listCaptureSources: () => ipcRenderer.invoke('capture:list-sources'),
  selectCaptureSource: sourceId => ipcRenderer.invoke('capture:select-source', sourceId),
  listAudioApps: () => ipcRenderer.invoke('audio:list-apps'),
  startAudioCapture: pids => ipcRenderer.invoke('audio:start', pids),
  stopAudioCapture: () => ipcRenderer.invoke('audio:stop'),
  storeRecording: bytes => ipcRenderer.invoke('recording:store', bytes),
  beginRecordingStore: () => ipcRenderer.invoke('recording:begin-store'),
  appendRecordingChunk: bytes => ipcRenderer.invoke('recording:append-store', bytes),
  finishRecordingStore: () => ipcRenderer.invoke('recording:finish-store'),
  clearRecording: () => ipcRenderer.invoke('recording:clear'),
  getOutputDirectory: () => ipcRenderer.invoke('output:get'),
  chooseOutputDirectory: () => ipcRenderer.invoke('output:choose'),
  onRecordingToggle: callback => {
    const listener = () => callback();
    ipcRenderer.on('recording:toggle', listener);
    return () => ipcRenderer.removeListener('recording:toggle', listener);
  },
  exportMp4: payload => ipcRenderer.invoke('export:mp4', payload)
});
