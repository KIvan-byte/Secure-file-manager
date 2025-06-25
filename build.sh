#!/bin/bash

# Build script for Secure File Manager
# Supports building for different platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to display help
show_help() {
    echo "Usage: $0 [OPTIONS] [PLATFORM]"
    echo ""
    echo "Build Secure File Manager for different platforms"
    echo ""
    echo "PLATFORMS:"
    echo "  linux     Build for Linux (AppImage, DEB, RPM, tar.gz)"
    echo "  windows   Build for Windows (NSIS installer, portable, zip)"
    echo "  macos     Build for macOS (DMG, zip)"
    echo "  all       Build for all platforms"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help     Show this help message"
    echo "  -c, --clean    Clean build artifacts before building"
    echo "  -p, --pack     Pack only (no compression)"
    echo "  -v, --verbose  Verbose output"
    echo "  --skip-deps    Skip dependency installation"
    echo ""
    echo "Examples:"
    echo "  $0 linux                    # Build for Linux"
    echo "  $0 --clean windows          # Clean and build for Windows"
    echo "  $0 -v all                   # Build for all platforms with verbose output"
}

# Default values
PLATFORM=""
CLEAN=false
PACK_ONLY=false
VERBOSE=false
SKIP_DEPS=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -p|--pack)
            PACK_ONLY=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        linux|windows|macos|all)
            PLATFORM=$1
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# If no platform specified, default to current platform
if [ -z "$PLATFORM" ]; then
    case "$(uname -s)" in
        Linux*)     PLATFORM=linux;;
        Darwin*)    PLATFORM=macos;;
        CYGWIN*|MINGW32*|MSYS*|MINGW*) PLATFORM=windows;;
        *)          PLATFORM=linux;;
    esac
    print_info "No platform specified, defaulting to: $PLATFORM"
fi

# Check dependencies
print_info "Checking dependencies..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_success "Dependencies check passed"

# Clean if requested
if [ "$CLEAN" = true ]; then
    print_info "Cleaning build artifacts..."
    rm -rf dist build node_modules/.cache
    print_success "Clean completed"
fi

# Install dependencies
if [ "$SKIP_DEPS" = false ]; then
    print_info "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
fi

# Generate icons if they don't exist
if [ ! -f "assets/icons/icon.png" ]; then
    print_info "Generating application icons..."
    if [ -f "generate-icons.sh" ]; then
        ./generate-icons.sh
        print_success "Icons generated"
    else
        print_warning "Icon generation script not found, skipping..."
    fi
fi

# Build web assets
print_info "Building web assets..."
if [ "$VERBOSE" = true ]; then
    npm run build
else
    npm run build > /dev/null 2>&1
fi
print_success "Web assets built"

# Build electron app
print_info "Building Electron application for $PLATFORM..."

if [ "$PACK_ONLY" = true ]; then
    COMMAND="npm run pack"
elif [ "$PLATFORM" = "linux" ]; then
    COMMAND="npm run dist:linux"
elif [ "$PLATFORM" = "windows" ]; then
    COMMAND="npm run dist:win"
elif [ "$PLATFORM" = "macos" ]; then
    COMMAND="npm run dist:mac"
elif [ "$PLATFORM" = "all" ]; then
    COMMAND="npm run dist:all"
else
    print_error "Unknown platform: $PLATFORM"
    exit 1
fi

print_info "Executing: $COMMAND"

if [ "$VERBOSE" = true ]; then
    $COMMAND
else
    $COMMAND > /dev/null 2>&1
fi

print_success "Build completed successfully!"

# Show build results
if [ -d "dist" ]; then
    print_info "Build artifacts:"
    ls -la dist/ | grep -E '\.(AppImage|deb|rpm|exe|dmg|zip|tar\.gz)$' || print_warning "No distributable files found"
fi

print_success "Build process finished!"
