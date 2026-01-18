# Claude Code Plans Bank

Organize your Claude Code plan files with descriptive, date-stamped naming conventions.

## The Problem

When you create plans in Claude Code's plan mode, they get saved with auto-generated names like `groovy-gathering-chipmunk.md`. These names are fun but make it hard to find specific plans later.

## The Solution

This project provides two options to automatically rename your plans to a descriptive format:

```
feature-{extracted-name}-{MM.DD.YY}.md
```

**Before:** `~/.claude/plans/groovy-gathering-chipmunk.md`
**After:** `./plans/feature-add-user-authentication-01.18.26.md`

## Quick Start

```bash
git clone https://github.com/yourusername/claude-code-plans-bank.git
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

## Naming Format

| Component | Description | Example |
|-----------|-------------|---------|
| `feature-` | Fixed prefix | `feature-` |
| `{name}` | Sanitized from header or custom | `add-user-auth` |
| `{MM.DD.YY}` | Date created | `01.18.26` |
| `.md` | Markdown extension | `.md` |

**Full example:** `feature-add-user-auth-01.18.26.md`

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
│
├── option-a-slash-command/
│   └── save-plan.md               # Slash command definition
│
├── option-b-automatic/
│   ├── settings.json              # Settings snippet to merge
│   └── hooks/
│       └── organize-plan.sh       # Hook script
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

| Feature | Option A (Slash Command) | Option B (Automatic) |
|---------|-------------------------|---------------------|
| Control | Manual | Automatic |
| Custom names | Yes | No |
| Git integration | Yes (`--commit`) | No |
| Setup complexity | Simple | Moderate |
| Best for | Selective saving | Always organizing |

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
./install.sh  # Choose option 4
```

Or manually:
```bash
rm ~/.claude/commands/save-plan.md
rm ~/.claude/hooks/organize-plan.sh
# Edit ~/.claude/settings.json to remove the hook
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
