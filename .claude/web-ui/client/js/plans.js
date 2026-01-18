/**
 * Plan management module
 */
class PlansManager {
  constructor() {
    this.plans = [];
    this.selectedPlan = null;
    this.filters = {
      status: '',
      category: '',
      search: ''
    };
  }

  /**
   * Initialize plans manager
   */
  async init() {
    // Setup filter event listeners
    this.setupFilters();

    // Setup WebSocket plan updates
    this.setupWebSocketListeners();

    // Load initial plans
    await this.loadPlans();
  }

  /**
   * Setup filter event listeners
   */
  setupFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchFilter = document.getElementById('searchFilter');

    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this.renderPlans();
      });
    }

    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        this.filters.category = e.target.value;
        this.renderPlans();
      });
    }

    if (searchFilter) {
      let searchTimeout;
      searchFilter.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.filters.search = e.target.value;
          this.renderPlans();
        }, 200);
      });
    }
  }

  /**
   * Setup WebSocket listeners for real-time updates
   */
  setupWebSocketListeners() {
    window.wsClient.on('plan-update', async (data) => {
      console.log('Plan update:', data.event, data.filename);
      await this.loadPlans();

      // If the currently selected plan was updated, refresh detail view
      if (this.selectedPlan && this.selectedPlan.filename === data.filename) {
        if (data.event === 'unlink') {
          this.selectPlan(null);
        } else {
          const plan = this.plans.find(p => p.filename === data.filename);
          if (plan) {
            this.selectPlan(plan);
          }
        }
      }
    });
  }

  /**
   * Load plans from API
   */
  async loadPlans() {
    try {
      const queryParams = new URLSearchParams();
      if (this.filters.status) queryParams.set('status', this.filters.status);
      if (this.filters.category) queryParams.set('category', this.filters.category);
      if (this.filters.search) queryParams.set('search', this.filters.search);

      const url = `/api/plans?${queryParams.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to load plans: ${response.statusText}`);
      }

      const data = await response.json();
      this.plans = data.plans || [];
      this.renderPlans();
    } catch (err) {
      console.error('Error loading plans:', err);
      this.showError('Failed to load plans');
    }
  }

  /**
   * Render plans list
   */
  renderPlans() {
    const container = document.getElementById('plansList');
    if (!container) return;

    if (this.plans.length === 0) {
      container.innerHTML = `
        <div class="plans-empty">
          <p>No plans found</p>
          <p style="font-size: 12px; margin-top: 8px;">Create a new plan to get started</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.plans.map(plan => this.renderPlanCard(plan)).join('');

    // Add click handlers
    container.querySelectorAll('.plan-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on status badge
        if (e.target.closest('.status-badge')) return;

        const filename = card.dataset.filename;
        const plan = this.plans.find(p => p.filename === filename);
        if (plan) {
          this.selectPlan(plan);
        }
      });
    });

    // Add status badge click handlers
    container.querySelectorAll('.status-badge').forEach(badge => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const filename = badge.closest('.plan-card').dataset.filename;
        this.showStatusDropdown(badge, filename);
      });
    });
  }

  /**
   * Render a single plan card
   * @param {Object} plan
   * @returns {string}
   */
  renderPlanCard(plan) {
    const isSelected = this.selectedPlan && this.selectedPlan.filename === plan.filename;
    const statusClass = plan.status.replace('-', '-');

    return `
      <div class="plan-card ${isSelected ? 'selected' : ''}" data-filename="${this.escapeHtml(plan.filename)}">
        <div class="plan-card-header">
          <span class="priority-indicator ${plan.priority}"></span>
          <span class="plan-card-title">${this.escapeHtml(plan.title)}</span>
        </div>
        <div class="plan-card-meta">
          <span class="plan-card-category">${plan.category}</span>
          <span class="status-badge ${statusClass}">${this.formatStatus(plan.status)}</span>
        </div>
      </div>
    `;
  }

  /**
   * Format status for display
   * @param {string} status
   * @returns {string}
   */
  formatStatus(status) {
    return status.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Select a plan and show detail panel
   * @param {Object|null} plan
   */
  selectPlan(plan) {
    this.selectedPlan = plan;

    // Update card selection
    document.querySelectorAll('.plan-card').forEach(card => {
      card.classList.toggle('selected', plan && card.dataset.filename === plan.filename);
    });

    // Update detail panel
    const panel = document.getElementById('planDetailPanel');
    const titleEl = document.getElementById('planDetailTitle');
    const contentEl = document.getElementById('planDetailContent');

    if (!plan) {
      panel.classList.add('collapsed');
      titleEl.textContent = 'Select a plan';
      contentEl.innerHTML = '<p class="empty-state">Select a plan from the sidebar to view details</p>';
      return;
    }

    panel.classList.remove('collapsed');
    titleEl.textContent = plan.title;
    contentEl.innerHTML = this.renderPlanDetail(plan);

    // Add event listeners for detail actions
    this.setupDetailEventListeners(plan);
  }

  /**
   * Render plan detail content
   * @param {Object} plan
   * @returns {string}
   */
  renderPlanDetail(plan) {
    const statusClass = plan.status.replace('-', '-');

    return `
      <div class="plan-detail">
        <div class="plan-detail-section">
          <h4>Status</h4>
          <div class="status-dropdown">
            <span class="status-badge ${statusClass}" id="detailStatusBadge">${this.formatStatus(plan.status)}</span>
            <div class="status-dropdown-menu hidden" id="statusDropdownMenu">
              <button class="status-dropdown-item" data-status="pending">Pending</button>
              <button class="status-dropdown-item" data-status="in-progress">In Progress</button>
              <button class="status-dropdown-item" data-status="completed">Completed</button>
            </div>
          </div>
        </div>

        ${plan.description ? `
          <div class="plan-detail-section">
            <h4>Description</h4>
            <p>${this.escapeHtml(plan.description)}</p>
          </div>
        ` : ''}

        <div class="plan-detail-section">
          <h4>Info</h4>
          <p>Category: ${plan.category}</p>
          <p>Priority: ${plan.priority}</p>
          ${plan.tags && plan.tags.length > 0 ? `<p>Tags: ${plan.tags.join(', ')}</p>` : ''}
        </div>

        <div class="plan-detail-section">
          <h4>Dates</h4>
          <p>Created: ${this.formatDate(plan.createdAt)}</p>
          <p>Updated: ${this.formatDate(plan.updatedAt)}</p>
          ${plan.completedAt ? `<p>Completed: ${this.formatDate(plan.completedAt)}</p>` : ''}
        </div>

        <div class="plan-detail-actions">
          <button class="btn btn-sm btn-primary" id="startWithPlanBtn">Start Session</button>
          <button class="btn btn-sm btn-ghost" id="addNoteBtn">Add Note</button>
          <button class="btn btn-sm btn-ghost" id="archivePlanBtn">Archive</button>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners for detail panel
   * @param {Object} plan
   */
  setupDetailEventListeners(plan) {
    // Status dropdown
    const statusBadge = document.getElementById('detailStatusBadge');
    const dropdownMenu = document.getElementById('statusDropdownMenu');

    if (statusBadge && dropdownMenu) {
      statusBadge.addEventListener('click', () => {
        dropdownMenu.classList.toggle('hidden');
      });

      dropdownMenu.querySelectorAll('.status-dropdown-item').forEach(item => {
        item.addEventListener('click', async () => {
          const newStatus = item.dataset.status;
          await this.updateStatus(plan.filename, newStatus);
          dropdownMenu.classList.add('hidden');
        });
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.status-dropdown')) {
          dropdownMenu.classList.add('hidden');
        }
      });
    }

    // Start session with plan
    const startBtn = document.getElementById('startWithPlanBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.startSessionWithPlan(plan);
      });
    }

    // Add note
    const addNoteBtn = document.getElementById('addNoteBtn');
    if (addNoteBtn) {
      addNoteBtn.addEventListener('click', () => {
        this.showAddNoteModal(plan.filename);
      });
    }

    // Archive plan
    const archiveBtn = document.getElementById('archivePlanBtn');
    if (archiveBtn) {
      archiveBtn.addEventListener('click', () => {
        this.archivePlan(plan.filename);
      });
    }
  }

  /**
   * Show status dropdown near element
   * @param {Element} element
   * @param {string} filename
   */
  showStatusDropdown(element, filename) {
    // Create or get existing dropdown
    let dropdown = document.querySelector('.status-dropdown-floating');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.className = 'status-dropdown-menu status-dropdown-floating';
      dropdown.innerHTML = `
        <button class="status-dropdown-item" data-status="pending">Pending</button>
        <button class="status-dropdown-item" data-status="in-progress">In Progress</button>
        <button class="status-dropdown-item" data-status="completed">Completed</button>
      `;
      document.body.appendChild(dropdown);
    }

    // Position dropdown
    const rect = element.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.classList.remove('hidden');

    // Add click handlers
    dropdown.querySelectorAll('.status-dropdown-item').forEach(item => {
      item.onclick = async () => {
        const newStatus = item.dataset.status;
        await this.updateStatus(filename, newStatus);
        dropdown.classList.add('hidden');
      };
    });

    // Close on click outside
    const closeHandler = (e) => {
      if (!dropdown.contains(e.target) && e.target !== element) {
        dropdown.classList.add('hidden');
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
  }

  /**
   * Update plan status
   * @param {string} filename
   * @param {string} status
   */
  async updateStatus(filename, status) {
    try {
      const response = await fetch(`/api/plans/${encodeURIComponent(filename)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      await this.loadPlans();

      // Update detail view if this plan is selected
      if (this.selectedPlan && this.selectedPlan.filename === filename) {
        const plan = this.plans.find(p => p.filename === filename);
        if (plan) {
          this.selectPlan(plan);
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
      this.showError('Failed to update status');
    }
  }

  /**
   * Start Claude session with plan
   * @param {Object} plan
   */
  startSessionWithPlan(plan) {
    if (window.terminalManager) {
      // Build full path to plan
      // The server will resolve the path relative to the project directory
      const planPath = `./docs/plans/${plan.filename}`;
      window.terminalManager.startSession({ planPath });
    }
  }

  /**
   * Show add note modal
   * @param {string} filename
   */
  showAddNoteModal(filename) {
    const modal = document.getElementById('addNoteModal');
    const filenameInput = document.getElementById('noteFilename');
    const contentInput = document.getElementById('noteContent');

    if (modal && filenameInput && contentInput) {
      filenameInput.value = filename;
      contentInput.value = '';
      modal.classList.remove('hidden');
      contentInput.focus();
    }
  }

  /**
   * Add note to plan
   * @param {string} filename
   * @param {string} note
   */
  async addNote(filename, note) {
    try {
      const response = await fetch(`/api/plans/${encodeURIComponent(filename)}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      await this.loadPlans();
    } catch (err) {
      console.error('Error adding note:', err);
      this.showError('Failed to add note');
    }
  }

  /**
   * Archive a plan
   * @param {string} filename
   */
  async archivePlan(filename) {
    if (!confirm(`Are you sure you want to archive "${filename}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/plans/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to archive plan');
      }

      // Clear selection if this was the selected plan
      if (this.selectedPlan && this.selectedPlan.filename === filename) {
        this.selectPlan(null);
      }

      await this.loadPlans();
    } catch (err) {
      console.error('Error archiving plan:', err);
      this.showError('Failed to archive plan');
    }
  }

  /**
   * Create a new plan
   * @param {Object} planData
   */
  async createPlan(planData) {
    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });

      if (!response.ok) {
        throw new Error('Failed to create plan');
      }

      const data = await response.json();
      await this.loadPlans();

      // Select the new plan
      this.selectPlan(data.plan);

      return data.plan;
    } catch (err) {
      console.error('Error creating plan:', err);
      this.showError('Failed to create plan');
      throw err;
    }
  }

  /**
   * Format date for display
   * @param {string} dateStr
   * @returns {string}
   */
  formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  }

  /**
   * Escape HTML special characters
   * @param {string} str
   * @returns {string}
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Show error message
   * @param {string} message
   */
  showError(message) {
    // Simple alert for now - could be replaced with toast notification
    console.error(message);
  }
}

// Create global instance
window.plansManager = new PlansManager();
