import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log('Page error:', error);
  });
  
  try {
    // Navigate to the correct index page
    await page.goto('http://localhost:8081/index.html');
    
    // Wait a bit for any errors to show
    await page.waitForTimeout(2000);
    
    // Check if hero section rendered
    const heroExists = await page.locator('.bw-hero').count();
    console.log('Hero section exists:', heroExists > 0);
    
    // Check if cards rendered
    const cardCount = await page.locator('.bw-card').count();
    console.log('Number of cards:', cardCount);
    
    // Take screenshot
    await page.screenshot({ path: 'index-debug.png', fullPage: true });
    
    // Check for specific errors
    const errorText = await page.evaluate(() => {
      const body = document.body.innerText;
      if (body.includes('Error') || body.includes('error')) {
        return body;
      }
      return null;
    });
    
    if (errorText) {
      console.log('Error found on page:', errorText);
    }
    
  } catch (error) {
    console.error('Navigation error:', error);
  }
  
  // Keep browser open for inspection
  await page.waitForTimeout(5000);
  await browser.close();
})();