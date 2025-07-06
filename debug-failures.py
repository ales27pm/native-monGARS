#!/usr/bin/env python3
import json
import subprocess
import os

# Load environment variables
env = os.environ.copy()
with open('.specialenv/.env', 'r') as f:
    for line in f:
        if line.strip() and not line.startswith('#'):
            key, value = line.strip().split('=', 1)
            env[key] = value

# Core ML workflow run ID
run_id = "16101336516"
cmd = ['curl', '-s', '-H', f'Authorization: token {env["GITHUB_TOKEN"]}', 
       f'https://api.github.com/repos/{env["GITHUB_ACCOUNT"]}/{env["GITHUB_REPO"]}/actions/runs/{run_id}/jobs']

try:
    result = subprocess.run(cmd, capture_output=True, text=True, env=env)
    data = json.loads(result.stdout)
    
    print("🔍 CORE ML WORKFLOW JOB FAILURES")
    print("================================")
    
    for job in data['jobs']:
        print(f"📋 Job: {job['name']}")
        print(f"   Status: {job['status']}")
        print(f"   Conclusion: {job['conclusion']}")
        print(f"   Duration: {job['completed_at']} - {job['started_at']}")
        print(f"   URL: {job['html_url']}")
        print()
        
except Exception as e:
    print(f"Error: {e}")
    print(result.stdout if 'result' in locals() else "No result")