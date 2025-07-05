#!/bin/bash

# GitHub Actions Workflow Monitor for monGARS
# Monitors workflow status and provides debugging information

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

echo -e "${BLUE}🔍 GitHub Actions Workflow Monitor${NC}"
echo "============================================="
echo

# Repository information
REPO_OWNER="ales27pm"
REPO_NAME="native-monGARS"
REPO_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}"

log_info "Repository: ${REPO_OWNER}/${REPO_NAME}"
log_info "Actions URL: ${REPO_URL}/actions"
echo

# Check if we're in the correct directory
if [[ ! -f "package.json" ]] || [[ ! -f "README.md" ]]; then
    log_error "This script must be run from the monGARS project root directory"
    exit 1
fi

# Check workflow files
log_info "Checking workflow files..."
if [[ -f ".github/workflows/build-and-deploy.yml" ]]; then
    log_success "Main workflow found: .github/workflows/build-and-deploy.yml"
else
    log_error "Main workflow missing: .github/workflows/build-and-deploy.yml"
fi

if [[ -f ".github/workflows/turbomodules-build.yml" ]]; then
    log_success "TurboModules workflow found: .github/workflows/turbomodules-build.yml"
else
    log_error "TurboModules workflow missing: .github/workflows/turbomodules-build.yml"
fi

echo

# Check workflow triggers
log_info "Checking recent commits that should trigger workflows..."
git log --oneline -5 | while read -r commit; do
    echo "  $commit"
done
echo

# Check if workflows are properly configured
log_info "Validating workflow configuration..."

# Check main workflow
if [[ -f ".github/workflows/build-and-deploy.yml" ]]; then
    log_info "Main workflow validation:"
    
    # Check for proper triggers
    if grep -q "on:" ".github/workflows/build-and-deploy.yml"; then
        log_success "  ✅ Workflow triggers configured"
    else
        log_error "  ❌ Workflow triggers missing"
    fi
    
    # Check for Node.js setup
    if grep -q "setup-node" ".github/workflows/build-and-deploy.yml"; then
        log_success "  ✅ Node.js setup configured"
    else
        log_error "  ❌ Node.js setup missing"
    fi
    
    # Check for Bun setup
    if grep -q "setup-bun" ".github/workflows/build-and-deploy.yml"; then
        log_success "  ✅ Bun setup configured"
    else
        log_error "  ❌ Bun setup missing"
    fi
    
    # Check for cache configuration issues
    if grep -q "cache: 'npm'" ".github/workflows/build-and-deploy.yml"; then
        log_error "  ❌ Invalid npm cache configuration found (should be removed for Bun)"
    else
        log_success "  ✅ No invalid npm cache configuration"
    fi
fi

echo

# Check TurboModules workflow
if [[ -f ".github/workflows/turbomodules-build.yml" ]]; then
    log_info "TurboModules workflow validation:"
    
    # Check for proper triggers
    if grep -q "on:" ".github/workflows/turbomodules-build.yml"; then
        log_success "  ✅ Workflow triggers configured"
    else
        log_error "  ❌ Workflow triggers missing"
    fi
    
    # Check for cache configuration issues
    if grep -q "cache: 'npm'" ".github/workflows/turbomodules-build.yml"; then
        log_error "  ❌ Invalid npm cache configuration found (should be removed for Bun)"
    else
        log_success "  ✅ No invalid npm cache configuration"
    fi
fi

echo

# Check project configuration
log_info "Checking project configuration..."

# Check package.json
if [[ -f "package.json" ]]; then
    log_success "  ✅ package.json found"
    
    # Check if we have required scripts
    if grep -q '"start"' package.json; then
        log_success "  ✅ Start script configured"
    else
        log_error "  ❌ Start script missing"
    fi
else
    log_error "  ❌ package.json missing"
fi

# Check bun.lock
if [[ -f "bun.lock" ]]; then
    log_success "  ✅ bun.lock found (Bun project confirmed)"
else
    log_warning "  ⚠️ bun.lock missing (may affect workflow)"
fi

# Check app.json
if [[ -f "app.json" ]]; then
    log_success "  ✅ app.json found (Expo project confirmed)"
else
    log_error "  ❌ app.json missing"
fi

# Check eas.json
if [[ -f "eas.json" ]]; then
    log_success "  ✅ eas.json found (EAS configuration available)"
else
    log_warning "  ⚠️ eas.json missing (may affect build workflows)"
fi

echo

# Generate workflow status report
REPORT_FILE="workflow-monitor-report-$(date +%Y%m%d-%H%M%S).md"
log_info "Generating workflow monitor report: $REPORT_FILE"

cat > "$REPORT_FILE" << EOF
# GitHub Actions Workflow Monitor Report

**Generated**: $(date)
**Repository**: ${REPO_OWNER}/${REPO_NAME}
**Git Commit**: $(git rev-parse HEAD)

## Workflow Status

### Main Workflow (.github/workflows/build-and-deploy.yml)
- **Status**: $([ -f ".github/workflows/build-and-deploy.yml" ] && echo "✅ Present" || echo "❌ Missing")
- **Triggers**: $(grep -q "on:" ".github/workflows/build-and-deploy.yml" 2>/dev/null && echo "✅ Configured" || echo "❌ Missing")
- **Node.js Setup**: $(grep -q "setup-node" ".github/workflows/build-and-deploy.yml" 2>/dev/null && echo "✅ Configured" || echo "❌ Missing")
- **Bun Setup**: $(grep -q "setup-bun" ".github/workflows/build-and-deploy.yml" 2>/dev/null && echo "✅ Configured" || echo "❌ Missing")
- **Cache Configuration**: $(grep -q "cache: 'npm'" ".github/workflows/build-and-deploy.yml" 2>/dev/null && echo "❌ Invalid (npm cache)" || echo "✅ Valid")

### TurboModules Workflow (.github/workflows/turbomodules-build.yml)
- **Status**: $([ -f ".github/workflows/turbomodules-build.yml" ] && echo "✅ Present" || echo "❌ Missing")
- **Triggers**: $(grep -q "on:" ".github/workflows/turbomodules-build.yml" 2>/dev/null && echo "✅ Configured" || echo "❌ Missing")
- **Cache Configuration**: $(grep -q "cache: 'npm'" ".github/workflows/turbomodules-build.yml" 2>/dev/null && echo "❌ Invalid (npm cache)" || echo "✅ Valid")

## Project Configuration

### Package Management
- **package.json**: $([ -f "package.json" ] && echo "✅ Present" || echo "❌ Missing")
- **bun.lock**: $([ -f "bun.lock" ] && echo "✅ Present (Bun project)" || echo "❌ Missing")
- **Lock file consistency**: $([ -f "bun.lock" ] && echo "✅ Bun project" || echo "❌ Inconsistent")

### Expo Configuration
- **app.json**: $([ -f "app.json" ] && echo "✅ Present" || echo "❌ Missing")
- **eas.json**: $([ -f "eas.json" ] && echo "✅ Present" || echo "❌ Missing")

## Recent Commits
$(git log --oneline -5)

## Workflow Links
- **Actions Dashboard**: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions
- **Main Workflow**: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/workflows/build-and-deploy.yml
- **TurboModules Workflow**: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/workflows/turbomodules-build.yml

## Common Issues and Solutions

### 1. npm Cache Error
**Problem**: \`Dependencies lock file is not found\`
**Solution**: Remove \`cache: 'npm'\` from Node.js setup in workflows

### 2. Missing iOS Directory
**Problem**: \`cd ios && pod install\` fails
**Solution**: Add \`npx expo prebuild --platform ios\` before CocoaPods installation

### 3. EAS Build Failures
**Problem**: \`eas build\` commands fail
**Solution**: Ensure \`eas.json\` is properly configured and EAS CLI is available

### 4. TurboModules Build Issues
**Problem**: Swift/Objective-C compilation errors
**Solution**: Ensure iOS project is prebuilt and TurboModules are properly linked

## Next Steps

1. **Check Actions Dashboard**: Visit https://github.com/${REPO_OWNER}/${REPO_NAME}/actions
2. **Review Recent Runs**: Check if workflows are running after recent commits
3. **Monitor Build Logs**: Review any failed workflow runs for specific errors
4. **Test Locally**: Run \`bun install\` and \`npx expo prebuild\` to test configuration

---

**Report completed at $(date)**
EOF

log_success "Workflow monitor report generated: $REPORT_FILE"

echo
log_info "Manual verification steps:"
echo "1. Visit: ${REPO_URL}/actions"
echo "2. Check if workflows are running or have completed"
echo "3. Review any error messages in failed runs"
echo "4. Test local build with: bun install && npx expo prebuild"
echo

log_success "Workflow monitoring completed!"
echo "Open the Actions dashboard to see current workflow status:"
echo -e "${BLUE}${REPO_URL}/actions${NC}"