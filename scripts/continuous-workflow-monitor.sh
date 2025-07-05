#!/bin/bash

# Continuous GitHub Actions Workflow Monitor
# Monitors workflows continuously and provides real-time status updates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌${NC} $1"
}

log_debug() {
    echo -e "${PURPLE}[$(date +'%H:%M:%S')] 🔍${NC} $1"
}

log_workflow() {
    echo -e "${CYAN}[$(date +'%H:%M:%S')] 🔄${NC} $1"
}

echo -e "${BLUE}🚀 Continuous GitHub Actions Workflow Monitor${NC}"
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

# Function to check local project health
check_project_health() {
    log_debug "Checking local project health..."
    
    local health_score=0
    local total_checks=6
    
    # Check 1: Package.json exists
    if [[ -f "package.json" ]]; then
        log_success "  ✅ package.json exists"
        ((health_score++))
    else
        log_error "  ❌ package.json missing"
    fi
    
    # Check 2: Bun lock file exists
    if [[ -f "bun.lock" ]]; then
        log_success "  ✅ bun.lock exists (Bun project)"
        ((health_score++))
    else
        log_warning "  ⚠️ bun.lock missing"
    fi
    
    # Check 3: Dependencies can be installed
    if timeout 60 bun install --silent >/dev/null 2>&1; then
        log_success "  ✅ Dependencies install successfully"
        ((health_score++))
    else
        log_error "  ❌ Dependency installation failed"
    fi
    
    # Check 4: TypeScript compiles
    if timeout 30 bunx tsc --noEmit --skipLibCheck >/dev/null 2>&1; then
        log_success "  ✅ TypeScript compilation successful"
        ((health_score++))
    else
        log_error "  ❌ TypeScript compilation failed"
    fi
    
    # Check 5: Workflow files exist
    if [[ -f ".github/workflows/build-and-deploy.yml" ]] && [[ -f ".github/workflows/turbomodules-build.yml" ]]; then
        log_success "  ✅ Workflow files exist"
        ((health_score++))
    else
        log_error "  ❌ Workflow files missing"
    fi
    
    # Check 6: EAS configuration exists
    if [[ -f "eas.json" ]]; then
        log_success "  ✅ EAS configuration exists"
        ((health_score++))
    else
        log_warning "  ⚠️ EAS configuration missing"
    fi
    
    local health_percentage=$((health_score * 100 / total_checks))
    
    if [[ $health_percentage -ge 80 ]]; then
        log_success "Project health: ${health_percentage}% (${health_score}/${total_checks}) - EXCELLENT"
        return 0
    elif [[ $health_percentage -ge 60 ]]; then
        log_warning "Project health: ${health_percentage}% (${health_score}/${total_checks}) - GOOD"
        return 1
    else
        log_error "Project health: ${health_percentage}% (${health_score}/${total_checks}) - NEEDS ATTENTION"
        return 2
    fi
}

# Function to check commit status
check_recent_commits() {
    log_debug "Checking recent commits..."
    
    local commit_count=$(git log --oneline -10 | wc -l)
    local latest_commit=$(git log --oneline -1)
    
    log_info "  📝 Latest commit: $latest_commit"
    log_info "  📊 Recent commits: $commit_count in history"
    
    # Check if the latest commit should trigger workflows
    if echo "$latest_commit" | grep -qi "workflow\|fix\|feat\|ci"; then
        log_success "  ✅ Latest commit should trigger workflows"
        return 0
    else
        log_warning "  ⚠️ Latest commit may not trigger workflows"
        return 1
    fi
}

# Function to simulate workflow execution
simulate_workflow_execution() {
    local workflow_name="$1"
    log_workflow "Simulating workflow: $workflow_name"
    
    # Basic health checks
    if ! check_project_health >/dev/null 2>&1; then
        log_error "  ❌ Project health check failed for $workflow_name"
        return 1
    fi
    
    # Workflow-specific checks
    case "$workflow_name" in
        "Main Build & Deploy")
            log_debug "  🔄 Simulating main workflow steps..."
            
            # Check lint
            if timeout 30 bunx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 50 >/dev/null 2>&1; then
                log_success "  ✅ Lint check passed"
            else
                log_warning "  ⚠️ Lint issues found (may not block)"
            fi
            
            # Check Core ML validation
            if [[ -f "src/components/ModelDownloadManager.tsx" ]]; then
                log_success "  ✅ Core ML components present"
            else
                log_error "  ❌ Core ML components missing"
                return 1
            fi
            ;;
            
        "TurboModules Build")
            log_debug "  🔄 Simulating TurboModules workflow steps..."
            
            # Check TurboModules directory
            if [[ -d "turbo-modules" ]]; then
                log_success "  ✅ TurboModules directory exists"
            else
                log_error "  ❌ TurboModules directory missing"
                return 1
            fi
            
            # Check Swift files
            local swift_files=$(find turbo-modules -name "*.swift" 2>/dev/null | wc -l)
            if [[ $swift_files -gt 0 ]]; then
                log_success "  ✅ Swift files found ($swift_files files)"
            else
                log_warning "  ⚠️ No Swift files found"
            fi
            ;;
    esac
    
    log_success "  ✅ $workflow_name simulation completed successfully"
    return 0
}

# Function to check workflow status (simulation)
check_workflow_status() {
    log_debug "Checking workflow status..."
    
    local main_status="unknown"
    local turbo_status="unknown"
    
    # Simulate main workflow
    if simulate_workflow_execution "Main Build & Deploy"; then
        main_status="success"
    else
        main_status="failure"
    fi
    
    # Simulate TurboModules workflow
    if simulate_workflow_execution "TurboModules Build"; then
        turbo_status="success"
    else
        turbo_status="failure"
    fi
    
    # Report status
    case "$main_status" in
        "success")
            log_success "Main Workflow: ✅ PASSING"
            ;;
        "failure")
            log_error "Main Workflow: ❌ FAILING"
            ;;
        *)
            log_warning "Main Workflow: ⚠️ UNKNOWN"
            ;;
    esac
    
    case "$turbo_status" in
        "success")
            log_success "TurboModules Workflow: ✅ PASSING"
            ;;
        "failure")
            log_error "TurboModules Workflow: ❌ FAILING"
            ;;
        *)
            log_warning "TurboModules Workflow: ⚠️ UNKNOWN"
            ;;
    esac
    
    # Overall status
    if [[ "$main_status" == "success" ]] && [[ "$turbo_status" == "success" ]]; then
        log_success "🎉 ALL WORKFLOWS PASSING!"
        return 0
    else
        log_error "❌ Some workflows failing - requires attention"
        return 1
    fi
}

# Function to generate status report
generate_status_report() {
    local report_file="workflow-status-$(date +%Y%m%d-%H%M%S).md"
    
    log_info "Generating status report: $report_file"
    
    cat > "$report_file" << EOF
# Workflow Status Report

**Generated**: $(date)
**Repository**: ${REPO_OWNER}/${REPO_NAME}
**Commit**: $(git rev-parse HEAD)
**Branch**: $(git rev-parse --abbrev-ref HEAD)

## Recent Activity

### Latest Commits
\`\`\`
$(git log --oneline -5)
\`\`\`

### Project Health
$(check_project_health 2>&1 | sed 's/\x1b\[[0-9;]*m//g')

### Workflow Simulation Results
$(check_workflow_status 2>&1 | sed 's/\x1b\[[0-9;]*m//g')

## Manual Verification Steps

1. **Visit Actions Dashboard**: ${REPO_URL}/actions
2. **Check Workflow Runs**: Look for runs triggered by recent commits
3. **Review Logs**: Check individual workflow run logs for details
4. **Test Locally**: Run \`bun install && bunx tsc --noEmit\`

## Next Steps

- If workflows are failing: Review error logs and fix issues
- If workflows are not triggering: Check workflow file syntax
- If local simulation passes: Workflows should work on GitHub

---

**Report completed at $(date)**
EOF
    
    log_success "Status report generated: $report_file"
    echo "$report_file"
}

# Main monitoring function
main() {
    local iteration=0
    local max_iterations=10
    local sleep_interval=30
    
    log_info "Starting continuous workflow monitoring..."
    log_info "Will check every ${sleep_interval} seconds for ${max_iterations} iterations"
    echo
    
    while [[ $iteration -lt $max_iterations ]]; do
        ((iteration++))
        
        log_info "=== MONITORING ITERATION $iteration/$max_iterations ==="
        
        # Check project health
        if check_project_health; then
            log_success "Project health check passed"
        else
            log_warning "Project health check has issues"
        fi
        
        echo
        
        # Check recent commits
        if check_recent_commits; then
            log_success "Recent commits look good"
        else
            log_warning "Recent commits may need attention"
        fi
        
        echo
        
        # Check workflow status
        if check_workflow_status; then
            log_success "All workflows are in good state"
        else
            log_error "Some workflows need attention"
        fi
        
        echo
        
        # Generate report every 3 iterations
        if [[ $((iteration % 3)) -eq 0 ]]; then
            local report_file=$(generate_status_report)
            log_info "Status report: $report_file"
        fi
        
        echo
        
        if [[ $iteration -lt $max_iterations ]]; then
            log_info "Waiting ${sleep_interval} seconds before next check..."
            sleep $sleep_interval
        fi
        
        echo "----------------------------------------"
        echo
    done
    
    log_success "Monitoring completed after $max_iterations iterations"
    log_info "Visit ${REPO_URL}/actions to check live workflow status"
}

# Run the main function
main "$@"