---
description: List all plans with metadata from global and project directories
allowed-tools: Bash, Read
argument-hint: [--global | --local]
---

List all plan files from `~/.claude/plans/` (global) and `./plans/` (project-local) with metadata including size, modification date, and first header.

## Instructions

Follow these steps to list plans:

### Step 1: Parse arguments

Check the provided arguments:
- `--global` - Only show plans from `~/.claude/plans/`
- `--local` - Only show plans from `./plans/`
- (no args) - Show both locations

### Step 2: Define helper functions

For each plan file, you'll need to extract:
- Filename
- File size (human-readable)
- Relative modification time (e.g., "today", "yesterday", "3 days ago")
- First `# ` header line (or "(no header)" if none)

### Step 3: List Global Plans

If showing global plans (`--global` flag or no flags):

```bash
# Check if global plans directory exists
GLOBAL_DIR="$HOME/.claude/plans"
if [[ -d "$GLOBAL_DIR" ]]; then
    # Find .md files, sorted by modification time (newest first)
    find "$GLOBAL_DIR" -maxdepth 1 -name "*.md" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | cut -d' ' -f2-
fi
```

For each file found:
1. Get the filename with `basename`
2. Get file size with `ls -lh "$file" | awk '{print $5}'`
3. Get relative time by comparing file modification time to now
4. Extract first header with `grep -m1 "^# " "$file" | sed 's/^# //'`

### Step 4: List Project Plans

If showing local plans (`--local` flag or no flags):

```bash
# Check if project plans directory exists
LOCAL_DIR="./plans"
if [[ -d "$LOCAL_DIR" ]]; then
    find "$LOCAL_DIR" -maxdepth 1 -name "*.md" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | cut -d' ' -f2-
fi
```

Process each file the same way as global plans.

### Step 5: Format output

Display results grouped by location:

```
Global Plans (~/.claude/plans/):
  1. sleepy-shimmying-moler.md (2.1K, today) - "Feature Ideas for..."
  2. groovy-gathering-chipmunk.md (1.4K, 3 days ago) - "API Refactor"

Project Plans (./plans/):
  1. feature-auth-system-01.18.26.md (3.2K, yesterday) - "Auth System Design"

Total: 3 plans
```

If a directory doesn't exist or is empty, show:
```
Global Plans (~/.claude/plans/):
  (no plans found)
```

### Step 6: Calculate relative time

Use this logic to determine relative time:
- 0 days ago = "today"
- 1 day ago = "yesterday"
- 2-6 days ago = "N days ago"
- 7-13 days ago = "1 week ago"
- 14-29 days ago = "N weeks ago"
- 30+ days ago = "N months ago"

To calculate days since modification:
```bash
# Get file modification time and current time in seconds since epoch
file_time=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)
now=$(date +%s)
days_ago=$(( (now - file_time) / 86400 ))
```

## Examples

**List all plans:**
```
/list-plans
```

**List only global plans:**
```
/list-plans --global
```

**List only project plans:**
```
/list-plans --local
```

## Expected Output

```
Global Plans (~/.claude/plans/):
  1. sleepy-shimmying-moler.md (2.1K, today) - "Feature Ideas for..."
  2. groovy-gathering-chipmunk.md (1.4K, 3 days ago) - "API Refactor"

Project Plans (./plans/):
  1. feature-auth-system-01.18.26.md (3.2K, yesterday) - "Auth System Design"

Total: 3 plans
```
