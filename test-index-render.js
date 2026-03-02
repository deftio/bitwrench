const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Start server and navigate
  await page.goto('http://localhost:8081/index.html');
  
  // Take screenshot
  await page.screenshot({ path: 'index-screenshot.png', fullPage: true });
  
  // Check if CSS is loaded
  const hasStyles = await page.evaluate(() => {
    const card = document.querySelector('.card');
    if (!card) return false;
    const styles = window.getComputedStyle(card);
    return styles.borderRadius !== '0px';
  });
  
  console.log('Has Bootstrap styles:', hasStyles);
  
  // Check what's rendered
  const content = await page.evaluate(() => {
    return {
      title: document.querySelector('h1')?.textContent,
      cards: document.querySelectorAll('.card').length,
      buttons: document.querySelectorAll('.btn').length,
      hasContainer: !!document.querySelector('.container')
    };
  });
  
  console.log('Page content:', content);
  
  await browser.close();
})();