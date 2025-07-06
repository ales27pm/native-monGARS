#!/bin/bash

# Debug script to help identify iOS build issues locally
# This script mimics what the CI does to help reproduce issues

set -e

echo "🔍 iOS Build Debugging Script"
echo "============================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

echo "📱 Environment Information:"
echo "- Node version: $(node --version)"
echo "- Bun version: $(bun --version)"
echo "- Platform: $(uname -s)"

# Check if iOS directory exists
if [ ! -d "ios" ]; then
    echo "⚠️  iOS directory doesn't exist. Running prebuild..."
    bunx expo prebuild --platform ios --clear
else
    echo "✅ iOS directory exists"
fi

# Check Podfile
echo ""
echo "📋 Podfile Analysis:"
if [ -f "ios/Podfile" ]; then
    echo "✅ Podfile exists"
    
    # Check for test target
    if grep -q "target 'monGARSTests'" ios/Podfile; then
        echo "✅ monGARSTests target found"
        
        # Check inheritance mode
        if grep -q "inherit! :complete" ios/Podfile; then
            echo "✅ Test target uses :complete inheritance"
        elif grep -q "inherit! :search_paths" ios/Podfile; then
            echo "⚠️  Test target uses :search_paths inheritance (should be :complete)"
        else
            echo "❌ Test target inheritance mode not found"
        fi
    else
        echo "❌ monGARSTests target not found"
    fi
    
    # Check iOS platform version
    if grep -q "platform :ios, '15.0'" ios/Podfile; then
        echo "✅ iOS platform set to 15.0"
    else
        echo "⚠️  iOS platform not set to 15.0"
        grep "platform :ios" ios/Podfile || echo "❌ iOS platform not found"
    fi
else
    echo "❌ Podfile not found"
fi

# Check for LocalLLMModule
echo ""
echo "🧱 Native Module Check:"
if [ -f "ios/monGARS/LocalLLMModule/LocalLLMModule.swift" ]; then
    echo "✅ LocalLLMModule.swift exists"
else
    echo "❌ LocalLLMModule.swift not found"
fi

if [ -f "ios/monGARS/LocalLLMModule/LocalLLMModule.m" ]; then
    echo "✅ LocalLLMModule.m exists"
else
    echo "❌ LocalLLMModule.m not found"
fi

# Check for test file
if [ -f "ios/monGARSTests/LocalLLMModuleTests.swift" ]; then
    echo "✅ LocalLLMModuleTests.swift exists"
else
    echo "❌ LocalLLMModuleTests.swift not found"
fi

# Try to install pods
echo ""
echo "📦 Pod Installation:"
if command -v pod >/dev/null 2>&1; then
    echo "✅ CocoaPods available"
    cd ios
    echo "Running pod install..."
    if pod install; then
        echo "✅ Pod install successful"
        
        # Check if workspace was created
        if [ -f "monGARS.xcworkspace" ]; then
            echo "✅ Xcode workspace created"
        else
            echo "❌ Xcode workspace not created"
        fi
    else
        echo "❌ Pod install failed"
    fi
    cd ..
else
    echo "❌ CocoaPods not available"
fi

# Check for common iOS build tools
echo ""
echo "🛠️  Build Tools:"
if command -v xcodebuild >/dev/null 2>&1; then
    echo "✅ xcodebuild available"
    echo "Xcode version: $(xcodebuild -version | head -1)"
else
    echo "❌ xcodebuild not available"
fi

if command -v xcpretty >/dev/null 2>&1; then
    echo "✅ xcpretty available"
else
    echo "⚠️  xcpretty not available (gem install xcpretty)"
fi

# List available simulators
echo ""
echo "📱 Available iOS Simulators:"
if command -v xcrun >/dev/null 2>&1; then
    xcrun simctl list devices ios | grep -E "(iPhone|iPad)" | head -10
else
    echo "❌ xcrun not available"
fi

echo ""
echo "🎯 Debugging Summary Complete!"
echo "Check the output above for any ❌ or ⚠️  issues that need to be resolved."