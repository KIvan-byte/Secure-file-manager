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
      
      // File selection for sharing
      selectFile: () => ipcRenderer.invoke('select-file'),
      
      // File sharing operations
      shareFile: (filePath) => ipcRenderer.invoke('share-file', filePath),
      accessSharedFile: (params) => ipcRenderer.invoke('access-shared-file', params),
      
      // Access logs
      getAccessLogs: () => ipcRenderer.invoke('get-access-logs'),
      
      // Content search
      searchFileContent: (params) => ipcRenderer.invoke('search-file-content', params),
      
      // Encryption/Decryption operations
      encryptFile: (params) => ipcRenderer.invoke('encrypt-file', params),
      decryptFile: (params) => ipcRenderer.invoke('decrypt-file', params),
      
      // New functionality for encrypted files
      listEncryptedFiles: () => ipcRenderer.invoke('list-encrypted-files'),
      getEncryptedFileDetails: (filePath) => ipcRenderer.invoke('get-encrypted-file-details', filePath),
      shareEncryptedFileWithDecryption: (params) => ipcRenderer.invoke('share-encrypted-file-with-decryption', params)
    }
  }
);