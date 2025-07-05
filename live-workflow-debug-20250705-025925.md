# Live Workflow Debug Report

**Generated**: Sat Jul  5 02:59:25 UTC 2025
**Repository**: ales27pm/native-monGARS
**Commit**: c6217177e69d2b90e95f50eadd05e9c087495214
**Branch**: main

## Workflow Status Check

### Main Workflow
[0;34m[INFO][0m Checking workflow: Main Build & Deploy
[0;32m[SUCCESS][0m   ✅ Workflow file exists: .github/workflows/build-and-deploy.yml
[0;32m[SUCCESS][0m   ✅ Workflow syntax appears valid
[0;32m[SUCCESS][0m   ✅ Bun setup configured
✅ PASSED

### TurboModules Workflow
[0;34m[INFO][0m Checking workflow: TurboModules Build
[0;32m[SUCCESS][0m   ✅ Workflow file exists: .github/workflows/turbomodules-build.yml
[0;32m[SUCCESS][0m   ✅ Workflow syntax appears valid
[0;32m[SUCCESS][0m   ✅ Bun setup configured
✅ PASSED

## Local Simulation Results

### Dependency Installation
✅ PASSED

### TypeScript Compilation
✅ PASSED

### Expo Prebuild Test
❌ FAILED

## Environment Information

### System
- **OS**: Linux
- **Node Version**: v21.7.3
- **Bun Version**: 1.2.18

### Project
- **Package Manager**: Bun
- **Expo Version**: 0.24.13
- **TypeScript Version**: Version 5.8.3

## Recent Commits
```
c621717 Trigger workflows: comprehensive testing and monitoring
1c69e10 Perfect! I have successfully completed the workflow debugging and monitoring implementation. Here's a summary of what I accomplished:
fb628dc Complete workflow debugging and monitoring implementation
91f2beb Fix GitHub Actions workflows: remove npm cache, update for Expo managed workflow, add EAS configuration
b5d2fdc ## 🎉 **MISSION ACCOMPLISHED!**
```

## Workflow Files Content

### Main Workflow (lines 1-50)
```yaml
name: Build and Deploy monGARS

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      deploy_to:
        description: 'Deploy target'
        required: true
        default: 'development'
        type: choice
        options:
        - development
        - staging
        - production

env:
  NODE_VERSION: '20'
  BUN_VERSION: 'latest'
  EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
  APPLE_ID: ${{ secrets.APPLE_ID }}
  APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
  APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}

jobs:
  # Lint and Test Job
  lint-and-test:
    name: Lint and Test
    runs-on: ubuntu-latest
    
    steps:
      - name: 🏗 Setup repo
        uses: actions/checkout@v4
        
      - name: 🏗 Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: 🏗 Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ env.BUN_VERSION }}
          
      - name: 📦 Install dependencies
        run: bun install
        
```

### TurboModules Workflow (lines 1-50)
```yaml
name: TurboModules Build and Test

on:
  push:
    paths:
      - 'turbo-modules/**'
      - 'src/services/TurboModuleRegistry.ts'
      - 'app.json'
      - 'Podfile.properties.json'
  pull_request:
    paths:
      - 'turbo-modules/**'
      - 'src/services/TurboModuleRegistry.ts'
  workflow_dispatch:

env:
  NODE_VERSION: '20'
  BUN_VERSION: 'latest'

jobs:
  # Validate TurboModules
  validate-turbomodules:
    name: Validate TurboModules
    runs-on: ubuntu-latest
    
    steps:
      - name: 🏗 Setup repo
        uses: actions/checkout@v4
        
      - name: 🏗 Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: 🏗 Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ env.BUN_VERSION }}
          
      - name: 📦 Install dependencies
        run: bun install
        
      - name: 🔍 Validate TypeScript interfaces
        run: |
          echo "Validating TurboModule TypeScript interfaces..."
          npx tsc --noEmit turbo-modules/src/*.ts
          
      - name: 🔍 Check Swift syntax
        run: |
          echo "Checking Swift files syntax..."
```

## Recommendations

1. **Check Actions Dashboard**: Visit https://github.com/ales27pm/native-monGARS/actions
2. **Review Workflow Logs**: Check individual workflow run logs for detailed errors
3. **Local Testing**: Run the simulation commands locally
4. **Configuration Review**: Verify all workflow configurations are correct

## Next Steps

✅ Project uses Bun - configurations should be compatible
✅ No npm cache configuration found
✅ EAS configuration available

---

**Debug report completed at Sat Jul  5 02:59:31 UTC 2025**
