# Plan: Create `/generate-commit` Slash Command

## Summary
Create a new Claude Code slash command that analyzes git changes and generates a well-formatted commit message.

## Implementation

### File to Create
`~/.claude/commands/generate-commit.md`

### YAML Frontmatter
```yaml
---
description: Generate a well-formatted commit message from git changes
allowed-tools: Bash, Read
argument-hint: [--staged] [--all] [--simple] [--execute]
---
```

### Command Behavior

1. **Analyze changes** - Run `git diff --cached` (staged) or `git diff` (all) to see what changed
2. **Check commit history** - Look at recent commits to match the project's style
3. **Generate message** - Create a summary line + detailed body explaining changes
4. **Output** - Display the generated message for the user to copy/use

### Supported Flags
| Flag | Description |
|------|-------------|
| `--staged` | Only analyze staged changes (default) |
| `--all` | Analyze all changes (staged + unstaged) |
| `--simple` | Use simple format instead of Conventional Commits |
| `--execute` | Perform the commit with the generated message |

### Commit Message Format

**Conventional Commits (default):**
```
<type>(<scope>): <summary>

<body>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Standard (with --simple flag):**
```
<summary - 50 chars max>

<body wrapped at 72 chars>
- Change 1
- Change 2
```

### Edge Cases Handled
- Not a git repo → Show error
- No changes → Inform user
- Large diffs (>500 lines) → Use `--stat` summary + top files only
- Merge conflicts → Warn user
- Binary files → Note them separately

## Verification
1. Run `/generate-commit` in a git repo with staged changes
2. Verify it outputs a reasonable commit message
3. Test `--conventional` flag produces proper format
4. Test `--execute` actually commits (optional)
