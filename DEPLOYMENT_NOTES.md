# Core ML Native Service Transition

## Changes Made
- Transitioned core-ml-service.ts from dev-llm-service to native-llm-service
- Enhanced GitHub Actions workflow for production-ready CI/CD
- Enabled true on-device AI processing with Core ML

Date: 2025-07-06T18:05:41.235Z

# Workflow CI Fixes

## Changes Made
- Corrected iOS Simulator destination in `core-ml-build.yml` from `OS:latest` to `OS:17.5`.
- Added `jest-junit` dependency for test reporting.
- Improved Pod install step with `pod repo update`.
- **CRITICAL FIX**: Removed invalid system framework declarations from `Podfile`.
  - Removed: `pod 'CoreML'`, `pod 'NaturalLanguage'`, `pod 'os.log'`, `pod 'Compression'`
  - These are iOS SDK frameworks that should be automatically linked by Xcode, not managed by CocoaPods

## Impact
- Resolves the primary blockers in the CI pipeline, allowing iOS native builds and tests to run.
- Fixes compilation errors: "no such module 'Combine'", "no such module 'CoreML'", "no such module 'monGARS'"
- Ensures stable and repeatable builds in the GitHub Actions environment.
- Enables proper linking of system frameworks for Core ML functionality.

Date: 2025-07-06T18:40:00.000Z

# iOS Test Target Linker Fix

## Changes Made
- Added `pod 'monGARS', :path => '.'` to the `monGARSTests` target in the `Podfile`.

## Impact
- This resolves the `no such module 'monGARS'` error during the native test phase of the CI pipeline.
- Ensures the test suite can correctly import and test the main application's native modules.

Date: 2025-07-06T18:50:00.000Z

# iOS Test Target Linker Fix 2

## Changes Made
- Refactored Podfile to use a shared_pods function.
- Changed test target inheritance from `:complete` to `:search_paths`.
- Explicitly applied React Native pod configurations to both main app and test targets.

## Impact
- This resolves the native linker errors (Undefined symbols for architecture arm64) by ensuring both the main app target and the test target are configured with the same React Native dependencies.
- Fixes RCTEventEmitter and other React Native symbol resolution issues.

Date: 2025-07-06T18:55:00.000Z
