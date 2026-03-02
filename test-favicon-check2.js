import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const requests = [];
  
  // Track all requests
  page.on('response', response => {
    const url = response.url();
    if (url.includes('favicon') || url.includes('.ico')) {
      requests.push({
        url: url,
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });
  
  // Also check for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  await page.goto('http://localhost:8081/index.html');
  await page.waitForTimeout(2000);
  
  console.log('Favicon requests:', requests);
  
  // Check if favicon link exists in DOM
  const faviconLink = await page.evaluate(() => {
    const link = document.querySelector('link[rel="icon"]');
    return link ? link.href : null;
  });
  
  console.log('Favicon link in DOM:', faviconLink);
  
  await browser.close();
})();