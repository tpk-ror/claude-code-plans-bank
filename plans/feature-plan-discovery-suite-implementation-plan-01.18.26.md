# Plan Discovery Suite - Implementation Plan

Implement three new slash commands for discovering and managing plans across both `~/.claude/plans/` (global) and `./plans/` (project-local).

---

## Features to Implement

### 1. `/list-plans` - List all plans with metadata
### 2. `/search-plans` - Search plan contents by keyword
### 3. `/archive-plan` - Move plans to archive folder

---

## Implementation Details

### File Structure (New Files)

```
option-a-slash-command/
├── save-plan.md          # (existing)
├── list-plans.md         # NEW - list command
├── search-plans.md       # NEW - search command
└── archive-plan.md       # NEW - archive command

shared/
└── plan-utils.sh         # Add new helper functions
```

---

### 1. `/list-plans` Command

**File:** `option-a-slash-command/list-plans.md`

**Behavior:**
- Scans both `~/.claude/plans/` and `./plans/` directories
- Shows filename, size, modification date, and first header
- Supports optional `--global` or `--local` flags to filter scope
- Groups output by location (Global vs Project)

**Output Format:**
```
Global Plans (~/.claude/plans/):
  1. sleepy-shimmying-moler.md (2.1 KB, today) - "Feature Ideas for..."
  2. groovy-gathering-chipmunk.md (1.4 KB, 3 days ago) - "API Refactor"

Project Plans (./plans/):
  1. feature-auth-system-01.18.26.md (3.2 KB, yesterday) - "Auth System Design"

Total: 3 plans
```

**Arguments:**
- `--global` - Only show ~/.claude/plans/
- `--local` - Only show ./plans/
- (no args) - Show both

---

### 2. `/search-plans` Command

**File:** `option-a-slash-command/search-plans.md`

**Behavior:**
- Takes a search term as argument
- Uses grep to search all .md files in both plan directories
- Shows matching files with line numbers and context
- Case-insensitive by default

**Usage:**
```
/search-plans authentication
/search-plans "user login" --case-sensitive
```

**Output Format:**
```
Found 3 matches in 2 plans:

~/.claude/plans/sleepy-shimmying-moler.md:
  Line 45: "...implement authentication flow..."
  Line 78: "...authentication tokens should..."

./plans/feature-auth-01.18.26.md:
  Line 12: "...OAuth authentication provider..."
```

**Arguments:**
- First arg: search term (required)
- `--case-sensitive` - Match case exactly
- `--global` / `--local` - Limit search scope

---

### 3. `/archive-plan` Command

**File:** `option-a-slash-command/archive-plan.md`

**Behavior:**
- Moves specified plan(s) to an `archive/` subdirectory
- Creates archive directory if it doesn't exist
- Supports archiving by filename or interactive selection
- Preserves original filename

**Usage:**
```
/archive-plan feature-auth-01.18.26.md
/archive-plan --older-than 30d
/archive-plan --all-default  # Archive all word-word-word.md files
```

**Archive Locations:**
- `./plans/file.md` → `./plans/archive/file.md`
- `~/.claude/plans/file.md` → `~/.claude/plans/archive/file.md`

**Arguments:**
- First arg: filename to archive (optional)
- `--older-than <days>d` - Archive plans older than N days
- `--all-default` - Archive all unorganized (word-word-word) plans
- `--list` - Show archived plans

---

### 4. Shared Utility Functions to Add

**File:** `shared/plan-utils.sh` (additions)

```bash
# Get human-readable file size
get_file_size() {
    local file="$1"
    ls -lh "$file" 2>/dev/null | awk '{print $5}'
}

# Get relative time description (today, yesterday, N days ago)
get_relative_time() {
    local file="$1"
    # Returns: "today", "yesterday", "3 days ago", "2 weeks ago", etc.
}

# List all plan files in a directory with metadata
list_plans_in_dir() {
    local dir="$1"
    # Returns formatted list of plans with size, date, header
}

# Search plans for a pattern
search_plans() {
    local pattern="$1"
    local dir="$2"
    local case_flag="$3"
    # Uses grep -r to find matches
}

# Archive a plan file
archive_plan() {
    local file="$1"
    # Moves to archive/ subdirectory
}
```

---

## Installation Updates

### Update `install.sh`

Add new slash commands to installation options:
- Copy `list-plans.md` to `~/.claude/commands/`
- Copy `search-plans.md` to `~/.claude/commands/`
- Copy `archive-plan.md` to `~/.claude/commands/`

### Update `quick-install.sh`

Add download steps for new command files.

---

## Verification Steps

1. **Test /list-plans:**
   - Create plans in both ~/.claude/plans/ and ./plans/
   - Run `/list-plans` - verify both locations shown
   - Run `/list-plans --global` - verify only global shown
   - Run `/list-plans --local` - verify only local shown

2. **Test /search-plans:**
   - Add known text to a plan file
   - Run `/search-plans <known-text>` - verify found
   - Test case sensitivity flags

3. **Test /archive-plan:**
   - Archive a specific file by name
   - Verify archive/ directory created
   - Verify file moved correctly
   - Run `/archive-plan --list` to see archived files

---

## Original Feature Ideas (Reference)

Below are other features considered for future implementation.

---

## Category 1: Configuration & Customization

### 1.1 Configurable Plans Directory
Allow users to customize where plans are stored per-project via a `.claude-plans-config` file or environment variable.
- Currently hardcoded to `./plans/`
- Could support absolute paths or alternative folder names

### 1.2 Custom Date Formats
Support different date format preferences (ISO 8601, European, etc.)
- Current: `MM.DD.YY` only
- Options: `YYYY-MM-DD`, `DD-MM-YY`, `YYYYMMDD`

### 1.3 Custom Filename Prefix
Allow changing `feature-` prefix to alternatives like `plan-`, `doc-`, or project-specific prefixes.

### 1.4 Alternative Name Sources
Extract plan names from sources other than just the first `# Header`:
- YAML frontmatter (`title:` field)
- Second-level headers if no H1 exists
- Filename hints

---

## Category 2: User Experience

### 2.1 Dry-Run Mode
Add `--dry-run` flag to preview what would happen without making changes.
```
/save-plan --dry-run
# Would rename: groovy-gathering-chipmunk.md → feature-auth-system-01.18.26.md
```

### 2.2 Interactive Confirmation
Option to confirm before renaming, especially useful for the automatic hook.

### 2.3 Verbose/Debug Mode
Add logging output for troubleshooting hook issues.
- Currently exits silently on errors
- Could write to `~/.claude/logs/organize-plan.log`

### 2.4 Undo/Restore Capability
Keep a mapping of original→renamed files to allow reverting.

---

## Category 3: Plan Discovery & Management

### 3.1 `/list-plans` Slash Command
List all plans in current project with metadata:
```
/list-plans
# Plans in ./plans/:
# 1. feature-auth-system-01.18.26.md (3.2 KB, modified 2 hours ago)
# 2. feature-api-refactor-01.15.26.md (1.8 KB, modified 3 days ago)
```

### 3.2 `/search-plans` Slash Command
Search plan contents by keyword:
```
/search-plans authentication
# Found in 2 plans:
# - feature-auth-system-01.18.26.md (lines 12, 45, 78)
# - feature-user-login-01.10.26.md (line 23)
```

### 3.3 Plan Archiving
Move old/completed plans to an `./plans/archive/` folder:
```
/archive-plan feature-auth-system-01.18.26.md
```

### 3.4 Plan Tagging/Categories
Support subdirectories or tags in filenames:
- `./plans/backend/feature-api-01.18.26.md`
- `feature-[backend]-api-01.18.26.md`

---

## Category 4: Git Integration

### 4.1 Auto-commit on Save
Extend `--commit` flag to be configurable as default behavior.

### 4.2 Branch-Aware Plans
Include branch name in filename or store plans per-branch:
- `feature-auth-system-main-01.18.26.md`
- `./plans/feature-branch-name/`

### 4.3 Plan Templates
Create new plans from templates:
```
/new-plan --template feature
/new-plan --template bugfix
```

### 4.4 Link Plans to Commits/PRs
Add metadata linking plans to related git commits or PR numbers.

---

## Category 5: Quality of Life

### 5.1 Backup Before Rename
Create backup of settings.json before modifying during install.

### 5.2 Health Check Command
Verify installation is correct:
```
/check-plans-setup
# ✓ Slash command installed
# ✓ Hook configured
# ✓ Shared utilities present
# ✓ Plans directory exists
```

### 5.3 Bulk Rename
Process multiple plans at once:
```
/save-plan --all  # Rename all default-named plans in ~/.claude/plans/
```

### 5.4 Plan Statistics
Show usage statistics:
```
/plan-stats
# Total plans: 23
# This month: 5
# Most active project: my-app (12 plans)
```

---

## Category 6: Testing & Reliability

### 6.1 Automated Test Suite
Add bash tests using bats-core or similar framework.

### 6.2 CI/CD Pipeline
GitHub Actions workflow to test installation scripts.

### 6.3 Shellcheck Integration
Lint all bash scripts for common issues.

---

## Priority Recommendations

**High Value, Low Effort:**
- Dry-run mode (2.1)
- `/list-plans` command (3.1)
- Verbose/debug mode (2.3)
- Configurable plans directory (1.1)

**High Value, Medium Effort:**
- Plan archiving (3.3)
- Bulk rename (5.3)
- Health check command (5.2)
- Custom date formats (1.2)

**Nice to Have:**
- Plan templates (4.3)
- Search command (3.2)
- Plan statistics (5.4)
- Branch-aware plans (4.2)
