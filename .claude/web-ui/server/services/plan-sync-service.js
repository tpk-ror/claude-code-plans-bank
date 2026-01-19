const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const os = require('os');
const EventEmitter = require('events');

/**
 * PlanSyncService - One-way sync from Claude's internal plans to project directory
 *
 * Claude Code stores plans in ~/.claude/plans/ when using plan mode (Shift+Tab x2).
 * This service watches that directory and copies changes to the project's ./docs/plans/
 * so the web UI can display them in real-time.
 */
class PlanSyncService extends EventEmitter {
  constructor(projectPlansDir) {
    super();
    this.projectPlansDir = projectPlansDir;
    this.claudePlansDir = path.join(os.homedir(), '.claude', 'plans');
    this.watcher = null;
    this.activeSession = null;
    this.syncedFiles = new Map(); // Track synced files: claudePath -> projectPath
    this.debounceTimers = new Map();
    this.debounceMs = 200;
  }

  /**
   * Start watching Claude's plans directory
   */
  start() {
    if (this.watcher) {
      return;
    }

    // Ensure Claude's plans directory exists
    if (!fs.existsSync(this.claudePlansDir)) {
      fs.mkdirSync(this.claudePlansDir, { recursive: true });
    }

    // Use polling for better cross-filesystem compatibility (especially in WSL)
    this.watcher = chokidar.watch(this.claudePlansDir, {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      persistent: true,
      ignoreInitial: true, // We'll manually sync existing files
      usePolling: true, // More reliable in WSL and cross-filesystem scenarios
      interval: 1000, // Poll every 1 second
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      },
      depth: 0 // Only watch the plans directory, not subdirectories
    });

    this.watcher
      .on('add', (filePath) => this.handleFileEvent('add', filePath))
      .on('change', (filePath) => this.handleFileEvent('change', filePath))
      .on('unlink', (filePath) => this.handleFileEvent('unlink', filePath))
      .on('error', (error) => {
        console.error('Plan sync watcher error:', error);
        this.emit('error', error);
      });

    console.log(`🔄 Plan sync watching: ${this.claudePlansDir}`);

    // Sync all existing plans at startup
    this.syncAllExisting();
  }

  /**
   * Handle file system events with debouncing
   * @param {string} event - Event type (add, change, unlink)
   * @param {string} filePath - Full path to file in Claude's plans dir
   */
  handleFileEvent(event, filePath) {
    // Only process markdown files
    if (!filePath.endsWith('.md')) {
      return;
    }

    const filename = path.basename(filePath);

    // Debounce rapid changes
    const key = `${event}:${filename}`;
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);
      this.processFileEvent(event, filePath, filename);
    }, this.debounceMs);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Process a file event after debouncing
   * @param {string} event - Event type
   * @param {string} filePath - Full path to Claude's plan file
   * @param {string} filename - Just the filename
   */
  processFileEvent(event, filePath, filename) {
    console.log(`📝 Plan sync event: ${event} - ${filename}`);

    if (event === 'unlink') {
      // File was deleted from Claude's plans
      this.syncedFiles.delete(filePath);
      this.emit('sync', { event, filename, status: 'deleted' });
      return;
    }

    // For add/change events, copy to project directory
    this.syncFile(filePath, filename);
  }

  /**
   * Copy a plan file from Claude's directory to the project directory
   * @param {string} sourcePath - Path in ~/.claude/plans/
   * @param {string} filename - The filename
   */
  syncFile(sourcePath, filename) {
    try {
      // Read the source file
      const content = fs.readFileSync(sourcePath, 'utf8');

      // Determine target path in project directory
      const targetPath = path.join(this.projectPlansDir, filename);

      // Check if file already exists and content is the same
      if (fs.existsSync(targetPath)) {
        const existingContent = fs.readFileSync(targetPath, 'utf8');
        if (existingContent === content) {
          // No changes needed
          return;
        }
      }

      // Write to project directory
      fs.writeFileSync(targetPath, content, 'utf8');

      // Track the synced file
      this.syncedFiles.set(sourcePath, targetPath);

      console.log(`✅ Synced: ${filename}`);
      this.emit('sync', {
        event: 'synced',
        filename,
        sourcePath,
        targetPath,
        status: 'success'
      });
    } catch (err) {
      console.error(`❌ Sync failed for ${filename}:`, err.message);
      this.emit('sync', {
        event: 'error',
        filename,
        error: err.message,
        status: 'error'
      });
    }
  }

  /**
   * Set the active Claude session
   * Can be used to track which plan file is being actively edited
   * @param {Object} session - Session info from ClaudeService
   */
  setActiveSession(session) {
    this.activeSession = session;
    this.emit('session-change', session);
  }

  /**
   * Clear the active session
   */
  clearActiveSession() {
    this.activeSession = null;
    this.emit('session-change', null);
  }

  /**
   * Get list of all plan files in Claude's plans directory
   * @returns {Array} List of filenames
   */
  getClaudePlans() {
    try {
      if (!fs.existsSync(this.claudePlansDir)) {
        return [];
      }
      return fs.readdirSync(this.claudePlansDir)
        .filter(f => f.endsWith('.md'));
    } catch (err) {
      console.error('Error reading Claude plans directory:', err);
      return [];
    }
  }

  /**
   * Sync all existing plans from Claude's directory
   * Useful for initial sync when starting the server
   */
  syncAllExisting() {
    const plans = this.getClaudePlans();
    console.log(`🔄 Syncing ${plans.length} existing plans from Claude's directory`);

    for (const filename of plans) {
      const sourcePath = path.join(this.claudePlansDir, filename);
      this.syncFile(sourcePath, filename);
    }
  }

  /**
   * Get sync status
   * @returns {Object} Status info
   */
  getStatus() {
    return {
      running: this.watcher !== null,
      claudePlansDir: this.claudePlansDir,
      projectPlansDir: this.projectPlansDir,
      syncedFiles: Array.from(this.syncedFiles.entries()).map(([source, target]) => ({
        source: path.basename(source),
        target: path.basename(target)
      })),
      activeSession: this.activeSession ? {
        id: this.activeSession.id,
        planPath: this.activeSession.planPath
      } : null
    };
  }

  /**
   * Stop watching and clean up
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

      console.log('🔄 Plan sync stopped');
    }
  }
}

module.exports = PlanSyncService;
