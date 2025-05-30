const WebSocket = require('ws');
const EventEmitter = require('events');

/**
 * P2P Network Manager for Zero-Knowledge Sync
 * Handles peer discovery, connection management, and data transfer
 */
class P2PNetworkManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.port = options.port || 47124;
    this.deviceId = options.deviceId;
    this.maxPeers = options.maxPeers || 10;
    
    this.server = null;
    this.connections = new Map();
    this.connectionAttempts = new Map();
    this.messageHandlers = new Map();
    
    this.setupMessageHandlers();
  }

  /**
   * Start the P2P network server
   */
  async start() {
    try {
      this.server = new WebSocket.Server({ 
        port: this.port,
        perMessageDeflate: false
      });
      
      this.server.on('connection', (ws, req) => {
        this.handleIncomingConnection(ws, req);
      });
      
      this.server.on('error', (error) => {
        console.error('P2P Server error:', error);
        this.emit('error', error);
      });
      
      console.log(`P2P Network started on port ${this.port}`);
      this.emit('started');
      
    } catch (error) {
      console.error('Failed to start P2P network:', error);
      throw error;
    }
  }

  /**
   * Stop the P2P network
   */
  async stop() {
    // Close all connections
    for (const [deviceId, connection] of this.connections) {
      try {
        connection.ws.close();
      } catch (error) {
        console.warn(`Error closing connection to ${deviceId}:`, error.message);
      }
    }
    
    this.connections.clear();
    this.connectionAttempts.clear();
    
    // Close server
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    
    this.emit('stopped');
  }

  /**
   * Connect to a peer
   */
  async connectToPeer(peerInfo) {
    const { deviceId, address, port } = peerInfo;
    
    if (this.connections.has(deviceId)) {
      return this.connections.get(deviceId);
    }
    
    // Prevent multiple connection attempts to same peer
    if (this.connectionAttempts.has(deviceId)) {
      return null;
    }
    
    this.connectionAttempts.set(deviceId, true);
    
    try {
      const wsUrl = `ws://${address}:${port || this.port}`;
      const ws = new WebSocket(wsUrl);
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          this.connectionAttempts.delete(deviceId);
          reject(new Error('Connection timeout'));
        }, 10000);
        
        ws.on('open', () => {
          clearTimeout(timeout);
          this.connectionAttempts.delete(deviceId);
          
          const connection = this.setupConnection(ws, peerInfo);
          this.connections.set(deviceId, connection);
          
          // Send handshake
          this.sendMessage(deviceId, 'handshake', {
            deviceId: this.deviceId,
            version: '1.0',
            capabilities: ['sync', 'encryption']
          });
          
          this.emit('peerConnected', peerInfo);
          resolve(connection);
        });
        
        ws.on('error', (error) => {
          clearTimeout(timeout);
          this.connectionAttempts.delete(deviceId);
          reject(error);
        });
      });
      
    } catch (error) {
      this.connectionAttempts.delete(deviceId);
      throw error;
    }
  }

  /**
   * Handle incoming connection
   */
  handleIncomingConnection(ws, req) {
    const remoteAddress = req.socket.remoteAddress;
    
    // Setup temporary connection until handshake
    const tempId = `temp_${Date.now()}`;
    const connection = this.setupConnection(ws, { 
      address: remoteAddress,
      deviceId: tempId 
    });
    
    // Wait for handshake to identify peer
    connection.pendingHandshake = true;
    this.connections.set(tempId, connection);
    
    // Timeout for handshake
    const handshakeTimeout = setTimeout(() => {
      if (connection.pendingHandshake) {
        ws.close();
        this.connections.delete(tempId);
      }
    }, 10000);
    
    connection.handshakeTimeout = handshakeTimeout;
  }

  /**
   * Setup connection with event handlers
   */
  setupConnection(ws, peerInfo) {
    const connection = {
      ws,
      peerInfo,
      lastSeen: Date.now(),
      messageQueue: [],
      isReady: false
    };
    
    ws.on('message', (data) => {
      this.handleMessage(peerInfo.deviceId, data);
    });
    
    ws.on('close', () => {
      this.handleConnectionClosed(peerInfo.deviceId);
    });
    
    ws.on('error', (error) => {
      console.warn(`Connection error with ${peerInfo.deviceId}:`, error.message);
      this.handleConnectionError(peerInfo.deviceId, error);
    });
    
    ws.on('pong', () => {
      connection.lastSeen = Date.now();
    });
    
    return connection;
  }

  /**
   * Handle received message
   */
  handleMessage(deviceId, data) {
    try {
      const message = JSON.parse(data.toString());
      const handler = this.messageHandlers.get(message.type);
      
      if (handler) {
        handler(deviceId, message.payload, message);
      } else {
        console.warn(`Unknown message type: ${message.type}`);
      }
      
      // Update last seen
      const connection = this.connections.get(deviceId);
      if (connection) {
        connection.lastSeen = Date.now();
      }
      
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  /**
   * Send message to peer
   */
  sendMessage(deviceId, type, payload) {
    const connection = this.connections.get(deviceId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    const message = {
      type,
      payload,
      timestamp: Date.now(),
      from: this.deviceId
    };
    
    try {
      connection.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Failed to send message to ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Broadcast message to all connected peers
   */
  broadcast(type, payload, excludeDeviceId = null) {
    let sent = 0;
    
    for (const [deviceId, connection] of this.connections) {
      if (deviceId !== excludeDeviceId && !connection.pendingHandshake) {
        if (this.sendMessage(deviceId, type, payload)) {
          sent++;
        }
      }
    }
    
    return sent;
  }

  /**
   * Setup default message handlers
   */
  setupMessageHandlers() {
    this.messageHandlers.set('handshake', (deviceId, payload, message) => {
      this.handleHandshake(deviceId, payload, message);
    });
    
    this.messageHandlers.set('ping', (deviceId, payload) => {
      this.sendMessage(deviceId, 'pong', { timestamp: Date.now() });
    });
    
    this.messageHandlers.set('pong', (deviceId, payload) => {
      // Heartbeat handled in connection update
    });
    
    this.messageHandlers.set('sync-request', (deviceId, payload) => {
      this.emit('syncRequest', deviceId, payload);
    });
    
    this.messageHandlers.set('sync-data', (deviceId, payload) => {
      this.emit('syncData', deviceId, payload);
    });
    
    this.messageHandlers.set('file-chunk', (deviceId, payload) => {
      this.emit('fileChunk', deviceId, payload);
    });
  }

  /**
   * Handle handshake message
   */
  handleHandshake(deviceId, payload, message) {
    const fromDeviceId = payload.deviceId || message.from;
    
    // Find temporary connection
    let tempConnection = null;
    let tempId = null;
    
    for (const [id, conn] of this.connections) {
      if (conn.pendingHandshake && conn.ws === this.findConnectionByDeviceId(deviceId)?.ws) {
        tempConnection = conn;
        tempId = id;
        break;
      }
    }
    
    if (tempConnection) {
      // Clear handshake timeout
      if (tempConnection.handshakeTimeout) {
        clearTimeout(tempConnection.handshakeTimeout);
      }
      
      // Move connection to proper device ID
      tempConnection.pendingHandshake = false;
      tempConnection.isReady = true;
      tempConnection.peerInfo.deviceId = fromDeviceId;
      tempConnection.peerInfo.version = payload.version;
      tempConnection.peerInfo.capabilities = payload.capabilities;
      
      this.connections.delete(tempId);
      this.connections.set(fromDeviceId, tempConnection);
      
      this.emit('peerConnected', tempConnection.peerInfo);
      
      // Send handshake response if this was initial handshake
      if (!message.response) {
        this.sendMessage(fromDeviceId, 'handshake', {
          deviceId: this.deviceId,
          version: '1.0',
          capabilities: ['sync', 'encryption'],
          response: true
        });
      }
    }
  }

  /**
   * Handle connection closed
   */
  handleConnectionClosed(deviceId) {
    const connection = this.connections.get(deviceId);
    if (connection) {
      this.connections.delete(deviceId);
      this.emit('peerDisconnected', connection.peerInfo);
    }
  }

  /**
   * Handle connection error
   */
  handleConnectionError(deviceId, error) {
    const connection = this.connections.get(deviceId);
    if (connection) {
      this.emit('connectionError', connection.peerInfo, error);
      this.connections.delete(deviceId);
    }
  }

  /**
   * Find connection by device ID
   */
  findConnectionByDeviceId(deviceId) {
    return this.connections.get(deviceId);
  }

  /**
   * Get connected peers
   */
  getConnectedPeers() {
    return Array.from(this.connections.values())
      .filter(conn => !conn.pendingHandshake)
      .map(conn => conn.peerInfo);
  }

  /**
   * Start periodic heartbeat
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.performHeartbeat();
    }, 30000); // Every 30 seconds
  }

  /**
   * Perform heartbeat check
   */
  performHeartbeat() {
    const now = Date.now();
    const timeout = 90000; // 90 seconds
    
    // Send ping to all connections
    for (const [deviceId, connection] of this.connections) {
      if (!connection.pendingHandshake) {
        // Check if connection is stale
        if (now - connection.lastSeen > timeout) {
          console.log(`Connection to ${deviceId} timed out`);
          connection.ws.close();
          continue;
        }
        
        // Send ping
        this.sendMessage(deviceId, 'ping', { timestamp: now });
      }
    }
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Add custom message handler
   */
  addMessageHandler(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Remove message handler
   */
  removeMessageHandler(type) {
    this.messageHandlers.delete(type);
  }
}

module.exports = P2PNetworkManager;