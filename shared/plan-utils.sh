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
# Output: feature-my-feature-01.18.26-1430.md (with Central timezone time)
generate_filename() {
    local name="$1"
    local target_dir="$2"
    # Use Central timezone for date and time
    local date=$(TZ='America/Chicago' date +"%m.%d.%y")
    local time=$(TZ='America/Chicago' date +"%H%M")
    local base="feature-${name}-${date}-${time}"
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
# Usage: is_organized_name "feature-my-plan-01.18.26-1430.md"
# Returns: 0 if matches our format, 1 otherwise
is_organized_name() {
    local filename="$1"
    # Our format: feature-{name}-{MM.DD.YY}-{HHMM}.md or with duplicate suffix
    # Also matches old format without time for backwards compatibility
    [[ "$filename" =~ ^feature-.*-[0-9]{2}\.[0-9]{2}\.[0-9]{2}(-[0-9]{4})?(-[0-9]+)?\.md$ ]]
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

# Get human-readable file size
# Usage: get_file_size "/path/to/file.md"
# Output: "2.1 KB" or "1.4 MB"
get_file_size() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        echo "0 B"
        return 1
    fi
    ls -lh "$file" 2>/dev/null | awk '{print $5}'
}

# Get relative time description
# Usage: get_relative_time "/path/to/file.md"
# Output: "today", "yesterday", "3 days ago", "2 weeks ago", etc.
get_relative_time() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        echo "unknown"
        return 1
    fi

    local file_time=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)
    local now=$(date +%s)
    local diff=$((now - file_time))
    local days=$((diff / 86400))

    if [[ $days -eq 0 ]]; then
        echo "today"
    elif [[ $days -eq 1 ]]; then
        echo "yesterday"
    elif [[ $days -lt 7 ]]; then
        echo "${days} days ago"
    elif [[ $days -lt 14 ]]; then
        echo "1 week ago"
    elif [[ $days -lt 30 ]]; then
        local weeks=$((days / 7))
        echo "${weeks} weeks ago"
    elif [[ $days -lt 60 ]]; then
        echo "1 month ago"
    else
        local months=$((days / 30))
        echo "${months} months ago"
    fi
}

# List all plan files in a directory with metadata
# Usage: list_plans_in_dir "/path/to/plans"
# Output: Formatted list with filename, size, date, and header
list_plans_in_dir() {
    local dir="$1"
    if [[ ! -d "$dir" ]]; then
        return 1
    fi

    local count=0
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        count=$((count + 1))
        local filename=$(basename "$file")
        local size=$(get_file_size "$file")
        local rel_time=$(get_relative_time "$file")
        local header=$(extract_plan_name "$file")
        [[ -z "$header" ]] && header="(no header)"

        printf "  %d. %s (%s, %s) - \"%s\"\n" "$count" "$filename" "$size" "$rel_time" "$header"
    done < <(find "$dir" -maxdepth 1 -name "*.md" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | cut -d' ' -f2-)

    echo "$count"
}

# Search plans for a pattern
# Usage: search_plans "pattern" "/path/to/plans" [case_insensitive]
# Output: Matching lines with context
search_plans() {
    local pattern="$1"
    local dir="$2"
    local case_flag="${3:--i}"  # Default to case-insensitive

    if [[ ! -d "$dir" ]]; then
        return 1
    fi

    grep -rn $case_flag "$pattern" "$dir"/*.md 2>/dev/null || true
}

# Archive a plan file
# Usage: archive_plan "/path/to/plans/file.md"
# Moves file to archive/ subdirectory
archive_plan() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        echo "File not found: $file"
        return 1
    fi

    local dir=$(dirname "$file")
    local filename=$(basename "$file")
    local archive_dir="${dir}/archive"

    # Create archive directory if needed
    mkdir -p "$archive_dir"

    # Move file to archive
    mv "$file" "${archive_dir}/${filename}"
    echo "${archive_dir}/${filename}"
}

# Get file age in days
# Usage: get_file_age_days "/path/to/file.md"
# Output: Number of days since last modification
get_file_age_days() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        echo "0"
        return 1
    fi

    local file_time=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)
    local now=$(date +%s)
    local diff=$((now - file_time))
    echo $((diff / 86400))
}


# Detect category from plan header keywords
# Usage: detect_category "# Fix authentication bug"
# Output: category prefix (bugfix, refactor, docs, test, or feature)
detect_category() {
    local header="$1"
    local header_lower=$(echo "$header" | tr '[:upper:]' '[:lower:]')

    # Check for bugfix keywords
    if [[ "$header_lower" =~ (bug|fix|issue|error|patch|hotfix) ]]; then
        echo "bugfix"
        return 0
    fi

    # Check for refactor keywords
    if [[ "$header_lower" =~ (refactor|cleanup|reorganize|restructure|clean.?up) ]]; then
        echo "refactor"
        return 0
    fi

    # Check for docs keywords
    if [[ "$header_lower" =~ (documentation|readme|guide|doc|docs) ]]; then
        echo "docs"
        return 0
    fi

    # Check for test keywords
    if [[ "$header_lower" =~ (test|spec|coverage|testing) ]]; then
        echo "test"
        return 0
    fi

    # Default to feature
    echo "feature"
}

# Generate filename with category prefix
# Usage: generate_categorized_filename "my-feature" "/path/to/plans" "bugfix"
# Output: bugfix-my-feature-01.18.26-1430.md (with Central timezone time)
generate_categorized_filename() {
    local name="$1"
    local target_dir="$2"
    local category="${3:-feature}"
    # Use Central timezone for date and time
    local date=$(TZ='America/Chicago' date +"%m.%d.%y")
    local time=$(TZ='America/Chicago' date +"%H%M")
    local base="${category}-${name}-${date}-${time}"
    local filename="${base}.md"
    local counter=2

    # Check for duplicates and add suffix if needed
    while [[ -f "${target_dir}/${filename}" ]]; do
        filename="${base}-${counter}.md"
        ((counter++))
    done

    echo "$filename"
}

# Check if filename matches any organized pattern (feature-, bugfix-, refactor-, docs-, test-)
# Usage: is_any_organized_name "bugfix-my-plan-01.18.26-1430.md"
# Returns: 0 if matches organized format, 1 otherwise
is_any_organized_name() {
    local filename="$1"
    # Match: (category)-{name}-{MM.DD.YY}-{HHMM}[-N].md
    # Also matches old format without time for backwards compatibility
    [[ "$filename" =~ ^(feature|bugfix|refactor|docs|test)-.*-[0-9]{2}\.[0-9]{2}\.[0-9]{2}(-[0-9]{4})?(-[0-9]+)?\.md$ ]]
}

# Archive plans older than N days
# Usage: archive_old_plans "/path/to/plans" 30
# Returns: number of files archived
archive_old_plans() {
    local plans_dir="$1"
    local older_than_days="${2:-30}"
    local archive_dir="${plans_dir}/archive"
    local count=0

    if [[ ! -d "$plans_dir" ]]; then
        echo "0"
        return 1
    fi

    # Create archive directory
    mkdir -p "$archive_dir"

    for file in "$plans_dir"/*.md; do
        [[ -e "$file" ]] || continue

        local age=$(get_file_age_days "$file")
        if [[ "$age" -gt "$older_than_days" ]]; then
            local filename=$(basename "$file")
            mv "$file" "${archive_dir}/${filename}"
            count=$((count + 1))
        fi
    done

    echo "$count"
}

