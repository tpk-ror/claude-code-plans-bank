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
        ((count++))
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

# =============================================================================
# Sync Tracking Functions (Option D: Always-On)
# =============================================================================

# Default paths for sync tracking
PLANS_BANK_PROCESSED_LOG="${PLANS_BANK_PROCESSED_LOG:-$HOME/.claude/.plans-bank-processed}"
PLANS_BANK_CONFIG="${PLANS_BANK_CONFIG:-$HOME/.claude/plans-bank-config.json}"

# Get MD5 hash of file content
# Usage: get_content_hash "/path/to/file.md"
# Output: md5 hash string
get_content_hash() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        echo ""
        return 1
    fi

    # Try md5sum (Linux) first, then md5 (macOS)
    if command -v md5sum &> /dev/null; then
        md5sum "$file" 2>/dev/null | cut -d' ' -f1
    elif command -v md5 &> /dev/null; then
        md5 -q "$file" 2>/dev/null
    else
        # Fallback: use cksum if neither available
        cksum "$file" 2>/dev/null | cut -d' ' -f1
    fi
}

# Check if file has already been processed (synced)
# Usage: is_file_processed "/path/to/source.md"
# Returns: 0 if already processed, 1 if not
is_file_processed() {
    local file="$1"
    local hash=$(get_content_hash "$file")

    if [[ -z "$hash" ]]; then
        return 1
    fi

    # Check if hash exists in processed log
    if [[ -f "$PLANS_BANK_PROCESSED_LOG" ]]; then
        grep -q "^${hash}|" "$PLANS_BANK_PROCESSED_LOG" 2>/dev/null
        return $?
    fi

    return 1
}

# Mark a file as processed in the log
# Usage: mark_file_processed "/path/to/source.md" "/path/to/target.md"
mark_file_processed() {
    local source_file="$1"
    local target_path="$2"
    local hash=$(get_content_hash "$source_file")
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")

    if [[ -z "$hash" ]]; then
        return 1
    fi

    # Create log directory if needed
    mkdir -p "$(dirname "$PLANS_BANK_PROCESSED_LOG")"

    # Append to processed log
    echo "${hash}|${target_path}|${timestamp}" >> "$PLANS_BANK_PROCESSED_LOG"
}

# Find existing organized copy by content hash
# Usage: find_organized_copy "/path/to/source.md"
# Output: path to existing copy if found, empty otherwise
find_organized_copy() {
    local file="$1"
    local hash=$(get_content_hash "$file")

    if [[ -z "$hash" || ! -f "$PLANS_BANK_PROCESSED_LOG" ]]; then
        echo ""
        return 1
    fi

    # Find the target path for this hash
    grep "^${hash}|" "$PLANS_BANK_PROCESSED_LOG" 2>/dev/null | tail -1 | cut -d'|' -f2
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
# Output: bugfix-my-feature-01.18.26.md (or with -2, -3 suffix if exists)
generate_categorized_filename() {
    local name="$1"
    local target_dir="$2"
    local category="${3:-feature}"
    local date=$(date +"%m.%d.%y")
    local base="${category}-${name}-${date}"
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
# Usage: is_any_organized_name "bugfix-my-plan-01.18.26.md"
# Returns: 0 if matches organized format, 1 otherwise
is_any_organized_name() {
    local filename="$1"
    # Match: (feature|bugfix|refactor|docs|test)-{name}-{MM.DD.YY}[-N].md
    [[ "$filename" =~ ^(feature|bugfix|refactor|docs|test)-.*-[0-9]{2}\.[0-9]{2}\.[0-9]{2}(-[0-9]+)?\.md$ ]]
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
            ((count++))
        fi
    done

    echo "$count"
}

# Get sync status counts
# Usage: get_sync_status "/path/to/global/plans" "/path/to/local/plans"
# Output: JSON-like string with counts
get_sync_status() {
    local global_dir="${1:-$HOME/.claude/plans}"
    local local_dir="${2:-./plans}"

    local pending=0
    local synced=0
    local archived=0

    # Count pending (unprocessed) files in global dir
    if [[ -d "$global_dir" ]]; then
        for file in "$global_dir"/*.md; do
            [[ -e "$file" ]] || continue
            local filename=$(basename "$file")

            # Skip if already organized
            if is_any_organized_name "$filename"; then
                continue
            fi

            # Check if processed
            if is_file_processed "$file"; then
                ((synced++))
            else
                ((pending++))
            fi
        done
    fi

    # Count synced files based on processed log
    if [[ -f "$PLANS_BANK_PROCESSED_LOG" ]]; then
        synced=$(wc -l < "$PLANS_BANK_PROCESSED_LOG" | tr -d ' ')
    fi

    # Count archived files
    if [[ -d "${local_dir}/archive" ]]; then
        archived=$(find "${local_dir}/archive" -maxdepth 1 -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
    fi

    echo "pending:${pending}|synced:${synced}|archived:${archived}"
}

# Load configuration value from plans-bank-config.json
# Usage: get_config_value "alwaysOn" "true"
# Output: config value or default
get_config_value() {
    local key="$1"
    local default="$2"

    if [[ ! -f "$PLANS_BANK_CONFIG" ]]; then
        echo "$default"
        return
    fi

    # Try to use jq if available
    if command -v jq &> /dev/null; then
        local value=$(jq -r ".${key} // empty" "$PLANS_BANK_CONFIG" 2>/dev/null)
        if [[ -n "$value" && "$value" != "null" ]]; then
            echo "$value"
        else
            echo "$default"
        fi
    else
        # Fallback: basic grep for simple values
        local value=$(grep "\"${key}\"" "$PLANS_BANK_CONFIG" 2>/dev/null | head -1 | sed 's/.*: *"\?\([^",}]*\)"\?.*/\1/')
        if [[ -n "$value" ]]; then
            echo "$value"
        else
            echo "$default"
        fi
    fi
}

# Copy and rename a plan file (for sync operations)
# Usage: copy_and_rename_plan "/source/plan.md" "/target/dir" ["custom-name"] ["category"]
copy_and_rename_plan() {
    local source="$1"
    local target_dir="$2"
    local custom_name="$3"
    local category="$4"

    if [[ ! -f "$source" ]]; then
        echo "Source file not found: $source"
        return 1
    fi

    # Create target directory if needed
    mkdir -p "$target_dir"

    # Determine the name to use
    local name
    local header=""
    if [[ -n "$custom_name" ]]; then
        name=$(sanitize_name "$custom_name")
    else
        header=$(extract_plan_name "$source")
        if [[ -z "$header" ]]; then
            header="untitled-plan"
        fi
        name=$(sanitize_name "$header")
    fi

    # Auto-detect category if not provided
    if [[ -z "$category" ]]; then
        category=$(detect_category "$header")
    fi

    # Generate unique filename with category
    local filename=$(generate_categorized_filename "$name" "$target_dir" "$category")
    local target="${target_dir}/${filename}"

    # Copy the file
    cp "$source" "$target"

    # Mark as processed
    mark_file_processed "$source" "$target"

    echo "$target"
}
