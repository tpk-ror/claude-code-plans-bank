#!/bin/bash
# organize-plan.sh - Automatically rename default-named plan files
# This hook runs after Claude Code stops, checking for plans that need organizing

# Exit silently on any error (hooks should be non-disruptive)
set -e

# Configuration
PLANS_DIR="./plans"

# Source shared utilities if available
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UTILS_FILE="${SCRIPT_DIR}/../../shared/plan-utils.sh"

if [[ -f "$UTILS_FILE" ]]; then
    source "$UTILS_FILE"
else
    # Inline utility functions if shared file not found

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

    generate_filename() {
        local name="$1"
        local target_dir="$2"
        local date=$(date +"%m.%d.%y")
        local base="feature-${name}-${date}"
        local filename="${base}.md"
        local counter=2

        while [[ -f "${target_dir}/${filename}" ]]; do
            filename="${base}-${counter}.md"
            ((counter++))
        done

        echo "$filename"
    }

    is_default_name() {
        local filename="$1"
        [[ "$filename" =~ ^[a-z]+-[a-z]+-[a-z]+\.md$ ]]
    }

    is_organized_name() {
        local filename="$1"
        [[ "$filename" =~ ^feature-.*-[0-9]{2}\.[0-9]{2}\.[0-9]{2}(-[0-9]+)?\.md$ ]]
    }
fi

# Main logic
main() {
    # Check if plans directory exists
    if [[ ! -d "$PLANS_DIR" ]]; then
        exit 0
    fi

    # Find files with default naming pattern
    for file in "$PLANS_DIR"/*.md; do
        # Skip if no files match
        [[ -e "$file" ]] || continue

        filename=$(basename "$file")

        # Skip if already organized
        if is_organized_name "$filename"; then
            continue
        fi

        # Check if it matches default pattern
        if is_default_name "$filename"; then
            # Extract name from content
            header=$(extract_plan_name "$file")

            if [[ -z "$header" ]]; then
                header="untitled-plan"
            fi

            # Sanitize and generate new filename
            sanitized=$(sanitize_name "$header")
            new_filename=$(generate_filename "$sanitized" "$PLANS_DIR")

            # Rename the file
            mv "$file" "${PLANS_DIR}/${new_filename}"
        fi
    done
}

# Run main function
main "$@"
