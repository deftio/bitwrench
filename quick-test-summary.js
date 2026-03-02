#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Get Bitwrench version
function getBitwrenchVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
  } catch (e) {
    return 'unknown';
  }
}

async function main() {
  const version = getBitwrenchVersion();
  
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.blue}Bitwrench Test Summary v${version}${colors.reset}`);
  console.log('='.repeat(80) + '\n');
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;
  
  // Run unit tests
  console.log(`${colors.cyan}Running Unit Tests...${colors.reset}`);
  try {
    const { stdout, stderr } = await execAsync('npm test', { 
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, FORCE_COLOR: '0' }
    });
    
    const output = stdout + stderr;
    const passMatch = output.match(/(\d+) passing/);
    const failMatch = output.match(/(\d+) failing/);
    
    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    const total = passed + failed;
    
    totalPassed += passed;
    totalFailed += failed;
    totalTests += total;
    
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    console.log(`Unit Tests: ${total} total | ${colors.green}${passed} passed${colors.reset} | ${colors.red}${failed} failed${colors.reset} | ${passRate}% pass rate`);
    
    // Check for coverage
    const coverageMatch = output.match(/All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/);
    if (coverageMatch) {
      console.log(`Coverage: Statements ${coverageMatch[1]}% | Branches ${coverageMatch[2]}% | Functions ${coverageMatch[3]}% | Lines ${coverageMatch[4]}%`);
    }
  } catch (error) {
    console.log(`${colors.red}Unit tests failed to run${colors.reset}`);
  }
  
  // Run E2E tests (with shorter timeout)
  console.log(`\n${colors.cyan}Checking E2E Test Status...${colors.reset}`);
  try {
    // First try to get quick status
    const { stdout } = await execAsync('npx playwright test --list', { 
      maxBuffer: 1024 * 1024,
      timeout: 5000
    });
    
    const testCount = stdout.split('\n').filter(line => line.trim()).length - 1;
    console.log(`E2E Tests: ${testCount} tests found`);
    console.log(`${colors.yellow}Note: Run 'npm run test:e2e' separately to execute E2E tests${colors.reset}`);
    
    // Show last E2E run results if available
    if (fs.existsSync('test-results/.last-run.json')) {
      try {
        const lastRun = JSON.parse(fs.readFileSync('test-results/.last-run.json', 'utf8'));
        const { passed, failed, timedOut, skipped } = lastRun;
        const e2eTotal = passed + failed + timedOut + skipped;
        const e2ePassRate = e2eTotal > 0 ? ((passed / e2eTotal) * 100).toFixed(1) : 0;
        
        console.log(`Last E2E run: ${e2eTotal} total | ${colors.green}${passed} passed${colors.reset} | ${colors.red}${failed} failed${colors.reset} | ${e2ePassRate}% pass rate`);
        
        totalPassed += passed;
        totalFailed += failed + timedOut;
        totalTests += e2eTotal;
      } catch (e) {
        // Ignore if can't read last run
      }
    }
  } catch (error) {
    console.log(`${colors.yellow}E2E tests not available${colors.reset}`);
  }
  
  // Overall summary
  const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
  
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}Overall Summary - Bitwrench v${version}${colors.reset}`);
  console.log(`Total Tests: ${totalTests} | ${colors.green}Passed: ${totalPassed}${colors.reset} | ${colors.red}Failed: ${totalFailed}${colors.reset}`);
  console.log(`${colors.bright}Overall Pass Rate: ${overallPassRate}%${colors.reset}`);
  console.log('='.repeat(80) + '\n');
  
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error(`${colors.red}Error:${colors.reset}`, error.message);
  process.exit(1);
});