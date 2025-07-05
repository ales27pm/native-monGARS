#!/bin/bash

# Check GitHub Actions workflow status
GITHUB_ACCOUNT=ales27pm
GITHUB_REPO=native-monGARS

# Load GitHub token from environment
if [ -f ".specialenv/.env" ]; then
    source .specialenv/.env
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN not set. Please set it in .specialenv/.env"
    exit 1
fi

echo "🔍 Checking GitHub Actions workflow status..."

# Get latest workflow runs
response=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$GITHUB_ACCOUNT/$GITHUB_REPO/actions/runs?per_page=5")

if [ $? -eq 0 ]; then
    echo "✅ Successfully fetched workflow data"
    
    # Parse and display workflow runs
    echo "$response" | jq -r '.workflow_runs[] | "\(.run_number) - \(.status) - \(.conclusion) - \(.head_commit.message | split("\n")[0]) - \(.created_at)"' | head -5 | while read line; do
        echo "📋 Run: $line"
    done
else
    echo "❌ Failed to fetch workflow data"
fi

echo ""
echo "🔗 View workflows at: https://github.com/$GITHUB_ACCOUNT/$GITHUB_REPO/actions"
echo ""