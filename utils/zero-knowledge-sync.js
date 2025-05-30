const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const net = require('net');
const dgram = require('dgram');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

class ZeroKnowledgeSync extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.isRunning = false;
    this.masterKey = null;
    this.deviceId = uuidv4();
    this.port = 8888; // Default port for sync protocol
    this.peers = new Map();
    this.files = new Map();
    this.server = null;
    this.discoverySocket = null;
    this.syncQueue = [];
    this.activeSessions = new Set();
    this.syncDirectory = null;
    
    // Network discovery settings
    this.discoveryPort = 8889;
    this.discoveryInterval = 30000; // 30 seconds
    this.discoveryTimer = null;
  }

  async initialize(masterPassword) {
    try {
      if (this.isInitialized) {
        throw new Error('Sync system already initialized');
      }

      // Set up sync directory
      this.syncDirectory = path.join(os.homedir(), 'ZeroKnowledgeSync');
      if (!fs.existsSync(this.syncDirectory)) {
        fs.mkdirSync(this.syncDirectory, { recursive: true });
      }

      // Derive master key from password
      this.masterKey = this.deriveKey(masterPassword);
      
      // Start network services
      await this.startServer();
      await this.startDiscovery();
      
      this.isInitialized = true;
      this.isRunning = true;
      
      console.log(`Zero-Knowledge Sync initialized with device ID: ${this.deviceId}`);
      console.log(`Sync directory: ${this.syncDirectory}`);
      this.emit('initialized');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize sync system:', error);
      throw error;
    }
  }

  deriveKey(password) {
    // Use a fixed salt so all devices with same password get same key
    const salt = Buffer.from('zero-knowledge-sync-v1', 'utf8');
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      this.server = net.createServer();
      
      this.server.on('connection', (socket) => {
        this.handlePeerConnection(socket);
      });
      
      this.server.on('error', (error) => {
        console.error('Sync server error:', error);
        reject(error);
      });
      
      this.server.listen(this.port, () => {
        console.log(`Sync server listening on port ${this.port}`);
        resolve();
      });
    });
  }

  async startDiscovery() {
    try {
      this.discoverySocket = dgram.createSocket('udp4');
      
      this.discoverySocket.on('message', (msg, rinfo) => {
        try {
          const data = JSON.parse(msg.toString());
          if (data.type === 'discovery' && data.deviceId !== this.deviceId) {
            console.log('Discovery message received:', { 
              deviceId: data.deviceId, 
              address: rinfo.address, 
              port: data.port 
            }); // Debug log
            this.handlePeerDiscovery(data, rinfo);
          }
        } catch (error) {
          console.error('Error parsing discovery message:', error);
        }
      });
      
      this.discoverySocket.bind(this.discoveryPort, () => {
        console.log(`Discovery service listening on port ${this.discoveryPort}`);
        this.startPeriodicDiscovery();
      });
    } catch (error) {
      console.error('Failed to start discovery service:', error);
      throw error;
    }
  }

  startPeriodicDiscovery() {
    this.discoveryTimer = setInterval(() => {
      this.broadcastDiscovery();
    }, this.discoveryInterval);
    
    // Send initial discovery
    this.broadcastDiscovery();
    
    // Start periodic sync timer to catch files that might have been missed
    this.syncTimer = setInterval(() => {
      if (this.peers.size > 0) {
        console.log('Periodic sync check...');
        this.syncWithPeers();
      }
    }, 60000); // Sync every minute
  }

  broadcastDiscovery() {
    const discoveryData = {
      type: 'discovery',
      deviceId: this.deviceId,
      port: this.port,
      timestamp: Date.now()
    };
    
    const message = Buffer.from(JSON.stringify(discoveryData));
    
    // Broadcast to local network
    this.discoverySocket.setBroadcast(true);
    this.discoverySocket.send(message, this.discoveryPort, '255.255.255.255', (error) => {
      if (error) {
        console.error('Error broadcasting discovery:', error);
      }
    });
  }

  handlePeerDiscovery(data, rinfo) {
    const peerId = data.deviceId;
    const peerAddress = rinfo.address;
    const peerPort = data.port;
    
    if (!this.peers.has(peerId)) {
      console.log(`Discovered new peer: ${peerId} at ${peerAddress}:${peerPort}`);
      
      this.peers.set(peerId, {
        deviceId: peerId,
        address: peerAddress,
        port: peerPort,
        status: 'connected',
        lastSeen: Date.now()
      });
      
      this.emit('peerDiscovered', this.peers.get(peerId));
      
      // Always trigger sync with new peer, regardless of file count
      console.log(`Triggering sync with new peer ${peerId}`);
      setTimeout(() => {
        this.syncWithPeer(this.peers.get(peerId)).catch(err => {
          console.error(`Failed to sync with new peer ${peerId}:`, err);
        });
      }, 1000); // Small delay to ensure peer is ready
    } else {
      // Update last seen time and trigger periodic sync
      const peer = this.peers.get(peerId);
      peer.lastSeen = Date.now();
      peer.status = 'connected';
      
      // Trigger sync occasionally to catch new files
      if (Math.random() < 0.1) { // 10% chance to sync on discovery
        console.log(`Periodic sync trigger with peer ${peerId}`);
        setTimeout(() => {
          this.syncWithPeer(peer).catch(err => {
            console.error(`Failed periodic sync with peer ${peerId}:`, err);
          });
        }, 2000);
      }
    }
  }

  // Helper method to send message with length prefix
  sendMessage(socket, message) {
    try {
      const messageData = Buffer.from(JSON.stringify(message), 'utf8');
      const lengthBuffer = Buffer.allocUnsafe(4);
      lengthBuffer.writeUInt32BE(messageData.length, 0);
      
      // Send length prefix followed by message
      socket.write(Buffer.concat([lengthBuffer, messageData]));
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  handlePeerConnection(socket) {
    const sessionId = uuidv4();
    this.activeSessions.add(sessionId);
    
    console.log(`New peer connection: ${sessionId}`);
    
    // Buffer for accumulating data chunks
    let dataBuffer = Buffer.alloc(0);
    let expectedLength = null;
    
    socket.on('data', async (chunk) => {
      try {
        // Accumulate data in buffer
        dataBuffer = Buffer.concat([dataBuffer, chunk]);
        
        // Process complete messages
        while (dataBuffer.length > 0) {
          // If we don't know the expected length, try to read it from the first 4 bytes
          if (expectedLength === null) {
            if (dataBuffer.length >= 4) {
              expectedLength = dataBuffer.readUInt32BE(0);
              dataBuffer = dataBuffer.slice(4);
            } else {
              break; // Need more data to read length
            }
          }
          
          // If we have the complete message
          if (dataBuffer.length >= expectedLength) {
            const messageData = dataBuffer.slice(0, expectedLength);
            dataBuffer = dataBuffer.slice(expectedLength);
            expectedLength = null;
            
            // Process the complete message
            await this.handleSyncMessage(messageData, socket);
          } else {
            break; // Need more data for complete message
          }
        }
      } catch (error) {
        console.error('Error handling data chunk:', error);
        dataBuffer = Buffer.alloc(0);
        expectedLength = null;
      }
    });
    
    socket.on('close', () => {
      this.activeSessions.delete(sessionId);
      console.log(`Peer connection closed: ${sessionId}`);
    });
    
    socket.on('error', (error) => {
      console.error('Peer connection error:', error);
      this.activeSessions.delete(sessionId);
    });
  }

  async handleSyncMessage(data, socket) {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'fileList':
          this.handleFileListRequest(message, socket);
          break;
        case 'fileListResponse':
          await this.handleFileListResponse(message, socket);
          break;
        case 'fileRequest':
          this.handleFileRequest(message, socket);
          break;
        case 'fileData':
          await this.handleFileData(message, socket);
          break;
        default:
          console.warn('Unknown sync message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing sync message:', error);
    }
  }

  async addFileToSync(filePath, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Sync system not initialized');
      }
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('File does not exist');
      }
      
      const stats = fs.statSync(filePath);
      const fileContent = fs.readFileSync(filePath);
      
      // Calculate file hash
      const hash = crypto.createHash('sha256');
      hash.update(fileContent);
      const contentHash = hash.digest('hex');
      
      // Encrypt file content
      const encryptedContent = this.encryptData(fileContent);
      
      const fileMetadata = {
        fileName: path.basename(filePath),
        filePath: filePath,
        fileSize: stats.size,
        contentHash: contentHash,
        encryptedSize: encryptedContent.length,
        lastModified: stats.mtime.toISOString(),
        addedToSync: new Date().toISOString()
      };
      
      // Store in sync registry
      this.files.set(contentHash, {
        ...fileMetadata,
        encryptedContent: encryptedContent
      });
      
      // Save decrypted file to sync directory
      await this.saveFileToSyncDirectory(fileMetadata.fileName, fileContent, contentHash);
      
      // Add to sync queue
      this.syncQueue.push({
        action: 'add',
        fileHash: contentHash,
        metadata: fileMetadata
      });
      
      console.log(`Added file to sync: ${fileMetadata.fileName}`);
      this.emit('fileAdded', fileMetadata);
      
      // Trigger sync with peers
      this.syncWithPeers();
      
      return fileMetadata;
    } catch (error) {
      console.error('Error adding file to sync:', error);
      throw error;
    }
  }

  encryptData(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.masterKey, iv);
    
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Combine IV and encrypted data
    return Buffer.concat([iv, encrypted]);
  }

  decryptData(encryptedData) {
    const iv = encryptedData.slice(0, 16);
    const ciphertext = encryptedData.slice(16);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.masterKey, iv);
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  }

  async syncWithPeers() {
    // Implement sync protocol with discovered peers
    console.log(`Syncing with ${this.peers.size} peers...`);
    for (const [peerId, peer] of this.peers) {
      if (peer.status === 'connected') {
        try {
          console.log(`Starting sync with peer: ${peerId}`);
          await this.syncWithPeer(peer);
        } catch (error) {
          console.error(`Error syncing with peer ${peerId}:`, error);
        }
      }
    }
  }

  async syncWithPeer(peer) {
    return new Promise((resolve, reject) => {
      console.log(`Connecting to peer ${peer.deviceId} at ${peer.address}:${peer.port}`);
      const socket = net.createConnection(peer.port, peer.address);
      let hasReceivedResponse = false;
      
      socket.on('connect', () => {
        console.log(`Connected to peer ${peer.deviceId}`);
        // Send file list
        const fileList = Array.from(this.files.values()).map(file => ({
          fileName: file.fileName,
          contentHash: file.contentHash,
          fileSize: file.fileSize,
          lastModified: file.lastModified
        }));
        
        const message = {
          type: 'fileList',
          files: fileList,
          deviceId: this.deviceId
        };
        
        console.log(`Sending file list to peer ${peer.deviceId}, files: ${fileList.length}`);
        this.sendMessage(socket, message);
      });
      
      // Use proper buffering for client connections too
      let dataBuffer = Buffer.alloc(0);
      let expectedLength = null;
      
      socket.on('data', async (chunk) => {
        try {
          // Accumulate data in buffer
          dataBuffer = Buffer.concat([dataBuffer, chunk]);
          
          // Process complete messages
          while (dataBuffer.length > 0) {
            // If we don't know the expected length, try to read it from the first 4 bytes
            if (expectedLength === null) {
              if (dataBuffer.length >= 4) {
                expectedLength = dataBuffer.readUInt32BE(0);
                dataBuffer = dataBuffer.slice(4);
              } else {
                break; // Need more data to read length
              }
            }
            
            // If we have the complete message
            if (dataBuffer.length >= expectedLength) {
              const messageData = dataBuffer.slice(0, expectedLength);
              dataBuffer = dataBuffer.slice(expectedLength);
              expectedLength = null;
              
              // Process the complete message
              await this.handleSyncMessage(messageData, socket);
              
              if (!hasReceivedResponse) {
                hasReceivedResponse = true;
                resolve({ type: 'response' });
              }
            } else {
              break; // Need more data for complete message
            }
          }
        } catch (error) {
          console.error('Error handling client data:', error);
          dataBuffer = Buffer.alloc(0);
          expectedLength = null;
        }
      });
      
      socket.on('close', () => {
        if (!hasReceivedResponse) {
          resolve({ type: 'closed' });
        }
      });
      
      socket.on('error', (error) => {
        console.error(`Connection error with peer ${peer.deviceId}:`, error);
        reject(error);
      });
      
      setTimeout(() => {
        if (!socket.destroyed) {
          socket.destroy();
        }
        if (!hasReceivedResponse) {
          reject(new Error('Sync timeout'));
        }
      }, 15000); // 15 second timeout (increased)
    });
  }

  handleFileListRequest(message, socket) {
    // Respond with our file list
    console.log(`Received file list request from ${message.deviceId}`);
    const fileList = Array.from(this.files.values()).map(file => ({
      fileName: file.fileName,
      contentHash: file.contentHash,
      fileSize: file.fileSize,
      lastModified: file.lastModified
    }));
    
    const response = {
      type: 'fileListResponse',
      files: fileList,
      deviceId: this.deviceId
    };
    
    console.log(`Sending file list response with ${fileList.length} files`);
    this.sendMessage(socket, response);
  }

  async handleFileListResponse(message, socket) {
    console.log(`Received file list response from ${message.deviceId} with ${message.files.length} files`);
    
    // Check which files we don't have and request them
    for (const remoteFile of message.files) {
      if (!this.files.has(remoteFile.contentHash)) {
        console.log(`Requesting missing file: ${remoteFile.fileName} (${remoteFile.contentHash})`);
        
        // Request the file
        const fileRequest = {
          type: 'fileRequest',
          fileHash: remoteFile.contentHash,
          deviceId: this.deviceId
        };
        
        this.sendMessage(socket, fileRequest);
      } else {
        console.log(`File already exists: ${remoteFile.fileName}`);
      }
    }
  }

  handleFileRequest(message, socket) {
    const { fileHash } = message;
    console.log(`Received file request for hash: ${fileHash}`);
    
    if (this.files.has(fileHash)) {
      const file = this.files.get(fileHash);
      console.log(`Sending file: ${file.fileName}`);
      
      const response = {
        type: 'fileData',
        fileHash: fileHash,
        fileName: file.fileName,
        fileSize: file.fileSize,
        data: file.encryptedContent.toString('base64')
      };
      
      this.sendMessage(socket, response);
    } else {
      console.log(`File not found for hash: ${fileHash}`);
      const response = {
        type: 'fileNotFound',
        fileHash: fileHash
      };
      
      this.sendMessage(socket, response);
    }
  }

  async handleFileData(message, socket) {
    // Handle incoming file data from peer
    const { fileHash, fileName, data } = message;
    console.log(`Received file data: ${fileName} (${fileHash})`);
    
    try {
      const encryptedContent = Buffer.from(data, 'base64');
      const decryptedContent = this.decryptData(encryptedContent);
      
      // Verify hash
      const hash = crypto.createHash('sha256');
      hash.update(decryptedContent);
      const verifyHash = hash.digest('hex');
      
      if (verifyHash === fileHash) {
        // Store received file
        this.files.set(fileHash, {
          fileName: fileName,
          contentHash: fileHash,
          fileSize: decryptedContent.length,
          encryptedContent: encryptedContent,
          receivedFrom: 'peer',
          receivedAt: new Date().toISOString()
        });
        
        // Save decrypted file to sync directory
        await this.saveFileToSyncDirectory(fileName, decryptedContent, fileHash);
        
        console.log(`Successfully received and saved file: ${fileName}`);
        this.emit('fileReceived', { fileName, fileHash });
        
        // Trigger sync with other peers to share the received file
        setTimeout(() => {
          this.syncWithPeers();
        }, 1000);
      } else {
        console.error('File hash verification failed for file:', fileName);
      }
    } catch (error) {
      console.error('Error processing received file:', error);
    }
  }

  async shutdown() {
    try {
      this.isRunning = false;
      
      // Clear discovery timer
      if (this.discoveryTimer) {
        clearInterval(this.discoveryTimer);
        this.discoveryTimer = null;
      }
      
      // Clear sync timer
      if (this.syncTimer) {
        clearInterval(this.syncTimer);
        this.syncTimer = null;
      }
      
      // Close discovery socket
      if (this.discoverySocket) {
        this.discoverySocket.close();
        this.discoverySocket = null;
      }
      
      // Close sync server
      if (this.server) {
        this.server.close();
        this.server = null;
      }
      
      // Clear peers and files
      this.peers.clear();
      this.files.clear();
      this.syncQueue = [];
      this.activeSessions.clear();
      
      this.isInitialized = false;
      this.masterKey = null;
      
      console.log('Zero-Knowledge Sync shutdown complete');
      this.emit('shutdown');
      
    } catch (error) {
      console.error('Error during sync shutdown:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      deviceId: this.deviceId,
      peerCount: this.peers.size,
      fileCount: this.files.size,
      activeSessions: this.activeSessions.size,
      syncQueueLength: this.syncQueue.length,
      stats: {
        filesInSync: this.files.size,
        activeSessions: this.activeSessions.size,
        totalSyncSize: Array.from(this.files.values()).reduce((total, file) => total + (file.fileSize || 0), 0)
      }
    };
  }

  getPeers() {
    return Array.from(this.peers.values());
  }

  getFiles() {
    return Array.from(this.files.values()).map(file => ({
      fileName: file.fileName,
      contentHash: file.contentHash,
      fileSize: file.fileSize,
      lastModified: file.lastModified,
      addedToSync: file.addedToSync,
      receivedFrom: file.receivedFrom,
      receivedAt: file.receivedAt,
      syncedPath: file.syncedPath
    }));
  }

  // Save a file to the sync directory
  async saveFileToSyncDirectory(fileName, fileContent, fileHash) {
    try {
      if (!this.syncDirectory) {
        throw new Error('Sync directory not initialized');
      }

      // Create a safe filename
      const safeFileName = this.sanitizeFileName(fileName);
      const filePath = path.join(this.syncDirectory, safeFileName);
      
      // If file with same name exists, add hash suffix
      let finalPath = filePath;
      if (fs.existsSync(finalPath)) {
        const ext = path.extname(safeFileName);
        const base = path.basename(safeFileName, ext);
        finalPath = path.join(this.syncDirectory, `${base}_${fileHash.substring(0, 8)}${ext}`);
      }

      // Write the file
      fs.writeFileSync(finalPath, fileContent);
      
      // Update file record with local path
      if (this.files.has(fileHash)) {
        this.files.get(fileHash).syncedPath = finalPath;
      }

      console.log(`File saved to sync directory: ${finalPath}`);
      return finalPath;
    } catch (error) {
      console.error('Error saving file to sync directory:', error);
      throw error;
    }
  }

  // Sanitize filename for safe storage
  sanitizeFileName(fileName) {
    return fileName.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
  }

  // Get file content by hash (for downloading)
  async getFileContent(fileHash) {
    try {
      if (!this.files.has(fileHash)) {
        throw new Error('File not found in sync registry');
      }

      const file = this.files.get(fileHash);
      
      // If we have the encrypted content, decrypt it
      if (file.encryptedContent) {
        return this.decryptData(file.encryptedContent);
      }
      
      // If we have a synced path, read from disk
      if (file.syncedPath && fs.existsSync(file.syncedPath)) {
        return fs.readFileSync(file.syncedPath);
      }

      throw new Error('File content not available');
    } catch (error) {
      console.error('Error getting file content:', error);
      throw error;
    }
  }

  // Delete a file from sync
  async removeFileFromSync(fileHash) {
    try {
      if (!this.files.has(fileHash)) {
        throw new Error('File not found in sync registry');
      }

      const file = this.files.get(fileHash);
      
      // Remove from local sync directory if exists
      if (file.syncedPath && fs.existsSync(file.syncedPath)) {
        fs.unlinkSync(file.syncedPath);
      }

      // Remove from registry
      this.files.delete(fileHash);
      
      console.log(`File removed from sync: ${file.fileName}`);
      this.emit('fileRemoved', { fileName: file.fileName, fileHash });
      
      return true;
    } catch (error) {
      console.error('Error removing file from sync:', error);
      throw error;
    }
  }

  // Get sync directory path
  getSyncDirectory() {
    return this.syncDirectory;
  }
}

module.exports = ZeroKnowledgeSync;