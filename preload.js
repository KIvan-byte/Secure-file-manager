const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron', 
  {
    fileManager: {
      browseDirectory: () => ipcRenderer.invoke('browse-directory'),
      selectFile: () => ipcRenderer.invoke('select-file'),
      readDirectory: (directoryPath) => ipcRenderer.invoke('read-directory', directoryPath),
      readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
      readFileBinary: (filePath) => ipcRenderer.invoke('read-file-binary', filePath),
      shareFile: (filePath) => ipcRenderer.invoke('share-file', filePath),
      accessSharedFile: (params) => ipcRenderer.invoke('access-shared-file', params),
      getAccessLogs: () => ipcRenderer.invoke('get-access-logs'),
      searchFileContent: (params) => ipcRenderer.invoke('search-file-content', params),
      
      // Encryption functions
      encryptFile: (params) => ipcRenderer.invoke('encrypt-file', params),
      decryptFile: (params) => ipcRenderer.invoke('decrypt-file', params),
      listEncryptedFiles: () => ipcRenderer.invoke('list-encrypted-files'),
      getEncryptedFileDetails: (path) => ipcRenderer.invoke('get-encrypted-file-details', path),
      shareEncryptedFileWithDecryption: (params) => ipcRenderer.invoke('share-encrypted-file-with-decryption', params),
      
      // Compression functions
      compressFiles: (params) => ipcRenderer.invoke('compress-files', params),
      extractArchive: (params) => ipcRenderer.invoke('extract-archive', params),
      isArchive: (filePath) => ipcRenderer.invoke('is-archive', filePath),
      
      // File operations
      moveFile: (params) => ipcRenderer.invoke('moveFile', params),
      copyFileFromPath: (params) => ipcRenderer.invoke('copyFileFromPath', params),
      
      // Analytics functions
      getAllFiles: () => ipcRenderer.invoke('getAllFiles'),
      getSharedFilesCount: () => ipcRenderer.invoke('getSharedFilesCount'),
      getStorageInfo: () => ipcRenderer.invoke('getStorageInfo'),
      getFileTypeDistribution: () => ipcRenderer.invoke('getFileTypeDistribution'),
      getActivityTrends: () => ipcRenderer.invoke('getActivityTrends'),
      
      // Secure Notes functions
      secureNotes: {
        validateMasterPassword: (password) => ipcRenderer.invoke('secure-notes:validate-master-password', password),
        setupVault: (password) => ipcRenderer.invoke('secure-notes:setup-vault', password),
        getEntries: (password) => ipcRenderer.invoke('secure-notes:get-entries', password),
        saveEntry: (params) => ipcRenderer.invoke('secure-notes:save-entry', params),
        deleteEntry: (params) => ipcRenderer.invoke('secure-notes:delete-entry', params),
      }
    }
  }
);