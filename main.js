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
const EncryptionUtils = require('./utils/encryption-utils');

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
  
  // Modify the endpoint to serve shared files to handle decryption
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
      
      // Get file details
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

      // Check if this is an encrypted file that allows decryption
      const isEncryptedFile = filePath.endsWith('.enc');
      const allowDecryption = isEncryptedFile && shareInfo.allowDecryption;
      
      // If it's an encrypted file with decryption option enabled, show the decryption page
      if (allowDecryption) {
        // If the user hasn't provided a password parameter, show the decryption form
        if (!req.query.password) {
          // Get filename for display
          const filename = path.basename(filePath).replace('.enc', '');
          
          return res.send(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Decrypt File</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f8f9fa;
                  }
                  .container {
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    padding: 30px;
                    margin-top: 40px;
                  }
                  h1 {
                    color: #2c3e50;
                    margin-top: 0;
                  }
                  .form-group {
                    margin-bottom: 20px;
                  }
                  label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: bold;
                  }
                  input[type="password"] {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 16px;
                  }
                  button {
                    background-color: #3498db;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 4px;
                    font-size: 16px;
                    cursor: pointer;
                  }
                  button:hover {
                    background-color: #2980b9;
                  }
                  .file-info {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                  }
                  .error {
                    color: #e74c3c;
                    background-color: #fdf1f0;
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                    border-left: 4px solid #e74c3c;
                  }
                  .note {
                    font-size: 14px;
                    color: #7f8c8d;
                    margin-top: 20px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>Decrypt Shared File</h1>
                  
                  <div class="file-info">
                    <strong>File:</strong> ${filename}
                  </div>
                  
                  ${req.query.error ? `<div class="error">${req.query.error}</div>` : ''}
                  
                  <form action="/share/${token}" method="GET">
                    <input type="hidden" name="key" value="${key}">
                    
                    <div class="form-group">
                      <label for="password">Enter Decryption Password:</label>
                      <input type="password" id="password" name="password" required>
                    </div>
                    
                    <button type="submit">Decrypt and Download</button>
                  </form>
                  
                  <div class="note">
                    <p>This encrypted file requires a password to decrypt. Enter the password to download the decrypted file.</p>
                    <p>If you don't have the password, please contact the person who shared this file.</p>
                  </div>
                </div>
              </body>
            </html>
          `);
        }
        
        // If we have a password parameter and decryption is allowed, try to decrypt
        const password = req.query.password;
        const decryptionPassword = shareInfo.decryptionPassword || password;
        
        if (!decryptionPassword) {
          return res.redirect(`/share/${token}?key=${key}&error=No password provided`);
        }
        
        // Create a temporary file for the decrypted content
        const tmpDir = path.join(app.getPath('temp'), 'secure-file-manager');
        fs.mkdirSync(tmpDir, { recursive: true });
        const decryptedFilePath = path.join(tmpDir, uuidv4());
        
        try {
          // Attempt to decrypt the file
          const decryptResult = await EncryptionUtils.decryptFile(filePath, decryptionPassword, decryptedFilePath);
          
          if (!decryptResult.success) {
            fs.unlinkSync(decryptedFilePath);
            return res.redirect(`/share/${token}?key=${key}&error=Invalid password or corrupted file`);
          }
          
          // Mark link as used only after successful decryption
          const linkIndex = db.data.sharedLinks.findIndex(link => link.id === token);
          db.data.sharedLinks[linkIndex].isUsed = true;
          await db.write();
          
          // Log access
          await logAccess('access_shared_file', filePath, { token, remote: true, decrypted: true });
          
          // Serve the decrypted file instead
          const filename = decryptResult.decryptedFilename || path.basename(decryptedFilePath);
          const mimetype = getMimeType(filename);
          
          // Properly format the Content-disposition header to ensure browser uses the filename with extension
          res.setHeader('Content-disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
          res.setHeader('Content-type', mimetype);
          
          // Create read stream and pipe to response
          const fileStream = fs.createReadStream(decryptedFilePath);
          
          fileStream.on('error', (err) => {
            console.error(`Error streaming file: ${err.message}`);
            if (!res.headersSent) {
              res.status(500).send('Error streaming file');
            } else {
              res.end();
            }
          });
          
          fileStream.on('end', () => {
            // Delete the temporary decrypted file after serving
            try {
              fs.unlinkSync(decryptedFilePath);
            } catch (err) {
              console.error(`Error deleting temporary file: ${err.message}`);
            }
          });
          
          fileStream.pipe(res);
        } catch (error) {
          console.error('Error decrypting file:', error);
          
          // Cleanup in case of error
          try {
            if (fs.existsSync(decryptedFilePath)) {
              fs.unlinkSync(decryptedFilePath);
            }
          } catch (err) {
            console.error(`Error cleaning up: ${err.message}`);
          }
          
          return res.redirect(`/share/${token}?key=${key}&error=${encodeURIComponent(error.message || 'Error decrypting file')}`);
        }
        
        return;
      }
      
      // For non-decryptable files, continue with the original logic
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
      
      // Properly format the Content-disposition header to ensure browser uses the filename with extension
      res.setHeader('Content-disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
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
        'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:* ws://localhost:*; img-src 'self' data:; media-src 'self' data:; object-src 'self' data:;"]
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

// Read file binary (for images, PDFs, videos, audio)
ipcMain.handle('read-file-binary', async (event, filePath) => {
  try {
    // Make sure the file exists first
    if (!FileUtils.fileExists(filePath)) {
      return { success: false, error: 'File does not exist' };
    }
    
    // Read the file as binary data
    const buffer = fs.readFileSync(filePath);
    
    // Convert to base64 for sending through IPC
    const base64Content = buffer.toString('base64');
    
    // Log file access
    await logAccess('read_file', filePath, { binary: true });
    
    return { success: true, content: base64Content };
  } catch (error) {
    console.error(`Error reading binary file ${filePath}:`, error);
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

// New handler for content search
ipcMain.handle('search-file-content', async (event, { directoryPath, searchText, options }) => {
  try {
    if (!directoryPath || !searchText) {
      return { success: false, error: 'Directory path and search text are required' };
    }

    const results = FileUtils.searchFileContent(directoryPath, searchText, options);
    
    // Log search activity
    await logAccess('search_content', directoryPath, { 
      searchText, 
      resultsCount: results.length 
    });
    
    return { success: true, results };
  } catch (error) {
    console.error(`Error searching file content:`, error);
    return { success: false, error: error.message };
  }
});

// New handlers for file encryption/decryption

// Encrypt a file with password
ipcMain.handle('encrypt-file', async (event, { filePath, password, outputPath }) => {
  try {
    if (!filePath || !password) {
      return { success: false, error: 'File path and password are required' };
    }

    // Check if file exists
    if (!FileUtils.fileExists(filePath)) {
      return { success: false, error: 'File does not exist' };
    }

    // Perform encryption
    const result = await EncryptionUtils.encryptFile(filePath, password, outputPath);
    
    // Log encryption activity
    if (result.success) {
      await logAccess('encrypt_file', filePath, { 
        outputPath: result.outputPath 
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error encrypting file:', error);
    return { success: false, error: error.message };
  }
});

// Decrypt a file with password
ipcMain.handle('decrypt-file', async (event, { filePath, password, outputPath }) => {
  try {
    if (!filePath || !password) {
      return { success: false, error: 'File path and password are required' };
    }

    // Check if file exists
    if (!FileUtils.fileExists(filePath)) {
      return { success: false, error: 'File does not exist' };
    }

    // Perform decryption
    const result = await EncryptionUtils.decryptFile(filePath, password, outputPath);
    
    // Log decryption activity
    if (result.success) {
      await logAccess('decrypt_file', filePath, { 
        outputPath: result.outputPath 
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error decrypting file:', error);
    return { success: false, error: error.message };
  }
});

// New handler to get all encrypted files
ipcMain.handle('list-encrypted-files', async () => {
  try {
    // Define common directories to search
    const userDirectories = [
      app.getPath('documents'),
      app.getPath('downloads'),
      app.getPath('desktop')
    ];
    
    // Add any previously accessed directories from logs
    await db.read();
    const accessedDirs = new Set();
    db.data.accessLogs.forEach(log => {
      if (log.action === 'encrypt_file' || log.action === 'decrypt_file') {
        const dirPath = path.dirname(log.path);
        accessedDirs.add(dirPath);
      }
    });
    
    // Combine all directories, removing duplicates
    const dirsToSearch = [...new Set([...userDirectories, ...accessedDirs])];
    
    // Find all encrypted files
    const encryptedFiles = [];
    
    for (const dirPath of dirsToSearch) {
      try {
        // Skip if directory doesn't exist
        if (!fs.existsSync(dirPath)) continue;
        
        const items = FileUtils.readDirectory(dirPath);
        
        // Filter and add encrypted files
        items.filter(item => !item.isDirectory && item.name.endsWith('.enc'))
          .forEach(file => {
            encryptedFiles.push({
              name: file.name,
              path: file.path,
              size: file.size,
              mtime: file.mtime
            });
          });
          
        // Check one level of subdirectories for more encrypted files
        items.filter(item => item.isDirectory).forEach(dir => {
          try {
            const subItems = FileUtils.readDirectory(dir.path);
            subItems.filter(item => !item.isDirectory && item.name.endsWith('.enc'))
              .forEach(file => {
                encryptedFiles.push({
                  name: file.name,
                  path: file.path,
                  size: file.size,
                  mtime: file.mtime
                });
              });
          } catch (err) {
            // Ignore errors for subdirectories we can't access
          }
        });
      } catch (err) {
        console.warn(`Could not scan directory ${dirPath}: ${err.message}`);
      }
    }
    
    // Sort by date modified (newest first)
    encryptedFiles.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
    
    return { success: true, files: encryptedFiles };
  } catch (error) {
    console.error(`Error listing encrypted files:`, error);
    return { success: false, error: error.message };
  }
});

// Get details about an encrypted file
ipcMain.handle('get-encrypted-file-details', async (event, filePath) => {
  try {
    if (!filePath || !filePath.endsWith('.enc')) {
      return { success: false, error: 'Invalid encrypted file path' };
    }
    
    // Check if file exists
    if (!FileUtils.fileExists(filePath)) {
      return { success: false, error: 'File does not exist' };
    }
    
    // Get basic file info
    const stats = FileUtils.getFileStats(filePath);
    if (!stats) {
      return { success: false, error: 'Could not access file stats' };
    }
    
    // Try to get original filename from encryption metadata
    let originalFileName = '';
    let originalExtension = '';
    
    try {
      // Read the metadata from the encrypted file
      const fileHandle = fs.openSync(filePath, 'r');
      // Skip IV (16 bytes)
      // Read metadata length (4 bytes)
      const metadataLengthBuffer = Buffer.alloc(4);
      fs.readSync(fileHandle, metadataLengthBuffer, 0, 4, 16);
      const metadataLength = metadataLengthBuffer.readUInt32LE(0);
      
      // Read the metadata if it exists
      if (metadataLength > 0 && metadataLength < 1024) {
        const metadataBuffer = Buffer.alloc(metadataLength);
        fs.readSync(fileHandle, metadataBuffer, 0, metadataLength, 20);
        try {
          const metadata = JSON.parse(metadataBuffer.toString());
          originalExtension = metadata.originalExtension || '';
        } catch (err) {
          console.warn('Failed to parse metadata');
        }
      }
      fs.closeSync(fileHandle);
      
      // Try to determine original file name
      const encFileName = path.basename(filePath);
      if (encFileName.endsWith('.enc')) {
        originalFileName = encFileName.slice(0, -4);
        if (originalExtension) {
          originalFileName += originalExtension;
        }
      }
    } catch (err) {
      console.warn('Could not read file metadata:', err);
    }
    
    // Find any previous share records for this file
    await db.read();
    const shareRecords = db.data.sharedLinks.filter(link => 
      link.filePath === filePath
    );
    
    // Get access logs for this file
    const accessLogs = db.data.accessLogs.filter(log => 
      log.path === filePath
    );
    
    return { 
      success: true, 
      details: {
        name: path.basename(filePath),
        path: filePath,
        size: stats.size,
        mtime: stats.mtime,
        originalFileName,
        originalExtension,
        shareRecords: shareRecords.length,
        accessLogs: accessLogs.length
      }
    };
  } catch (error) {
    console.error(`Error getting encrypted file details:`, error);
    return { success: false, error: error.message };
  }
});

// Share encrypted file with option for automatic decryption
ipcMain.handle('share-encrypted-file-with-decryption', async (event, { filePath, password, allowDecryption }) => {
  try {
    if (!filePath || !filePath.endsWith('.enc')) {
      return { success: false, error: 'Invalid encrypted file path' };
    }
    
    // Check if file exists
    if (!FileUtils.fileExists(filePath)) {
      return { success: false, error: 'File does not exist' };
    }
    
    // Create a unique token for this share
    const token = uuidv4();
    const encryptionKey = crypto.randomBytes(32).toString('hex');
    
    // Store share information, including whether decryption is allowed and the password (if provided)
    db.data.sharedLinks.push({
      id: token,
      filePath,
      createdAt: new Date().toISOString(),
      encryptionKey,
      isUsed: false,
      allowDecryption: allowDecryption === true,
      decryptionPassword: allowDecryption && password ? password : null
    });
    
    await db.write();
    
    // Log the share
    await logAccess('share_file', filePath, { token, encryptedFile: true, allowDecryption });
    
    // Return share link with network address
    const shareUrl = `${serverAddress}/share/${token}?key=${encryptionKey}`;
    
    return { 
      success: true, 
      shareLink: shareUrl,
      encryptionKey,
      token
    };
  } catch (error) {
    console.error(`Error sharing encrypted file:`, error);
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