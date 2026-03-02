import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Track all network requests
  page.on('response', response => {
    const url = response.url();
    if (response.status() === 404) {
      console.log(`404 Error: ${url}`);
    }
  });
  
  // Check console errors in detail
  page.on('console', async msg => {
    if (msg.type() === 'error') {
      const args = await Promise.all(msg.args().map(arg => arg.jsonValue()));
      console.log('Console error details:', args);
    }
  });
  
  // Navigate
  await page.goto('http://localhost:8081/index.html');
  await page.waitForTimeout(2000);
  
  // Check page structure
  const pageStructure = await page.evaluate(() => {
    return {
      hasHero: !!document.querySelector('.bw-hero'),
      heroClasses: document.querySelector('.bw-hero')?.className,
      cardCount: document.querySelectorAll('.bw-card').length,
      hasOutlineBtn: !!document.querySelector('.bw-btn-outline-primary'),
      outlineBtnStyle: window.getComputedStyle(document.querySelector('.bw-btn-outline-primary')).backgroundColor
    };
  });
  
  console.log('Page structure:', pageStructure);
  
  await browser.close();
})();