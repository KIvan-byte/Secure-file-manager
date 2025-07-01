const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Secure storage utility for sensitive data
 * Implements secure memory management and encrypted storage
 */
class SecureStorage {
  constructor() {
    this.configDir = path.join(os.homedir(), '.secure-file-manager');
    this.keyFile = path.join(this.configDir, 'storage.key');
    this.dataFile = path.join(this.configDir, 'secure.dat');
    this.sessionKey = null;
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    this.sessionTimer = null;
    this.memoryPool = new Map(); // Secure memory pool
    
    this.ensureConfigDir();
  }
  
  /**
   * Ensure configuration directory exists with proper permissions
   */
  ensureConfigDir() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { mode: 0o700, recursive: true });
    }
    
    // Set restrictive permissions on config directory
    try {
      fs.chmodSync(this.configDir, 0o700);
    } catch (error) {
      console.warn('Failed to set directory permissions:', error.message);
    }
  }
  
  /**
   * Generate or load encryption key for secure storage
   * @returns {Buffer} - Encryption key
   */
  getOrCreateStorageKey() {
    if (fs.existsSync(this.keyFile)) {
      try {
        const keyData = fs.readFileSync(this.keyFile);
        return keyData;
      } catch (error) {
        console.error('Failed to read storage key:', error);
      }
    }
    
    // Generate new key
    const key = crypto.randomBytes(32);
    try {
      fs.writeFileSync(this.keyFile, key, { mode: 0o600 });
      return key;
    } catch (error) {
      console.error('Failed to save storage key:', error);
      throw new Error('Cannot initialize secure storage');
    }
  }
  
  /**
   * Create secure memory buffer
   * @param {number} size - Buffer size
   * @returns {Buffer} - Secure buffer
   */
  createSecureBuffer(size) {
    const buffer = Buffer.alloc(size);
    const id = crypto.randomBytes(16).toString('hex');
    this.memoryPool.set(id, buffer);
    
    // Auto-cleanup after 5 minutes
    setTimeout(() => {
      this.clearSecureBuffer(id);
    }, 5 * 60 * 1000);
    
    return { buffer, id };
  }
  
  /**
   * Clear secure memory buffer
   * @param {string} id - Buffer ID
   */
  clearSecureBuffer(id) {
    const buffer = this.memoryPool.get(id);
    if (buffer) {
      buffer.fill(0);
      this.memoryPool.delete(id);
    }
  }
  
  /**
   * Clear all secure memory buffers
   */
  clearAllSecureBuffers() {
    for (const [id, buffer] of this.memoryPool) {
      buffer.fill(0);
    }
    this.memoryPool.clear();
  }
  
  /**
   * Initialize secure session
   * @param {string} masterPassword - Master password
   * @returns {boolean} - Success status
   */
  async initializeSession(masterPassword) {
    try {
      if (!masterPassword || masterPassword.length < 8) {
        throw new Error('Master password must be at least 8 characters');
      }
      
      // Get or create storage key for file encryption
      const storageKey = this.getOrCreateStorageKey();
      
      // Derive session key from master password using a fixed salt
      // This ensures the same password always generates the same session key
      const salt = Buffer.from('secure-file-manager-salt-v1', 'utf8');
      const sessionKey = await new Promise((resolve, reject) => {
        crypto.pbkdf2(masterPassword, salt, 100000, 32, 'sha256', (err, key) => {
          if (err) reject(err);
          else resolve(key);
        });
      });
      
      // If there's existing data, verify the password is correct
      if (fs.existsSync(this.dataFile)) {
        const encryptedData = fs.readFileSync(this.dataFile);
        if (encryptedData.length > 0) {
          // Temporarily set session key to test decryption
          this.sessionKey = sessionKey;
          try {
            // Try to decrypt existing data to validate password
            const decryptedData = this.decryptData(encryptedData);
            JSON.parse(decryptedData); // Ensure it's valid JSON
            
            // Password is correct, start session timer
            this.startSessionTimer();
            return true;
          } catch (decryptError) {
            // Password is wrong, clear session
            this.sessionKey = null;
            console.warn('Password verification failed:', decryptError.message);
            return false;
          }
        }
      }
      
      // No existing data or empty file, accept any valid password
      this.sessionKey = sessionKey;
      this.startSessionTimer();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize session:', error);
      return false;
    }
  }
  
  /**
   * Start session timeout timer
   */
  startSessionTimer() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }
    
    this.sessionTimer = setTimeout(() => {
      this.clearSession();
    }, this.sessionTimeout);
  }
  
  /**
   * Clear secure session
   */
  clearSession() {
    if (this.sessionKey) {
      this.sessionKey.fill(0);
      this.sessionKey = null;
    }
    
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    
    // Clear all secure buffers
    this.clearAllSecureBuffers();
  }
  
  /**
   * Check if session is active
   * @returns {boolean} - True if session is active
   */
  isSessionActive() {
    return this.sessionKey !== null;
  }
  
  /**
   * Refresh session timeout
   */
  refreshSession() {
    if (this.isSessionActive()) {
      this.startSessionTimer();
    }
  }
  
  /**
   * Encrypt data for storage
   * @param {string|Buffer} data - Data to encrypt
   * @returns {Buffer} - Encrypted data
   */
  encryptData(data) {
    if (!this.isSessionActive()) {
      throw new Error('Session not active');
    }
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.sessionKey, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine IV and encrypted data
    const result = Buffer.concat([iv, Buffer.from(encrypted, 'hex')]);
    return result;
  }
  
  /**
   * Decrypt data from storage
   * @param {Buffer} encryptedData - Encrypted data
   * @returns {string} - Decrypted data
   */
  decryptData(encryptedData) {
    if (!this.isSessionActive()) {
      throw new Error('Session not active');
    }
    
    const iv = encryptedData.slice(0, 16);
    const encrypted = encryptedData.slice(16);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.sessionKey, iv);
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  /**
   * Store sensitive data securely
   * @param {string} key - Storage key
   * @param {string} value - Value to store
   * @returns {boolean} - Success status
   */
  async storeSecureData(key, value) {
    try {
      if (!this.isSessionActive()) {
        throw new Error('Session not active');
      }
      
      // Load existing data
      let data = {};
      if (fs.existsSync(this.dataFile)) {
        const encryptedData = fs.readFileSync(this.dataFile);
        if (encryptedData.length > 0) {
          try {
            const decryptedData = this.decryptData(encryptedData);
            data = JSON.parse(decryptedData);
          } catch (error) {
            console.warn('Failed to decrypt existing data, starting fresh');
          }
        }
      }
      
      // Update data
      data[key] = {
        value,
        timestamp: Date.now()
      };
      
      // Encrypt and save
      const encryptedData = this.encryptData(JSON.stringify(data));
      fs.writeFileSync(this.dataFile, encryptedData, { mode: 0o600 });
      
      this.refreshSession();
      return true;
    } catch (error) {
      console.error('Failed to store secure data:', error);
      return false;
    }
  }
  
  /**
   * Retrieve sensitive data securely
   * @param {string} key - Storage key
   * @returns {string|null} - Retrieved value or null
   */
  async retrieveSecureData(key) {
    try {
      if (!this.isSessionActive()) {
        console.warn('SecureStorage session not active');
        return null;
      }
      
      if (!fs.existsSync(this.dataFile)) {
        return null;
      }
      
      const encryptedData = fs.readFileSync(this.dataFile);
      if (encryptedData.length === 0) {
        return null;
      }
      
      try {
        const decryptedData = this.decryptData(encryptedData);
        const data = JSON.parse(decryptedData);
        
        this.refreshSession();
        
        if (data[key]) {
          return data[key].value;
        }
        
        return null;
      } catch (decryptError) {
        // If decryption fails, the data was encrypted with a different key
        // This is normal when password changes or on first run
        console.warn('Failed to decrypt existing data - may be from different password:', decryptError.message);
        return null;
      }
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      return null;
    }
  }
  
  /**
   * Remove sensitive data
   * @param {string} key - Storage key
   * @returns {boolean} - Success status
   */
  async removeSecureData(key) {
    try {
      if (!this.isSessionActive()) {
        throw new Error('Session not active');
      }
      
      if (!fs.existsSync(this.dataFile)) {
        return true;
      }
      
      const encryptedData = fs.readFileSync(this.dataFile);
      if (encryptedData.length === 0) {
        return true;
      }
      
      const decryptedData = this.decryptData(encryptedData);
      const data = JSON.parse(decryptedData);
      
      delete data[key];
      
      // Save updated data
      const newEncryptedData = this.encryptData(JSON.stringify(data));
      fs.writeFileSync(this.dataFile, newEncryptedData, { mode: 0o600 });
      
      this.refreshSession();
      return true;
    } catch (error) {
      console.error('Failed to remove secure data:', error);
      return false;
    }
  }
  
  /**
   * Clear all stored data
   * @returns {boolean} - Success status
   */
  async clearAllData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        fs.unlinkSync(this.dataFile);
      }
      
      this.clearSession();
      return true;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return false;
    }
  }
  
  /**
   * Get storage statistics
   * @returns {Object} - Storage statistics
   */
  getStorageStats() {
    const stats = {
      hasKeyFile: fs.existsSync(this.keyFile),
      hasDataFile: fs.existsSync(this.dataFile),
      dataFileSize: 0,
      sessionActive: this.isSessionActive(),
      memoryBuffers: this.memoryPool.size
    };
    
    if (stats.hasDataFile) {
      try {
        const fileStats = fs.statSync(this.dataFile);
        stats.dataFileSize = fileStats.size;
      } catch (error) {
        // Ignore errors
      }
    }
    
    return stats;
  }
  
  /**
   * Cleanup on exit
   */
  cleanup() {
    this.clearSession();
    this.clearAllSecureBuffers();
  }
}

module.exports = SecureStorage;
