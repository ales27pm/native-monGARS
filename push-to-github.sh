#!/bin/bash

# GitHub Push Script with Token Authentication
export GITHUB_TOKEN="github_pat_11ANSBOAYOYkcZhz6Vbe-JD_P4DCEKiyKVXcLHAA7dUQwlzgGnOUp-LEOUpxlmebFuJ72XMBES5RKiK3iNW7"
export GIT_USERNAME="ales27pm"
export GIT_REPO="native-monGARS"

echo "🚀 Pushing to GitHub Repository..."
echo "Repository: https://github.com/$GIT_USERNAME/$GIT_REPO"

# Set up authentication
git config --global user.name "$GIT_USERNAME"
git config --global user.email "$GIT_USERNAME@users.noreply.github.com"

# Create authenticated URL
GITHUB_URL="https://$GIT_USERNAME:$GITHUB_TOKEN@github.com/$GIT_USERNAME/$GIT_REPO.git"

# Update remote URL with authentication
git remote set-url github "$GITHUB_URL"

# Push to GitHub
echo "📤 Pushing commits to GitHub..."
git push github main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo "🔗 Repository: https://github.com/$GIT_USERNAME/$GIT_REPO"
    echo "📋 Check GitHub Actions: https://github.com/$GIT_USERNAME/$GIT_REPO/actions"
else
    echo "❌ Push failed"
    exit 1
fi