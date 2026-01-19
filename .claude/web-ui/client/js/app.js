/**
 * Main application entry point
 */
class App {
  constructor() {
    this.wsClient = window.wsClient;
    this.terminalManager = null;
    this.plansManager = window.plansManager;
  }

  /**
   * Update loading step status
   * @param {string} stepId - Step element ID (without 'step-' prefix)
   * @param {string} status - 'active', 'complete', or 'error'
   * @param {string} message - Optional message to display
   */
  updateStep(stepId, status, message = null) {
    const step = document.getElementById(`step-${stepId}`);
    if (step) {
      step.className = `loading-step ${status}`;
      if (message) {
        step.textContent = message;
      }
    }
  }

  /**
   * Update the main loading status message
   * @param {string} message
   * @param {boolean} isError
   */
  updateLoadingStatus(message, isError = false) {
    const statusEl = document.getElementById('loadingStatus');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = isError ? 'loading-status error' : 'loading-status';
    }
    console.log(`[App] ${message}`);
  }

  /**
   * Hide loading overlay
   */
  hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log('[App] Initializing Claude Code Web UI...');
    this.updateLoadingStatus('Starting initialization...');

    // Mark scripts as loaded (we got here, so scripts loaded)
    this.updateStep('scripts', 'complete', 'Scripts loaded');

    // Initialize WebSocket connection
    this.updateStep('websocket', 'active', 'Connecting to server...');
    this.updateLoadingStatus('Connecting to WebSocket server...');
    try {
      await this.wsClient.connect(10000); // 10 second timeout
      this.updateStep('websocket', 'complete', 'Connected to server');
      this.updateConnectionStatus(true);
    } catch (err) {
      console.error('[App] Failed to connect WebSocket:', err);
      this.updateStep('websocket', 'error', `WebSocket failed: ${err.message}`);
      this.updateLoadingStatus(`WebSocket connection failed: ${err.message}`, true);
      this.updateConnectionStatus(false);
      // Continue anyway - some features may still work
    }

    // Setup connection status listeners
    this.wsClient.on('connected', () => this.updateConnectionStatus(true));
    this.wsClient.on('disconnected', () => this.updateConnectionStatus(false));

    // Initialize terminal
    this.updateStep('terminal', 'active', 'Initializing terminal...');
    this.updateLoadingStatus('Initializing terminal...');
    try {
      this.terminalManager = new TerminalManager('terminal', this.wsClient);
      window.terminalManager = this.terminalManager;
      this.terminalManager.init();
      this.updateStep('terminal', 'complete', 'Terminal ready');
    } catch (err) {
      console.error('[App] Failed to initialize terminal:', err);
      this.updateStep('terminal', 'error', `Terminal failed: ${err.message}`);
      this.updateLoadingStatus(`Terminal initialization failed: ${err.message}`, true);
    }

    // Initialize plans manager
    this.updateStep('plans', 'active', 'Loading plans...');
    this.updateLoadingStatus('Loading plans...');
    try {
      await this.plansManager.init();
      this.updateStep('plans', 'complete', 'Plans loaded');
    } catch (err) {
      console.error('[App] Failed to load plans:', err);
      this.updateStep('plans', 'error', `Plans failed: ${err.message}`);
      this.updateLoadingStatus(`Failed to load plans: ${err.message}`, true);
    }

    // Setup UI event listeners
    this.setupEventListeners();

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Load theme preference
    this.loadThemePreference();

    // Hide loading overlay
    this.updateLoadingStatus('Ready!');
    setTimeout(() => this.hideLoadingOverlay(), 500);

    console.log('[App] Application initialized');
  }

  /**
   * Setup UI event listeners
   */
  setupEventListeners() {
    // New plan button
    const newPlanBtn = document.getElementById('newPlanBtn');
    if (newPlanBtn) {
      newPlanBtn.addEventListener('click', () => this.showNewPlanModal());
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => this.toggleSidebar());
    }

    // Terminal session buttons
    const newSessionBtn = document.getElementById('newSessionBtn');
    const killSessionBtn = document.getElementById('killSessionBtn');
    const startSessionBtn = document.getElementById('startSessionBtn');

    if (newSessionBtn) {
      newSessionBtn.addEventListener('click', () => this.startNewSession());
    }

    if (killSessionBtn) {
      killSessionBtn.addEventListener('click', () => this.endSession());
    }

    if (startSessionBtn) {
      startSessionBtn.addEventListener('click', () => this.startNewSession());
    }

    // Session state tracking
    this.wsClient.on('session-created', () => {
      if (killSessionBtn) killSessionBtn.disabled = false;
    });

    this.wsClient.on('session-exit', () => {
      if (killSessionBtn) killSessionBtn.disabled = true;
    });

    this.wsClient.on('session-killed', () => {
      if (killSessionBtn) killSessionBtn.disabled = true;
    });

    // Close detail panel
    const closePanelBtn = document.getElementById('closePanelBtn');
    if (closePanelBtn) {
      closePanelBtn.addEventListener('click', () => {
        this.plansManager.selectPlan(null);
      });
    }

    // New plan modal
    this.setupNewPlanModal();

    // Add note modal
    this.setupAddNoteModal();

    // Modal backdrop close
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', () => this.closeAllModals());
    });
  }

  /**
   * Setup new plan modal
   */
  setupNewPlanModal() {
    const modal = document.getElementById('newPlanModal');
    const closeBtn = document.getElementById('closeNewPlanModal');
    const cancelBtn = document.getElementById('cancelNewPlan');
    const form = document.getElementById('newPlanForm');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideNewPlanModal());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideNewPlanModal());
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.createNewPlan();
      });
    }
  }

  /**
   * Setup add note modal
   */
  setupAddNoteModal() {
    const modal = document.getElementById('addNoteModal');
    const closeBtn = document.getElementById('closeAddNoteModal');
    const cancelBtn = document.getElementById('cancelAddNote');
    const form = document.getElementById('addNoteForm');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideAddNoteModal());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideAddNoteModal());
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.submitNote();
      });
    }
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+N: New plan
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        this.showNewPlanModal();
        return;
      }

      // Escape: Focus terminal or close modal
      if (e.key === 'Escape') {
        if (this.isModalOpen()) {
          this.closeAllModals();
        } else if (this.terminalManager) {
          this.terminalManager.focus();
        }
        return;
      }

      // Ctrl+B: Toggle sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        this.toggleSidebar();
        return;
      }

      // ?: Show keyboard help (when not typing)
      if (e.key === '?' && !this.isInputFocused()) {
        this.toggleKeyboardHelp();
        return;
      }
    });
  }

  /**
   * Check if any modal is open
   * @returns {boolean}
   */
  isModalOpen() {
    return document.querySelector('.modal:not(.hidden)') !== null;
  }

  /**
   * Check if user is typing in an input
   * @returns {boolean}
   */
  isInputFocused() {
    const active = document.activeElement;
    return active && (
      active.tagName === 'INPUT' ||
      active.tagName === 'TEXTAREA' ||
      active.tagName === 'SELECT' ||
      active.classList.contains('xterm-helper-textarea')
    );
  }

  /**
   * Close all modals
   */
  closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.add('hidden');
    });
  }

  /**
   * Show new plan modal
   */
  showNewPlanModal() {
    const modal = document.getElementById('newPlanModal');
    if (modal) {
      modal.classList.remove('hidden');
      const titleInput = document.getElementById('planTitle');
      if (titleInput) {
        titleInput.value = '';
        titleInput.focus();
      }
    }
  }

  /**
   * Hide new plan modal
   */
  hideNewPlanModal() {
    const modal = document.getElementById('newPlanModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  /**
   * Create new plan from modal form
   */
  async createNewPlan() {
    const title = document.getElementById('planTitle').value.trim();
    const category = document.getElementById('planCategory').value;
    const description = document.getElementById('planDescription').value.trim();
    const priority = document.getElementById('planPriority').value;

    if (!title) {
      alert('Please enter a title');
      return;
    }

    try {
      await this.plansManager.createPlan({
        title,
        category,
        description,
        priority
      });

      this.hideNewPlanModal();
    } catch (err) {
      console.error('Error creating plan:', err);
    }
  }

  /**
   * Hide add note modal
   */
  hideAddNoteModal() {
    const modal = document.getElementById('addNoteModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  /**
   * Submit note from modal form
   */
  async submitNote() {
    const filename = document.getElementById('noteFilename').value;
    const content = document.getElementById('noteContent').value.trim();

    if (!content) {
      alert('Please enter a note');
      return;
    }

    try {
      await this.plansManager.addNote(filename, content);
      this.hideAddNoteModal();
    } catch (err) {
      console.error('Error adding note:', err);
    }
  }

  /**
   * Start new Claude session
   */
  startNewSession() {
    if (this.terminalManager) {
      this.terminalManager.startSession();
    }
  }

  /**
   * End current session
   */
  endSession() {
    if (this.terminalManager) {
      this.terminalManager.endSession();
    }
  }

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');

    if (sidebar) {
      sidebar.classList.toggle('collapsed');

      if (toggleBtn) {
        toggleBtn.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
      }

      // Refit terminal after sidebar animation
      setTimeout(() => {
        if (this.terminalManager) {
          this.terminalManager.fit();
        }
      }, 250);
    }
  }

  /**
   * Toggle theme between dark and light
   */
  toggleTheme() {
    const body = document.body;
    const isDark = body.classList.contains('dark-mode');

    body.classList.toggle('dark-mode', !isDark);
    body.classList.toggle('light-mode', isDark);

    // Update theme icon
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = isDark ? '☾' : '☀';
    }

    // Save preference
    localStorage.setItem('theme', isDark ? 'light' : 'dark');

    // Update terminal theme
    if (this.terminalManager && this.terminalManager.terminal) {
      this.terminalManager.terminal.options.theme = this.terminalManager.getTheme();
    }

    // Dispatch event for other components
    body.dispatchEvent(new CustomEvent('themechange'));
  }

  /**
   * Load theme preference from localStorage
   */
  loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'light') {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
      const themeIcon = document.querySelector('.theme-icon');
      if (themeIcon) {
        themeIcon.textContent = '☾';
      }
    }
  }

  /**
   * Toggle keyboard help visibility
   */
  toggleKeyboardHelp() {
    const help = document.getElementById('keyboardHelp');
    if (help) {
      help.classList.toggle('hidden');

      // Auto-hide after 5 seconds
      if (!help.classList.contains('hidden')) {
        setTimeout(() => help.classList.add('hidden'), 5000);
      }
    }
  }

  /**
   * Update connection status indicator
   * @param {boolean} connected
   */
  updateConnectionStatus(connected) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');

    if (statusDot) {
      statusDot.classList.toggle('connected', connected);
      statusDot.classList.toggle('disconnected', !connected);
    }

    if (statusText) {
      statusText.textContent = connected ? 'Connected' : 'Disconnected';
    }
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
