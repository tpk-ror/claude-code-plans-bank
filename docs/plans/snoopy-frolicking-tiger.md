# Plan: Remove Global Plans Syncing - Project-Only Plan Management

## Problem
The current implementation syncs plans from `~/.claude/plans/` (global) to `./plans/` (project-local). This causes plans from other projects to be incorrectly copied into the current project.

## Desired Behavior
- **One plan file per Claude Code session** - Claude creates files like `snoopy-frolicking-tiger.md`
- **Updates stay in same file** - Multiple plan iterations within a session update the same file (Claude handles this)
- **On save** - Rename the session's plan file from default name to descriptive format
- **Never cross-project** - No reading/copying from `~/.claude/plans/`

## Solution
Remove all functionality that reads from `~/.claude/plans/`. The `/save-plan` command and hooks should only operate on plan files in the current project's `./plans/` directory.

---

## Files to Modify

### 1. `shared/plan-utils.sh`
- Remove `get_sync_status()` function (lines ~439-478)
- Remove `copy_and_rename_plan()` function (lines ~513-556)
- Remove sync tracking variables: `PLANS_BANK_PROCESSED_LOG`, `PLANS_BANK_CONFIG`
- Remove `mark_file_processed()` and `is_file_processed()` functions
- Keep: `extract_plan_name()`, `sanitize_name()`, `generate_filename()`, `is_default_name()`, `is_organized_name()`

### 2. `option-d-always-on/hooks/plans-bank-sync.sh`
- Remove `DEFAULT_SOURCE_DIR` pointing to `~/.claude/plans`
- Remove configuration loading for `sourceDirectory`
- Change to only scan `./plans/` for files with default names and rename them in-place

### 3. `option-a-slash-command/save-plan.md`
- Change Step 1: Find plans in `./plans/` instead of `~/.claude/plans/`
- Rename in-place within `./plans/`

### 4. `option-a-slash-command/list-plans.md`
- Remove global directory listing
- Only list project-local `./plans/`

### 5. `option-a-slash-command/search-plans.md`
- Remove `GLOBAL_DIR` variable and search logic
- Only search in `./plans/`

### 6. `option-a-slash-command/archive-plan.md`
- Remove `GLOBAL_ARCHIVE` references
- Only archive from/to `./plans/archive/`

### 7. `option-d-always-on/commands/sync-status.md`
- Remove global sync status
- Show only local `./plans/` status (organized vs default-named files)

### 8. `option-d-always-on/config/plans-bank-config.json`
- Remove `sourceDirectory` key

### 9. Documentation updates
- `install.sh` - Remove "syncs from ~/.claude/plans" language
- `quick-install.sh` - Remove global sync references
- `README.md` - Update to reflect project-only behavior

---

## New Behavior
1. Claude Code creates plan in `./plans/word-word-word.md` (per session)
2. User iterates on plan → Claude updates same file
3. User runs `/save-plan` or hook triggers → renames `word-word-word.md` to `feature-descriptive-name-MM.DD.YY.md`
4. No interaction with `~/.claude/plans/` whatsoever

## Verification
1. Create a plan file with default name in `./plans/` (e.g., `test-happy-dog.md`)
2. Run `/save-plan` and verify it renames within `./plans/`
3. Verify `grep -r "~/.claude/plans" .` returns no matches in scripts
4. Test in a different project to confirm no cross-project pollution
