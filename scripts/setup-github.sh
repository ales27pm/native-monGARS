#!/bin/bash

# GitHub Setup Script for monGARS
# This script helps you push your project to your personal GitHub account

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${BLUE}🚀 monGARS GitHub Setup Script${NC}"
echo "=================================="
echo

# Check if we're in the correct directory
if [[ ! -f "package.json" ]] || [[ ! -f "README.md" ]]; then
    log_error "This script must be run from the monGARS project root directory"
    exit 1
fi

# Get GitHub username
echo -e "${YELLOW}Please enter your GitHub username:${NC}"
read -p "GitHub Username: " GITHUB_USERNAME

if [[ -z "$GITHUB_USERNAME" ]]; then
    log_error "GitHub username is required"
    exit 1
fi

# Get repository name (default to mongars)
echo -e "${YELLOW}Please enter your repository name (default: mongars):${NC}"
read -p "Repository Name: " REPO_NAME
REPO_NAME=${REPO_NAME:-mongars}

# Construct GitHub URL
GITHUB_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

log_info "GitHub Repository: $GITHUB_URL"
echo

# Check if GitHub remote already exists
if git remote get-url github >/dev/null 2>&1; then
    log_warning "GitHub remote already exists. Updating URL..."
    git remote set-url github "$GITHUB_URL"
else
    log_info "Adding GitHub remote..."
    git remote add github "$GITHUB_URL"
fi

# Show current remotes
log_info "Current remotes:"
git remote -v
echo

# Ask for confirmation
echo -e "${YELLOW}Ready to push to GitHub? This will:${NC}"
echo "1. Push all branches to your GitHub repository"
echo "2. Push all tags and version history"
echo "3. Set GitHub as an additional remote"
echo
read -p "Continue? (y/N): " CONFIRM

if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    log_info "Operation cancelled"
    exit 0
fi

# Push to GitHub
log_info "Pushing to GitHub repository..."

# Push main branch
log_info "Pushing main branch..."
if git push github main; then
    log_success "Main branch pushed successfully"
else
    log_error "Failed to push main branch"
    log_info "Make sure you've created the repository on GitHub first:"
    log_info "https://github.com/new"
    exit 1
fi

# Push tags if any exist
if git tag -l | grep -q .; then
    log_info "Pushing tags..."
    git push github --tags
    log_success "Tags pushed successfully"
fi

# Create and push release tag for current version
CURRENT_VERSION=$(grep '"version"' package.json | sed 's/.*"version": "\(.*\)".*/\1/')
if [[ -n "$CURRENT_VERSION" ]]; then
    if ! git tag -l | grep -q "v$CURRENT_VERSION"; then
        log_info "Creating release tag v$CURRENT_VERSION..."
        git tag -a "v$CURRENT_VERSION" -m "Release v$CURRENT_VERSION - Core ML Implementation"
        git push github "v$CURRENT_VERSION"
        log_success "Release tag created and pushed"
    fi
fi

echo
log_success "🎉 Successfully pushed to GitHub!"
echo "=================================="
echo -e "${GREEN}Your repository is now available at:${NC}"
echo -e "${BLUE}https://github.com/${GITHUB_USERNAME}/${REPO_NAME}${NC}"
echo
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Visit your GitHub repository"
echo "2. Add a description and topics"
echo "3. Configure repository settings"
echo "4. Enable Issues and Discussions"
echo "5. Create your first release"
echo
echo -e "${BLUE}Repository features:${NC}"
echo "✅ Comprehensive README.md"
echo "✅ Complete documentation"
echo "✅ GitHub Actions workflows"
echo "✅ Contributing guidelines"
echo "✅ MIT License"
echo "✅ Core ML implementation"
echo
echo -e "${GREEN}Your privacy-first AI project is now open source! 🚀${NC}"