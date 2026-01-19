# Always-On Auto-Save Feature for Claude Code Plans

## Summary

Add a new "Option D" that automatically syncs plans from `~/.claude/plans/` to the project's `./plans/` directory with proper naming - no manual commands required.

## Problem

Currently:
- Claude Code saves plans to `~/.claude/plans/` with auto-generated names (e.g., `groovy-gathering-chipmunk.md`)
- The existing Stop hook only renames files **already in** `./plans/` - it doesn't copy from the global directory
- Users must manually run `/save-plan` to organize plans

## Solution

Create a new Option D "Always-On" mode that:
1. Uses **SessionStart** hook to catch up on plans created while offline
2. Uses **Stop** hook to process plans after each session
3. **Copies** (not moves) plans from `~/.claude/plans/` to `./plans/` with proper naming
4. Tracks processed files to avoid duplicates
5. Configurable via `~/.claude/plans-bank-config.json`

## Files to Create

### 1. `option-d-always-on/hooks/plans-bank-sync.sh`
Main hook script that:
- Loads configuration from `~/.claude/plans-bank-config.json`
- Scans `~/.claude/plans/` for unprocessed `.md` files
- Copies each to `./plans/` with `feature-{name}-{MM.DD.YY}.md` naming
- Tracks processed files in `~/.claude/.plans-bank-processed` to prevent duplicates
- Handles same-day duplicates with `-2`, `-3` suffixes

### 2. `option-d-always-on/config/plans-bank-config.json`
Default configuration template:
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

### 3. `option-d-always-on/settings.json`
Sample settings with both hooks:
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

### 4. `option-d-always-on/README.md`
Documentation for the always-on feature

### 5. `option-d-always-on/commands/sync-status.md`
Slash command to show sync status:
- List pending (unsynced) plans in `~/.claude/plans/`
- List recently synced plans with timestamps
- Show current configuration
- Show archive statistics

## Files to Modify

### 1. `shared/plan-utils.sh`
Add sync tracking functions:
- `get_content_hash()` - MD5 hash of file content
- `is_file_processed()` - Check if file already synced
- `mark_file_processed()` - Record in processed log
- `find_organized_copy()` - Find existing copy by content hash
- `detect_category()` - Scan header for category keywords, return prefix (bugfix-, refactor-, docs-, test-, or feature-)
- `archive_old_plans()` - Move plans older than N days to archive subdirectory
- `get_sync_status()` - Return counts of pending/synced/archived plans

### 2. `install.sh`
Add Option D to the menu:
- Option 4: Install always-on auto-save
- Option 5: Install everything (A + B + D)
- Option 6: Uninstall all components
- New `install_always_on()` function
- New `configure_always_on_hooks()` function for settings.json merge

### 3. `quick-install.sh`
Update to include always-on components in the one-liner install

### 4. `README.md`
Document Option D with usage instructions

## Implementation Details

### Sync Script Logic
```
1. Load config (or use defaults if missing)
2. Exit early if alwaysOn=false
3. Ensure ./plans/ exists
4. For each .md file in ~/.claude/plans/:
   a. Skip if already organized (*-*-MM.DD.YY.md pattern)
   b. Skip if already processed (check hash in log)
   c. Extract # Header from file
   d. Detect category from header keywords (bugfix, refactor, docs, test) or default to "feature"
   e. Sanitize name and generate dated filename with category prefix
   f. Copy to ./plans/ with new name
   g. Record hash in processed log
   h. Auto-commit if enabled
5. Run auto-archive if enabled:
   a. Find plans older than N days in ./plans/
   b. Move to ./plans/archive/
```

### Processed Log Format
```
# ~/.claude/.plans-bank-processed
<md5_hash>|<target_path>|<timestamp>
```

## Edge Cases Handled

| Case | Solution |
|------|----------|
| Same-day duplicates | `-2`, `-3` suffix via `generate_filename()` |
| Multiple projects | Content hash tracking prevents re-syncing same file |
| No header in plan | Default to "untitled-plan" |
| Missing target dir | Auto-create `./plans/` |
| Hook errors | Exit silently (non-disruptive) |

## Verification Plan

1. **Fresh install test**: Run `./install.sh`, select Option D, verify files created
2. **SessionStart test**: Manually create test plan in `~/.claude/plans/`, start Claude Code, verify copied to `./plans/`
3. **Stop test**: Create plan during session, exit, verify plan appears in `./plans/`
4. **Duplicate test**: Create multiple plans with same title, verify unique filenames
5. **Config toggle test**: Set `alwaysOn: false`, verify no processing occurs

## Included Features

1. **Plan categories**: Auto-detect prefix (bugfix-, refactor-, docs-, test-) based on header keywords - falls back to "feature-"
2. **Auto-archive**: Move plans older than 30 days (configurable) to `./plans/archive/`
3. **`/sync-status` command**: Show pending/synced/archived plans and current configuration
4. **Auto-commit**: Automatically git commit each synced plan (enabled by default)

## Future Ideas

1. **Notifications**: Alert user when plans are synced via Claude Code notification hook
2. **Cross-project linking**: Track which project a plan was created in via frontmatter metadata
