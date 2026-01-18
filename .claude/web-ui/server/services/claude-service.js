const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const EventEmitter = require('events');

// Try to load node-pty, fall back to child_process if unavailable
let pty = null;
let usePty = false;

try {
  pty = require('node-pty');
  usePty = true;
  console.log('Using node-pty for terminal emulation');
} catch (err) {
  console.log('node-pty not available, using child_process fallback');
  console.log('Terminal features like resize may be limited');
}

class ClaudeService extends EventEmitter {
  constructor(projectDir, config) {
    super();
    this.projectDir = projectDir;
    this.config = config;
    this.sessions = new Map();
    this.sessionCounter = 0;
  }

  /**
   * Create a new Claude CLI session
   * @param {Object} options - Session options
   * @param {string} options.planPath - Optional path to plan file
   * @returns {Object} Session info including id and process instance
   */
  createSession(options = {}) {
    const sessionId = `session-${++this.sessionCounter}-${Date.now()}`;

    // Build command arguments
    const args = [...(this.config.args || [])];

    if (options.planPath) {
      args.push('--plan', options.planPath);
    }

    const command = this.config.command || 'claude';

    let session;

    if (usePty && pty) {
      session = this.createPtySession(sessionId, command, args, options);
    } else {
      session = this.createSpawnSession(sessionId, command, args, options);
    }

    this.sessions.set(sessionId, session);
    this.emit('session-created', sessionId);
    return session;
  }

  /**
   * Create session using node-pty (preferred)
   */
  createPtySession(sessionId, command, args, options) {
    const isWindows = os.platform() === 'win32';

    let ptyProcess;

    if (isWindows) {
      ptyProcess = pty.spawn('cmd.exe', ['/c', command, ...args], {
        name: 'xterm-256color',
        cols: 120,
        rows: 30,
        cwd: this.projectDir,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor'
        }
      });
    } else {
      ptyProcess = pty.spawn(command, args, {
        name: 'xterm-256color',
        cols: 120,
        rows: 30,
        cwd: this.projectDir,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor'
        }
      });
    }

    const session = {
      id: sessionId,
      process: ptyProcess,
      type: 'pty',
      planPath: options.planPath,
      createdAt: new Date().toISOString(),
      active: true,
      dataListeners: []
    };

    ptyProcess.onExit(({ exitCode, signal }) => {
      session.active = false;
      session.exitCode = exitCode;
      session.exitSignal = signal;
      this.emit('session-exit', sessionId, exitCode, signal);
    });

    return session;
  }

  /**
   * Create session using child_process.spawn (fallback)
   */
  createSpawnSession(sessionId, command, args, options) {
    const childProcess = spawn(command, args, {
      cwd: this.projectDir,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        FORCE_COLOR: '1'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const session = {
      id: sessionId,
      process: childProcess,
      type: 'spawn',
      planPath: options.planPath,
      createdAt: new Date().toISOString(),
      active: true,
      dataListeners: []
    };

    // Handle stdout
    childProcess.stdout.on('data', (data) => {
      for (const callback of session.dataListeners) {
        callback(data.toString());
      }
    });

    // Handle stderr (merge with stdout for terminal display)
    childProcess.stderr.on('data', (data) => {
      for (const callback of session.dataListeners) {
        callback(data.toString());
      }
    });

    // Handle exit
    childProcess.on('exit', (code, signal) => {
      session.active = false;
      session.exitCode = code;
      session.exitSignal = signal;
      this.emit('session-exit', sessionId, code, signal);
    });

    // Handle errors
    childProcess.on('error', (err) => {
      console.error(`Session ${sessionId} error:`, err);
      session.active = false;
      this.emit('session-error', sessionId, err);
    });

    return session;
  }

  /**
   * Get session by ID
   * @param {string} sessionId
   * @returns {Object|undefined}
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   * @returns {Array}
   */
  getActiveSessions() {
    return Array.from(this.sessions.values()).filter(s => s.active);
  }

  /**
   * Write data to session's stdin
   * @param {string} sessionId
   * @param {string} data
   */
  write(sessionId, data) {
    const session = this.sessions.get(sessionId);
    if (session && session.active) {
      if (session.type === 'pty') {
        session.process.write(data);
      } else {
        session.process.stdin.write(data);
      }
      return true;
    }
    return false;
  }

  /**
   * Resize the terminal (only works with pty)
   * @param {string} sessionId
   * @param {number} cols
   * @param {number} rows
   */
  resize(sessionId, cols, rows) {
    const session = this.sessions.get(sessionId);
    if (session && session.active && session.type === 'pty') {
      session.process.resize(cols, rows);
      return true;
    }
    return false;
  }

  /**
   * Kill a specific session
   * @param {string} sessionId
   */
  killSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session && session.active) {
      if (session.type === 'pty') {
        session.process.kill();
      } else {
        session.process.kill('SIGTERM');
      }
      session.active = false;
      this.emit('session-killed', sessionId);
      return true;
    }
    return false;
  }

  /**
   * Kill all sessions
   */
  killAll() {
    for (const [sessionId, session] of this.sessions) {
      if (session.active) {
        if (session.type === 'pty') {
          session.process.kill();
        } else {
          session.process.kill('SIGTERM');
        }
        session.active = false;
      }
    }
    this.sessions.clear();
  }

  /**
   * Subscribe to session output
   * @param {string} sessionId
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  onData(sessionId, callback) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return () => {};
    }

    if (session.type === 'pty') {
      const disposable = session.process.onData(callback);
      return () => disposable.dispose();
    } else {
      // For spawn sessions, add callback to listeners array
      session.dataListeners.push(callback);
      return () => {
        const index = session.dataListeners.indexOf(callback);
        if (index > -1) {
          session.dataListeners.splice(index, 1);
        }
      };
    }
  }
}

module.exports = ClaudeService;
