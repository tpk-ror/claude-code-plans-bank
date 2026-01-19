const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { WebSocketServer } = require('ws');

// Services
const ClaudeService = require('./services/claude-service');
const PlanService = require('./services/plan-service');
const FileWatcher = require('./services/file-watcher');
const PlanSyncService = require('./services/plan-sync-service');
const TerminalHandler = require('./websocket/terminal-handler');
const apiRoutes = require('./routes/api');

// Load config
const configPath = path.join(__dirname, '../config/web-ui-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = express();
const server = http.createServer(app);

// Determine the project directory (where plans are stored)
// Use PROJECT_DIR env var if set (from start.sh), otherwise fall back to CWD
const projectDir = process.env.PROJECT_DIR || process.cwd();
const plansDir = path.resolve(projectDir, config.plans.directory);
const archiveDir = path.resolve(projectDir, config.plans.archiveDirectory);

// Ensure plans directories exist
if (!fs.existsSync(plansDir)) {
  fs.mkdirSync(plansDir, { recursive: true });
}
if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true });
}

// Initialize services
const planService = new PlanService(plansDir, archiveDir);
const claudeService = new ClaudeService(projectDir, config.claude);
const fileWatcher = new FileWatcher(plansDir);

// Only create sync service if syncFromGlobal is enabled
const syncFromGlobal = config.plans.syncFromGlobal === true;
const planSyncService = syncFromGlobal ? new PlanSyncService(plansDir) : null;

// Middleware
app.use(express.json());

// Determine which client to serve: React build or legacy vanilla JS
const reactBuildDir = path.join(__dirname, '../client/dist');
const legacyClientDir = path.join(__dirname, '../client');
const useReactBuild = fs.existsSync(path.join(reactBuildDir, 'index.html'));

if (useReactBuild) {
  console.log('[Server] Serving React build from client/dist');
  app.use(express.static(reactBuildDir));
} else {
  console.log('[Server] Serving legacy client (React build not found)');
  app.use(express.static(legacyClientDir));
}

// Make services available to routes
app.locals.planService = planService;
app.locals.claudeService = claudeService;
app.locals.planSyncService = planSyncService;
app.locals.projectDir = projectDir;
app.locals.plansDir = plansDir;

// API routes
app.use('/api', apiRoutes);

// Serve index.html for all routes (SPA support)
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return next();
  }

  if (useReactBuild) {
    res.sendFile(path.join(reactBuildDir, 'index.html'));
  } else {
    res.sendFile(path.join(legacyClientDir, 'index.html'));
  }
});

// WebSocket server
const wss = new WebSocketServer({ server });
const terminalHandler = new TerminalHandler(claudeService, fileWatcher);

wss.on('connection', (ws, req) => {
  terminalHandler.handleConnection(ws, req);
});

// Start file watcher
fileWatcher.start();

// Start plan sync service only if enabled (watches ~/.claude/plans/)
if (planSyncService) {
  planSyncService.start();
}

// Broadcast plan updates to all connected clients
fileWatcher.on('change', (event, filename) => {
  const message = JSON.stringify({
    type: 'plan-update',
    event,
    filename
  });

  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
});

// Connect plan sync service to Claude session events (only if sync is enabled)
if (planSyncService) {
  claudeService.on('session-created', (sessionId, session) => {
    planSyncService.setActiveSession(session);
  });

  claudeService.on('session-exit', (sessionId, exitCode, signal, session) => {
    planSyncService.clearActiveSession();
  });

  claudeService.on('session-killed', (sessionId, session) => {
    planSyncService.clearActiveSession();
  });

  // Broadcast sync events to all connected clients
  planSyncService.on('sync', (data) => {
    const message = JSON.stringify({
      type: 'plan-sync',
      ...data
    });

    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  });
}

// Start server
const PORT = config.server.port || 3847;
const HOST = config.server.host || 'localhost';

server.listen(PORT, HOST, () => {
  console.log(`\n🚀 Claude Code Web UI running at http://${HOST}:${PORT}`);
  console.log(`📁 Plans directory: ${plansDir}`);
  console.log(`📂 Project directory: ${projectDir}`);
  console.log(`🔄 Global sync: ${syncFromGlobal ? 'enabled' : 'disabled'}\n`);
});

// Graceful shutdown
function shutdown() {
  console.log('\n\nShutting down...');

  // Kill all Claude sessions
  claudeService.killAll();

  // Stop file watchers
  fileWatcher.stop();
  if (planSyncService) planSyncService.stop();

  // Close all WebSocket connections
  wss.clients.forEach(client => {
    client.terminate();
  });
  wss.close();

  // Close the HTTP server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit after 2 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.log('Force exiting...');
    process.exit(0);
  }, 2000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = { app, server };
