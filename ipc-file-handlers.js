// IPC Handlers for File System Operations
const { dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const FileUtils = require('./utils/file-utils');

function registerFileHandlers(ipcMain, mainWindow, logAccess, ensureDbReady) {
  // Browse and read directories
  ipcMain.handle('browse-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    if (result.canceled) return { success: false };
    return { success: true, path: result.filePaths[0] };
  });

  // Add new handler for selecting a single file
  ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile']
    });
    if (result.canceled) return { success: false };
    return { success: true, path: result.filePaths[0] };
  });

  // Read directories
  ipcMain.handle('read-directory', async (event, dirPath) => {
    try {
      // Use our safer FileUtils instead of direct fs calls
      const fileItems = FileUtils.readDirectory(dirPath);

      // Log directory access
      await logAccess('read_directory', dirPath);

      return { success: true, items: fileItems };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // File operations
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      // Use our safer FileUtils
      const content = FileUtils.readFile(filePath, 'utf8');

      // Log file access
      await logAccess('read_file', filePath);

      return { success: true, content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Read file binary (for images, PDFs, videos, audio)
  ipcMain.handle('read-file-binary', async (event, filePath) => {
    try {
      // Make sure the file exists first
      if (!FileUtils.fileExists(filePath)) {
        return { success: false, error: 'File does not exist' };
      }

      // Read the file as binary data
      const buffer = fs.readFileSync(filePath);

      // Convert to base64 for sending through IPC
      const base64Content = buffer.toString('base64');

      // Log file access
      await logAccess('read_file', filePath, { binary: true });

      return { success: true, content: base64Content };
    } catch (error) {
      console.error(`Error reading binary file ${filePath}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Create directory handler
  ipcMain.handle('create-directory', async (event, dirPath) => {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
      return { success: true, path: dirPath };
    } catch (error) {
      console.error('Error creating directory:', error);
      return { success: false, error: error.message };
    }
  });

  // Delete file or directory handler
  ipcMain.handle('delete-file', async (event, filePath) => {
    try {
      const stats = await fs.promises.stat(filePath);

      if (stats.isDirectory()) {
        // Delete directory recursively
        await fs.promises.rmdir(filePath, { recursive: true });
      } else {
        // Delete file
        await fs.promises.unlink(filePath);
      }

      // Log the deletion
      await logAccess('delete_file', filePath, {
        type: stats.isDirectory() ? 'directory' : 'file'
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting file/directory:', error);
      return { success: false, error: error.message };
    }
  });

  // Fix the get-file-details handler to properly use await with async fs operations
  ipcMain.handle('get-file-details', async (event, filePath) => {
    try {
      // Use await to ensure stats are properly retrieved before using them
      const stats = await fs.promises.stat(filePath);

      const details = {
        size: stats.size,
        mode: stats.mode,
        uid: stats.uid,
        gid: stats.gid,
        atime: stats.atime.toISOString(), // Convert Date to ISO string for reliable serialization
        mtime: stats.mtime.toISOString(),
        ctime: stats.ctime.toISOString(),
        birthtime: stats.birthtime.toISOString()
      };

      // Try to get owner and group names if on Unix-like systems
      if (process.platform !== 'win32') {
        try {
          const { execSync } = require('child_process');
          details.owner = execSync(`stat -c "%U" "${filePath}"`).toString().trim();
          details.group = execSync(`stat -c "%G" "${filePath}"`).toString().trim();
        } catch (error) {
          console.error('Error getting file owner/group:', error);
        }
      }

      // Try to get MIME type
      try {
        const { execSync } = require('child_process');
        if (process.platform === 'win32') {
          // On Windows, use file extension to guess MIME type
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes = {
            '.txt': 'text/plain',
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.mp4': 'video/mp4',
            '.mp3': 'audio/mpeg',
            '.zip': 'application/zip',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          };
          details.mime = mimeTypes[ext] || 'application/octet-stream';
        } else {
          // On Unix-like systems, use file command
          details.mime = execSync(`file --mime-type -b "${filePath}"`).toString().trim();
        }
      } catch (error) {
        console.error('Error getting MIME type:', error);
      }

      return {
        success: true,
        details
      };
    } catch (error) {
      console.error('Error getting file details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // File operations IPC handlers
  ipcMain.handle('moveFile', async (event, params) => {
    try {
      return await FileUtils.moveFile(params);
    } catch (error) {
      console.error('Error in moveFile handler:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('copyFileFromPath', async (event, params) => {
    try {
      return await FileUtils.copyFileFromPath(params);
    } catch (error) {
      console.error('Error in copyFileFromPath handler:', error);
      return { success: false, error: error.message };
    }
  });

  // New handler for content search
  ipcMain.handle('search-file-content', async (event, { directoryPath, searchText, options }) => {
    try {
      if (!directoryPath || !searchText) {
        return { success: false, error: 'Directory path and search text are required' };
      }

      const results = FileUtils.searchFileContent(directoryPath, searchText, options);

      // Log search activity
      await logAccess('search_content', directoryPath, {
        searchText,
        resultsCount: results.length
      });

      return { success: true, results };
    } catch (error) {
      console.error(`Error searching file content:`, error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerFileHandlers };
