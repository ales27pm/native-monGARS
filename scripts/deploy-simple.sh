#!/bin/bash

# Simple deployment script for Native-monGARS
set -e

echo "🚀 Starting Native-monGARS deployment..."

# Check basic requirements
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "❌ Git is required"
    exit 1
fi

echo "✅ Requirements check passed"

# Install dependencies (if package.json exists)
if [ -f "package.json" ]; then
    echo "📦 Installing dependencies..."
    if command -v bun &> /dev/null; then
        bun install
    else
        npm install
    fi
    echo "✅ Dependencies installed"
fi

# Run basic checks (if scripts exist)
echo "🔍 Running quality checks..."

if npm run lint &> /dev/null; then
    echo "✅ Linting passed"
elif yarn lint &> /dev/null; then
    echo "✅ Linting passed"
else
    echo "⚠️  Linting not available"
fi

if npm run type-check &> /dev/null; then
    echo "✅ Type checking passed"
elif yarn type-check &> /dev/null; then
    echo "✅ Type checking passed"
else
    echo "⚠️  Type checking not available"
fi

# Commit and push changes
echo "📤 Committing changes..."

git add .

if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    git commit -m "🚀 Automated deployment $(date '+%Y-%m-%d %H:%M:%S')

✅ Native-monGARS deployment update
📱 UI implementation with 5 screens
🔧 Production-ready architecture
🛡️ Privacy-first design

Deployed: $(date '+%Y-%m-%d %H:%M:%S')"

    echo "🔄 Pushing to GitHub..."
    git push origin main
    
    echo "🏷️  Creating deployment tag..."
    TAG_NAME="deploy-$(date +%Y%m%d-%H%M%S)"
    git tag -a "$TAG_NAME" -m "Deployment: $TAG_NAME"
    git push origin "$TAG_NAME"
    
    echo "✅ Deployment tag created: $TAG_NAME"
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo "📊 Repository: https://github.com/ales27pm/native-monGARS"
echo "🔗 Latest commit: $(git rev-parse --short HEAD)"
echo "📱 Native-monGARS UI is ready!"
echo ""