import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Track failed requests
  const failedRequests = [];
  
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()
    });
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`Failed request: ${response.status()} - ${response.url()}`);
    }
  });
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`Console ${msg.type()}: ${msg.text()}`);
  });
  
  try {
    await page.goto('http://localhost:8081/index.html');
    await page.waitForTimeout(2000);
    
    // Check if buttons have outline variant
    const hasOutlineButton = await page.locator('.bw-btn-outline-primary').count();
    console.log('Has outline button:', hasOutlineButton);
    
    // Print all failed requests
    if (failedRequests.length > 0) {
      console.log('\nFailed requests:');
      failedRequests.forEach(req => {
        console.log(`- ${req.url}`);
        console.log(`  Reason: ${req.failure?.errorText}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  await browser.close();
})();