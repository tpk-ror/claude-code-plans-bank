# Plan: Add Option C - Plugin Installation

## Summary

Add a new "Option C - Quick Plugin Install" that provides a one-liner installation experience using `curl | bash`. This keeps Options A and B unchanged while adding a simpler alternative that installs everything automatically.

## One-Liner Command

```bash
curl -fsSL https://raw.githubusercontent.com/yourusername/claude-code-plans-bank/main/quick-install.sh | bash
```

## Files to Create

### 1. `quick-install.sh` (root level)

Self-contained installer script that:
- Downloads slash command → `~/.claude/commands/save-plan.md`
- Downloads hook script → `~/.claude/hooks/organize-plan.sh`
- Downloads utilities → `~/.claude/shared/plan-utils.sh`
- Handles settings.json merging:
  - No existing file → creates new
  - Existing file + jq available → auto-merges hook config
  - Existing file + no jq → shows manual instructions
- Supports `--uninstall` flag for removal
- Provides colored output and progress feedback

### 2. `option-c-plugin/README.md`

Documentation specific to Option C explaining:
- Installation command
- What gets installed
- Settings.json handling
- Uninstall instructions
- Comparison with Options A and B

### 3. `option-c-plugin/uninstall.sh`

Standalone uninstall script for local use (removes installed components).

## Files to Modify

### 4. `install.sh`

- Add new `install_plugin()` function that:
  - Installs slash command (like Option A)
  - Installs hook + utilities (like Option B)
  - Auto-merges settings.json using jq if available
- Update menu from 5 options to 6:
  ```
  1) Slash Command (Option A)
  2) Automatic Hook (Option B)
  3) Both options
  4) Quick Plugin (Option C) - RECOMMENDED  ← NEW
  5) Uninstall
  6) Exit
  ```

### 5. `README.md`

- Add Option C section after Option B
- Update comparison table to include Option C
- Update project structure to show new files

### 6. `CLAUDE.md`

- Update architecture diagram to include `quick-install.sh` and `option-c-plugin/`

## Implementation Order

1. Create `quick-install.sh`
2. Create `option-c-plugin/` directory and files
3. Update `install.sh` with new menu option and function
4. Update `README.md` documentation
5. Update `CLAUDE.md` architecture

## Verification

1. **Test fresh install**: Run one-liner on system with no `~/.claude` directory
2. **Test with existing settings**: Run on system with `~/.claude/settings.json`
3. **Test uninstall**: `curl ... | bash -s -- --uninstall`
4. **Test interactive menu**: Run `./install.sh` and select Option 4
5. **Verify functionality**: After install, test `/save-plan` command works
