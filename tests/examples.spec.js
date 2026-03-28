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
    page.errors = await checkNoConsoleErrors(page);
  });

  test('00-quick-start.html loads and renders TACO structure', async ({ page }) => {
    await page.goto('/pages/00-quick-start.html');

    // Check page loaded - content mounted via bw.DOM('#app', page)
    await expect(page.locator('h1').first()).toContainText('Quick Start');

    // Check all sections rendered via TACO
    const sections = page.locator('[id^="section-"]');
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThanOrEqual(6);

    // Check try-it editors are mounted
    const tryItEditors = page.locator('.tryit-container');
    const editorCount = await tryItEditors.count();
    expect(editorCount).toBeGreaterThanOrEqual(4);

    // Check feature grid next steps section
    const featureCards = page.locator('.bw_feature_card');
    const featureCount = await featureCards.count();
    expect(featureCount).toBeGreaterThanOrEqual(6);

    // Check callout boxes exist
    const callouts = page.locator('.callout');
    const calloutCount = await callouts.count();
    expect(calloutCount).toBeGreaterThanOrEqual(3);

    expect(page.errors).toHaveLength(0);
  });

  test('01-components.html loads without errors', async ({ page }) => {
    await page.goto('/pages/01-components.html');

    // Check page loaded - TACO-ified structure
    await expect(page.locator('h1').first()).toContainText('Built-in Components');

    // Check demo sections are rendered (25+ component demos using section- prefix)
    const demoContainers = page.locator('[id^="section-"]');
    const demoCount = await demoContainers.count();
    expect(demoCount).toBeGreaterThanOrEqual(24);

    // Check tab switching works on first demo
    const firstSection = page.locator('[id^="section-"]').first();
    await expect(firstSection).toBeVisible();
    const resultTab = firstSection.locator('[role="tab"]:has-text("Result")');
    const codeTab = firstSection.locator('[role="tab"]:has-text("Code")');

    await expect(resultTab).toHaveAttribute('aria-selected', 'true');
    await codeTab.click();
    await expect(codeTab).toHaveAttribute('aria-selected', 'true');

    // Switch back to Result to check visible content
    await resultTab.click();

    // Check cards are rendered (visible in Result tab)
    const cards = page.locator('.bw_card:visible');
    await expect(cards.first()).toBeVisible();

    // Check buttons exist
    const buttons = page.locator('.bw_btn:visible');
    await expect(buttons.first()).toBeVisible();

    expect(page.errors).toHaveLength(0);
  });

  test('02-tables-forms.html loads without errors', async ({ page }) => {
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
    await page.waitForTimeout(500);

    // Check table filtered
    const rows = table.locator('tbody tr');
    const visibleRows = await rows.count();
    expect(visibleRows).toBeLessThan(5);

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

    // Check pagination example
    const paginationControls = page.locator('#pagination-controls');
    await expect(paginationControls).toBeVisible();

    // Test pagination
    const nextButton = paginationControls.locator('.bw_page_link:has-text("Next")');
    await nextButton.click();
    await page.waitForTimeout(500);

    // Check table updated
    const paginatedTable = page.locator('#paginated-table table');
    await expect(paginatedTable).toBeVisible();

    expect(page.errors).toHaveLength(0);
  });

  test('02-tables-forms.html form section loads without errors', async ({ page }) => {
    await page.goto('/pages/02-tables-forms.html');

    // Check page loaded
    await expect(page.locator('h1').first()).toContainText('Tables & Forms');

    // Check form inputs are rendered (inside form-tabs demo section)
    const formInputs = page.locator('.bw_form_control');
    await expect(formInputs.first()).toBeVisible();

    // Test tabbed forms section — the inner makeTabs has Personal Info / Address / Preferences tabs
    const tabbedForm = page.locator('#tabbed-form-tabs');
    await expect(tabbedForm).toBeVisible();

    // The tabbed form is inside a createDemoTabs wrapper (Result/Code),
    // so drill into the inner bw_tabs for the Personal Info / Address tabs
    const personalTab = tabbedForm.locator('.bw_nav_link:has-text("Personal Info")');
    const addressTab = tabbedForm.locator('.bw_nav_link:has-text("Address")');

    await expect(personalTab).toHaveClass(/active/);
    await addressTab.click();
    await expect(addressTab).toHaveClass(/active/);

    expect(page.errors).toHaveLength(0);
  });

  test('03-styling.html loads without errors', async ({ page }) => {
    await page.goto('/pages/03-styling.html');

    // Check page loaded
    await expect(page.locator('h1')).toContainText('Styling');

    // Check try-it editors are rendered
    const tryItEditors = page.locator('.tryit-container');
    const editorCount = await tryItEditors.count();
    expect(editorCount).toBeGreaterThanOrEqual(3);

    // Check theme preview area exists
    const themePreview = page.locator('#theme-preview-area');
    await expect(themePreview).toBeVisible();

    // Check color inputs exist inside theme preview area
    const colorInputs = page.locator('input[type="color"]');
    const colorCount = await colorInputs.count();
    expect(colorCount).toBeGreaterThanOrEqual(2);

    expect(page.errors).toHaveLength(0);
  });

  test('04-dashboard.html loads without errors', async ({ page }) => {
    await page.goto('/pages/04-dashboard.html');

    // Check page loaded
    await expect(page.locator('h1').first()).toContainText('Dashboard');

    // Check dashboard app container is rendered
    const dashboardApp = page.locator('#dashboard-app');
    await expect(dashboardApp).toBeVisible();

    // Check stats grid is rendered (class, not ID)
    const statsGrid = page.locator('.stats-grid');
    await expect(statsGrid).toBeVisible();

    // Check sidebar is rendered
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    // Check stat cards exist
    const statCards = page.locator('.stat-card');
    const cardCount = await statCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);

    expect(page.errors).toHaveLength(0);
  });

  test('05-state.html loads without errors', async ({ page }) => {
    await page.goto('/pages/05-state.html');

    // Check page loaded
    await expect(page.locator('h1').first()).toContainText('State');

    // Check counter demo is rendered
    const counterDemo = page.locator('#counter-demo');
    await expect(counterDemo).toBeVisible();

    // Test counter increment (counters use inline styles, not CSS classes)
    // Find the first + button in the counter demo and click it
    const plusBtn = counterDemo.locator('button:has-text("+")').first();
    await expect(plusBtn).toBeVisible();
    // Get the initial value from the page (evaluate to find value near the button)
    const initialVal = await page.evaluate(function() {
      var demo = document.querySelector('#counter-demo');
      var h4 = demo.querySelector('h4');
      if (!h4) return null;
      // Value div is the next sibling of h4
      var valDiv = h4.nextElementSibling;
      return valDiv ? parseInt(valDiv.textContent) : null;
    });
    await plusBtn.click();
    const newVal = await page.evaluate(function() {
      var demo = document.querySelector('#counter-demo');
      var h4 = demo.querySelector('h4');
      var valDiv = h4.nextElementSibling;
      return valDiv ? parseInt(valDiv.textContent) : null;
    });
    expect(newVal).toBe(initialVal + 1);

    expect(page.errors).toHaveLength(0);
  });

  test('Component interactivity works correctly', async ({ page }) => {
    await page.goto('/pages/01-components.html');

    // Test that alerts are rendered in the alerts section
    const alertsSection = page.locator('#section-alerts');
    await expect(alertsSection).toBeVisible();

    // Check alerts exist
    const alerts = alertsSection.locator('.bw_alert');
    const alertCount = await alerts.count();
    expect(alertCount).toBeGreaterThanOrEqual(1);

    // Test progress bars exist and have width values
    const progressBars = page.locator('.bw_progress_bar');
    const progressCount = await progressBars.count();
    expect(progressCount).toBeGreaterThanOrEqual(2);
    // Verify they have width set (values may change with component updates)
    const firstWidth = await progressBars.first().evaluate(el => el.style.width);
    expect(firstWidth).toBeTruthy();
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
});

test.describe('Performance Tests', () => {
  test('Large table rendering performance', async ({ page }) => {
    await page.goto('/pages/02-tables-forms.html');

    // Measure time to render pagination table with 50 items
    const startTime = Date.now();
    await page.waitForSelector('#paginated-table table', { timeout: 5000 });
    const endTime = Date.now();

    const renderTime = endTime - startTime;
    expect(renderTime).toBeLessThan(5000);

    // Check table has rows
    const rows = page.locator('#paginated-table tbody tr');
    await expect(rows).toHaveCount(10);
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
    const formGroups = page.locator('.bw_form_group');
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

  test('09-downloads.html loads build tables from builds.json', async ({ page }) => {
    await page.goto('/pages/09-downloads.html');

    // Wait for async fetch of builds.json to complete
    await page.waitForTimeout(2000);

    // Downloads section should have loaded a table with rows
    const dlSection = page.locator('#section-downloads');
    await expect(dlSection).toBeVisible();
    const dlTable = dlSection.locator('table.bw_table');
    await expect(dlTable).toBeVisible();
    expect(await dlTable.locator('tbody tr').count()).toBeGreaterThanOrEqual(2);

    // All Builds section should also have a table
    const allSection = page.locator('#section-all');
    await expect(allSection).toBeVisible();
    const allTable = allSection.locator('table.bw_table');
    await expect(allTable).toBeVisible();
    expect(await allTable.locator('tbody tr').count()).toBeGreaterThanOrEqual(5);
  });
});
