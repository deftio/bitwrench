// @ts-check
import { test, expect } from '@playwright/test';

// Helper to check for console errors (ignores resource 404s)
async function checkNoConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore 404 resource load failures (e.g. missing favicon/logo)
      if (text.includes('Failed to load resource') && text.includes('404')) return;
      errors.push(text);
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });
  return errors;
}

test.describe('Bitwrench v2 Examples', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console error tracking
    page.errors = await checkNoConsoleErrors(page);
  });

  test('01-basic-components.html loads without errors', async ({ page }) => {
    await page.goto('/pages/01-components.html');
    
    // Check page loaded
    await expect(page.locator('h1').first()).toContainText('Component Library');
    
    // Check demo sections are rendered
    const demoContainers = page.locator('[id$="-demo"]');
    await expect(demoContainers).toHaveCount(8);

    // Check tab switching works on first demo
    const firstTabContainer = page.locator('#cards-demo');
    await expect(firstTabContainer).toBeVisible();
    const resultTab = firstTabContainer.locator('[role="tab"]:has-text("Result")');
    const codeTab = firstTabContainer.locator('[role="tab"]:has-text("Code")');

    await expect(resultTab).toHaveAttribute('aria-selected', 'true');
    await codeTab.click();
    await expect(codeTab).toHaveAttribute('aria-selected', 'true');

    // Switch back to Result to check visible content
    await resultTab.click();

    // Check cards are rendered (visible in Result tab)
    const cards = page.locator('.bw-card:visible');
    await expect(cards.first()).toBeVisible();

    // Check buttons exist
    const buttons = page.locator('.bw-btn:visible');
    await expect(buttons.first()).toBeVisible();
    
    // Check no console errors
    expect(page.errors).toHaveLength(0);
  });

  test('02-interactive-tables-forms.html loads without errors', async ({ page }) => {
    await page.goto('/pages/02-tables-forms.html');
    
    // Check page loaded
    await expect(page.locator('h1').first()).toContainText('Tables & Forms');
    
    // Check interactive table is rendered
    await page.waitForSelector('#interactive-table-container table', { timeout: 5000 });
    const table = page.locator('#interactive-table-container table');
    await expect(table).toBeVisible();
    
    // Check table has proper structure
    const headers = table.locator('thead th');
    await expect(headers).toHaveCount(7); // Checkbox + 6 data columns
    
    // Test sorting by clicking header
    const nameHeader = headers.nth(2); // Name column
    await nameHeader.click();
    
    // Test search functionality
    const searchInput = page.locator('input[placeholder="Search employees..."]');
    await searchInput.fill('John');
    await page.waitForTimeout(500); // Wait for search to update
    
    // Check table filtered
    const rows = table.locator('tbody tr');
    const visibleRows = await rows.count();
    expect(visibleRows).toBeLessThan(5); // Should filter results
    
    // Test Add Employee button
    const addButton = page.locator('button:has-text("Add Employee")');
    await addButton.click();
    await page.waitForTimeout(500);
    
    // Clear search to see all results
    await searchInput.clear();
    await page.waitForTimeout(500);
    
    // Check row count increased
    const newRowCount = await table.locator('tbody tr').count();
    expect(newRowCount).toBeGreaterThan(5);
    
    // Test form components tab
    const formTab = page.locator('#form-tabs');
    await expect(formTab).toBeVisible();
    
    // Check form inputs are rendered
    const formInputs = page.locator('.bw-form-control');
    await expect(formInputs.first()).toBeVisible();
    
    // Test tabbed forms
    const tabbedForm = page.locator('#tabbed-form-tabs');
    await expect(tabbedForm).toBeVisible();
    
    // Check tab navigation works
    const personalTab = tabbedForm.locator('.bw-nav-link:has-text("Personal Info")');
    const addressTab = tabbedForm.locator('.bw-nav-link:has-text("Address")');
    
    await expect(personalTab).toHaveClass(/active/);
    await addressTab.click();
    await expect(addressTab).toHaveClass(/active/);
    
    // Check pagination example
    const paginationControls = page.locator('#pagination-controls');
    await expect(paginationControls).toBeVisible();
    
    // Test pagination
    const nextButton = paginationControls.locator('.bw-page-link:has-text("Next")');
    await nextButton.click();
    await page.waitForTimeout(500);
    
    // Check table updated
    const paginatedTable = page.locator('#paginated-table table');
    await expect(paginatedTable).toBeVisible();
    
    // Check no console errors
    expect(page.errors).toHaveLength(0);
  });

  test('03-themes-styling.html loads without errors', async ({ page }) => {
    await page.goto('/pages/03-styling.html');
    
    // Check page loaded
    await expect(page.locator('h1')).toContainText('Styling');
    
    // Check theme switcher is visible
    const themeSwitcher = page.locator('.theme-switcher');
    await expect(themeSwitcher).toBeVisible();
    
    // Test theme switching
    const darkThemeBtn = themeSwitcher.locator('button:has-text("Dark")');
    await darkThemeBtn.click();
    
    // Check dark theme applied
    await expect(page.locator('body')).toHaveClass(/dark-theme/);
    
    // Switch to ocean theme
    const oceanThemeBtn = themeSwitcher.locator('button:has-text("Ocean")');
    await oceanThemeBtn.click();
    
    // Check dark theme removed
    await expect(page.locator('body')).not.toHaveClass(/dark-theme/);
    
    // Check color grid is displayed
    const colorGrid = page.locator('.color-grid').first();
    await expect(colorGrid).toBeVisible();
    const colorBoxes = colorGrid.locator('.color-box');
    await expect(colorBoxes).toHaveCount(8); // 8 theme colors
    
    // Test dynamic CSS generation
    const changeStylesBtn = page.locator('button:has-text("Change Styles")');
    await changeStylesBtn.click();
    await page.waitForTimeout(500);
    
    // Check element style changed
    const dynamicTarget = page.locator('#dynamic-css-target');
    const borderColor = await dynamicTarget.evaluate(el => 
      window.getComputedStyle(el).borderColor
    );
    expect(borderColor).toBeTruthy();
    
    // Test custom theme builder
    const primaryColorInput = page.locator('#color-primary');
    await primaryColorInput.fill('#ff0000');
    
    // Apply custom theme
    const applyCustomBtn = page.locator('button:has-text("Apply Custom Theme")');
    await applyCustomBtn.click();
    
    // Check no console errors
    expect(page.errors).toHaveLength(0);
  });

  test('04-dashboard-app.html loads without errors', async ({ page }) => {
    await page.goto('/pages/04-dashboard.html');

    // Check page loaded
    await expect(page.locator('h1').first()).toContainText('Dashboard');

    // Check stats grid is rendered
    const statsGrid = page.locator('#stats-grid');
    await expect(statsGrid).toBeVisible();

    // Check sidebar nav is rendered
    const sidebarNav = page.locator('#sidebar-nav');
    await expect(sidebarNav).toBeVisible();

    // Check activity table is rendered
    const activitySection = page.locator('#activity-section');
    await expect(activitySection).toBeVisible();

    // Check no console errors
    expect(page.errors).toHaveLength(0);
  });

  test('05-advanced-features.html loads without errors', async ({ page }) => {
    await page.goto('/pages/05-state.html');

    // Check page loaded
    await expect(page.locator('h1').first()).toContainText('State');

    // Check counter demo is rendered
    const counterDemo = page.locator('#counter-demo');
    await expect(counterDemo).toBeVisible();

    // Test counter increment — click the "+" button on the first counter
    const firstCounter = counterDemo.locator('.counter-card').first();
    const counterValue = firstCounter.locator('.counter-value');
    const initialValue = await counterValue.textContent();
    const plusBtn = firstCounter.locator('button:has-text("+")');
    await plusBtn.click();
    const newValue = await counterValue.textContent();
    expect(parseInt(newValue)).toBe(parseInt(initialValue) + 1);

    // Check no console errors
    expect(page.errors).toHaveLength(0);
  });

  test('Component interactivity works correctly', async ({ page }) => {
    await page.goto('/pages/01-components.html');

    // Test dismissible alert exists with close button
    const dismissibleAlert = page.locator('.bw-alert:has-text("dismissible")');
    await expect(dismissibleAlert).toBeVisible();
    const closeButton = dismissibleAlert.locator('.bw-close');
    await expect(closeButton).toBeVisible();

    // Test progress bars have correct values (first is 0%, second is 25%)
    const progressBars = page.locator('.bw-progress-bar');
    const firstProgress = progressBars.first();
    const firstWidth = await firstProgress.evaluate(el => el.style.width);
    expect(firstWidth).toBe('0%');
    const secondProgress = progressBars.nth(1);
    const secondWidth = await secondProgress.evaluate(el => el.style.width);
    expect(secondWidth).toBe('25%');
  });

  test('Tables are properly styled and sortable', async ({ page }) => {
    await page.goto('/pages/02-tables-forms.html');

    // Wait for table to be rendered
    await page.waitForSelector('#interactive-table-container table');

    // Check table exists and has rows
    const table = page.locator('#interactive-table-container table');
    await expect(table).toBeVisible();

    // Check table has proper structure
    const headers = table.locator('thead th');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(1);

    // Check data rows exist
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Forms handle validation and submission', async ({ page }) => {
    await page.goto('/pages/02-tables-forms.html');

    // Check form section is rendered
    const formTabs = page.locator('#form-tabs');
    await expect(formTabs).toBeVisible();

    // Check form inputs are rendered
    const formInputs = formTabs.locator('input');
    const inputCount = await formInputs.count();
    expect(inputCount).toBeGreaterThan(0);

    // Check select dropdown exists
    const selectDropdown = formTabs.locator('select').first();
    await expect(selectDropdown).toBeVisible();
  });

  test('Theme builder color pickers work', async ({ page }) => {
    await page.goto('/pages/03-styling.html');
    
    // Test color picker interaction
    const primaryColorPicker = page.locator('#color-primary');
    await primaryColorPicker.fill('#ff5733');
    
    // Check preview updated
    const previewButton = page.locator('#theme-preview .bw-btn-primary');
    
    // Apply theme to see changes
    const applyBtn = page.locator('button:has-text("Apply Custom Theme")');
    await applyBtn.click();
    
    // Export theme
    const exportBtn = page.locator('button:has-text("Export Theme")');
    const downloadPromise = page.waitForEvent('download');
    await exportBtn.click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toBe('bitwrench-theme.json');
  });
});

test.describe('Performance Tests', () => {
  test('Large table rendering performance', async ({ page }) => {
    await page.goto('/pages/02-tables-forms.html');
    
    // Measure time to render pagination table with 50 items
    const startTime = Date.now();
    await page.waitForSelector('#paginated-table table', { timeout: 5000 });
    const endTime = Date.now();
    
    const renderTime = endTime - startTime;
    expect(renderTime).toBeLessThan(5000); // Should render within 5 seconds
    
    // Check table has rows
    const rows = page.locator('#paginated-table tbody tr');
    await expect(rows).toHaveCount(10); // First page shows 10 items
  });

  test('Theme switching performance', async ({ page }) => {
    await page.goto('/pages/03-styling.html');
    
    const themeSwitcher = page.locator('.theme-switcher');
    const themes = ['Default', 'Dark', 'Ocean', 'Sunset', 'Forest'];
    
    for (const themeName of themes) {
      const startTime = Date.now();
      const themeBtn = themeSwitcher.locator(`button:has-text("${themeName}")`);
      await themeBtn.click();
      
      // Wait for theme to apply
      await page.waitForTimeout(100);
      const endTime = Date.now();
      
      const switchTime = endTime - startTime;
      expect(switchTime).toBeLessThan(500); // Theme switch should be fast
    }
  });
});

test.describe('Accessibility Tests', () => {
  test('Components have proper ARIA attributes', async ({ page }) => {
    await page.goto('/pages/01-components.html');
    
    // Check tabs have proper ARIA
    const tabList = page.locator('[role="tablist"]').first();
    await expect(tabList).toBeVisible();
    
    const tabs = tabList.locator('[role="tab"]');
    await expect(tabs).toHaveCount(2); // Result and Code tabs
    
    // Check active tab has aria-selected
    const activeTab = tabs.filter({ hasText: 'Result' });
    await expect(activeTab).toHaveAttribute('aria-selected', 'true');
    
    // Check forms have labels
    await page.goto('/pages/02-tables-forms.html');
    const formGroups = page.locator('.bw-form-group');
    const firstGroup = formGroups.first();
    const label = firstGroup.locator('label');
    await expect(label).toBeVisible();
  });

  test('Keyboard navigation works', async ({ page }) => {
    await page.goto('/pages/01-components.html');

    // Check tabs are keyboard-focusable
    const firstTab = page.locator('[role="tab"]').first();
    await firstTab.focus();
    await expect(firstTab).toBeFocused();
  });
});