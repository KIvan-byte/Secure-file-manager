// IPC Handlers for File Sharing
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const cors = require('cors');
const FileUtils = require('./utils/file-utils');
const EncryptionUtils = require('./utils/encryption-utils');

// Helper function to determine MIME type based on file extension
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4',
    '.pdf': 'application/pdf', '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.zip': 'application/zip', '.rar': 'application/x-rar-compressed',
    '.tar': 'application/x-tar', '.gz': 'application/gzip'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}


function registerShareHandlers(ipcMain, appElectron, ensureDbReady, logAccess, securityMiddleware, getLocalIP) {
  let serverAddress = ''; // This will be set when the server starts
  let expressApp;
  let server;

  // Start the file sharing server
  async function startFileServer() {
    expressApp = express(); // Initialize expressApp here
    const PORT = 3001;

    // Configure Express with security middleware
    expressApp.use(cors({
      origin: function (origin, callback) {
        if (!origin || origin.startsWith('http://localhost:') || origin === 'file://') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true
    }));
    expressApp.use(express.json({ limit: '10mb' }));
    expressApp.use(express.urlencoded({ limit: '10mb', extended: true }));
    expressApp.use(securityMiddleware.middleware({
      rateLimit: 'fileShare', validatePath: true, requireOrigin: false
    }));
    expressApp.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      next();
    });
    expressApp.use(express.static(path.join(__dirname, 'public'))); // Assuming __dirname is correct context

    const localIP = getLocalIP();
    serverAddress = `http://${localIP}:${PORT}`;
    ipcMain.serverAddress = serverAddress; // Make it accessible

    console.log(`File sharing server will be available at: ${serverAddress}`);

    expressApp.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Secure File Manager</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333; }
              .container { background-color: #f5f6fa; border-radius: 5px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              h1 { color: #2c3e50; margin-top: 0; }
              .feature { margin-bottom: 15px; padding-left: 20px; border-left: 3px solid #3498db; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Secure File Manager - Sharing Server</h1>
              <p>This is the secure file sharing server for your Secure File Manager application. It is running at <strong>${serverAddress}</strong>.</p>
              <h2>How It Works</h2>
              <div class="feature"><p>When you share a file from the Secure File Manager, it creates a secure one-time download link.</p></div>
              <div class="feature"><p>Each link can only be used once and includes encryption to ensure secure access.</p></div>
              <div class="feature"><p>Recipients can download the file directly through their web browser without needing special software.</p></div>
              <h2>Security Information</h2>
              <p>This server is only accessible on your local network. For remote sharing, you would need to configure port forwarding or use a VPN.</p>
              <p style="margin-top: 30px; text-align: center;"><small>Secure File Manager © ${new Date().getFullYear()}</small></p>
            </div>
          </body>
        </html>
      `);
    });

    expressApp.get('/share/:token', securityMiddleware.middleware({
      rateLimit: 'fileAccess', validatePath: false, requireOrigin: false
    }), async (req, res) => {
      try {
        const { token } = req.params;
        const { key } = req.query;
        const clientId = securityMiddleware.getClientId(req);
        const db = ipcMain.db; // Access db instance

        console.log(`File access attempt - Token: ${token}, Client: ${clientId}`);

        if (!token || typeof token !== 'string' || token.length < 10) {
          securityMiddleware.detectSuspiciousActivity(clientId, 'invalid_request', { reason: 'invalid_token_format' });
          return res.status(400).send('Invalid token format');
        }
        if (!key || typeof key !== 'string') {
          securityMiddleware.detectSuspiciousActivity(clientId, 'invalid_request', { reason: 'missing_encryption_key' });
          return res.status(400).send('Missing encryption key');
        }

        await db.read();
        let shareInfo = db.data.sharedLinks.find(link => link.id === token);

        if (!shareInfo) {
          securityMiddleware.detectSuspiciousActivity(clientId, 'invalid_request', { reason: 'token_not_found', token: token.substring(0, 8) + '...' });
          return res.status(404).send('<html><body>Link not found.</body></html>');
        }
        if (!shareInfo.expiresAt && shareInfo.isUsed) {
          securityMiddleware.logSecurityEvent('share_link_reuse', { token: token.substring(0, 8) + '...', clientId });
          return res.status(410).send('<html><body>Link already used.</body></html>');
        }
        if (shareInfo.expiresAt && new Date() > new Date(shareInfo.expiresAt)) {
          return res.status(410).send('<html><body>Link has expired.</body></html>');
        }

        const providedKeyHash = crypto.createHash('sha256').update(key).digest('hex');
        const expectedKeyHash = crypto.createHash('sha256').update(shareInfo.encryptionKey).digest('hex');

        if (providedKeyHash !== expectedKeyHash) {
          securityMiddleware.detectSuspiciousActivity(clientId, 'failed_auth', { reason: 'invalid_encryption_key', token: token.substring(0, 8) + '...' });
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
          return res.status(401).send('Invalid encryption key');
        }

        const filePath = shareInfo.filePath;
        if (!securityMiddleware.validateFilePath(filePath)) {
          securityMiddleware.logSecurityEvent('path_traversal_attempt', { filePath: filePath?.substring(0, 100), clientId, action: 'file_share' });
          return res.status(400).send('Invalid file path');
        }

        console.log(`Serving file: ${filePath}`);
        if (!fs.existsSync(filePath)) {
          console.error(`File does not exist: ${filePath}`);
          return res.status(404).send(`<html>... File Not Found HTML ...</html>`); // Truncated for brevity
        }

        const isEncryptedFile = filePath.endsWith('.enc');
        const allowDecryption = isEncryptedFile && shareInfo.allowDecryption;

        if (allowDecryption) {
          if (!req.query.password) {
            const filename = path.basename(filePath).replace('.enc', '');
            return res.send(`... Decryption Form HTML ...`); // Truncated for brevity
          }

          const password = req.query.password;
          if (!password) {
            return res.redirect(`/share/${token}?key=${key}&error=No password provided`);
          }

          const tmpDir = path.join(appElectron.getPath('temp'), 'secure-file-manager');
          fs.mkdirSync(tmpDir, { recursive: true });
          const decryptedFilePath = path.join(tmpDir, uuidv4());

          try {
            const decryptResult = await EncryptionUtils.decryptFile(filePath, password, decryptedFilePath);
            if (!decryptResult.success) {
              fs.unlinkSync(decryptedFilePath);
              return res.redirect(`/share/${token}?key=${key}&error=Invalid password or corrupted file`);
            }

            if (!shareInfo.expiresAt) {
              const linkIndex = db.data.sharedLinks.findIndex(link => link.id === token);
              if (linkIndex !== -1) {
                db.data.sharedLinks[linkIndex].isUsed = true;
                await db.write();
              }
            }
            await logAccess('access_shared_file', filePath, { token, remote: true, decrypted: true });

            const filename = decryptResult.decryptedFilename || path.basename(decryptedFilePath);
            const mimetype = getMimeType(filename);
            res.setHeader('Content-disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
            res.setHeader('Content-type', mimetype);
            const fileStream = fs.createReadStream(decryptedFilePath);
            fileStream.on('error', (err) => {
              console.error(`Error streaming file: ${err.message}`);
              if (!res.headersSent) res.status(500).send('Error streaming file'); else res.end();
            });
            fileStream.on('end', () => { try { fs.unlinkSync(decryptedFilePath); } catch (err) { console.error(`Error deleting temporary file: ${err.message}`); } });
            fileStream.pipe(res);
          } catch (error) {
            console.error('Error decrypting file:', error);
            if (fs.existsSync(decryptedFilePath)) fs.unlinkSync(decryptedFilePath);
            return res.redirect(`/share/${token}?key=${key}&error=${encodeURIComponent(error.message || 'Error decrypting file')}`);
          }
          return;
        }

        if (!shareInfo.expiresAt) {
          const linkIndex = db.data.sharedLinks.findIndex(link => link.id === token);
          if (linkIndex !== -1) {
            db.data.sharedLinks[linkIndex].isUsed = true;
            await db.write();
          }
        }
        await logAccess('access_shared_file', filePath, { token, remote: true });

        const filename = path.basename(filePath);
        const mimetype = getMimeType(filename);
        res.setHeader('Content-disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Content-type', mimetype);
        try {
          const fileStream = fs.createReadStream(filePath);
          fileStream.on('error', (err) => {
            console.error(`Error streaming file: ${err.message}`);
            if (!res.headersSent) res.status(500).send('Error streaming file'); else res.end();
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

    server = expressApp.listen(PORT, () => { // Assign to server variable
      console.log(`File sharing server running at ${serverAddress}`);
    });
    server.on('error', (error) => {
      console.error('File sharing server error:', error);
    });
    return serverAddress;
  }

  // Call startFileServer when this module is loaded and initialized
  // The actual call will be done from main.js after db is initialized.

  // Share file with one-time link
  ipcMain.handle('share-file', async (event, params) => {
    try {
      await ensureDbReady();
      const db = ipcMain.db; // Access db instance

      const token = uuidv4();
      const encryptionKey = crypto.randomBytes(32).toString('hex');
      const linkData = {
        id: token,
        filePath: params.filePath,
        createdAt: new Date().toISOString(),
        encryptionKey,
        isUsed: false
      };

      if (params.allowDecryption && params.filePath.endsWith('.enc')) {
        linkData.allowDecryption = true;
      }
      if (params.daysValid && parseInt(params.daysValid, 10) > 0) {
        const validityMs = parseInt(params.daysValid, 10) * 24 * 60 * 60 * 1000;
        linkData.expiresAt = new Date(Date.now() + validityMs).toISOString();
      }

      db.data.sharedLinks.push(linkData);
      await db.write();
      await logAccess('share_file', params.filePath, { token });

      const currentServerAddress = ipcMain.serverAddress || serverAddress; // Use the most current address
      const shareUrl = `${currentServerAddress}/share/${token}?key=${encryptionKey}`;

      return { success: true, shareLink: shareUrl, encryptionKey };
    } catch (error) {
      console.error('Error sharing file:', error);
      return { success: false, error: error.message };
    }
  });

  // Access a shared file (local IPC access, not via HTTP)
  ipcMain.handle('access-shared-file', async (event, { token, encryptionKey }) => {
    try {
      await ensureDbReady();
      const db = ipcMain.db; // Access db instance
      let shareInfo = db.data.sharedLinks.find(link => link.id === token);

      if (!shareInfo) return { success: false, error: 'Link not found' };
      if (!shareInfo.expiresAt && shareInfo.isUsed) return { success: false, error: 'Link already used' };
      if (shareInfo.expiresAt && new Date() > new Date(shareInfo.expiresAt)) return { success: false, error: 'Link expired' };
      if (shareInfo.encryptionKey !== encryptionKey) return { success: false, error: 'Invalid encryption key' };

      if (!shareInfo.expiresAt) {
        const linkIndex = db.data.sharedLinks.findIndex(link => link.id === token);
        if (linkIndex !== -1) {
          db.data.sharedLinks[linkIndex].isUsed = true;
          await db.write();
        }
      }

      const filePath = shareInfo.filePath;
      if (!FileUtils.fileExists(filePath)) return { success: false, error: 'File no longer exists' };

      const fileContent = fs.readFileSync(filePath);
      await logAccess('access_shared_file', filePath, { token });

      return { success: true, fileName: path.basename(filePath), content: fileContent.toString('base64') };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // IPC handler to revoke a shared link
  ipcMain.handle('revoke-share-link', async (event, tokenId) => {
    try {
      await ensureDbReady();
      const db = ipcMain.db; // Access db instance
      const allLinks = db.data.sharedLinks || [];

      const linkIndex = allLinks.findIndex(link => link.id === tokenId);

      if (linkIndex !== -1) {
        allLinks.splice(linkIndex, 1);
        db.data.sharedLinks = allLinks;
        await db.write();
      }
      return { success: true };
    } catch (error) {
      console.error('Error revoking share link:', error);
      return { success: false, error: error.message };
    }
  });

  // IPC handler to list active shared links
  ipcMain.handle('list-active-shares', async () => {
    try {
      await ensureDbReady();
      const db = ipcMain.db; // Access db instance
      const now = new Date();
      const allLinks = db.data.sharedLinks || [];

      const activeLinks = allLinks.filter(link => {
        if (link.expiresAt) return new Date(link.expiresAt) > now;
        return !link.isUsed;
      });

      const currentServerAddress = ipcMain.serverAddress || serverAddress; // Use the most current address
      const linksWithFullUrl = activeLinks.map(link => ({
        ...link,
        shareUrl: `${currentServerAddress}/share/${link.id}?key=${link.encryptionKey}`
      }));

      return { success: true, links: linksWithFullUrl };
    } catch (error) {
      console.error('Error listing active shares:', error);
      return { success: false, error: error.message };
    }
  });

  // Function to stop the server, can be called from main.js on quit
  function stopFileServer() {
    return new Promise((resolve, reject) => {
      if (server) {
        server.close(err => {
          if (err) {
            console.error('Error stopping file server:', err);
            return reject(err);
          }
          console.log('File sharing server stopped.');
          server = null;
          expressApp = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  return { startFileServer, stopFileServer };
}

module.exports = { registerShareHandlers, getMimeType };
