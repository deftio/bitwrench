// @ts-check
import { test, expect } from '@playwright/test';

// Helper to check for console errors
async function checkNoConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
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
    await page.goto('/01-basic-components.html');
    
    // Check page loaded
    await expect(page.locator('h1')).toContainText('Basic Components');
    
    // Check version is displayed
    await expect(page.locator('#version')).not.toBeEmpty();
    
    // Check tabs are rendered
    const tabContainers = page.locator('[id$="-tabs"]');
    await expect(tabContainers).toHaveCount(8);
    
    // Check tab switching works
    const firstTabContainer = page.locator('#cards-tabs');
    const resultTab = firstTabContainer.locator('.bw-nav-link:has-text("Result")');
    const codeTab = firstTabContainer.locator('.bw-nav-link:has-text("Code")');
    
    await expect(resultTab).toHaveClass(/active/);
    await codeTab.click();
    await expect(codeTab).toHaveClass(/active/);
    
    // Check cards are rendered
    const cards = page.locator('.bw-card');
    await expect(cards.first()).toBeVisible();
    
    // Check buttons exist and have proper styling
    const buttons = page.locator('.bw-btn');
    await expect(buttons.first()).toBeVisible();
    // Check button has primary color (may vary slightly between browsers)
    const bgColor = await buttons.first().evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toMatch(/rgb\((0|13), (123|110), (255|253)\)/); // Primary blue variations
    
    // Check no console errors
    expect(page.errors).toHaveLength(0);
  });

  test('02-interactive-tables-forms.html loads without errors', async ({ page }) => {
    await page.goto('/02-interactive-tables-forms.html');
    
    // Check page loaded
    await expect(page.locator('h1')).toContainText('Interactive Tables & Forms');
    
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
    await page.goto('/03-themes-styling.html');
    
    // Check page loaded
    await expect(page.locator('h1')).toContainText('Themes & Styling');
    
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
    await page.goto('/04-dashboard-app.html');
    
    // Check page loaded
    await expect(page.locator('h1')).toContainText('Dashboard Application');
    
    // Check navigation works
    const customersLink = page.locator('a:has-text("Customers")');
    await customersLink.click();
    await page.waitForURL(/#customers$/);
    
    // Check content updated
    await expect(page.locator('h2')).toContainText('Customers');
    
    // Check table is rendered
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Navigate to analytics
    const analyticsLink = page.locator('a:has-text("Analytics")');
    await analyticsLink.click();
    await page.waitForURL(/#analytics$/);
    
    // Check content updated
    await expect(page.locator('h2')).toContainText('Analytics');
    
    // Check no console errors
    expect(page.errors).toHaveLength(0);
  });

  test('05-advanced-features.html loads without errors', async ({ page }) => {
    await page.goto('/05-advanced-features.html');
    
    // Check page loaded
    await expect(page.locator('h1')).toContainText('Advanced Features');
    
    // Test state management demo
    const incrementBtn = page.locator('button:has-text("Increment")');
    const counterDisplay = page.locator('#counter-value');
    
    const initialValue = await counterDisplay.textContent();
    await incrementBtn.click();
    const newValue = await counterDisplay.textContent();
    
    expect(parseInt(newValue)).toBe(parseInt(initialValue) + 1);
    
    // Test event delegation
    const addItemBtn = page.locator('button:has-text("Add Item")');
    await addItemBtn.click();
    
    // Check new item added
    const listItems = page.locator('#dynamic-list li');
    const itemCount = await listItems.count();
    expect(itemCount).toBeGreaterThan(0);
    
    // Click on dynamically added item
    await listItems.last().click();
    
    // Check no console errors
    expect(page.errors).toHaveLength(0);
  });

  test('Component interactivity works correctly', async ({ page }) => {
    await page.goto('/01-basic-components.html');
    
    // Test alert dismissal
    const dismissibleAlert = page.locator('.bw-alert:has-text("dismissible")');
    const closeButton = dismissibleAlert.locator('.bw-close');
    
    await expect(dismissibleAlert).toBeVisible();
    await closeButton.click();
    await expect(dismissibleAlert).not.toBeVisible();
    
    // Test progress bars have correct values
    const progressBars = page.locator('.bw-progress-bar');
    const firstProgress = progressBars.first();
    const progressWidth = await firstProgress.evaluate(el => el.style.width);
    expect(progressWidth).toBe('25%');
  });

  test('Tables are properly styled and sortable', async ({ page }) => {
    await page.goto('/02-interactive-tables-forms.html');
    
    // Wait for table to be rendered
    await page.waitForSelector('#interactive-table-container table');
    
    // Check table has Bootstrap-like styling
    const table = page.locator('#interactive-table-container table');
    await expect(table).toHaveClass(/bw-table/);
    await expect(table).toHaveClass(/bw-table-striped/);
    await expect(table).toHaveClass(/bw-table-hover/);
    
    // Test select all checkbox
    const selectAllCheckbox = table.locator('thead input[type="checkbox"]');
    await selectAllCheckbox.click();
    
    // Check all rows selected
    const rowCheckboxes = table.locator('tbody input[type="checkbox"]');
    const checkedBoxes = await rowCheckboxes.evaluateAll(checkboxes => 
      checkboxes.filter(cb => cb.checked).length
    );
    const totalCount = await rowCheckboxes.count();
    expect(checkedBoxes).toBe(totalCount);
    
    // Test remove selected
    const removeBtn = page.locator('button:has-text("Remove Selected")');
    await removeBtn.click();
    
    // Check rows removed
    await page.waitForTimeout(500);
    const remainingRows = await table.locator('tbody tr').count();
    expect(remainingRows).toBe(0);
  });

  test('Forms handle validation and submission', async ({ page }) => {
    await page.goto('/02-interactive-tables-forms.html');
    
    // Navigate to form tab
    const formTabs = page.locator('#form-tabs');
    await expect(formTabs).toBeVisible();
    
    // Test required field validation
    const emailInput = formTabs.locator('input[type="email"]');
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    
    // Test select dropdown
    const selectDropdown = formTabs.locator('select').first();
    await selectDropdown.selectOption('opt1');
    
    // Test checkbox
    const checkbox = formTabs.locator('input[type="checkbox"]').first();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });

  test('Theme builder color pickers work', async ({ page }) => {
    await page.goto('/03-themes-styling.html');
    
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
    await page.goto('/02-interactive-tables-forms.html');
    
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
    await page.goto('/03-themes-styling.html');
    
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
    await page.goto('/01-basic-components.html');
    
    // Check tabs have proper ARIA
    const tabList = page.locator('[role="tablist"]').first();
    await expect(tabList).toBeVisible();
    
    const tabs = tabList.locator('[role="tab"]');
    await expect(tabs).toHaveCount(2); // Result and Code tabs
    
    // Check active tab has aria-selected
    const activeTab = tabs.filter({ hasText: 'Result' });
    await expect(activeTab).toHaveAttribute('aria-selected', 'true');
    
    // Check forms have labels
    await page.goto('/02-interactive-tables-forms.html');
    const formGroups = page.locator('.bw-form-group');
    const firstGroup = formGroups.first();
    const label = firstGroup.locator('label');
    await expect(label).toBeVisible();
  });

  test('Keyboard navigation works', async ({ page }) => {
    await page.goto('/01-basic-components.html');
    
    // Focus on first tab
    const firstTab = page.locator('[role="tab"]').first();
    await firstTab.focus();
    
    // Press arrow key to navigate
    await page.keyboard.press('ArrowRight');
    
    // Check focus moved
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toHaveText('Code');
  });
});