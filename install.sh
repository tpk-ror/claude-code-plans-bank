#!/bin/bash
# install.sh - Interactive installer for claude-code-plans-bank
# Installs slash commands and/or hooks for plan organization

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
COMMANDS_DIR="$CLAUDE_DIR/commands"
HOOKS_DIR="$CLAUDE_DIR/hooks"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"

# Print colored output
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

# Install slash command (Option A)
install_slash_command() {
    print_header "Installing slash command..."

    # Create commands directory
    mkdir -p "$COMMANDS_DIR"

    # Copy the save-plan.md file
    cp "$SCRIPT_DIR/option-a-slash-command/save-plan.md" "$COMMANDS_DIR/save-plan.md"

    print_success "Slash command installed to: $COMMANDS_DIR/save-plan.md"
    echo "  Usage: /save-plan [custom-name] [--commit]"
}

# Install automatic hook (Option B)
install_automatic() {
    print_header "Installing automatic hook..."

    # Create hooks directory
    mkdir -p "$HOOKS_DIR"

    # Copy the hook script
    cp "$SCRIPT_DIR/option-b-automatic/hooks/organize-plan.sh" "$HOOKS_DIR/organize-plan.sh"
    chmod +x "$HOOKS_DIR/organize-plan.sh"

    # Copy shared utilities
    mkdir -p "$HOOKS_DIR/../shared"
    cp "$SCRIPT_DIR/shared/plan-utils.sh" "$HOOKS_DIR/../shared/plan-utils.sh"

    print_success "Hook script installed to: $HOOKS_DIR/organize-plan.sh"

    # Handle settings.json
    if [[ -f "$SETTINGS_FILE" ]]; then
        print_warning "Found existing settings.json"
        echo ""
        echo "You need to manually add the hook configuration to your settings.json."
        echo "Add this to your hooks section:"
        echo ""
        echo '  "hooks": {'
        echo '    "Stop": ['
        echo '      {'
        echo '        "matcher": "*",'
        echo '        "hooks": ['
        echo '          {'
        echo '            "type": "command",'
        echo '            "command": "~/.claude/hooks/organize-plan.sh"'
        echo '          }'
        echo '        ]'
        echo '      }'
        echo '    ]'
        echo '  }'
        echo ""
        read -p "Would you like to view the full settings snippet? [y/N] " show_snippet
        if [[ "$show_snippet" =~ ^[Yy]$ ]]; then
            cat "$SCRIPT_DIR/option-b-automatic/settings.json"
        fi
    else
        # No existing settings, safe to copy
        mkdir -p "$CLAUDE_DIR"
        cp "$SCRIPT_DIR/option-b-automatic/settings.json" "$SETTINGS_FILE"
        print_success "Settings file created at: $SETTINGS_FILE"
    fi
}

# Uninstall everything
uninstall() {
    print_header "Uninstalling claude-code-plans-bank..."

    local removed=false

    if [[ -f "$COMMANDS_DIR/save-plan.md" ]]; then
        rm "$COMMANDS_DIR/save-plan.md"
        print_success "Removed: $COMMANDS_DIR/save-plan.md"
        removed=true
    fi

    if [[ -f "$HOOKS_DIR/organize-plan.sh" ]]; then
        rm "$HOOKS_DIR/organize-plan.sh"
        print_success "Removed: $HOOKS_DIR/organize-plan.sh"
        removed=true
    fi

    if [[ "$removed" = false ]]; then
        echo "Nothing to uninstall."
    else
        print_warning "Note: settings.json was not modified. Remove the hook configuration manually if needed."
    fi
}

# Main menu
main() {
    echo ""
    print_header "Claude Code Plans Bank - Installer"
    echo "=================================="
    echo ""
    echo "Organize your Claude Code plan files with descriptive naming."
    echo "Format: feature-{name}-{MM.DD.YY}.md"
    echo ""
    echo "Choose an installation option:"
    echo ""
    echo "  1) Slash Command (Option A)"
    echo "     - Manual control with /save-plan"
    echo "     - Supports custom names and --commit flag"
    echo ""
    echo "  2) Automatic Hook (Option B)"
    echo "     - Renames files automatically on session stop"
    echo "     - Requires settings.json configuration"
    echo ""
    echo "  3) Both options"
    echo "     - Install slash command AND automatic hook"
    echo ""
    echo "  4) Uninstall"
    echo "     - Remove installed components"
    echo ""
    echo "  5) Exit"
    echo ""
    read -p "Enter choice [1-5]: " choice

    case $choice in
        1)
            install_slash_command
            ;;
        2)
            install_automatic
            ;;
        3)
            install_slash_command
            echo ""
            install_automatic
            ;;
        4)
            uninstall
            ;;
        5)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please enter 1-5."
            exit 1
            ;;
    esac

    echo ""
    print_success "Installation complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Create a plan in Claude Code (use plan mode)"
    echo "  2. Run /save-plan to organize it (Option A)"
    echo "     OR let it auto-organize on session stop (Option B)"
    echo "  3. Find your plans in ./plans/ with descriptive names"
    echo ""
}

# Run main
main "$@"
