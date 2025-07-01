// IPC Handlers for 2FA

function registerAuthHandlers(ipcMain, twoFactorAuth, securityMiddleware) {
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

      // Rate limiting for 2FA attempts
      const clientId = 'local_2fa';
      const rateLimitResult = securityMiddleware.checkRateLimit(clientId, 'authentication');
      if (!rateLimitResult.allowed) {
        securityMiddleware.logSecurityEvent('2fa_rate_limit_exceeded', {
          clientId,
          attempts: rateLimitResult.attempts
        });
        return {
          success: false,
          error: 'Too many authentication attempts. Please wait and try again.',
          waitTime: rateLimitResult.resetTime
        };
      }

      // Validate code format
      if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
        securityMiddleware.detectSuspiciousActivity(clientId, 'invalid_request', {
          reason: 'invalid_2fa_code_format'
        });
        return { success: false, error: 'Invalid code format' };
      }

      const isValid = twoFactorAuth.verifyTOTP(code, config.secret);

      if (!isValid) {
        securityMiddleware.detectSuspiciousActivity(clientId, 'failed_auth', {
          reason: 'invalid_2fa_code'
        });
        securityMiddleware.logSecurityEvent('2fa_failed_attempt', {
          clientId,
          timestamp: Date.now()
        });
      } else {
        securityMiddleware.logSecurityEvent('2fa_success', {
          clientId,
          timestamp: Date.now()
        });
      }

      return { success: isValid, error: isValid ? null : 'Invalid code' };
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      securityMiddleware.logSecurityEvent('2fa_error', {
        error: error.message
      });
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
}

module.exports = { registerAuthHandlers };
