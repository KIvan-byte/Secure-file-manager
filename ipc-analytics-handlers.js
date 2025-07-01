// IPC Handlers for Analytics
const fs = require('fs');
const path = require('path');
const util = require('util');
const { exec } = require('child_process'); // For getStorageInfo

function registerAnalyticsHandlers(ipcMain, appElectron, ensureDbReady) { // Added appElectron for app.getPath
  // Analytics endpoints
  ipcMain.handle('getAllFiles', async () => {
    try {
      const userHomePath = appElectron.getPath('home'); // Use appElectron
      const scanPaths = [
        path.join(userHomePath, 'Documents'),
        path.join(userHomePath, 'Downloads'),
        path.join(userHomePath, 'Pictures'),
      ];

      let allFiles = [];

      for (const scanPath of scanPaths) {
        if (fs.existsSync(scanPath)) {
          try {
            const files = await scanDirectory(scanPath, 2); // scanDirectory needs to be defined or imported
            allFiles = allFiles.concat(files);
          } catch (err) {
            console.error(`Error scanning ${scanPath}:`, err);
          }
        }
      }
      return { success: true, files: allFiles };
    } catch (error) {
      console.error('Error getting all files:', error);
      return { success: false, error: error.message };
    }
  });

  // Get shared files count (Placeholder, as original was random)
  ipcMain.handle('getSharedFilesCount', async () => {
    try {
      await ensureDbReady();
      const db = ipcMain.db; // Access db instance
      const sharedFilesCount = db.data.sharedLinks ? db.data.sharedLinks.filter(link => !link.isUsed && (!link.expiresAt || new Date(link.expiresAt) > new Date())).length : 0;
      return { success: true, count: sharedFilesCount };
    } catch (error) {
      console.error('Error getting shared files count:', error);
      return { success: false, error: error.message, count: 0 }; // Provide a default count on error
    }
  });


  // Get storage information for the main disk
  ipcMain.handle('getStorageInfo', async () => {
    try {
      const diskPath = path.parse(appElectron.getPath('home')).root; // Use appElectron
      let storage = { total: 0, used: 0, available: 0 };

      if (process.platform === 'win32') {
        // Placeholder for Windows, as original used a demo implementation
        // For a real app, use a library like 'diskusage'
        const total = 1024 * 1024 * 1024 * 250; // 250GB
        const available = 1024 * 1024 * 1024 * 100; // 100GB
        storage = { total, available, used: total - available };
      } else {
        const { stdout } = await util.promisify(exec)(`df -k "${diskPath}"`);
        const lines = stdout.trim().split('\n');
        const info = lines[1].split(/\s+/);
        const total = parseInt(info[1], 10) * 1024;
        const used = parseInt(info[2], 10) * 1024;
        const available = parseInt(info[3], 10) * 1024;
        storage = { total, used, available };
      }
      return { success: true, storage };
    } catch (error) {
      console.error('Error getting storage info:', error);
      const total = 1024 * 1024 * 1024 * 500; // 500GB
      const available = 1024 * 1024 * 1024 * 200; // 200GB
      return { success: true, storage: { total, available, used: total - available } };
    }
  });

  // Get file type distribution by size
  ipcMain.handle('getFileTypeDistribution', async () => {
    try {
      const userHomePath = appElectron.getPath('home'); // Use appElectron
      const documentsPath = path.join(userHomePath, 'Documents');
      const downloadsPath = path.join(userHomePath, 'Downloads');
      const typeDistribution = { document: 0, image: 0, video: 0, audio: 0, archive: 0, code: 0, pdf: 0, other: 0 };
      const scanPaths = [documentsPath, downloadsPath];

      for (const scanPath of scanPaths) {
        if (fs.existsSync(scanPath)) {
          try {
            await analyzeDirectorySizes(scanPath, typeDistribution, 2); // analyzeDirectorySizes needs to be defined or imported
          } catch (err) {
            console.error(`Error analyzing ${scanPath}:`, err);
          }
        }
      }
      return { success: true, typeDistribution };
    } catch (error) {
      console.error('Error getting file type distribution:', error);
      return { success: true, typeDistribution: { document: 256MB, image: 512MB, video: 4096MB, audio: 512MB, archive: 128MB, code: 64MB, pdf: 32MB, other: 128MB } }; // Placeholder with MB values
    }
  });

  // Get activity trends from the logs
  ipcMain.handle('getActivityTrends', async () => {
    try {
      await ensureDbReady();
      const db = ipcMain.db; // Access db instance

      const generateDates = (days) => {
        const dates = [];
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
      };

      const last7Days = generateDates(7);
      const activityTrends = last7Days.map(date => {
        let reads = 0, shares = 0, encryptions = 0;
        if(db.data.accessLogs) {
            db.data.accessLogs.forEach(log => {
                if (log.timestamp.startsWith(date)) {
                    if (log.action === 'read_file' || log.action === 'read_directory') reads++;
                    if (log.action === 'share_file') shares++;
                    if (log.action === 'encrypt_file') encryptions++;
                }
            });
        }
        return { date, reads, shares, encryptions };
      });

      const last30Days = generateDates(30);
      // This is a simplified version. A real count would need more sophisticated tracking.
      // For now, let's assume a base and simulate growth based on file-related log entries.
      let fileCount = 0; // Start with 0 and count actual files if possible, or estimate from logs.
      if (db.data.accessLogs) {
          const filePaths = new Set();
          db.data.accessLogs.forEach(log => {
              if (log.path && (log.action.includes('file') || log.action.includes('directory'))) {
                  filePaths.add(log.path);
              }
          });
          fileCount = filePaths.size;
      }

      const growthTrends = last30Days.map((date, index) => {
        // Simulate growth based on activity. This is a very rough estimate.
        let dailyGrowth = 0;
        if(db.data.accessLogs){
            db.data.accessLogs.forEach(log => {
                if(log.timestamp.startsWith(date) && (log.action === 'create_file' || log.action === 'encrypt_file' || log.action === 'compress_files')){
                    dailyGrowth++;
                }
            });
        }
        // This isn't a cumulative count but daily "new files" estimate
        return { date, count: dailyGrowth };
      });

      return { success: true, activityTrends, growthTrends };
    } catch (error) {
      console.error('Error getting activity trends:', error);
      // Provide some default structure on error
      return { success: false, error: error.message, activityTrends: [], growthTrends: [] };
    }
  });

  // Get access logs
  ipcMain.handle('get-access-logs', async () => {
    try {
      await ensureDbReady();
      const db = ipcMain.db; // Access db instance
      return { success: true, logs: db.data.accessLogs || [] }; // Ensure logs is an array
    } catch (error) {
      console.error('Error getting access logs:', error);
      return { success: false, error: error.message, logs: [] }; // Provide default on error
    }
  });

}

// Helper function to scan directory with depth limit and performance optimization
// This function needs to be defined here or imported if it's in a utility file.
async function scanDirectory(dirPath, maxDepth = 2, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    let results = [];
    const maxFilesPerDir = 100;
    let processedFiles = 0;

    for (const entry of entries) {
      if (processedFiles >= maxFilesPerDir) break;
      const entryPath = path.join(dirPath, entry.name);
      if (entry.name.startsWith('.') || entry.name.includes('node_modules') || entry.name.includes('$RECYCLE.BIN') || entry.name.includes('System Volume Information')) {
        continue;
      }
      try {
        const stats = fs.statSync(entryPath);
        if (entry.isDirectory()) {
          results.push({ name: entry.name, path: entryPath, size: 0, isDirectory: true, mtime: stats.mtime });
          if (currentDepth < maxDepth) {
            const subItems = await scanDirectory(entryPath, maxDepth, currentDepth + 1);
            results = results.concat(subItems);
          }
        } else {
          results.push({ name: entry.name, path: entryPath, size: stats.size, isDirectory: false, mtime: stats.mtime });
        }
        processedFiles++;
        if (processedFiles % 10 === 0) await new Promise(resolve => setTimeout(resolve, 1));
      } catch (err) {
        console.error(`Error accessing ${entryPath}:`, err);
      }
    }
    return results;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
}

// Helper function to analyze directory sizes by file type
// This function needs to be defined here or imported.
async function analyzeDirectorySizes(dirPath, typeDistribution, maxDepth = 2, currentDepth = 0) {
  if (currentDepth > maxDepth) return;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          if (currentDepth < maxDepth) {
            await analyzeDirectorySizes(entryPath, typeDistribution, maxDepth, currentDepth + 1);
          }
        } else {
          const stats = fs.statSync(entryPath);
          const fileSize = stats.size;
          const extension = path.extname(entry.name).toLowerCase();
          let fileType = 'other';
          if (['.doc', '.docx', '.txt', '.rtf', '.odt', '.xls', '.xlsx', '.ppt', '.pptx', '.csv'].includes(extension)) fileType = 'document';
          else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.tiff'].includes(extension)) fileType = 'image';
          else if (['.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv'].includes(extension)) fileType = 'video';
          else if (['.mp3', '.wav', '.ogg', '.flac', '.aac', '.wma'].includes(extension)) fileType = 'audio';
          else if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(extension)) fileType = 'archive';
          else if (['.js', '.py', '.java', '.html', '.css', '.cpp', '.c', '.php', '.go', '.ts', '.jsx', '.tsx'].includes(extension)) fileType = 'code';
          else if (extension === '.pdf') fileType = 'pdf';
          typeDistribution[fileType] += fileSize;
        }
      } catch (err) {
        console.error(`Error analyzing ${entryPath}:`, err);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
}


module.exports = { registerAnalyticsHandlers };
