# Option E: Web-Based Planning Interface

A browser-based planning interface for Claude Code that provides the full terminal experience with integrated plan management.

## Features

- **Full Terminal**: xterm.js-powered terminal connected to Claude CLI via WebSocket
- **Plans Sidebar**: Filterable list of all plans with status badges
- **Real-time Updates**: File watcher notifies UI when plans change
- **Status Management**: Click to cycle through pending/in-progress/completed
- **Timestamped Notes**: Add notes that appear in plan files with timestamps
- **Plan Archiving**: Move completed plans to archive folder
- **Dark/Light Theme**: Toggle between themes with persistence
- **Keyboard Shortcuts**: Ctrl+N (new plan), Escape (focus terminal), Ctrl+B (sidebar)

## Requirements

- Node.js 18 or higher
- npm
- Claude Code CLI installed and in PATH

## Installation

### Via install.sh (Recommended)

```bash
./install.sh
# Select option 5: Web UI (Option E)
```

### Manual Installation

```bash
cd option-e-web-ui
npm install
```

## Usage

### Start the Web UI

```bash
# If installed via install.sh and ~/.local/bin is in PATH:
claude-web

# Or run directly:
~/.claude/web-ui/scripts/start.sh

# With options:
claude-web --port 8080
claude-web --no-browser
```

### Browser Interface

Navigate to `http://localhost:3847` (default port)

**Layout:**
- **Header**: Logo, sync status, New Plan button, theme toggle
- **Sidebar**: Status/category filters, searchable plan list
- **Main Area**: Terminal (resizable) + plan detail panel (collapsible)

**Workflow:**
1. Click "Start Claude Session" or "New Plan"
2. Work with Claude in the terminal
3. Plans appear in sidebar with real-time updates
4. Click a plan to view details
5. Change status, add notes, or archive from detail panel

## Architecture

```
Browser (xterm.js + UI)  <--WebSocket-->  Node.js Server  <--node-pty-->  Claude CLI
                                              |
                                         File Watcher
                                              |
                                         ./docs/plans/
```

### Server Components

- **Express**: REST API and static file serving
- **WebSocket (ws)**: Real-time terminal streaming
- **node-pty**: Claude CLI subprocess management
- **chokidar**: File system watching
- **gray-matter**: YAML frontmatter parsing

### Client Components

- **xterm.js**: Terminal emulator
- **xterm-addon-fit**: Auto-fit terminal to container
- **Vanilla JS**: No framework dependencies

## Plan File Format

Plans support YAML frontmatter for metadata:

```yaml
---
description: Brief description of the plan
allowed-tools: Bash, Read, Write
status: in-progress
created-at: 2026-01-18T14:30:00-06:00
updated-at: 2026-01-18T15:45:00-06:00
completed-at:
priority: medium
tags: [auth, security]
---
# Plan Title

## Overview
Plan content here...

## Implementation Notes
> **2026-01-18 15:45**: Added auth flow design
```

**Status Values:**
- `pending` - Not started
- `in-progress` - Currently working
- `completed` - Done

**Priority Values:**
- `low`
- `medium`
- `high`

## REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/plans | List plans with filters |
| GET | /api/plans/:filename | Get plan content |
| PATCH | /api/plans/:filename/status | Update status |
| POST | /api/plans/:filename/notes | Add note |
| DELETE | /api/plans/:filename | Archive plan |
| POST | /api/plans | Create new plan |
| POST | /api/sessions | Start Claude session |
| DELETE | /api/sessions/:id | End session |

### Query Parameters (GET /api/plans)

- `status` - Filter by status (pending, in-progress, completed)
- `category` - Filter by category (feature, bugfix, refactor, docs, test, chore)
- `search` - Search in title/description

## WebSocket Messages

| Type | Direction | Purpose |
|------|-----------|---------|
| terminal-data | Server→Client | Terminal output |
| terminal-input | Client→Server | User keystrokes |
| plan-update | Server→Client | File change notification |
| session-created | Server→Client | New session started |
| session-exit | Server→Client | Session ended |

## Configuration

Edit `config/web-ui-config.json`:

```json
{
  "server": {
    "port": 3847,
    "host": "localhost"
  },
  "claude": {
    "command": "claude",
    "args": ["--dangerously-skip-permissions"]
  },
  "plans": {
    "directory": "./docs/plans",
    "archiveDirectory": "./docs/plans/archive"
  },
  "ui": {
    "theme": "dark",
    "autoOpenBrowser": true
  }
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+N | Create new plan |
| Escape | Focus terminal |
| Ctrl+B | Toggle sidebar |
| ? | Show help (when not typing) |

## Troubleshooting

### Terminal not connecting
- Check that Claude CLI is installed: `which claude`
- Verify Node.js version: `node -v` (need 18+)
- Check server logs for errors

### Plans not showing
- Verify plans directory exists: `./docs/plans/`
- Check file permissions
- Ensure files have `.md` extension

### WebSocket disconnects
- Check network/firewall settings
- Increase reconnection attempts in client
- Check for CORS issues if proxying

## Development

```bash
# Install dependencies
npm install

# Start server (with auto-restart on changes)
npm run dev

# The client uses CDN for xterm.js, no build step needed
```

## File Structure

```
option-e-web-ui/
├── package.json
├── server/
│   ├── index.js                 # Express + WebSocket server
│   ├── services/
│   │   ├── claude-service.js    # node-pty Claude CLI manager
│   │   ├── plan-service.js      # Plan CRUD operations
│   │   └── file-watcher.js      # chokidar file watching
│   ├── routes/
│   │   └── api.js               # REST API endpoints
│   └── websocket/
│       └── terminal-handler.js  # WebSocket-to-pty bridge
├── client/
│   ├── index.html               # Main SPA
│   ├── css/
│   │   ├── main.css             # General styles
│   │   └── terminal.css         # Terminal-specific styles
│   └── js/
│       ├── app.js               # Main application logic
│       ├── terminal.js          # xterm.js wrapper
│       ├── plans.js             # Plan management UI
│       └── websocket.js         # WebSocket client
├── commands/
│   └── web-ui.md                # /web-ui slash command
├── scripts/
│   └── start.sh                 # Launcher script
└── config/
    └── web-ui-config.json       # Configuration
```
