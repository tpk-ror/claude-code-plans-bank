#!/bin/bash
# quick-install.sh - One-liner installer for claude-code-plans-bank
# Usage: curl -fsSL https://raw.githubusercontent.com/tpk-ror/claude-code-plans-bank/main/quick-install.sh | bash
#
# Options:
#   --global, -g    Install globally (~/.claude/)
#   --project, -p   Install to current project (./.claude/)
#   --uninstall, -u Remove installed components
#   --help, -h      Show help message
#
# Non-interactive examples:
#   curl -fsSL <url>/quick-install.sh | bash -s -- --global
#   curl -fsSL <url>/quick-install.sh | bash -s -- --project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# GitHub raw content base URL
GITHUB_RAW="https://raw.githubusercontent.com/tpk-ror/claude-code-plans-bank/main"

# Installation mode variables
INSTALL_MODE=""  # "global" or "project"
HOOK_PATH_PREFIX=""  # "~/.claude" or "./.claude"

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
        HOOK_PATH_PREFIX="~/.claude"
    else
        CLAUDE_DIR="./.claude"
        SETTINGS_FILE="$CLAUDE_DIR/settings.local.json"
        HOOK_PATH_PREFIX="./.claude"
    fi

    COMMANDS_DIR="$CLAUDE_DIR/commands"
    HOOKS_DIR="$CLAUDE_DIR/hooks"
    SHARED_DIR="$CLAUDE_DIR/shared"
    CONFIG_FILE="$CLAUDE_DIR/plans-bank-config.json"
}

# Interactive mode selection
select_install_mode() {
    echo ""
    print_header "Installation Scope"
    echo "=================="
    echo ""
    echo "Where would you like to install Claude Code Plans Bank?"
    echo ""
    echo "  1) Global (~/.claude/)"
    echo "     - Available in all projects"
    echo "     - Hooks run for all Claude Code sessions"
    echo ""
    echo "  2) Project-specific (./.claude/)"
    echo "     - Only available in this project"
    echo "     - Uses settings.local.json"
    echo "     - Hooks only run for this project"
    echo ""
    read -p "Enter choice [1-2]: " mode_choice

    case $mode_choice in
        1)
            INSTALL_MODE="global"
            ;;
        2)
            INSTALL_MODE="project"
            ;;
        *)
            print_error "Invalid choice. Please enter 1 or 2."
            exit 1
            ;;
    esac

    setup_directories
}

# Check if jq is available
has_jq() {
    command -v jq &> /dev/null
}

# Download a file from GitHub
download_file() {
    local url="$1"
    local dest="$2"
    local dir=$(dirname "$dest")

    mkdir -p "$dir"

    if command -v curl &> /dev/null; then
        curl -fsSL "$url" -o "$dest"
    elif command -v wget &> /dev/null; then
        wget -q "$url" -O "$dest"
    else
        print_error "Error: Neither curl nor wget found. Please install one of them."
        exit 1
    fi
}

# Merge hook configuration into existing settings file using jq
merge_settings_with_jq() {
    local temp_file=$(mktemp)
    local modified=false
    local organize_hook="${HOOK_PATH_PREFIX}/hooks/organize-plan.sh"
    local sync_hook="${HOOK_PATH_PREFIX}/hooks/plans-bank-sync.sh stop"

    # Add organize-plan.sh Stop hook (Option B)
    if ! jq -e ".hooks.Stop[].hooks[] | select(.command == \"$organize_hook\")" "$SETTINGS_FILE" > /dev/null 2>&1; then
        if jq -e '.hooks.Stop' "$SETTINGS_FILE" > /dev/null 2>&1; then
            jq ".hooks.Stop[0].hooks += [{\"type\": \"command\", \"command\": \"$organize_hook\"}]" "$SETTINGS_FILE" > "$temp_file"
            mv "$temp_file" "$SETTINGS_FILE"
            modified=true
        elif jq -e '.hooks' "$SETTINGS_FILE" > /dev/null 2>&1; then
            jq ".hooks.Stop = [{\"matcher\": \"*\", \"hooks\": [{\"type\": \"command\", \"command\": \"$organize_hook\"}]}]" "$SETTINGS_FILE" > "$temp_file"
            mv "$temp_file" "$SETTINGS_FILE"
            modified=true
        else
            jq ". + {\"hooks\": {\"Stop\": [{\"matcher\": \"*\", \"hooks\": [{\"type\": \"command\", \"command\": \"$organize_hook\"}]}]}}" "$SETTINGS_FILE" > "$temp_file"
            mv "$temp_file" "$SETTINGS_FILE"
            modified=true
        fi
    fi

    # Add plans-bank-sync.sh Stop hook (Option D)
    if ! jq -e '.hooks.Stop[].hooks[] | select(.command | contains("plans-bank-sync.sh"))' "$SETTINGS_FILE" > /dev/null 2>&1; then
        if jq -e '.hooks.Stop' "$SETTINGS_FILE" > /dev/null 2>&1; then
            jq ".hooks.Stop[0].hooks += [{\"type\": \"command\", \"command\": \"$sync_hook\"}]" "$SETTINGS_FILE" > "$temp_file"
            mv "$temp_file" "$SETTINGS_FILE"
            modified=true
        fi
    fi

    rm -f "$temp_file"
    [[ "$modified" = true ]]
}

# Show manual settings instructions
show_manual_settings_instructions() {
    echo ""
    print_warning "Manual configuration required for $(basename "$SETTINGS_FILE")"
    echo ""
    echo "Add these hook configurations to your $SETTINGS_FILE:"
    echo ""
    echo '  "hooks": {'
    echo '    "Stop": [{'
    echo '      "matcher": "*",'
    echo '      "hooks": ['
    echo "        {\"type\": \"command\", \"command\": \"${HOOK_PATH_PREFIX}/hooks/organize-plan.sh\"},"
    echo "        {\"type\": \"command\", \"command\": \"${HOOK_PATH_PREFIX}/hooks/plans-bank-sync.sh stop\"}"
    echo '      ]'
    echo '    }]'
    echo '  }'
    echo ""
}

# Create new settings file
create_new_settings() {
    cat > "$SETTINGS_FILE" << EOF
{
  "plansDirectory": "./docs/plans",
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "${HOOK_PATH_PREFIX}/hooks/organize-plan.sh"
          },
          {
            "type": "command",
            "command": "${HOOK_PATH_PREFIX}/hooks/plans-bank-sync.sh stop"
          }
        ]
      }
    ]
  }
}
EOF
}

# Install everything
install() {
    echo ""
    print_header "Claude Code Plans Bank - Quick Install"
    echo "========================================"
    echo ""
    echo "Installation mode: $INSTALL_MODE ($CLAUDE_DIR)"
    echo ""

    # Step 1: Create directories
    print_step "Creating directories..."
    mkdir -p "$COMMANDS_DIR"
    mkdir -p "$HOOKS_DIR"
    mkdir -p "$SHARED_DIR"

    # Step 2: Download slash commands (Option A)
    print_step "Installing slash commands (Option A)..."
    download_file "$GITHUB_RAW/option-a-slash-command/save-plan.md" "$COMMANDS_DIR/save-plan.md"
    download_file "$GITHUB_RAW/option-a-slash-command/list-plans.md" "$COMMANDS_DIR/list-plans.md"
    download_file "$GITHUB_RAW/option-a-slash-command/search-plans.md" "$COMMANDS_DIR/search-plans.md"
    download_file "$GITHUB_RAW/option-a-slash-command/archive-plan.md" "$COMMANDS_DIR/archive-plan.md"
    print_success "  Installed: $COMMANDS_DIR/save-plan.md"
    print_success "  Installed: $COMMANDS_DIR/list-plans.md"
    print_success "  Installed: $COMMANDS_DIR/search-plans.md"
    print_success "  Installed: $COMMANDS_DIR/archive-plan.md"

    # Step 3: Download sync-status command (Option D)
    print_step "Installing sync-status command (Option D)..."
    download_file "$GITHUB_RAW/option-d-always-on/commands/sync-status.md" "$COMMANDS_DIR/sync-status.md"
    print_success "  Installed: $COMMANDS_DIR/sync-status.md"

    # Step 4: Download hook scripts
    print_step "Installing hook scripts..."
    download_file "$GITHUB_RAW/option-b-automatic/hooks/organize-plan.sh" "$HOOKS_DIR/organize-plan.sh"
    chmod +x "$HOOKS_DIR/organize-plan.sh"
    print_success "  Installed: $HOOKS_DIR/organize-plan.sh (Option B)"

    download_file "$GITHUB_RAW/option-d-always-on/hooks/plans-bank-sync.sh" "$HOOKS_DIR/plans-bank-sync.sh"
    chmod +x "$HOOKS_DIR/plans-bank-sync.sh"
    print_success "  Installed: $HOOKS_DIR/plans-bank-sync.sh (Option D)"

    # Step 5: Download shared utilities
    print_step "Installing shared utilities..."
    download_file "$GITHUB_RAW/shared/plan-utils.sh" "$SHARED_DIR/plan-utils.sh"
    print_success "  Installed: $SHARED_DIR/plan-utils.sh"

    # Step 6: Install configuration file (Option D)
    print_step "Installing configuration..."
    if [[ ! -f "$CONFIG_FILE" ]]; then
        download_file "$GITHUB_RAW/option-d-always-on/config/plans-bank-config.json" "$CONFIG_FILE"
        print_success "  Installed: $CONFIG_FILE"
    else
        print_warning "  Config already exists: $CONFIG_FILE (keeping existing)"
    fi

    # Step 7: Handle settings file
    print_step "Configuring $(basename "$SETTINGS_FILE")..."

    if [[ ! -f "$SETTINGS_FILE" ]]; then
        # No existing settings, create new
        create_new_settings
        print_success "  Created: $SETTINGS_FILE"
    elif has_jq; then
        # Existing settings with jq available - try to merge
        if merge_settings_with_jq; then
            print_success "  Merged hook configuration into existing $(basename "$SETTINGS_FILE")"
        else
            print_warning "  Hooks already configured in $(basename "$SETTINGS_FILE")"
        fi
    else
        # Existing settings without jq
        print_warning "  Existing $(basename "$SETTINGS_FILE") found, but jq not available for auto-merge"
        show_manual_settings_instructions
    fi

    echo ""
    print_success "Installation complete!"
    echo ""
    echo "What's installed:"
    echo "  - Slash commands: /save-plan, /list-plans, /search-plans, /archive-plan, /sync-status"
    echo "  - Option B hook: Renames files in ./docs/plans/ on session stop"
    echo "  - Option D hook: Auto-renames plans with default names in ./docs/plans/"
    echo "  - Shared utilities: plan-utils.sh"
    echo "  - Configuration: $CONFIG_FILE"
    echo ""
    echo "Features:"
    echo "  - Auto-rename: Plans with default names (word-word-word.md) get descriptive names"
    echo "  - Auto-categorize: bugfix-, refactor-, docs-, test-, or feature- prefix"
    echo "  - Auto-archive: Plans older than 30 days moved to ./docs/plans/archive/"
    echo "  - Auto-commit: Each renamed plan committed to git"
    echo ""
    echo "Usage:"
    echo "  /save-plan              # Save current plan with extracted name"
    echo "  /save-plan my-feature   # Save with custom name"
    echo "  /save-plan --commit     # Save and git commit"
    echo "  /list-plans             # List all plans with metadata"
    echo "  /search-plans <term>    # Search plan contents"
    echo "  /archive-plan <file>    # Archive a plan file"
    echo "  /sync-status            # Check sync status and pending plans"
    if [[ "$INSTALL_MODE" == "project" ]]; then
        echo ""
        print_warning "Note: Project .claude/ directory may need to be added to .gitignore"
    fi
    echo ""
    echo "To uninstall:"
    echo "  curl -fsSL $GITHUB_RAW/quick-install.sh | bash -s -- --uninstall"
    echo ""
}

# Uninstall everything
uninstall() {
    # If mode not set, ask which to uninstall
    if [[ -z "$INSTALL_MODE" ]]; then
        echo ""
        print_header "Uninstall Scope"
        echo "==============="
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
    else
        setup_directories
        do_uninstall
    fi
}

do_uninstall() {
    echo ""
    print_header "Claude Code Plans Bank - Uninstall"
    echo "===================================="
    echo "Uninstalling from: $CLAUDE_DIR"
    echo ""

    local removed=false

    # Remove slash commands
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
        echo "To fully clean up, remove the hook configurations from $SETTINGS_FILE"
        echo ""
        print_success "Uninstall complete!"
    else
        echo "Nothing to uninstall in $CLAUDE_DIR."
    fi
    echo ""
}

# Show help
show_help() {
    echo "Claude Code Plans Bank - Quick Install"
    echo ""
    echo "Usage:"
    echo "  curl -fsSL <url>/quick-install.sh | bash              # Interactive install"
    echo "  curl -fsSL <url>/quick-install.sh | bash -s -- --global   # Global install"
    echo "  curl -fsSL <url>/quick-install.sh | bash -s -- --project  # Project install"
    echo "  curl -fsSL <url>/quick-install.sh | bash -s -- --uninstall  # Uninstall"
    echo ""
    echo "Options:"
    echo "  --global, -g      Install globally to ~/.claude/"
    echo "                    Available in all projects, hooks run for all sessions"
    echo ""
    echo "  --project, -p     Install to current project ./.claude/"
    echo "                    Only available in this project, uses settings.local.json"
    echo ""
    echo "  --uninstall, -u   Remove installed components"
    echo ""
    echo "  --help, -h        Show this help message"
    echo ""
    echo "If no flag is provided, you will be prompted to choose installation scope."
}

# Main
main() {
    local action="install"

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --global|-g)
                INSTALL_MODE="global"
                shift
                ;;
            --project|-p)
                INSTALL_MODE="project"
                shift
                ;;
            --uninstall|-u)
                action="uninstall"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information."
                exit 1
                ;;
        esac
    done

    case "$action" in
        install)
            # If mode not set via flag, prompt interactively
            if [[ -z "$INSTALL_MODE" ]]; then
                select_install_mode
            else
                setup_directories
            fi
            install
            ;;
        uninstall)
            uninstall
            ;;
    esac
}

main "$@"
