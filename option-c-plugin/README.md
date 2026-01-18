# Option C: Quick Plugin Install

One-liner installation that sets up everything automatically.

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/yourusername/claude-code-plans-bank/main/quick-install.sh | bash
```

## What Gets Installed

| Component | Location | Purpose |
|-----------|----------|---------|
| Slash command | `~/.claude/commands/save-plan.md` | Manual `/save-plan` command |
| Hook script | `~/.claude/hooks/organize-plan.sh` | Auto-rename on session stop |
| Utilities | `~/.claude/shared/plan-utils.sh` | Shared bash functions |
| Settings | `~/.claude/settings.json` | Hook configuration |

## Settings.json Handling

The installer handles your `settings.json` intelligently:

| Scenario | Action |
|----------|--------|
| No existing file | Creates new `settings.json` with hook config |
| Existing file + `jq` available | Auto-merges hook configuration |
| Existing file + no `jq` | Shows manual instructions |

### Manual Configuration

If auto-merge isn't possible, add this to your `~/.claude/settings.json`:

```json
{
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

**Via curl:**
```bash
curl -fsSL https://raw.githubusercontent.com/yourusername/claude-code-plans-bank/main/quick-install.sh | bash -s -- --uninstall
```

**Via local script:**
```bash
./option-c-plugin/uninstall.sh
```

**Manual removal:**
```bash
rm ~/.claude/commands/save-plan.md
rm ~/.claude/hooks/organize-plan.sh
rm ~/.claude/shared/plan-utils.sh
# Edit ~/.claude/settings.json to remove the Stop hook
```

## Comparison with Other Options

| Feature | Option A | Option B | Option C |
|---------|----------|----------|----------|
| Slash command | Yes | No | Yes |
| Automatic hook | No | Yes | Yes |
| One-liner install | No | No | Yes |
| Settings auto-merge | No | No | Yes (with jq) |
| Git clone required | Yes | Yes | No |
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

### Settings.json merge failed

If auto-merge fails and you see manual instructions:

1. Install `jq` for auto-merge: `brew install jq` or `apt install jq`
2. Re-run the installer
3. Or manually add the hook configuration

### Hook not running after install

1. Verify the hook is executable:
   ```bash
   ls -la ~/.claude/hooks/organize-plan.sh
   ```

2. Check settings.json has the hook configured:
   ```bash
   cat ~/.claude/settings.json | grep -A5 "Stop"
   ```

3. Restart Claude Code to pick up new settings
