---
description: Search plan contents by keyword across global and project directories
allowed-tools: Bash, Read
argument-hint: <search-term> [--case-sensitive] [--global | --local]
---

Search for a keyword or phrase in all plan files from `~/.claude/plans/` (global) and `./plans/` (project-local).

## Instructions

Follow these steps to search plans:

### Step 1: Parse arguments

The first non-flag argument is the search term (required). Additional flags:
- `--case-sensitive` - Match case exactly (default is case-insensitive)
- `--global` - Only search `~/.claude/plans/`
- `--local` - Only search `./plans/`
- (no location flag) - Search both locations

If no search term is provided, show usage and exit:
```
Usage: /search-plans <search-term> [--case-sensitive] [--global | --local]
```

### Step 2: Set up search parameters

```bash
# Default to case-insensitive
GREP_FLAGS="-rn -i"

# If --case-sensitive flag provided
# GREP_FLAGS="-rn"

GLOBAL_DIR="$HOME/.claude/plans"
LOCAL_DIR="./plans"
```

### Step 3: Search Global Plans

If searching global plans:

```bash
if [[ -d "$GLOBAL_DIR" ]]; then
    grep $GREP_FLAGS "$SEARCH_TERM" "$GLOBAL_DIR"/*.md 2>/dev/null
fi
```

### Step 4: Search Project Plans

If searching local plans:

```bash
if [[ -d "$LOCAL_DIR" ]]; then
    grep $GREP_FLAGS "$SEARCH_TERM" "$LOCAL_DIR"/*.md 2>/dev/null
fi
```

### Step 5: Format output

Group results by file and show line numbers with context:

```
Found 3 matches in 2 plans:

~/.claude/plans/sleepy-shimmying-moler.md:
  Line 45: "...implement authentication flow..."
  Line 78: "...authentication tokens should..."

./plans/feature-auth-01.18.26.md:
  Line 12: "...OAuth authentication provider..."
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

**Search only global plans:**
```
/search-plans database --global
```

**Search only project plans:**
```
/search-plans refactor --local
```

## Expected Output

```
Found 3 matches in 2 plans:

~/.claude/plans/sleepy-shimmying-moler.md:
  Line 45: "...implement authentication flow using JWT tokens..."
  Line 78: "...authentication tokens should expire after 24h..."

./plans/feature-auth-01.18.26.md:
  Line 12: "...integrate OAuth authentication provider for SSO..."

Total: 3 matches in 2 files
```

## Error Handling

If no search term provided:
```
Error: Search term required.
Usage: /search-plans <search-term> [--case-sensitive] [--global | --local]
```

If neither directory exists:
```
No plan directories found. Expected:
  - ~/.claude/plans/ (global)
  - ./plans/ (project-local)
```
