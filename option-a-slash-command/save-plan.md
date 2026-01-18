---
description: Save and rename current plan to project's ./plans/ folder
allowed-tools: Bash, Read, Write
argument-hint: [custom-name] [--commit]
---

Rename the most recent plan file in `./plans/` from default naming (word-word-word.md) to a descriptive format.

## Instructions

Follow these steps to save and organize the plan:

### Step 1: Find the most recent plan with default naming
Find the most recently modified .md file in `./plans/` that has default naming (word-word-word.md pattern):
```bash
# Create plans directory if it doesn't exist
mkdir -p ./plans

# Find most recent .md file
find ./plans -maxdepth 1 -name "*.md" -type f -printf '%T@ %p\n' | sort -rn | head -5 | cut -d' ' -f2-
```

Look for files matching the default Claude Code naming pattern: `word-word-word.md` (e.g., `groovy-gathering-chipmunk.md`).

If no files with default naming exist, inform the user there are no plans to rename.

### Step 2: Read and extract the plan name
Read the file content and extract the first `# ` header line. This will be used for naming.

### Step 3: Detect category from header
Check the header for keywords to determine category:
- `bugfix-` for: bug, fix, issue, error, patch, hotfix
- `refactor-` for: refactor, cleanup, reorganize, restructure
- `docs-` for: documentation, readme, guide, doc
- `test-` for: test, spec, coverage, testing
- `feature-` (default) for everything else

### Step 4: Sanitize the name
Convert the header to a filesystem-safe format:
- Convert to lowercase
- Replace non-alphanumeric characters with hyphens
- Remove consecutive hyphens
- Trim leading/trailing hyphens

### Step 5: Generate the filename
Create the filename in format: `{category}-{sanitized-name}-{MM.DD.YY}-{HHMM}.md`

The time should be in Central timezone (America/Chicago) in 24-hour format.

Example: If the header is "Fix Login Error" at 2:30 PM Central, generate:
`bugfix-fix-login-error-01.18.26-1430.md`

### Step 6: Handle duplicates
If the filename already exists in `./plans/`, append a suffix:
- `feature-name-01.18.26-1430-2.md`
- `feature-name-01.18.26-1430-3.md`
- etc.

### Step 7: Rename the file
Rename the plan file in place within `./plans/`:
```bash
mv ./plans/old-name.md ./plans/new-name.md
```

### Step 8: Handle arguments
- If a custom name is provided (not `--commit`), use that instead of extracting from the header
- If `--commit` flag is present, also run:
  ```bash
  git add ./plans/{filename}
  git commit -m "Add plan: {filename-without-extension}"
  ```

### Step 9: Confirm completion
Report the new file path and any actions taken.

## Examples

**Basic usage:**
```
/save-plan
```
Renames `./plans/groovy-chipmunk-whatever.md` to `./plans/feature-implement-dark-mode-01.18.26-1430.md`

**With custom name:**
```
/save-plan auth-system-redesign
```
Creates `./plans/feature-auth-system-redesign-01.18.26-1430.md`

**With git commit:**
```
/save-plan --commit
```
Renames the file and creates a git commit

**Custom name with commit:**
```
/save-plan my-feature --commit
```
Uses custom name and commits
