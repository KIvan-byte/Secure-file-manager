const fs = require('fs');
const path = require('path');

/**
 * Safe file operations with better error handling
 */
class FileUtils {
  /**
   * Safely read directory contents with error handling
   * @param {string} dirPath - Directory path to read
   * @returns {Array} Array of file info objects
   */
  static readDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      return items.map(item => {
        try {
          const itemPath = path.join(dirPath, item);
          const stats = fs.statSync(itemPath);
          return {
            name: item,
            path: itemPath,
            isDirectory: stats.isDirectory(),
            size: stats.isDirectory() ? 0 : stats.size, // Explicit 0 for directories
            mtime: stats.mtime
          };
        } catch (itemError) {
          // Handle individual file errors gracefully
          console.error(`Error reading file stats for ${item}:`, itemError);
          return {
            name: item,
            path: path.join(dirPath, item),
            isDirectory: false,
            size: 0,
            mtime: new Date(),
            error: itemError.message
          };
        }
      });
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
      throw error;
    }
  }

  /**
   * Safely read file contents
   * @param {string} filePath - Path to the file
   * @param {string} encoding - File encoding (default: 'utf8')
   * @returns {string} File contents
   */
  static readFile(filePath, encoding = 'utf8') {
    try {
      return fs.readFileSync(filePath, encoding);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Check if a file exists and is accessible
   * @param {string} filePath - Path to check
   * @returns {boolean} True if file exists and is accessible
   */
  static fileExists(filePath) {
    try {
      fs.accessSync(filePath, fs.constants.F_OK);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file stats safely
   * @param {string} filePath - Path to the file
   * @returns {fs.Stats|null} File stats or null if error
   */
  static getFileStats(filePath) {
    try {
      return fs.statSync(filePath);
    } catch (error) {
      console.error(`Error getting file stats for ${filePath}:`, error);
      return null;
    }
  }
}

module.exports = FileUtils;