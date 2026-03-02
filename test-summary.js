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
  
  console.log(`${colors.yellow}Running E2E tests...${colors.reset}\n`);
  
  try {
    // Run playwright tests with summary reporter
    const { stdout, stderr } = await execAsync('npx playwright test --reporter=json', { 
      maxBuffer: 10 * 1024 * 1024 
    });
    
    // Parse JSON output
    let results;
    try {
      results = JSON.parse(stdout);
    } catch (e) {
      // If JSON parsing fails, run with list reporter for manual parsing
      const listOutput = await execAsync('npx playwright test --reporter=list', { 
        maxBuffer: 10 * 1024 * 1024 
      });
      
      // Parse from list output
      const output = listOutput.stdout + listOutput.stderr;
      console.log(output);
      
      // Extract numbers
      const passMatch = output.match(/(\d+) passed/);
      const failMatch = output.match(/(\d+) failed/);
      const skipMatch = output.match(/(\d+) skipped/);
      const flakyMatch = output.match(/(\d+) flaky/);
      
      const passed = passMatch ? parseInt(passMatch[1]) : 0;
      const failed = failMatch ? parseInt(failMatch[1]) : 0;
      const skipped = skipMatch ? parseInt(skipMatch[1]) : 0;
      const flaky = flakyMatch ? parseInt(flakyMatch[1]) : 0;
      
      const total = passed + failed + skipped + flaky;
      const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
      
      console.log('\n' + '='.repeat(80));
      console.log(`${colors.bright}Test Results Summary${colors.reset}`);
      console.log('='.repeat(80) + '\n');
      
      console.log(`Total Tests: ${total}`);
      console.log(`${colors.green}✓ Passed: ${passed}${colors.reset}`);
      console.log(`${colors.red}✗ Failed: ${failed}${colors.reset}`);
      if (skipped > 0) console.log(`${colors.yellow}⊘ Skipped: ${skipped}${colors.reset}`);
      if (flaky > 0) console.log(`${colors.yellow}⚡ Flaky: ${flaky}${colors.reset}`);
      console.log(`\n${colors.bright}Pass Rate: ${passRate}%${colors.reset}`);
      
      console.log('\n' + '='.repeat(80));
      console.log(`${colors.bright}${colors.blue}Bitwrench v${version} - Test Complete${colors.reset}`);
      console.log('='.repeat(80) + '\n');
      
      process.exit(failed > 0 ? 1 : 0);
    }
    
    // Process JSON results
    if (results && results.stats) {
      const { expected, unexpected, flaky, skipped } = results.stats;
      const total = expected + unexpected + flaky + skipped;
      const passRate = total > 0 ? ((expected / total) * 100).toFixed(1) : 0;
      
      console.log('\n' + '='.repeat(80));
      console.log(`${colors.bright}Test Results Summary${colors.reset}`);
      console.log('='.repeat(80) + '\n');
      
      console.log(`Total Tests: ${total}`);
      console.log(`${colors.green}✓ Passed: ${expected}${colors.reset}`);
      console.log(`${colors.red}✗ Failed: ${unexpected}${colors.reset}`);
      if (flaky > 0) console.log(`${colors.yellow}⚡ Flaky: ${flaky}${colors.reset}`);
      if (skipped > 0) console.log(`${colors.yellow}⊘ Skipped: ${skipped}${colors.reset}`);
      console.log(`\n${colors.bright}Pass Rate: ${passRate}%${colors.reset}`);
      
      console.log('\n' + '='.repeat(80));
      console.log(`${colors.bright}${colors.blue}Bitwrench v${version} - Test Complete${colors.reset}`);
      console.log('='.repeat(80) + '\n');
      
      process.exit(unexpected > 0 ? 1 : 0);
    }
    
  } catch (error) {
    // Tests failed, but we still want to show summary
    const output = error.stdout || '' + error.stderr || '';
    console.log(output);
    
    // Try to extract summary
    const lines = output.split('\n');
    const summaryLine = lines.find(line => line.includes('failed') || line.includes('passed'));
    
    if (summaryLine) {
      console.log('\n' + '='.repeat(80));
      console.log(`${colors.bright}Test Summary${colors.reset}`);
      console.log('='.repeat(80));
      console.log(summaryLine);
      console.log('\n' + '='.repeat(80));
      console.log(`${colors.bright}${colors.blue}Bitwrench v${version} - Test Complete${colors.reset}`);
      console.log('='.repeat(80) + '\n');
    }
    
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});