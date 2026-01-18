class TerminalHandler {
  constructor(claudeService, fileWatcher) {
    this.claudeService = claudeService;
    this.fileWatcher = fileWatcher;
    this.connections = new Map(); // ws -> { sessionId, unsubscribe }
  }

  /**
   * Handle new WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   * @param {http.IncomingMessage} req - HTTP request
   */
  handleConnection(ws, req) {
    console.log('New WebSocket connection');

    // Parse URL for session ID if reconnecting
    const url = new URL(req.url, `http://${req.headers.host}`);
    const existingSessionId = url.searchParams.get('sessionId');

    // Track this connection
    this.connections.set(ws, {
      sessionId: existingSessionId || null,
      unsubscribe: null
    });

    // Handle messages from client
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    });

    // Handle connection close
    ws.on('close', () => {
      const conn = this.connections.get(ws);
      if (conn && conn.unsubscribe) {
        conn.unsubscribe();
      }
      this.connections.delete(ws);
      console.log('WebSocket connection closed');
    });

    // Handle errors
    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });

    // If reconnecting to existing session, reattach
    if (existingSessionId) {
      this.attachToSession(ws, existingSessionId);
    }
  }

  /**
   * Handle incoming WebSocket message
   * @param {WebSocket} ws
   * @param {Object} message
   */
  handleMessage(ws, message) {
    const { type, payload } = message;

    switch (type) {
      case 'create-session':
        this.createSession(ws, payload);
        break;

      case 'terminal-input':
        this.handleTerminalInput(ws, payload);
        break;

      case 'resize':
        this.handleResize(ws, payload);
        break;

      case 'kill-session':
        this.killSession(ws);
        break;

      default:
        console.warn('Unknown message type:', type);
    }
  }

  /**
   * Create a new Claude session for this connection
   * @param {WebSocket} ws
   * @param {Object} payload - Session options
   */
  createSession(ws, payload = {}) {
    const conn = this.connections.get(ws);

    // Clean up existing session if any
    if (conn && conn.sessionId) {
      if (conn.unsubscribe) {
        conn.unsubscribe();
      }
      this.claudeService.killSession(conn.sessionId);
    }

    // Create new session
    const session = this.claudeService.createSession({
      planPath: payload.planPath
    });

    // Subscribe to session output
    const unsubscribe = this.claudeService.onData(session.id, (data) => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(JSON.stringify({
          type: 'terminal-data',
          data
        }));
      }
    });

    // Listen for session exit
    const exitHandler = (sessionId, exitCode, signal) => {
      if (sessionId === session.id && ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'session-exit',
          exitCode,
          signal
        }));
      }
    };

    this.claudeService.on('session-exit', exitHandler);

    // Update connection tracking
    conn.sessionId = session.id;
    conn.unsubscribe = () => {
      unsubscribe();
      this.claudeService.removeListener('session-exit', exitHandler);
    };

    // Send session info to client
    ws.send(JSON.stringify({
      type: 'session-created',
      sessionId: session.id,
      planPath: session.planPath
    }));
  }

  /**
   * Attach to an existing session
   * @param {WebSocket} ws
   * @param {string} sessionId
   */
  attachToSession(ws, sessionId) {
    const session = this.claudeService.getSession(sessionId);
    const conn = this.connections.get(ws);

    if (!session || !session.active) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Session not found or inactive'
      }));
      return;
    }

    // Subscribe to session output
    const unsubscribe = this.claudeService.onData(sessionId, (data) => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'terminal-data',
          data
        }));
      }
    });

    conn.sessionId = sessionId;
    conn.unsubscribe = unsubscribe;

    ws.send(JSON.stringify({
      type: 'session-attached',
      sessionId
    }));
  }

  /**
   * Handle terminal input from client
   * @param {WebSocket} ws
   * @param {Object} payload
   */
  handleTerminalInput(ws, payload) {
    const conn = this.connections.get(ws);

    if (!conn || !conn.sessionId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'No active session'
      }));
      return;
    }

    this.claudeService.write(conn.sessionId, payload.data);
  }

  /**
   * Handle terminal resize
   * @param {WebSocket} ws
   * @param {Object} payload
   */
  handleResize(ws, payload) {
    const conn = this.connections.get(ws);

    if (conn && conn.sessionId) {
      this.claudeService.resize(conn.sessionId, payload.cols, payload.rows);
    }
  }

  /**
   * Kill the session for this connection
   * @param {WebSocket} ws
   */
  killSession(ws) {
    const conn = this.connections.get(ws);

    if (conn && conn.sessionId) {
      if (conn.unsubscribe) {
        conn.unsubscribe();
        conn.unsubscribe = null;
      }

      this.claudeService.killSession(conn.sessionId);
      conn.sessionId = null;

      ws.send(JSON.stringify({
        type: 'session-killed'
      }));
    }
  }
}

module.exports = TerminalHandler;
