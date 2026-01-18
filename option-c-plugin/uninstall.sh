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

# Installation mode variables
INSTALL_MODE=""  # "global" or "project"

# Directory variables (set by setup_directories)
CLAUDE_DIR=""
COMMANDS_DIR=""
HOOKS_DIR=""
SHARED_DIR=""
SETTINGS_FILE=""
CONFIG_FILE=""

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

print_error() {
    echo -e "${RED}$1${NC}"
}

print_step() {
    echo -e "${BLUE}[*]${NC} $1"
}

# Setup directories based on installation mode
setup_directories() {
    if [[ "$INSTALL_MODE" == "global" ]]; then
        CLAUDE_DIR="$HOME/.claude"
        SETTINGS_FILE="$CLAUDE_DIR/settings.json"
    else
        CLAUDE_DIR="./.claude"
        SETTINGS_FILE="$CLAUDE_DIR/settings.local.json"
    fi

    COMMANDS_DIR="$CLAUDE_DIR/commands"
    HOOKS_DIR="$CLAUDE_DIR/hooks"
    SHARED_DIR="$CLAUDE_DIR/shared"
    CONFIG_FILE="$CLAUDE_DIR/plans-bank-config.json"
}

# Main uninstall function
do_uninstall() {
    print_header "Uninstalling from $CLAUDE_DIR..."
    echo ""

    local removed=false

    # Remove all slash commands
    print_step "Removing slash commands..."
    for cmd in save-plan list-plans search-plans archive-plan sync-status; do
        if [[ -f "$COMMANDS_DIR/${cmd}.md" ]]; then
            rm "$COMMANDS_DIR/${cmd}.md"
            print_success "  Removed: $COMMANDS_DIR/${cmd}.md"
            removed=true
        fi
    done

    # Remove hook scripts
    print_step "Removing hook scripts..."
    if [[ -f "$HOOKS_DIR/organize-plan.sh" ]]; then
        rm "$HOOKS_DIR/organize-plan.sh"
        print_success "  Removed: $HOOKS_DIR/organize-plan.sh"
        removed=true
    fi

    if [[ -f "$HOOKS_DIR/plans-bank-sync.sh" ]]; then
        rm "$HOOKS_DIR/plans-bank-sync.sh"
        print_success "  Removed: $HOOKS_DIR/plans-bank-sync.sh"
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

    # Remove config file
    if [[ -f "$CONFIG_FILE" ]]; then
        print_step "Removing configuration..."
        rm "$CONFIG_FILE"
        print_success "  Removed: $CONFIG_FILE"
        removed=true
    fi

    if [[ "$removed" = true ]]; then
        echo ""
        print_warning "Note: $(basename "$SETTINGS_FILE") was not modified."
        echo "To fully clean up, remove the Stop hook configuration from $SETTINGS_FILE"
        echo ""
        echo "Look for and remove these hook commands:"
        if [[ "$INSTALL_MODE" == "global" ]]; then
            echo '  "command": "~/.claude/hooks/organize-plan.sh"'
            echo '  "command": "~/.claude/hooks/plans-bank-sync.sh stop"'
        else
            echo '  "command": "./.claude/hooks/organize-plan.sh"'
            echo '  "command": "./.claude/hooks/plans-bank-sync.sh stop"'
        fi
        echo ""
        print_success "Uninstall complete!"
    else
        echo "Nothing to uninstall in $CLAUDE_DIR."
    fi
    echo ""
}

# Main uninstall entry point
uninstall() {
    echo ""
    print_header "Claude Code Plans Bank - Uninstall"
    echo "===================================="
    echo ""
    echo "Which installation would you like to remove?"
    echo ""
    echo "  1) Global (~/.claude/)"
    echo "  2) Project-specific (./.claude/)"
    echo "  3) Both"
    echo "  4) Cancel"
    echo ""
    read -p "Enter choice [1-4]: " uninstall_choice

    case $uninstall_choice in
        1)
            INSTALL_MODE="global"
            setup_directories
            do_uninstall
            ;;
        2)
            INSTALL_MODE="project"
            setup_directories
            do_uninstall
            ;;
        3)
            INSTALL_MODE="global"
            setup_directories
            do_uninstall
            INSTALL_MODE="project"
            setup_directories
            do_uninstall
            ;;
        4)
            echo "Cancelled."
            exit 0
            ;;
        *)
            print_error "Invalid choice."
            exit 1
            ;;
    esac
}

# Run uninstall
uninstall
