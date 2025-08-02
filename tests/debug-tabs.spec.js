import { test, expect } from '@playwright/test';

test('Debug tabs rendering', async ({ page }) => {
  // Log console messages
  page.on('console', msg => console.log('Console:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('Page error:', err.message));
  
  await page.goto('/01-basic-components.html');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check if tabs container exists
  const tabsContainer = page.locator('#cards-tabs');
  await expect(tabsContainer).toBeVisible();
  
  // Get the HTML content of tabs
  const tabsHTML = await tabsContainer.innerHTML();
  console.log('Tabs HTML:', tabsHTML);
  
  // Check for nav tabs
  const navTabs = tabsContainer.locator('.bw-nav-tabs');
  const navTabsCount = await navTabs.count();
  console.log('Nav tabs count:', navTabsCount);
  
  // Check for tab buttons
  const tabButtons = tabsContainer.locator('button');
  const buttonCount = await tabButtons.count();
  console.log('Button count:', buttonCount);
  
  // Check for tab content
  const tabContent = tabsContainer.locator('.bw-tab-content');
  const contentCount = await tabContent.count();
  console.log('Tab content count:', contentCount);
  
  // Take screenshot
  await page.screenshot({ path: 'tabs-debug.png', fullPage: true });
});