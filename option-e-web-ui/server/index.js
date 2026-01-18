const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { WebSocketServer } = require('ws');

// Services
const ClaudeService = require('./services/claude-service');
const PlanService = require('./services/plan-service');
const FileWatcher = require('./services/file-watcher');
const TerminalHandler = require('./websocket/terminal-handler');
const apiRoutes = require('./routes/api');

// Load config
const configPath = path.join(__dirname, '../config/web-ui-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = express();
const server = http.createServer(app);

// Determine the project directory (where plans are stored)
// Use CWD when the server is started
const projectDir = process.cwd();
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

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Make services available to routes
app.locals.planService = planService;
app.locals.claudeService = claudeService;
app.locals.projectDir = projectDir;
app.locals.plansDir = plansDir;

// API routes
app.use('/api', apiRoutes);

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// WebSocket server
const wss = new WebSocketServer({ server });
const terminalHandler = new TerminalHandler(claudeService, fileWatcher);

wss.on('connection', (ws, req) => {
  terminalHandler.handleConnection(ws, req);
});

// Start file watcher
fileWatcher.start();

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

// Start server
const PORT = config.server.port || 3847;
const HOST = config.server.host || 'localhost';

server.listen(PORT, HOST, () => {
  console.log(`\n🚀 Claude Code Web UI running at http://${HOST}:${PORT}`);
  console.log(`📁 Plans directory: ${plansDir}`);
  console.log(`📂 Project directory: ${projectDir}\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down...');
  claudeService.killAll();
  fileWatcher.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  claudeService.killAll();
  fileWatcher.stop();
  server.close(() => {
    process.exit(0);
  });
});

module.exports = { app, server };
