#!/bin/bash
#
# Claude Code Web UI Launcher
# Starts the web server and opens the browser
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DEFAULT_PORT=3847
DEFAULT_HOST="localhost"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_UI_DIR="$(dirname "$SCRIPT_DIR")"

# Print colored message
print_msg() {
    local color=$1
    local msg=$2
    echo -e "${color}${msg}${NC}"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_msg "$RED" "Error: Node.js is not installed."
        print_msg "$YELLOW" "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi

    # Check Node.js version (require 18+)
    NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_msg "$YELLOW" "Warning: Node.js 18+ is recommended. You have $(node -v)"
    fi
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_msg "$RED" "Error: npm is not installed."
        exit 1
    fi
}

# Install dependencies if needed
install_deps() {
    if [ ! -d "$WEB_UI_DIR/node_modules" ]; then
        print_msg "$BLUE" "Installing dependencies..."
        cd "$WEB_UI_DIR"
        npm install
    fi
}

# Open browser
open_browser() {
    local url=$1

    # Wait a moment for server to start
    sleep 1

    # Detect OS and open browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$url" 2>/dev/null || true
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v xdg-open &> /dev/null; then
            xdg-open "$url" 2>/dev/null || true
        elif command -v sensible-browser &> /dev/null; then
            sensible-browser "$url" 2>/dev/null || true
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ -n "$WSL_DISTRO_NAME" ]]; then
        # Windows (Git Bash, Cygwin, or WSL)
        if command -v cmd.exe &> /dev/null; then
            cmd.exe /c start "$url" 2>/dev/null || true
        elif command -v explorer.exe &> /dev/null; then
            explorer.exe "$url" 2>/dev/null || true
        fi
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --port PORT     Server port (default: $DEFAULT_PORT)"
    echo "  -h, --host HOST     Server host (default: $DEFAULT_HOST)"
    echo "  -n, --no-browser    Don't open browser automatically"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                  Start server with defaults"
    echo "  $0 -p 8080          Start server on port 8080"
    echo "  $0 --no-browser     Start server without opening browser"
}

# Parse arguments
PORT=$DEFAULT_PORT
HOST=$DEFAULT_HOST
OPEN_BROWSER=true

while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -h|--host)
            HOST="$2"
            shift 2
            ;;
        -n|--no-browser)
            OPEN_BROWSER=false
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            print_msg "$RED" "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Main
main() {
    print_msg "$BLUE" "╔═══════════════════════════════════════╗"
    print_msg "$BLUE" "║     Claude Code Web UI Launcher       ║"
    print_msg "$BLUE" "╚═══════════════════════════════════════╝"
    echo ""

    # Check requirements
    check_node
    check_npm

    # Install dependencies
    install_deps

    # Build URL
    URL="http://${HOST}:${PORT}"

    # Open browser in background if enabled
    if [ "$OPEN_BROWSER" = true ]; then
        print_msg "$GREEN" "Opening browser at $URL"
        open_browser "$URL" &
    fi

    # Start server
    print_msg "$GREEN" "Starting server..."
    echo ""

    cd "$WEB_UI_DIR"
    PORT=$PORT HOST=$HOST node server/index.js
}

# Handle Ctrl+C gracefully
trap 'echo ""; print_msg "$YELLOW" "Shutting down..."; exit 0' INT TERM

# Run main
main
