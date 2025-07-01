// IPC Handlers for Encryption/Decryption
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');
const FileUtils = require('./utils/file-utils');
const EncryptionUtils = require('./utils/encryption-utils');

function registerCryptoHandlers(ipcMain, logAccess, ensureDbReady, securityMiddleware) {
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

  // Encrypt a file with password
  ipcMain.handle('encrypt-file', async (event, { filePath, password, outputPath }) => {
    try {
      if (!filePath || !password) {
        return { success: false, error: 'File path and password are required' };
      }

      // Validate password strength
      const passwordValidation = EncryptionUtils.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: 'Password is not strong enough',
          details: passwordValidation.issues
        };
      }

      // Validate file path for security
      if (!EncryptionUtils.validateFilePath(filePath)) {
        securityMiddleware.logSecurityEvent('path_traversal_attempt', {
          filePath,
          action: 'encrypt'
        });
        return { success: false, error: 'Invalid file path' };
      }

      // Check if file exists
      if (!FileUtils.fileExists(filePath)) {
        return { success: false, error: 'File does not exist' };
      }

      // Check file size (prevent encryption of extremely large files)
      const stats = FileUtils.getFileStats(filePath);
      if (stats && stats.size > 1024 * 1024 * 1024) { // 1GB limit
        return { success: false, error: 'File is too large to encrypt (max 1GB)' };
      }

      // Rate limiting for encryption operations
      const clientId = 'local_encryption';
      const rateLimitResult = securityMiddleware.checkRateLimit(clientId, 'encryption');
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: 'Too many encryption attempts. Please wait and try again.'
        };
      }

      // Perform encryption with enhanced security
      const result = await EncryptionUtils.encryptFile(filePath, password, outputPath);

      // Log encryption activity
      if (result.success) {
        await logAccess('encrypt_file', filePath, {
          outputPath: result.outputPath,
          fileSize: stats?.size || 0
        });

        // Clear password from memory (if possible)
        if (typeof password === 'string') {
          password = null;
        }
      }

      return result;
    } catch (error) {
      console.error('Error encrypting file:', error);
      securityMiddleware.logSecurityEvent('encryption_error', {
        filePath: filePath?.substring(0, 100),
        error: error.message
      });
      return { success: false, error: error.message };
    }
  });

  // Decrypt a file with password
  ipcMain.handle('decrypt-file', async (event, { filePath, password, outputPath }) => {
    try {
      if (!filePath || !password) {
        return { success: false, error: 'File path and password are required' };
      }

      // Validate file path for security
      if (!EncryptionUtils.validateFilePath(filePath)) {
        securityMiddleware.logSecurityEvent('path_traversal_attempt', {
          filePath,
          action: 'decrypt'
        });
        return { success: false, error: 'Invalid file path' };
      }

      // Check if file exists and is encrypted
      if (!FileUtils.fileExists(filePath)) {
        return { success: false, error: 'File does not exist' };
      }

      if (!EncryptionUtils.isEncryptedFile(filePath)) {
        return { success: false, error: 'File does not appear to be encrypted' };
      }

      // Rate limiting for decryption operations (stricter than encryption)
      const clientId = 'local_decryption';
      const rateLimitResult = securityMiddleware.checkRateLimit(clientId, 'encryption'); // Using 'encryption' limit type for both
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: 'Too many decryption attempts. Please wait and try again.'
        };
      }

      // Perform decryption with enhanced security
      const result = await EncryptionUtils.decryptFile(filePath, password, outputPath);

      // Log decryption activity
      if (result.success) {
        await logAccess('decrypt_file', filePath, {
          outputPath: result.outputPath,
          legacy: result.legacy || false,
          formatVersion: EncryptionUtils.getFileFormatVersion(filePath)
        });

        // Clear password from memory
        if (typeof password === 'string') {
          password = null;
        }
      } else {
        // Log failed decryption attempts (potential brute force)
        securityMiddleware.detectSuspiciousActivity(clientId, 'failed_auth', {
          action: 'decrypt',
          filePath: filePath.substring(0, 100)
        });
      }

      return result;
    } catch (error) {
      console.error('Error decrypting file:', error);
      securityMiddleware.logSecurityEvent('decryption_error', {
        filePath: filePath?.substring(0, 100),
        error: error.message
      });
      return { success: false, error: error.message };
    }
  });

  // New handler to get all encrypted files
  ipcMain.handle('list-encrypted-files', async () => {
    try {
      await ensureDbReady();
      const db = ipcMain.db; // Access db instance if passed this way

      // Define common directories to search
      const userDirectories = [
        app.getPath('documents'),
        app.getPath('downloads'),
        app.getPath('desktop')
      ];

      // Add any previously accessed directories from logs
      const accessedDirs = new Set();
      if (db && db.data && db.data.accessLogs) {
        db.data.accessLogs.forEach(log => {
          if (log.action === 'encrypt_file' || log.action === 'decrypt_file') {
            const dirPath = path.dirname(log.path);
            accessedDirs.add(dirPath);
          }
        });
      }


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
      await ensureDbReady();
      const db = ipcMain.db; // Access db instance
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
}

module.exports = { registerCryptoHandlers };
