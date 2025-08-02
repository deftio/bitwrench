import { test, expect } from '@playwright/test';

test('Debug tab clicking', async ({ page }) => {
  // Log console messages
  page.on('console', msg => console.log('Console:', msg.type(), msg.text()));
  
  await page.goto('/01-basic-components.html');
  await page.waitForLoadState('networkidle');
  
  // Get initial state
  const resultTab = page.locator('#cards-tabs .bw-nav-link:has-text("Result")');
  const codeTab = page.locator('#cards-tabs .bw-nav-link:has-text("Code")');
  
  console.log('Initial Result tab classes:', await resultTab.getAttribute('class'));
  console.log('Initial Code tab classes:', await codeTab.getAttribute('class'));
  
  // Click Code tab
  await codeTab.click();
  await page.waitForTimeout(500); // Wait for any animations
  
  console.log('After click Result tab classes:', await resultTab.getAttribute('class'));
  console.log('After click Code tab classes:', await codeTab.getAttribute('class'));
  
  // Check tab panes
  const resultPane = page.locator('#cards-tabs .bw-tab-pane').first();
  const codePane = page.locator('#cards-tabs .bw-tab-pane').nth(1);
  
  console.log('Result pane classes:', await resultPane.getAttribute('class'));
  console.log('Code pane classes:', await codePane.getAttribute('class'));
  
  // Check if code content is visible
  const codeContent = codePane.locator('pre code');
  console.log('Code content visible:', await codeContent.isVisible());
});