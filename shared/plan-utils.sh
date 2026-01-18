#!/bin/bash
# plan-utils.sh - Shared utilities for claude-code-plans-bank
# These functions handle plan file naming, sanitization, and git operations

# Extract first markdown header from file
# Usage: extract_plan_name "/path/to/plan.md"
extract_plan_name() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        echo ""
        return 1
    fi
    grep -m1 "^# " "$file" 2>/dev/null | sed 's/^# //' | head -c 50
}

# Convert string to filesystem-safe format
# Usage: sanitize_name "My Feature Name"
# Output: my-feature-name
sanitize_name() {
    local input="$1"
    echo "$input" | \
        tr '[:upper:]' '[:lower:]' | \
        sed 's/[^a-z0-9]/-/g' | \
        sed 's/--*/-/g' | \
        sed 's/^-//' | \
        sed 's/-$//'
}

# Generate dated filename with duplicate handling
# Usage: generate_filename "my-feature" "/path/to/plans"
# Output: feature-my-feature-01.18.26.md (or with -2, -3 suffix if exists)
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

# Check if filename matches default Claude Code pattern (adjective-noun-animal)
# Usage: is_default_name "groovy-gathering-chipmunk.md"
# Returns: 0 if matches default pattern, 1 otherwise
is_default_name() {
    local filename="$1"
    # Default names are like: groovy-gathering-chipmunk.md
    # Pattern: word-word-word.md (all lowercase)
    [[ "$filename" =~ ^[a-z]+-[a-z]+-[a-z]+\.md$ ]]
}

# Check if filename is already in our format
# Usage: is_organized_name "feature-my-plan-01.18.26.md"
# Returns: 0 if matches our format, 1 otherwise
is_organized_name() {
    local filename="$1"
    # Our format: feature-{name}-{MM.DD.YY}.md or feature-{name}-{MM.DD.YY}-{N}.md
    [[ "$filename" =~ ^feature-.*-[0-9]{2}\.[0-9]{2}\.[0-9]{2}(-[0-9]+)?\.md$ ]]
}

# Git commit helper for plan files
# Usage: commit_plan "/path/to/plans/feature-my-plan.md"
commit_plan() {
    local file="$1"
    local name=$(basename "$file" .md)

    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo "Not a git repository"
        return 1
    fi

    git add "$file"
    git commit -m "Add plan: ${name}"
}

# Find the most recent .md file in a directory
# Usage: find_most_recent_plan "/path/to/plans"
find_most_recent_plan() {
    local dir="$1"
    if [[ ! -d "$dir" ]]; then
        echo ""
        return 1
    fi
    # Find most recently modified .md file
    find "$dir" -maxdepth 1 -name "*.md" -type f -printf '%T@ %p\n' 2>/dev/null | \
        sort -rn | head -1 | cut -d' ' -f2-
}

# Move and rename a plan file
# Usage: move_and_rename_plan "/source/plan.md" "/target/dir" ["custom-name"]
move_and_rename_plan() {
    local source="$1"
    local target_dir="$2"
    local custom_name="$3"

    if [[ ! -f "$source" ]]; then
        echo "Source file not found: $source"
        return 1
    fi

    # Create target directory if needed
    mkdir -p "$target_dir"

    # Determine the name to use
    local name
    if [[ -n "$custom_name" ]]; then
        name=$(sanitize_name "$custom_name")
    else
        local header=$(extract_plan_name "$source")
        if [[ -z "$header" ]]; then
            header="untitled-plan"
        fi
        name=$(sanitize_name "$header")
    fi

    # Generate unique filename
    local filename=$(generate_filename "$name" "$target_dir")
    local target="${target_dir}/${filename}"

    # Move the file
    mv "$source" "$target"
    echo "$target"
}
