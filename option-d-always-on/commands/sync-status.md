---
description: Show plans status and configuration
allowed-tools: Bash, Read
argument-hint: [--verbose]
---

Show the current status for the Plans Bank, including plans pending rename, organized plans, and configuration.

## Instructions

Follow these steps to display the status:

### Step 1: Check if hook is configured

Check if the plans-bank-sync.sh hook exists (project-local or global):
```bash
if [[ -f ./.claude/hooks/plans-bank-sync.sh ]]; then
    echo "configured (project-local)"
elif [[ -f ~/.claude/hooks/plans-bank-sync.sh ]]; then
    echo "configured (global)"
else
    echo "not configured"
fi
```

If not configured, inform the user they may want to install the hook for auto-rename.

### Step 2: Run status command (if hook exists)

If configured, run the status command from the appropriate location:
```bash
if [[ -f ./.claude/hooks/plans-bank-sync.sh ]]; then
    ./.claude/hooks/plans-bank-sync.sh status
elif [[ -f ~/.claude/hooks/plans-bank-sync.sh ]]; then
    ~/.claude/hooks/plans-bank-sync.sh status
fi
```

### Step 3: List plans pending rename

List plans in `./docs/plans/` that have default naming (word-word-word.md pattern):
```bash
for file in ./docs/plans/*.md; do
    filename=$(basename "$file")
    if [[ "$filename" =~ ^[a-z]+-[a-z]+-[a-z]+\.md$ ]]; then
        echo "  - $filename (pending rename)"
    fi
done
```

### Step 4: List organized plans

Show organized plans (those matching the category-name-date pattern):
```bash
for file in ./docs/plans/*.md; do
    filename=$(basename "$file")
    if [[ "$filename" =~ ^(feature|bugfix|refactor|docs|test)-.*-[0-9]{2}\.[0-9]{2}\.[0-9]{2}(-[0-9]+)?\.md$ ]]; then
        echo "  - $filename"
    fi
done
```

### Step 5: Show archive contents (if --verbose)

If `--verbose` flag is provided, also show archived plans:
```bash
ls -la ./docs/plans/archive/*.md 2>/dev/null | head -10
```

### Step 6: Display configuration

Read and display the current configuration (project-local takes precedence):
```bash
if [[ -f ./.claude/plans-bank-config.json ]]; then
    echo "Config: ./.claude/plans-bank-config.json (project-local)"
    cat ./.claude/plans-bank-config.json
elif [[ -f ~/.claude/plans-bank-config.json ]]; then
    echo "Config: ~/.claude/plans-bank-config.json (global)"
    cat ~/.claude/plans-bank-config.json
else
    echo "No config file found (using defaults)"
fi
```

### Step 7: Summarize

Provide a summary to the user:
- Number of plans pending rename (default-named)
- Number of organized plans
- Number of archived plans
- Current configuration settings

## Examples

**Basic usage:**
```
/sync-status
```
Shows plan counts and current config.

**Verbose mode:**
```
/sync-status --verbose
```
Also includes archived plans and full configuration details.

## Output Format

```
Plans Bank Status
=================

Configuration:
  Hook installed: yes
  Plans Directory: ./docs/plans
  Auto-Commit: true
  Auto-Archive: enabled (30 days)

Pending Rename (2):
  - groovy-gathering-chipmunk.md
  - sweet-berry-wine.md

Organized Plans (5):
  - feature-add-dark-mode-01.18.26.md
  - bugfix-fix-login-error-01.17.26.md
  - feature-api-redesign-01.16.26.md
  - docs-readme-update-01.15.26.md
  - refactor-cleanup-utils-01.14.26.md

Archived: 3 files

Summary:
  Total in ./docs/plans/: 7 plans
  Pending rename: 2
  Organized: 5
  Archived: 3
```
