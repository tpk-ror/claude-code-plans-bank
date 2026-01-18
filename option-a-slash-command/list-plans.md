---
description: List all plans with metadata from project directory
allowed-tools: Bash, Read
argument-hint: [--archived]
---

List all plan files from `./docs/plans/` (project-local) with metadata including size, modification date, and first header.

## Instructions

Follow these steps to list plans:

### Step 1: Parse arguments

Check the provided arguments:
- `--archived` - Also show plans from `./docs/plans/archive/`
- (no args) - Show only active plans in `./docs/plans/`

### Step 2: Define helper functions

For each plan file, you'll need to extract:
- Filename
- File size (human-readable)
- Relative modification time (e.g., "today", "yesterday", "3 days ago")
- First `# ` header line (or "(no header)" if none)

### Step 3: List Project Plans

```bash
# Check if project plans directory exists
LOCAL_DIR="./docs/plans"
if [[ -d "$LOCAL_DIR" ]]; then
    # Find .md files, sorted by modification time (newest first)
    find "$LOCAL_DIR" -maxdepth 1 -name "*.md" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | cut -d' ' -f2-
fi
```

For each file found:
1. Get the filename with `basename`
2. Get file size with `ls -lh "$file" | awk '{print $5}'`
3. Get relative time by comparing file modification time to now
4. Extract first header with `grep -m1 "^# " "$file" | sed 's/^# //'`

### Step 4: List Archived Plans (if --archived)

If `--archived` flag is provided:

```bash
ARCHIVE_DIR="./docs/plans/archive"
if [[ -d "$ARCHIVE_DIR" ]]; then
    find "$ARCHIVE_DIR" -maxdepth 1 -name "*.md" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | cut -d' ' -f2-
fi
```

### Step 5: Format output

Display results:

```
Project Plans (./docs/plans/):
  1. feature-auth-system-01.18.26.md (3.2K, yesterday) - "Auth System Design"
  2. groovy-gathering-chipmunk.md (1.4K, today) - "API Refactor" [pending rename]

Total: 2 plans
```

Mark files with default naming pattern as `[pending rename]`.

If the directory doesn't exist or is empty, show:
```
Project Plans (./docs/plans/):
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

**List plans including archived:**
```
/list-plans --archived
```

## Expected Output

```
Project Plans (./docs/plans/):
  1. feature-auth-system-01.18.26.md (3.2K, yesterday) - "Auth System Design"
  2. bugfix-fix-login-error-01.17.26.md (1.8K, 2 days ago) - "Fix Login Error"
  3. groovy-gathering-chipmunk.md (1.4K, today) - "API Refactor" [pending rename]

Total: 3 plans
```

With `--archived`:
```
Project Plans (./docs/plans/):
  1. feature-auth-system-01.18.26.md (3.2K, yesterday) - "Auth System Design"

Archived Plans (./docs/plans/archive/):
  1. feature-old-api-12.15.25.md (2.1K, 1 month ago) - "Old API Design"

Total: 2 plans (1 active, 1 archived)
```
