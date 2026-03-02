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

// Print header with version
function printHeader() {
  const version = getBitwrenchVersion();
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.blue}Bitwrench Test Runner v${version}${colors.reset}`);
  console.log('='.repeat(80) + '\n');
}

// Print footer with version
function printFooter(passRate) {
  const version = getBitwrenchVersion();
  const rateColor = passRate >= 80 ? colors.green : passRate >= 60 ? colors.yellow : colors.red;
  
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}Test Summary - Bitwrench v${version}${colors.reset}`);
  console.log(`${colors.bright}Overall Pass Rate: ${rateColor}${passRate}%${colors.reset}`);
  console.log('='.repeat(80) + '\n');
}

// Parse test results
function parseResults(output, type) {
  let passed = 0;
  let failed = 0;
  let total = 0;
  let coverage = null;

  if (type === 'unit') {
    // Parse mocha/nyc output
    const passMatch = output.match(/(\d+) passing/);
    const failMatch = output.match(/(\d+) failing/);
    
    if (passMatch) passed = parseInt(passMatch[1]);
    if (failMatch) failed = parseInt(failMatch[1]);
    total = passed + failed;
    
    // Parse coverage
    const coverageMatch = output.match(/All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/);
    if (coverageMatch) {
      coverage = {
        statements: parseFloat(coverageMatch[1]),
        branches: parseFloat(coverageMatch[2]),
        functions: parseFloat(coverageMatch[3]),
        lines: parseFloat(coverageMatch[4])
      };
    }
  } else if (type === 'e2e') {
    // Parse playwright output
    const passMatch = output.match(/(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);
    const skipMatch = output.match(/(\d+) skipped/);
    const flakyMatch = output.match(/(\d+) flaky/);
    
    if (passMatch) passed = parseInt(passMatch[1]);
    if (failMatch) failed = parseInt(failMatch[1]);
    if (flakyMatch) failed += parseInt(flakyMatch[1]); // Count flaky as failed
    
    let skipped = 0;
    if (skipMatch) skipped = parseInt(skipMatch[1]);
    
    total = passed + failed + skipped;
  }
  
  return { passed, failed, total, coverage };
}

// Run tests
async function runTests(name, command, type) {
  console.log(`${colors.cyan}Running ${name}...${colors.reset}\n`);
  
  try {
    const { stdout, stderr } = await execAsync(command, { 
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, FORCE_COLOR: '0' } // Disable color for parsing
    });
    
    const output = stdout + stderr;
    const results = parseResults(output, type);
    
    // Show results
    const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
    console.log(`\n${colors.bright}${name} Results:${colors.reset}`);
    console.log(`Total: ${results.total} | ${colors.green}Passed: ${results.passed}${colors.reset} | ${colors.red}Failed: ${results.failed}${colors.reset} | Pass Rate: ${passRate}%`);
    
    if (results.coverage) {
      console.log(`\nCoverage: Statements: ${results.coverage.statements}% | Branches: ${results.coverage.branches}% | Functions: ${results.coverage.functions}% | Lines: ${results.coverage.lines}%`);
    }
    
    return results;
  } catch (error) {
    // Test command failed, try to parse output anyway
    const output = (error.stdout || '') + (error.stderr || '');
    const results = parseResults(output, type);
    
    const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
    console.log(`\n${colors.bright}${name} Results:${colors.reset}`);
    console.log(`Total: ${results.total} | ${colors.green}Passed: ${results.passed}${colors.reset} | ${colors.red}Failed: ${results.failed}${colors.reset} | Pass Rate: ${passRate}%`);
    
    if (results.coverage) {
      console.log(`\nCoverage: Statements: ${results.coverage.statements}% | Branches: ${results.coverage.branches}% | Functions: ${results.coverage.functions}% | Lines: ${results.coverage.lines}%`);
    }
    
    return results;
  }
}

// Main
async function main() {
  printHeader();
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;
  
  // Run unit tests
  console.log('-'.repeat(80));
  const unitResults = await runTests('Unit Tests (Mocha + jsdom)', 'npm test', 'unit');
  totalPassed += unitResults.passed;
  totalFailed += unitResults.failed;
  totalTests += unitResults.total;
  
  // Run E2E tests
  console.log('\n' + '-'.repeat(80));
  const e2eResults = await runTests('E2E Tests (Playwright)', 'npm run test:e2e', 'e2e');
  totalPassed += e2eResults.passed;
  totalFailed += e2eResults.failed;
  totalTests += e2eResults.total;
  
  // Calculate overall pass rate
  const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
  
  printFooter(overallPassRate);
  
  // Exit with appropriate code
  process.exit(totalFailed > 0 ? 1 : 0);
}

// Run
main().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});