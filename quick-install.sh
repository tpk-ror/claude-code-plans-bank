#!/bin/bash
# quick-install.sh - One-liner installer for claude-code-plans-bank
# Usage: curl -fsSL https://raw.githubusercontent.com/yourusername/claude-code-plans-bank/main/quick-install.sh | bash
# Uninstall: curl -fsSL ... | bash -s -- --uninstall

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# GitHub raw content base URL
GITHUB_RAW="https://raw.githubusercontent.com/yourusername/claude-code-plans-bank/main"

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

print_error() {
    echo -e "${RED}$1${NC}"
}

print_step() {
    echo -e "${BLUE}[*]${NC} $1"
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

# Merge hook configuration into existing settings.json using jq
merge_settings_with_jq() {
    local hook_config='{
        "type": "command",
        "command": "~/.claude/hooks/organize-plan.sh"
    }'

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

# Show manual settings.json instructions
show_manual_settings_instructions() {
    echo ""
    print_warning "Manual configuration required for settings.json"
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
}

# Create new settings.json
create_new_settings() {
    cat > "$SETTINGS_FILE" << 'EOF'
{
  "plansDirectory": "./plans",
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/organize-plan.sh"
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

    # Step 1: Create directories
    print_step "Creating directories..."
    mkdir -p "$COMMANDS_DIR"
    mkdir -p "$HOOKS_DIR"
    mkdir -p "$SHARED_DIR"

    # Step 2: Download slash command
    print_step "Installing slash command..."
    download_file "$GITHUB_RAW/option-a-slash-command/save-plan.md" "$COMMANDS_DIR/save-plan.md"
    print_success "  Installed: $COMMANDS_DIR/save-plan.md"

    # Step 3: Download hook script
    print_step "Installing hook script..."
    download_file "$GITHUB_RAW/option-b-automatic/hooks/organize-plan.sh" "$HOOKS_DIR/organize-plan.sh"
    chmod +x "$HOOKS_DIR/organize-plan.sh"
    print_success "  Installed: $HOOKS_DIR/organize-plan.sh"

    # Step 4: Download shared utilities
    print_step "Installing shared utilities..."
    download_file "$GITHUB_RAW/shared/plan-utils.sh" "$SHARED_DIR/plan-utils.sh"
    print_success "  Installed: $SHARED_DIR/plan-utils.sh"

    # Step 5: Handle settings.json
    print_step "Configuring settings.json..."

    if [[ ! -f "$SETTINGS_FILE" ]]; then
        # No existing settings, create new
        create_new_settings
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
        show_manual_settings_instructions
    fi

    echo ""
    print_success "Installation complete!"
    echo ""
    echo "What's installed:"
    echo "  - Slash command: /save-plan"
    echo "  - Automatic hook: Runs on session stop"
    echo "  - Shared utilities: plan-utils.sh"
    echo ""
    echo "Usage:"
    echo "  /save-plan              # Save current plan with extracted name"
    echo "  /save-plan my-feature   # Save with custom name"
    echo "  /save-plan --commit     # Save and git commit"
    echo ""
    echo "To uninstall:"
    echo "  curl -fsSL $GITHUB_RAW/quick-install.sh | bash -s -- --uninstall"
    echo ""
}

# Uninstall everything
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
        print_success "Uninstall complete!"
    else
        echo "Nothing to uninstall."
    fi
    echo ""
}

# Main
main() {
    case "${1:-}" in
        --uninstall|-u)
            uninstall
            ;;
        --help|-h)
            echo "Claude Code Plans Bank - Quick Install"
            echo ""
            echo "Usage:"
            echo "  curl -fsSL <url>/quick-install.sh | bash           # Install"
            echo "  curl -fsSL <url>/quick-install.sh | bash -s -- --uninstall  # Uninstall"
            echo ""
            echo "Options:"
            echo "  --uninstall, -u   Remove installed components"
            echo "  --help, -h        Show this help message"
            ;;
        *)
            install
            ;;
    esac
}

main "$@"
