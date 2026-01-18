# Web UI Command

Launch the Claude Code Web UI - a browser-based planning interface with real-time terminal and plan management.

## Instructions

When the user runs this command:

1. Check if the web-ui is installed by looking for the start script:
   - Global installation: `~/.claude/web-ui/scripts/start.sh`
   - Project installation: `./.claude/web-ui/scripts/start.sh`

2. If not found, inform the user they need to install Option E first:
   ```
   The Web UI is not installed. To install it:
   1. Run the install script: ./install.sh
   2. Select "Web UI (Option E)"
   ```

3. If found, provide instructions to start the web UI:
   - Tell the user to run: `~/.claude/web-ui/scripts/start.sh` (or the project path)
   - Or if they have the symlink: `claude-web`

4. Explain what the Web UI provides:
   - Browser-based terminal with full Claude Code experience
   - Plans sidebar with filtering by status/category
   - Real-time plan updates when files change
   - Status management (click to change pending/in-progress/completed)
   - Add timestamped notes to plans
   - Archive completed plans
   - Dark/light theme toggle
   - Keyboard shortcuts (Ctrl+N for new plan, Escape to focus terminal)

## Features Summary

The Web UI (http://localhost:3847) provides:

- **Terminal**: Full xterm.js terminal connected to Claude CLI
- **Plans Sidebar**: List all plans with filters for status and category
- **Plan Detail**: View plan info, change status, add notes
- **Real-time Updates**: File watcher notifies of plan changes
- **Session Management**: Start/end Claude sessions, optionally with a plan

## Requirements

- Node.js 18+
- npm
- Claude Code CLI installed and accessible in PATH
