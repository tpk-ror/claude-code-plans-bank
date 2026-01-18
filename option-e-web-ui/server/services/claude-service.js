const pty = require('node-pty');
const path = require('path');
const os = require('os');
const EventEmitter = require('events');

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
   * @returns {Object} Session info including id and pty instance
   */
  createSession(options = {}) {
    const sessionId = `session-${++this.sessionCounter}-${Date.now()}`;

    // Build command arguments
    const args = [...(this.config.args || [])];

    if (options.planPath) {
      args.push('--plan', options.planPath);
    }

    // Determine shell
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    const isWindows = os.platform() === 'win32';

    // Create the pty process
    // On Windows, we need to use cmd or powershell to launch claude
    // On Unix, we can launch claude directly
    let ptyProcess;

    if (isWindows) {
      // On Windows, launch claude through cmd
      ptyProcess = pty.spawn('cmd.exe', ['/c', this.config.command || 'claude', ...args], {
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
      // On Unix, launch claude directly
      ptyProcess = pty.spawn(this.config.command || 'claude', args, {
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
      pty: ptyProcess,
      planPath: options.planPath,
      createdAt: new Date().toISOString(),
      active: true
    };

    this.sessions.set(sessionId, session);

    // Handle process exit
    ptyProcess.onExit(({ exitCode, signal }) => {
      session.active = false;
      session.exitCode = exitCode;
      session.exitSignal = signal;
      this.emit('session-exit', sessionId, exitCode, signal);
    });

    this.emit('session-created', sessionId);
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
   * Write data to session's pty stdin
   * @param {string} sessionId
   * @param {string} data
   */
  write(sessionId, data) {
    const session = this.sessions.get(sessionId);
    if (session && session.active) {
      session.pty.write(data);
      return true;
    }
    return false;
  }

  /**
   * Resize the pty
   * @param {string} sessionId
   * @param {number} cols
   * @param {number} rows
   */
  resize(sessionId, cols, rows) {
    const session = this.sessions.get(sessionId);
    if (session && session.active) {
      session.pty.resize(cols, rows);
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
      session.pty.kill();
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
        session.pty.kill();
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
    if (session) {
      const disposable = session.pty.onData(callback);
      return () => disposable.dispose();
    }
    return () => {};
  }
}

module.exports = ClaudeService;
