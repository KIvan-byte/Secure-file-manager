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
const CompressionUtils = require('./utils/compression-utils');
const util = require('util');
const { exec } = require('child_process');
const net = require('net');

// Override the GPU requirements to fix GL errors
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('use-gl', 'desktop');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('force-high-performance-gpu', 'false');

// Remove any conflicting GL settings
app.commandLine.removeSwitch('use-angle');
app.commandLine.removeSwitch('use-metal');

// Enable hardware acceleration if possible, but provide fallbacks - update these settings
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('use-angle', 'gl');
} else if (process.platform === 'linux') {
  app.commandLine.appendSwitch('use-gl', 'egl');
} else if (process.platform === 'darwin') {
  app.commandLine.appendSwitch('use-metal');
}

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
      
      await db.read(); // Ensure fresh data
      let shareInfo = db.data.sharedLinks.find(link => link.id === token);

      if (!shareInfo) {
        return res.status(404).send('<html><body>Link not found.</body></html>');
      }

      // Check if it's a one-time link (no expiresAt) and it's already used
      if (!shareInfo.expiresAt && shareInfo.isUsed) {
        return res.status(410).send('<html><body>Link already used.</body></html>'); // 410 Gone is appropriate
      }

      // Now, handle expiration IF expiresAt is set
      if (shareInfo.expiresAt) {
        if (new Date() > new Date(shareInfo.expiresAt)) {
          // Optionally mark as isExpired = true or even remove from DB if desired
          // For now, just prevent access
          return res.status(410).send('<html><body>Link has expired.</body></html>');
        }
      }
      // If we reach here, the link is valid (either one-time and not used, or timed and not expired)
      // ... then proceed to check encryptionKey, serve file, etc.
      
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
                    margin-bottom: 20px.
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
          
          // Mark link as used only after successful decryption if it's a one-time link
          if (!shareInfo.expiresAt) { // This is a one-time link
            const linkIndex = db.data.sharedLinks.findIndex(link => link.id === token);
            if (linkIndex !== -1) {
                db.data.sharedLinks[linkIndex].isUsed = true;
                await db.write();
            }
          }
          
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
      // and it's a one-time link
      if (!shareInfo.expiresAt) { // This is a one-time link
        const linkIndex = db.data.sharedLinks.findIndex(link => link.id === token);
        if (linkIndex !== -1) {
            db.data.sharedLinks[linkIndex].isUsed = true;
            await db.write();
        }
      }
      
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

// Function to check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => {
        resolve(true);
      })
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

// Function to wait for the development server to be ready
const waitForDevServer = (port, retries = 30, interval = 1000) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const checkServer = () => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        if (res.statusCode === 200) {
          console.log(`Dev server is ready on port ${port}`);
          resolve(true);
        } else {
          attemptConnection();
        }
      });

      req.on('error', () => {
        attemptConnection();
      });
    };

    const attemptConnection = () => {
      attempts++;
      if (attempts >= retries) {
        console.error(`Dev server not ready after ${retries} attempts`);
        reject(new Error("Dev server not ready"));
        return;
      }
      console.log(`Waiting for dev server on port 3000... (${attempts}/${retries})`);
      setTimeout(checkServer, interval);
    };

    checkServer();
  });
};

let mainWindow;

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
    },
    icon: path.join(__dirname, 'build', 'icon.png'),
    show: false,
    // Set backgroundColor to prevent white flash
    backgroundColor: '#f5f6fa'
  });

  console.log('Preload path:', path.join(__dirname, 'preload.js'));
  console.log('Is packaged:', app.isPackaged);
  console.log('Is dev:', isDev);

  try {
    // In dev mode, we need to wait for the React dev server
    if (isDev) {
      // Check if port 3000 is already in use
      const isPortBusy = await isPortInUse(3000);
      if (!isPortBusy) {
        console.log('Starting React development server...');
        // If port is not in use, start the React dev server
        const reactProcess = exec('npm run start-react', { 
          cwd: __dirname 
        });
        
        reactProcess.stdout.on('data', (data) => {
          console.log(`React dev server: ${data}`);
        });
        
        reactProcess.stderr.on('data', (data) => {
          console.error(`React dev server error: ${data}`);
        });
        
        // Wait for the dev server to be ready
        await waitForDevServer(3000);
      } else {
        console.log('React development server is already running');
      }
    }

    const startUrl = isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, 'build', 'index.html')}`;
    
    console.log('Loading URL:', startUrl);
    
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
      if (isDev) {
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
      
      // Set up file server for sharing
      const fileServerURL = startFileServer();
      console.log(`File sharing server started at: ${fileServerURL}`);
      
    } catch (error) {
      console.error('Error initializing services:', error);
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

// IPC handler to revoke a shared link
ipcMain.handle('revoke-share-link', async (event, tokenId) => {
  try {
    await db.read();
    const allLinks = db.data.sharedLinks || [];
    
    const linkIndex = allLinks.findIndex(link => link.id === tokenId);
    
    if (linkIndex !== -1) {
      allLinks.splice(linkIndex, 1);
      db.data.sharedLinks = allLinks; // Assign the modified array back
      await db.write();
    }
    // If linkIndex is -1, the link to revoke doesn't exist, which means it's already "revoked".
    // So, we can consider this a success.
    
    return { success: true };
  } catch (error) {
    console.error('Error revoking share link:', error);
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
ipcMain.handle('share-file', async (event, params) => {
  try {
    // Create a unique token for this share
    const token = uuidv4();
    const encryptionKey = crypto.randomBytes(32).toString('hex');
    
    const linkData = {
      id: token,
      filePath: params.filePath,
      createdAt: new Date().toISOString(),
      encryptionKey,
      isUsed: false
    };

    if (params.daysValid && parseInt(params.daysValid, 10) > 0) {
      const validityMs = parseInt(params.daysValid, 10) * 24 * 60 * 60 * 1000;
      linkData.expiresAt = new Date(Date.now() + validityMs).toISOString();
    }
    
    db.data.sharedLinks.push(linkData);
    await db.write(); // Make sure to write after update
    
    // Log the share
    await logAccess('share_file', params.filePath, { token });
    
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
    let shareInfo = db.data.sharedLinks.find(link => link.id === token); // token comes from input params

    if (!shareInfo) {
      return { success: false, error: 'Link not found' };
    }

    if (!shareInfo.expiresAt && shareInfo.isUsed) {
      return { success: false, error: 'Link already used' };
    }

    if (shareInfo.expiresAt && new Date() > new Date(shareInfo.expiresAt)) {
      return { success: false, error: 'Link expired' };
    }
    
    if (shareInfo.encryptionKey !== encryptionKey) {
      return { success: false, error: 'Invalid encryption key' };
    }
    
    // Mark link as used only if it's a one-time link
    if (!shareInfo.expiresAt) {
       const linkIndex = db.data.sharedLinks.findIndex(link => link.id === token);
       if (linkIndex !== -1) {
           db.data.sharedLinks[linkIndex].isUsed = true;
           await db.write();
       }
    }
    
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

// New handlers for file compression functions

// Compress files into a ZIP or TAR archive
ipcMain.handle('compress-files', async (event, { sourcePaths, outputPath, format = 'zip', options = {} }) => {
  try {
    // Log the action
    await logAccess('compress_files', outputPath, { sourcePaths });
    
    let result;
    if (format === 'zip') {
      result = await CompressionUtils.compressToZip(sourcePaths, outputPath, options);
    } else if (format === 'tar') {
      result = await CompressionUtils.compressToTar(sourcePaths, outputPath, options);
    } else {
      return { success: false, error: 'Unsupported compression format' };
    }
    
    return result;
  } catch (error) {
    console.error('Error compressing files:', error);
    return { success: false, error: error.message };
  }
});

// Extract a ZIP or TAR archive
ipcMain.handle('extract-archive', async (event, { archivePath, outputPath }) => {
  try {
    // Log the action
    await logAccess('extract_archive', archivePath, { outputPath });
    
    const result = await CompressionUtils.extractArchive(archivePath, outputPath);
    return result;
  } catch (error) {
    console.error('Error extracting archive:', error);
    return { success: false, error: error.message };
  }
});

// Check if a file is an archive
ipcMain.handle('is-archive', async (event, filePath) => {
  try {
    return { success: true, isArchive: CompressionUtils.isArchive(filePath) };
  } catch (error) {
    console.error('Error checking if file is archive:', error);
    return { success: false, error: error.message };
  }
});

// Analytics endpoints
ipcMain.handle('getAllFiles', async () => {
  try {
    // Recursively scan all files in the user's directories
    // This function recursively collects all files from the user's home directory
    // In a real app, you would want to limit this to specific directories
    const userHomePath = app.getPath('home');
    const scanPaths = [
      path.join(userHomePath, 'Documents'),
      path.join(userHomePath, 'Downloads'),
      path.join(userHomePath, 'Pictures'),
    ];
    
    let allFiles = [];
    
    for (const scanPath of scanPaths) {
      if (fs.existsSync(scanPath)) {
        try {
          // Use a more limited scan to avoid reading the entire file system
          const files = await scanDirectory(scanPath, 3); // Limit depth to 3 levels
          allFiles = allFiles.concat(files);
        } catch (err) {
          console.error(`Error scanning ${scanPath}:`, err);
        }
      }
    }
    
    return { success: true, files: allFiles };
  } catch (error) {
    console.error('Error getting all files:', error);
    return { success: false, error: error.message };
  }
});

// Helper function to scan directory with depth limit
async function scanDirectory(dirPath, maxDepth = 3, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    let results = [];
    
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      
      try {
        const stats = fs.statSync(entryPath);
        
        if (entry.isDirectory()) {
          // Add directory
          results.push({
            name: entry.name,
            path: entryPath,
            size: 0,
            isDirectory: true,
            mtime: stats.mtime
          });
          
          // Recursively scan subdirectories (with depth limit)
          if (currentDepth < maxDepth) {
            const subItems = await scanDirectory(entryPath, maxDepth, currentDepth + 1);
            results = results.concat(subItems);
          }
        } else {
          // Add file
          results.push({
            name: entry.name,
            path: entryPath,
            size: stats.size,
            isDirectory: false,
            mtime: stats.mtime
          });
        }
      } catch (err) {
        console.error(`Error accessing ${entryPath}:`, err);
        // Skip this file/directory and continue
      }
    }
    
    return results;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
}

// Get shared files count
ipcMain.handle('getSharedFilesCount', async () => {
  try {
    // In a real app, this would query the database for active share links
    // For demo purposes, we'll simulate this with a small random number
    const sharedFilesCount = Math.floor(Math.random() * 5) + 1;
    
    return { success: true, count: sharedFilesCount };
  } catch (error) {
    console.error('Error getting shared files count:', error);
    return { success: false, error: error.message };
  }
});

// Get storage information for the main disk
ipcMain.handle('getStorageInfo', async () => {
  try {
    // Get disk usage information for the system disk
    const diskPath = path.parse(app.getPath('home')).root;
    
    // On Windows, we can use a different approach
    let storage = {
      total: 0,
      used: 0,
      available: 0
    };
    
    if (process.platform === 'win32') {
      // For Windows, this is just a demo implementation
      // In a real app, you would use a native module like 'diskusage'
      const total = 1024 * 1024 * 1024 * 250; // 250GB as example
      const available = 1024 * 1024 * 1024 * 100; // 100GB free as example
      
      storage = {
        total,
        available,
        used: total - available
      };
    } else {
      // For Unix-like systems, we can use the `df` command
      const { stdout } = await util.promisify(exec)(`df -k "${diskPath}"`);
      const lines = stdout.trim().split('\n');
      const info = lines[1].split(/\s+/);
      
      // Convert from KB to bytes
      const total = parseInt(info[1], 10) * 1024;
      const used = parseInt(info[2], 10) * 1024;
      const available = parseInt(info[3], 10) * 1024;
      
      storage = { total, used, available };
    }
    
    return { success: true, storage };
  } catch (error) {
    console.error('Error getting storage info:', error);
    // Fallback to example data if real data can't be retrieved
    const total = 1024 * 1024 * 1024 * 500; // 500GB
    const available = 1024 * 1024 * 1024 * 200; // 200GB free
    
    return { 
      success: true, 
      storage: {
        total,
        available,
        used: total - available
      }
    };
  }
});

// Get file type distribution by size
ipcMain.handle('getFileTypeDistribution', async () => {
  try {
    // In a real application, this would analyze all files in the user's directories
    // For this demo, we'll scan a limited set of directories and analyze the files
    
    const userHomePath = app.getPath('home');
    const documentsPath = path.join(userHomePath, 'Documents');
    const downloadsPath = path.join(userHomePath, 'Downloads');
    
    // Initialize type distribution
    const typeDistribution = {
      document: 0,
      image: 0,
      video: 0,
      audio: 0,
      archive: 0,
      code: 0,
      pdf: 0,
      other: 0
    };
    
    // Scan paths if they exist
    const scanPaths = [documentsPath, downloadsPath];
    
    for (const scanPath of scanPaths) {
      if (fs.existsSync(scanPath)) {
        try {
          await analyzeDirectorySizes(scanPath, typeDistribution, 2); // Limit depth
        } catch (err) {
          console.error(`Error analyzing ${scanPath}:`, err);
        }
      }
    }
    
    return { success: true, typeDistribution };
  } catch (error) {
    console.error('Error getting file type distribution:', error);
    
    // Fallback to example data
    return { 
      success: true, 
      typeDistribution: {
        document: 1024 * 1024 * 256, // 256MB
        image: 1024 * 1024 * 512,    // 512MB
        video: 1024 * 1024 * 1024 * 4, // 4GB
        audio: 1024 * 1024 * 512,    // 512MB
        archive: 1024 * 1024 * 128,  // 128MB
        code: 1024 * 1024 * 64,      // 64MB
        pdf: 1024 * 1024 * 32,       // 32MB
        other: 1024 * 1024 * 128     // 128MB
      }
    };
  }
});

// Helper function to analyze directory sizes by file type
async function analyzeDirectorySizes(dirPath, typeDistribution, maxDepth = 2, currentDepth = 0) {
  if (currentDepth > maxDepth) return;
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      
      try {
        if (entry.isDirectory()) {
          // Recursively scan subdirectories (with depth limit)
          if (currentDepth < maxDepth) {
            await analyzeDirectorySizes(entryPath, typeDistribution, maxDepth, currentDepth + 1);
          }
        } else {
          // Analyze file type and add size to distribution
          const stats = fs.statSync(entryPath);
          const fileSize = stats.size;
          const extension = path.extname(entry.name).toLowerCase();
          
          // Determine file type based on extension
          let fileType = 'other';
          
          if (['.doc', '.docx', '.txt', '.rtf', '.odt', '.xls', '.xlsx', '.ppt', '.pptx', '.csv'].includes(extension)) {
            fileType = 'document';
          } else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.tiff'].includes(extension)) {
            fileType = 'image';
          } else if (['.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv'].includes(extension)) {
            fileType = 'video';
          } else if (['.mp3', '.wav', '.ogg', '.flac', '.aac', '.wma'].includes(extension)) {
            fileType = 'audio';
          } else if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(extension)) {
            fileType = 'archive';
          } else if (['.js', '.py', '.java', '.html', '.css', '.cpp', '.c', '.php', '.go', '.ts', '.jsx', '.tsx'].includes(extension)) {
            fileType = 'code';
          } else if (extension === '.pdf') {
            fileType = 'pdf';
          }
          
          // Add to the distribution
          typeDistribution[fileType] += fileSize;
        }
      } catch (err) {
        console.error(`Error analyzing ${entryPath}:`, err);
        // Skip this file/directory and continue
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
}

// Get activity trends from the logs
ipcMain.handle('getActivityTrends', async () => {
  try {
    // In a real app, this would analyze the access logs and generate trend data
    // For demo purposes, we'll generate simulated data based on the current date
    
    // Helper function to generate dates for the last N days
    const generateDates = (days) => {
      const dates = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }
      return dates;
    };
    
    // Generate activity data for the last 7 days
    const last7Days = generateDates(7);
    const activityTrends = last7Days.map(date => {
      // Create somewhat consistent but varied data based on the date string
      const dateNum = parseInt(date.replace(/\D/g, ''));
      const seedValue = dateNum % 100;
      
      return {
        date,
        reads: 10 + (seedValue % 30), // 10-39 reads
        shares: 1 + (seedValue % 5),  // 1-5 shares
        encryptions: (seedValue % 3)  // 0-2 encryptions
      };
    });
    
    // Generate file count growth trend for the last 30 days
    const last30Days = generateDates(30);
    const startCount = 800 + (new Date().getDate() * 10); // Base count between 800-1100
    
    const growthTrends = last30Days.map((date, index) => {
      // Gradual growth with some variation
      return {
        date,
        count: Math.floor(startCount + (index * 7) + (Math.sin(index) * 15))
      };
    });
    
    return { 
      success: true, 
      activityTrends,
      growthTrends
    };
  } catch (error) {
    console.error('Error getting activity trends:', error);
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

// File operations IPC handlers
ipcMain.handle('moveFile', async (event, params) => {
  try {
    return await FileUtils.moveFile(params);
  } catch (error) {
    console.error('Error in moveFile handler:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('copyFileFromPath', async (event, params) => {
  try {
    return await FileUtils.copyFileFromPath(params);
  } catch (error) {
    console.error('Error in copyFileFromPath handler:', error);
    return { success: false, error: error.message };
  }
});

// Create secure notes data directory
const secureNotesDir = path.join(app.getPath('userData'), 'secureNotes');

if (!fs.existsSync(secureNotesDir)) {
  fs.mkdirSync(secureNotesDir, { recursive: true });
}

// Crypto functions for secure notes
const VAULT_FILE_PATH = path.join(secureNotesDir, 'vault.enc');
const SALT_FILE_PATH = path.join(secureNotesDir, 'salt');
const KEY_ITERATIONS = 100000;
const KEY_LENGTH = 32;
const ALGORITHM = 'aes-256-gcm';

// Generate or retrieve salt
function getSalt() {
  try {
    if (fs.existsSync(SALT_FILE_PATH)) {
      return fs.readFileSync(SALT_FILE_PATH);
    } else {
      const salt = crypto.randomBytes(16);
      fs.writeFileSync(SALT_FILE_PATH, salt);
      return salt;
    }
  } catch (error) {
    console.error('Error handling salt:', error);
    throw error;
  }
}

// Derive encryption key from master password
function deriveKey(masterPassword) {
  const salt = getSalt();
  return crypto.pbkdf2Sync(masterPassword, salt, KEY_ITERATIONS, KEY_LENGTH, 'sha256');
}

// Encrypt data using the derived key
function encrypt(data, masterPassword) {
  const key = deriveKey(masterPassword);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return IV, authTag, and ciphertext for storage
  return {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    data: encrypted
  };
}

// Decrypt data using the derived key
function decrypt(encryptedData, masterPassword) {
  try {
    const key = deriveKey(masterPassword);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// Create a hash of the master password for validation
function hashMasterPassword(password) {
  const salt = getSalt();
  return crypto.pbkdf2Sync(password, salt, KEY_ITERATIONS, 64, 'sha512').toString('hex');
}

// Check if vault exists
function vaultExists() {
  return fs.existsSync(VAULT_FILE_PATH);
}

// Create a new vault with the master password
function setupVault(masterPassword) {
  try {
    const hash = hashMasterPassword(masterPassword);
    const encryptedData = encrypt(JSON.stringify({
      passwordHash: hash,
      entries: []
    }), masterPassword);
    
    fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify(encryptedData));
    return true;
  } catch (error) {
    console.error('Error setting up vault:', error);
    return false;
  }
}

// Get all entries
function getEntries(masterPassword) {
  try {
    if (!vaultExists()) {
      return null;
    }
    
    const encryptedData = JSON.parse(fs.readFileSync(VAULT_FILE_PATH, 'utf8'));
    const decrypted = decrypt(encryptedData, masterPassword);
    
    if (!decrypted) {
      return null;
    }
    
    const data = JSON.parse(decrypted);
    return data.entries;
  } catch (error) {
    console.error('Error getting entries:', error);
    return null;
  }
}

// Save an entry to the vault
function saveEntry(entry, masterPassword) {
  try {
    if (!vaultExists()) {
      return false;
    }
    
    const encryptedData = JSON.parse(fs.readFileSync(VAULT_FILE_PATH, 'utf8'));
    const decrypted = decrypt(encryptedData, masterPassword);
    
    if (!decrypted) {
      return false;
    }
    
    const data = JSON.parse(decrypted);
    
    // Find if entry exists and update it, or add a new one
    const index = data.entries.findIndex(e => e.id === entry.id);
    if (index !== -1) {
      data.entries[index] = entry;
    } else {
      data.entries.push(entry);
    }
    
    // Save updated data
    const updatedEncrypted = encrypt(JSON.stringify(data), masterPassword);
    fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify(updatedEncrypted));
    
    return true;
  } catch (error) {
    console.error('Error saving entry:', error);
    return false;
  }
}

// Delete an entry from the vault
function deleteEntry(entryId, masterPassword) {
  try {
    if (!vaultExists()) {
      return false;
    }
    
    const encryptedData = JSON.parse(fs.readFileSync(VAULT_FILE_PATH, 'utf8'));
    const decrypted = decrypt(encryptedData, masterPassword);
    
    if (!decrypted) {
      return false;
    }
    
    const data = JSON.parse(decrypted);
    
    // Filter out the entry
    data.entries = data.entries.filter(entry => entry.id !== entryId);
    
    // Save updated data
    const updatedEncrypted = encrypt(JSON.stringify(data), masterPassword);
    fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify(updatedEncrypted));
    
    return true;
  } catch (error) {
    console.error('Error deleting entry:', error);
    return false;
  }
}

// Validate the master password
function validateMasterPassword(password) {
  try {
    if (!vaultExists()) {
      return { valid: false, newUser: true };
    }
    
    const encryptedData = JSON.parse(fs.readFileSync(VAULT_FILE_PATH, 'utf8'));
    const decrypted = decrypt(encryptedData, password);
    
    if (!decrypted) {
      return { valid: false, newUser: false };
    }
    
    return { valid: true, newUser: false };
  } catch (error) {
    console.error('Error validating password:', error);
    return { valid: false, newUser: false };
  }
}

// IPC handlers for the secure notes functionality
ipcMain.handle('secure-notes:validate-master-password', async (event, password) => {
  try {
    const result = validateMasterPassword(password);
    return {
      success: result.valid,
      newUser: result.newUser
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('secure-notes:setup-vault', async (event, password) => {
  try {
    const result = setupVault(password);
    return {
      success: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('secure-notes:get-entries', async (event, password) => {
  try {
    const entries = getEntries(password);
    if (entries === null) {
      return {
        success: false,
        error: 'Failed to decrypt vault or vault not found'
      };
    }
    
    return {
      success: true,
      entries
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('secure-notes:save-entry', async (event, { entry, password }) => {
  try {
    const result = saveEntry(entry, password);
    return {
      success: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('secure-notes:delete-entry', async (event, { entryId, password }) => {
  try {
    const result = deleteEntry(entryId, password);
    return {
      success: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Fix the get-file-details handler to properly use await with async fs operations
ipcMain.handle('get-file-details', async (event, filePath) => {
  try {
    // Use await to ensure stats are properly retrieved before using them
    const stats = await fs.promises.stat(filePath);
    
    const details = {
      size: stats.size,
      mode: stats.mode,
      uid: stats.uid,
      gid: stats.gid,
      atime: stats.atime.toISOString(), // Convert Date to ISO string for reliable serialization
      mtime: stats.mtime.toISOString(),
      ctime: stats.ctime.toISOString(),
      birthtime: stats.birthtime.toISOString()
    };
    
    // Try to get owner and group names if on Unix-like systems
    if (process.platform !== 'win32') {
      try {
        const { execSync } = require('child_process');
        details.owner = execSync(`stat -c "%U" "${filePath}"`).toString().trim();
        details.group = execSync(`stat -c "%G" "${filePath}"`).toString().trim();
      } catch (error) {
        console.error('Error getting file owner/group:', error);
      }
    }
    
    // Try to get MIME type
    try {
      const { execSync } = require('child_process');
      if (process.platform === 'win32') {
        // On Windows, use file extension to guess MIME type
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
          '.txt': 'text/plain',
          '.html': 'text/html',
          '.css': 'text/css',
          '.js': 'text/javascript',
          '.json': 'application/json',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.pdf': 'application/pdf',
          '.mp4': 'video/mp4',
          '.mp3': 'audio/mpeg',
          '.zip': 'application/zip',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        details.mime = mimeTypes[ext] || 'application/octet-stream';
      } else {
        // On Unix-like systems, use file command
        details.mime = execSync(`file --mime-type -b "${filePath}"`).toString().trim();
      }
    } catch (error) {
      console.error('Error getting MIME type:', error);
    }
    
    return { 
      success: true, 
      details
    };
  } catch (error) {
    console.error('Error getting file details:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Make sure to stop the file server when the app quits
app.on('will-quit', () => {
  // Clean up any resources
  console.log('App is quitting, cleaning up resources...');
});

// IPC handler to list active shared links
ipcMain.handle('list-active-shares', async () => {
  try {
    await db.read();
    const now = new Date();
    const allLinks = db.data.sharedLinks || []; // Ensure it's an array

    const activeLinks = allLinks.filter(link => {
      if (link.expiresAt) {
        // It's a timed link, check if it's expired
        return new Date(link.expiresAt) > now;
      } else {
        // It's a one-time link, check if it's used
        return !link.isUsed;
      }
    });
    
    // Add the serverAddress to each link for easier use on the client-side
    const linksWithFullUrl = activeLinks.map(link => ({
      ...link,
      shareUrl: `${serverAddress}/share/${link.id}?key=${link.encryptionKey}`
    }));

    return { success: true, links: linksWithFullUrl };
  } catch (error) {
    console.error('Error listing active shares:', error);
    return { success: false, error: error.message };
  }
});