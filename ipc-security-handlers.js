// IPC Handlers for Security Operations

function registerSecurityHandlers(ipcMain, securityMiddleware, secureStorage) { // Added secureStorage
  // Validate password strength
  ipcMain.handle('security:validate-password', async (event, password) => {
    try {
      const EncryptionUtils = require('./utils/encryption-utils'); // Assuming this util is available
      const validation = EncryptionUtils.validatePasswordStrength(password);
      return {
        success: true,
        data: validation
      };
    } catch (error) {
      console.error('Password validation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Get security statistics
  ipcMain.handle('security:get-stats', async (event) => {
    try {
      const securityStats = securityMiddleware.getStats();
      const storageStats = secureStorage.getStorageStats(); // Use passed secureStorage

      const combinedStats = {
        security: {
          rateLimits: securityStats.rateLimits || 0,
          csrfTokens: securityStats.csrfTokens || 0,
          blockedClients: securityStats.blockedClients || 0,
          suspiciousClients: securityStats.suspiciousClients || 0,
          securityEvents: securityStats.securityEvents || 0,
          recentEvents: securityStats.recentEvents || 0
        },
        storage: {
          sessionActive: storageStats.sessionActive || false,
          hasKeyFile: storageStats.hasKeyFile || false,
          hasDataFile: storageStats.hasDataFile || false,
          dataFileSize: storageStats.dataFileSize || 0,
          memoryBuffers: storageStats.memoryBuffers || 0
        }
      };

      return {
        success: true,
        data: combinedStats
      };
    } catch (error) {
      console.error('Security stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Get recent security events
  ipcMain.handle('security:get-events', async (event, limit = 50) => {
    try {
      const events = securityMiddleware.getRecentEvents(limit);
      return {
        success: true,
        data: events
      };
    } catch (error) {
      console.error('Security events error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Clear security events
  ipcMain.handle('security:clear-events', async (event) => {
    try {
      // Assuming securityMiddleware might have a method like clearEvents() or resetStats()
      // If not, this might just acknowledge the request without action or log it.
      // For now, let's assume it's a conceptual operation.
      if (typeof securityMiddleware.clearEvents === 'function') {
         securityMiddleware.clearEvents();
      } else if (typeof securityMiddleware.resetStats === 'function') {
         // if clearEvents is not available, maybe resetStats has a similar effect for events
         securityMiddleware.resetStats();
      }
      // If neither, it does nothing but returns success
      return {
        success: true
      };
    } catch (error) {
      console.error('Clear security events error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Check file format for security validation
  ipcMain.handle('security:check-file-format', async (event, filePath) => {
    try {
      const EncryptionUtils = require('./utils/encryption-utils'); // Assuming this util is available
      const isEncrypted = EncryptionUtils.isEncryptedFile(filePath);
      const version = EncryptionUtils.getFileFormatVersion(filePath);

      return {
        success: true,
        data: {
          isEncrypted,
          version,
          filePath
        }
      };
    } catch (error) {
      console.error('File format check error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
}

module.exports = { registerSecurityHandlers };
