const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  
  await page.goto('http://localhost:8083/test-debug.html');
  await page.waitForTimeout(1000);
  
  // Get the output
  const output = await page.locator('#output').textContent();
  console.log('Page output:');
  console.log(output);
  
  // Show console messages
  if (consoleMessages.length > 0) {
    console.log('\nConsole messages:');
    consoleMessages.forEach(msg => {
      console.log(`  ${msg.type}: ${msg.text}`);
    });
  }
  
  await browser.close();
})();