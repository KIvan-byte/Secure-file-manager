const { contextBridge, ipcRenderer } = require('electron');

// Use localStorage for secure notes data storage
function getStoredMasterPassword() {
  try {
    return localStorage.getItem('secureNotesMasterPassword');
  } catch {
    return null;
  }
}

function setStoredMasterPassword(pw) {
  try {
    localStorage.setItem('secureNotesMasterPassword', pw);
  } catch {}
}

function getStoredEntries() {
  try {
    const raw = localStorage.getItem('secureNotesEntries');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredEntries(entries) {
  try {
    localStorage.setItem('secureNotesEntries', JSON.stringify(entries));
  } catch {}
}

let secureNotesEntries = getStoredEntries();

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
      createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
      deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
      
      // Analytics functions
      getAllFiles: () => ipcRenderer.invoke('getAllFiles'),
      getSharedFilesCount: () => ipcRenderer.invoke('getSharedFilesCount'),
      getStorageInfo: () => ipcRenderer.invoke('getStorageInfo'),
      getFileTypeDistribution: () => ipcRenderer.invoke('getFileTypeDistribution'),
      getActivityTrends: () => ipcRenderer.invoke('getActivityTrends'),
      
      // Secure Notes functions
      secureNotes: {
        validateMasterPassword: (password) => ipcRenderer.invoke('secure-notes:validate-master-password', password),
        setupVault: async (password) => {
          setStoredMasterPassword(password);
          return { success: true };
        },
        getEntries: (password) => ipcRenderer.invoke('secure-notes:get-entries', password),
        saveEntry: (params) => ipcRenderer.invoke('secure-notes:save-entry', params),
        deleteEntry: (params) => ipcRenderer.invoke('secure-notes:delete-entry', params),
      },

      // Get detailed file properties (size, permissions, dates, etc.)
      getFileDetails: (filePath) => ipcRenderer.invoke('get-file-details', filePath),
      calculateFileHash: (filePath, algorithm) => ipcRenderer.invoke('calculate-file-hash', filePath, algorithm),
      // Manage Active Shares
      listActiveShares: () => ipcRenderer.invoke('list-active-shares'),
      revokeShareLink: (tokenId) => ipcRenderer.invoke('revoke-share-link', tokenId),
      
      // Zero-Knowledge Sync API
      syncInitialize: (masterPassword) => ipcRenderer.invoke('sync-initialize', masterPassword),
      syncAddFile: (filePath, options) => ipcRenderer.invoke('sync-add-file', filePath, options),
      syncGetPeers: () => ipcRenderer.invoke('sync-get-peers'),
      syncGetStatus: () => ipcRenderer.invoke('sync-get-status'),
      syncShutdown: () => ipcRenderer.invoke('sync-shutdown'),
      syncGetFiles: () => ipcRenderer.invoke('sync-get-files'),
      syncDownloadFile: (fileHash) => ipcRenderer.invoke('sync-download-file', fileHash),
      syncRemoveFile: (fileHash) => ipcRenderer.invoke('sync-remove-file', fileHash),
      syncGetDirectory: () => ipcRenderer.invoke('sync-get-directory'),
      syncOpenDirectory: () => ipcRenderer.invoke('sync-open-directory'),
    },
    auth: {
      validateMasterPassword: async (password) => {
        const stored = getStoredMasterPassword();
        if (!stored) {
          return { success: false, error: 'No password set' };
        }
        if (password === stored) {
          return { success: true };
        }
        return { success: false, error: 'Invalid password' };
      },
      checkTwoFactorSetup: () => ipcRenderer.invoke('auth:check-2fa-setup'),
      generateTwoFactorSecret: () => ipcRenderer.invoke('auth:generate-2fa-secret'),
      setupTwoFactor: (secret, code) => ipcRenderer.invoke('auth:setup-2fa', { secret, code }),
      verifyTwoFactorCode: (code) => ipcRenderer.invoke('auth:verify-2fa-code', code),
      disableTwoFactor: () => ipcRenderer.invoke('auth:disable-2fa')
    },
    secureNotes: {
      setupVault: async (password) => {
        setStoredMasterPassword(password);
        return { success: true };
      },
      getEntries: async (password) => {
        const stored = getStoredMasterPassword();
        if (!stored || password !== stored) {
          return { success: false, error: 'Invalid master password' };
        }
        secureNotesEntries = getStoredEntries();
        return { success: true, entries: secureNotesEntries };
      },
      saveEntry: async (entry, password) => {
        const stored = getStoredMasterPassword();
        if (!stored || password !== stored) {
          return { success: false, error: 'Invalid master password' };
        }
        secureNotesEntries = getStoredEntries();
        const idx = secureNotesEntries.findIndex(e => e.id === entry.id);
        if (idx !== -1) {
          secureNotesEntries[idx] = entry;
        } else {
          secureNotesEntries.push(entry);
        }
        setStoredEntries(secureNotesEntries);
        return { success: true };
      },
      deleteEntry: async (id, password) => {
        const stored = getStoredMasterPassword();
        if (!stored || password !== stored) {
          return { success: false, error: 'Invalid master password' };
        }
        secureNotesEntries = getStoredEntries();
        secureNotesEntries = secureNotesEntries.filter(e => e.id !== id);
        setStoredEntries(secureNotesEntries);
        return { success: true };
      }
    }
  }
);

contextBridge.exposeInMainWorld('electronAPI', {
  // Event listeners for sync events
  on: (channel, callback) => {
    const validChannels = [
      'sync-file-received',
      'sync-file-added',
      'sync-peer-discovered',
      'sync-status-changed'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  
  removeListener: (channel, callback) => {
    const validChannels = [
      'sync-file-received',
      'sync-file-added',
      'sync-peer-discovered',
      'sync-status-changed'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  },
  
  // File operations
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectSaveLocation: () => ipcRenderer.invoke('select-save-location'),
  readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
  getFileStats: (path) => ipcRenderer.invoke('get-file-stats', path),
  readFile: (path, encoding) => ipcRenderer.invoke('read-file', path, encoding),
  writeFile: (path, content) => ipcRenderer.invoke('write-file', path, content),
  deleteFile: (path) => ipcRenderer.invoke('delete-file', path),
  moveFile: (oldPath, newPath) => ipcRenderer.invoke('move-file', oldPath, newPath),
  copyFile: (src, dest) => ipcRenderer.invoke('copy-file', src, dest),
  createDirectory: (path) => ipcRenderer.invoke('create-directory', path),
  openExternal: (path) => ipcRenderer.invoke('open-external', path),
  
  // Search operations
  searchFiles: (searchParams) => ipcRenderer.invoke('search-files', searchParams),
  
  // Encryption operations
  encryptFile: (inputPath, password, outputPath) => ipcRenderer.invoke('encrypt-file', inputPath, password, outputPath),
  decryptFile: (inputPath, password, outputPath) => ipcRenderer.invoke('decrypt-file', inputPath, password, outputPath),
  isEncryptedFile: (filePath) => ipcRenderer.invoke('is-encrypted-file', filePath),
  
  // Compression operations
  compressFiles: (sourcePaths, outputPath, options) => ipcRenderer.invoke('compress-files', sourcePaths, outputPath, options),
  extractArchive: (archivePath, outputPath) => ipcRenderer.invoke('extract-archive', archivePath, outputPath),
  
  // File sharing
  createShareLink: (filePath, options) => ipcRenderer.invoke('create-share-link', filePath, options),
  revokeShareLink: (token) => ipcRenderer.invoke('revoke-share-link', token),
  getShareLinks: () => ipcRenderer.invoke('get-share-links'),
  accessSharedFile: (token, key) => ipcRenderer.invoke('access-shared-file', token, key),
  
  // Access logs
  getAccessLogs: (filters) => ipcRenderer.invoke('get-access-logs', filters),
  logActivity: (activity) => ipcRenderer.invoke('log-activity', activity),
  
  // Two-factor authentication
  generate2FASecret: () => ipcRenderer.invoke('generate-2fa-secret'),
  generateQRCode: (secret, accountName, issuer) => ipcRenderer.invoke('generate-qr-code', secret, accountName, issuer),
  verify2FAToken: (token, secret) => ipcRenderer.invoke('verify-2fa-token', token, secret),
  save2FAConfig: (secret) => ipcRenderer.invoke('save-2fa-config', secret),
  
  // Zero-Knowledge Sync operations
  syncInitialize: (masterPassword) => ipcRenderer.invoke('sync-initialize', masterPassword),
  syncAddFile: (filePath, options) => ipcRenderer.invoke('sync-add-file', filePath, options),
  syncGetPeers: () => ipcRenderer.invoke('sync-get-peers'),
  syncGetStatus: () => ipcRenderer.invoke('sync-get-status'),
  syncShutdown: () => ipcRenderer.invoke('sync-shutdown'),
  
  // Secure notes
  getStoredMasterPassword,
  setStoredMasterPassword,
  getStoredEntries,
  setStoredEntries,
  
  // Helper function to require modules (for sync manager)
  require: (moduleName) => {
    if (moduleName === 'zero-knowledge-sync') {
      return require('./utils/zero-knowledge-sync');
    }
    throw new Error(`Module ${moduleName} not allowed`);
  }
});