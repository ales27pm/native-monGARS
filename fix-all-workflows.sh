#!/bin/bash

# Fix all workflow files to use npm instead of bun

echo "🔧 FIXING ALL WORKFLOWS TO USE NPM"
echo "=================================="

# List of workflow files to fix
WORKFLOWS=(
    ".github/workflows/native-module-validation.yml"
    ".github/workflows/success-demo.yml"
    ".github/workflows/coreml-advanced.yml"
    ".github/workflows/health-monitoring.yml"
    ".github/workflows/release-distribution.yml"
)

for workflow in "${WORKFLOWS[@]}"; do
    echo "🔧 Fixing $workflow"
    
    # Replace Bun setup with npm
    sed -i 's/- name: Setup Bun/- name: Setup Node.js (npm cached)/g' "$workflow"
    sed -i 's/uses: oven-sh\/setup-bun@v1/uses: actions\/setup-node@v4/g' "$workflow"
    sed -i 's/bun-version: latest/cache: '\''npm'\''/g' "$workflow"
    
    # Replace bun install with npm ci
    sed -i 's/bun install/npm ci --legacy-peer-deps/g' "$workflow"
    
    # Replace bunx with npx
    sed -i 's/bunx /npx /g' "$workflow"
    
    # Replace bun run with npm run
    sed -i 's/bun run/npm run/g' "$workflow"
    
    echo "✅ Fixed $workflow"
done

echo ""
echo "🎉 ALL WORKFLOWS FIXED!"
echo "======================"
echo "✅ Replaced Bun with Node.js + npm"
echo "✅ Updated all package manager commands"
echo "✅ Added legacy peer deps support"
echo ""
echo "🚀 Ready to commit and test workflows!"