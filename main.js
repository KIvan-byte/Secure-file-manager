const { app, BrowserWindow, ipcMain, dialog, Menu, Tray } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const isDev = require('electron-is-dev');
const express = require('express');
const cors = require('cors');
const util = require('util');
const { exec } = require('child_process');
const FileUtils = require('./utils/file-utils');
const EncryptionUtils = require('./utils/encryption-utils');
const CompressionUtils = require('./utils/compression-utils');
const TwoFactorAuth = require('./utils/two-factor-auth');
const SecureStorage = require('./utils/secure-storage');
const SecurityMiddleware = require('./utils/security-middleware');

// Initialize security components
const secureStorage = new SecureStorage();
const securityMiddleware = new SecurityMiddleware({
  maxRequestSize: 50 * 1024 * 1024, // 50MB
  allowedOrigins: ['http://localhost:5175', 'file://', 'app://']
});

// Security event logging
securityMiddleware.on('securityEvent', (event) => {
  console.warn(`Security Event [${event.type}]:`, event.details);
  
  // Log critical events to file
  if (['auto_blocked_suspicious', 'path_traversal_attempt', 'csrf_violation'].includes(event.type)) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: event.type,
      details: event.details
    };
    
    try {
      const logFile = path.join(__dirname, 'security.log');
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to write security log:', error);
    }
  }
});

// Initialize Zero-Knowledge Sync
let syncManager = null;
ipcMain.handle('sync-initialize', async (event, masterPassword) => {
  try {
    if (!syncManager) {
      const ZeroKnowledgeSync = require('./utils/zero-knowledge-sync');
      syncManager = new ZeroKnowledgeSync();
    }
    
    await syncManager.initialize(masterPassword);
    
    // Set up event listeners for file sync events
    syncManager.on('fileReceived', (data) => {
      console.log(`File received event: ${data.fileName}`);
      // Notify renderer about new file
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('sync-file-received', data);
      }
    });
    
    syncManager.on('fileAdded', (data) => {
      console.log(`File added event: ${data.fileName}`);
      // Notify renderer about new file
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
    if (!syncManager || !syncManager.isInitialized) {
      return { success: false, error: 'Sync system not initialized' };
    }
    
    const fileMetadata = await syncManager.addFileToSync(filePath, options);
    
    return { 
      success: true, 
      metadata: fileMetadata
    };
  } catch (error) {
    console.error('Failed to add file to sync:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sync-get-peers', async (event) => {
  try {
    if (!syncManager || !syncManager.isInitialized) {
      return { success: true, peers: [] };
    }
    
    const peers = syncManager.getPeers();
    console.log('Main: Getting peers, count:', peers.length); // Debug log
    
    return { success: true, peers };
  } catch (error) {
    console.error('Failed to get peers:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sync-get-status', async (event) => {
  try {
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
    if (syncManager) {
      await syncManager.shutdown();
      syncManager = null;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to shutdown sync:', error);
    return { success: false, error: error.message };
  }
});

// Get synced files list
ipcMain.handle('sync-get-files', async (event) => {
  try {
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

// Download a synced file
ipcMain.handle('sync-download-file', async (event, fileHash) => {
  try {
    if (!syncManager || !syncManager.isInitialized) {
      return { success: false, error: 'Sync system not initialized' };
    }
    
    const content = await syncManager.getFileContent(fileHash);
    return { success: true, content: content.toString('base64') };
  } catch (error) {
    console.error('Failed to download sync file:', error);
    return { success: false, error: error.message };
  }
});

// Remove a file from sync
ipcMain.handle('sync-remove-file', async (event, fileHash) => {
  try {
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

// Get sync directory path
ipcMain.handle('sync-get-directory', async (event) => {
  try {
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

// Open sync directory in file explorer
ipcMain.handle('sync-open-directory', async (event) => {
  try {
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

// Cleanup sync on app exit
  // app.on('before-quit', async () => { ... }) // This logic is now moved into the 'will-quit' event registered by share-handlers
  // to ensure the file server is also stopped.

const net = require('net');

// Optimize for low power consumption and reduce heat generation
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu-rasterization');
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');

// Force low power mode and limit CPU usage
app.commandLine.appendSwitch('force-low-power-gpu');
app.commandLine.appendSwitch('max_old_space_size', '256'); // Reduce memory usage further
app.commandLine.appendSwitch('disable-extensions');
app.commandLine.appendSwitch('disable-plugins');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('disable-accelerated-2d-canvas');
app.commandLine.appendSwitch('disable-accelerated-jpeg-decoding');
app.commandLine.appendSwitch('disable-accelerated-mjpeg-decode');
app.commandLine.appendSwitch('disable-accelerated-video-decode');

// Throttle timers to reduce CPU usage
app.commandLine.appendSwitch('disable-ipc-flooding-protection');
app.commandLine.appendSwitch('enable-aggressive-domstorage-flushing');

// We'll create a separate module loader for lowdb using dynamic imports
// since lowdb v5 is an ES Module
let db; // This will be initialized in initDb and attached to ipcMain

// Initialize 2FA
const twoFactorAuth = new TwoFactorAuth(); // This will be passed to auth handlers

// serverAddress will be initialized by the share-handler module
let serverAddress = '';

// Get the correct local IP address using Node.js built-in modules
// This function will be passed to the share-handler module
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  // Look for IPv4 addresses that are not loopback and not internal
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (loopback) addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  
  // Fallback to localhost if no external IP found
  return '127.0.0.1';
}

// The startFileServer function, Express app setup, and related route handlers
// have been moved to ipc-share-handlers.js.
// The getMimeType function has also been moved there.

let mainWindow;
let tray = null;
let isQuitting = false; // Flag to indicate if the app is quitting

// Create system tray
function createTray() {
  // Use appropriate icon based on platform
  const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
  const iconPath = path.join(__dirname, 'assets', 'icons', iconName);
  
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show / Hide', 
      click: () => {
        if (mainWindow) {
          mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
        }
      } 
    },
    { 
      label: 'Quit', 
      click: () => {
        isQuitting = true;
        app.quit();
      } 
    }
  ]);

  tray.setToolTip('Secure File Manager');
  tray.setContextMenu(contextMenu);

  // Show window when tray icon is clicked
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });
}

// Setup global shortcuts
function setupGlobalShortcuts() {
  // Register a global shortcut for opening the app
  const { globalShortcut } = require('electron');
  
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });
}

async function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
      // Disable hardware acceleration for reduced heat
      offscreen: false,
      hardwareAcceleration: false,
      // Limit background processing
      backgroundThrottling: true,
    },
    icon: path.join(__dirname, 'build', 'icon.png'),
    show: false,
    // Set backgroundColor to prevent white flash
    backgroundColor: '#f5f6fa',
    // Hide the menu bar (File, Edit, View, Window, Help)
    autoHideMenuBar: true
  });

  // Handle the close event
  mainWindow.on('close', (event) => {
    // If we are not quitting, prevent the window from closing and hide it instead
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  console.log('Preload path:', path.join(__dirname, 'preload.js'));
  console.log('Is packaged:', app.isPackaged);
  console.log('Is dev (electron-is-dev):', isDev);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Command line args:', process.argv);
  
  // Better development mode detection
  // If NODE_ENV is explicitly set to production, use production mode
  // Otherwise, use electron-is-dev logic
  const isDevMode = process.env.NODE_ENV !== 'production' && isDev;
  console.log('Actual dev mode:', isDevMode);

  try {
    // Determine the correct URL to load
    const startUrl = isDevMode
      ? 'http://localhost:5174'
      : `file://${path.join(__dirname, 'build', 'index.html')}`;
    
    console.log('Loading URL:', startUrl);
    console.log('Environment: ' + (isDevMode ? 'Development' : 'Production'));
    
    // Load the URL
    mainWindow.loadURL(startUrl).catch(err => {
      console.error('Failed to load URL:', err);
      // Show error in window
      mainWindow.loadURL(`data:text/html;charset=utf-8,
        <html>
          <head><title>Error</title></head>
          <body>
            <h1>Error Loading App</h1>
            <p>${err.message}</p>
            <p>Please check that the React development server is running.</p>
          </body>
        </html>
      `);
    });

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      mainWindow.focus();

      // Open DevTools in dev mode
      if (isDevMode) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
      }
    });

    // Set up proper Content-Security-Policy
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ["default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:* ws://localhost:*; img-src 'self' data:; media-src 'self' data:; object-src 'self' data:;"]
        }
      });
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Page finished loading');
    });
    
    // Log errors
    mainWindow.webContents.on('console-message', (event, level, message) => {
      console.log('Renderer Console:', message);
    });

    // Initialize database and other services
    console.log('App is ready, initializing database...');
    
    try {
      const dbInitialized = await initDb();
      console.log('Database initialized successfully');
      ipcMain.db = db; // Make db instance accessible to handlers via ipcMain

      // Register IPC handlers after db is initialized and other services are ready
      registerAllIpcHandlers(); // This will also set up ipcMain.startFileServer

      // Set up file server for sharing by calling the function from share-handlers
      if (ipcMain.startFileServer) {
        const actualServerAddress = await ipcMain.startFileServer(); // Start server and get address
        serverAddress = actualServerAddress; // Update global serverAddress if needed, though it's also in ipcMain.serverAddress
        console.log(`File sharing server started at: ${serverAddress}`);
      } else {
        console.error("startFileServer function not found after registering handlers.");
      }
      
    } catch (error) {
      console.error('Error initializing services or registering handlers:', error);
    }
  } catch (error) {
    console.error('Error in createWindow:', error);
  }
}

// Initialize the database
async function initDb() {
  try {
    // Import lowdb dynamically (ES modules)
    const { Low } = await import('lowdb');
    const { JSONFile } = await import('lowdb/node');
    
    // Configure lowdb
    const dbFile = path.join(app.getPath('userData'), 'db.json');
    const adapter = new JSONFile(dbFile);
    
    // Create default data structure
    const defaultData = {
      sharedLinks: [],
      accessLogs: [],
      encryptedFiles: [],
      analytics: [],
      settings: {}
    };
    
    db = new Low(adapter, defaultData);
    
    // Read data from file
    await db.read();
    
    // If data is null (new file), set defaults
    if (db.data === null) {
      db.data = defaultData;
      await db.write();
    }
    
    // Ensure all required properties exist
    db.data.sharedLinks = db.data.sharedLinks || [];
    db.data.accessLogs = db.data.accessLogs || [];
    db.data.encryptedFiles = db.data.encryptedFiles || [];
    db.data.analytics = db.data.analytics || [];
    db.data.settings = db.data.settings || {};
    
    await db.write();
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

// Database helper function
async function ensureDbReady() {
  if (!db) {
    await initDb();
  }
  if (!db || !db.data) {
    throw new Error('Database not initialized');
  }
  await db.read();
}

async function startApp() {
  try {
    await app.whenReady();
    await createWindow();
    
    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  } catch (error) {
    console.error('Error starting app:', error);
  }
}

startApp();

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

const { registerFileHandlers } = require('./ipc-file-handlers');
const { registerCryptoHandlers } = require('./ipc-crypto-handlers');
const { registerShareHandlers, getMimeType } = require('./ipc-share-handlers');
const { registerAuthHandlers } = require('./ipc-auth-handlers');
const { registerCompressionHandlers } = require('./ipc-compression-handlers');
const { registerAnalyticsHandlers } = require('./ipc-analytics-handlers');
const { registerSecureNotesHandlers } = require('./ipc-notes-handlers');
const { registerStorageHandlers } = require('./ipc-storage-handlers');
const { registerSyncHandlers } = require('./ipc-sync-handlers');
const { registerSecurityHandlers } = require('./ipc-security-handlers');

// Helper to log access - this will be passed to handlers that need it
async function logAccess(action, path, metadata = {}) {
  try {
    await ensureDbReady(); // ensureDbReady is defined below
    // db is now attached to ipcMain by initDb for access in handlers
    ipcMain.db.data.accessLogs.push({
      action,
      path,
      timestamp: new Date().toISOString(),
      ...metadata
    });
    await ipcMain.db.write();
  } catch (error) {
    console.error('Error logging access:', error);
  }
}

// Register all IPC handlers from the new modules
function registerAllIpcHandlers() {
  const getSyncMgr = () => syncManager; // Getter for syncManager
  const setSyncMgr = (newMgr) => { syncManager = newMgr; }; // Setter for syncManager
  // Pass ipcMain, and other necessary global objects/functions to each register function
  // Also pass the ensureDbReady function and the logAccess function

  registerFileHandlers(ipcMain, mainWindow, logAccess, ensureDbReady);
  registerCryptoHandlers(ipcMain, logAccess, ensureDbReady, securityMiddleware);
  
  // For share handlers, we need to pass app (for getPath), and getLocalIP
  // startFileServer and stopFileServer will be returned to be called appropriately
  const shareHandlerUtils = registerShareHandlers(ipcMain, app, ensureDbReady, logAccess, securityMiddleware, getLocalIP);
  ipcMain.startFileServer = shareHandlerUtils.startFileServer;
  app.on('will-quit', async () => {
    if (shareHandlerUtils.stopFileServer) {
      await shareHandlerUtils.stopFileServer();
    }
    // Other cleanup for will-quit
    console.log('App is quitting, cleaning up resources...');
    if (syncManager) {
      try {
        await syncManager.shutdown();
      } catch (error) {
        console.error('Error shutting down sync on app exit:', error);
      }
    }
    try {
      secureStorage.cleanup();
    } catch (error) {
      console.error('Error cleaning up secure storage:', error);
    }
    try {
      securityMiddleware.destroy();
    } catch (error) {
      console.error('Error cleaning up security middleware:', error);
    }
    console.log('Security cleanup completed');
  });


  registerAuthHandlers(ipcMain, twoFactorAuth, securityMiddleware);
  registerCompressionHandlers(ipcMain, logAccess);
  registerAnalyticsHandlers(ipcMain, app, ensureDbReady); // Pass app for getPath
  registerSecureNotesHandlers(ipcMain, app); // Pass app for getPath
  registerStorageHandlers(ipcMain, secureStorage);

  // For sync handlers, pass a getter for syncManager and mainWindow
  // The syncManager instance itself is managed within main.js and its handlers
  registerSyncHandlers(ipcMain, () => ipcMain.syncManager, mainWindow);


  registerSecurityHandlers(ipcMain, securityMiddleware, secureStorage);
}

// Call this after mainWindow is created and other services are ready
// This will be called within the try block of createWindow after initDb and startFileServer
// The actual call to registerAllIpcHandlers will be done in createWindow.