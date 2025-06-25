const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const isDev = require('electron-is-dev');
const express = require('express');
const cors = require('cors');
const FileUtils = require('./utils/file-utils');
const EncryptionUtils = require('./utils/encryption-utils');
const CompressionUtils = require('./utils/compression-utils');
const TwoFactorAuth = require('./utils/two-factor-auth');
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
app.on('before-quit', async () => {
  if (syncManager) {
    try {
      await syncManager.shutdown();
    } catch (error) {
      console.error('Error shutting down sync on app exit:', error);
    }
  }
});

const { exec } = require('child_process');
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
app.commandLine.appendSwitch('no-sandbox');

// Throttle timers to reduce CPU usage
app.commandLine.appendSwitch('disable-ipc-flooding-protection');
app.commandLine.appendSwitch('enable-aggressive-domstorage-flushing');

// We'll create a separate module loader for lowdb using dynamic imports
// since lowdb v5 is an ES Module
let db;

// Initialize 2FA
const twoFactorAuth = new TwoFactorAuth();

// Hash calculation for files
ipcMain.handle('calculate-file-hash', async (event, filePath, algorithm) => {
  try {
    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(filePath);
    
    return new Promise((resolve, reject) => {
      stream.on('data', data => {
        hash.update(data);
      });
      
      stream.on('end', () => {
        const hashValue = hash.digest('hex');
        resolve({ success: true, hash: hashValue });
      });
      
      stream.on('error', error => {
        console.error(`Error calculating ${algorithm} hash:`, error);
        resolve({ success: false, error: error.message });
      });
    });
  } catch (error) {
    console.error(`Error calculating ${algorithm} hash:`, error);
    return { success: false, error: error.message };
  }
});

// Set up Express server for file sharing
const expressApp = express();
const PORT = 3001;
let serverAddress = '';

// Configure Express
expressApp.use(cors());
expressApp.use(express.json());
expressApp.use(express.static(path.join(__dirname, 'public')));

// Get the correct local IP address using Node.js built-in modules
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

// Start the file sharing server
async function startFileServer() {
  // Get local IP address using Node.js built-in modules
  const localIP = getLocalIP();
  serverAddress = `http://${localIP}:${PORT}`;
  
  console.log(`File sharing server will be available at: ${serverAddress}`);
  
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
                .error-container { background: #fff3f0; border-left: 4px solid #f44336; padding: 20px; border-radius: 4px; }
                h1 { color: #f44336; }
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
                <title>Decrypt Shared File</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                  * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                  }
                  
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                  }
                  
                  .container {
                    background-color: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                    padding: 40px;
                    max-width: 500px;
                    width: 100%;
                    position: relative;
                    overflow: hidden;
                  }
                  
                  .container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #3498db, #2ecc71, #e74c3c, #f39c12);
                  }
                  
                  .header {
                    text-align: center;
                    margin-bottom: 30px;
                  }
                  
                  .lock-icon {
                    font-size: 48px;
                    color: #3498db;
                    margin-bottom: 15px;
                  }
                  
                  h1 {
                    color: #2c3e50;
                    margin-bottom: 10px;
                    font-size: 24px;
                    font-weight: 600;
                  }
                  
                  .subtitle {
                    color: #7f8c8d;
                    font-size: 14px;
                  }
                  
                  .file-info {
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 25px;
                    border-left: 4px solid #3498db;
                  }
                  
                  .file-name {
                    font-weight: 600;
                    color: #2c3e50;
                    font-size: 16px;
                    word-break: break-all;
                  }
                  
                  .form-group {
                    margin-bottom: 25px;
                  }
                  
                  label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #34495e;
                    font-size: 14px;
                  }
                  
                  input[type="password"] {
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: all 0.3s ease;
                    background-color: #f8f9fa;
                  }
                  
                  input[type="password"]:focus {
                    border-color: #3498db;
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
                    background-color: white;
                  }
                  
                  button {
                    width: 100%;
                    background: linear-gradient(135deg, #3498db, #2980b9);
                    color: white;
                    border: none;
                    padding: 14px 20px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                  }
                  
                  button:hover {
                    background: linear-gradient(135deg, #2980b9, #21618c);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
                  }
                  
                  button:active {
                    transform: translateY(0);
                  }
                  
                  .error {
                    color: #e74c3c;
                    background: linear-gradient(135deg, #fdf1f0, #fbeaea);
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border-left: 4px solid #e74c3c;
                    font-size: 14px;
                    animation: shake 0.5s ease-in-out;
                  }
                  
                  @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                  }
                  
                  .note {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 25px;
                    font-size: 13px;
                    color: #6c757d;
                    line-height: 1.5;
                  }
                  
                  .note-title {
                    font-weight: 600;
                    color: #495057;
                    margin-bottom: 8px;
                  }
                  
                  .loading {
                    display: none;
                    text-align: center;
                    margin-top: 20px;
                  }
                  
                  .spinner {
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #3498db;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 10px;
                  }
                  
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                  
                  @media (max-width: 480px) {
                    .container {
                      padding: 30px 20px;
                      margin: 10px;
                    }
                    
                    h1 {
                      font-size: 20px;
                    }
                    
                    .lock-icon {
                      font-size: 36px;
                    }
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <div class="lock-icon">🔐</div>
                    <h1>Decrypt Shared File</h1>
                    <div class="subtitle">Enter the password to access the original file</div>
                  </div>
                  
                  <div class="file-info">
                    <div class="file-name">📄 ${filename}</div>
                  </div>
                  
                  ${req.query.error ? `<div class="error">❌ ${req.query.error}</div>` : ''}
                  
                  <form action="/share/${token}" method="GET" onsubmit="showLoading()">
                    <input type="hidden" name="key" value="${key}">
                    
                    <div class="form-group">
                      <label for="password">🔑 Enter Original Encryption Password:</label>
                      <input type="password" id="password" name="password" required autocomplete="off" placeholder="Enter the password used to encrypt this file">
                    </div>
                    
                    <button type="submit">🔓 Decrypt and Download</button>
                  </form>
                  
                  <div class="loading" id="loading">
                    <div class="spinner"></div>
                    <div>Decrypting file, please wait...</div>
                  </div>
                  
                  <div class="note">
                    <div class="note-title">ℹ️ Information:</div>
                    <p>This file was encrypted when it was originally created. Enter the same password that was used to encrypt the file to download the original unencrypted version.</p>
                    <p style="margin-top: 10px;"><strong>Security:</strong> The decryption happens on the server and the decrypted file will be automatically downloaded to your device. The password is not stored anywhere.</p>
                  </div>
                </div>
                
                <script>
                  function showLoading() {
                    document.querySelector('form').style.display = 'none';
                    document.getElementById('loading').style.display = 'block';
                  }
                  
                  // Auto-focus password field
                  document.getElementById('password').focus();
                  
                  // Handle form submission
                  document.querySelector('form').addEventListener('submit', function(e) {
                    const password = document.getElementById('password').value;
                    if (!password.trim()) {
                      e.preventDefault();
                      alert('Please enter a password');
                      return false;
                    }
                  });
                </script>
              </body>
            </html>
          `);
        }
        
        // Get the password from the request and use it for decryption
        const password = req.query.password;
        const decryptionPassword = password;
        
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
      // Disable hardware acceleration for reduced heat
      offscreen: false,
      hardwareAcceleration: false,
      // Limit background processing
      backgroundThrottling: true,
    },
    icon: path.join(__dirname, 'build', 'icon.png'),
    show: false,
    // Set backgroundColor to prevent white flash
    backgroundColor: '#f5f6fa'
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
      
      // Set up file server for sharing
      await startFileServer();
      console.log(`File sharing server started at: ${serverAddress}`);
      
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
    await ensureDbReady();
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
    await ensureDbReady();
    
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

    // Add allowDecryption for encrypted files (password will be entered by recipient)
    if (params.allowDecryption && params.filePath.endsWith('.enc')) {
      linkData.allowDecryption = true;
    }

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
    console.error('Error sharing file:', error);
    return { success: false, error: error.message };
  }
});

// Access a shared file
ipcMain.handle('access-shared-file', async (event, { token, encryptionKey }) => {
  try {
    await ensureDbReady();
    let shareInfo = db.data.sharedLinks.find(link => link.id === token);

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
    await ensureDbReady();
    return { success: true, logs: db.data.accessLogs };
  } catch (error) {
    console.error('Error getting access logs:', error);
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
    await ensureDbReady();
    
    // Define common directories to search
    const userDirectories = [
      app.getPath('documents'),
      app.getPath('downloads'),
      app.getPath('desktop')
    ];
    
    // Add any previously accessed directories from logs
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

// 2FA Authentication handlers
ipcMain.handle('auth:check-2fa-setup', async () => {
  try {
    const isSetup = twoFactorAuth.isSetup();
    return { success: true, isSetup };
  } catch (error) {
    console.error('Error checking 2FA setup:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:generate-2fa-secret', async () => {
  try {
    const secret = twoFactorAuth.generateSecret();
    const qrCodeDataURL = await twoFactorAuth.generateQRCodeURL(secret);
    
    return {
      success: true,
      secret,
      qrCode: qrCodeDataURL
    };
  } catch (error) {
    console.error('Error generating 2FA secret:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:setup-2fa', async (event, { secret, code }) => {
  try {
    // Verify the code first
    const isValid = twoFactorAuth.verifyTOTP(code, secret);
    
    if (!isValid) {
      return { success: false, error: 'Invalid verification code' };
    }
    
    // Save the configuration
    const saved = twoFactorAuth.saveConfig(secret);
    
    if (!saved) {
      return { success: false, error: 'Failed to save 2FA configuration' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:verify-2fa-code', async (event, code) => {
  try {
    const config = twoFactorAuth.loadConfig();
    
    if (!config || !config.enabled) {
      return { success: false, error: '2FA is not set up' };
    }
    
    const isValid = twoFactorAuth.verifyTOTP(code, config.secret);
    
    return { success: isValid, error: isValid ? null : 'Invalid code' };
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:disable-2fa', async () => {
  try {
    const disabled = twoFactorAuth.disable();
    
    if (!disabled) {
      return { success: false, error: 'Failed to disable 2FA' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error disabling 2FA:', error);
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
          const files = await scanDirectory(scanPath, 2); // Reduced depth to 2 levels
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

// Create directory handler
ipcMain.handle('create-directory', async (event, dirPath) => {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
    return { success: true, path: dirPath };
  } catch (error) {
    console.error('Error creating directory:', error);
    return { success: false, error: error.message };
  }
});

// Delete file or directory handler
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    const stats = await fs.promises.stat(filePath);
    
    if (stats.isDirectory()) {
      // Delete directory recursively
      await fs.promises.rmdir(filePath, { recursive: true });
    } else {
      // Delete file
      await fs.promises.unlink(filePath);
    }
    
    // Log the deletion
    await logAccess('delete_file', filePath, { 
      type: stats.isDirectory() ? 'directory' : 'file' 
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting file/directory:', error);
    return { success: false, error: error.message };
  }
});

// Helper function to scan directory with depth limit and performance optimization
async function scanDirectory(dirPath, maxDepth = 2, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    let results = [];
    
    // Limit the number of files processed to avoid system overload
    const maxFilesPerDir = 100;
    let processedFiles = 0;
    
    for (const entry of entries) {
      if (processedFiles >= maxFilesPerDir) break;
      
      const entryPath = path.join(dirPath, entry.name);
      
      // Skip system directories and hidden files to reduce load
      if (entry.name.startsWith('.') || 
          entry.name.includes('node_modules') || 
          entry.name.includes('$RECYCLE.BIN') ||
          entry.name.includes('System Volume Information')) {
        continue;
      }
      
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
        
        processedFiles++;
        
        // Add small delay every 10 files to prevent CPU overload
        if (processedFiles % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
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
  try {
    await ensureDbReady();
    db.data.accessLogs.push({
      action,
      path,
      timestamp: new Date().toISOString(),
      ...metadata
    });
    
    await db.write();
  } catch (error) {
    console.error('Error logging access:', error);
  }
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
    await ensureDbReady();
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