# Option D: Always-On Auto-Save

Automatically sync plans from `~/.claude/plans/` to your project's `./plans/` directory with proper naming - no manual commands required.

## How It Works

Option D uses two Claude Code hooks:

1. **SessionStart Hook**: Catches up on plans created while offline or in other projects
2. **Stop Hook**: Processes plans after each session ends

Plans are **copied** (not moved) from the global `~/.claude/plans/` directory to your local `./plans/` folder with descriptive naming.

## Features

- **Automatic Sync**: Plans are synced without manual intervention
- **Smart Categories**: Auto-detects category from plan header (bugfix, refactor, docs, test, feature)
- **Content Hash Tracking**: Prevents duplicate syncs across projects
- **Auto-Archive**: Moves old plans (30+ days) to `./plans/archive/`
- **Auto-Commit**: Optionally commits each synced plan to git
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

4. Add hooks to `~/.claude/settings.json`:
   ```json
   {
     "hooks": {
       "SessionStart": [{
         "matcher": "*",
         "hooks": [{"type": "command", "command": "~/.claude/hooks/plans-bank-sync.sh session-start"}]
       }],
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
  "sourceDirectory": "~/.claude/plans",
  "targetDirectory": "./plans",
  "namingPrefix": "feature",
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
| `alwaysOn` | `true` | Enable/disable automatic syncing |
| `sourceDirectory` | `~/.claude/plans` | Global plans directory |
| `targetDirectory` | `./plans` | Local project plans directory |
| `namingPrefix` | `feature` | Default prefix for uncategorized plans |
| `autoCommit` | `true` | Automatically git commit synced plans |
| `autoArchive.enabled` | `true` | Enable auto-archiving of old plans |
| `autoArchive.olderThanDays` | `30` | Archive plans older than N days |

## Naming Convention

Plans are named based on their content:

```
{category}-{sanitized-header}-{MM.DD.YY}.md
```

### Categories

The category is auto-detected from the plan's first `# Header`:

| Category | Keywords | Example |
|----------|----------|---------|
| `bugfix` | bug, fix, issue, error, patch | `bugfix-fix-login-error-01.18.26.md` |
| `refactor` | refactor, cleanup, reorganize | `refactor-api-cleanup-01.18.26.md` |
| `docs` | documentation, readme, guide | `docs-api-guide-01.18.26.md` |
| `test` | test, spec, coverage | `test-auth-coverage-01.18.26.md` |
| `feature` | (default) | `feature-add-dark-mode-01.18.26.md` |

### Duplicate Handling

Same-day duplicates get numeric suffixes:
- `feature-my-plan-01.18.26.md`
- `feature-my-plan-01.18.26-2.md`
- `feature-my-plan-01.18.26-3.md`

## Sync Status

Use the `/sync-status` command to check sync status:

```
/sync-status
```

Shows:
- Pending (unsynced) plans
- Recently synced plans
- Current configuration
- Archive statistics

## How Tracking Works

Plans are tracked by content hash in `~/.claude/.plans-bank-processed`:

```
<md5_hash>|<target_path>|<timestamp>
```

This prevents:
- Re-syncing the same plan multiple times
- Duplicate files when working across projects
- Syncing already-organized files

## Disabling

To temporarily disable syncing:

1. Set `alwaysOn: false` in config:
   ```json
   {
     "alwaysOn": false
   }
   ```

2. Or remove the hooks from `~/.claude/settings.json`

## Troubleshooting

### Plans not syncing

1. Check that `~/.claude/hooks/plans-bank-sync.sh` exists and is executable
2. Verify hooks are configured in `~/.claude/settings.json`
3. Run `~/.claude/hooks/plans-bank-sync.sh status` to see current status

### Duplicate plans appearing

Check `~/.claude/.plans-bank-processed` - if corrupted, delete it to reset tracking.

### Auto-commit not working

Ensure you're in a git repository and have `autoCommit: true` in config.

## Files Installed

| File | Purpose |
|------|---------|
| `~/.claude/hooks/plans-bank-sync.sh` | Main sync hook script |
| `~/.claude/shared/plan-utils.sh` | Shared utility functions |
| `~/.claude/plans-bank-config.json` | Configuration file |
| `~/.claude/.plans-bank-processed` | Tracking log (auto-created) |
| `~/.claude/commands/sync-status.md` | Slash command for status |
