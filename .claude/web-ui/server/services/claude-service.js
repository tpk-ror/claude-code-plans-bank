const { spawn, execSync } = require('child_process');
const path = require('path');
const os = require('os');
const EventEmitter = require('events');

// Try to load node-pty, fall back to child_process if unavailable
let pty = null;
let usePty = false;

try {
  pty = require('node-pty');
  usePty = true;
  console.log('[ClaudeService] Using node-pty for terminal emulation');
} catch (err) {
  console.log('[ClaudeService] node-pty not available, using child_process fallback');
  console.log('[ClaudeService] Terminal features like resize may be limited');
}

class ClaudeService extends EventEmitter {
  constructor(projectDir, config) {
    super();
    this.projectDir = projectDir;
    this.config = config;
    this.sessions = new Map();
    this.sessionCounter = 0;
    this.claudeAvailable = null; // Cache the check result
  }

  /**
   * Check if Claude CLI is available in PATH
   * @returns {boolean}
   */
  checkClaudeAvailable() {
    if (this.claudeAvailable !== null) {
      return this.claudeAvailable;
    }

    const command = this.config.command || 'claude';
    const isWindows = os.platform() === 'win32';

    try {
      if (isWindows) {
        execSync(`where ${command}`, { stdio: 'ignore' });
      } else {
        execSync(`which ${command}`, { stdio: 'ignore' });
      }
      this.claudeAvailable = true;
      console.log(`[ClaudeService] Claude CLI found: ${command}`);
      return true;
    } catch {
      this.claudeAvailable = false;
      console.error(`[ClaudeService] Claude CLI not found: ${command}`);
      return false;
    }
  }

  /**
   * Get terminal mode (pty or spawn)
   * @returns {string}
   */
  getTerminalMode() {
    return usePty ? 'pty' : 'spawn';
  }

  /**
   * Create a new Claude CLI session
   * @param {Object} options - Session options
   * @param {string} options.planPath - Optional path to plan file
   * @returns {Object} Session info including id and process instance
   */
  createSession(options = {}) {
    // Check if Claude CLI is available first
    if (!this.checkClaudeAvailable()) {
      const error = new Error(
        'Claude CLI not found in PATH. Please install it first: npm install -g @anthropic-ai/claude-code'
      );
      error.code = 'CLAUDE_NOT_FOUND';
      this.emit('session-error', null, error);
      throw error;
    }

    const sessionId = `session-${++this.sessionCounter}-${Date.now()}`;

    // Build command arguments
    const args = [...(this.config.args || [])];

    // Add --plan flag if planMode is enabled (starts Claude in plan mode)
    if (options.planMode) {
      args.push('--plan');
    }

    const command = this.config.command || 'claude';

    console.log(`[ClaudeService] Creating session ${sessionId} with command: ${command} ${args.join(' ')}`);
    console.log(`[ClaudeService] Working directory: ${this.projectDir}`);
    console.log(`[ClaudeService] Terminal mode: ${this.getTerminalMode()}`);

    let session;

    try {
      if (usePty && pty) {
        session = this.createPtySession(sessionId, command, args, options);
      } else {
        session = this.createSpawnSession(sessionId, command, args, options);
      }

      this.sessions.set(sessionId, session);
      this.emit('session-created', sessionId, session);
      console.log(`[ClaudeService] Session ${sessionId} created successfully`);
      return session;
    } catch (err) {
      console.error(`[ClaudeService] Failed to create session: ${err.message}`);
      this.emit('session-error', sessionId, err);
      throw err;
    }
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
      console.log(`[ClaudeService] PTY session ${sessionId} exited with code ${exitCode}, signal ${signal}`);
      session.active = false;
      session.exitCode = exitCode;
      session.exitSignal = signal;
      this.emit('session-exit', sessionId, exitCode, signal, session);
    });

    // Handle pty spawn errors
    try {
      // Test if the process started successfully by checking if it's active
      if (!ptyProcess.pid) {
        throw new Error('PTY process failed to start');
      }
    } catch (err) {
      console.error(`[ClaudeService] PTY session ${sessionId} error: ${err.message}`);
      session.active = false;
      this.emit('session-error', sessionId, err);
    }

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
      console.log(`[ClaudeService] Spawn session ${sessionId} exited with code ${code}, signal ${signal}`);
      session.active = false;
      session.exitCode = code;
      session.exitSignal = signal;
      this.emit('session-exit', sessionId, code, signal, session);
    });

    // Handle errors
    childProcess.on('error', (err) => {
      console.error(`[ClaudeService] Spawn session ${sessionId} error: ${err.message}`);
      session.active = false;
      this.emit('session-error', sessionId, err);
    });

    // Check if spawned successfully
    if (!childProcess.pid) {
      const err = new Error('Child process failed to start');
      console.error(`[ClaudeService] Spawn session ${sessionId} error: ${err.message}`);
      session.active = false;
      this.emit('session-error', sessionId, err);
    }

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
      this.emit('session-killed', sessionId, session);
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
