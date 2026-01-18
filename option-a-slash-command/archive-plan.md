---
description: Move plans to archive folder
allowed-tools: Bash, Read
argument-hint: [filename] [--older-than Nd] [--all-default] [--list]
---

Archive plan files by moving them to an `archive/` subdirectory within their respective plan folders.

## Instructions

Follow these steps to archive plans:

### Step 1: Parse arguments

Supported arguments:
- `<filename>` - Archive a specific file by name
- `--older-than Nd` - Archive plans older than N days (e.g., `--older-than 30d`)
- `--all-default` - Archive all unorganized plans (word-word-word.md pattern)
- `--list` - Show contents of archive folders
- `--global` - Only operate on `~/.claude/plans/`
- `--local` - Only operate on `./plans/`

### Step 2: Handle --list flag

If `--list` flag is provided, show archived plans:

```bash
GLOBAL_ARCHIVE="$HOME/.claude/plans/archive"
LOCAL_ARCHIVE="./plans/archive"

echo "Archived Plans:"
echo ""

if [[ -d "$GLOBAL_ARCHIVE" ]]; then
    echo "Global Archive (~/.claude/plans/archive/):"
    ls -la "$GLOBAL_ARCHIVE"/*.md 2>/dev/null || echo "  (empty)"
fi

if [[ -d "$LOCAL_ARCHIVE" ]]; then
    echo ""
    echo "Project Archive (./plans/archive/):"
    ls -la "$LOCAL_ARCHIVE"/*.md 2>/dev/null || echo "  (empty)"
fi
```

### Step 3: Archive by filename

If a filename is provided (not a flag):

1. Search for the file in both locations:
   - `~/.claude/plans/<filename>`
   - `./plans/<filename>`

2. If found in multiple locations, ask which one to archive

3. Create archive directory if needed:
```bash
mkdir -p "$(dirname "$file")/archive"
```

4. Move the file:
```bash
mv "$file" "$(dirname "$file")/archive/$(basename "$file")"
```

### Step 4: Archive by age (--older-than)

If `--older-than Nd` flag is provided:

1. Extract the number of days from the argument (e.g., "30d" -> 30)

2. Find all plans older than N days:
```bash
# Get current time in seconds
now=$(date +%s)
# N days in seconds
threshold=$((N * 86400))

# For each .md file in plan directories
for file in "$PLANS_DIR"/*.md; do
    file_time=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)
    age=$((now - file_time))
    if [[ $age -gt $threshold ]]; then
        # Archive this file
    fi
done
```

3. Show list of files to be archived and confirm before proceeding

### Step 5: Archive default-named plans (--all-default)

If `--all-default` flag is provided:

1. Find all plans matching the default naming pattern (word-word-word.md):
```bash
# Pattern: adjective-noun-animal.md (all lowercase, three words)
for file in "$PLANS_DIR"/*.md; do
    filename=$(basename "$file")
    if [[ "$filename" =~ ^[a-z]+-[a-z]+-[a-z]+\.md$ ]]; then
        # This is a default-named plan
    fi
done
```

2. Show list and confirm before archiving

### Step 6: Perform the archive

For each file to archive:

```bash
archive_file() {
    local file="$1"
    local dir=$(dirname "$file")
    local filename=$(basename "$file")
    local archive_dir="${dir}/archive"

    mkdir -p "$archive_dir"
    mv "$file" "${archive_dir}/${filename}"
    echo "Archived: $filename -> archive/$filename"
}
```

### Step 7: Report results

Show summary:
```
Archived 3 plans:
  - sleepy-shimmying-moler.md -> archive/sleepy-shimmying-moler.md
  - groovy-gathering-chipmunk.md -> archive/groovy-gathering-chipmunk.md
  - fuzzy-dancing-penguin.md -> archive/fuzzy-dancing-penguin.md
```

## Examples

**Archive a specific file:**
```
/archive-plan feature-auth-01.18.26.md
```

**Archive plans older than 30 days:**
```
/archive-plan --older-than 30d
```

**Archive all default-named plans:**
```
/archive-plan --all-default
```

**Archive default plans from global only:**
```
/archive-plan --all-default --global
```

**List archived plans:**
```
/archive-plan --list
```

## Archive Locations

Plans are archived to a subdirectory within their original location:
- `./plans/file.md` -> `./plans/archive/file.md`
- `~/.claude/plans/file.md` -> `~/.claude/plans/archive/file.md`

## Expected Output

**Archiving a specific file:**
```
Archived: feature-old-design-01.05.26.md
  From: ./plans/feature-old-design-01.05.26.md
  To:   ./plans/archive/feature-old-design-01.05.26.md
```

**Archiving by age:**
```
Found 5 plans older than 30 days:
  1. feature-old-api-12.15.25.md (45 days old)
  2. feature-legacy-auth-12.10.25.md (50 days old)
  3. groovy-gathering-chipmunk.md (35 days old)
  4. sleepy-shimmying-moler.md (42 days old)
  5. fuzzy-dancing-penguin.md (38 days old)

Archived 5 plans to their respective archive folders.
```

**Listing archives:**
```
Archived Plans:

Global Archive (~/.claude/plans/archive/):
  1. groovy-gathering-chipmunk.md (1.4K, archived 2 days ago)
  2. sleepy-shimmying-moler.md (2.1K, archived 1 week ago)

Project Archive (./plans/archive/):
  1. feature-old-api-12.15.25.md (3.2K, archived today)

Total: 3 archived plans
```

## Error Handling

If file not found:
```
Error: Plan file not found: nonexistent-file.md
Searched in:
  - ~/.claude/plans/
  - ./plans/
```

If no plans match criteria:
```
No plans found matching criteria.
```
