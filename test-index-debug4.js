import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const errors = [];
  
  // Capture network errors
  page.on('requestfailed', request => {
    errors.push({
      type: 'requestfailed',
      url: request.url(),
      failure: request.failure()
    });
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      errors.push({
        type: 'response',
        status: response.status(),
        url: response.url()
      });
    }
  });
  
  // Navigate
  await page.goto('http://localhost:8081/index.html', { waitUntil: 'networkidle' });
  
  // Print all errors
  console.log('\nAll errors found:');
  errors.forEach(err => {
    console.log(JSON.stringify(err, null, 2));
  });
  
  // Check if page is functional despite error
  const isPageFunctional = await page.evaluate(() => {
    // Try clicking a button
    const btn = document.querySelector('.bw-btn-primary');
    if (btn) {
      try {
        // Create a flag to see if click handler works
        let clicked = false;
        const originalOnclick = btn.onclick;
        btn.onclick = () => { 
          clicked = true; 
          if (originalOnclick) originalOnclick();
        };
        btn.click();
        btn.onclick = originalOnclick; // restore
        return clicked;
      } catch (e) {
        return false;
      }
    }
    return false;
  });
  
  console.log('\nIs page functional (button clicks work)?', isPageFunctional);
  
  await browser.close();
})();