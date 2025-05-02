const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    fileManager: {
      // Directory operations
      browseDirectory: () => ipcRenderer.invoke('browse-directory'),
      readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
      
      // File operations
      readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
      readFileBinary: (filePath) => ipcRenderer.invoke('read-file-binary', filePath),
      
      // File selection for sharing (new function)
      selectFile: () => ipcRenderer.invoke('select-file'),
      
      // File sharing operations
      shareFile: (filePath) => ipcRenderer.invoke('share-file', filePath),
      accessSharedFile: (params) => ipcRenderer.invoke('access-shared-file', params),
      
      // Access logs
      getAccessLogs: () => ipcRenderer.invoke('get-access-logs')
    }
  }
);