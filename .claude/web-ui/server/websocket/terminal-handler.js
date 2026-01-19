class TerminalHandler {
  constructor(claudeService, fileWatcher) {
    this.claudeService = claudeService;
    this.fileWatcher = fileWatcher;
    this.connections = new Map(); // ws -> { sessionId, unsubscribe, pingInterval, unsubscribeError }

    // Listen for session-error events from claudeService
    this.claudeService.on('session-error', (sessionId, error) => {
      this.broadcastSessionError(sessionId, error);
    });
  }

  /**
   * Broadcast session error to relevant WebSocket connections
   * @param {string|null} sessionId
   * @param {Error} error
   */
  broadcastSessionError(sessionId, error) {
    for (const [ws, conn] of this.connections) {
      // Send to connections with matching session or no session (for pre-session errors)
      if (!sessionId || conn.sessionId === sessionId || !conn.sessionId) {
        if (ws.readyState === 1) { // WebSocket.OPEN
          ws.send(JSON.stringify({
            type: 'session-error',
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR'
          }));
        }
      }
    }
  }

  /**
   * Handle new WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   * @param {http.IncomingMessage} req - HTTP request
   */
  handleConnection(ws, req) {
    console.log('[WS] New WebSocket connection');

    // Parse URL for session ID if reconnecting
    const url = new URL(req.url, `http://${req.headers.host}`);
    const existingSessionId = url.searchParams.get('sessionId');

    // Set up heartbeat ping/pong to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.ping();
      }
    }, 30000); // Ping every 30 seconds

    ws.on('pong', () => {
      // Connection is alive - optionally log for debugging
      // console.log('[WS] Pong received');
    });

    // Track this connection
    this.connections.set(ws, {
      sessionId: existingSessionId || null,
      unsubscribe: null,
      pingInterval
    });

    // Handle messages from client
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (err) {
        console.error('[WS] Error parsing WebSocket message:', err);
      }
    });

    // Handle connection close
    ws.on('close', (code, reason) => {
      console.log(`[WS] WebSocket connection closed (code: ${code}, reason: ${reason || 'none'})`);
      const conn = this.connections.get(ws);
      if (conn) {
        if (conn.unsubscribe) {
          conn.unsubscribe();
        }
        if (conn.pingInterval) {
          clearInterval(conn.pingInterval);
        }
      }
      this.connections.delete(ws);
    });

    // Handle errors
    ws.on('error', (err) => {
      console.error('[WS] WebSocket error:', err);
    });

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      terminalMode: this.claudeService.getTerminalMode(),
      claudeAvailable: this.claudeService.checkClaudeAvailable()
    }));

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

    let session;
    try {
      // Create new session
      session = this.claudeService.createSession({
        planPath: payload.planPath,
        planMode: payload.planMode
      });
    } catch (error) {
      // Send error to client
      ws.send(JSON.stringify({
        type: 'session-error',
        error: error.message,
        code: error.code || 'SESSION_CREATE_FAILED'
      }));
      return;
    }

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

    // Listen for session errors
    const errorHandler = (sessionId, error) => {
      if (sessionId === session.id && ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'session-error',
          error: error.message,
          code: error.code || 'SESSION_ERROR'
        }));
      }
    };

    this.claudeService.on('session-exit', exitHandler);
    this.claudeService.on('session-error', errorHandler);

    // Update connection tracking
    conn.sessionId = session.id;
    conn.unsubscribe = () => {
      unsubscribe();
      this.claudeService.removeListener('session-exit', exitHandler);
      this.claudeService.removeListener('session-error', errorHandler);
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
