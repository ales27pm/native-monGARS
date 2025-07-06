#!/bin/bash

# Core ML Debug Dashboard
# Real-time monitoring and debugging for the Core ML implementation

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Function to print colored status
status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check service status
check_service() {
    local service=$1
    local port=$2
    
    if netstat -tlnp 2>/dev/null | grep -q ":${port}"; then
        status $GREEN "✅ $service running on port $port"
        return 0
    else
        status $RED "❌ $service not running on port $port"
        return 1
    fi
}

# Clear screen and show header
clear
status $CYAN "🎯 Core ML Implementation - Debug Dashboard"
status $CYAN "============================================="
echo ""

# Real-time status loop
while true; do
    # Move cursor to top
    tput cup 4 0
    
    # System Status
    status $BLUE "📊 System Status - $(date '+%H:%M:%S')"
    echo "----------------------------------------"
    
    # Development Server Status
    if check_service "Metro Bundler" "8081"; then
        METRO_PID=$(netstat -tlnp 2>/dev/null | grep :8081 | awk '{print $7}' | cut -d'/' -f1)
        echo "   PID: $METRO_PID"
        
        # Check Metro health
        if curl -s http://localhost:8081/status >/dev/null 2>&1; then
            status $GREEN "   ✅ Metro API responding"
        else
            status $YELLOW "   ⚠️  Metro API not responding"
        fi
    fi
    
    echo ""
    
    # Git Status
    status $BLUE "📋 Git Status"
    echo "----------------------------------------"
    
    BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    LAST_COMMIT=$(git log --oneline -1 2>/dev/null || echo "No commits")
    
    status $GREEN "Branch: $BRANCH"
    echo "Last commit: $LAST_COMMIT"
    
    # Check for uncommitted changes
    if git diff --quiet && git diff --cached --quiet; then
        status $GREEN "✅ Working tree clean"
    else
        status $YELLOW "⚠️  Uncommitted changes present"
    fi
    
    echo ""
    
    # Core ML Files Status
    status $BLUE "📱 Core ML Implementation Status"
    echo "----------------------------------------"
    
    # Check key files
    declare -a files=(
        "ios/LocalLLMModule/LocalLLMModule.swift:Native iOS Module"
        "src/api/core-ml-service.ts:Core ML Service"
        "src/api/native-llm-service.ts:Native Bridge"
        "src/screens/ModelManagerScreen.tsx:Model Manager UI"
        ".github/workflows/core-ml-build.yml:CI/CD Pipeline"
    )
    
    for file_info in "${files[@]}"; do
        IFS=':' read -r file desc <<< "$file_info"
        if [ -f "$file" ]; then
            SIZE=$(wc -l < "$file" 2>/dev/null || echo "0")
            status $GREEN "✅ $desc ($SIZE lines)"
        else
            status $RED "❌ $desc (missing)"
        fi
    done
    
    echo ""
    
    # Project Health
    status $BLUE "🔧 Project Health"
    echo "----------------------------------------"
    
    # TypeScript check
    if npm run type-check >/dev/null 2>&1; then
        status $GREEN "✅ TypeScript compilation"
    else
        status $RED "❌ TypeScript errors present"
    fi
    
    # Dependencies
    if [ -d "node_modules" ]; then
        NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1)
        status $GREEN "✅ Dependencies installed ($NODE_MODULES_SIZE)"
    else
        status $RED "❌ Dependencies missing"
    fi
    
    # iOS Dependencies (if on macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if [ -d "ios/Pods" ]; then
            status $GREEN "✅ iOS Pods installed"
        else
            status $YELLOW "⚠️  iOS Pods not installed"
        fi
    fi
    
    echo ""
    
    # Development URLs
    status $BLUE "🌐 Development URLs"
    echo "----------------------------------------"
    
    # Local network IP
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
    
    status $CYAN "Metro Bundler:  http://localhost:8081"
    status $CYAN "Network:        http://$LOCAL_IP:8081"
    status $CYAN "Status API:     http://localhost:8081/status"
    
    echo ""
    
    # Quick Actions
    status $BLUE "⚡ Quick Actions"
    echo "----------------------------------------"
    echo "  r - Reload Metro"
    echo "  d - Open Developer Menu"
    echo "  i - Open iOS Simulator"
    echo "  j - Open React DevTools"
    echo "  c - Clear Metro Cache"
    echo "  q - Quit Dashboard"
    echo ""
    
    # Resource Usage
    status $BLUE "💾 Resource Usage"
    echo "----------------------------------------"
    
    # Memory usage
    if command -v free >/dev/null 2>&1; then
        MEMORY=$(free -h | awk '/^Mem:/ {print $3 "/" $2}')
        status $GREEN "Memory: $MEMORY"
    fi
    
    # Disk usage
    DISK=$(df -h . 2>/dev/null | awk 'NR==2 {print $3 "/" $2 " (" $5 " used)"}')
    status $GREEN "Disk: $DISK"
    
    # CPU Load
    if command -v uptime >/dev/null 2>&1; then
        LOAD=$(uptime | awk -F'load average:' '{print $2}' | sed 's/^[ \t]*//')
        status $GREEN "Load: $LOAD"
    fi
    
    echo ""
    
    # Recent Logs (if Metro is running)
    if [ -n "$METRO_PID" ]; then
        status $BLUE "📝 Recent Metro Activity"
        echo "----------------------------------------"
        # This would show recent Metro logs if available
        echo "   Metro bundler active (PID: $METRO_PID)"
        echo "   Ready for connections..."
    fi
    
    echo ""
    status $PURPLE "Press Ctrl+C to exit dashboard"
    echo ""
    
    # Update every 3 seconds
    sleep 3
done