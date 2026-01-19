# Plan: Enable Interactive Claude Code Sessions via Web UI

## Summary

Enable the web UI to start interactive Claude Code sessions where users can interact through the browser terminal and have plan files update in real-time via **one-way sync** from Claude's internal plans to the project directory.

## Current State

### What Already Works
- Express + WebSocket server on port 3847
- `ClaudeService` spawns Claude CLI with `node-pty` for terminal emulation
- File watcher monitors `./docs/plans/` and broadcasts changes to UI
- xterm.js terminal with "Start Session" button

### The Gap
Claude Code's `--plan` flag reads FROM a plan file, but plan mode (Shift+Tab x2) writes to `~/.claude/plans/` — NOT the project's `./docs/plans/`.

## Solution: One-Way Sync (Claude → Project)

Watch Claude's internal plan directory and copy changes to the project directory.

```
~/.claude/plans/  ──(sync)──►  ./docs/plans/
     │                              │
     │                              ▼
     │                     File watcher detects
     │                              │
     └──────────────────────────────▼
                              WebSocket broadcast
                                    │
                                    ▼
                              UI updates
```

## Implementation Steps

### Step 1: Create Plan Sync Service
**New file**: `.claude/web-ui/server/services/plan-sync-service.js`

- Watch `~/.claude/plans/` for file changes (add/change)
- When a plan file changes:
  1. Read the file content
  2. Copy to `./docs/plans/` (existing file watcher handles the rest)
- Track active session's plan file to know which one to sync

### Step 2: Modify Claude Service
**File**: `.claude/web-ui/server/services/claude-service.js`

- When session starts, record the target project plan path
- Detect when Claude creates/updates a plan file (by watching `~/.claude/plans/`)
- Link the internal plan file to the project plan file

### Step 3: Initialize Sync in Server
**File**: `.claude/web-ui/server/index.js`

- Create PlanSyncService instance
- Connect it to ClaudeService session events
- Start watching when session starts, stop when session ends

### Step 4: Frontend Sync Indicator (Optional)
**File**: `.claude/web-ui/client/js/plans.js`

- Show subtle "syncing..." indicator when plan updates are being processed
- Auto-refresh plan detail panel content

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Sync direction | One-way (Claude → Project) | Simpler, no conflicts |
| Conflict handling | Claude wins | During session, Claude is source of truth |
| File naming | Keep Claude's name OR rename | Use existing `plan-utils.sh` logic |

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `server/services/plan-sync-service.js` | Create | Core sync logic |
| `server/services/claude-service.js` | Modify | Track session ↔ plan linkage |
| `server/index.js` | Modify | Wire up sync service |
| `client/js/plans.js` | Modify | Sync indicator (optional) |

## Verification

1. `cd .claude/web-ui && npm start`
2. Open `http://localhost:3847`
3. Click "Start Session" (with or without selecting a plan)
4. In terminal, enter plan mode: press `Shift+Tab` twice
5. Create or edit a plan in Claude
6. **Expected**: Plan appears/updates in `./docs/plans/` within ~1 second
7. **Expected**: Web UI sidebar shows the plan update
