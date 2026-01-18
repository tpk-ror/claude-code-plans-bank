# Option D: Always-On Auto-Save

Automatically rename plans in your project's `./plans/` directory from default names to descriptive format - no manual commands required.

## How It Works

Option D uses a Claude Code Stop hook that runs when each session ends. It scans `./plans/` for files with default naming (word-word-word.md) and renames them to descriptive format.

## Features

- **Automatic Rename**: Plans are renamed without manual intervention
- **Smart Categories**: Auto-detects category from plan header (bugfix, refactor, docs, test, feature)
- **Auto-Archive**: Moves old plans (30+ days) to `./plans/archive/`
- **Auto-Commit**: Optionally commits each renamed plan to git
- **Configurable**: Customize behavior via `~/.claude/plans-bank-config.json`

## Installation

### Via Interactive Installer

```bash
./install.sh  # Choose option 4 (Always-On) or option 5 (Everything)
```

### Via Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/tpk-ror/claude-code-plans-bank/main/quick-install.sh | bash
```

### Manual Installation

1. Copy the hook script:
   ```bash
   mkdir -p ~/.claude/hooks
   cp option-d-always-on/hooks/plans-bank-sync.sh ~/.claude/hooks/
   chmod +x ~/.claude/hooks/plans-bank-sync.sh
   ```

2. Copy shared utilities:
   ```bash
   mkdir -p ~/.claude/shared
   cp shared/plan-utils.sh ~/.claude/shared/
   ```

3. Copy the config template:
   ```bash
   cp option-d-always-on/config/plans-bank-config.json ~/.claude/plans-bank-config.json
   ```

4. Add hook to `~/.claude/settings.json`:
   ```json
   {
     "plansDirectory": "./plans",
     "hooks": {
       "Stop": [{
         "matcher": "*",
         "hooks": [{"type": "command", "command": "~/.claude/hooks/plans-bank-sync.sh stop"}]
       }]
     }
   }
   ```

## Configuration

Edit `~/.claude/plans-bank-config.json` to customize behavior:

```json
{
  "alwaysOn": true,
  "targetDirectory": "./plans",
  "autoCommit": true,
  "categories": {
    "bugfix": ["bug", "fix", "issue", "error", "patch"],
    "refactor": ["refactor", "cleanup", "reorganize", "restructure"],
    "docs": ["documentation", "readme", "guide", "doc"],
    "test": ["test", "spec", "coverage"]
  },
  "autoArchive": {
    "enabled": true,
    "olderThanDays": 30,
    "archiveDirectory": "./plans/archive"
  }
}
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `alwaysOn` | `true` | Enable/disable automatic renaming |
| `targetDirectory` | `./plans` | Local project plans directory |
| `autoCommit` | `true` | Automatically git commit renamed plans |
| `autoArchive.enabled` | `true` | Enable auto-archiving of old plans |
| `autoArchive.olderThanDays` | `30` | Archive plans older than N days |

## Naming Convention

Plans are named based on their content:

```
{category}-{sanitized-header}-{MM.DD.YY}-{HHMM}.md
```

The time is in Central timezone (America/Chicago) in 24-hour format.

### Categories

The category is auto-detected from the plan's first `# Header`:

| Category | Keywords | Example |
|----------|----------|---------|
| `bugfix` | bug, fix, issue, error, patch | `bugfix-fix-login-error-01.18.26-1430.md` |
| `refactor` | refactor, cleanup, reorganize | `refactor-api-cleanup-01.18.26-1430.md` |
| `docs` | documentation, readme, guide | `docs-api-guide-01.18.26-1430.md` |
| `test` | test, spec, coverage | `test-auth-coverage-01.18.26-1430.md` |
| `feature` | (default) | `feature-add-dark-mode-01.18.26-1430.md` |

### Duplicate Handling

Same-day duplicates get numeric suffixes:
- `feature-my-plan-01.18.26-1430.md`
- `feature-my-plan-01.18.26-1430-2.md`
- `feature-my-plan-01.18.26-1430-3.md`

## Status Check

Use the `/sync-status` command to check status:

```
/sync-status
```

Shows:
- Plans pending rename (default-named)
- Organized plans
- Current configuration
- Archive statistics

## Disabling

To temporarily disable renaming:

1. Set `alwaysOn: false` in config:
   ```json
   {
     "alwaysOn": false
   }
   ```

2. Or remove the hook from `~/.claude/settings.json`

## Troubleshooting

### Plans not being renamed

1. Check that `~/.claude/hooks/plans-bank-sync.sh` exists and is executable
2. Verify hook is configured in `~/.claude/settings.json`
3. Run `~/.claude/hooks/plans-bank-sync.sh status` to see current status

### Auto-commit not working

Ensure you're in a git repository and have `autoCommit: true` in config.

## Files Installed

| File | Purpose |
|------|---------|
| `~/.claude/hooks/plans-bank-sync.sh` | Main rename hook script |
| `~/.claude/shared/plan-utils.sh` | Shared utility functions |
| `~/.claude/plans-bank-config.json` | Configuration file |
| `~/.claude/commands/sync-status.md` | Slash command for status |
