const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    fileManager: {
      browseDirectory: () => ipcRenderer.invoke('browse-directory'),
      readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
      readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
      shareFile: (filePath) => ipcRenderer.invoke('share-file', filePath),
      accessSharedFile: (shareInfo) => ipcRenderer.invoke('access-shared-file', shareInfo),
      getAccessLogs: () => ipcRenderer.invoke('get-access-logs')
    }
  }
);