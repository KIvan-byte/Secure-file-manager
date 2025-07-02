#!/bin/bash

# Local build and testing script for Secure File Manager
# Usage: ./local-build.sh [linux|windows|mac|all]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Message output functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check system dependencies
check_dependencies() {
    log_info "Checking system dependencies..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed!"
        echo "Please install Node.js 16+ from https://nodejs.org/"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed!"
        echo "npm should come with Node.js. Please reinstall Node.js."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        log_error "Node.js version 16 or higher is required!"
        echo "Current version: $(node --version)"
        echo "Please upgrade Node.js from https://nodejs.org/"
        exit 1
    fi
    
    log_success "All system dependencies are satisfied"
    log_info "Node.js version: $(node --version)"
    log_info "npm version: $(npm --version)"
}

# Clean previous builds
clean_build() {
    log_info "Cleaning previous builds..."
    
    # Remove build directories
    [ -d "dist" ] && rm -rf dist
    [ -d "build" ] && rm -rf build
    
    # Clean npm and electron caches
    npm run clean:cache 2>/dev/null || true
    
    log_success "Build cleanup completed"
}

# Install project dependencies
install_dependencies() {
    log_info "Installing project dependencies..."
    
    if npm ci --unsafe-perm --prefer-offline --no-audit; then
        log_success "Dependencies installed successfully"
    else
        log_error "Failed to install dependencies"
        exit 1
    fi
}

# Build the web application
build_web() {
    log_info "Building web application..."
    
    if npm run build; then
        log_success "Web application built successfully"
    else
        log_error "Web application build failed"
        exit 1
    fi
}

# Build for Linux platform
build_linux() {
    log_info "Building for Linux platform..."
    
    if command -v docker &> /dev/null; then
        log_info "Using Docker for consistent Linux build environment..."
        
        # Build Docker image
        if docker build -t secure-file-manager-builder:latest .; then
            log_success "Docker build environment created"
        else
            log_error "Failed to build Docker image"
            exit 1
        fi
        
        # Run build in Docker container
        if docker run --rm -v "$(pwd)":/workspace -w /workspace secure-file-manager-builder:latest npm run dist:linux; then
            log_success "Linux build completed successfully"
        else
            log_error "Linux build failed in Docker"
            exit 1
        fi
    else
        log_warning "Docker not found, building in current environment..."
        log_warning "Results may vary depending on your system configuration"
        
        if npm run dist:linux; then
            log_success "Linux build completed"
        else
            log_error "Linux build failed"
            exit 1
        fi
    fi
}

# Build for Windows platform
build_windows() {
    log_info "Building for Windows platform..."
    
    if [[ "$OSTYPE" != "msys"* ]] && [[ "$OSTYPE" != "cygwin"* ]] && [[ "$OSTYPE" != "win32"* ]]; then
        log_warning "Building Windows packages on non-Windows system"
        log_warning "Some features may not work correctly (e.g., code signing)"
    fi
    
    if npm run dist:win; then
        log_success "Windows build completed successfully"
    else
        log_error "Windows build failed"
        exit 1
    fi
}

# Build for macOS platform
build_mac() {
    log_info "Building for macOS platform..."
    
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log_warning "macOS builds are only supported on macOS systems"
        log_info "Skipping macOS build..."
        return 0
    fi
    
    if npm run dist:mac; then
        log_success "macOS build completed successfully"
    else
        log_error "macOS build failed"
        exit 1
    fi
}

# Display build results
show_results() {
    log_info "Build Results Summary:"
    echo
    
    if [ -d "dist" ]; then
        echo "📦 Generated Packages:"
        find dist -type f \( -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" -o -name "*.exe" -o -name "*.dmg" -o -name "*.zip" -o -name "*.tar.gz" \) | while read file; do
            size=$(du -h "$file" | cut -f1)
            filename=$(basename "$file")
            echo "  • $filename ($size)"
        done
        
        echo
        total_size=$(du -sh dist 2>/dev/null | cut -f1)
        echo "📊 Total build size: $total_size"
    else
        log_warning "No dist directory found - build may have failed"
    fi
    
    echo
}

# Display help information
show_help() {
    echo "Secure File Manager - Local Build Script"
    echo
    echo "Usage: $0 [TARGET]"
    echo
    echo "Available targets:"
    echo "  linux    - Build Linux packages (AppImage, DEB, RPM)"
    echo "  windows  - Build Windows packages (NSIS, Portable)"
    echo "  mac      - Build macOS packages (DMG) - macOS only"
    echo "  all      - Build for all supported platforms"
    echo "  help     - Show this help message"
    echo
    echo "Examples:"
    echo "  $0 linux         # Build only Linux packages"
    echo "  $0 windows       # Build only Windows packages"
    echo "  $0 all           # Build for all platforms"
    echo
    echo "Requirements:"
    echo "  - Node.js 16+"
    echo "  - npm"
    echo "  - Docker (recommended for Linux builds)"
    echo
}

# Main execution logic
main() {
    local target="${1:-all}"
    
    case $target in
        "help"|"-h"|"--help")
            show_help
            exit 0
            ;;
    esac
    
    echo "🚀 Secure File Manager - Local Build"
    echo "Target: $target"
    echo "Time: $(date)"
    echo "Platform: $OSTYPE"
    echo
    
    # Pre-build checks and preparation
    check_dependencies
    clean_build
    install_dependencies
    build_web
    
    # Platform-specific builds
    case $target in
        "linux")
            build_linux
            ;;
        "windows"|"win")
            build_windows
            ;;
        "mac"|"macos")
            build_mac
            ;;
        "all")
            log_info "Building for all supported platforms..."
            build_linux
            build_windows
            build_mac
            ;;
        *)
            log_error "Unknown target: $target"
            echo
            show_help
            exit 1
            ;;
    esac
    
    # Show results and finish
    show_results
    log_success "Build process completed successfully! 🎉"
    
    echo
    echo "Next steps:"
    echo "  • Test the generated packages on target platforms"
    echo "  • Upload to distribution channels"
    echo "  • Create release notes and documentation"
}

# Run main function with all arguments
main "$@"
