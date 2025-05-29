const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');

/**
 * Two-Factor Authentication utility using TOTP (Time-based One-Time Password)
 * Compatible with Google Authenticator and other TOTP apps
 */
class TwoFactorAuth {
  constructor() {
    this.configPath = path.join(os.homedir(), '.secure-file-manager', '2fa-config.json');
    this.ensureConfigDir();
  }

  /**
   * Ensure the configuration directory exists
   */
  ensureConfigDir() {
    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  /**
   * Generate a random secret for TOTP
   * @returns {string} Base32 encoded secret
   */
  generateSecret() {
    const buffer = crypto.randomBytes(20);
    return this.base32Encode(buffer);
  }

  /**
   * Generate QR code data URL for Google Authenticator
   * @param {string} secret - Base32 encoded secret
   * @param {string} accountName - Account name for the user
   * @param {string} issuer - Issuer name (app name)
   * @returns {Promise<string>} QR code data URL
   */
  async generateQRCodeURL(secret, accountName = 'Secure File Manager', issuer = 'SecureFileManager') {
    const encodedAccountName = encodeURIComponent(accountName);
    const encodedIssuer = encodeURIComponent(issuer);
    const otpauthURL = `otpauth://totp/${encodedIssuer}:${encodedAccountName}?secret=${secret}&issuer=${encodedIssuer}`;
    
    try {
      const qrCodeDataURL = await QRCode.toDataURL(otpauthURL, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  /**
   * Generate TOTP code
   * @param {string} secret - Base32 encoded secret
   * @param {number} timeStep - Time step in seconds (default: 30)
   * @param {number} digits - Number of digits (default: 6)
   * @returns {string} TOTP code
   */
  generateTOTP(secret, timeStep = 30, digits = 6) {
    const time = Math.floor(Date.now() / 1000 / timeStep);
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeUInt32BE(0, 0);
    timeBuffer.writeUInt32BE(time, 4);

    const secretBuffer = this.base32Decode(secret);
    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(timeBuffer);
    const digest = hmac.digest();

    const offset = digest[digest.length - 1] & 0x0f;
    const code = ((digest[offset] & 0x7f) << 24) |
                 ((digest[offset + 1] & 0xff) << 16) |
                 ((digest[offset + 2] & 0xff) << 8) |
                 (digest[offset + 3] & 0xff);

    return (code % Math.pow(10, digits)).toString().padStart(digits, '0');
  }

  /**
   * Verify TOTP code
   * @param {string} token - User provided token
   * @param {string} secret - Base32 encoded secret
   * @param {number} window - Time window for verification (default: 1)
   * @returns {boolean} True if token is valid
   */
  verifyTOTP(token, secret, window = 1) {
    const timeStep = 30;
    const currentTime = Math.floor(Date.now() / 1000 / timeStep);

    // Check current time and adjacent time steps within window
    for (let i = -window; i <= window; i++) {
      const testTime = currentTime + i;
      const timeBuffer = Buffer.alloc(8);
      timeBuffer.writeUInt32BE(0, 0);
      timeBuffer.writeUInt32BE(testTime, 4);

      const secretBuffer = this.base32Decode(secret);
      const hmac = crypto.createHmac('sha1', secretBuffer);
      hmac.update(timeBuffer);
      const digest = hmac.digest();

      const offset = digest[digest.length - 1] & 0x0f;
      const code = ((digest[offset] & 0x7f) << 24) |
                   ((digest[offset + 1] & 0xff) << 16) |
                   ((digest[offset + 2] & 0xff) << 8) |
                   (digest[offset + 3] & 0xff);

      const expectedToken = (code % 1000000).toString().padStart(6, '0');

      if (token === expectedToken) {
        return true;
      }
    }

    return false;
  }

  /**
   * Save 2FA configuration
   * @param {string} secret - Base32 encoded secret
   * @returns {boolean} True if saved successfully
   */
  saveConfig(secret) {
    try {
      const config = {
        enabled: true,
        secret: secret,
        setupDate: new Date().toISOString()
      };

      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving 2FA config:', error);
      return false;
    }
  }

  /**
   * Load 2FA configuration
   * @returns {Object|null} Configuration object or null
   */
  loadConfig() {
    try {
      if (!fs.existsSync(this.configPath)) {
        return null;
      }

      const configData = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('Error loading 2FA config:', error);
      return null;
    }
  }

  /**
   * Check if 2FA is set up
   * @returns {boolean} True if 2FA is configured and enabled
   */
  isSetup() {
    const config = this.loadConfig();
    return config && config.enabled && config.secret;
  }

  /**
   * Disable 2FA
   * @returns {boolean} True if disabled successfully
   */
  disable() {
    try {
      if (fs.existsSync(this.configPath)) {
        fs.unlinkSync(this.configPath);
      }
      return true;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return false;
    }
  }

  /**
   * Base32 encode
   * @param {Buffer} buffer - Buffer to encode
   * @returns {string} Base32 encoded string
   */
  base32Encode(buffer) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }

  /**
   * Base32 decode
   * @param {string} str - Base32 encoded string
   * @returns {Buffer} Decoded buffer
   */
  base32Decode(str) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    const output = [];

    for (let i = 0; i < str.length; i++) {
      const index = alphabet.indexOf(str[i].toUpperCase());
      if (index === -1) {
        throw new Error('Invalid base32 character');
      }

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(output);
  }
}

module.exports = TwoFactorAuth;