#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

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

// Print header
function printHeader() {
  const version = getBitwrenchVersion();
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.blue}Bitwrench Test Suite v${version}${colors.reset}`);
  console.log('='.repeat(80) + '\n');
}

// Print section header
function printSection(title) {
  console.log(`\n${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log('-'.repeat(title.length));
}

// Parse test results from output
function parseTestResults(output, type) {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  
  if (type === 'mocha') {
    // Parse mocha output
    const passMatch = output.match(/(\d+) passing/);
    const failMatch = output.match(/(\d+) failing/);
    const skipMatch = output.match(/(\d+) pending/);
    
    if (passMatch) passed = parseInt(passMatch[1]);
    if (failMatch) failed = parseInt(failMatch[1]);
    if (skipMatch) skipped = parseInt(skipMatch[1]);
  } else if (type === 'playwright') {
    // Parse playwright output
    const passMatch = output.match(/(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);
    const skipMatch = output.match(/(\d+) skipped/);
    const flakyMatch = output.match(/(\d+) flaky/);
    
    if (passMatch) passed = parseInt(passMatch[1]);
    if (failMatch) failed = parseInt(failMatch[1]);
    if (skipMatch) skipped = parseInt(skipMatch[1]);
    if (flakyMatch) failed += parseInt(flakyMatch[1]); // Count flaky as failed
  }
  
  return { passed, failed, skipped, total: passed + failed + skipped };
}

// Parse coverage from nyc output
function parseCoverage(output) {
  const coverage = {};
  
  // Look for coverage table
  const lines = output.split('\n');
  let inCoverageTable = false;
  
  for (const line of lines) {
    if (line.includes('------------|---------|----------|---------|---------|')) {
      inCoverageTable = true;
      continue;
    }
    
    if (inCoverageTable && line.includes('All files')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 5) {
        coverage.statements = parseFloat(parts[1]);
        coverage.branches = parseFloat(parts[2]);
        coverage.functions = parseFloat(parts[3]);
        coverage.lines = parseFloat(parts[4]);
      }
      break;
    }
  }
  
  return coverage;
}

// Run a test command
async function runTest(name, command, type) {
  printSection(name);
  
  try {
    const { stdout, stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
    const output = stdout + stderr;
    
    // Print the output
    console.log(output);
    
    // Parse results
    const results = parseTestResults(output, type);
    
    // Parse coverage if available
    let coverage = null;
    if (type === 'mocha' && output.includes('Coverage')) {
      coverage = parseCoverage(output);
    }
    
    return { name, results, coverage, success: results.failed === 0 };
  } catch (error) {
    console.error(`${colors.red}Error running ${name}:${colors.reset}`, error.message);
    
    // Try to parse results from error output
    const output = error.stdout || '' + error.stderr || '';
    const results = parseTestResults(output, type);
    
    return { name, results, coverage: null, success: false };
  }
}

// Print summary
function printSummary(testRuns) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}Test Summary${colors.reset}`);
  console.log('='.repeat(80) + '\n');
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  
  // Individual test summaries
  testRuns.forEach(run => {
    const { name, results, coverage } = run;
    const status = results.failed === 0 ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
    
    console.log(`${status} ${name}`);
    console.log(`  Tests: ${colors.green}${results.passed} passed${colors.reset}, ${colors.red}${results.failed} failed${colors.reset}, ${colors.yellow}${results.skipped} skipped${colors.reset}, ${results.total} total`);
    
    if (coverage && Object.keys(coverage).length > 0) {
      console.log(`  Coverage: Statements ${coverage.statements}% | Branches ${coverage.branches}% | Functions ${coverage.functions}% | Lines ${coverage.lines}%`);
    }
    console.log();
    
    totalPassed += results.passed;
    totalFailed += results.failed;
    totalSkipped += results.skipped;
  });
  
  // Overall summary
  const totalTests = totalPassed + totalFailed + totalSkipped;
  const passPercentage = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
  
  console.log('-'.repeat(80));
  console.log(`${colors.bright}Overall Results:${colors.reset}`);
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  ${colors.green}Passed: ${totalPassed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${totalFailed}${colors.reset}`);
  console.log(`  ${colors.yellow}Skipped: ${totalSkipped}${colors.reset}`);
  console.log(`  ${colors.bright}Pass Rate: ${passPercentage}%${colors.reset}`);
  
  // Footer with version
  const version = getBitwrenchVersion();
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.blue}Bitwrench v${version} - Test Run Complete${colors.reset}`);
  console.log('='.repeat(80) + '\n');
  
  // Exit with appropriate code
  process.exit(totalFailed > 0 ? 1 : 0);
}

// Main execution
async function main() {
  printHeader();
  
  const testRuns = [];
  
  // Run unit tests with coverage
  console.log(`${colors.yellow}Running unit tests with coverage...${colors.reset}`);
  testRuns.push(await runTest('Unit Tests (Mocha + jsdom)', 'npm test', 'mocha'));
  
  // Run E2E tests
  console.log(`\n${colors.yellow}Running E2E tests...${colors.reset}`);
  testRuns.push(await runTest('E2E Tests (Playwright)', 'npm run test:e2e', 'playwright'));
  
  // Print summary
  printSummary(testRuns);
}

// Run the tests
main().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});