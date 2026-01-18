---
description: Show plans sync status and configuration
allowed-tools: Bash, Read
argument-hint: [--verbose]
---

Show the current sync status for the Plans Bank, including pending plans, recently synced plans, and configuration.

## Instructions

Follow these steps to display the sync status:

### Step 1: Check if sync is configured

Check if the plans-bank-sync.sh hook exists:
```bash
test -f ~/.claude/hooks/plans-bank-sync.sh && echo "configured" || echo "not configured"
```

If not configured, inform the user they need to install Option D (Always-On).

### Step 2: Run status command

If configured, run the status command:
```bash
~/.claude/hooks/plans-bank-sync.sh status
```

### Step 3: List pending plans

List plans in `~/.claude/plans/` that haven't been synced yet:
```bash
ls -la ~/.claude/plans/*.md 2>/dev/null | head -10
```

### Step 4: List recently synced plans

Show the last 5 entries from the processed log:
```bash
tail -5 ~/.claude/.plans-bank-processed 2>/dev/null
```

### Step 5: Show local plans

List plans in the current project's `./plans/` directory:
```bash
ls -la ./plans/*.md 2>/dev/null | head -10
```

### Step 6: Show archive contents (if --verbose)

If `--verbose` flag is provided, also show archived plans:
```bash
ls -la ./plans/archive/*.md 2>/dev/null | head -10
```

### Step 7: Display configuration

Read and display the current configuration:
```bash
cat ~/.claude/plans-bank-config.json 2>/dev/null || echo "No config file (using defaults)"
```

### Step 8: Summarize

Provide a summary to the user:
- Number of pending (unsynced) plans
- Number of synced plans (from log)
- Number of local plans in ./plans/
- Number of archived plans
- Current configuration settings

## Examples

**Basic usage:**
```
/sync-status
```
Shows pending plans, recent syncs, and current config.

**Verbose mode:**
```
/sync-status --verbose
```
Also includes archived plans and full configuration details.

## Output Format

```
Plans Bank Sync Status
======================

Configuration:
  Always-On: true
  Source: ~/.claude/plans
  Target: ./plans
  Auto-Commit: true
  Auto-Archive: enabled (30 days)

Pending Plans (3):
  - groovy-gathering-chipmunk.md
  - sweet-berry-wine.md
  - fluffy-dancing-penguin.md

Recently Synced (5):
  - feature-add-dark-mode-01.18.26.md (2 hours ago)
  - bugfix-fix-login-error-01.17.26.md (1 day ago)
  - feature-api-redesign-01.16.26.md (2 days ago)

Local Plans (./plans/): 12 files
Archived: 3 files
```
