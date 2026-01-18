/**
 * Terminal manager using xterm.js
 */
class TerminalManager {
  constructor(containerId, wsClient) {
    this.containerId = containerId;
    this.wsClient = wsClient;
    this.terminal = null;
    this.fitAddon = null;
    this.hasSession = false;
    this.initialized = false;
  }

  /**
   * Initialize the terminal
   */
  init() {
    if (this.initialized) return;

    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error('Terminal container not found:', this.containerId);
      return;
    }

    // Create xterm instance
    this.terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: this.getTheme(),
      allowTransparency: true,
      scrollback: 10000,
      convertEol: true
    });

    // Initialize fit addon
    this.fitAddon = new FitAddon.FitAddon();
    this.terminal.loadAddon(this.fitAddon);

    // Open terminal in container
    this.terminal.open(container);

    // Fit to container
    this.fit();

    // Handle terminal input
    this.terminal.onData((data) => {
      if (this.hasSession) {
        this.wsClient.sendInput(data);
      }
    });

    // Handle resize
    this.terminal.onResize(({ cols, rows }) => {
      if (this.hasSession) {
        this.wsClient.resize(cols, rows);
      }
    });

    // Setup WebSocket event listeners
    this.setupWebSocketListeners();

    // Handle window resize
    window.addEventListener('resize', () => this.fit());

    // Handle theme changes
    document.body.addEventListener('themechange', () => {
      this.terminal.options.theme = this.getTheme();
    });

    this.initialized = true;
    console.log('Terminal initialized');
  }

  /**
   * Get terminal theme based on current mode
   */
  getTheme() {
    const isDark = document.body.classList.contains('dark-mode');

    if (isDark) {
      return {
        background: '#1a1a1a',
        foreground: '#e4e4e4',
        cursor: '#e4e4e4',
        cursorAccent: '#1a1a1a',
        selectionBackground: 'rgba(99, 102, 241, 0.3)',
        black: '#1a1a1a',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#e4e4e4',
        brightBlack: '#707070',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff'
      };
    } else {
      return {
        background: '#fafafa',
        foreground: '#1a1a1a',
        cursor: '#1a1a1a',
        cursorAccent: '#fafafa',
        selectionBackground: 'rgba(99, 102, 241, 0.2)',
        black: '#1a1a1a',
        red: '#dc2626',
        green: '#16a34a',
        yellow: '#ca8a04',
        blue: '#2563eb',
        magenta: '#9333ea',
        cyan: '#0891b2',
        white: '#fafafa',
        brightBlack: '#555555',
        brightRed: '#ef4444',
        brightGreen: '#22c55e',
        brightYellow: '#eab308',
        brightBlue: '#3b82f6',
        brightMagenta: '#a855f7',
        brightCyan: '#06b6d4',
        brightWhite: '#ffffff'
      };
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  setupWebSocketListeners() {
    // Terminal output from server
    this.wsClient.on('terminal-data', (data) => {
      if (this.terminal) {
        this.terminal.write(data);
      }
    });

    // Session created
    this.wsClient.on('session-created', (data) => {
      this.hasSession = true;
      this.showTerminal();
      this.terminal.focus();

      // Send initial size
      this.fit();
      this.wsClient.resize(this.terminal.cols, this.terminal.rows);
    });

    // Session attached (reconnection)
    this.wsClient.on('session-attached', () => {
      this.hasSession = true;
      this.showTerminal();
    });

    // Session ended
    this.wsClient.on('session-exit', ({ exitCode }) => {
      this.hasSession = false;
      this.terminal.writeln(`\r\n\r\n[Session ended with exit code ${exitCode}]\r\n`);
    });

    // Session killed
    this.wsClient.on('session-killed', () => {
      this.hasSession = false;
      this.terminal.writeln('\r\n\r\n[Session terminated]\r\n');
    });
  }

  /**
   * Fit terminal to container
   */
  fit() {
    if (this.fitAddon && this.terminal) {
      try {
        this.fitAddon.fit();
      } catch (err) {
        // Ignore fit errors (container might not be visible)
      }
    }
  }

  /**
   * Start a new Claude session
   * @param {Object} options
   */
  startSession(options = {}) {
    this.terminal.clear();
    this.terminal.focus();
    this.wsClient.createSession(options);
  }

  /**
   * End current session
   */
  endSession() {
    this.wsClient.killSession();
    this.hasSession = false;
  }

  /**
   * Show terminal (hide placeholder)
   */
  showTerminal() {
    const placeholder = document.getElementById('terminalPlaceholder');
    if (placeholder) {
      placeholder.classList.add('hidden');
    }
  }

  /**
   * Show placeholder (hide terminal)
   */
  showPlaceholder() {
    const placeholder = document.getElementById('terminalPlaceholder');
    if (placeholder) {
      placeholder.classList.remove('hidden');
    }
  }

  /**
   * Focus the terminal
   */
  focus() {
    if (this.terminal) {
      this.terminal.focus();
    }
  }

  /**
   * Write text to terminal
   * @param {string} text
   */
  write(text) {
    if (this.terminal) {
      this.terminal.write(text);
    }
  }

  /**
   * Clear the terminal
   */
  clear() {
    if (this.terminal) {
      this.terminal.clear();
    }
  }

  /**
   * Check if terminal has active session
   * @returns {boolean}
   */
  hasActiveSession() {
    return this.hasSession;
  }

  /**
   * Dispose terminal
   */
  dispose() {
    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = null;
    }
  }
}

// Create global instance
window.terminalManager = null;
