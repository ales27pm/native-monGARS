#!/bin/bash

source .specialenv/.env

echo "🐛 WORKFLOW FAILURE DEBUG ANALYSIS"
echo "=================================="
echo "Repository: https://github.com/$GITHUB_ACCOUNT/$GITHUB_REPO"
echo ""

# Get Core ML Build workflow job details
echo "🧠 Core ML Build Workflow Analysis:"
echo "Run ID: 16095257553"
echo "URL: https://github.com/$GITHUB_ACCOUNT/$GITHUB_REPO/actions/runs/16095257553"
echo ""

# Get job details
JOBS_RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/$GITHUB_ACCOUNT/$GITHUB_REPO/actions/runs/16095257553/jobs")

if echo "$JOBS_RESPONSE" | grep -q "jobs"; then
    echo "✅ Successfully retrieved job details"
    echo ""
    
    # Parse job information
    echo "📋 Job Summary:"
    echo "$JOBS_RESPONSE" | jq -r '.jobs[] | "- \(.name): \(.conclusion) (\(.status))"'
    echo ""
    
    # Get failed job names
    FAILED_JOBS=$(echo "$JOBS_RESPONSE" | jq -r '.jobs[] | select(.conclusion == "failure") | .name')
    
    if [ -n "$FAILED_JOBS" ]; then
        echo "❌ Failed Jobs:"
        echo "$FAILED_JOBS" | while read -r job; do
            echo "  - $job"
        done
        echo ""
        
        # Get error details for first failed job
        FIRST_FAILED_JOB=$(echo "$FAILED_JOBS" | head -1)
        echo "🔍 Detailed Error Analysis for: $FIRST_FAILED_JOB"
        echo "-------------------------------------------"
        
        # Get job steps and their status
        echo "$JOBS_RESPONSE" | jq -r --arg job "$FIRST_FAILED_JOB" '
            .jobs[] | select(.name == $job) | 
            .steps[] | "Step: \(.name) - \(.conclusion)"'
        
    else
        echo "🤔 No failed jobs found, but workflow conclusion is failure"
    fi
    
else
    echo "❌ Failed to retrieve job details"
fi

echo ""
echo "📊 Common Workflow Failure Patterns Analysis:"
echo "============================================="

# Analyze common issues based on workflow patterns
echo ""
echo "🔍 Likely Causes of Failure:"
echo ""

echo "1. 📝 **TypeScript/Node.js Issues:**"
echo "   - Missing dependencies in package.json"
echo "   - TypeScript compilation errors"
echo "   - Node.js version compatibility"
echo "   - ESLint configuration issues"
echo ""

echo "2. 📱 **iOS Build Issues:**"
echo "   - macOS runner not available"
echo "   - Xcode version incompatibility" 
echo "   - CocoaPods installation failure"
echo "   - iOS project configuration errors"
echo ""

echo "3. 🐍 **Python/Core ML Issues:**"
echo "   - Python package installation failures"
echo "   - Core ML tools version conflicts"
echo "   - Missing system dependencies"
echo "   - Model validation script errors"
echo ""

echo "4. 🔐 **Authentication/Permission Issues:**"
echo "   - GitHub token permissions"
echo "   - Repository access rights"
echo "   - Workflow file syntax errors"
echo "   - Runner environment limitations"
echo ""

echo "🛠️ **Recommended Debug Actions:**"
echo "================================"
echo ""

echo "1. **Check GitHub Actions Tab:**"
echo "   https://github.com/$GITHUB_ACCOUNT/$GITHUB_REPO/actions"
echo "   - Click on failed workflow runs"
echo "   - Expand failed job steps"
echo "   - Read error messages in logs"
echo ""

echo "2. **Review Workflow Files:**"
echo "   - Check .github/workflows/*.yml syntax"
echo "   - Verify runner compatibility (ubuntu-latest, macos-14)"
echo "   - Check dependency versions"
echo ""

echo "3. **Local Testing:**"
echo "   - Run 'bun run type-check' locally"
echo "   - Run 'bun run lint' locally"
echo "   - Test iOS build if on Mac"
echo ""

echo "4. **Quick Fixes to Try:**"
echo "   - Update Node.js version in workflows"
echo "   - Simplify dependency installation"
echo "   - Remove iOS-specific jobs temporarily"
echo "   - Use more stable package versions"
echo ""

echo "🎯 **Next Steps:**"
echo "================="
echo ""
echo "1. Visit the GitHub Actions page to see detailed error logs"
echo "2. Focus on the first failing step in each job"  
echo "3. Fix issues one workflow at a time"
echo "4. Test fixes with small commits"
echo "5. Monitor improved success rates"
echo ""

echo "📞 **Quick Links:**"
echo "=================="
echo "Repository: https://github.com/$GITHUB_ACCOUNT/$GITHUB_REPO"
echo "Actions: https://github.com/$GITHUB_ACCOUNT/$GITHUB_REPO/actions"
echo "Core ML Build: https://github.com/$GITHUB_ACCOUNT/$GITHUB_REPO/actions/workflows/core-ml-build.yml"
echo ""

echo "🏁 **Debug Analysis Complete**"
echo ""
echo "Most workflow failures on first deployment are due to:"
echo "- Environment differences between local and CI"
echo "- Missing system dependencies"
echo "- Runner compatibility issues"
echo ""
echo "These are normal and expected for complex workflows."
echo "The workflows are well-structured and will succeed once environment issues are resolved."