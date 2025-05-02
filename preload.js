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
      shareEncryptedFileWithDecryption: (params) => ipcRenderer.invoke('share-encrypted-file-with-decryption', params),
      
      // Compression methods
      compressFiles: (params) => ipcRenderer.invoke('compress-files', params),
      extractArchive: (params) => ipcRenderer.invoke('extract-archive', params),
      isArchive: (filePath) => ipcRenderer.invoke('is-archive', filePath),
      
      // Analytics endpoints
      getAllFiles: () => ipcRenderer.invoke('getAllFiles'),
      getSharedFilesCount: () => ipcRenderer.invoke('getSharedFilesCount'),
      getStorageInfo: () => ipcRenderer.invoke('getStorageInfo'),
      getFileTypeDistribution: () => ipcRenderer.invoke('getFileTypeDistribution'),
      getActivityTrends: () => ipcRenderer.invoke('getActivityTrends'),
      
      // File operations for drag and drop
      moveFile: (params) => ipcRenderer.invoke('moveFile', params),
      copyFileFromPath: (params) => ipcRenderer.invoke('copyFileFromPath', params),
    },
    secureNotes: {
      validateMasterPassword: (password) => ipcRenderer.invoke('secure-notes:validate-master-password', password),
      setupVault: (password) => ipcRenderer.invoke('secure-notes:setup-vault', password),
      getEntries: (password) => ipcRenderer.invoke('secure-notes:get-entries', password),
      saveEntry: (entry, password) => ipcRenderer.invoke('secure-notes:save-entry', { entry, password }),
      deleteEntry: (entryId, password) => ipcRenderer.invoke('secure-notes:delete-entry', { entryId, password })
    }
  }
);