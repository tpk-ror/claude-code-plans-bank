# Feature: Global vs Project-Specific Installation + Plans Directory Change

## Summary
1. Add the ability for users to choose between global installation (`~/.claude/`) and project-specific installation (`./.claude/`). Both `install.sh` and `quick-install.sh` will prompt users to choose, with flags available for non-interactive use.
2. Change the default plans directory from `./plans` to `./docs/plans`.

## User Flow

### install.sh
```
$ ./install.sh

Installation Scope
==================

Where would you like to install Claude Code Plans Bank?

  1) Global (~/.claude/)
     - Available in all projects
     - Hooks run for all Claude Code sessions

  2) Project-specific (./.claude/)
     - Only available in this project
     - Uses settings.local.json
     - Hooks only run for this project

Enter choice [1-2]: _
```

### quick-install.sh
```bash
# Interactive (prompts for choice)
curl -fsSL <url>/quick-install.sh | bash

# Non-interactive
curl -fsSL <url>/quick-install.sh | bash -s -- --global
curl -fsSL <url>/quick-install.sh | bash -s -- --project
```

## Target Destinations

| Component | Global | Project-Specific |
|-----------|--------|------------------|
| Commands | `~/.claude/commands/` | `./.claude/commands/` |
| Hooks | `~/.claude/hooks/` | `./.claude/hooks/` |
| Shared utils | `~/.claude/shared/` | `./.claude/shared/` |
| Settings | `~/.claude/settings.json` | `./.claude/settings.local.json` |
| Config | `~/.claude/plans-bank-config.json` | `./.claude/plans-bank-config.json` |

## Implementation

### 1. Update `install.sh`

**Lines 15-21**: Replace hardcoded paths with dynamic variables

```bash
# New global variables
INSTALL_MODE=""  # "global" or "project"
HOOK_PATH_PREFIX=""  # "~/.claude" or "./.claude"

# New function: select_install_mode()
# - Shows menu with options 1) Global 2) Project
# - Sets INSTALL_MODE based on user choice

# New function: setup_directories()
# - Sets CLAUDE_DIR, COMMANDS_DIR, HOOKS_DIR, SHARED_DIR based on INSTALL_MODE
# - Sets SETTINGS_FILE to settings.json (global) or settings.local.json (project)
# - Sets HOOK_PATH_PREFIX for use in settings.json hook commands
```

**Modify `main()`**: Call `select_install_mode()` before showing the existing menu

**Update all functions**: Use `$HOOK_PATH_PREFIX` instead of hardcoded `~/.claude` in settings.json hooks

### 2. Update `quick-install.sh`

**Add CLI flags**:
- `--global` / `-g`: Install globally
- `--project` / `-p`: Install to current project
- No flag: Prompt interactively

**Lines 18-24**: Same dynamic path setup as install.sh

**Update `merge_settings_with_jq()`**: Use `$HOOK_PATH_PREFIX` instead of hardcoded `~/.claude/hooks/...`

**Update `show_help()`**: Document the new flags

### 3. Update Hook Scripts

**`option-b-automatic/hooks/organize-plan.sh`** and **`option-d-always-on/hooks/plans-bank-sync.sh`**:

Add cascading fallback for finding `plan-utils.sh`:
```bash
# Priority order:
# 1) Project-local ./.claude/shared/plan-utils.sh
# 2) Global ~/.claude/shared/plan-utils.sh
# 3) Relative to script location (existing behavior)
# 4) Inline fallback functions (existing behavior)
```

### 4. Update Uninstall Functions

Both installers' uninstall functions need to:
1. Prompt which installation to remove: Global, Project, or Both
2. Use the selected path for file removal

### 5. Create Project Settings Templates

Create `settings.local.json` templates for options B and D with `./.claude/hooks/...` paths (instead of `~/.claude/hooks/...`).

### 6. Change Default Plans Directory

Update all references from `./plans` to `./docs/plans`:

**Files with `plansDirectory` setting:**
- `option-b-automatic/settings.json` → `"plansDirectory": "./docs/plans"`
- `option-d-always-on/settings.json` → `"plansDirectory": "./docs/plans"`
- `option-d-always-on/config/plans-bank-config.json` → `"targetDirectory": "./docs/plans"`

**Files with archive path:**
- `option-d-always-on/config/plans-bank-config.json` → `"archiveDirectory": "./docs/plans/archive"`

**Slash commands (update default paths in instructions):**
- `option-a-slash-command/save-plan.md`
- `option-a-slash-command/list-plans.md`
- `option-a-slash-command/search-plans.md`
- `option-a-slash-command/archive-plan.md`

**Documentation:**
- `CLAUDE.md` → Update architecture diagram
- `README.md` (if exists)

## Files to Modify

| File | Changes |
|------|---------|
| `install.sh` | Add mode selection, dynamic paths, update all functions |
| `quick-install.sh` | Add `--global`/`--project` flags, mode prompt, dynamic paths |
| `option-b-automatic/hooks/organize-plan.sh` | Add project-local path fallback |
| `option-d-always-on/hooks/plans-bank-sync.sh` | Add project-local path and config fallback |
| `option-c-plugin/uninstall.sh` | Add mode selection for uninstall |
| `option-b-automatic/settings.json` | Change `plansDirectory` to `./docs/plans` |
| `option-d-always-on/settings.json` | Change `plansDirectory` to `./docs/plans` |
| `option-d-always-on/config/plans-bank-config.json` | Change `targetDirectory` and `archiveDirectory` |
| `option-a-slash-command/*.md` | Update default paths in instructions |
| `CLAUDE.md` | Update documentation |

## Files to Create

| File | Purpose |
|------|---------|
| `option-b-automatic/settings.local.json` | Project settings template with `./.claude/hooks/...` and `./docs/plans` |
| `option-d-always-on/settings.local.json` | Project settings template with `./.claude/hooks/...` and `./docs/plans` |

## Edge Cases

1. **Mixed installations**: User has both global and project installs
   - Claude Code gives project-local precedence (expected behavior)
   - Hook scripts check project-local first by design

2. **Relative paths in hooks**: Project installs use `./.claude/hooks/...`
   - Works because hooks run from project root directory

3. **Git considerations**: Project `.claude/` may need to be gitignored
   - Add documentation note about this

## Verification

1. **Test global install** via `install.sh` option 1 → files in `~/.claude/`
2. **Test project install** via `install.sh` option 2 → files in `./.claude/`
3. **Test quick-install flags**: `--global` and `--project` work correctly
4. **Test interactive quick-install**: prompts when no flag provided
5. **Test hook execution**: both global and project hooks find `plan-utils.sh`
6. **Test uninstall**: correctly removes from chosen location
7. **Test mixed scenario**: project install takes precedence over global
