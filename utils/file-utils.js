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

  /**
   * Search for files that contain specific text content
   * @param {string} directoryPath - Base directory to start search from
   * @param {string} searchText - Text to search for in files
   * @param {object} options - Search options
   * @param {string[]} options.fileTypes - File extensions to include (e.g., ['.txt', '.js'])
   * @param {boolean} options.caseSensitive - Whether search should be case sensitive
   * @param {number} options.maxDepth - Maximum directory depth to search
   * @param {number} options.maxResults - Maximum number of results to return
   * @returns {Array} Array of matched file objects with snippets
   */
  static searchFileContent(directoryPath, searchText, options = {}) {
    const defaultOptions = {
      fileTypes: null, // all file types
      caseSensitive: false,
      maxDepth: 10,
      maxResults: 100
    };
    
    const searchOptions = { ...defaultOptions, ...options };
    const results = [];
    
    try {
      this._searchInDirectory(directoryPath, searchText, searchOptions, results, 0);
      return results;
    } catch (error) {
      console.error(`Error searching in directory ${directoryPath}:`, error);
      throw error;
    }
  }
  
  /**
   * Helper method to recursively search directories
   * @private
   */
  static _searchInDirectory(dirPath, searchText, options, results, currentDepth) {
    if (currentDepth > options.maxDepth || results.length >= options.maxResults) {
      return;
    }
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        if (results.length >= options.maxResults) break;
        
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          // Recursively search in subdirectories
          this._searchInDirectory(itemPath, searchText, options, results, currentDepth + 1);
        } else if (stats.isFile()) {
          // Check file extension if fileTypes specified
          if (options.fileTypes && !options.fileTypes.includes(path.extname(itemPath).toLowerCase())) {
            continue;
          }
          
          try {
            // Skip binary files or files that are too large (>10MB)
            if (stats.size > 10 * 1024 * 1024 || this._isBinaryFile(itemPath)) {
              continue;
            }
            
            const content = fs.readFileSync(itemPath, 'utf8');
            
            // Perform search based on case sensitivity
            const searchPattern = options.caseSensitive ? searchText : searchText.toLowerCase();
            const contentToSearch = options.caseSensitive ? content : content.toLowerCase();
            
            if (contentToSearch.includes(searchPattern)) {
              // Generate snippets with context around matches
              const snippets = this._generateSnippets(content, searchText, options.caseSensitive);
              
              results.push({
                path: itemPath,
                name: item,
                size: stats.size,
                mtime: stats.mtime,
                snippets
              });
            }
          } catch (readError) {
            console.warn(`Could not read file ${itemPath}: ${readError.message}`);
          }
        }
      }
    } catch (error) {
      console.warn(`Could not read directory ${dirPath}: ${error.message}`);
    }
  }
  
  /**
   * Basic check if a file is binary (not perfect but good enough for most cases)
   * @private
   */
  static _isBinaryFile(filePath) {
    try {
      // Read the first few KB of the file
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(4096);
      const bytesRead = fs.readSync(fd, buffer, 0, 4096, 0);
      fs.closeSync(fd);
      
      // Check for NULL bytes which are common in binary files
      for (let i = 0; i < bytesRead; i++) {
        if (buffer[i] === 0) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      return true; // On error, assume binary to be safe
    }
  }
  
  /**
   * Generate text snippets around matches
   * @private
   */
  static _generateSnippets(content, searchText, caseSensitive) {
    const snippets = [];
    const lines = content.split('\n');
    const searchPattern = caseSensitive ? searchText : searchText.toLowerCase();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineToSearch = caseSensitive ? line : line.toLowerCase();
      
      if (lineToSearch.includes(searchPattern)) {
        // Get context (lines before and after)
        const startLine = Math.max(0, i - 1);
        const endLine = Math.min(lines.length - 1, i + 1);
        
        let snippet = '';
        for (let j = startLine; j <= endLine; j++) {
          if (j === i) {
            // Highlight the matching line
            snippet += `${j + 1}: ${lines[j]}\n`;
          } else {
            snippet += `${j + 1}: ${lines[j]}\n`;
          }
        }
        
        snippets.push({
          lineNumber: i + 1,
          text: snippet.trim()
        });
        
        // Limit to 3 snippets per file
        if (snippets.length >= 3) break;
      }
    }
    
    return snippets;
  }
}

module.exports = FileUtils;