#!/bin/bash

# Core ML Implementation Monitor & Debug Script
# This script helps monitor the Core ML implementation and debug issues

set -e

echo "🔍 Core ML Implementation Monitor & Debug"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_status $RED "❌ Error: Must be run from project root directory"
    exit 1
fi

print_status $BLUE "📋 1. Environment Check"
echo "----------------------------------------"

# Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status $GREEN "✅ Node.js: $NODE_VERSION"
else
    print_status $RED "❌ Node.js not found"
    exit 1
fi

# npm/bun version
if command -v bun &> /dev/null; then
    BUN_VERSION=$(bun --version)
    print_status $GREEN "✅ Bun: v$BUN_VERSION"
elif command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status $GREEN "✅ npm: v$NPM_VERSION"
else
    print_status $RED "❌ No package manager found"
    exit 1
fi

# Check for iOS development tools
if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v xcodebuild &> /dev/null; then
        XCODE_VERSION=$(xcodebuild -version | head -n 1)
        print_status $GREEN "✅ $XCODE_VERSION"
    else
        print_status $YELLOW "⚠️  Xcode not found (required for iOS build)"
    fi
    
    if [ -d "/Applications/Xcode.app" ]; then
        print_status $GREEN "✅ Xcode.app found"
    else
        print_status $YELLOW "⚠️  Xcode.app not in standard location"
    fi
else
    print_status $YELLOW "⚠️  Not running on macOS (iOS features limited)"
fi

echo ""
print_status $BLUE "📁 2. Project Structure Check"
echo "----------------------------------------"

# Check for key files
declare -a required_files=(
    "ios/LocalLLMModule/LocalLLMModule.swift"
    "ios/LocalLLMModule/LocalLLMModule.m"
    "ios/Podfile"
    "src/api/core-ml-service.ts"
    "src/api/native-llm-service.ts"
    "src/api/local-llm.ts"
    "src/screens/ModelManagerScreen.tsx"
    ".github/workflows/core-ml-build.yml"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status $GREEN "✅ $file"
    else
        print_status $RED "❌ $file (missing)"
    fi
done

echo ""
print_status $BLUE "🧪 3. TypeScript Compilation"
echo "----------------------------------------"

# TypeScript check
if npm run type-check 2>/dev/null; then
    print_status $GREEN "✅ TypeScript compilation successful"
else
    print_status $RED "❌ TypeScript compilation failed"
    echo "Running detailed type check..."
    npm run type-check
fi

echo ""
print_status $BLUE "🔍 4. Linting Check"
echo "----------------------------------------"

# Lint check
if npm run lint 2>/dev/null; then
    print_status $GREEN "✅ Linting passed"
else
    print_status $YELLOW "⚠️  Linting issues found"
    echo "Running detailed lint check..."
    npm run lint || true
fi

echo ""
print_status $BLUE "🧪 5. Test Suite"
echo "----------------------------------------"

# Run tests
if npm test -- --passWithNoTests 2>/dev/null; then
    print_status $GREEN "✅ Test suite passed"
else
    print_status $RED "❌ Test suite failed"
    echo "Running detailed tests..."
    npm test -- --verbose || true
fi

echo ""
print_status $BLUE "📱 6. iOS Dependencies Check"
echo "----------------------------------------"

if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ -f "ios/Podfile" ]; then
        print_status $GREEN "✅ Podfile found"
        
        if [ -d "ios/Pods" ]; then
            print_status $GREEN "✅ Pods directory exists"
        else
            print_status $YELLOW "⚠️  Pods not installed"
            echo "Run: cd ios && pod install"
        fi
        
        if [ -f "ios/Podfile.lock" ]; then
            print_status $GREEN "✅ Podfile.lock exists"
        else
            print_status $YELLOW "⚠️  Podfile.lock missing"
        fi
    else
        print_status $RED "❌ Podfile missing"
    fi
else
    print_status $YELLOW "⚠️  iOS checks skipped (not on macOS)"
fi

echo ""
print_status $BLUE "🔧 7. Development Server Check"
echo "----------------------------------------"

# Check if Metro is running
if lsof -i :8081 &> /dev/null; then
    print_status $GREEN "✅ Metro bundler running on port 8081"
else
    print_status $YELLOW "⚠️  Metro bundler not running"
    echo "To start: npm start"
fi

# Check for common development issues
if [ -d "node_modules" ]; then
    print_status $GREEN "✅ node_modules exists"
else
    print_status $RED "❌ node_modules missing"
    echo "Run: npm install"
fi

echo ""
print_status $BLUE "📊 8. Core ML Service Status"
echo "----------------------------------------"

# Check if Core ML service files are properly formatted
if node -e "
try {
  const service = require('./src/api/core-ml-service.ts');
  console.log('✅ Core ML service imports successfully');
} catch (e) {
  console.log('❌ Core ML service import failed:', e.message);
  process.exit(1);
}
" 2>/dev/null; then
    print_status $GREEN "✅ Core ML service syntax valid"
else
    print_status $RED "❌ Core ML service has syntax issues"
fi

# Check native service
if node -e "
try {
  const service = require('./src/api/native-llm-service.ts');
  console.log('✅ Native LLM service imports successfully');
} catch (e) {
  console.log('❌ Native LLM service import failed:', e.message);
  process.exit(1);
}
" 2>/dev/null; then
    print_status $GREEN "✅ Native LLM service syntax valid"
else
    print_status $RED "❌ Native LLM service has syntax issues"
fi

echo ""
print_status $BLUE "🚀 9. Quick Start Commands"
echo "----------------------------------------"

echo "To start development:"
echo "  npm start                    # Start Metro bundler"
echo "  npm run ios                  # Run on iOS simulator"
echo ""
echo "To test Core ML implementation:"
echo "  npm test                     # Run test suite"
echo "  npm run type-check          # TypeScript validation"
echo "  npm run lint                # Code linting"
echo ""
echo "iOS specific:"
echo "  cd ios && pod install       # Install iOS dependencies"
echo "  npm run build:ios          # Build iOS project"
echo "  npm run test:ios           # Run iOS tests"
echo ""

print_status $BLUE "🔍 10. Debug Information"
echo "----------------------------------------"

echo "Git status:"
git status --porcelain || true
echo ""

echo "Last commit:"
git log --oneline -1 || true
echo ""

echo "Branch:"
git branch --show-current || true
echo ""

if [ -f ".env" ]; then
    print_status $GREEN "✅ .env file exists"
else
    print_status $YELLOW "⚠️  .env file missing (some features may not work)"
fi

echo ""
print_status $GREEN "🎉 Monitor Complete!"
echo "========================================"

# Optional: Start monitoring in watch mode
if [ "$1" == "--watch" ]; then
    print_status $BLUE "👀 Starting watch mode..."
    echo "Monitoring file changes..."
    
    # Simple file watcher
    while true; do
        sleep 5
        clear
        print_status $BLUE "🔄 Auto-refresh $(date)"
        
        # Quick health check
        if npm run type-check &>/dev/null; then
            print_status $GREEN "✅ TypeScript OK"
        else
            print_status $RED "❌ TypeScript issues"
        fi
        
        if [ -f "src/api/core-ml-service.ts" ]; then
            print_status $GREEN "✅ Core ML service OK"
        else
            print_status $RED "❌ Core ML service missing"
        fi
        
        echo "Press Ctrl+C to exit watch mode"
    done
fi