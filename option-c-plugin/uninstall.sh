#!/bin/bash
# uninstall.sh - Remove claude-code-plans-bank components
# This is a standalone script for local uninstallation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
CLAUDE_DIR="$HOME/.claude"
COMMANDS_DIR="$CLAUDE_DIR/commands"
HOOKS_DIR="$CLAUDE_DIR/hooks"
SHARED_DIR="$CLAUDE_DIR/shared"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"

# Print functions
print_header() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$1${NC}"
}

print_step() {
    echo -e "${BLUE}[*]${NC} $1"
}

# Main uninstall function
uninstall() {
    echo ""
    print_header "Claude Code Plans Bank - Uninstall"
    echo "===================================="
    echo ""

    local removed=false

    # Remove slash command
    if [[ -f "$COMMANDS_DIR/save-plan.md" ]]; then
        print_step "Removing slash command..."
        rm "$COMMANDS_DIR/save-plan.md"
        print_success "  Removed: $COMMANDS_DIR/save-plan.md"
        removed=true
    fi

    # Remove hook script
    if [[ -f "$HOOKS_DIR/organize-plan.sh" ]]; then
        print_step "Removing hook script..."
        rm "$HOOKS_DIR/organize-plan.sh"
        print_success "  Removed: $HOOKS_DIR/organize-plan.sh"
        removed=true
    fi

    # Remove shared utilities
    if [[ -f "$SHARED_DIR/plan-utils.sh" ]]; then
        print_step "Removing shared utilities..."
        rm "$SHARED_DIR/plan-utils.sh"
        print_success "  Removed: $SHARED_DIR/plan-utils.sh"
        removed=true

        # Remove shared directory if empty
        rmdir "$SHARED_DIR" 2>/dev/null || true
    fi

    if [[ "$removed" = true ]]; then
        echo ""
        print_warning "Note: settings.json was not modified."
        echo "To fully clean up, remove the Stop hook configuration from ~/.claude/settings.json"
        echo ""
        echo "Look for and remove this section:"
        echo '  "Stop": ['
        echo '    {'
        echo '      "matcher": "*",'
        echo '      "hooks": ['
        echo '        {'
        echo '          "type": "command",'
        echo '          "command": "~/.claude/hooks/organize-plan.sh"'
        echo '        }'
        echo '      ]'
        echo '    }'
        echo '  ]'
        echo ""
        print_success "Uninstall complete!"
    else
        echo "Nothing to uninstall. No claude-code-plans-bank components found."
    fi
    echo ""
}

# Run uninstall
uninstall
