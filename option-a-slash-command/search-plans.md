---
description: Search plan contents by keyword in project directory
allowed-tools: Bash, Read
argument-hint: <search-term> [--case-sensitive] [--archived]
---

Search for a keyword or phrase in all plan files in `./plans/` (project-local).

## Instructions

Follow these steps to search plans:

### Step 1: Parse arguments

The first non-flag argument is the search term (required). Additional flags:
- `--case-sensitive` - Match case exactly (default is case-insensitive)
- `--archived` - Also search `./plans/archive/`

If no search term is provided, show usage and exit:
```
Usage: /search-plans <search-term> [--case-sensitive] [--archived]
```

### Step 2: Set up search parameters

```bash
# Default to case-insensitive
GREP_FLAGS="-rn -i"

# If --case-sensitive flag provided
# GREP_FLAGS="-rn"

LOCAL_DIR="./plans"
ARCHIVE_DIR="./plans/archive"
```

### Step 3: Search Project Plans

```bash
if [[ -d "$LOCAL_DIR" ]]; then
    grep $GREP_FLAGS "$SEARCH_TERM" "$LOCAL_DIR"/*.md 2>/dev/null
fi
```

### Step 4: Search Archived Plans (if --archived)

If `--archived` flag is provided:

```bash
if [[ -d "$ARCHIVE_DIR" ]]; then
    grep $GREP_FLAGS "$SEARCH_TERM" "$ARCHIVE_DIR"/*.md 2>/dev/null
fi
```

### Step 5: Format output

Group results by file and show line numbers with context:

```
Found 3 matches in 2 plans:

./plans/feature-auth-01.18.26.md:
  Line 12: "...OAuth authentication provider..."
  Line 45: "...authentication tokens should..."

./plans/bugfix-login-01.17.26.md:
  Line 8: "...fix authentication flow..."
```

If no matches found:
```
No matches found for "authentication" in any plan files.
```

### Step 6: Parse grep output

The grep output format is:
```
/path/to/file.md:45:line content here
```

Parse this to extract:
- File path
- Line number
- Line content (truncate if longer than 80 characters)

Group consecutive matches from the same file together.

### Step 7: Show summary

At the end, show:
```
Found N matches in M plans.
```

## Examples

**Basic search (case-insensitive):**
```
/search-plans authentication
```

**Search with exact case:**
```
/search-plans API --case-sensitive
```

**Search phrase (use quotes):**
```
/search-plans "user login"
```

**Search including archived plans:**
```
/search-plans database --archived
```

## Expected Output

```
Found 3 matches in 2 plans:

./plans/feature-auth-01.18.26.md:
  Line 12: "...integrate OAuth authentication provider for SSO..."
  Line 45: "...authentication tokens should expire after 24h..."

./plans/bugfix-login-01.17.26.md:
  Line 8: "...fix authentication flow for edge cases..."

Total: 3 matches in 2 files
```

## Error Handling

If no search term provided:
```
Error: Search term required.
Usage: /search-plans <search-term> [--case-sensitive] [--archived]
```

If plans directory doesn't exist:
```
No plan directory found. Expected: ./plans/
Run /save-plan first to create a plan.
```
