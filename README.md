# Claude Code Plan Bank

<p align="center">
  <img src="image.svg" alt="Claude Code Plans Bank" width="800">
</p>

Organize your Claude Code plan files with descriptive, date-stamped naming conventions.

## The Problem

When you create plans in Claude Code's plan mode, they get saved with auto-generated names like `sweet-berry-wine.md`. These names are fun but make it hard to find specific plans later.

## The Solution

This project provides four options to automatically rename your plans to a descriptive format:

```
{category}-{extracted-name}-{MM.DD.YY}.md
```

**Before:** `~/.claude/plans/groovy-gathering-chipmunk.md`

**After:** `./plans/feature-add-user-authentication-01.18.26.md`

Categories are auto-detected from plan headers: `bugfix-`, `refactor-`, `docs-`, `test-`, or `feature-` (default).

## Quick Start

```bash
git clone https://github.com/tpk-ror/claude-code-plans-bank.git
cd claude-code-plans-bank
./install.sh
```

## Installation Options

### Option A: Slash Command (Recommended)

A manual command you run when you want to save a plan.

**Install:**
```bash
./install.sh  # Choose option 1
```

**Usage:**
```bash
# Basic - extracts name from plan's first heading
/save-plan

# With custom name
/save-plan my-feature-name

# Save and git commit
/save-plan --commit

# Custom name with commit
/save-plan auth-redesign --commit
```

**How it works:**
1. Finds the most recent `.md` file in `~/.claude/plans/`
2. Extracts the first `# Header` for naming (or uses your custom name)
3. Creates `./plans/` directory if needed
4. Moves and renames the file
5. Optionally commits to git

### Option B: Automatic Hook

Automatically renames plans when Claude Code stops responding.

**Install:**
```bash
./install.sh  # Choose option 2
```

**Configuration:**

If you have an existing `~/.claude/settings.json`, add this hook configuration:

```json
{
  "plansDirectory": "./plans",
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/organize-plan.sh"
          }
        ]
      }
    ]
  }
}
```

**How it works:**
1. Hook fires when Claude stops responding
2. Scans `./plans/` for files with default naming (adjective-noun-animal pattern)
3. Extracts the first `# Header` from each file
4. Renames to `feature-{name}-{date}.md`
5. Skips already-organized files

### Option C: Quick Plugin

One-liner installation that sets up slash commands + automatic hook.

**Install:**
```bash
./install.sh  # Choose option 3
```

**What gets installed:**
- Slash commands (`/save-plan`, `/list-plans`, `/search-plans`, `/archive-plan`)
- Automatic hook (runs on session stop)
- Shared utilities
- Settings.json configuration (auto-merged if `jq` is available)

### Option D: Always-On Auto-Save (Recommended)

Automatically syncs plans from `~/.claude/plans/` to your project's `./plans/` directory.

**Install:**
```bash
curl -fsSL https://raw.githubusercontent.com/tpk-ror/claude-code-plans-bank/main/quick-install.sh | bash
```

Or via the interactive installer:
```bash
./install.sh  # Choose option 4
```

**What gets installed:**
- All slash commands including `/sync-status`
- SessionStart hook (syncs plans when Claude Code starts)
- Stop hook (syncs plans when Claude Code stops)
- Configuration file (`~/.claude/plans-bank-config.json`)
- Shared utilities

**Features:**
- **Auto-sync**: Plans automatically copied from `~/.claude/plans/` to `./plans/`
- **Auto-categorize**: Detects category from header (bugfix, refactor, docs, test, feature)
- **Auto-archive**: Moves plans older than 30 days to `./plans/archive/`
- **Auto-commit**: Commits each synced plan to git
- **Content tracking**: Prevents duplicate syncs via MD5 hash

**Configuration:**

Edit `~/.claude/plans-bank-config.json`:
```json
{
  "alwaysOn": true,
  "sourceDirectory": "~/.claude/plans",
  "targetDirectory": "./plans",
  "autoCommit": true,
  "autoArchive": {
    "enabled": true,
    "olderThanDays": 30
  }
}
```

**Uninstall:**
```bash
curl -fsSL https://raw.githubusercontent.com/tpk-ror/claude-code-plans-bank/main/quick-install.sh | bash -s -- --uninstall
```

## Naming Format

| Component | Description | Example |
|-----------|-------------|---------|
| `{category}-` | Auto-detected or default `feature-` | `bugfix-`, `feature-` |
| `{name}` | Sanitized from header or custom | `add-user-auth` |
| `{MM.DD.YY}` | Date created | `01.18.26` |
| `.md` | Markdown extension | `.md` |

**Full example:** `feature-add-user-auth-01.18.26.md`

### Category Detection (Option D)

Categories are auto-detected from plan headers:

| Category | Keywords | Example Header |
|----------|----------|----------------|
| `bugfix` | bug, fix, issue, error, patch | "Fix login error" |
| `refactor` | refactor, cleanup, reorganize | "Refactor API layer" |
| `docs` | documentation, readme, guide | "Documentation update" |
| `test` | test, spec, coverage | "Add test coverage" |
| `feature` | (default) | "Add dark mode" |

### Duplicate Handling

If a filename already exists, a numeric suffix is added:
- `feature-my-plan-01.18.26.md`
- `feature-my-plan-01.18.26-2.md`
- `feature-my-plan-01.18.26-3.md`

## Project Structure

```
claude-code-plans-bank/
├── README.md                      # This file
├── LICENSE                        # MIT License
├── install.sh                     # Interactive installer
├── quick-install.sh               # One-liner installer
│
├── option-a-slash-command/
│   ├── save-plan.md               # /save-plan command
│   ├── list-plans.md              # /list-plans command
│   ├── search-plans.md            # /search-plans command
│   └── archive-plan.md            # /archive-plan command
│
├── option-b-automatic/
│   ├── settings.json              # Settings snippet to merge
│   └── hooks/
│       └── organize-plan.sh       # Hook script for ./plans/
│
├── option-c-plugin/
│   ├── README.md                  # Option C documentation
│   └── uninstall.sh               # Standalone uninstall script
│
├── option-d-always-on/
│   ├── README.md                  # Option D documentation
│   ├── settings.json              # Settings with SessionStart + Stop hooks
│   ├── config/
│   │   └── plans-bank-config.json # Default configuration template
│   ├── hooks/
│   │   └── plans-bank-sync.sh     # Main sync hook script
│   └── commands/
│       └── sync-status.md         # /sync-status command
│
└── shared/
    └── plan-utils.sh              # Shared utility functions
```

## Configuration

### Custom Plans Directory

By default, plans are saved to `./plans/` in your project. To change this:

1. For slash command: Edit `~/.claude/commands/save-plan.md`

2. For automatic hook: Edit `~/.claude/hooks/organize-plan.sh` and change `PLANS_DIR`

### Disabling Git Commits

The `--commit` flag is opt-in. If you never want git integration, simply don't use the flag.

## Comparison

| Feature | Option A (Slash) | Option B (Hook) | Option C (Plugin) | Option D (Always-On) |
|---------|------------------|-----------------|-------------------|----------------------|
| Control | Manual | Automatic | Both | Automatic |
| Custom names | Yes | No | Yes | No |
| Git integration | Yes (`--commit`) | No | Yes (`--commit`) | Yes (auto) |
| Setup complexity | Simple | Moderate | Easy | Easiest |
| One-liner install | No | No | No | Yes |
| Auto-merge settings | No | No | Yes (with jq) | Yes (with jq) |
| Syncs from ~/.claude/plans | No | No | No | Yes |
| Auto-categorize | No | No | No | Yes |
| Auto-archive | No | No | No | Yes |
| Best for | Selective saving | Files in ./plans/ | Slash + hook | Full automation |

## Troubleshooting

### "No plan file found"

Make sure you have a plan in `~/.claude/plans/`. Claude Code saves plans there when you exit plan mode.

### Hook not running

1. Check that `~/.claude/hooks/organize-plan.sh` is executable: `chmod +x ~/.claude/hooks/organize-plan.sh`
2. Verify your `settings.json` has the correct hook configuration
3. Ensure Claude Code is using your global settings

### Duplicate handling not working

The duplicate detection checks the target directory (`./plans/`), not the source. If you see unexpected behavior, check file permissions.

### Name extraction wrong

The tool extracts the first line starting with `# `. If your plan doesn't have a header, it will use "untitled-plan".

## Uninstalling

```bash
./install.sh  # Choose option 6
```

Or via curl:
```bash
curl -fsSL https://raw.githubusercontent.com/tpk-ror/claude-code-plans-bank/main/quick-install.sh | bash -s -- --uninstall
```

Or manually:
```bash
rm ~/.claude/commands/save-plan.md
rm ~/.claude/commands/list-plans.md
rm ~/.claude/commands/search-plans.md
rm ~/.claude/commands/archive-plan.md
rm ~/.claude/commands/sync-status.md
rm ~/.claude/hooks/organize-plan.sh
rm ~/.claude/hooks/plans-bank-sync.sh
rm ~/.claude/shared/plan-utils.sh
rm ~/.claude/plans-bank-config.json
# Edit ~/.claude/settings.json to remove the hooks
```

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with both installation options
5. Submit a pull request

## License

MIT License - See [LICENSE](LICENSE) for details.

## Related

- [Claude Code](https://claude.ai/claude-code) - Anthropic's CLI for Claude
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
