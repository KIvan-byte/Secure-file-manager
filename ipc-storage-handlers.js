// IPC Handlers for Secure Storage

function registerStorageHandlers(ipcMain, secureStorage) {
  // Initialize secure session with master password
  ipcMain.handle('secure-storage-init', async (event, masterPassword) => {
    try {
      const success = await secureStorage.initializeSession(masterPassword);
      return { success };
    } catch (error) {
      console.error('Failed to initialize secure storage:', error);
      return { success: false, error: error.message };
    }
  });

  // Check if secure session is active
  ipcMain.handle('secure-storage-is-active', async (event) => {
    try {
      return { success: true, isActive: secureStorage.isSessionActive() };
    } catch (error) {
      console.error('Failed to check secure storage session:', error);
      return { success: false, error: error.message };
    }
  });

  // Store secure data
  ipcMain.handle('secure-storage-store', async (event, key, value) => {
    try {
      const success = await secureStorage.storeSecureData(key, value);
      return { success };
    } catch (error) {
      console.error('Failed to store secure data:', error);
      return { success: false, error: error.message };
    }
  });

  // Retrieve secure data
  ipcMain.handle('secure-storage-retrieve', async (event, key) => {
    try {
      const value = await secureStorage.retrieveSecureData(key);
      return { success: true, value };
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      return { success: false, error: error.message };
    }
  });

  // Remove secure data
  ipcMain.handle('secure-storage-remove', async (event, key) => {
    try {
      const success = await secureStorage.removeSecureData(key);
      return { success };
    } catch (error) {
      console.error('Failed to remove secure data:', error);
      return { success: false, error: error.message };
    }
  });

  // Clear all secure data
  ipcMain.handle('secure-storage-clear', async (event) => {
    try {
      const success = await secureStorage.clearAllData();
      return { success };
    } catch (error) {
      console.error('Failed to clear secure data:', error);
      return { success: false, error: error.message };
    }
  });

  // Get storage statistics
  ipcMain.handle('secure-storage-stats', async (event) => {
    try {
      const stats = secureStorage.getStorageStats();
      return { success: true, stats };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { success: false, error: error.message };
    }
  });

  // Refresh session timeout
  ipcMain.handle('secure-storage-refresh', async (event) => {
    try {
      secureStorage.refreshSession();
      return { success: true };
    } catch (error) {
      console.error('Failed to refresh secure storage session:', error);
      return { success: false, error: error.message };
    }
  });

  // Clear session
  ipcMain.handle('secure-storage-clear-session', async (event) => {
    try {
      secureStorage.clearSession();
      return { success: true };
    } catch (error)
      console.error('Failed to clear secure storage session:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerStorageHandlers };
