#!/usr/bin/env python3
import json
import sys
import subprocess
import os

# Load environment variables
env = os.environ.copy()
with open('.specialenv/.env', 'r') as f:
    for line in f:
        if line.strip() and not line.startswith('#'):
            key, value = line.strip().split('=', 1)
            env[key] = value

# Get workflow runs
cmd = ['curl', '-s', '-H', f'Authorization: token {env["GITHUB_TOKEN"]}', 
       f'https://api.github.com/repos/{env["GITHUB_ACCOUNT"]}/{env["GITHUB_REPO"]}/actions/runs?per_page=5']

try:
    result = subprocess.run(cmd, capture_output=True, text=True, env=env)
    data = json.loads(result.stdout)
    
    print("🔍 WORKFLOW STATUS MONITORING")
    print("============================")
    print(f"📊 Total workflows: {data['total_count']}")
    print()
    
    for run in data['workflow_runs']:
        status_emoji = "🟢" if run['conclusion'] == 'success' else "🔴" if run['conclusion'] == 'failure' else "🟡"
        print(f"{status_emoji} {run['name']}: {run['status']} ({run['conclusion'] or 'in_progress'})")
        print(f"   📅 {run['created_at']}")
        print(f"   🔗 {run['html_url']}")
        print()
        
except Exception as e:
    print(f"Error: {e}")
    print(result.stdout if 'result' in locals() else "No result")