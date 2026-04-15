const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('customCrack', {
  platform: process.platform,
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  toggleFullscreen: () => ipcRenderer.send('window-fullscreen'),
  onMaximizeChange: (callback) => ipcRenderer.on('maximize-change', (_, isMaximized) => callback(isMaximized)),
  onFullscreenChange: (callback) => ipcRenderer.on('fullscreen-change', (_, isFullscreen) => callback(isFullscreen)),
});
