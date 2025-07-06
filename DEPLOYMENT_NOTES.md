# Core ML Native Service Transition

## Changes Made
- Transitioned core-ml-service.ts from dev-llm-service to native-llm-service
- Enhanced GitHub Actions workflow for production-ready CI/CD
- Enabled true on-device AI processing with Core ML

Date: 2025-07-06T18:05:41.235Z

# Workflow CI Fix

## Changes Made
- Corrected iOS Simulator destination in core-ml-build.yml from OS:latest to OS:17.5.
- Added jest-junit dependency for test reporting.
- Improved Pod install step with pod repo update.

## Impact
- Resolves the primary blocker in the CI pipeline, allowing iOS native tests to run.
- Ensures stable and repeatable builds in the GitHub Actions environment.

Date: 2025-07-06T18:35:12.934Z
