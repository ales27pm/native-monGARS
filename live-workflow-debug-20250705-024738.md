# Live Workflow Debug Report

**Generated**: Sat Jul  5 02:47:38 UTC 2025
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
src/components/ModelDownloadManager.tsx(165,38): error TS18047: 'LocalLLMModule' is possibly 'null'.
src/components/ModelDownloadManager.tsx(171,77): error TS18046: 'error' is of type 'unknown'.
src/screens/SettingsScreen.tsx(13,15): error TS2614: Module '"../state/appStore"' has no exported member 'AIProvider'. Did you mean to use 'import AIProvider from "../state/appStore"' instead?
src/screens/SettingsScreen.tsx(324,15): error TS2820: Type '"brain"' is not assignable to type '"push" | "map" | "filter" | "at" | "search" | "repeat" | "link" | "settings" | "body" | "code" | "menu" | "time" | "ellipse" | "image" | "stop" | "text" | "alert" | "checkbox" | "radio" | ... 1318 more ... | "woman-sharp"'. Did you mean '"ban"'?
src/screens/ToolsScreen.tsx(418,44): error TS2339: Property 'getEvents' does not exist on type 'typeof CalendarService'.
src/screens/ToolsScreen.tsx(427,50): error TS7006: Parameter 'event' implicitly has an 'any' type.
src/screens/ToolsScreen.tsx(451,52): error TS2339: Property 'searchContacts' does not exist on type 'typeof ContactsService'.
src/screens/ToolsScreen.tsx(460,60): error TS7006: Parameter 'contact' implicitly has an 'any' type.
src/screens/ToolsScreen.tsx(513,45): error TS2339: Property 'createEvent' does not exist on type 'typeof CalendarService'.
src/screens/ToolsScreen.tsx(536,45): error TS2339: Property 'createContact' does not exist on type 'typeof ContactsService'.
src/screens/VoiceScreen.tsx(12,8): error TS2613: Module '"/home/user/workspace/src/hooks/useVoice"' has no default export. Did you mean to use 'import { useVoice } from "/home/user/workspace/src/hooks/useVoice"' instead?
src/screens/VoiceScreen.tsx(415,34): error TS7006: Parameter 'recording' implicitly has an 'any' type.
src/services/ContactsService.ts(78,7): error TS2322: Type '{ id: string | undefined; name: string; firstName: string | undefined; lastName: string | undefined; phoneNumbers: { number: string; label: string; id: string; }[]; emails: { email: string; label: string; id: string; }[]; addresses: { ...; }[]; company: string | undefined; jobTitle: string | undefined; imageAvailabl...' is not assignable to type 'ContactInfo[]'.
  Type '{ id: string | undefined; name: string; firstName: string | undefined; lastName: string | undefined; phoneNumbers: { number: string; label: string; id: string; }[]; emails: { email: string; label: string; id: string; }[]; addresses: { ...; }[]; company: string | undefined; jobTitle: string | undefined; imageAvailabl...' is not assignable to type 'ContactInfo'.
    Types of property 'id' are incompatible.
      Type 'string | undefined' is not assignable to type 'string'.
        Type 'undefined' is not assignable to type 'string'.
src/services/ContactsService.ts(166,9): error TS2353: Object literal may only specify known properties, and 'fields' does not exist in type 'FieldType[]'.
src/services/ContactsService.ts(184,9): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/services/ContactsService.ts(226,56): error TS2345: Argument of type '{ name: string; firstName: string | undefined; lastName: string | undefined; phoneNumbers: { number: string; label: string; }[]; emails: { email: string; label: string; }[]; addresses: { street: string | undefined; ... 4 more ...; label: string; }[]; company: string | undefined; jobTitle: string | undefined; }' is not assignable to parameter of type 'Contact'.
  Property 'contactType' is missing in type '{ name: string; firstName: string | undefined; lastName: string | undefined; phoneNumbers: { number: string; label: string; }[]; emails: { email: string; label: string; }[]; addresses: { street: string | undefined; ... 4 more ...; label: string; }[]; company: string | undefined; jobTitle: string | undefined; }' but required in type 'Contact'.
src/services/ContactsService.ts(266,52): error TS2554: Expected 1 arguments, but got 2.
src/services/LocalLLMService.ts(105,50): error TS2345: Argument of type 'LocalLLMSpec' is not assignable to parameter of type 'NativeModule'.
  Type 'LocalLLMSpec' is missing the following properties from type 'NativeModule': addListener, removeListeners
src/services/LocalLLMService.ts(159,7): error TS2304: Cannot find name 'logger'.
src/services/LocalLLMService.ts(184,37): error TS2304: Cannot find name 'LocalLLM'.
src/services/LocalLLMService.ts(193,31): error TS2304: Cannot find name 'LocalLLM'.
src/services/LocalLLMService.ts(281,35): error TS2339: Property 'cancelGeneration' does not exist on type 'LocalLLMSpec'.
src/services/LocalLLMService.ts(333,7): error TS2304: Cannot find name 'logger'.
src/services/LocalLLMService.ts(339,33): error TS2304: Cannot find name 'LocalEmbedding'.
src/services/LocalLLMService.ts(348,13): error TS2304: Cannot find name 'VectorStore'.
src/services/LocalLLMService.ts(349,7): error TS2304: Cannot find name 'logger'.
src/services/LocalLLMService.ts(351,7): error TS2304: Cannot find name 'logger'.
src/services/LocalLLMService.ts(361,36): error TS2304: Cannot find name 'LocalEmbedding'.
src/services/LocalLLMService.ts(362,29): error TS2304: Cannot find name 'VectorStore'.
src/services/LocalLLMService.ts(369,14): error TS7006: Parameter 'result' implicitly has an 'any' type.
src/services/LocalLLMService.ts(372,7): error TS2304: Cannot find name 'logger'.
src/services/LocalLLMService.ts(375,7): error TS2304: Cannot find name 'logger'.
src/services/LocalLLMService.ts(435,9): error TS2304: Cannot find name 'logger'.
src/services/LocalLLMService.ts(437,9): error TS2304: Cannot find name 'logger'.
src/services/LocalLLMService.ts(455,22): error TS2304: Cannot find name 'ReActTools'.
src/services/LocalLLMService.ts(457,22): error TS2304: Cannot find name 'ReActTools'.
src/services/LocalLLMService.ts(469,22): error TS2304: Cannot find name 'ReActTools'.
src/services/LocalLLMService.ts(471,22): error TS2304: Cannot find name 'ReActTools'.
src/services/LocalLLMService.ts(483,22): error TS2304: Cannot find name 'ReActTools'.
src/services/LocalLLMService.ts(485,22): error TS2304: Cannot find name 'ReActTools'.
src/services/LocalLLMService.ts(487,22): error TS2304: Cannot find name 'ReActTools'.
src/services/LocalLLMService.ts(489,22): error TS2304: Cannot find name 'ReActTools'.
src/services/LocalLLMService.ts(592,13): error TS2304: Cannot find name 'LocalLLM'.
src/services/LocalLLMService.ts(597,13): error TS2304: Cannot find name 'LocalLLM'.
src/services/LocalLLMService.ts(602,5): error TS2304: Cannot find name 'logger'.
src/services/TurboModuleRegistry.ts(28,47): error TS2344: Type 'T' does not satisfy the constraint 'TurboModule'.
src/services/TurboModuleRegistry.ts(34,65): error TS18046: 'error' is of type 'unknown'.
src/services/audio/VoicePipelineService.ts(392,11): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
turbo-modules/src/index.ts(102,5): error TS2783: 'isListening' is specified more than once, so this usage will be overwritten.
turbo-modules/src/index.ts(103,5): error TS2783: 'startListening' is specified more than once, so this usage will be overwritten.
turbo-modules/src/index.ts(104,5): error TS2783: 'stopListening' is specified more than once, so this usage will be overwritten.
turbo-modules/src/index.ts(192,39): error TS18046: 'error' is of type 'unknown'.
turbo-modules/src/index.ts(236,5): error TS2783: 'loadModel' is specified more than once, so this usage will be overwritten.
turbo-modules/src/index.ts(237,5): error TS2783: 'downloadModel' is specified more than once, so this usage will be overwritten.
turbo-modules/src/index.ts(238,5): error TS2783: 'deleteModel' is specified more than once, so this usage will be overwritten.
turbo-modules/src/index.ts(280,5): error TS2783: 'loadEmbeddingModel' is specified more than once, so this usage will be overwritten.
turbo-modules/src/index.ts(319,39): error TS18046: 'error' is of type 'unknown'.
turbo-modules/src/index.ts(326,5): error TS2783: 'registerTool' is specified more than once, so this usage will be overwritten.
❌ FAILED

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

**Debug report completed at Sat Jul  5 02:47:43 UTC 2025**
