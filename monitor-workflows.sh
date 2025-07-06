#!/bin/bash

# Load GitHub credentials
source .specialenv/.env

echo "🔍 GitHub Actions Workflow Monitor"
echo "================================="
echo "Repository: https://github.com/$GITHUB_ACCOUNT/$GITHUB_REPO"
echo "Monitoring started: $(date)"
echo ""

# Function to check workflow status via GitHub API
check_workflows() {
    echo "📊 Checking workflow runs..."
    
    # Get latest workflow runs
    RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "https://api.github.com/repos/$GITHUB_ACCOUNT/$GITHUB_REPO/actions/runs?per_page=10")
    
    if [ $? -eq 0 ] && echo "$RESPONSE" | grep -q "workflow_runs"; then
        echo "✅ Successfully connected to GitHub API"
        
        # Parse and display workflow status
        echo "$RESPONSE" | jq -r '.workflow_runs[] | "\(.status) \(.conclusion) \(.name) - \(.created_at) - \(.html_url)"' | head -5
        
        # Count workflow runs by status
        TOTAL_RUNS=$(echo "$RESPONSE" | jq '.total_count')
        QUEUED=$(echo "$RESPONSE" | jq '[.workflow_runs[] | select(.status == "queued")] | length')
        IN_PROGRESS=$(echo "$RESPONSE" | jq '[.workflow_runs[] | select(.status == "in_progress")] | length')
        COMPLETED=$(echo "$RESPONSE" | jq '[.workflow_runs[] | select(.status == "completed")] | length')
        
        echo ""
        echo "📈 Workflow Statistics:"
        echo "  Total runs: $TOTAL_RUNS"
        echo "  Queued: $QUEUED"
        echo "  In Progress: $IN_PROGRESS" 
        echo "  Completed: $COMPLETED"
        
    else
        echo "❌ Unable to connect to GitHub API or no workflows found yet"
        echo "This is normal immediately after first push - workflows may take 1-2 minutes to appear"
    fi
}

# Function to check specific workflow files
check_workflow_files() {
    echo ""
    echo "📁 Workflow Files Status:"
    
    for workflow in .github/workflows/*.yml; do
        if [ -f "$workflow" ]; then
            filename=$(basename "$workflow")
            size=$(stat -c%s "$workflow" 2>/dev/null || stat -f%z "$workflow" 2>/dev/null || echo "unknown")
            echo "  ✅ $filename ($size bytes)"
        fi
    done
}

# Function to monitor Core ML Build workflow specifically
monitor_coreml_build() {
    echo ""
    echo "🧠 Core ML Build Workflow Status:"
    
    COREML_RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "https://api.github.com/repos/$GITHUB_ACCOUNT/$GITHUB_REPO/actions/workflows/core-ml-build.yml/runs?per_page=1")
    
    if echo "$COREML_RESPONSE" | grep -q "workflow_runs"; then
        LATEST_RUN=$(echo "$COREML_RESPONSE" | jq -r '.workflow_runs[0]')
        if [ "$LATEST_RUN" != "null" ]; then
            STATUS=$(echo "$LATEST_RUN" | jq -r '.status')
            CONCLUSION=$(echo "$LATEST_RUN" | jq -r '.conclusion')
            URL=$(echo "$LATEST_RUN" | jq -r '.html_url')
            CREATED=$(echo "$LATEST_RUN" | jq -r '.created_at')
            
            echo "  Status: $STATUS"
            echo "  Conclusion: $CONCLUSION"
            echo "  Created: $CREATED"
            echo "  URL: $URL"
            
            if [ "$STATUS" = "in_progress" ]; then
                echo "  🔄 Build is currently running - monitor at: $URL"
            elif [ "$STATUS" = "completed" ] && [ "$CONCLUSION" = "success" ]; then
                echo "  ✅ Latest build completed successfully!"
            elif [ "$STATUS" = "completed" ] && [ "$CONCLUSION" = "failure" ]; then  
                echo "  ❌ Latest build failed - check logs at: $URL"
            fi
        else
            echo "  ⏳ No Core ML Build runs found yet"
        fi
    else
        echo "  ⏳ Core ML Build workflow not triggered yet"
    fi
}

# Main monitoring loop
main() {
    check_workflow_files
    echo ""
    
    for i in {1..5}; do
        echo "🔄 Monitor Check #$i ($(date))"
        echo "----------------------------------------"
        
        check_workflows
        monitor_coreml_build
        
        echo ""
        echo "🔗 Quick Links:"
        echo "  Repository: https://github.com/$GITHUB_ACCOUNT/$GITHUB_REPO"
        echo "  Actions: https://github.com/$GITHUB_ACCOUNT/$GITHUB_REPO/actions"
        echo "  Workflows: https://github.com/$GITHUB_ACCOUNT/$GITHUB_REPO/actions/workflows/core-ml-build.yml"
        
        if [ $i -lt 5 ]; then
            echo ""
            echo "⏱️  Waiting 30 seconds before next check..."
            sleep 30
            echo ""
        fi
    done
    
    echo ""
    echo "🎯 Monitoring completed. Check GitHub Actions tab for real-time updates:"
    echo "   https://github.com/$GITHUB_ACCOUNT/$GITHUB_REPO/actions"
}

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq not found - installing for JSON parsing..."
    # Try to install jq
    apt-get update && apt-get install -y jq 2>/dev/null || \
    yum install -y jq 2>/dev/null || \
    brew install jq 2>/dev/null || \
    echo "Could not install jq - monitoring will be limited"
fi

# Run main monitoring
main