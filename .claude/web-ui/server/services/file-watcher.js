const chokidar = require('chokidar');
const path = require('path');
const EventEmitter = require('events');

class FileWatcher extends EventEmitter {
  constructor(plansDir) {
    super();
    this.plansDir = plansDir;
    this.watcher = null;
    this.debounceTimers = new Map();
    this.debounceMs = 100; // Debounce rapid changes
  }

  /**
   * Start watching the plans directory
   */
  start() {
    if (this.watcher) {
      return;
    }

    this.watcher = chokidar.watch(this.plansDir, {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    });

    this.watcher
      .on('add', (filePath) => this.handleEvent('add', filePath))
      .on('change', (filePath) => this.handleEvent('change', filePath))
      .on('unlink', (filePath) => this.handleEvent('unlink', filePath))
      .on('error', (error) => {
        console.error('File watcher error:', error);
        this.emit('error', error);
      });

    console.log(`📁 Watching for plan changes in: ${this.plansDir}`);
  }

  /**
   * Handle file system events with debouncing
   * @param {string} event - Event type (add, change, unlink)
   * @param {string} filePath - Full path to file
   */
  handleEvent(event, filePath) {
    // Only track markdown files
    if (!filePath.endsWith('.md')) {
      return;
    }

    const filename = path.basename(filePath);

    // Skip archive folder
    if (filePath.includes('/archive/') || filePath.includes('\\archive\\')) {
      return;
    }

    // Debounce rapid changes to the same file
    const key = `${event}:${filename}`;

    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);
      this.emit('change', event, filename);

      // Also emit specific events
      this.emit(event, filename);
    }, this.debounceMs);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Stop watching
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;

      // Clear all pending timers
      for (const timer of this.debounceTimers.values()) {
        clearTimeout(timer);
      }
      this.debounceTimers.clear();

      console.log('📁 File watcher stopped');
    }
  }

  /**
   * Check if watcher is running
   * @returns {boolean}
   */
  isRunning() {
    return this.watcher !== null;
  }
}

module.exports = FileWatcher;
