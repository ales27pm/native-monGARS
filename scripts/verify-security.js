#!/usr/bin/env node

/**
 * Security Verification Script
 * 
 * Verifies that sensitive information is not exposed in the codebase
 */

const fs = require('fs');
const path = require('path');

// Patterns to search for (potential security issues)
const SENSITIVE_PATTERNS = [
  /ghp_[a-zA-Z0-9]{36}/g,  // GitHub personal access tokens
  /\bGITHUB_TOKEN\s*[:=]\s*['"][^'"]*['"]/g,  // GitHub token assignments
  /ales27pm.*token/gi,  // Any mention of the account with token
];

// Files and directories to ignore
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'specialenv',  // This should be ignored!
  '.expo',
  'dist',
  'build',
  'scripts/verify-security.js',  // This file itself
];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const violations = [];
    
    SENSITIVE_PATTERNS.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          violations.push({
            file: filePath,
            pattern: index,
            match: match.substring(0, 20) + '...', // Truncate for security
            line: content.substring(0, content.indexOf(match)).split('\n').length
          });
        });
      }
    });
    
    return violations;
  } catch (error) {
    console.warn(`Could not scan file ${filePath}:`, error.message);
    return [];
  }
}

function scanDirectory(dirPath) {
  let allViolations = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      
      if (shouldIgnore(itemPath)) {
        continue;
      }
      
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        allViolations = allViolations.concat(scanDirectory(itemPath));
      } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.json') || item.endsWith('.md'))) {
        allViolations = allViolations.concat(scanFile(itemPath));
      }
    }
  } catch (error) {
    console.warn(`Could not scan directory ${dirPath}:`, error.message);
  }
  
  return allViolations;
}

function main() {
  console.log('🔍 Scanning codebase for sensitive information...\n');
  
  const projectRoot = path.resolve(__dirname, '..');
  const violations = scanDirectory(projectRoot);
  
  if (violations.length === 0) {
    console.log('✅ Security scan completed successfully!');
    console.log('   No sensitive information found in tracked files.');
    console.log('   The specialenv directory is properly ignored.');
  } else {
    console.log('❌ Security violations found:\n');
    
    violations.forEach((violation, index) => {
      console.log(`${index + 1}. File: ${violation.file}`);
      console.log(`   Line: ${violation.line}`);
      console.log(`   Pattern: ${violation.match}`);
      console.log('');
    });
    
    console.log('⚠️  Please remove sensitive information from tracked files!');
    process.exit(1);
  }
  
  // Verify specialenv exists and is ignored
  const specialenvPath = path.join(projectRoot, 'specialenv');
  if (fs.existsSync(specialenvPath)) {
    console.log('✅ specialenv directory exists and contains credentials');
  } else {
    console.log('❌ specialenv directory not found!');
    process.exit(1);
  }
  
  // Verify .gitignore contains specialenv
  const gitignorePath = path.join(projectRoot, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (gitignoreContent.includes('specialenv')) {
      console.log('✅ specialenv is properly ignored in .gitignore');
    } else {
      console.log('❌ specialenv not found in .gitignore!');
      process.exit(1);
    }
  }
  
  console.log('\n🛡️  Security verification completed successfully!');
}

if (require.main === module) {
  main();
}

module.exports = { scanDirectory, scanFile };