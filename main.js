const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { join } = require('path');
const http = require('http');
const isDev = require('electron-is-dev');
const express = require('express');
const cors = require('cors');
const ip = require('ip');
const FileUtils = require('./utils/file-utils');

// We'll create a separate module loader for lowdb using dynamic imports
// since lowdb v5 is an ES Module
let db;

// Set up Express server for file sharing
const expressApp = express();
const PORT = 3001;
let serverAddress = '';

// Configure Express
expressApp.use(cors());
expressApp.use(express.json());
expressApp.use(express.static(path.join(__dirname, 'public')));

// Start the file sharing server
function startFileServer() {
  // Get local IP address
  const localIP = ip.address();
  serverAddress = `http://${localIP}:${PORT}`;
  
  // Add a welcome page
  expressApp.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Secure File Manager</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              line-height: 1.6;
              color: #333;
            }
            .container {
              background-color: #f5f6fa;
              border-radius: 5px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            h1 {
              color: #2c3e50;
              margin-top: 0;
            }
            .feature {
              margin-bottom: 15px;
              padding-left: 20px;
              border-left: 3px solid #3498db;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Secure File Manager - Sharing Server</h1>
            <p>This is the secure file sharing server for your Secure File Manager application. It is running at <strong>${serverAddress}</strong>.</p>
            
            <h2>How It Works</h2>
            <div class="feature">
              <p>When you share a file from the Secure File Manager, it creates a secure one-time download link.</p>
            </div>
            <div class="feature">
              <p>Each link can only be used once and includes encryption to ensure secure access.</p>
            </div>
            <div class="feature">
              <p>Recipients can download the file directly through their web browser without needing special software.</p>
            </div>
            
            <h2>Security Information</h2>
            <p>This server is only accessible on your local network. For remote sharing, you would need to configure port forwarding or use a VPN.</p>
            
            <p style="margin-top: 30px; text-align: center;">
              <small>Secure File Manager © ${new Date().getFullYear()}</small>
            </p>
          </div>
        </body>
      </html>
    `);
  });
  
  // Set up endpoint to access shared files
  expressApp.get('/share/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const { key } = req.query;
      
      console.log(`File access attempt - Token: ${token}`);
      
      if (!token || !key) {
        return res.status(400).send('Missing token or encryption key');
      }
      
      await db.read();
      
      const shareInfo = db.data.sharedLinks.find(link => 
        link.id === token && !link.isUsed
      );
      
      if (!shareInfo) {
        return res.status(404).send('Link not found or already used');
      }
      
      if (shareInfo.encryptionKey !== key) {
        return res.status(401).send('Invalid encryption key');
      }
      
      // Get file content
      const filePath = shareInfo.filePath;
      console.log(`Serving file: ${filePath}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`File does not exist: ${filePath}`);
        return res.status(404).send(`
          <html>
            <head>
              <title>File Not Found</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                .error-container { background: #fff3f3; border-left: 4px solid #e74c3c; padding: 20px; border-radius: 4px; }
                h1 { color: #e74c3c; }
              </style>
            </head>
            <body>
              <div class="error-container">
                <h1>Error: File Not Found</h1>
                <p>The file you are trying to access no longer exists on the server.</p>
                <p>This could be because:</p>
                <ul>
                  <li>The file has been deleted or moved</li>
                  <li>The file path is no longer accessible</li>
                  <li>The server configuration has changed</li>
                </ul>
                <p>Please contact the person who shared the file with you for assistance.</p>
              </div>
            </body>
          </html>
        `);
      }
      
      // Mark link as used (one-time access) only if the file exists and is about to be served
      const linkIndex = db.data.sharedLinks.findIndex(link => link.id === token);
      db.data.sharedLinks[linkIndex].isUsed = true;
      await db.write();
      
      // Log access
      await logAccess('access_shared_file', filePath, { token, remote: true });
      
      // Instead of using express's res.download which may have issues with certain paths,
      // manually read and stream the file
      const filename = path.basename(filePath);
      const mimetype = getMimeType(filename);
      
      res.setHeader('Content-disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-type', mimetype);
      
      // Create read stream and pipe to response
      try {
        const fileStream = fs.createReadStream(filePath);
        
        fileStream.on('error', (err) => {
          console.error(`Error streaming file: ${err.message}`);
          // If headers haven't been sent yet, we can send an error response
          if (!res.headersSent) {
            res.status(500).send('Error streaming file');
          } else {
            // Otherwise just end the response
            res.end();
          }
        });
        
        fileStream.pipe(res);
      } catch (streamError) {
        console.error(`Error creating file stream: ${streamError.message}`);
        return res.status(500).send('Server error while accessing file');
      }
    } catch (error) {
      console.error('Error serving shared file:', error);
      return res.status(500).send('Server error');
    }
  });
  
  // Helper function to determine MIME type based on file extension
  function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
  
  // Start the server
  const server = expressApp.listen(PORT, () => {
    console.log(`File sharing server running at ${serverAddress}`);
  });
  
  // Handle server errors
  server.on('error', (error) => {
    console.error('File sharing server error:', error);
  });
  
  return serverAddress;
}

// Initialize the database
async function initDb() {
  try {
    // Import lowdb dynamically (ES modules)
    const { Low } = await import('lowdb');
    const { JSONFile } = await import('lowdb/node');
    
    // Configure lowdb
    const dbFile = join(app.getPath('userData'), 'db.json');
    const adapter = new JSONFile(dbFile);
    db = new Low(adapter);
    
    // If file doesn't exist, db.data will be null
    await db.read();
    
    // Set default data
    db.data ||= { sharedLinks: [], accessLogs: [] };
    await db.write();
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

let mainWindow;

// Function to check if React development server is running
const waitForReactDevServer = (url, callback, timeout = 30000, interval = 1000) => {
  const startTime = Date.now();
  const checkServer = () => {
    http.get(url, (res) => {
      if (res.statusCode === 200) {
        callback(true);
      } else {
        checkWithinTimeout();
      }
    }).on('error', () => {
      checkWithinTimeout();
    });
  };

  const checkWithinTimeout = () => {
    if (Date.now() - startTime > timeout) {
      console.error('Timeout waiting for React development server');
      callback(false);
      return;
    }
    setTimeout(checkServer, interval);
  };

  checkServer();
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true, // Enable web security even in development
      allowRunningInsecureContent: false // Disable running insecure content
    }
  });

  // Log information for debugging
  console.log('Preload path:', path.join(__dirname, 'preload.js'));
  console.log('Is packaged:', app.isPackaged);
  console.log('Is dev:', isDev);

  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;

  console.log('Loading URL:', startUrl);
  
  mainWindow.loadURL(startUrl);

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
    
    // Add event listener to detect loading errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Failed to load:', errorCode, errorDescription);
    });
  }

  // Set proper Content-Security-Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:* ws://localhost:*"]
      }
    });
  });

  // Log when page is finished loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
  });
  
  // Log errors
  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log('Renderer Console:', message);
  });
}

app.whenReady().then(async () => {
  console.log('App is ready, initializing database...');
  const dbInitialized = await initDb();
  if (dbInitialized) {
    console.log('Database initialized successfully');
    // Start the file sharing server
    const serverUrl = startFileServer();
    console.log(`File sharing server started at: ${serverUrl}`);
    createWindow();
  } else {
    console.error('Application failed to start due to database initialization error.');
    app.quit();
  }
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers

// Browse and read directories
ipcMain.handle('browse-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) return { success: false };
  return { success: true, path: result.filePaths[0] };
});

// Add new handler for selecting a single file
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile']
  });
  if (result.canceled) return { success: false };
  return { success: true, path: result.filePaths[0] };
});

// Read directories
ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    // Use our safer FileUtils instead of direct fs calls
    const fileItems = FileUtils.readDirectory(dirPath);
    
    // Log directory access
    await logAccess('read_directory', dirPath);
    
    return { success: true, items: fileItems };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// File operations
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    // Use our safer FileUtils
    const content = FileUtils.readFile(filePath, 'utf8');
    
    // Log file access
    await logAccess('read_file', filePath);
    
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Share file with one-time link
ipcMain.handle('share-file', async (event, filePath) => {
  try {
    // Create a unique token for this share
    const token = uuidv4();
    const encryptionKey = crypto.randomBytes(32).toString('hex');
    
    // Store share information
    db.data.sharedLinks.push({
      id: token,
      filePath,
      createdAt: new Date().toISOString(),
      encryptionKey,
      isUsed: false
    });
    
    await db.write();
    
    // Log the share
    await logAccess('share_file', filePath, { token });
    
    // Return share link with network address
    const shareUrl = `${serverAddress}/share/${token}?key=${encryptionKey}`;
    
    return { 
      success: true, 
      shareLink: shareUrl,
      encryptionKey
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Access a shared file
ipcMain.handle('access-shared-file', async (event, { token, encryptionKey }) => {
  try {
    await db.read();
    
    const shareInfo = db.data.sharedLinks.find(link => 
      link.id === token && !link.isUsed
    );
    
    if (!shareInfo) {
      return { success: false, error: 'Link not found or already used' };
    }
    
    if (shareInfo.encryptionKey !== encryptionKey) {
      return { success: false, error: 'Invalid encryption key' };
    }
    
    // Mark link as used (one-time access)
    const linkIndex = db.data.sharedLinks.findIndex(link => link.id === token);
    db.data.sharedLinks[linkIndex].isUsed = true;
    await db.write();
    
    // Get file content - use FileUtils for safer handling
    const filePath = shareInfo.filePath;
    
    // First check if the file exists
    if (!FileUtils.fileExists(filePath)) {
      return { success: false, error: 'File no longer exists' };
    }
    
    const fileContent = fs.readFileSync(filePath);
    
    // Log access
    await logAccess('access_shared_file', filePath, { token });
    
    return {
      success: true,
      fileName: path.basename(filePath),
      content: fileContent.toString('base64')
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get access logs
ipcMain.handle('get-access-logs', async () => {
  try {
    await db.read();
    return { success: true, logs: db.data.accessLogs };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Helper to log access
async function logAccess(action, path, metadata = {}) {
  db.data.accessLogs.push({
    action,
    path,
    timestamp: new Date().toISOString(),
    ...metadata
  });
  
  await db.write();
}