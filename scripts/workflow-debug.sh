#!/bin/bash

# Workflow Debug Script
# Comprehensive debugging for GitHub Actions workflows

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

echo -e "${BLUE}🔧 GitHub Actions Workflow Debug Tool${NC}"
echo "============================================="
echo

# Function to validate YAML syntax
validate_yaml() {
    local file="$1"
    log_info "Validating YAML syntax: $file"
    
    if command -v python3 &> /dev/null; then
        if python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
            log_success "  ✅ YAML syntax is valid"
            return 0
        else
            log_error "  ❌ YAML syntax error found"
            python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>&1 | head -5
            return 1
        fi
    else
        log_warning "  ⚠️ Python3 not available for YAML validation"
        return 0
    fi
}

# Function to check workflow triggers
check_workflow_triggers() {
    local file="$1"
    log_info "Checking workflow triggers: $file"
    
    # Check for push triggers
    if grep -q "push:" "$file"; then
        log_success "  ✅ Push trigger configured"
        
        # Check specific branches
        if grep -A5 "push:" "$file" | grep -q "branches:"; then
            local branches=$(grep -A5 "push:" "$file" | grep -A3 "branches:" | grep -E "^\s*-" | sed 's/^[[:space:]]*-[[:space:]]*//' | tr '\n' ', ')
            log_info "    📝 Trigger branches: $branches"
        else
            log_warning "    ⚠️ No specific branches configured (triggers on all branches)"
        fi
    else
        log_warning "  ⚠️ No push trigger found"
    fi
    
    # Check for pull request triggers
    if grep -q "pull_request:" "$file"; then
        log_success "  ✅ Pull request trigger configured"
    else
        log_info "  📝 No pull request trigger (not required)"
    fi
    
    # Check for manual triggers
    if grep -q "workflow_dispatch:" "$file"; then
        log_success "  ✅ Manual trigger (workflow_dispatch) configured"
    else
        log_warning "  ⚠️ No manual trigger configured"
    fi
}

# Function to check job dependencies
check_job_dependencies() {
    local file="$1"
    log_info "Checking job dependencies: $file"
    
    # Extract job names
    local jobs=$(grep -E "^[[:space:]]*[a-zA-Z0-9_-]+:" "$file" | grep -v "name:\|on:\|env:" | sed 's/://g' | tr -s ' ' | sed 's/^[[:space:]]*//')
    
    log_info "  📝 Jobs found:"
    echo "$jobs" | while read -r job; do
        [[ -n "$job" ]] && log_info "    - $job"
    done
    
    # Check for needs dependencies
    if grep -q "needs:" "$file"; then
        log_success "  ✅ Job dependencies configured"
        local needs=$(grep -A1 "needs:" "$file" | grep -v "needs:" | sed 's/^[[:space:]]*-[[:space:]]*//' | tr '\n' ', ')
        log_info "    📝 Dependencies: $needs"
    else
        log_info "  📝 No job dependencies (jobs will run in parallel)"
    fi
}

# Function to check for common issues
check_common_issues() {
    local file="$1"
    log_info "Checking for common issues: $file"
    
    local issues_found=0
    
    # Check for npm cache with Bun project
    if grep -q "cache: 'npm'" "$file"; then
        log_error "  ❌ Found npm cache configuration (should be removed for Bun projects)"
        ((issues_found++))
    else
        log_success "  ✅ No npm cache configuration found"
    fi
    
    # Check for proper Node.js setup
    if grep -q "setup-node" "$file"; then
        log_success "  ✅ Node.js setup configured"
    else
        log_warning "  ⚠️ No Node.js setup found"
    fi
    
    # Check for Bun setup
    if grep -q "setup-bun" "$file"; then
        log_success "  ✅ Bun setup configured"
    else
        log_warning "  ⚠️ No Bun setup found"
    fi
    
    # Check for long-running commands without timeout
    if grep -q "bun install" "$file" && ! grep -q "timeout" "$file"; then
        log_warning "  ⚠️ Long-running commands without timeout"
    fi
    
    return $issues_found
}

# Function to test workflow locally
test_workflow_locally() {
    log_info "Testing workflow components locally..."
    
    local errors=0
    
    # Test 1: Dependencies
    log_info "  🔄 Testing dependency installation..."
    if timeout 60 bun install --silent; then
        log_success "  ✅ Dependencies install successfully"
    else
        log_error "  ❌ Dependency installation failed"
        ((errors++))
    fi
    
    # Test 2: TypeScript
    log_info "  🔄 Testing TypeScript compilation..."
    if timeout 30 bunx tsc --noEmit --skipLibCheck; then
        log_success "  ✅ TypeScript compilation successful"
    else
        log_error "  ❌ TypeScript compilation failed"
        ((errors++))
    fi
    
    # Test 3: Linting
    log_info "  🔄 Testing ESLint..."
    if timeout 30 bunx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 50; then
        log_success "  ✅ Linting passed"
    else
        log_warning "  ⚠️ Linting issues found (may not block workflow)"
    fi
    
    # Test 4: Expo CLI
    log_info "  🔄 Testing Expo CLI..."
    if command -v expo &> /dev/null || bunx expo --version &> /dev/null; then
        log_success "  ✅ Expo CLI available"
    else
        log_warning "  ⚠️ Expo CLI not available"
    fi
    
    return $errors
}

# Function to create workflow fix recommendations
create_fix_recommendations() {
    local report_file="workflow-debug-recommendations-$(date +%Y%m%d-%H%M%S).md"
    
    log_info "Creating fix recommendations: $report_file"
    
    cat > "$report_file" << EOF
# Workflow Debug Recommendations

**Generated**: $(date)
**Repository**: ales27pm/native-monGARS

## Workflow Files Analysis

### Main Workflow (.github/workflows/build-and-deploy.yml)
$(validate_yaml ".github/workflows/build-and-deploy.yml" 2>&1 | sed 's/\x1b\[[0-9;]*m//g')
$(check_workflow_triggers ".github/workflows/build-and-deploy.yml" 2>&1 | sed 's/\x1b\[[0-9;]*m//g')
$(check_common_issues ".github/workflows/build-and-deploy.yml" 2>&1 | sed 's/\x1b\[[0-9;]*m//g')

### TurboModules Workflow (.github/workflows/turbomodules-build.yml)
$(validate_yaml ".github/workflows/turbomodules-build.yml" 2>&1 | sed 's/\x1b\[[0-9;]*m//g')
$(check_workflow_triggers ".github/workflows/turbomodules-build.yml" 2>&1 | sed 's/\x1b\[[0-9;]*m//g')
$(check_common_issues ".github/workflows/turbomodules-build.yml" 2>&1 | sed 's/\x1b\[[0-9;]*m//g')

## Local Testing Results
$(test_workflow_locally 2>&1 | sed 's/\x1b\[[0-9;]*m//g')

## Recommended Actions

### If Workflows Are Not Triggering:
1. **Check Repository Settings**: Ensure Actions are enabled
2. **Verify Branch Protection**: Check if branch protection rules are blocking
3. **Manual Trigger**: Try running workflows manually from Actions tab
4. **Check Syntax**: Ensure YAML syntax is completely valid

### If Workflows Are Failing:
1. **Review Logs**: Check detailed logs in Actions tab
2. **Fix Dependencies**: Ensure all dependencies are properly configured
3. **Update Secrets**: Verify all required secrets are set
4. **Test Locally**: Run the same commands locally to reproduce issues

### Common Fixes:
- Remove \`cache: 'npm'\` from Node.js setup (for Bun projects)
- Add timeouts to long-running commands
- Use \`bunx\` instead of \`npx\` for better Bun compatibility
- Ensure EAS configuration is present for Expo builds

## Manual Verification Steps

1. Visit: https://github.com/ales27pm/native-monGARS/actions
2. Check if workflows appear in the Actions tab
3. Look for any workflow runs from recent commits
4. Review workflow run logs for specific error messages
5. Try triggering workflows manually if automatic triggers fail

## Project Health Check

- **Dependencies**: $(timeout 60 bun install --silent && echo "✅ OK" || echo "❌ FAILED")
- **TypeScript**: $(timeout 30 bunx tsc --noEmit --skipLibCheck && echo "✅ OK" || echo "❌ FAILED")
- **Workflow Files**: $(find .github/workflows -name "*.yml" | wc -l) files present
- **EAS Config**: $([ -f "eas.json" ] && echo "✅ Present" || echo "❌ Missing")

---

**Next Steps**: Review this report and apply recommended fixes, then commit and push changes to trigger workflows again.
EOF
    
    log_success "Recommendations saved to: $report_file"
    echo "$report_file"
}

# Main debug function
main() {
    log_info "Starting comprehensive workflow debugging..."
    echo
    
    local total_issues=0
    
    # Check if we're in the right directory
    if [[ ! -f "package.json" ]]; then
        log_error "Not in a valid project directory (package.json not found)"
        exit 1
    fi
    
    # Check main workflow
    if [[ -f ".github/workflows/build-and-deploy.yml" ]]; then
        log_info "=== MAIN WORKFLOW ANALYSIS ==="
        validate_yaml ".github/workflows/build-and-deploy.yml"
        check_workflow_triggers ".github/workflows/build-and-deploy.yml"
        check_job_dependencies ".github/workflows/build-and-deploy.yml"
        local main_issues
        check_common_issues ".github/workflows/build-and-deploy.yml"
        main_issues=$?
        ((total_issues += main_issues))
        echo
    else
        log_error "Main workflow file not found: .github/workflows/build-and-deploy.yml"
        ((total_issues++))
    fi
    
    # Check TurboModules workflow
    if [[ -f ".github/workflows/turbomodules-build.yml" ]]; then
        log_info "=== TURBOMODULES WORKFLOW ANALYSIS ==="
        validate_yaml ".github/workflows/turbomodules-build.yml"
        check_workflow_triggers ".github/workflows/turbomodules-build.yml"
        check_job_dependencies ".github/workflows/turbomodules-build.yml"
        local turbo_issues
        check_common_issues ".github/workflows/turbomodules-build.yml"
        turbo_issues=$?
        ((total_issues += turbo_issues))
        echo
    else
        log_error "TurboModules workflow file not found: .github/workflows/turbomodules-build.yml"
        ((total_issues++))
    fi
    
    # Test local workflow components
    log_info "=== LOCAL TESTING ==="
    local local_issues
    test_workflow_locally
    local_issues=$?
    ((total_issues += local_issues))
    echo
    
    # Generate recommendations
    log_info "=== GENERATING RECOMMENDATIONS ==="
    local report_file=$(create_fix_recommendations)
    echo
    
    # Summary
    log_info "=== DEBUGGING SUMMARY ==="
    if [[ $total_issues -eq 0 ]]; then
        log_success "🎉 No critical issues found! Workflows should be working."
        log_info "If workflows are still not running, check:"
        log_info "  1. GitHub repository Actions tab"
        log_info "  2. Repository settings (Actions enabled)"
        log_info "  3. Branch protection rules"
    else
        log_error "❌ Found $total_issues critical issues that need to be fixed"
        log_info "Review the recommendations in: $report_file"
    fi
    
    echo
    log_info "Manual verification:"
    log_info "  Visit: https://github.com/ales27pm/native-monGARS/actions"
    log_info "  Check for workflow runs from recent commits"
    log_info "  Try manual workflow dispatch if needed"
}

# Run the main function
main "$@"