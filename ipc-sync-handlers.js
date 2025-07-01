// IPC Handlers for Zero-Knowledge Sync
const fs = require('fs'); // Required for sync-open-directory

function registerSyncHandlers(ipcMain, getSyncManager, mainWindow) { // Pass getSyncManager and mainWindow

  ipcMain.handle('sync-initialize', async (event, masterPassword) => {
    try {
      let syncManager = getSyncManager(); // Get the possibly null syncManager
      if (!syncManager) {
        const ZeroKnowledgeSync = require('./utils/zero-knowledge-sync');
        syncManager = new ZeroKnowledgeSync();
        ipcMain.syncManager = syncManager; // Store it back if it was created
      }

      await syncManager.initialize(masterPassword);

      // Set up event listeners for file sync events
      syncManager.on('fileReceived', (data) => {
        console.log(`File received event: ${data.fileName}`);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('sync-file-received', data);
        }
      });

      syncManager.on('fileAdded', (data) => {
        console.log(`File added event: ${data.fileName}`);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('sync-file-added', data);
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Sync initialization failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync-add-file', async (event, filePath, options = {}) => {
    try {
      const syncManager = getSyncManager();
      if (!syncManager || !syncManager.isInitialized) {
        return { success: false, error: 'Sync system not initialized' };
      }
      const fileMetadata = await syncManager.addFileToSync(filePath, options);
      return { success: true, metadata: fileMetadata };
    } catch (error) {
      console.error('Failed to add file to sync:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync-get-peers', async (event) => {
    try {
      const syncManager = getSyncManager();
      if (!syncManager || !syncManager.isInitialized) {
        return { success: true, peers: [] };
      }
      const peers = syncManager.getPeers();
      console.log('Main (sync-handler): Getting peers, count:', peers.length);
      return { success: true, peers };
    } catch (error) {
      console.error('Failed to get peers:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync-get-status', async (event) => {
    try {
      const syncManager = getSyncManager();
      if (!syncManager) {
        return {
          success: true,
          status: {
            isInitialized: false,
            isRunning: false,
            stats: { filesInSync: 0, activeSessions: 0 }
          }
        };
      }
      const status = {
        isInitialized: syncManager.isInitialized,
        isRunning: syncManager.isRunning,
        stats: {
          filesInSync: syncManager.files ? syncManager.files.size : 0,
          activeSessions: syncManager.peers ? syncManager.peers.size : 0
        }
      };
      return { success: true, status };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync-shutdown', async (event) => {
    try {
      const syncManager = getSyncManager();
      if (syncManager) {
        await syncManager.shutdown();
        ipcMain.syncManager = null; // Clear it after shutdown
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to shutdown sync:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync-get-files', async (event) => {
    try {
      const syncManager = getSyncManager();
      if (!syncManager || !syncManager.isInitialized) {
        return { success: true, files: [] };
      }
      const files = syncManager.getFiles();
      return { success: true, files };
    } catch (error) {
      console.error('Failed to get sync files:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync-download-file', async (event, fileHash) => {
    try {
      const syncManager = getSyncManager();
      if (!syncManager || !syncManager.isInitialized) {
        return { success: false, error: 'Sync system not initialized' };
      }
      const content = await syncManager.getFileContent(fileHash);
      return { success: true, content: content.toString('base64') };
    } catch (error)
      console.error('Failed to download sync file:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync-remove-file', async (event, fileHash) => {
    try {
      const syncManager = getSyncManager();
      if (!syncManager || !syncManager.isInitialized) {
        return { success: false, error: 'Sync system not initialized' };
      }
      await syncManager.removeFileFromSync(fileHash);
      return { success: true };
    } catch (error) {
      console.error('Failed to remove sync file:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync-get-directory', async (event) => {
    try {
      const syncManager = getSyncManager();
      if (!syncManager || !syncManager.isInitialized) {
        return { success: false, error: 'Sync system not initialized' };
      }
      const directory = syncManager.getSyncDirectory();
      return { success: true, directory };
    } catch (error) {
      console.error('Failed to get sync directory:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync-open-directory', async (event) => {
    try {
      const syncManager = getSyncManager();
      if (!syncManager || !syncManager.isInitialized) {
        return { success: false, error: 'Sync system not initialized' };
      }
      const directory = syncManager.getSyncDirectory();
      if (directory && fs.existsSync(directory)) {
        const { shell } = require('electron');
        await shell.openPath(directory);
        return { success: true };
      } else {
        return { success: false, error: 'Sync directory not found' };
      }
    } catch (error) {
      console.error('Failed to open sync directory:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerSyncHandlers };
