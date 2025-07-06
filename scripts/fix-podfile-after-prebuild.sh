#!/bin/bash

# This script applies our critical Podfile fixes after expo prebuild
# which may have overwritten our custom configuration

PODFILE_PATH="ios/Podfile"

echo "🔧 Applying post-prebuild Podfile fixes..."

# Check if the test target exists and fix inheritance
if grep -q "target 'monGARSTests'" "$PODFILE_PATH"; then
    echo "✅ Found monGARSTests target"
    
    # Ensure we're using :complete inheritance instead of :search_paths
    if grep -q "inherit! :search_paths" "$PODFILE_PATH"; then
        echo "🔧 Fixing test target inheritance: :search_paths → :complete"
        sed -i.bak 's/inherit! :search_paths/inherit! :complete/' "$PODFILE_PATH"
    fi
    
    # Add our comment if it doesn't exist
    if ! grep -q "Test target inherits ALL build settings" "$PODFILE_PATH"; then
        echo "📝 Adding documentation comments"
        sed -i.bak '/inherit! :complete/a\
    # Test target inherits ALL build settings from main app target\
    # This ensures framework search paths and all React Native/Core ML settings are properly inherited\
    # Required to resolve linker errors: ld: framework CoreML not found, ld: framework FBLazyVector not found' "$PODFILE_PATH"
    fi
else
    echo "⚠️  monGARSTests target not found in Podfile"
fi

# Ensure iOS platform version is set correctly for Core ML
if ! grep -q "platform :ios, '15.0'" "$PODFILE_PATH"; then
    echo "🔧 Setting iOS platform version to 15.0 for Core ML compatibility"
    sed -i.bak "s/platform :ios, .*/platform :ios, '15.0'/" "$PODFILE_PATH"
fi

# Add Core ML build settings if they don't exist
if ! grep -q "ENABLE_COREML_FRAMEWORK" "$PODFILE_PATH"; then
    echo "🔧 Adding Core ML build settings"
    
    # Find the post_install block and add our settings
    sed -i.bak '/post_install do |installer|/a\
    # Fix for Core ML compilation and Xcode 15+\
    installer.pods_project.targets.each do |target|\
      target.build_configurations.each do |config|\
        config.build_settings['"'"'IPHONEOS_DEPLOYMENT_TARGET'"'"'] = '"'"'15.0'"'"'\
        config.build_settings['"'"'ENABLE_COREML_FRAMEWORK'"'"'] = '"'"'YES'"'"'\
        config.build_settings['"'"'OTHER_CFLAGS'"'"'] = '"'"'$(inherited) -DCORE_ML_ENABLED'"'"'\
        \
        if config.name == '"'"'Release'"'"'\
          config.build_settings['"'"'GCC_OPTIMIZATION_LEVEL'"'"'] = '"'"'3'"'"'\
          config.build_settings['"'"'SWIFT_OPTIMIZATION_LEVEL'"'"'] = '"'"'-O'"'"'\
        end\
        \
        config.build_settings['"'"'DEVELOPMENT_TEAM'"'"'] = '"'"''"'"'\
        config.build_settings['"'"'CODE_SIGNING_REQUIRED'"'"'] = '"'"'NO'"'"'\
        config.build_settings['"'"'CODE_SIGNING_ALLOWED'"'"'] = '"'"'NO'"'"'\
        \
        if ENV['"'"'RCT_NEW_ARCH_ENABLED'"'"'] == '"'"'1'"'"'\
          config.build_settings['"'"'OTHER_CPLUSPLUSFLAGS'"'"'] = '"'"'$(inherited) -DRCT_NEW_ARCH_ENABLED'"'"'\
          config.build_settings['"'"'OTHER_CFLAGS'"'"'] = '"'"'$(inherited) -DRCT_NEW_ARCH_ENABLED'"'"'\
        end\
      end\
    end' "$PODFILE_PATH"
fi

echo "✅ Podfile fixes applied successfully"

# Clean up backup files
rm -f "$PODFILE_PATH.bak"

echo "📋 Current Podfile test target configuration:"
grep -A 10 "target 'monGARSTests'" "$PODFILE_PATH" || echo "❌ Test target not found"