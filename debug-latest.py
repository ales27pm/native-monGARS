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

# Latest Core ML workflow run ID
run_id = "16101386343"
cmd = ['curl', '-s', '-H', f'Authorization: token {env["GITHUB_TOKEN"]}', 
       f'https://api.github.com/repos/{env["GITHUB_ACCOUNT"]}/{env["GITHUB_REPO"]}/actions/runs/{run_id}/jobs']

try:
    result = subprocess.run(cmd, capture_output=True, text=True, env=env)
    data = json.loads(result.stdout)
    
    print("🔍 LATEST CORE ML WORKFLOW FAILURE ANALYSIS")
    print("==========================================")
    
    for job in data['jobs']:
        print(f"📋 Job: {job['name']}")
        print(f"   Status: {job['status']}")
        print(f"   Conclusion: {job['conclusion']}")
        print(f"   Started: {job['started_at']}")
        print(f"   Completed: {job['completed_at']}")
        print()
        
        if job['conclusion'] == 'failure':
            print("🔴 FAILURE DETECTED - Getting job steps...")
            if 'steps' in job:
                for step in job['steps']:
                    if step['conclusion'] == 'failure':
                        print(f"   ❌ Failed Step: {step['name']}")
                        print(f"      Status: {step['status']}")
                        print(f"      Started: {step['started_at']}")
                        print(f"      Completed: {step['completed_at']}")
                        
except Exception as e:
    print(f"Error: {e}")
    print(result.stdout if 'result' in locals() else "No result")