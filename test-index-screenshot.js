import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8081/index.html');
  await page.waitForLoadState('networkidle');
  
  // Take full page screenshot
  await page.screenshot({ 
    path: 'index-page-screenshot.png', 
    fullPage: true 
  });
  
  console.log('Screenshot saved as index-page-screenshot.png');
  
  // Also check specific elements
  const elements = await page.evaluate(() => {
    return {
      heroBackground: window.getComputedStyle(document.querySelector('.bw-hero')).background,
      firstCardHover: window.getComputedStyle(document.querySelector('.bw-card')).transition,
      outlineButtonColor: window.getComputedStyle(document.querySelector('.bw-btn-outline-primary')).color
    };
  });
  
  console.log('Element styles:', elements);
  
  await browser.close();
})();