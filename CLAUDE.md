# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository provides tools to rename Claude Code plan files from auto-generated names (e.g., `groovy-gathering-chipmunk.md`) to descriptive, date-and-time-stamped names (e.g., `feature-add-user-auth-01.18.26-1430.md`). Time is in Central timezone (America/Chicago).

Three installation options are available:
- **Option A (Slash Command)**: Manual `/save-plan` command for on-demand use
- **Option B (Automatic Hook)**: Runs on Claude Code session stop via the `Stop` hook
- **Option C (Quick Plugin)**: One-liner install via `curl | bash` that installs everything

## Architecture

```
install.sh                           # Interactive installer (bash menu, options 1-6)
quick-install.sh                     # One-liner installer for Option C (curl | bash)
├── option-a-slash-command/
│   └── save-plan.md                 # Slash command definition for ~/.claude/commands/
├── option-b-automatic/
│   ├── settings.json                # Sample Claude settings with Stop hook config
│   └── hooks/organize-plan.sh       # Hook script with inline fallback utilities
├── option-c-plugin/
│   ├── README.md                    # Option C documentation
│   └── uninstall.sh                 # Standalone uninstall script
└── shared/
    └── plan-utils.sh                # Shared bash functions for all options
```

## Key Functions (shared/plan-utils.sh)

- `extract_plan_name`: Gets first `# Header` from markdown file
- `sanitize_name`: Converts to lowercase, replaces non-alphanumeric with hyphens
- `generate_filename`: Creates `feature-{name}-{MM.DD.YY}-{HHMM}.md` with duplicate suffix handling
- `generate_categorized_filename`: Creates `{category}-{name}-{MM.DD.YY}-{HHMM}.md`
- `is_default_name`: Detects Claude's `word-word-word.md` pattern
- `is_organized_name`: Detects our organized pattern with date and time
- `detect_category`: Auto-detects category (bugfix, refactor, docs, test, feature) from header

## Naming Convention

Output format: `{category}-{sanitized-name}-{MM.DD.YY}-{HHMM}.md`

- Time is in Central timezone (America/Chicago) in 24-hour format
- Duplicates get numeric suffix: `-2`, `-3`, etc.

## Testing Changes

There are no automated tests. To test manually:
1. Run `./install.sh` and select an option
2. For slash command: Create a plan, then run `/save-plan`
3. For hook: Check that `~/.claude/hooks/organize-plan.sh` is executable and settings.json has the hook configured
