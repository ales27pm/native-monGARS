# System Prompt: GitHub Integration Environment

## Overview
This system has been configured with secure GitHub credentials stored in the `.specialenv` directory. This setup allows for secure GitHub operations while maintaining separation from the main environment variables.

## Environment Configuration

### Special Environment (.specialenv/)
- **Location**: `.specialenv/.env`
- **Purpose**: Contains GitHub-specific credentials
- **Security**: Directory is excluded from version control via `.gitignore`

### Environment Variables
When performing GitHub operations, use these environment variables:
- `GITHUB_ACCOUNT`: ales27pm
- `GITHUB_REPO`: native-monGARS
- `GITHUB_TOKEN`: Personal access token for GitHub API

## Usage Guidelines

### When to Use Special Environment
Use the `.specialenv/.env` file ONLY when:
- Performing Git operations (push, pull, clone)
- Making GitHub API calls
- Accessing GitHub-specific features
- Authenticating with GitHub services

### When to Use Default Environment
Use the default environment variables (main `.env` file) for:
- Application runtime configuration
- API keys for other services (OpenAI, Anthropic, etc.)
- General application settings
- Non-GitHub related operations

## Security Best Practices

1. **Never Store Tokens in Regular Files**
   - GitHub tokens should ONLY be in `.specialenv/.env`
   - Never commit tokens to version control
   - Never display tokens in console outputs or UI

2. **Environment Separation**
   - Keep GitHub credentials separate from app credentials
   - Use appropriate environment based on operation type
   - Maintain clear separation of concerns

3. **Access Control**
   - The `.specialenv` directory is git-ignored
   - Only authorized systems should access these credentials
   - Rotate tokens regularly for security

## Implementation Example

```bash
# For GitHub operations
source .specialenv/.env
git remote set-url origin https://${GITHUB_TOKEN}@github.com/${GITHUB_ACCOUNT}/${GITHUB_REPO}.git

# For application operations
source .env
# Use default environment variables
```

## Commit and Push Workflow

1. Configure git credentials
2. Source the special environment
3. Set remote URL with token authentication
4. Perform git operations
5. Clean up sensitive information from memory

This configuration ensures secure GitHub operations while maintaining the integrity of the main application environment.