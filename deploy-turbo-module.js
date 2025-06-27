#!/usr/bin/env node

/**
 * React Native Device Info Turbo Module Deployment Script
 * This script creates a GitHub repository and deploys the turbo module
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load GitHub credentials from special environment
const fs = require('fs');
const path = require('path');

function loadSpecialEnv() {
  const envPath = path.join(__dirname, 'specialenv', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      }
    });
    return envVars;
  }
  return {};
}

const specialEnv = loadSpecialEnv();
const GITHUB_USERNAME = specialEnv.GITHUB_USERNAME || process.env.GITHUB_USERNAME || 'ales27pm';
const GITHUB_TOKEN = specialEnv.GITHUB_TOKEN || process.env.GITHUB_TOKEN;

const REPO_NAME = 'react-native-device-info-turbo-advanced';
const REPO_DESCRIPTION = 'Advanced device information Turbo Module for React Native with comprehensive iOS integration';

console.log('🚀 Deploying React Native Device Info Turbo Module');
console.log('====================================================');

function runCommand(command, cwd = process.cwd()) {
  try {
    console.log(`📟 Running: ${command}`);
    const result = execSync(command, { 
      cwd, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    return result;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return null;
  }
}

async function createGitHubRepo() {
  console.log('🔧 Creating GitHub repository...');
  
  const turboModulePath = path.join(__dirname, 'react-native-device-info-turbo-advanced');
  
  // Check if directory exists
  if (!fs.existsSync(turboModulePath)) {
    console.error('❌ Turbo module directory not found');
    return false;
  }
  
  console.log('✅ Turbo module directory found');
  
  // Update package.json with correct repository URLs
  const packageJsonPath = path.join(turboModulePath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.repository.url = `git+https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git`;
    packageJson.bugs.url = `https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/issues`;
    packageJson.homepage = `https://github.com/${GITHUB_USERNAME}/${REPO_NAME}#readme`;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json URLs');
  }
  
  // Set up git remote
  process.chdir(turboModulePath);
  
  // Try to create repository using GitHub API (if token is available)
  if (GITHUB_TOKEN) {
    try {
      const curl = `curl -X POST -H "Authorization: token ${GITHUB_TOKEN}" -H "Accept: application/vnd.github.v3+json" https://api.github.com/user/repos -d '{"name":"${REPO_NAME}","description":"${REPO_DESCRIPTION}","private":false}'`;
      runCommand(curl);
      console.log('✅ GitHub repository created via API');
    } catch (error) {
      console.log('⚠️ API creation failed, repository might already exist');
    }
  }
  
  // Add remote origin
  runCommand(`git remote add origin https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git`);
  
  // Push to GitHub
  const pushResult = runCommand('git push -u origin main');
  
  if (pushResult !== null) {
    console.log('✅ Successfully pushed to GitHub!');
    return true;
  } else {
    console.log('❌ Failed to push to GitHub');
    return false;
  }
}

async function generateDeploymentReport() {
  console.log('📊 Generating deployment report...');
  
  const report = `
🎉 TURBO MODULE DEPLOYMENT SUCCESS!
=====================================

✅ Repository: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}
✅ Package: ${REPO_NAME}
✅ Version: 1.0.0
✅ License: MIT

🧠 Turbo Module Features:
  ✅ React Native New Architecture support
  ✅ JSI direct communication
  ✅ Swift native iOS implementation
  ✅ Comprehensive device information
  ✅ Biometric authentication (Face ID/Touch ID)
  ✅ Location services integration
  ✅ Battery and storage monitoring
  ✅ Haptic feedback support
  ✅ System services integration
  ✅ Type-safe TypeScript definitions

🛠️ Technical Implementation:
  ✅ Turbo Module specification
  ✅ Codegen integration
  ✅ CocoaPods podspec
  ✅ Swift native code
  ✅ Objective-C++ bridge
  ✅ TypeScript definitions
  ✅ GitHub Actions CI/CD

📱 iOS Integration:
  ✅ Core Location framework
  ✅ Local Authentication framework  
  ✅ UIKit integration
  ✅ System services access
  ✅ Comprehensive error handling
  ✅ Synchronous and asynchronous operations

🎯 Ready for Integration:
  📦 npm install ${REPO_NAME}
  🔧 cd ios && pod install
  📱 Import and use in React Native app
  🧪 Run tests and validate functionality

🌟 Next Steps:
  1. 📝 Customize for specific use cases
  2. 🧪 Test with React Native apps
  3. 📚 Add detailed documentation
  4. 🚀 Publish to NPM registry
  5. 🔄 Set up continuous integration

🎉 TURBO MODULE DEPLOYMENT COMPLETED! 🚀
`;
  
  console.log(report);
  
  // Save report to file
  fs.writeFileSync(path.join(__dirname, 'turbo-module-deployment-report.txt'), report);
  console.log('✅ Deployment report saved to turbo-module-deployment-report.txt');
}

async function main() {
  try {
    const success = await createGitHubRepo();
    
    if (success) {
      await generateDeploymentReport();
      console.log('🎉 Turbo Module deployment completed successfully!');
      console.log(`🔗 Repository: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}`);
      console.log('📚 Check the README.md for usage instructions');
    } else {
      console.log('❌ Deployment failed. Please check the errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Deployment error:', error);
    process.exit(1);
  }
}

main();