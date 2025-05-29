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
      // Manage Active Shares
      listActiveShares: () => ipcRenderer.invoke('list-active-shares'),
      revokeShareLink: (tokenId) => ipcRenderer.invoke('revoke-share-link', tokenId)
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