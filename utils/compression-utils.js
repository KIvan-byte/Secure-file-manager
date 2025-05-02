const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const extract = require('extract-zip');
const tar = require('tar');
const FileUtils = require('./file-utils');

/**
 * Utilities for file compression and archiving
 */
class CompressionUtils {
  /**
   * Compress files and directories into a zip archive
   * 
   * @param {string[]} sourcePaths - Array of file or directory paths to compress
   * @param {string} outputPath - Path for the output zip file
   * @param {Object} options - Compression options
   * @returns {Promise<Object>} Result object with success status and paths
   */
  static async compressToZip(sourcePaths, outputPath, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        if (!sourcePaths || !sourcePaths.length) {
          return reject({ success: false, error: 'No source paths provided' });
        }

        // Make sure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Create a file to stream archive data to
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', {
          zlib: { level: options.compressionLevel || 9 } // Compression level (0-9)
        });

        // Listen for all archive data to be written
        output.on('close', () => {
          resolve({
            success: true,
            outputPath,
            size: archive.pointer(),
            fileCount: archive.entries.length
          });
        });

        // Good practice to catch warnings as they arise
        archive.on('warning', (err) => {
          if (err.code === 'ENOENT') {
            console.warn('Archiver warning:', err);
          } else {
            reject({ success: false, error: err.message });
          }
        });

        archive.on('error', (err) => {
          reject({ success: false, error: err.message });
        });

        // Pipe archive data to the file
        archive.pipe(output);

        // Add each source to the archive
        for (const sourcePath of sourcePaths) {
          if (!fs.existsSync(sourcePath)) {
            console.warn(`Path does not exist: ${sourcePath}`);
            continue;
          }

          const stats = fs.statSync(sourcePath);
          if (stats.isDirectory()) {
            // Add a directory
            archive.directory(sourcePath, path.basename(sourcePath));
          } else {
            // Add a file
            archive.file(sourcePath, { name: path.basename(sourcePath) });
          }
        }

        // Finalize the archive
        archive.finalize();
      } catch (error) {
        console.error('Compression error:', error);
        reject({ success: false, error: error.message });
      }
    });
  }

  /**
   * Compress files and directories into a tar archive
   * 
   * @param {string[]} sourcePaths - Array of file or directory paths to compress
   * @param {string} outputPath - Path for the output tar file
   * @param {Object} options - Compression options
   * @returns {Promise<Object>} Result object with success status and paths
   */
  static async compressToTar(sourcePaths, outputPath, options = {}) {
    try {
      if (!sourcePaths || !sourcePaths.length) {
        return { success: false, error: 'No source paths provided' };
      }

      // Make sure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Prepare source files and directories for tar
      const files = [];
      const cwd = path.dirname(sourcePaths[0]);

      for (const sourcePath of sourcePaths) {
        if (!fs.existsSync(sourcePath)) {
          console.warn(`Path does not exist: ${sourcePath}`);
          continue;
        }

        // Add relative path to the array
        files.push(path.relative(cwd, sourcePath));
      }

      // Create tar archive
      await tar.create(
        {
          gzip: options.gzip === true,
          file: outputPath,
          cwd: cwd,
          portable: true
        },
        files
      );

      return {
        success: true,
        outputPath,
        size: fs.statSync(outputPath).size,
        gzipped: options.gzip === true
      };
    } catch (error) {
      console.error('Tar compression error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract a zip archive to a specified directory
   * 
   * @param {string} archivePath - Path to the zip archive
   * @param {string} outputPath - Directory to extract files to
   * @returns {Promise<Object>} Result object with success status and extracted path
   */
  static async extractZip(archivePath, outputPath) {
    try {
      if (!fs.existsSync(archivePath)) {
        return { success: false, error: 'Archive file does not exist' };
      }

      // Make sure output directory exists
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }

      // Extract the archive
      await extract(archivePath, { dir: outputPath });

      return {
        success: true,
        outputPath,
        archivePath
      };
    } catch (error) {
      console.error('Extract error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract a tar or tar.gz archive to a specified directory
   * 
   * @param {string} archivePath - Path to the tar archive
   * @param {string} outputPath - Directory to extract files to
   * @returns {Promise<Object>} Result object with success status and extracted path
   */
  static async extractTar(archivePath, outputPath) {
    try {
      if (!fs.existsSync(archivePath)) {
        return { success: false, error: 'Archive file does not exist' };
      }

      // Make sure output directory exists
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }

      // Extract the archive
      await tar.extract({
        file: archivePath,
        cwd: outputPath
      });

      return {
        success: true,
        outputPath,
        archivePath
      };
    } catch (error) {
      console.error('Tar extract error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Determine the appropriate method to extract an archive based on its extension
   * 
   * @param {string} archivePath - Path to the archive
   * @param {string} outputPath - Directory to extract files to
   * @returns {Promise<Object>} Result object with success status and extracted path
   */
  static async extractArchive(archivePath, outputPath) {
    const extension = path.extname(archivePath).toLowerCase();
    
    if (extension === '.zip') {
      return this.extractZip(archivePath, outputPath);
    } else if (extension === '.tar' || archivePath.endsWith('.tar.gz') || extension === '.tgz') {
      return this.extractTar(archivePath, outputPath);
    } else {
      return { success: false, error: 'Unsupported archive format' };
    }
  }

  /**
   * Check if a file is a supported archive format
   * 
   * @param {string} filePath - Path to check
   * @returns {boolean} - True if the file is a supported archive
   */
  static isArchive(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const supportedExtensions = ['.zip', '.tar', '.gz', '.tgz'];
    
    if (supportedExtensions.includes(extension)) {
      return true;
    }
    
    // Check for .tar.gz
    if (filePath.toLowerCase().endsWith('.tar.gz')) {
      return true;
    }
    
    return false;
  }
}

module.exports = CompressionUtils;