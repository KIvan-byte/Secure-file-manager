const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Utilities for file encryption and decryption
 */
class EncryptionUtils {
  /**
   * Encrypt a file with a password
   * 
   * @param {string} inputPath - Path to the file to encrypt
   * @param {string} password - Password to encrypt the file with
   * @param {string} outputPath - Optional path for the encrypted file output. If not provided, will append .enc to the original filename
   * @returns {Object} Result object with success status and paths
   */
  static encryptFile(inputPath, password, outputPath = null) {
    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);
      
      // Create output path if not provided
      if (!outputPath) {
        outputPath = `${inputPath}.enc`;
      }
      
      // Create a cipher using the password and iv
      const key = this._deriveKey(password);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      
      // Setup file streams
      const inputStream = fs.createReadStream(inputPath);
      const outputStream = fs.createWriteStream(outputPath);
      
      // Store original file extension in the encrypted file metadata
      const originalExtension = path.extname(inputPath);
      const metadataBuffer = Buffer.from(JSON.stringify({
        originalExtension
      }));
      
      // Create a 4-byte buffer to store the metadata length
      const metadataLengthBuffer = Buffer.alloc(4);
      metadataLengthBuffer.writeUInt32LE(metadataBuffer.length, 0);
      
      // Write the IV, metadata length, and metadata at the beginning of the output file
      outputStream.write(iv);
      outputStream.write(metadataLengthBuffer);
      outputStream.write(metadataBuffer);
      
      // Pipe the input through the cipher and to the output
      inputStream.pipe(cipher).pipe(outputStream);
      
      return new Promise((resolve, reject) => {
        outputStream.on('finish', () => {
          resolve({
            success: true,
            inputPath,
            outputPath,
            originalFilename: path.basename(inputPath),
            encryptedFilename: path.basename(outputPath),
            originalExtension
          });
        });
        
        outputStream.on('error', (err) => {
          reject({
            success: false,
            error: err.message
          });
        });
      });
    } catch (error) {
      console.error('Encryption error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Decrypt a file with a password
   * 
   * @param {string} inputPath - Path to the encrypted file
   * @param {string} password - Password to decrypt the file with
   * @param {string} outputPath - Optional path for the decrypted file output. If not provided, will use original extension if available
   * @returns {Object} Result object with success status and paths
   */
  static decryptFile(inputPath, password, outputPath = null) {
    try {
      // First, read the IV and metadata from the beginning of the file
      const fileHandle = fs.openSync(inputPath, 'r');
      const iv = Buffer.alloc(16);
      fs.readSync(fileHandle, iv, 0, 16, 0);
      
      // Read the metadata length (4 bytes)
      const metadataLengthBuffer = Buffer.alloc(4);
      fs.readSync(fileHandle, metadataLengthBuffer, 0, 4, 16);
      const metadataLength = metadataLengthBuffer.readUInt32LE(0);
      
      // Read the metadata
      let metadata = {};
      if (metadataLength > 0 && metadataLength < 1024) { // Reasonable size limit for metadata
        const metadataBuffer = Buffer.alloc(metadataLength);
        fs.readSync(fileHandle, metadataBuffer, 0, metadataLength, 20);
        try {
          metadata = JSON.parse(metadataBuffer.toString());
        } catch (err) {
          console.warn('Failed to parse metadata, might be an older encrypted file format');
        }
      }
      
      fs.closeSync(fileHandle);
      
      // Determine the output file path, using the original extension if available
      if (!outputPath) {
        if (metadata.originalExtension) {
          // Remove .enc and add original extension
          const basePath = inputPath.endsWith('.enc') 
            ? inputPath.slice(0, -4) 
            : `${inputPath}.decrypted`;
          
          outputPath = basePath + metadata.originalExtension;
        } else {
          // Fallback for files encrypted with older versions
          outputPath = inputPath.endsWith('.enc') 
            ? inputPath.slice(0, -4) 
            : `${inputPath}.decrypted`;
        }
      }
      
      // Generate key from password
      const key = this._deriveKey(password);
      
      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      
      // Setup file streams - skip the IV and metadata during reading
      const headerSize = 20 + metadataLength; // 16 bytes IV + 4 bytes metadata length + metadata
      const inputStream = fs.createReadStream(inputPath, { start: headerSize });
      const outputStream = fs.createWriteStream(outputPath);
      
      // Pipe the input through the decipher and to the output
      inputStream.pipe(decipher).pipe(outputStream);
      
      return new Promise((resolve, reject) => {
        outputStream.on('finish', () => {
          resolve({
            success: true,
            inputPath,
            outputPath,
            encryptedFilename: path.basename(inputPath),
            decryptedFilename: path.basename(outputPath),
            originalExtension: metadata.originalExtension || ''
          });
        });
        
        outputStream.on('error', (err) => {
          reject({
            success: false,
            error: err.message
          });
        });
        
        decipher.on('error', (err) => {
          // This is usually a wrong password error
          outputStream.end();
          try {
            fs.unlinkSync(outputPath); // Remove the partial output file
          } catch (e) {
            // Ignore errors if file doesn't exist yet
          }
          reject({
            success: false,
            error: 'Failed to decrypt: Incorrect password or corrupted file'
          });
        });
      });
    } catch (error) {
      console.error('Decryption error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Derive a cryptographic key from a password using PBKDF2
   * 
   * @private
   * @param {string} password - The password to derive the key from
   * @returns {Buffer} - The derived key
   */
  static _deriveKey(password) {
    // Use a fixed salt for simplicity and key recovery
    // In a more secure implementation, the salt would be random and stored with the file
    const salt = 'securefilemanagersalt';
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  }
  
  /**
   * Tests if a file is encrypted by this application
   * 
   * @param {string} filePath - Path to the file to test
   * @returns {boolean} - True if the file appears to be encrypted
   */
  static isEncryptedFile(filePath) {
    try {
      // A very simple check based on extension
      // For more security, we could check file headers
      return filePath.endsWith('.enc');
    } catch (error) {
      console.error('Error checking file encryption:', error);
      return false;
    }
  }
}

module.exports = EncryptionUtils;