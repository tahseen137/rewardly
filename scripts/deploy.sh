#!/bin/bash

# Rewardly Deployment Script
# This script helps automate the deployment process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local all_good=true
    
    if command_exists node; then
        print_success "Node.js is installed ($(node --version))"
    else
        print_error "Node.js is not installed"
        all_good=false
    fi
    
    if command_exists npm; then
        print_success "npm is installed ($(npm --version))"
    else
        print_error "npm is not installed"
        all_good=false
    fi
    
    if command_exists eas; then
        print_success "EAS CLI is installed ($(eas --version))"
    else
        print_warning "EAS CLI is not installed"
        print_info "Install with: npm install -g eas-cli"
        all_good=false
    fi
    
    if [ "$all_good" = false ]; then
        print_error "Please install missing prerequisites"
        exit 1
    fi
}

# Check if logged in to EAS
check_eas_login() {
    print_header "Checking EAS Login"
    
    if eas whoami >/dev/null 2>&1; then
        print_success "Logged in to EAS as $(eas whoami)"
    else
        print_warning "Not logged in to EAS"
        print_info "Running: eas login"
        eas login
    fi
}

# Build function
build_app() {
    local platform=$1
    local profile=$2
    
    print_header "Building for $platform ($profile)"
    
    print_info "This will take 10-20 minutes..."
    eas build --platform "$platform" --profile "$profile" --non-interactive
    
    if [ $? -eq 0 ]; then
        print_success "Build completed successfully!"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Submit function
submit_app() {
    local platform=$1
    
    print_header "Submitting to $platform Store"
    
    eas submit --platform "$platform" --latest --non-interactive
    
    if [ $? -eq 0 ]; then
        print_success "Submission completed successfully!"
    else
        print_error "Submission failed"
        exit 1
    fi
}

# Version bump function
bump_version() {
    print_header "Version Management"
    
    echo "Current version info:"
    grep -A 5 '"version"' app.json | head -6
    
    echo ""
    read -p "Do you want to bump the version? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Select version bump type:"
        echo "1) Patch (1.0.0 -> 1.0.1)"
        echo "2) Minor (1.0.0 -> 1.1.0)"
        echo "3) Major (1.0.0 -> 2.0.0)"
        echo "4) Manual"
        read -p "Enter choice (1-4): " choice
        
        case $choice in
            1|2|3)
                print_warning "Automatic version bumping not implemented yet"
                print_info "Please update version manually in app.json"
                ;;
            4)
                print_info "Please update version manually in app.json"
                ;;
            *)
                print_error "Invalid choice"
                ;;
        esac
    fi
}

# Main menu
show_menu() {
    print_header "Rewardly Deployment Menu"
    
    echo "1) Build iOS (Production)"
    echo "2) Build Android (Production)"
    echo "3) Build Both Platforms (Production)"
    echo "4) Build iOS (Preview/Testing)"
    echo "5) Build Android (Preview/Testing)"
    echo "6) Submit iOS to App Store"
    echo "7) Submit Android to Play Store"
    echo "8) Submit Both Platforms"
    echo "9) Check Build Status"
    echo "10) Bump Version"
    echo "11) Run All (Build + Submit Both)"
    echo "0) Exit"
    echo ""
    read -p "Enter your choice: " choice
    
    case $choice in
        1)
            build_app "ios" "production"
            ;;
        2)
            build_app "android" "production"
            ;;
        3)
            build_app "all" "production"
            ;;
        4)
            build_app "ios" "preview"
            ;;
        5)
            build_app "android" "preview"
            ;;
        6)
            submit_app "ios"
            ;;
        7)
            submit_app "android"
            ;;
        8)
            submit_app "ios"
            submit_app "android"
            ;;
        9)
            print_header "Build Status"
            eas build:list
            ;;
        10)
            bump_version
            ;;
        11)
            bump_version
            build_app "all" "production"
            echo ""
            read -p "Build complete. Submit to stores? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                submit_app "ios"
                submit_app "android"
            fi
            ;;
        0)
            print_info "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            ;;
    esac
}

# Main script
main() {
    clear
    print_header "Rewardly Deployment Tool"
    
    check_prerequisites
    check_eas_login
    
    while true; do
        show_menu
        echo ""
        read -p "Press Enter to continue..."
        clear
    done
}

# Run main function
main
