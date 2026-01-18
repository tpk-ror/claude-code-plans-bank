---
description: Save and rename current plan to project's ./plans/ folder
allowed-tools: Bash, Read, Write
argument-hint: [custom-name] [--commit]
---

Save the most recent plan file from ~/.claude/plans/ to this project's ./plans/ directory with descriptive naming.

## Instructions

Follow these steps to save and organize the plan:

### Step 1: Find the most recent plan
Find the most recently modified .md file in `~/.claude/plans/`:
```bash
find ~/.claude/plans -maxdepth 1 -name "*.md" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-
```

### Step 2: Read and extract the plan name
Read the file content and extract the first `# ` header line. This will be used for naming.

### Step 3: Sanitize the name
Convert the header to a filesystem-safe format:
- Convert to lowercase
- Replace non-alphanumeric characters with hyphens
- Remove consecutive hyphens
- Trim leading/trailing hyphens

### Step 4: Generate the filename
Create the filename in format: `feature-{sanitized-name}-{MM.DD.YY}.md`

Example: If the header is "Add User Authentication", generate:
`feature-add-user-authentication-01.18.26.md`

### Step 5: Handle duplicates
If the filename already exists in `./plans/`, append a suffix:
- `feature-name-01.18.26-2.md`
- `feature-name-01.18.26-3.md`
- etc.

### Step 6: Create plans directory
Create `./plans/` directory if it doesn't exist:
```bash
mkdir -p ./plans
```

### Step 7: Move the file
Move the plan file to `./plans/{generated-name}.md`

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
Moves `~/.claude/plans/groovy-chipmunk-whatever.md` to `./plans/feature-implement-dark-mode-01.18.26.md`

**With custom name:**
```
/save-plan auth-system-redesign
```
Creates `./plans/feature-auth-system-redesign-01.18.26.md`

**With git commit:**
```
/save-plan --commit
```
Moves the file and creates a git commit

**Custom name with commit:**
```
/save-plan my-feature --commit
```
Uses custom name and commits
