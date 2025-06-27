#!/bin/bash

# React Native Device Info Turbo Module - GitHub Deployment Script
# This script deploys the turbo module to your personal GitHub account

set -e  # Exit on any error

echo "🚀 React Native Device Info Turbo Module - GitHub Deployment"
echo "============================================================="

# Check if specialenv/.env exists (as requested)
SPECIALENV_PATH="/home/user/workspace/specialenv/.env"
WORKSPACE_ENV_PATH="/home/user/workspace/.env"

if [ -f "$SPECIALENV_PATH" ]; then
    echo "📁 Loading credentials from specialenv/.env..."
    source "$SPECIALENV_PATH"
    ENV_SOURCE="specialenv/.env"
elif [ -f "$WORKSPACE_ENV_PATH" ]; then
    echo "📁 Loading credentials from workspace .env..."
    source "$WORKSPACE_ENV_PATH"
    ENV_SOURCE="workspace .env"
else
    echo "❌ No .env file found in expected locations:"
    echo "   - $SPECIALENV_PATH"
    echo "   - $WORKSPACE_ENV_PATH"
    echo ""
    echo "Please create one of these files with your GitHub credentials:"
    echo ""
    echo "GITHUB_USERNAME=your_username"
    echo "GITHUB_TOKEN=your_personal_access_token"
    echo "GITHUB_REPOSITORY=react-native-device-info-turbo-advanced"
    exit 1
fi

echo "✅ Environment loaded from: $ENV_SOURCE"

# Set default repository name if not provided
GITHUB_REPOSITORY=${GITHUB_REPOSITORY:-"react-native-device-info-turbo-advanced"}

# Check required variables
if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ GITHUB_USERNAME not found in environment file"
    echo "Please add: GITHUB_USERNAME=your_username"
    exit 1
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN not found in environment file"
    echo "Please add: GITHUB_TOKEN=your_personal_access_token"
    echo "Get a token from: https://github.com/settings/tokens"
    exit 1
fi

echo ""
echo "📋 Deployment Configuration:"
echo "  Username: $GITHUB_USERNAME"
echo "  Repository: $GITHUB_REPOSITORY"
echo "  Token: ${GITHUB_TOKEN:0:8}..."

# Navigate to turbo module directory
TURBO_MODULE_PATH="/home/user/workspace/react-native-device-info-turbo-advanced"

if [ ! -d "$TURBO_MODULE_PATH" ]; then
    echo "❌ Turbo module directory not found: $TURBO_MODULE_PATH"
    exit 1
fi

cd "$TURBO_MODULE_PATH"
echo "📁 Working in: $TURBO_MODULE_PATH"

# Test GitHub authentication
echo ""
echo "🔐 Testing GitHub authentication..."
AUTH_TEST=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)

if echo "$AUTH_TEST" | grep -q "Bad credentials"; then
    echo "❌ GitHub token authentication failed!"
    echo "Please check your token at: https://github.com/settings/tokens"
    echo "Make sure the token has 'repo' scope enabled."
    exit 1
else
    echo "✅ GitHub authentication successful!"
    USER_LOGIN=$(echo "$AUTH_TEST" | grep -o '"login":"[^"]*"' | cut -d'"' -f4)
    echo "  Authenticated as: $USER_LOGIN"
    
    # Update GITHUB_USERNAME if it differs from token owner
    if [ "$USER_LOGIN" != "$GITHUB_USERNAME" ]; then
        echo "ℹ️  Updating username from token: $USER_LOGIN"
        GITHUB_USERNAME="$USER_LOGIN"
    fi
fi

# Update package.json with correct repository URLs
echo ""
echo "📝 Updating package.json repository URLs..."
if [ -f "package.json" ]; then
    # Create temporary file with updated URLs
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.repository.url = 'git+https://github.com/$GITHUB_USERNAME/$GITHUB_REPOSITORY.git';
    pkg.bugs.url = 'https://github.com/$GITHUB_USERNAME/$GITHUB_REPOSITORY/issues';
    pkg.homepage = 'https://github.com/$GITHUB_USERNAME/$GITHUB_REPOSITORY#readme';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    echo "✅ Package.json URLs updated"
else
    echo "⚠️ package.json not found"
fi

# Create GitHub repository
echo ""
echo "📦 Creating GitHub repository..."
REPO_RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\":\"$GITHUB_REPOSITORY\",
        \"description\":\"Advanced device information Turbo Module for React Native with comprehensive iOS integration, biometric authentication, location services, and system integrations\",
        \"private\":false,
        \"has_issues\":true,
        \"has_projects\":true,
        \"has_wiki\":true,
        \"auto_init\":false
    }" \
    https://api.github.com/user/repos)

if echo "$REPO_RESPONSE" | grep -q "already exists"; then
    echo "📝 Repository already exists - continuing with push..."
elif echo "$REPO_RESPONSE" | grep -q "Bad credentials"; then
    echo "❌ Failed to create repository - bad credentials"
    exit 1
elif echo "$REPO_RESPONSE" | grep -q "created_at"; then
    echo "✅ Repository created successfully!"
else
    echo "⚠️ Repository creation response:"
    echo "$REPO_RESPONSE" | head -3
    echo "Continuing with deployment..."
fi

# Set up Git configuration
echo ""
echo "🔧 Configuring Git..."
git config user.name "$GITHUB_USERNAME" 2>/dev/null || true
git config user.email "$GITHUB_USERNAME@users.noreply.github.com" 2>/dev/null || true

# Add GitHub remote (remove if exists)
echo "🔗 Setting up Git remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$GITHUB_REPOSITORY.git"

# Ensure we're on main branch
git checkout main 2>/dev/null || git checkout -b main

# Stage any new changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Staging updated files..."
    git add .
    git commit -m "📦 Update package.json repository URLs for GitHub deployment" || true
fi

# Push to GitHub
echo ""
echo "📤 Pushing turbo module to GitHub..."
echo "  Repository: https://github.com/$GITHUB_USERNAME/$GITHUB_REPOSITORY"
echo "  Branch: main"

git push -u origin main --force

echo ""
echo "🎉 SUCCESS! React Native Device Info Turbo Module deployed to GitHub!"
echo "======================================================================="
echo ""
echo "🌐 Repository URL: https://github.com/$GITHUB_USERNAME/$GITHUB_REPOSITORY"
echo "📦 Package Name: react-native-device-info-turbo-advanced"
echo "🏷️ Version: 1.0.0"
echo ""
echo "✨ Turbo Module Features Deployed:"
echo "  ✅ React Native New Architecture support"
echo "  ✅ JSI direct communication"
echo "  ✅ Swift native iOS implementation"
echo "  ✅ Biometric authentication (Face ID/Touch ID)"
echo "  ✅ Location services with GPS"
echo "  ✅ Device information access"
echo "  ✅ Battery and storage monitoring"
echo "  ✅ Haptic feedback patterns"
echo "  ✅ System integration services"
echo "  ✅ TypeScript definitions"
echo "  ✅ CocoaPods integration"
echo "  ✅ GitHub Actions CI/CD"
echo ""
echo "🚀 Ready for NPM Publishing:"
echo "  1. cd react-native-device-info-turbo-advanced"
echo "  2. npm login"
echo "  3. npm publish"
echo ""
echo "📱 Ready for Integration:"
echo "  npm install $GITHUB_USERNAME/react-native-device-info-turbo-advanced"
echo ""
echo "🎯 Turbo Module Deployment Completed Successfully! 🚀"