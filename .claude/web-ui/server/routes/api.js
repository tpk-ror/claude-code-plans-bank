const express = require('express');
const router = express.Router();

// GET /api/plans - List all plans with optional filters
router.get('/plans', (req, res) => {
  const planService = req.app.locals.planService;
  const { status, category, search } = req.query;

  try {
    const plans = planService.listPlans({ status, category, search });
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/plans/categories - Get all categories
router.get('/plans/categories', (req, res) => {
  const planService = req.app.locals.planService;

  try {
    const categories = planService.getCategories();
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/plans/tags - Get all tags
router.get('/plans/tags', (req, res) => {
  const planService = req.app.locals.planService;

  try {
    const tags = planService.getTags();
    res.json({ tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/plans/:filename - Get a specific plan
router.get('/plans/:filename', (req, res) => {
  const planService = req.app.locals.planService;
  const { filename } = req.params;

  try {
    const plan = planService.getPlan(filename);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/plans/:filename/raw - Get raw content
router.get('/plans/:filename/raw', (req, res) => {
  const planService = req.app.locals.planService;
  const { filename } = req.params;

  try {
    const content = planService.getRawContent(filename);
    if (content === null) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.type('text/markdown').send(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/plans/:filename - Update plan metadata
router.patch('/plans/:filename', (req, res) => {
  const planService = req.app.locals.planService;
  const { filename } = req.params;
  const updates = req.body;

  try {
    const plan = planService.updatePlan(filename, updates);
    res.json({ plan });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/plans/:filename/status - Update plan status
router.patch('/plans/:filename/status', (req, res) => {
  const planService = req.app.locals.planService;
  const { filename } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const plan = planService.updateStatus(filename, status);
    res.json({ plan });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes('Invalid status')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/plans/:filename/notes - Add a note
router.post('/plans/:filename/notes', (req, res) => {
  const planService = req.app.locals.planService;
  const { filename } = req.params;
  const { note } = req.body;

  if (!note) {
    return res.status(400).json({ error: 'Note content is required' });
  }

  try {
    const plan = planService.addNote(filename, note);
    res.json({ plan });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/plans/:filename - Archive a plan
router.delete('/plans/:filename', (req, res) => {
  const planService = req.app.locals.planService;
  const { filename } = req.params;

  try {
    const result = planService.archivePlan(filename);
    res.json(result);
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/plans - Create a new plan
router.post('/plans', (req, res) => {
  const planService = req.app.locals.planService;
  const { title, description, category, priority, tags, allowedTools } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const plan = planService.createPlan(title, {
      description,
      category,
      priority,
      tags,
      allowedTools
    });
    res.status(201).json({ plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions - Create a new Claude session (via REST for non-WebSocket clients)
router.post('/sessions', (req, res) => {
  const claudeService = req.app.locals.claudeService;
  const { planPath } = req.body;

  try {
    const session = claudeService.createSession({ planPath });
    res.status(201).json({
      sessionId: session.id,
      planPath: session.planPath,
      createdAt: session.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions - List active sessions
router.get('/sessions', (req, res) => {
  const claudeService = req.app.locals.claudeService;

  try {
    const sessions = claudeService.getActiveSessions().map(s => ({
      id: s.id,
      planPath: s.planPath,
      createdAt: s.createdAt,
      active: s.active
    }));
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sessions/:id - End a session
router.delete('/sessions/:id', (req, res) => {
  const claudeService = req.app.locals.claudeService;
  const { id } = req.params;

  try {
    const killed = claudeService.killSession(id);
    if (!killed) {
      return res.status(404).json({ error: 'Session not found or already ended' });
    }
    res.json({ killed: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/config - Get project info
router.get('/config', (req, res) => {
  res.json({
    projectDir: req.app.locals.projectDir,
    plansDir: req.app.locals.plansDir
  });
});

// POST /api/sync - Trigger manual sync from Claude's plans directory
router.post('/sync', (req, res) => {
  const planSyncService = req.app.locals.planSyncService;

  if (!planSyncService) {
    return res.status(503).json({ error: 'Plan sync service not available' });
  }

  try {
    planSyncService.syncAllExisting();
    res.json({
      success: true,
      message: 'Sync triggered',
      status: planSyncService.getStatus()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sync/status - Get sync status
router.get('/sync/status', (req, res) => {
  const planSyncService = req.app.locals.planSyncService;

  if (!planSyncService) {
    return res.status(503).json({ error: 'Plan sync service not available' });
  }

  try {
    res.json(planSyncService.getStatus());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
