#!/bin/bash

# Live GitHub Actions Workflow Monitor
# Monitors workflow execution in real-time and provides detailed debugging

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

log_debug() {
    echo -e "${PURPLE}[DEBUG]${NC} $1"
}

echo -e "${BLUE}🔍 Live GitHub Actions Workflow Monitor${NC}"
echo "============================================="
echo

# Repository information
REPO_OWNER="ales27pm"
REPO_NAME="native-monGARS"
REPO_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}"

log_info "Repository: ${REPO_OWNER}/${REPO_NAME}"
log_info "Actions URL: ${REPO_URL}/actions"
log_info "Monitoring started at: $(date)"
echo

# Function to check workflow status
check_workflow_status() {
    local workflow_name="$1"
    local workflow_file="$2"
    
    log_info "Checking workflow: $workflow_name"
    
    if [[ -f "$workflow_file" ]]; then
        log_success "  ✅ Workflow file exists: $workflow_file"
        
        # Check workflow syntax
        if grep -q "name:" "$workflow_file" && grep -q "on:" "$workflow_file"; then
            log_success "  ✅ Workflow syntax appears valid"
        else
            log_error "  ❌ Workflow syntax issues detected"
            return 1
        fi
        
        # Check for common issues
        if grep -q "cache: 'npm'" "$workflow_file"; then
            log_error "  ❌ Invalid npm cache configuration found"
            return 1
        fi
        
        if grep -q "setup-bun" "$workflow_file"; then
            log_success "  ✅ Bun setup configured"
        else
            log_warning "  ⚠️ Bun setup not found"
        fi
        
        return 0
    else
        log_error "  ❌ Workflow file missing: $workflow_file"
        return 1
    fi
}

# Function to simulate workflow execution locally
simulate_workflow() {
    local workflow_name="$1"
    
    log_info "Simulating workflow: $workflow_name"
    
    # Test basic dependencies
    log_debug "Testing basic setup..."
    
    # Check if we can install dependencies
    if command -v bun &> /dev/null; then
        log_success "  ✅ Bun is available"
        
        log_debug "Testing dependency installation..."
        if timeout 60 bun install --silent; then
            log_success "  ✅ Dependencies install successfully"
        else
            log_error "  ❌ Dependency installation failed"
            return 1
        fi
    else
        log_error "  ❌ Bun is not available"
        return 1
    fi
    
    # Test TypeScript compilation
    log_debug "Testing TypeScript compilation..."
    if timeout 30 bunx tsc --noEmit --skipLibCheck; then
        log_success "  ✅ TypeScript compilation successful"
    else
        log_error "  ❌ TypeScript compilation failed"
        return 1
    fi
    
    # Test Expo CLI availability
    log_debug "Testing Expo CLI availability..."
    if command -v expo &> /dev/null || bunx expo --version &> /dev/null; then
        log_success "  ✅ Expo CLI is available"
    else
        log_error "  ❌ Expo CLI is not available"
        return 1
    fi
    
    return 0
}

# Function to generate debugging report
generate_debug_report() {
    local report_file="live-workflow-debug-$(date +%Y%m%d-%H%M%S).md"
    
    log_info "Generating debug report: $report_file"
    
    cat > "$report_file" << EOF
# Live Workflow Debug Report

**Generated**: $(date)
**Repository**: ${REPO_OWNER}/${REPO_NAME}
**Commit**: $(git rev-parse HEAD)
**Branch**: $(git rev-parse --abbrev-ref HEAD)

## Workflow Status Check

### Main Workflow
$(check_workflow_status "Main Build & Deploy" ".github/workflows/build-and-deploy.yml" && echo "✅ PASSED" || echo "❌ FAILED")

### TurboModules Workflow
$(check_workflow_status "TurboModules Build" ".github/workflows/turbomodules-build.yml" && echo "✅ PASSED" || echo "❌ FAILED")

## Local Simulation Results

### Dependency Installation
$(timeout 60 bun install --silent && echo "✅ PASSED" || echo "❌ FAILED")

### TypeScript Compilation
$(timeout 30 bunx tsc --noEmit --skipLibCheck && echo "✅ PASSED" || echo "❌ FAILED")

### Expo Prebuild Test
$(timeout 60 bunx expo prebuild --platform ios --no-install --dry-run && echo "✅ PASSED" || echo "❌ FAILED")

## Environment Information

### System
- **OS**: $(uname -s)
- **Node Version**: $(node --version)
- **Bun Version**: $(bun --version)

### Project
- **Package Manager**: $([ -f "bun.lock" ] && echo "Bun" || echo "Unknown")
- **Expo Version**: $(bunx expo --version)
- **TypeScript Version**: $(bunx tsc --version)

## Recent Commits
\`\`\`
$(git log --oneline -5)
\`\`\`

## Workflow Files Content

### Main Workflow (lines 1-50)
\`\`\`yaml
$(head -50 .github/workflows/build-and-deploy.yml)
\`\`\`

### TurboModules Workflow (lines 1-50)
\`\`\`yaml
$(head -50 .github/workflows/turbomodules-build.yml)
\`\`\`

## Recommendations

1. **Check Actions Dashboard**: Visit ${REPO_URL}/actions
2. **Review Workflow Logs**: Check individual workflow run logs for detailed errors
3. **Local Testing**: Run the simulation commands locally
4. **Configuration Review**: Verify all workflow configurations are correct

## Next Steps

$([ -f "bun.lock" ] && echo "✅ Project uses Bun - configurations should be compatible" || echo "❌ Check package manager configuration")
$(grep -q "cache: 'npm'" .github/workflows/*.yml && echo "❌ Remove npm cache configuration" || echo "✅ No npm cache configuration found")
$([ -f "eas.json" ] && echo "✅ EAS configuration available" || echo "❌ Add EAS configuration")

---

**Debug report completed at $(date)**
EOF

    log_success "Debug report generated: $report_file"
    echo "$report_file"
}

# Main monitoring loop
main() {
    log_info "Starting comprehensive workflow monitoring..."
    echo
    
    # Check workflow files
    log_info "Phase 1: Workflow File Validation"
    MAIN_WORKFLOW_OK=false
    TURBO_WORKFLOW_OK=false
    
    if check_workflow_status "Main Build & Deploy" ".github/workflows/build-and-deploy.yml"; then
        MAIN_WORKFLOW_OK=true
    fi
    
    if check_workflow_status "TurboModules Build" ".github/workflows/turbomodules-build.yml"; then
        TURBO_WORKFLOW_OK=true
    fi
    
    echo
    
    # Simulate workflow execution
    log_info "Phase 2: Local Workflow Simulation"
    LOCAL_SIMULATION_OK=false
    
    if simulate_workflow "Local Simulation"; then
        LOCAL_SIMULATION_OK=true
    fi
    
    echo
    
    # Generate comprehensive report
    log_info "Phase 3: Report Generation"
    REPORT_FILE=$(generate_debug_report)
    
    echo
    
    # Summary
    log_info "Monitoring Summary:"
    echo "  Main Workflow: $([ "$MAIN_WORKFLOW_OK" = true ] && echo "✅ PASSED" || echo "❌ FAILED")"
    echo "  TurboModules Workflow: $([ "$TURBO_WORKFLOW_OK" = true ] && echo "✅ PASSED" || echo "❌ FAILED")"
    echo "  Local Simulation: $([ "$LOCAL_SIMULATION_OK" = true ] && echo "✅ PASSED" || echo "❌ FAILED")"
    echo "  Debug Report: ✅ Generated ($REPORT_FILE)"
    
    echo
    
    # Recommendations
    if [ "$MAIN_WORKFLOW_OK" = true ] && [ "$TURBO_WORKFLOW_OK" = true ] && [ "$LOCAL_SIMULATION_OK" = true ]; then
        log_success "🎉 All checks passed! Workflows should execute successfully."
        log_info "Visit ${REPO_URL}/actions to monitor live workflow execution."
    else
        log_error "❌ Some checks failed. Review the debug report for detailed information."
        log_info "Issues found need to be addressed before workflows can execute successfully."
    fi
    
    echo
    log_info "Monitoring completed at: $(date)"
}

# Run the main function
main "$@"