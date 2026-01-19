# Plan: claude-code-plans-bank - Open Source Plan Management

## Overview
Build an open source project that helps Claude Code users organize plan files within their projects using descriptive naming conventions.

**Naming Format:** `feature-{extracted-name}-{MM.DD.YY}.md`
**Storage:** `./plans/` within each project

---

## Project Structure

```
claude-code-plans-bank/
├── README.md                      # Installation guide, both options
├── LICENSE                        # MIT
├── install.sh                     # Interactive installer
│
├── option-a-slash-command/
│   └── save-plan.md               # Manual slash command
│
├── option-b-automatic/
│   ├── settings.json              # Global settings snippet
│   └── hooks/
│       └── organize-plan.sh       # Post-session hook script
│
└── shared/
    └── plan-utils.sh              # Shared naming/moving logic
```

---

## Option A: Slash Command (Manual)

**File:** `~/.claude/commands/save-plan.md`

```markdown
---
description: Save and rename current plan to project's ./plans/ folder
allowed-tools: Bash, Read, Write
argument-hint: [custom-name] [--commit]
---

Save the most recent plan file from ~/.claude/plans/ to this project's
./plans/ directory with descriptive naming.

Steps:
1. Find most recent .md file in ~/.claude/plans/
2. Read the file and extract first # header for naming
3. Sanitize header to filesystem-safe format (lowercase, hyphens)
4. Generate filename: feature-{sanitized-name}-{MM.DD.YY}.md
5. If filename exists, append suffix (-2, -3, etc.)
6. Create ./plans/ directory if it doesn't exist
7. Move file to ./plans/{generated-name}.md
8. If --commit flag present, git add and commit the plan
9. Confirm completion with the new path

If a custom name is provided (not --commit), use that instead of extracting.
```

**User Workflow:**
1. User creates a plan in Claude Code (plan mode)
2. User runs `/save-plan` (or `/save-plan my-feature-name`)
3. Plan is moved and renamed automatically
4. Optional: `/save-plan --commit` to also git commit

---

## Option B: Automatic Hook-Based

**Global Settings:** `~/.claude/settings.json`

```json
{
  "plansDirectory": "./plans",
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/organize-plan.sh"
          }
        ]
      }
    ]
  }
}
```

**Hook Script:** `~/.claude/hooks/organize-plan.sh`

The script will:
1. Check if ./plans/ has any files with default naming (random adjective-noun patterns)
2. For each default-named file:
   - Extract first # header
   - Rename to `feature-{name}-{date}.md`
3. Exit silently if no files need renaming

**Challenges with this approach:**
- Stop hook fires on every response, not just plan creation
- Need to detect "default named" files vs already-renamed ones
- May have race conditions if Claude is still writing

---

## Shared Utilities

**File:** `shared/plan-utils.sh`

```bash
#!/bin/bash

# Extract first markdown header from file
extract_plan_name() {
    local file="$1"
    grep -m1 "^# " "$file" | sed 's/^# //' | head -c 50
}

# Convert string to filesystem-safe format
sanitize_name() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | \
        sed 's/[^a-z0-9]/-/g' | \
        sed 's/--*/-/g' | \
        sed 's/^-//' | \
        sed 's/-$//'
}

# Generate dated filename with duplicate handling
generate_filename() {
    local name="$1"
    local target_dir="$2"
    local date=$(date +"%m.%d.%y")
    local base="feature-${name}-${date}"
    local filename="${base}.md"
    local counter=2

    # Check for duplicates and add suffix if needed
    while [[ -f "${target_dir}/${filename}" ]]; do
        filename="${base}-${counter}.md"
        ((counter++))
    done

    echo "$filename"
}

# Check if filename matches default pattern (adjective-noun-animal)
is_default_name() {
    local filename="$1"
    # Default names are like: groovy-gathering-chipmunk.md
    [[ "$filename" =~ ^[a-z]+-[a-z]+-[a-z]+\.md$ ]]
}

# Git commit helper
commit_plan() {
    local file="$1"
    local name=$(basename "$file" .md)
    git add "$file"
    git commit -m "Add plan: ${name}"
}
```

---

## Installation Script

**File:** `install.sh`

```bash
#!/bin/bash

echo "Claude Code Plans Bank - Installer"
echo "=================================="
echo ""
echo "Choose installation option:"
echo "  1) Slash Command (manual /save-plan)"
echo "  2) Automatic (hook-based)"
echo "  3) Both"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1) install_slash_command ;;
    2) install_automatic ;;
    3) install_slash_command && install_automatic ;;
esac
```

---

## README Structure

1. **What This Does** - Problem statement and solution
2. **Quick Start** - One-liner install
3. **Options Explained** - Pros/cons of each approach
4. **Configuration** - Customization options
5. **Examples** - Before/after screenshots
6. **Troubleshooting** - Common issues
7. **Contributing** - How to contribute

---

## Implementation Steps

### Phase 1: Core Files
1. [ ] Create project directory structure
2. [ ] Write `shared/plan-utils.sh` with utility functions
3. [ ] Write `option-a-slash-command/save-plan.md`
4. [ ] Test slash command manually

### Phase 2: Automatic Option
5. [ ] Write `option-b-automatic/hooks/organize-plan.sh`
6. [ ] Write settings.json snippet
7. [ ] Test hook-based approach

### Phase 3: Installation & Docs
8. [ ] Write `install.sh` interactive installer
9. [ ] Write comprehensive README.md
10. [ ] Add LICENSE (MIT)

### Phase 4: Polish
11. [ ] Add example plans for testing
12. [ ] Create demo GIF/screenshots
13. [ ] Initialize git repo with proper .gitignore

---

## Design Decisions

1. **Duplicate handling:** Add numeric suffix (-2, -3, etc.)
   - Example: `feature-add-auth-01.18.26-2.md`

2. **Git integration:** Optional `--commit` flag on slash command
   - `/save-plan --commit` will stage and commit the plan file

3. **Hook timing:** Use Stop hook for automatic option
   - Fires when Claude finishes responding, catches plan creation immediately

---

## Verification Plan

1. **Test Slash Command:**
   - Create a plan in plan mode
   - Run `/save-plan` and verify file moves to `./plans/`
   - Verify naming format is correct
   - Test with custom name: `/save-plan my-custom-name`
   - Test duplicate handling by running twice
   - Test `--commit` flag

2. **Test Automatic Hook:**
   - Configure settings.json with hook
   - Create a plan and exit plan mode
   - Verify file is renamed in `./plans/`
   - Verify already-renamed files are not touched

3. **Test Installation:**
   - Run `install.sh` fresh
   - Verify correct files are placed
   - Verify settings.json is properly merged (not overwritten)
