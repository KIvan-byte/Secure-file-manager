// IPC Handlers for File Compression
const CompressionUtils = require('./utils/compression-utils');

function registerCompressionHandlers(ipcMain, logAccess) {
  // Compress files into a ZIP or TAR archive
  ipcMain.handle('compress-files', async (event, { sourcePaths, outputPath, format = 'zip', options = {} }) => {
    try {
      // Log the action
      await logAccess('compress_files', outputPath, { sourcePaths });

      let result;
      if (format === 'zip') {
        result = await CompressionUtils.compressToZip(sourcePaths, outputPath, options);
      } else if (format === 'tar') {
        result = await CompressionUtils.compressToTar(sourcePaths, outputPath, options);
      } else {
        return { success: false, error: 'Unsupported compression format' };
      }

      return result;
    } catch (error) {
      console.error('Error compressing files:', error);
      return { success: false, error: error.message };
    }
  });

  // Extract a ZIP or TAR archive
  ipcMain.handle('extract-archive', async (event, { archivePath, outputPath }) => {
    try {
      // Log the action
      await logAccess('extract_archive', archivePath, { outputPath });

      const result = await CompressionUtils.extractArchive(archivePath, outputPath);
      return result;
    } catch (error) {
      console.error('Error extracting archive:', error);
      return { success: false, error: error.message };
    }
  });

  // Check if a file is an archive
  ipcMain.handle('is-archive', async (event, filePath) => {
    try {
      return { success: true, isArchive: CompressionUtils.isArchive(filePath) };
    } catch (error) {
      console.error('Error checking if file is archive:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerCompressionHandlers };
