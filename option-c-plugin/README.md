# Option C: Quick Plugin Install

One-liner installation that sets up everything automatically.

## Installation

### Interactive (prompts for scope)
```bash
curl -fsSL https://raw.githubusercontent.com/tpk-ror/claude-code-plans-bank/main/quick-install.sh | bash
```

### Non-Interactive
```bash
# Global install (all projects)
curl -fsSL https://raw.githubusercontent.com/tpk-ror/claude-code-plans-bank/main/quick-install.sh | bash -s -- --global

# Project install (current project only)
curl -fsSL https://raw.githubusercontent.com/tpk-ror/claude-code-plans-bank/main/quick-install.sh | bash -s -- --project
```

## Installation Modes

| Mode | Location | Settings File | Best For |
|------|----------|---------------|----------|
| **Global** | `~/.claude/` | `settings.json` | Available in all projects |
| **Project** | `./.claude/` | `settings.local.json` | Only this project |

## What Gets Installed

| Component | Global Location | Project Location |
|-----------|-----------------|------------------|
| Slash commands | `~/.claude/commands/*.md` | `./.claude/commands/*.md` |
| Hook scripts | `~/.claude/hooks/*.sh` | `./.claude/hooks/*.sh` |
| Utilities | `~/.claude/shared/plan-utils.sh` | `./.claude/shared/plan-utils.sh` |
| Settings | `~/.claude/settings.json` | `./.claude/settings.local.json` |
| Config | `~/.claude/plans-bank-config.json` | `./.claude/plans-bank-config.json` |

## Settings Handling

The installer handles your settings file intelligently:

| Scenario | Action |
|----------|--------|
| No existing file | Creates new settings file with hook config |
| Existing file + `jq` available | Auto-merges hook configuration |
| Existing file + no `jq` | Shows manual instructions |

### Manual Configuration

If auto-merge isn't possible, add this to your settings file:

**Global (`~/.claude/settings.json`):**
```json
{
  "plansDirectory": "./docs/plans",
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

**Project (`./.claude/settings.local.json`):**
```json
{
  "plansDirectory": "./docs/plans",
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "./.claude/hooks/organize-plan.sh"
          }
        ]
      }
    ]
  }
}
```

## Usage After Installation

```bash
# Manual: Save current plan with auto-extracted name
/save-plan

# Manual: Save with custom name
/save-plan my-feature-name

# Manual: Save and commit to git
/save-plan --commit

# Automatic: Plans are renamed when Claude Code session stops
```

## Uninstall

**Via curl (prompts for scope):**
```bash
curl -fsSL https://raw.githubusercontent.com/tpk-ror/claude-code-plans-bank/main/quick-install.sh | bash -s -- --uninstall
```

**Via local script:**
```bash
./option-c-plugin/uninstall.sh
```

The uninstaller will prompt you to choose which installation to remove (Global, Project, or Both).

## Comparison with Other Options

| Feature | Option A | Option B | Option C |
|---------|----------|----------|----------|
| Slash command | Yes | No | Yes |
| Automatic hook | No | Yes | Yes |
| One-liner install | No | No | Yes |
| Settings auto-merge | No | No | Yes (with jq) |
| Git clone required | Yes | Yes | No |
| Global/Project choice | Yes | Yes | Yes |
| Best for | Manual control | Full automation | Quick setup |

## Troubleshooting

### "Neither curl nor wget found"

Install curl or wget:
```bash
# Ubuntu/Debian
sudo apt install curl

# macOS (usually pre-installed)
brew install curl

# Windows (Git Bash)
# curl is included with Git Bash
```

### Settings merge failed

If auto-merge fails and you see manual instructions:

1. Install `jq` for auto-merge: `brew install jq` or `apt install jq`
2. Re-run the installer
3. Or manually add the hook configuration

### Hook not running after install

1. Verify the hook is executable:
   ```bash
   # For global install
   ls -la ~/.claude/hooks/organize-plan.sh

   # For project install
   ls -la ./.claude/hooks/organize-plan.sh
   ```

2. Check settings file has the hook configured:
   ```bash
   # For global install
   cat ~/.claude/settings.json | grep -A5 "Stop"

   # For project install
   cat ./.claude/settings.local.json | grep -A5 "Stop"
   ```

3. Restart Claude Code to pick up new settings

### Project .claude/ directory

For project-specific installs, you may want to add `.claude/` to your `.gitignore` if you don't want to commit the configuration:

```bash
echo ".claude/" >> .gitignore
```

Or, commit it to share the configuration with your team.
