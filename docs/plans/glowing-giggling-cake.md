# Plan: Web-Based Planning Interface for Claude Code (Option E)

## Overview
Create a browser-based planning interface that provides the full Claude Code terminal experience with plan management capabilities. Users start via `claude-web` command, which opens a browser for real-time Claude interaction with a plans sidebar.

## Architecture
```
Browser (xterm.js + UI)  <--WebSocket-->  Node.js Server  <--node-pty-->  Claude CLI
                                              |
                                         File Watcher
                                              |
                                         ./docs/plans/
```

## File Structure
```
option-e-web-ui/
├── package.json
├── server/
│   ├── index.js                 # Express + WebSocket server
│   ├── services/
│   │   ├── claude-service.js    # Spawns Claude CLI via node-pty
│   │   ├── plan-service.js      # CRUD for plan files
│   │   └── file-watcher.js      # chokidar for real-time updates
│   ├── routes/
│   │   └── api.js               # REST endpoints
│   └── websocket/
│       └── terminal-handler.js  # WebSocket-to-pty bridge
├── client/
│   ├── index.html               # Main SPA
│   ├── css/
│   │   ├── main.css
│   │   └── terminal.css
│   └── js/
│       ├── app.js               # Main logic
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

## Plan File Format Enhancement
Add optional YAML frontmatter fields (backward compatible):
```yaml
---
description: Plan description
allowed-tools: Bash, Read, Write
status: in-progress        # pending | in-progress | completed
created-at: 2026-01-18T14:30:00-06:00
updated-at: 2026-01-18T15:45:00-06:00
completed-at:              # Set when completed
priority: medium           # low | medium | high
tags: [auth, security]
---
# Plan Title

## Implementation Notes
> **2026-01-18 15:45**: Added auth flow design
```

## Key Components

### 1. CLI Launcher (`scripts/start.sh`)
- Starts Node.js server on port 3847
- Opens browser automatically
- Creates `~/.local/bin/claude-web` symlink for global access

### 2. Server (`server/index.js`)
- Express for REST API and static files
- ws for WebSocket server
- node-pty for Claude CLI subprocess management
- chokidar for file watching

### 3. Claude Service (`server/services/claude-service.js`)
- Spawns: `claude --dangerously-skip-permissions --plan <path>`
- Manages multiple concurrent sessions
- Bridges WebSocket to pty stdin/stdout

### 4. Plan Service (`server/services/plan-service.js`)
- List plans with filtering (status, category, date)
- Get/update plan content and status
- Add timestamped notes
- Archive plans

### 5. Frontend Terminal (`client/js/terminal.js`)
- xterm.js with fit addon
- WebSocket connection per session
- Full ANSI color support

### 6. Plans Sidebar (`client/js/plans.js`)
- Filterable plan list (status, category)
- Status badges with click-to-change
- Real-time updates via WebSocket
- Quick actions (archive, open, add note)

## REST API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/plans | List plans with filters |
| GET | /api/plans/:filename | Get plan content |
| PATCH | /api/plans/:filename/status | Update status |
| POST | /api/plans/:filename/notes | Add note |
| DELETE | /api/plans/:filename | Archive plan |
| POST | /api/sessions | Start Claude session |
| DELETE | /api/sessions/:id | End session |

## WebSocket Messages
| Type | Direction | Purpose |
|------|-----------|---------|
| terminal-data | Server→Client | Terminal output |
| terminal-input | Client→Server | User keystrokes |
| plan-update | Server→Client | File change notification |

## Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.16.0",
    "node-pty": "^1.0.0",
    "chokidar": "^3.5.3",
    "gray-matter": "^4.0.3"
  }
}
```
Client-side: xterm.js, xterm-addon-fit (CDN or bundled)

## Installation Updates
Add to `install.sh`:
- Menu option 6: "Web UI (Option E)"
- Checks for Node.js requirement
- Copies option-e-web-ui to ~/.claude/web-ui
- Runs npm install
- Creates claude-web symlink

## UI Features
- **Header**: "Claude Code Plans" + New Plan button + Sync Status
- **Sidebar**: Filter dropdowns + plan list with status badges
- **Main area**: Terminal (primary) + collapsible plan detail panel
- **Keyboard shortcuts**: Ctrl+N (new), Escape (focus terminal), Ctrl+S (save)
- **Theme**: Dark mode default, light mode toggle

## Implementation Sequence

### Phase 1: Core Infrastructure
1. Create option-e-web-ui/ directory structure
2. Set up package.json with dependencies
3. Implement Express server with static file serving
4. Create basic HTML/CSS layout

### Phase 2: Terminal Integration
5. Implement claude-service.js with node-pty
6. Set up WebSocket server for terminal streaming
7. Integrate xterm.js in browser
8. Test end-to-end terminal communication

### Phase 3: Plan Management
9. Implement plan-service.js (CRUD, parsing)
10. Add REST API routes
11. Create plans sidebar UI
12. Add file watcher for real-time updates

### Phase 4: Status & Notes
13. Implement status update in frontmatter
14. Add notes section to plan files
15. Create status toggle UI
16. Add note input modal

### Phase 5: Polish & Installation
17. Add keyboard shortcuts
18. Create start.sh launcher script
19. Update install.sh with Option E
20. Add /web-ui slash command
21. Write README documentation

## Critical Files to Modify
- `install.sh` - Add Option E menu and installation function
- `quick-install.sh` - Add Option E support
- `shared/plan-utils.sh` - Reference for JavaScript equivalents

## Critical Files to Create
- `option-e-web-ui/server/index.js` - Main server
- `option-e-web-ui/server/services/claude-service.js` - Claude CLI manager
- `option-e-web-ui/server/services/plan-service.js` - Plan CRUD
- `option-e-web-ui/client/index.html` - Main UI
- `option-e-web-ui/client/js/terminal.js` - xterm wrapper
- `option-e-web-ui/scripts/start.sh` - Launcher

## Verification Plan
1. Run `./install.sh` and select Option E
2. Run `claude-web` from terminal
3. Verify browser opens to localhost:3847
4. Click "New Plan" and verify terminal session starts
5. Type in terminal, verify Claude responds
6. Check plan appears in sidebar with status
7. Change status, verify frontmatter updates
8. Add note, verify it appears in plan file
9. Archive plan, verify it moves to archive/
10. Test real-time updates: modify plan file externally, verify UI updates
