import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  let faviconStatus = null;
  
  // Track network requests
  page.on('response', response => {
    if (response.url().includes('favicon.ico')) {
      faviconStatus = {
        url: response.url(),
        status: response.status(),
        ok: response.ok()
      };
    }
  });
  
  await page.goto('http://localhost:8081/index.html');
  await page.waitForTimeout(1000);
  
  console.log('Favicon request:', faviconStatus);
  
  await browser.close();
})();