import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enhanced console logging
  page.on('console', async msg => {
    const args = [];
    for (const arg of msg.args()) {
      try {
        args.push(await arg.jsonValue());
      } catch {
        args.push('<Unable to serialize>');
      }
    }
    
    if (msg.type() === 'error' && msg.text().includes('Failed to load resource')) {
      // Extract URL from error message
      console.log('Resource error message:', msg.text());
      console.log('Error location:', msg.location());
    }
    
    if (msg.type() === 'log' && args.length > 0) {
      console.log('Console log:', ...args);
    }
  });
  
  // Track network
  page.on('response', response => {
    if (response.status() === 404) {
      console.log(`404: ${response.url()}`);
    }
  });
  
  await page.goto('http://localhost:8081/index.html', { waitUntil: 'networkidle' });
  
  // Check if all components rendered properly
  const components = await page.evaluate(() => {
    return {
      hero: document.querySelector('.bw-hero')?.textContent.trim().substring(0, 50),
      sections: document.querySelectorAll('.bw-section').length,
      features: document.querySelectorAll('.bw-feature').length,
      cta: document.querySelector('.bw-cta')?.textContent.trim().substring(0, 50)
    };
  });
  
  console.log('\nRendered components:', components);
  
  await browser.close();
})();