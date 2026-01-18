const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

class PlanService {
  constructor(plansDir, archiveDir) {
    this.plansDir = plansDir;
    this.archiveDir = archiveDir;
  }

  /**
   * List all plans with optional filtering
   * @param {Object} filters - Filter options
   * @param {string} filters.status - Filter by status
   * @param {string} filters.category - Filter by category (from filename)
   * @param {string} filters.search - Search in title/description
   * @returns {Array} List of plan objects
   */
  listPlans(filters = {}) {
    if (!fs.existsSync(this.plansDir)) {
      return [];
    }

    const files = fs.readdirSync(this.plansDir);
    const plans = [];

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(this.plansDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) continue;

      try {
        const plan = this.getPlan(file);
        if (plan) {
          // Apply filters
          if (filters.status && plan.status !== filters.status) continue;
          if (filters.category && plan.category !== filters.category) continue;
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const titleMatch = (plan.title || '').toLowerCase().includes(searchLower);
            const descMatch = (plan.description || '').toLowerCase().includes(searchLower);
            if (!titleMatch && !descMatch) continue;
          }

          plans.push(plan);
        }
      } catch (err) {
        console.error(`Error parsing plan ${file}:`, err.message);
      }
    }

    // Sort by updated date descending
    plans.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA;
    });

    return plans;
  }

  /**
   * Get a single plan by filename
   * @param {string} filename
   * @returns {Object|null}
   */
  getPlan(filename) {
    const filePath = path.join(this.plansDir, filename);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const stat = fs.statSync(filePath);
    const { data: frontmatter, content: body } = matter(content);

    // Extract title from first # heading if not in frontmatter
    let title = frontmatter.title;
    if (!title) {
      const titleMatch = body.match(/^#\s+(.+)$/m);
      title = titleMatch ? titleMatch[1] : filename.replace('.md', '');
    }

    // Extract category from filename (e.g., "feature-add-auth-01.18.26.md" -> "feature")
    const category = this.extractCategory(filename);

    return {
      filename,
      title,
      description: frontmatter.description || '',
      status: frontmatter.status || 'pending',
      category,
      priority: frontmatter.priority || 'medium',
      tags: frontmatter.tags || [],
      allowedTools: frontmatter['allowed-tools'] || '',
      createdAt: frontmatter['created-at'] || stat.birthtime.toISOString(),
      updatedAt: frontmatter['updated-at'] || stat.mtime.toISOString(),
      completedAt: frontmatter['completed-at'] || null,
      content: body,
      raw: content
    };
  }

  /**
   * Get raw content of a plan file
   * @param {string} filename
   * @returns {string|null}
   */
  getRawContent(filename) {
    const filePath = path.join(this.plansDir, filename);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    return fs.readFileSync(filePath, 'utf8');
  }

  /**
   * Update plan frontmatter
   * @param {string} filename
   * @param {Object} updates - Fields to update in frontmatter
   * @returns {Object} Updated plan
   */
  updatePlan(filename, updates) {
    const filePath = path.join(this.plansDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Plan not found: ${filename}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter, content: body } = matter(content);

    // Update frontmatter
    const newFrontmatter = { ...frontmatter };

    if (updates.status !== undefined) {
      newFrontmatter.status = updates.status;
      if (updates.status === 'completed' && !newFrontmatter['completed-at']) {
        newFrontmatter['completed-at'] = this.getTimestamp();
      }
    }

    if (updates.description !== undefined) {
      newFrontmatter.description = updates.description;
    }

    if (updates.priority !== undefined) {
      newFrontmatter.priority = updates.priority;
    }

    if (updates.tags !== undefined) {
      newFrontmatter.tags = updates.tags;
    }

    if (updates['allowed-tools'] !== undefined) {
      newFrontmatter['allowed-tools'] = updates['allowed-tools'];
    }

    // Always update the updated-at timestamp
    newFrontmatter['updated-at'] = this.getTimestamp();

    // Ensure created-at exists
    if (!newFrontmatter['created-at']) {
      const stat = fs.statSync(filePath);
      newFrontmatter['created-at'] = stat.birthtime.toISOString();
    }

    // Stringify back to file
    const newContent = matter.stringify(body, newFrontmatter);
    fs.writeFileSync(filePath, newContent);

    return this.getPlan(filename);
  }

  /**
   * Update plan status
   * @param {string} filename
   * @param {string} status - New status (pending, in-progress, completed)
   * @returns {Object} Updated plan
   */
  updateStatus(filename, status) {
    const validStatuses = ['pending', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    return this.updatePlan(filename, { status });
  }

  /**
   * Add a note to a plan file
   * @param {string} filename
   * @param {string} note - Note content
   * @returns {Object} Updated plan
   */
  addNote(filename, note) {
    const filePath = path.join(this.plansDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Plan not found: ${filename}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter, content: body } = matter(content);

    // Format the note with timestamp
    const timestamp = this.getFormattedTimestamp();
    const formattedNote = `\n> **${timestamp}**: ${note}`;

    // Find or create the notes section
    let newBody = body;
    const notesHeader = '## Implementation Notes';

    if (body.includes(notesHeader)) {
      // Append to existing notes section
      const headerIndex = body.indexOf(notesHeader);
      const afterHeader = body.substring(headerIndex + notesHeader.length);

      // Find the next section header or end of file
      const nextHeaderMatch = afterHeader.match(/\n## /);
      const insertIndex = nextHeaderMatch
        ? headerIndex + notesHeader.length + nextHeaderMatch.index
        : body.length;

      newBody = body.substring(0, insertIndex) + formattedNote + body.substring(insertIndex);
    } else {
      // Add notes section at the end
      newBody = body.trimEnd() + `\n\n${notesHeader}${formattedNote}\n`;
    }

    // Update the updated-at timestamp
    frontmatter['updated-at'] = this.getTimestamp();

    // Write back
    const newContent = matter.stringify(newBody, frontmatter);
    fs.writeFileSync(filePath, newContent);

    return this.getPlan(filename);
  }

  /**
   * Archive a plan (move to archive folder)
   * @param {string} filename
   * @returns {Object} Result info
   */
  archivePlan(filename) {
    const sourcePath = path.join(this.plansDir, filename);
    const destPath = path.join(this.archiveDir, filename);

    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Plan not found: ${filename}`);
    }

    // Ensure archive directory exists
    if (!fs.existsSync(this.archiveDir)) {
      fs.mkdirSync(this.archiveDir, { recursive: true });
    }

    // Handle filename collision in archive
    let finalDestPath = destPath;
    let counter = 1;
    while (fs.existsSync(finalDestPath)) {
      const ext = path.extname(filename);
      const base = path.basename(filename, ext);
      finalDestPath = path.join(this.archiveDir, `${base}-${counter}${ext}`);
      counter++;
    }

    fs.renameSync(sourcePath, finalDestPath);

    return {
      archived: true,
      originalPath: sourcePath,
      archivePath: finalDestPath
    };
  }

  /**
   * Create a new plan file
   * @param {string} title
   * @param {Object} options - Plan options
   * @returns {Object} Created plan
   */
  createPlan(title, options = {}) {
    const filename = this.generateFilename(title, options.category || 'feature');
    const filePath = path.join(this.plansDir, filename);

    const frontmatter = {
      description: options.description || '',
      'allowed-tools': options.allowedTools || '',
      status: 'pending',
      'created-at': this.getTimestamp(),
      'updated-at': this.getTimestamp(),
      'completed-at': '',
      priority: options.priority || 'medium',
      tags: options.tags || []
    };

    const body = `# ${title}\n\n## Overview\n\n[Plan description here]\n\n## Implementation Notes\n`;

    const content = matter.stringify(body, frontmatter);
    fs.writeFileSync(filePath, content);

    return this.getPlan(filename);
  }

  /**
   * Extract category from filename
   * @param {string} filename
   * @returns {string}
   */
  extractCategory(filename) {
    const categories = ['feature', 'bugfix', 'refactor', 'docs', 'test', 'chore'];
    const lowerFilename = filename.toLowerCase();

    for (const cat of categories) {
      if (lowerFilename.startsWith(cat + '-')) {
        return cat;
      }
    }

    return 'feature';
  }

  /**
   * Generate filename for new plan
   * @param {string} title
   * @param {string} category
   * @returns {string}
   */
  generateFilename(title, category = 'feature') {
    // Sanitize title
    const sanitized = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)
      .replace(/-$/, '');

    // Get date in MM.DD.YY format (Central timezone)
    const now = new Date();
    const options = { timeZone: 'America/Chicago' };
    const month = String(now.toLocaleString('en-US', { ...options, month: '2-digit' })).padStart(2, '0');
    const day = String(now.toLocaleString('en-US', { ...options, day: '2-digit' })).padStart(2, '0');
    const year = String(now.toLocaleString('en-US', { ...options, year: '2-digit' }));

    const dateStr = `${month}.${day}.${year}`;
    let filename = `${category}-${sanitized}-${dateStr}.md`;

    // Handle duplicates
    let counter = 2;
    while (fs.existsSync(path.join(this.plansDir, filename))) {
      filename = `${category}-${sanitized}-${dateStr}-${counter}.md`;
      counter++;
    }

    return filename;
  }

  /**
   * Get ISO timestamp in Central timezone
   * @returns {string}
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Get formatted timestamp for notes (Central timezone)
   * @returns {string}
   */
  getFormattedTimestamp() {
    const now = new Date();
    const options = {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };

    const formatted = now.toLocaleString('en-US', options);
    // Convert "01/18/2026, 14:30" to "2026-01-18 14:30"
    const [date, time] = formatted.split(', ');
    const [month, day, year] = date.split('/');
    return `${year}-${month}-${day} ${time}`;
  }

  /**
   * Get all unique categories from existing plans
   * @returns {Array}
   */
  getCategories() {
    const plans = this.listPlans();
    const categories = new Set(plans.map(p => p.category));
    return Array.from(categories).sort();
  }

  /**
   * Get all unique tags from existing plans
   * @returns {Array}
   */
  getTags() {
    const plans = this.listPlans();
    const tags = new Set();
    plans.forEach(p => {
      (p.tags || []).forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
  }
}

module.exports = PlanService;
