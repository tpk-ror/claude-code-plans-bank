/**
 * WebSocket client for Claude Code Web UI
 */
class WebSocketClient {
  constructor() {
    this.ws = null;
    this.sessionId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.connected = false;
  }

  /**
   * Connect to WebSocket server
   * @returns {Promise<void>}
   */
  connect() {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}`;

      // Include session ID if reconnecting
      const fullUrl = this.sessionId ? `${url}?sessionId=${this.sessionId}` : url;

      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
        resolve();
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed', event.code, event.reason);
        this.connected = false;
        this.emit('disconnected', event);

        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * this.reconnectAttempts;
          console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
          setTimeout(() => this.connect(), delay);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
    });
  }

  /**
   * Handle incoming WebSocket message
   * @param {Object} message
   */
  handleMessage(message) {
    const { type, ...data } = message;

    switch (type) {
      case 'terminal-data':
        this.emit('terminal-data', data.data);
        break;

      case 'session-created':
        this.sessionId = data.sessionId;
        this.emit('session-created', data);
        break;

      case 'session-attached':
        this.emit('session-attached', data);
        break;

      case 'session-exit':
        this.emit('session-exit', data);
        break;

      case 'session-killed':
        this.sessionId = null;
        this.emit('session-killed');
        break;

      case 'plan-update':
        this.emit('plan-update', data);
        break;

      case 'error':
        this.emit('error', new Error(data.message));
        break;

      default:
        console.log('Unknown message type:', type);
    }
  }

  /**
   * Send message to server
   * @param {string} type
   * @param {Object} payload
   */
  send(type, payload = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    this.ws.send(JSON.stringify({ type, payload }));
  }

  /**
   * Create a new Claude session
   * @param {Object} options
   */
  createSession(options = {}) {
    this.send('create-session', options);
  }

  /**
   * Send terminal input
   * @param {string} data
   */
  sendInput(data) {
    this.send('terminal-input', { data });
  }

  /**
   * Send terminal resize
   * @param {number} cols
   * @param {number} rows
   */
  resize(cols, rows) {
    this.send('resize', { cols, rows });
  }

  /**
   * Kill current session
   */
  killSession() {
    this.send('kill-session');
  }

  /**
   * Register event listener
   * @param {string} event
   * @param {Function} callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event
   * @param  {...any} args
   */
  emit(event, ...args) {
    if (!this.listeners.has(event)) return;
    for (const callback of this.listeners.get(event)) {
      try {
        callback(...args);
      } catch (err) {
        console.error(`Error in ${event} listener:`, err);
      }
    }
  }

  /**
   * Close WebSocket connection
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Create global instance
window.wsClient = new WebSocketClient();
