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
SHARED_DIR="$CLAUDE_DIR/shared"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
CONFIG_FILE="$CLAUDE_DIR/plans-bank-config.json"

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

# Install slash commands (Option A)
install_slash_command() {
    print_header "Installing slash commands..."

    # Create commands directory
    mkdir -p "$COMMANDS_DIR"

    # Copy all slash command files
    cp "$SCRIPT_DIR/option-a-slash-command/save-plan.md" "$COMMANDS_DIR/save-plan.md"
    cp "$SCRIPT_DIR/option-a-slash-command/list-plans.md" "$COMMANDS_DIR/list-plans.md"
    cp "$SCRIPT_DIR/option-a-slash-command/search-plans.md" "$COMMANDS_DIR/search-plans.md"
    cp "$SCRIPT_DIR/option-a-slash-command/archive-plan.md" "$COMMANDS_DIR/archive-plan.md"

    print_success "Slash commands installed to: $COMMANDS_DIR/"
    echo "  - /save-plan [custom-name] [--commit]"
    echo "  - /list-plans [--global | --local]"
    echo "  - /search-plans <term> [--case-sensitive] [--global | --local]"
    echo "  - /archive-plan [filename] [--older-than Nd] [--all-default] [--list]"
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

# Check if jq is available
has_jq() {
    command -v jq &> /dev/null
}

# Merge hook configuration into existing settings.json using jq
merge_settings_with_jq() {
    local temp_file=$(mktemp)

    # Check if hooks.Stop exists and merge appropriately
    if jq -e '.hooks.Stop' "$SETTINGS_FILE" > /dev/null 2>&1; then
        # Stop hook exists, add our hook to it if not already present
        if ! jq -e '.hooks.Stop[].hooks[] | select(.command == "~/.claude/hooks/organize-plan.sh")' "$SETTINGS_FILE" > /dev/null 2>&1; then
            jq '.hooks.Stop[0].hooks += [{"type": "command", "command": "~/.claude/hooks/organize-plan.sh"}]' "$SETTINGS_FILE" > "$temp_file"
            mv "$temp_file" "$SETTINGS_FILE"
            return 0
        else
            # Already present
            rm "$temp_file"
            return 1
        fi
    elif jq -e '.hooks' "$SETTINGS_FILE" > /dev/null 2>&1; then
        # hooks exists but no Stop, add Stop
        jq '.hooks.Stop = [{"matcher": "*", "hooks": [{"type": "command", "command": "~/.claude/hooks/organize-plan.sh"}]}]' "$SETTINGS_FILE" > "$temp_file"
        mv "$temp_file" "$SETTINGS_FILE"
        return 0
    else
        # No hooks at all, add the whole structure
        jq '. + {"hooks": {"Stop": [{"matcher": "*", "hooks": [{"type": "command", "command": "~/.claude/hooks/organize-plan.sh"}]}]}}' "$SETTINGS_FILE" > "$temp_file"
        mv "$temp_file" "$SETTINGS_FILE"
        return 0
    fi
}

# Install plugin (Option C) - combines slash command + hook with auto-merge
install_plugin() {
    print_header "Installing Quick Plugin (Option C)..."
    echo ""

    # Install slash commands
    print_header "Step 1: Installing slash commands..."
    mkdir -p "$COMMANDS_DIR"
    cp "$SCRIPT_DIR/option-a-slash-command/save-plan.md" "$COMMANDS_DIR/save-plan.md"
    cp "$SCRIPT_DIR/option-a-slash-command/list-plans.md" "$COMMANDS_DIR/list-plans.md"
    cp "$SCRIPT_DIR/option-a-slash-command/search-plans.md" "$COMMANDS_DIR/search-plans.md"
    cp "$SCRIPT_DIR/option-a-slash-command/archive-plan.md" "$COMMANDS_DIR/archive-plan.md"
    print_success "  Installed: $COMMANDS_DIR/save-plan.md"
    print_success "  Installed: $COMMANDS_DIR/list-plans.md"
    print_success "  Installed: $COMMANDS_DIR/search-plans.md"
    print_success "  Installed: $COMMANDS_DIR/archive-plan.md"
    echo ""

    # Install hook script
    print_header "Step 2: Installing hook script..."
    mkdir -p "$HOOKS_DIR"
    cp "$SCRIPT_DIR/option-b-automatic/hooks/organize-plan.sh" "$HOOKS_DIR/organize-plan.sh"
    chmod +x "$HOOKS_DIR/organize-plan.sh"
    print_success "  Installed: $HOOKS_DIR/organize-plan.sh"
    echo ""

    # Install shared utilities
    print_header "Step 3: Installing shared utilities..."
    mkdir -p "$CLAUDE_DIR/shared"
    cp "$SCRIPT_DIR/shared/plan-utils.sh" "$CLAUDE_DIR/shared/plan-utils.sh"
    print_success "  Installed: $CLAUDE_DIR/shared/plan-utils.sh"
    echo ""

    # Handle settings.json with auto-merge
    print_header "Step 4: Configuring settings.json..."
    if [[ ! -f "$SETTINGS_FILE" ]]; then
        # No existing settings, create new
        mkdir -p "$CLAUDE_DIR"
        cp "$SCRIPT_DIR/option-b-automatic/settings.json" "$SETTINGS_FILE"
        print_success "  Created: $SETTINGS_FILE"
    elif has_jq; then
        # Existing settings with jq available - try to merge
        if merge_settings_with_jq; then
            print_success "  Merged hook configuration into existing settings.json"
        else
            print_warning "  Hook already configured in settings.json"
        fi
    else
        # Existing settings without jq
        print_warning "  Existing settings.json found, but jq not available for auto-merge"
        echo ""
        echo "Add this hook configuration to your ~/.claude/settings.json:"
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
        echo "Tip: Install jq for auto-merge: brew install jq (macOS) or apt install jq (Linux)"
    fi
}

# Merge always-on hook configuration into existing settings.json using jq
configure_always_on_hooks() {
    local temp_file=$(mktemp)

    # Define our hook
    local stop_hook='{"type": "command", "command": "~/.claude/hooks/plans-bank-sync.sh stop"}'

    # Check if we need to add Stop hook
    if ! jq -e '.hooks.Stop[].hooks[] | select(.command | contains("plans-bank-sync.sh"))' "$SETTINGS_FILE" > /dev/null 2>&1; then
        if jq -e '.hooks.Stop' "$SETTINGS_FILE" > /dev/null 2>&1; then
            # Stop exists, add our hook
            jq ".hooks.Stop[0].hooks += [$stop_hook]" "$SETTINGS_FILE" > "$temp_file"
            mv "$temp_file" "$SETTINGS_FILE"
        elif jq -e '.hooks' "$SETTINGS_FILE" > /dev/null 2>&1; then
            # hooks exists but no Stop
            jq ".hooks.Stop = [{\"matcher\": \"*\", \"hooks\": [$stop_hook]}]" "$SETTINGS_FILE" > "$temp_file"
            mv "$temp_file" "$SETTINGS_FILE"
        else
            # No hooks at all
            jq ". + {\"hooks\": {\"Stop\": [{\"matcher\": \"*\", \"hooks\": [$stop_hook]}]}}" "$SETTINGS_FILE" > "$temp_file"
            mv "$temp_file" "$SETTINGS_FILE"
        fi
    fi

    rm -f "$temp_file"
}

# Install always-on auto-save (Option D)
install_always_on() {
    print_header "Installing Always-On Auto-Save (Option D)..."
    echo ""

    # Install sync hook script
    print_header "Step 1: Installing sync hook script..."
    mkdir -p "$HOOKS_DIR"
    cp "$SCRIPT_DIR/option-d-always-on/hooks/plans-bank-sync.sh" "$HOOKS_DIR/plans-bank-sync.sh"
    chmod +x "$HOOKS_DIR/plans-bank-sync.sh"
    print_success "  Installed: $HOOKS_DIR/plans-bank-sync.sh"
    echo ""

    # Install shared utilities
    print_header "Step 2: Installing shared utilities..."
    mkdir -p "$SHARED_DIR"
    cp "$SCRIPT_DIR/shared/plan-utils.sh" "$SHARED_DIR/plan-utils.sh"
    print_success "  Installed: $SHARED_DIR/plan-utils.sh"
    echo ""

    # Install sync-status command
    print_header "Step 3: Installing sync-status command..."
    mkdir -p "$COMMANDS_DIR"
    cp "$SCRIPT_DIR/option-d-always-on/commands/sync-status.md" "$COMMANDS_DIR/sync-status.md"
    print_success "  Installed: $COMMANDS_DIR/sync-status.md"
    echo ""

    # Install configuration file
    print_header "Step 4: Installing configuration..."
    if [[ ! -f "$CONFIG_FILE" ]]; then
        cp "$SCRIPT_DIR/option-d-always-on/config/plans-bank-config.json" "$CONFIG_FILE"
        print_success "  Created: $CONFIG_FILE"
    else
        print_warning "  Config already exists: $CONFIG_FILE (keeping existing)"
    fi
    echo ""

    # Handle settings.json
    print_header "Step 5: Configuring settings.json..."
    if [[ ! -f "$SETTINGS_FILE" ]]; then
        # No existing settings, copy our template
        cp "$SCRIPT_DIR/option-d-always-on/settings.json" "$SETTINGS_FILE"
        print_success "  Created: $SETTINGS_FILE"
    elif has_jq; then
        # Existing settings with jq available - merge
        configure_always_on_hooks
        print_success "  Merged hook configuration into existing settings.json"
    else
        # Existing settings without jq
        print_warning "  Existing settings.json found, but jq not available for auto-merge"
        echo ""
        echo "Add this hook to your ~/.claude/settings.json:"
        echo ""
        echo '  "hooks": {'
        echo '    "Stop": [{'
        echo '      "matcher": "*",'
        echo '      "hooks": [{"type": "command", "command": "~/.claude/hooks/plans-bank-sync.sh stop"}]'
        echo '    }]'
        echo '  }'
        echo ""
        echo "Tip: Install jq for auto-merge: brew install jq (macOS) or apt install jq (Linux)"
    fi
    echo ""

    print_success "Always-On Auto-Save installed!"
    echo ""
    echo "What happens now:"
    echo "  - Plans in ./plans/ with default names (word-word-word.md) are auto-renamed"
    echo "  - Stop hook: Renames plans when Claude Code stops"
    echo "  - Use /sync-status to check status"
    echo ""
    echo "Configuration: $CONFIG_FILE"
}

# Install everything (A + B + D)
install_everything() {
    print_header "Installing Everything (Options A + B + D)..."
    echo ""

    # Install slash commands (Option A)
    install_slash_command
    echo ""

    # Install automatic hook (Option B)
    install_automatic
    echo ""

    # Install always-on (Option D)
    install_always_on
}

# Uninstall everything
uninstall() {
    print_header "Uninstalling claude-code-plans-bank..."

    local removed=false

    # Remove all slash commands
    for cmd in save-plan list-plans search-plans archive-plan sync-status; do
        if [[ -f "$COMMANDS_DIR/${cmd}.md" ]]; then
            rm "$COMMANDS_DIR/${cmd}.md"
            print_success "Removed: $COMMANDS_DIR/${cmd}.md"
            removed=true
        fi
    done

    # Remove Option B hook
    if [[ -f "$HOOKS_DIR/organize-plan.sh" ]]; then
        rm "$HOOKS_DIR/organize-plan.sh"
        print_success "Removed: $HOOKS_DIR/organize-plan.sh"
        removed=true
    fi

    # Remove Option D hook
    if [[ -f "$HOOKS_DIR/plans-bank-sync.sh" ]]; then
        rm "$HOOKS_DIR/plans-bank-sync.sh"
        print_success "Removed: $HOOKS_DIR/plans-bank-sync.sh"
        removed=true
    fi

    # Remove shared utilities
    if [[ -f "$SHARED_DIR/plan-utils.sh" ]]; then
        rm "$SHARED_DIR/plan-utils.sh"
        print_success "Removed: $SHARED_DIR/plan-utils.sh"
        # Remove shared directory if empty
        rmdir "$SHARED_DIR" 2>/dev/null || true
        removed=true
    fi

    # Remove config file (ask first)
    if [[ -f "$CONFIG_FILE" ]]; then
        read -p "Remove configuration file ($CONFIG_FILE)? [y/N] " remove_config
        if [[ "$remove_config" =~ ^[Yy]$ ]]; then
            rm "$CONFIG_FILE"
            print_success "Removed: $CONFIG_FILE"
        else
            print_warning "Kept: $CONFIG_FILE"
        fi
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
    echo "Format: {category}-{name}-{MM.DD.YY}.md"
    echo ""
    echo "Choose an installation option:"
    echo ""
    echo "  1) Slash Command (Option A)"
    echo "     - Manual control with /save-plan"
    echo "     - Supports custom names and --commit flag"
    echo ""
    echo "  2) Automatic Hook (Option B)"
    echo "     - Renames files automatically on session stop"
    echo "     - Works with files already in ./plans/"
    echo ""
    echo "  3) Quick Plugin (Option C)"
    echo "     - Installs slash command + automatic hook"
    echo "     - Auto-merges settings.json if jq is available"
    echo ""
    echo -e "  ${GREEN}4) Always-On Auto-Save (Option D) - RECOMMENDED${NC}"
    echo "     - Auto-renames plans in ./plans/ from default names"
    echo "     - Hook runs on session Stop"
    echo "     - Auto-categorizes: bugfix, refactor, docs, test, feature"
    echo "     - Includes /sync-status command"
    echo ""
    echo "  5) Install Everything (A + B + D)"
    echo "     - All slash commands + all hooks"
    echo ""
    echo "  6) Uninstall"
    echo "     - Remove all installed components"
    echo ""
    echo "  7) Exit"
    echo ""
    read -p "Enter choice [1-7]: " choice

    case $choice in
        1)
            install_slash_command
            ;;
        2)
            install_automatic
            ;;
        3)
            install_plugin
            ;;
        4)
            install_always_on
            ;;
        5)
            install_everything
            ;;
        6)
            uninstall
            ;;
        7)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please enter 1-7."
            exit 1
            ;;
    esac

    echo ""
    print_success "Installation complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Create a plan in Claude Code (use plan mode)"
    echo "  2. Plans are saved to ./plans/ with default names"
    echo "  3. Run /save-plan to rename manually (Options A/C)"
    echo "     OR let it auto-rename on session stop (Options B/D)"
    echo "  4. Find your plans in ./plans/ with descriptive names"
    echo "  5. Use /sync-status to check status"
    echo ""
}

# Run main
main "$@"
