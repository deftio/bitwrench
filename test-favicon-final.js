import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ 
    // Disable cache
    bypassCSP: true,
    ignoreHTTPSErrors: true,
    serviceWorkers: 'block'
  });
  const page = await context.newPage();
  
  let faviconFound = false;
  let errorFound = false;
  
  // Track responses
  page.on('response', response => {
    const url = response.url();
    if (url.includes('favicon.ico')) {
      console.log(`Favicon request: ${url} - Status: ${response.status()}`);
      faviconFound = true;
    }
  });
  
  // Track console errors
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('Failed to load resource')) {
      console.log('Error:', msg.text());
      errorFound = true;
    }
  });
  
  // Force reload with no cache
  await page.goto('http://localhost:8081/index.html', { 
    waitUntil: 'networkidle',
    bypassCSP: true 
  });
  
  await page.waitForTimeout(2000);
  
  console.log('\nSummary:');
  console.log('- Favicon requested:', faviconFound);
  console.log('- Resource errors:', errorFound);
  
  await browser.close();
})();