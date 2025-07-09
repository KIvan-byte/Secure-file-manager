const { contextBridge, ipcRenderer } = require('electron');

// SECURITY WARNING: This is a temporary migration solution
let isSecureStorageEnabled = false;

// Secure storage for sensitive data (replacing localStorage)
function checkSecureStorage() {
  // Try to initialize secure storage
  return ipcRenderer.invoke('secure-storage-check');
}

// Initialize secure storage session
async function initializeSecureSession(masterPassword) {
  try {
    isSecureStorageEnabled = await ipcRenderer.invoke('secure-storage-init', masterPassword);
    return isSecureStorageEnabled;
  } catch (error) {
    console.error('Failed to initialize secure storage:', error);
    return false;
  }
}

// Store sensitive data securely
async function storeSecureData(key, value) {
  if (isSecureStorageEnabled) {
    return await ipcRenderer.invoke('secure-storage-store', key, value);
  } else {
    console.error('SECURITY ERROR: Secure storage not initialized. Cannot store sensitive data.');
    throw new Error('Secure storage not initialized');
  }
}

// Retrieve sensitive data securely
async function retrieveSecureData(key) {
  if (isSecureStorageEnabled) {
    return await ipcRenderer.invoke('secure-storage-retrieve', key);
  } else {
    console.error('SECURITY ERROR: Secure storage not initialized. Cannot retrieve sensitive data.');
    throw new Error('Secure storage not initialized');
  }
}

// Remove sensitive data
async function removeSecureData(key) {
  if (isSecureStorageEnabled) {
    return await ipcRenderer.invoke('secure-storage-remove', key);
  } else {
    console.error('SECURITY ERROR: Secure storage not initialized. Cannot remove sensitive data.');
    throw new Error('Secure storage not initialized');
  }
}

// Clear all secure data
async function clearSecureData() {
  if (isSecureStorageEnabled) {
    return await ipcRenderer.invoke('secure-storage-clear');
  } else {
    console.error('SECURITY ERROR: Secure storage not initialized. Cannot clear sensitive data.');
    throw new Error('Secure storage not initialized');
  }
}

// Initialize secure storage check only in Electron context
if (typeof window !== 'undefined' && window !== global) {
  // We're in the renderer process
  checkSecureStorage().then(isAvailable => {
    if (isAvailable) {
      console.log('Secure storage is available');
    } else {
      console.error('Secure storage is not available - application will not work without it');
    }
  }).catch(err => {
    console.error('Failed to check secure storage:', err);
  });
}

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
        try {
          // Use the secure notes IPC handler to validate password
          const result = await ipcRenderer.invoke('secure-notes:validate-master-password', password);
          return result;
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      checkTwoFactorSetup: () => ipcRenderer.invoke('auth:check-2fa-setup'),
      generateTwoFactorSecret: () => ipcRenderer.invoke('auth:generate-2fa-secret'),
      setupTwoFactor: (secret, code) => ipcRenderer.invoke('auth:setup-2fa', { secret, code }),
      verifyTwoFactorCode: (code) => ipcRenderer.invoke('auth:verify-2fa-code', code),
      disableTwoFactor: () => ipcRenderer.invoke('auth:disable-2fa')
    },
    // Security API
    security: {
      validatePassword: (password) => ipcRenderer.invoke('security-validate-password', password),
      getVirusTotalSettings: () => ipcRenderer.invoke('security-get-virustotal-settings'),
      setVirusTotalSettings: (settings) => ipcRenderer.invoke('security-set-virustotal-settings', settings)
    },
    // Secure storage API
    secureStorage: {
      initialize: initializeSecureSession,
      store: storeSecureData,
      retrieve: retrieveSecureData,
      remove: removeSecureData,
      clear: clearSecureData,
      isEnabled: () => isSecureStorageEnabled
    },
    secureNotes: {
      setupVault: async (password) => {
        return await ipcRenderer.invoke('secure-notes:setup-vault', password);
      },
      getEntries: async (password) => {
        return await ipcRenderer.invoke('secure-notes:get-entries', password);
      },
      saveEntry: async (entry, password) => {
        return await ipcRenderer.invoke('secure-notes:save-entry', { entry, password });
      },
      deleteEntry: async (id, password) => {
        return await ipcRenderer.invoke('secure-notes:delete-entry', { entryId: id, password });
      },
      // Enhanced security methods
      changePassword: async (oldPassword, newPassword) => {
        // Validate old password first
        const validateResult = await ipcRenderer.invoke('secure-notes:validate-master-password', oldPassword);
        if (!validateResult.success) {
          return { success: false, error: 'Invalid current password' };
        }
        
        // Get existing entries with old password
        const entriesResult = await ipcRenderer.invoke('secure-notes:get-entries', oldPassword);
        if (!entriesResult.success) {
          return { success: false, error: 'Failed to get existing entries' };
        }
        
        // Setup new vault with new password
        const setupResult = await ipcRenderer.invoke('secure-notes:setup-vault', newPassword);
        if (!setupResult.success) {
          return { success: false, error: 'Failed to setup new vault' };
        }
        
        // Restore entries with new password
        for (const entry of entriesResult.entries) {
          const saveResult = await ipcRenderer.invoke('secure-notes:save-entry', { entry, password: newPassword });
          if (!saveResult.success) {
            return { success: false, error: 'Failed to migrate entries' };
          }
        }
        
        return { success: true };
      },
      validatePassword: async (password) => {
        return await ipcRenderer.invoke('secure-notes:validate-master-password', password);
      },
      checkVault: async () => {
        const result = await ipcRenderer.invoke('secure-notes:validate-master-password', '');
        return {
          hasVault: !result.newUser,
          isInitialized: !result.newUser
        };
      }
    },
    // Security monitoring functions
    security: {
      getStats: () => ipcRenderer.invoke('security:get-stats'),
      getEvents: (limit) => ipcRenderer.invoke('security:get-events', limit),
      clearEvents: () => ipcRenderer.invoke('security:clear-events'),
      validatePassword: (password) => ipcRenderer.invoke('security:validate-password', password),
      checkFileFormat: (filePath) => ipcRenderer.invoke('security:check-file-format', filePath)
    },
    // Security API for VirusTotal and other security features
    security: {
      validatePassword: async (password) => {
        try {
          // Mock implementation - in real app this would validate password strength
          const result = {
            isValid: password.length >= 8,
            score: Math.min(password.length / 2, 6),
            issues: []
          };
          
          if (password.length < 8) {
            result.issues.push('Password must be at least 8 characters long');
          }
          if (!/[A-Z]/.test(password)) {
            result.issues.push('Password must contain at least one uppercase letter');
          }
          if (!/[a-z]/.test(password)) {
            result.issues.push('Password must contain at least one lowercase letter');
          }
          if (!/[0-9]/.test(password)) {
            result.issues.push('Password must contain at least one number');
          }
          if (!/[^A-Za-z0-9]/.test(password)) {
            result.issues.push('Password must contain at least one special character');
          }
          
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    },
    // Secure storage API
    secureStorage: {
      initialize: initializeSecureSession,
      store: storeSecureData,
      retrieve: retrieveSecureData,
      remove: removeSecureData,
      clear: clearSecureData,
      isEnabled: () => isSecureStorageEnabled
    },
    secureNotes: {
      setupVault: async (password) => {
        return await ipcRenderer.invoke('secure-notes:setup-vault', password);
      },
      getEntries: async (password) => {
        return await ipcRenderer.invoke('secure-notes:get-entries', password);
      },
      saveEntry: async (entry, password) => {
        return await ipcRenderer.invoke('secure-notes:save-entry', { entry, password });
      },
      deleteEntry: async (id, password) => {
        return await ipcRenderer.invoke('secure-notes:delete-entry', { entryId: id, password });
      },
      // Enhanced security methods
      changePassword: async (oldPassword, newPassword) => {
        // Validate old password first
        const validateResult = await ipcRenderer.invoke('secure-notes:validate-master-password', oldPassword);
        if (!validateResult.success) {
          return { success: false, error: 'Invalid current password' };
        }
        
        // Get existing entries with old password
        const entriesResult = await ipcRenderer.invoke('secure-notes:get-entries', oldPassword);
        if (!entriesResult.success) {
          return { success: false, error: 'Failed to get existing entries' };
        }
        
        // Setup new vault with new password
        const setupResult = await ipcRenderer.invoke('secure-notes:setup-vault', newPassword);
        if (!setupResult.success) {
          return { success: false, error: 'Failed to setup new vault' };
        }
        
        // Restore entries with new password
        for (const entry of entriesResult.entries) {
          const saveResult = await ipcRenderer.invoke('secure-notes:save-entry', { entry, password: newPassword });
          if (!saveResult.success) {
            return { success: false, error: 'Failed to migrate entries' };
          }
        }
        
        return { success: true };
      },
      validatePassword: async (password) => {
        return await ipcRenderer.invoke('secure-notes:validate-master-password', password);
      },
      checkVault: async () => {
        const result = await ipcRenderer.invoke('secure-notes:validate-master-password', '');
        return {
          hasVault: !result.newUser,
          isInitialized: !result.newUser
        };
      }
    },
    // Security monitoring functions
    security: {
      getStats: () => ipcRenderer.invoke('security:get-stats'),
      getEvents: (limit) => ipcRenderer.invoke('security:get-events', limit),
      clearEvents: () => ipcRenderer.invoke('security:clear-events'),
      validatePassword: (password) => ipcRenderer.invoke('security:validate-password', password),
      checkFileFormat: (filePath) => ipcRenderer.invoke('security:check-file-format', filePath),
      getVirusTotalSettings: () => ipcRenderer.invoke('security-get-virustotal-settings'),
      setVirusTotalSettings: (settings) => ipcRenderer.invoke('security-set-virustotal-settings', settings)
    },
    // VirusTotal operations
    virusTotalGetSettings: () => ipcRenderer.invoke('virustotal-get-settings'),
    virusTotalSetSettings: (settings) => ipcRenderer.invoke('virustotal-set-settings', settings),
    virusTotalValidateApiKey: (apiKey) => ipcRenderer.invoke('virustotal-validate-api-key', apiKey),
    virusTotalScanFile: (filePath) => ipcRenderer.invoke('virustotal-scan-file', filePath),
    virusTotalGetScanResults: (fileHash) => ipcRenderer.invoke('virustotal-get-scan-results', fileHash),
    virusTotalGetAnalysisResults: (analysisId) => ipcRenderer.invoke('virustotal-get-analysis-results', analysisId)
  }
);

contextBridge.exposeInMainWorld('electronAPI', {
  // Secure storage API - replaces localStorage for persistent settings
  secureStorage: {
    // Initialize secure session with master password
    initialize: async (masterPassword) => {
      try {
        const result = await ipcRenderer.invoke('secure-storage-init', masterPassword);
        isSecureStorageEnabled = result.success;
        return result;
      } catch (error) {
        console.error('Failed to initialize secure storage:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Check if secure session is active
    isActive: async () => {
      try {
        return await ipcRenderer.invoke('secure-storage-is-active');
      } catch (error) {
        console.error('Failed to check secure storage session:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Store secure data (replaces localStorage.setItem)
    store: async (key, value) => {
      try {
        return await ipcRenderer.invoke('secure-storage-store', key, value);
      } catch (error) {
        console.error('Failed to store secure data:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Retrieve secure data (replaces localStorage.getItem)
    retrieve: async (key) => {
      try {
        return await ipcRenderer.invoke('secure-storage-retrieve', key);
      } catch (error) {
        console.error('Failed to retrieve secure data:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Remove secure data (replaces localStorage.removeItem)
    remove: async (key) => {
      try {
        return await ipcRenderer.invoke('secure-storage-remove', key);
      } catch (error) {
        console.error('Failed to remove secure data:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Clear all secure data (replaces localStorage.clear)
    clear: async () => {
      try {
        return await ipcRenderer.invoke('secure-storage-clear');
      } catch (error) {
        console.error('Failed to clear secure data:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Get storage statistics
    getStats: async () => {
      try {
        return await ipcRenderer.invoke('secure-storage-stats');
      } catch (error) {
        console.error('Failed to get storage stats:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Refresh session timeout
    refresh: async () => {
      try {
        return await ipcRenderer.invoke('secure-storage-refresh');
      } catch (error) {
        console.error('Failed to refresh secure storage session:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Clear session
    clearSession: async () => {
      try {
        return await ipcRenderer.invoke('secure-storage-clear-session');
      } catch (error) {
        console.error('Failed to clear secure storage session:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Legacy compatibility - for backward compatibility during migration
    isEnabled: () => isSecureStorageEnabled
  },
  
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
  
  // VirusTotal operations
  virusTotalGetSettings: () => ipcRenderer.invoke('virustotal-get-settings'),
  virusTotalSetSettings: (settings) => ipcRenderer.invoke('virustotal-set-settings', settings),
  virusTotalValidateApiKey: (apiKey) => ipcRenderer.invoke('virustotal-validate-api-key', apiKey),
  virusTotalScanFile: (filePath) => ipcRenderer.invoke('virustotal-scan-file', filePath),
  virusTotalGetScanResults: (fileHash) => ipcRenderer.invoke('virustotal-get-scan-results', fileHash),
  virusTotalGetAnalysisResults: (analysisId) => ipcRenderer.invoke('virustotal-get-analysis-results', analysisId),
  
  // Helper function to require modules (for sync manager)
  require: (moduleName) => {
    if (moduleName === 'zero-knowledge-sync') {
      return require('./utils/zero-knowledge-sync');
    }
    throw new Error(`Module ${moduleName} not allowed`);
  }
});