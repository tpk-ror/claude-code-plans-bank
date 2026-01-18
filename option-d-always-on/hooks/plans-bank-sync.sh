#!/bin/bash
# plans-bank-sync.sh - Auto-rename plans in ./plans/ directory
# Renames files with default names (word-word-word.md) to descriptive format
#
# Usage:
#   plans-bank-sync.sh [sync|stop|status]
#
# Hooks:
#   Stop - Process plans after each session

# Exit silently on any error (hooks should be non-disruptive)
set -e

# Configuration paths
CLAUDE_DIR="$HOME/.claude"
PLANS_BANK_CONFIG="${PLANS_BANK_CONFIG:-$CLAUDE_DIR/plans-bank-config.json}"

# Default configuration values
DEFAULT_TARGET_DIR="./plans"
DEFAULT_AUTO_COMMIT="true"
DEFAULT_AUTO_ARCHIVE_ENABLED="true"
DEFAULT_AUTO_ARCHIVE_DAYS="30"

# Source shared utilities if available
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UTILS_LOCATIONS=(
    "${SCRIPT_DIR}/../../shared/plan-utils.sh"
    "$CLAUDE_DIR/shared/plan-utils.sh"
    "${SCRIPT_DIR}/../shared/plan-utils.sh"
)

UTILS_LOADED=false
for utils_path in "${UTILS_LOCATIONS[@]}"; do
    if [[ -f "$utils_path" ]]; then
        source "$utils_path"
        UTILS_LOADED=true
        break
    fi
done

# Inline utility functions if shared file not found
if [[ "$UTILS_LOADED" = false ]]; then
    extract_plan_name() {
        local file="$1"
        grep -m1 "^# " "$file" 2>/dev/null | sed 's/^# //' | head -c 50
    }

    sanitize_name() {
        echo "$1" | \
            tr '[:upper:]' '[:lower:]' | \
            sed 's/[^a-z0-9]/-/g' | \
            sed 's/--*/-/g' | \
            sed 's/^-//' | \
            sed 's/-$//'
    }

    is_default_name() {
        local filename="$1"
        [[ "$filename" =~ ^[a-z]+-[a-z]+-[a-z]+\.md$ ]]
    }

    is_any_organized_name() {
        local filename="$1"
        # Match with optional time (HHMM) and optional duplicate suffix
        [[ "$filename" =~ ^(feature|bugfix|refactor|docs|test)-.*-[0-9]{2}\.[0-9]{2}\.[0-9]{2}(-[0-9]{4})?(-[0-9]+)?\.md$ ]]
    }

    detect_category() {
        local header="$1"
        local header_lower=$(echo "$header" | tr '[:upper:]' '[:lower:]')

        if [[ "$header_lower" =~ (bug|fix|issue|error|patch|hotfix) ]]; then
            echo "bugfix"
        elif [[ "$header_lower" =~ (refactor|cleanup|reorganize|restructure|clean.?up) ]]; then
            echo "refactor"
        elif [[ "$header_lower" =~ (documentation|readme|guide|doc|docs) ]]; then
            echo "docs"
        elif [[ "$header_lower" =~ (test|spec|coverage|testing) ]]; then
            echo "test"
        else
            echo "feature"
        fi
    }

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

        while [[ -f "${target_dir}/${filename}" ]]; do
            filename="${base}-${counter}.md"
            ((counter++))
        done

        echo "$filename"
    }

    get_file_age_days() {
        local file="$1"
        local file_time=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)
        local now=$(date +%s)
        echo $(( (now - file_time) / 86400 ))
    }

    archive_old_plans() {
        local plans_dir="$1"
        local older_than_days="${2:-30}"
        local archive_dir="${plans_dir}/archive"
        local count=0

        [[ ! -d "$plans_dir" ]] && echo "0" && return

        mkdir -p "$archive_dir"

        for file in "$plans_dir"/*.md; do
            [[ -e "$file" ]] || continue
            local age=$(get_file_age_days "$file")
            if [[ "$age" -gt "$older_than_days" ]]; then
                mv "$file" "${archive_dir}/$(basename "$file")"
                count=$((count + 1))
            fi
        done

        echo "$count"
    }
fi

# Load configuration with defaults
load_config() {
    TARGET_DIR="$DEFAULT_TARGET_DIR"
    AUTO_COMMIT="$DEFAULT_AUTO_COMMIT"
    AUTO_ARCHIVE_ENABLED="$DEFAULT_AUTO_ARCHIVE_ENABLED"
    AUTO_ARCHIVE_DAYS="$DEFAULT_AUTO_ARCHIVE_DAYS"
    ALWAYS_ON="true"

    if [[ -f "$PLANS_BANK_CONFIG" ]] && command -v jq &> /dev/null; then
        ALWAYS_ON=$(jq -r '.alwaysOn // true' "$PLANS_BANK_CONFIG" 2>/dev/null)
        TARGET_DIR=$(jq -r '.targetDirectory // "./plans"' "$PLANS_BANK_CONFIG" 2>/dev/null)
        AUTO_COMMIT=$(jq -r '.autoCommit // true' "$PLANS_BANK_CONFIG" 2>/dev/null)
        AUTO_ARCHIVE_ENABLED=$(jq -r '.autoArchive.enabled // true' "$PLANS_BANK_CONFIG" 2>/dev/null)
        AUTO_ARCHIVE_DAYS=$(jq -r '.autoArchive.olderThanDays // 30' "$PLANS_BANK_CONFIG" 2>/dev/null)

        # Expand ~ in paths
        TARGET_DIR="${TARGET_DIR/#\~/$HOME}"
    elif [[ -f "$PLANS_BANK_CONFIG" ]]; then
        # Basic parsing without jq
        local always_on_val=$(grep '"alwaysOn"' "$PLANS_BANK_CONFIG" 2>/dev/null | grep -o 'true\|false' | head -1)
        [[ -n "$always_on_val" ]] && ALWAYS_ON="$always_on_val"
    fi
}

# Git commit helper
git_commit_plan() {
    local file="$1"
    local name=$(basename "$file" .md)

    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        return 0
    fi

    git add "$file" 2>/dev/null || true
    git commit -m "Add plan: ${name}" 2>/dev/null || true
}

# Main rename logic - operates only on ./plans/
rename_plans() {
    local hook_type="${1:-sync}"
    local renamed_count=0

    # Load configuration
    load_config

    # Exit early if alwaysOn is disabled
    if [[ "$ALWAYS_ON" != "true" ]]; then
        exit 0
    fi

    # Check if target directory exists
    if [[ ! -d "$TARGET_DIR" ]]; then
        exit 0
    fi

    # Process each .md file in ./plans/ directory
    for file in "$TARGET_DIR"/*.md; do
        # Skip if no files match
        [[ -e "$file" ]] || continue

        local filename=$(basename "$file")

        # Skip if already in organized format
        if is_any_organized_name "$filename"; then
            continue
        fi

        # Only process files with default naming pattern (word-word-word.md)
        if ! is_default_name "$filename"; then
            continue
        fi

        # Extract header from file
        local header=$(extract_plan_name "$file")
        if [[ -z "$header" ]]; then
            header="untitled-plan"
        fi

        # Detect category from header keywords
        local category=$(detect_category "$header")

        # Sanitize name
        local sanitized=$(sanitize_name "$header")

        # Generate new filename with category prefix
        local new_filename=$(generate_categorized_filename "$sanitized" "$TARGET_DIR" "$category")
        local new_path="${TARGET_DIR}/${new_filename}"

        # Rename the file in place
        mv "$file" "$new_path"

        # Auto-commit if enabled
        if [[ "$AUTO_COMMIT" == "true" ]]; then
            git_commit_plan "$new_path"
        fi

        renamed_count=$((renamed_count + 1))
    done

    # Run auto-archive if enabled
    if [[ "$AUTO_ARCHIVE_ENABLED" == "true" ]]; then
        archive_old_plans "$TARGET_DIR" "$AUTO_ARCHIVE_DAYS" > /dev/null 2>&1 || true
    fi

    # Silent exit - hooks shouldn't produce output
    exit 0
}

# Show status (for debugging/manual use)
show_status() {
    load_config

    echo "Plans Bank Status"
    echo "================="
    echo ""
    echo "Configuration:"
    echo "  Always-On: $ALWAYS_ON"
    echo "  Plans Directory: $TARGET_DIR"
    echo "  Auto-Commit: $AUTO_COMMIT"
    echo "  Auto-Archive: $AUTO_ARCHIVE_ENABLED (after $AUTO_ARCHIVE_DAYS days)"
    echo ""

    # Count files in ./plans/
    local default_count=0
    local organized_count=0
    local total=0

    if [[ -d "$TARGET_DIR" ]]; then
        for file in "$TARGET_DIR"/*.md; do
            [[ -e "$file" ]] || continue
            ((total++))

            local filename=$(basename "$file")
            if is_any_organized_name "$filename"; then
                ((organized_count++))
            elif is_default_name "$filename"; then
                ((default_count++))
            fi
        done
    fi

    local archived=0
    if [[ -d "${TARGET_DIR}/archive" ]]; then
        archived=$(find "${TARGET_DIR}/archive" -maxdepth 1 -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
    fi

    echo "Status:"
    echo "  Default-named (pending rename): $default_count"
    echo "  Organized: $organized_count"
    echo "  Archived: $archived"
    echo "  Total in $TARGET_DIR: $total"
}

# Main entry point
main() {
    local command="${1:-sync}"

    case "$command" in
        session-start|start)
            # No-op for session start (no longer syncing from global)
            exit 0
            ;;
        stop)
            rename_plans "stop"
            ;;
        sync)
            rename_plans "sync"
            ;;
        status)
            show_status
            ;;
        *)
            rename_plans "$command"
            ;;
    esac
}

main "$@"
