const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Utilities for file encryption and decryption with enhanced security
 */
class EncryptionUtils {
  // Constants for security parameters
  static PBKDF2_ITERATIONS = 500000; // Increased from 100,000
  static SALT_LENGTH = 32; // 256 bits
  static IV_LENGTH = 16; // 128 bits for AES-CBC
  static KEY_LENGTH = 32; // 256 bits for AES-256
  static MAGIC_BYTES = Buffer.from('SFMENC01', 'ascii'); // File format identifier
  
  /**
   * Generate cryptographically secure random salt
   * @returns {Buffer} Random salt
   */
  static generateSalt() {
    return crypto.randomBytes(this.SALT_LENGTH);
  }
  
  /**
   * Generate cryptographically secure random IV
   * @returns {Buffer} Random IV
   */
  static generateIV() {
    return crypto.randomBytes(this.IV_LENGTH);
  }
  
  /**
   * Secure memory cleanup for sensitive data
   * @param {Buffer} buffer - Buffer to clear
   */
  static secureMemoryCleanup(buffer) {
    if (buffer && Buffer.isBuffer(buffer)) {
      buffer.fill(0);
    }
  }
  
  /**
   * Validate file path to prevent path traversal attacks
   * @param {string} filePath - Path to validate
   * @returns {boolean} True if path is safe
   */
  static validateFilePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      return false;
    }
    
    // Normalize the path
    const normalizedPath = path.normalize(filePath);
    
    // Check for path traversal attempts (but allow legitimate absolute paths)
    if (normalizedPath.includes('\0')) {
      return false;
    }
    
    // Check for actual directory traversal patterns
    if (normalizedPath.includes('/../') || 
        normalizedPath.endsWith('/..') ||
        normalizedPath.includes('..\\') || 
        normalizedPath.endsWith('\\..')) {
      return false;
    }
    
    // Additional security checks for dangerous patterns
    const dangerousPatterns = [
      /\0/g,           // Null bytes
      /\/\/+/g         // Multiple consecutive slashes
    ];
    
    // Only check Windows invalid characters on Windows
    if (process.platform === 'win32') {
      dangerousPatterns.push(/[<>:"|?*]/g);
    }
    
    return !dangerousPatterns.some(pattern => pattern.test(normalizedPath));
  }
  /**
   * Encrypt a file with a password using enhanced security
   * 
   * @param {string} inputPath - Path to the file to encrypt
   * @param {string} password - Password to encrypt the file with
   * @param {string} outputPath - Optional path for the encrypted file output
   * @returns {Promise<Object>} Result object with success status and paths
   */
  static async encryptFile(inputPath, password, outputPath = null) {
    let salt = null;
    let key = null;
    let iv = null;
    
    try {
      // Validate input parameters
      if (!this.validateFilePath(inputPath) || (outputPath && !this.validateFilePath(outputPath))) {
        throw new Error('Invalid file path detected - potential security risk');
      }
      
      if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      // Check if input file exists and is readable
      if (!fs.existsSync(inputPath)) {
        throw new Error('Input file does not exist');
      }
      
      const inputStats = fs.statSync(inputPath);
      if (!inputStats.isFile()) {
        throw new Error('Input path is not a file');
      }
      
      // Generate cryptographically secure random values
      salt = this.generateSalt();
      iv = this.generateIV();
      
      // Create output path if not provided
      if (!outputPath) {
        outputPath = `${inputPath}.enc`;
      }
      
      // Derive key from password using secure parameters
      key = await this._deriveKeySecure(password, salt);
      
      // Create cipher
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      
      // Setup file streams
      const inputStream = fs.createReadStream(inputPath);
      const outputStream = fs.createWriteStream(outputPath);
      
      // Prepare metadata
      const originalExtension = path.extname(inputPath);
      const fileName = path.basename(inputPath);
      const metadata = {
        originalExtension,
        fileName,
        timestamp: Date.now(),
        version: '2.0' // Enhanced security version
      };
      
      const metadataBuffer = Buffer.from(JSON.stringify(metadata), 'utf8');
      const metadataLengthBuffer = Buffer.alloc(4);
      metadataLengthBuffer.writeUInt32LE(metadataBuffer.length, 0);
      
      // Write file header: magic bytes + salt + IV + metadata length + metadata
      outputStream.write(this.MAGIC_BYTES);
      outputStream.write(salt);
      outputStream.write(iv);
      outputStream.write(metadataLengthBuffer);
      outputStream.write(metadataBuffer);
      
      return new Promise((resolve, reject) => {
        let hasErrored = false;
        
        const cleanup = () => {
          this.secureMemoryCleanup(key);
          this.secureMemoryCleanup(salt);
          this.secureMemoryCleanup(iv);
        };
        
        outputStream.on('finish', () => {
          if (!hasErrored) {
            cleanup();
            resolve({
              success: true,
              inputPath,
              outputPath,
              originalFilename: path.basename(inputPath),
              encryptedFilename: path.basename(outputPath),
              originalExtension,
              fileSize: inputStats.size
            });
          }
        });
        
        outputStream.on('error', (err) => {
          hasErrored = true;
          cleanup();
          // Try to remove partial output file
          try {
            fs.unlinkSync(outputPath);
          } catch (e) {
            // Ignore cleanup errors
          }
          reject({
            success: false,
            error: `Encryption failed: ${err.message}`
          });
        });
        
        inputStream.on('error', (err) => {
          hasErrored = true;
          cleanup();
          reject({
            success: false,
            error: `Failed to read input file: ${err.message}`
          });
        });
        
        cipher.on('error', (err) => {
          hasErrored = true;
          cleanup();
          reject({
            success: false,
            error: `Cipher error: ${err.message}`
          });
        });
        
        // Start encryption process
        inputStream.pipe(cipher).pipe(outputStream);
      });
      
    } catch (error) {
      // Cleanup sensitive data
      this.secureMemoryCleanup(key);
      this.secureMemoryCleanup(salt);
      this.secureMemoryCleanup(iv);
      
      console.error('Encryption error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Decrypt a file with a password using enhanced security
   * 
   * @param {string} inputPath - Path to the encrypted file
   * @param {string} password - Password to decrypt the file with
   * @param {string} outputPath - Optional path for the decrypted file output
   * @returns {Promise<Object>} Result object with success status and paths
   */
  static async decryptFile(inputPath, password, outputPath = null) {
    let key = null;
    let salt = null;
    let iv = null;
    
    try {
      // Validate input parameters
      if (!this.validateFilePath(inputPath) || (outputPath && !this.validateFilePath(outputPath))) {
        throw new Error('Invalid file path detected - potential security risk');
      }
      
      if (!password) {
        throw new Error('Password is required for decryption');
      }
      
      // Check if input file exists and is readable
      if (!fs.existsSync(inputPath)) {
        throw new Error('Encrypted file does not exist');
      }
      
      const inputStats = fs.statSync(inputPath);
      if (!inputStats.isFile()) {
        throw new Error('Input path is not a file');
      }
      
      // Minimum file size check (magic bytes + salt + IV + metadata length)
      const minFileSize = this.MAGIC_BYTES.length + this.SALT_LENGTH + this.IV_LENGTH + 4;
      if (inputStats.size < minFileSize) {
        throw new Error('File is too small to be a valid encrypted file');
      }
      
      // Read file header
      const fileHandle = fs.openSync(inputPath, 'r');
      let offset = 0;
      
      // Read and verify magic bytes
      const magicBytes = Buffer.alloc(this.MAGIC_BYTES.length);
      fs.readSync(fileHandle, magicBytes, 0, this.MAGIC_BYTES.length, offset);
      offset += this.MAGIC_BYTES.length;
      
      if (!magicBytes.equals(this.MAGIC_BYTES)) {
        // Try legacy format (no magic bytes)
        fs.closeSync(fileHandle);
        return await this._decryptLegacyFile(inputPath, password, outputPath);
      }
      
      // Read salt
      salt = Buffer.alloc(this.SALT_LENGTH);
      fs.readSync(fileHandle, salt, 0, this.SALT_LENGTH, offset);
      offset += this.SALT_LENGTH;
      
      // Read IV
      iv = Buffer.alloc(this.IV_LENGTH);
      fs.readSync(fileHandle, iv, 0, this.IV_LENGTH, offset);
      offset += this.IV_LENGTH;
      
      // Read metadata length
      const metadataLengthBuffer = Buffer.alloc(4);
      fs.readSync(fileHandle, metadataLengthBuffer, 0, 4, offset);
      offset += 4;
      const metadataLength = metadataLengthBuffer.readUInt32LE(0);
      
      // Validate metadata length
      if (metadataLength > 4096) { // Reasonable limit
        throw new Error('Invalid metadata length - file might be corrupted');
      }
      
      // Read metadata
      let metadata = {};
      if (metadataLength > 0) {
        const metadataBuffer = Buffer.alloc(metadataLength);
        fs.readSync(fileHandle, metadataBuffer, 0, metadataLength, offset);
        offset += metadataLength;
        
        try {
          metadata = JSON.parse(metadataBuffer.toString('utf8'));
        } catch (err) {
          console.warn('Failed to parse metadata, continuing with defaults');
        }
      }
      
      fs.closeSync(fileHandle);
      
      // Determine output path
      if (!outputPath) {
        if (metadata.originalExtension) {
          const basePath = inputPath.endsWith('.enc') 
            ? inputPath.slice(0, -4) 
            : `${inputPath}.decrypted`;
          outputPath = basePath + metadata.originalExtension;
        } else if (metadata.fileName) {
          const dir = path.dirname(inputPath);
          outputPath = path.join(dir, metadata.fileName);
        } else {
          outputPath = inputPath.endsWith('.enc') 
            ? inputPath.slice(0, -4) 
            : `${inputPath}.decrypted`;
        }
      }
      
      // Derive key from password and salt
      key = await this._deriveKeySecure(password, salt);
      
      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      
      // Setup file streams
      const inputStream = fs.createReadStream(inputPath, { start: offset });
      const outputStream = fs.createWriteStream(outputPath);
      
      return new Promise((resolve, reject) => {
        let hasErrored = false;
        
        const cleanup = () => {
          this.secureMemoryCleanup(key);
          this.secureMemoryCleanup(salt);
          this.secureMemoryCleanup(iv);
        };
        
        outputStream.on('finish', () => {
          if (!hasErrored) {
            cleanup();
            resolve({
              success: true,
              inputPath,
              outputPath,
              encryptedFilename: path.basename(inputPath),
              decryptedFilename: path.basename(outputPath),
              originalExtension: metadata.originalExtension || '',
              originalFileName: metadata.fileName || ''
            });
          }
        });
        
        outputStream.on('error', (err) => {
          hasErrored = true;
          cleanup();
          reject({
            success: false,
            error: `Decryption failed: ${err.message}`
          });
        });
        
        inputStream.on('error', (err) => {
          hasErrored = true;
          cleanup();
          reject({
            success: false,
            error: `Failed to read encrypted file: ${err.message}`
          });
        });
        
        decipher.on('error', (err) => {
          hasErrored = true;
          cleanup();
          // Remove partial output file
          try {
            fs.unlinkSync(outputPath);
          } catch (e) {
            // Ignore cleanup errors
          }
          reject({
            success: false,
            error: 'Failed to decrypt: Incorrect password or corrupted file'
          });
        });
        
        // Start decryption process
        inputStream.pipe(decipher).pipe(outputStream);
      });
      
    } catch (error) {
      // Cleanup sensitive data
      this.secureMemoryCleanup(key);
      this.secureMemoryCleanup(salt);
      this.secureMemoryCleanup(iv);
      
      console.error('Decryption error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Decrypt legacy format files (for backward compatibility)
   * @private
   */
  static async _decryptLegacyFile(inputPath, password, outputPath = null) {
    let key = null;
    
    try {
      const fileHandle = fs.openSync(inputPath, 'r');
      const iv = Buffer.alloc(16);
      fs.readSync(fileHandle, iv, 0, 16, 0);
      
      // Read the metadata length (4 bytes)
      const metadataLengthBuffer = Buffer.alloc(4);
      fs.readSync(fileHandle, metadataLengthBuffer, 0, 4, 16);
      const metadataLength = metadataLengthBuffer.readUInt32LE(0);
      
      // Read the metadata
      let metadata = {};
      if (metadataLength > 0 && metadataLength < 1024) {
        const metadataBuffer = Buffer.alloc(metadataLength);
        fs.readSync(fileHandle, metadataBuffer, 0, metadataLength, 20);
        try {
          metadata = JSON.parse(metadataBuffer.toString());
        } catch (err) {
          console.warn('Failed to parse legacy metadata');
        }
      }
      
      fs.closeSync(fileHandle);
      
      // Determine output path
      if (!outputPath) {
        if (metadata.originalExtension) {
          const basePath = inputPath.endsWith('.enc') 
            ? inputPath.slice(0, -4) 
            : `${inputPath}.decrypted`;
          outputPath = basePath + metadata.originalExtension;
        } else {
          outputPath = inputPath.endsWith('.enc') 
            ? inputPath.slice(0, -4) 
            : `${inputPath}.decrypted`;
        }
      }
      
      // Use legacy key derivation
      key = this._deriveLegacyKey(password);
      
      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      
      // Setup file streams
      const headerSize = 20 + metadataLength;
      const inputStream = fs.createReadStream(inputPath, { start: headerSize });
      const outputStream = fs.createWriteStream(outputPath);
      
      return new Promise((resolve, reject) => {
        let hasErrored = false;
        
        const cleanup = () => {
          this.secureMemoryCleanup(key);
        };
        
        outputStream.on('finish', () => {
          if (!hasErrored) {
            cleanup();
            resolve({
              success: true,
              inputPath,
              outputPath,
              encryptedFilename: path.basename(inputPath),
              decryptedFilename: path.basename(outputPath),
              originalExtension: metadata.originalExtension || '',
              legacy: true
            });
          }
        });
        
        outputStream.on('error', (err) => {
          hasErrored = true;
          cleanup();
          reject({
            success: false,
            error: err.message
          });
        });
        
        decipher.on('error', (err) => {
          hasErrored = true;
          cleanup();
          try {
            fs.unlinkSync(outputPath);
          } catch (e) {
            // Ignore cleanup errors
          }
          reject({
            success: false,
            error: 'Failed to decrypt legacy file: Incorrect password or corrupted file'
          });
        });
        
        inputStream.pipe(decipher).pipe(outputStream);
      });
      
    } catch (error) {
      this.secureMemoryCleanup(key);
      throw error;
    }
  }
  
  /**
   * Derive a cryptographic key from a password using secure PBKDF2
   * 
   * @private
   * @param {string} password - The password to derive the key from
   * @param {Buffer} salt - Random salt for key derivation
   * @returns {Promise<Buffer>} - The derived key
   */
  static async _deriveKeySecure(password, salt) {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, this.PBKDF2_ITERATIONS, this.KEY_LENGTH, 'sha256', (err, key) => {
        if (err) {
          reject(err);
        } else {
          resolve(key);
        }
      });
    });
  }
  
  /**
   * Legacy key derivation for backward compatibility
   * 
   * @private
   * @param {string} password - The password to derive the key from
   * @returns {Buffer} - The derived key
   */
  static _deriveLegacyKey(password) {
    const salt = 'securefilemanagersalt';
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  }
  
  /**
   * Tests if a file is encrypted by this application
   * Enhanced security check with magic bytes validation
   * 
   * @param {string} filePath - Path to the file to test
   * @returns {boolean} - True if the file appears to be encrypted
   */
  static isEncryptedFile(filePath) {
    try {
      // Validate file path
      if (!this.validateFilePath(filePath)) {
        return false;
      }
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return false;
      }
      
      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        return false;
      }
      
      // Check minimum file size
      const minSize = this.MAGIC_BYTES.length + this.SALT_LENGTH + this.IV_LENGTH + 4;
      if (stats.size < minSize) {
        // Could be a legacy format, check extension
        return filePath.endsWith('.enc');
      }
      
      // Read and check magic bytes
      try {
        const fileHandle = fs.openSync(filePath, 'r');
        const magicBytes = Buffer.alloc(this.MAGIC_BYTES.length);
        const bytesRead = fs.readSync(fileHandle, magicBytes, 0, this.MAGIC_BYTES.length, 0);
        fs.closeSync(fileHandle);
        
        if (bytesRead === this.MAGIC_BYTES.length && magicBytes.equals(this.MAGIC_BYTES)) {
          return true;
        }
      } catch (error) {
        // If we can't read the file, fall back to extension check
      }
      
      // Fallback to extension check for legacy files
      return filePath.endsWith('.enc');
      
    } catch (error) {
      console.error('Error checking file encryption:', error);
      return false;
    }
  }
  
  /**
   * Get file format version
   * @param {string} filePath - Path to the encrypted file
   * @returns {string} - Format version or 'unknown'
   */
  static getFileFormatVersion(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return 'unknown';
      }
      
      const stats = fs.statSync(filePath);
      const minSize = this.MAGIC_BYTES.length + this.SALT_LENGTH + this.IV_LENGTH + 4;
      
      if (stats.size < minSize) {
        return 'legacy';
      }
      
      const fileHandle = fs.openSync(filePath, 'r');
      const magicBytes = Buffer.alloc(this.MAGIC_BYTES.length);
      const bytesRead = fs.readSync(fileHandle, magicBytes, 0, this.MAGIC_BYTES.length, 0);
      fs.closeSync(fileHandle);
      
      if (bytesRead === this.MAGIC_BYTES.length && magicBytes.equals(this.MAGIC_BYTES)) {
        return '2.0';
      }
      
      return 'legacy';
      
    } catch (error) {
      return 'unknown';
    }
  }
  
  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result
   */
  static validatePasswordStrength(password) {
    const result = {
      isValid: false,
      score: 0,
      issues: []
    };
    
    if (!password || typeof password !== 'string') {
      result.issues.push('Password is required');
      return result;
    }
    
    // Length check
    if (password.length < 8) {
      result.issues.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
      result.score += 2;
    } else {
      result.score += 1;
    }
    
    // Character diversity checks
    if (/[a-z]/.test(password)) result.score += 1;
    if (/[A-Z]/.test(password)) result.score += 1;
    if (/[0-9]/.test(password)) result.score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) result.score += 2;
    
    // Common patterns check
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /(.)\1{2,}/ // Repeated characters
    ];
    
    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        result.issues.push('Password contains common patterns');
        result.score -= 1;
        break;
      }
    }
    
    // Final validation
    result.isValid = result.score >= 4 && result.issues.length === 0;
    
    return result;
  }
}

module.exports = EncryptionUtils;