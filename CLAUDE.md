# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository provides tools to rename Claude Code plan files from auto-generated names (e.g., `groovy-gathering-chipmunk.md`) to descriptive, date-and-time-stamped names (e.g., `feature-add-user-auth-01.18.26-1430.md`). Time is in Central timezone (America/Chicago).

Three installation options are available:
- **Option A (Slash Command)**: Manual `/save-plan` command for on-demand use
- **Option B (Automatic Hook)**: Runs on Claude Code session stop via the `Stop` hook
- **Option C (Quick Plugin)**: One-liner install via `curl | bash` that installs everything

## Installation Scope

Both `install.sh` and `quick-install.sh` support two installation modes:

| Mode | Location | Settings File | Best For |
|------|----------|---------------|----------|
| **Global** | `~/.claude/` | `settings.json` | Available in all projects |
| **Project** | `./.claude/` | `settings.local.json` | Only this project |

### Target Destinations by Mode

| Component | Global | Project-Specific |
|-----------|--------|------------------|
| Commands | `~/.claude/commands/` | `./.claude/commands/` |
| Hooks | `~/.claude/hooks/` | `./.claude/hooks/` |
| Shared utils | `~/.claude/shared/` | `./.claude/shared/` |
| Settings | `~/.claude/settings.json` | `./.claude/settings.local.json` |
| Config | `~/.claude/plans-bank-config.json` | `./.claude/plans-bank-config.json` |

### Non-Interactive Installation

```bash
# Global install
curl -fsSL <url>/quick-install.sh | bash -s -- --global

# Project install
curl -fsSL <url>/quick-install.sh | bash -s -- --project
```

## Architecture

```
install.sh                           # Interactive installer (bash menu, global/project choice)
quick-install.sh                     # One-liner installer (--global, --project, --uninstall flags)
├── option-a-slash-command/
│   ├── save-plan.md                 # Slash command for manual renaming
│   ├── list-plans.md                # Slash command to list plans
│   ├── search-plans.md              # Slash command to search plans
│   └── archive-plan.md              # Slash command to archive plans
├── option-b-automatic/
│   ├── settings.json                # Global settings template (hooks → ~/.claude/hooks/)
│   ├── settings.local.json          # Project settings template (hooks → ./.claude/hooks/)
│   └── hooks/organize-plan.sh       # Hook script with cascading path fallback
├── option-c-plugin/
│   ├── README.md                    # Option C documentation
│   └── uninstall.sh                 # Standalone uninstall script (supports mode selection)
├── option-d-always-on/
│   ├── settings.json                # Global settings template
│   ├── settings.local.json          # Project settings template
│   ├── hooks/plans-bank-sync.sh     # Sync hook with cascading path fallback
│   ├── commands/sync-status.md      # Slash command for status
│   └── config/plans-bank-config.json # Configuration file
└── shared/
    └── plan-utils.sh                # Shared bash functions for all options
```

## Plans Directory

Plans are stored in `./docs/plans/` (project-relative). This is configured via `plansDirectory` in settings.

## Key Functions (shared/plan-utils.sh)

- `extract_plan_name`: Gets first `# Header` from markdown file
- `sanitize_name`: Converts to lowercase, replaces non-alphanumeric with hyphens
- `generate_filename`: Creates `feature-{name}-{MM.DD.YY}-{HHMM}.md` with duplicate suffix handling
- `generate_categorized_filename`: Creates `{category}-{name}-{MM.DD.YY}-{HHMM}.md`
- `is_default_name`: Detects Claude's `word-word-word.md` pattern
- `is_organized_name`: Detects our organized pattern with date and time
- `detect_category`: Auto-detects category (bugfix, refactor, docs, test, feature) from header

## Hook Path Fallback

Hooks use cascading fallback to find `plan-utils.sh`:
1. Project-local: `./.claude/shared/plan-utils.sh`
2. Global: `~/.claude/shared/plan-utils.sh`
3. Relative to script location
4. Inline fallback functions (if all else fails)

This ensures hooks work regardless of installation mode.

## Naming Convention

Output format: `{category}-{sanitized-name}-{MM.DD.YY}-{HHMM}.md`

- Time is in Central timezone (America/Chicago) in 24-hour format
- Duplicates get numeric suffix: `-2`, `-3`, etc.

## Testing Changes

There are no automated tests. To test manually:
1. Run `./install.sh` and select installation scope (Global or Project)
2. Select an installation option (1-5)
3. For slash command: Create a plan, then run `/save-plan`
4. For hook: Check that the hook script is executable and settings file has the hook configured
5. Verify plans are saved to `./docs/plans/`
