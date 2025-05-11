const { io } = require('socket.io-client');
const log = require('electron-log');
const os = require('os');

/**
 * Socket communication manager for agent
 */
class SocketManager {
  /**
   * Constructor
   * @param {Object} config - Socket configuration
   * @param {string} config.serverUrl - Server URL
   * @param {string} config.agentId - Agent ID
   * @param {string} config.agentKey - Agent key for authentication
   */
  constructor(config) {
    this.config = config;
    this.socket = null;
    this.connected = false;
    this.reconnecting = false;
    this.eventHandlers = {};
    
    log.info('SocketManager initialized with config:', {
      serverUrl: config.serverUrl,
      agentId: config.agentId
    });
  }
  
  /**
   * Connect to the server
   */
  connect() {
    if (this.socket) {
      log.info('Socket already exists, disconnecting first');
      this.socket.disconnect();
    }
    
    log.info(`Connecting to server at ${this.config.serverUrl}`);
    
    this.socket = io(this.config.serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });
    
    // Connection event
    this.socket.on('connect', () => {
      log.info('Socket connected, registering agent');
      this.connected = true;
      
      // Register agent
      this.socket.emit('agent:register', {
        agentId: this.config.agentId,
        agentKey: this.config.agentKey,
        platform: os.platform(),
        version: process.version
      });
      
      // Trigger connect event
      this._triggerEvent('connect');
    });
    
    // Disconnection event
    this.socket.on('disconnect', (reason) => {
      log.info(`Socket disconnected: ${reason}`);
      this.connected = false;
      
      // Trigger disconnect event
      this._triggerEvent('disconnect', reason);
    });
    
    // Error event
    this.socket.on('error', (error) => {
      log.error('Socket error:', error);
      
      // Trigger error event
      this._triggerEvent('error', error);
    });
    
    // Agent registration confirmation
    this.socket.on('agent:registered', (data) => {
      log.info('Agent registered:', data);
      
      // Trigger registered event
      this._triggerEvent('registered', data);
    });
    
    // New job
    this.socket.on('job:new', (job) => {
      log.info('New job received:', job.jobId);
      
      // Trigger job event
      this._triggerEvent('job', job);
    });
    
    // Job cancellation
    this.socket.on('job:cancel', (data) => {
      log.info('Job cancelled:', data.jobId);
      
      // Trigger job cancel event
      this._triggerEvent('job-cancel', data);
    });
  }
  
  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      log.info('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
  
  /**
   * Reconnect to the server
   */
  reconnect() {
    log.info('Reconnecting to server');
    this.disconnect();
    this.connect();
  }
  
  /**
   * Send heartbeat to server
   * @param {Object} data - Heartbeat data
   */
  sendHeartbeat(data) {
    if (!this.connected || !this.socket) return;
    
    this.socket.emit('agent:heartbeat', {
      agentId: this.config.agentId,
      ...data
    });
  }
  
  /**
   * Send job result to server
   * @param {string} jobId - Job ID
   * @param {boolean} success - Whether job succeeded
   * @param {string} output - Job output (if successful)
   * @param {string} error - Error message (if failed)
   */
  sendJobResult(jobId, success, output, error) {
    if (!this.connected || !this.socket) {
      log.warn('Cannot send job result: not connected');
      return;
    }
    
    log.info(`Sending job result for ${jobId}: ${success ? 'SUCCESS' : 'FAILURE'}`);
    
    this.socket.emit('job:result', {
      jobId,
      agentId: this.config.agentId,
      success,
      output,
      error
    });
  }
  
  /**
   * Check if socket is connected
   * @returns {boolean} - Connection status
   */
  isConnected() {
    return this.connected;
  }
  
  /**
   * Update socket configuration
   * @param {Object} config - New configuration
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config };
    log.info('Socket configuration updated');
  }
  
  /**
   * Add event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {Function} - Function to remove handler
   */
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    
    this.eventHandlers[event].push(handler);
    
    return () => {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    };
  }
  
  /**
   * Trigger event for all handlers
   * @private
   * @param {string} event - Event name
   * @param {...any} args - Event arguments
   */
  _triggerEvent(event, ...args) {
    if (this.eventHandlers[event]) {
      for (const handler of this.eventHandlers[event]) {
        try {
          handler(...args);
        } catch (error) {
          log.error(`Error in ${event} event handler:`, error);
        }
      }
    }
  }
}

module.exports = { SocketManager };