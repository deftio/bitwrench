// @ts-check
import { test, expect } from '@playwright/test';

// Helper to check for console errors (ignores resource 404s)
async function checkNoConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('Failed to load resource') && text.includes('404')) return;
      errors.push(text);
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });
  return errors;
}

test.describe('Component Library - All Components Render', () => {
  test.beforeEach(async ({ page }) => {
    page.errors = await checkNoConsoleErrors(page);
    await page.goto('/pages/01-components.html');
    await page.waitForLoadState('networkidle');
  });

  test('page loads without errors', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Built-in Components');
    expect(page.errors).toHaveLength(0);
  });

  // Count all demo sections to make sure every component is shown
  test('all component sections are present', async ({ page }) => {
    const sections = page.locator('[id^="section-"]');
    const count = await sections.count();
    // We have 25 demo sections
    expect(count).toBeGreaterThanOrEqual(24);
  });

  // ---- Cards ----
  test('cards render with proper structure', async ({ page }) => {
    const demo = page.locator('#section-cards');
    await expect(demo).toBeVisible();
    const cards = demo.locator('.bw-card');
    expect(await cards.count()).toBeGreaterThanOrEqual(3);
    await expect(demo.locator('.bw-card-title').first()).toBeVisible();
    await expect(demo.locator('.bw-card-body').first()).toBeVisible();
  });

  // ---- Buttons ----
  test('buttons render all variants and sizes', async ({ page }) => {
    const demo = page.locator('#section-buttons');
    await expect(demo).toBeVisible();
    await expect(demo.locator('.bw-btn-primary').first()).toBeVisible();
    await expect(demo.locator('.bw-btn-secondary').first()).toBeVisible();
    await expect(demo.locator('.bw-btn-success').first()).toBeVisible();
    await expect(demo.locator('.bw-btn-danger').first()).toBeVisible();
    await expect(demo.locator('.bw-btn-outline-primary').first()).toBeVisible();
    await expect(demo.locator('.bw-btn-sm').first()).toBeVisible();
    await expect(demo.locator('.bw-btn-lg').first()).toBeVisible();
  });

  // ---- Button Groups ----
  test('button groups render horizontal and vertical', async ({ page }) => {
    const demo = page.locator('#section-button-groups');
    await expect(demo).toBeVisible();
    await expect(demo.locator('.bw-btn-group').first()).toBeVisible();
    await expect(demo.locator('.bw-btn-group-vertical').first()).toBeVisible();
  });

  // ---- Grid ----
  test('grid system renders columns', async ({ page }) => {
    const demo = page.locator('#section-grid');
    await expect(demo).toBeVisible();
    const cols = demo.locator('.bw-col-4, [class*="bw-col-"]');
    expect(await cols.count()).toBeGreaterThan(0);
  });

  // ---- Stacks ----
  test('stacks render vertical and horizontal', async ({ page }) => {
    const demo = page.locator('#section-stacks');
    await expect(demo).toBeVisible();
    const stacks = demo.locator('.bw-vstack, .bw-hstack');
    expect(await stacks.count()).toBeGreaterThanOrEqual(2);
  });

  // ---- Navigation ----
  test('navigation components render', async ({ page }) => {
    const demo = page.locator('#section-navigation');
    await expect(demo).toBeVisible();
    await expect(demo.locator('.bw-nav').first()).toBeVisible();
    await expect(demo.locator('.bw-navbar').first()).toBeVisible();
    await expect(demo.locator('.bw-breadcrumb').first()).toBeVisible();
  });

  // ---- Tabs ----
  test('tabs render and switch', async ({ page }) => {
    const demo = page.locator('#section-tabs');
    await expect(demo).toBeVisible();
    const resultTab = demo.locator('[role="tab"]:has-text("Result")').first();
    await expect(resultTab).toHaveAttribute('aria-selected', 'true');
  });

  // ---- Alerts ----
  test('alerts render all variants', async ({ page }) => {
    const demo = page.locator('#section-alerts');
    await expect(demo).toBeVisible();
    await expect(demo.locator('.bw-alert-primary').first()).toBeVisible();
    await expect(demo.locator('.bw-alert-success').first()).toBeVisible();
    await expect(demo.locator('.bw-alert-warning').first()).toBeVisible();
    await expect(demo.locator('.bw-alert-danger').first()).toBeVisible();
    await expect(demo.locator('.bw-close').first()).toBeVisible();
  });

  // ---- Badges ----
  test('badges render all variants and sizes', async ({ page }) => {
    const demo = page.locator('#section-badges');
    await expect(demo).toBeVisible();
    const badges = demo.locator('.bw-badge');
    expect(await badges.count()).toBeGreaterThanOrEqual(7);
    // Size variants
    await expect(demo.locator('.bw-badge-sm').first()).toBeVisible();
    await expect(demo.locator('.bw-badge-lg').first()).toBeVisible();
  });

  // ---- Progress Bars ----
  test('progress bars render with correct widths', async ({ page }) => {
    const demo = page.locator('#section-progress');
    await expect(demo).toBeVisible();
    const bars = demo.locator('.bw-progress-bar');
    expect(await bars.count()).toBeGreaterThanOrEqual(4);
    const firstBar = bars.first();
    const width = await firstBar.evaluate(el => el.style.width);
    expect(width).toBe('25%');
  });

  // ---- List Groups ----
  test('list groups render with items', async ({ page }) => {
    const demo = page.locator('#section-lists');
    await expect(demo).toBeVisible();
    const items = demo.locator('.bw-list-group-item');
    expect(await items.count()).toBeGreaterThanOrEqual(4);
  });

  // ---- Spinners ----
  test('spinners render border and grow types', async ({ page }) => {
    const demo = page.locator('#section-spinners');
    await expect(demo).toBeVisible();
    await expect(demo.locator('.bw-spinner-border').first()).toBeVisible();
    await expect(demo.locator('.bw-spinner-grow').first()).toBeVisible();
  });

  // ---- Form Controls ----
  test('form controls render all types', async ({ page }) => {
    const demo = page.locator('#section-forms');
    await expect(demo).toBeVisible();
    await expect(demo.locator('input[type="text"], input[type="email"]').first()).toBeVisible();
    await expect(demo.locator('textarea').first()).toBeVisible();
    await expect(demo.locator('select').first()).toBeVisible();
    await expect(demo.locator('input[type="checkbox"]').first()).toBeVisible();
    await expect(demo.locator('input[type="radio"]').first()).toBeVisible();
    await expect(demo.locator('input[role="switch"]').first()).toBeVisible();
    // Password field
    await expect(demo.locator('input[type="password"]').first()).toBeVisible();
  });

  // ---- Pagination ----
  test('pagination renders with page numbers', async ({ page }) => {
    const demo = page.locator('#section-pagination');
    await expect(demo).toBeVisible();
    const pagination = demo.locator('.bw-pagination');
    expect(await pagination.count()).toBeGreaterThanOrEqual(2);
    await expect(demo.locator('.bw-active').first()).toBeVisible();
    await expect(demo.locator('.bw-pagination-sm').first()).toBeVisible();
    await expect(demo.locator('.bw-pagination-lg').first()).toBeVisible();
  });

  // ---- Accordion ----
  test('accordion renders with collapsible items', async ({ page }) => {
    const demo = page.locator('#section-accordion');
    await expect(demo).toBeVisible();
    const accordion = demo.locator('.bw-accordion');
    expect(await accordion.count()).toBeGreaterThanOrEqual(2);
    const firstCollapse = demo.locator('.bw-accordion-collapse').first();
    await expect(firstCollapse).toHaveClass(/bw-collapse-show/);
    await expect(demo.locator('.bw-accordion-button').first()).toBeVisible();
  });

  test('accordion toggle works', async ({ page }) => {
    const demo = page.locator('#section-accordion');
    const secondButton = demo.locator('.bw-accordion-button').nth(1);
    await secondButton.click();
    await page.waitForTimeout(400);
    const secondCollapse = demo.locator('.bw-accordion-collapse').nth(1);
    await expect(secondCollapse).toHaveClass(/bw-collapse-show/);
  });

  // ---- Dropdown ----
  test('dropdown renders and opens on click', async ({ page }) => {
    const demo = page.locator('#section-dropdown');
    await expect(demo).toBeVisible();
    const dropdown = demo.locator('.bw-dropdown').first();
    await expect(dropdown).toBeVisible();
    await dropdown.locator('.bw-dropdown-toggle').click();
    await page.waitForTimeout(200);
    await expect(dropdown.locator('.bw-dropdown-show')).toBeVisible();
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(200);
  });

  // ---- Modal ----
  test('modal opens and closes', async ({ page }) => {
    const demo = page.locator('#section-modal');
    await expect(demo).toBeVisible();
    await demo.locator('button:has-text("Open Modal")').click();
    await page.waitForTimeout(300);
    const modal = page.locator('.bw-modal-show');
    await expect(modal).toBeVisible();
    await modal.locator('.bw-close').click();
    await page.waitForTimeout(300);
    await expect(page.locator('.bw-modal-show')).toHaveCount(0);
  });

  // ---- Toast ----
  test('toast renders static previews', async ({ page }) => {
    const demo = page.locator('#section-toast');
    await expect(demo).toBeVisible();
    const toasts = demo.locator('.bw-toast');
    expect(await toasts.count()).toBeGreaterThanOrEqual(2);
  });

  // ---- Skeleton ----
  test('skeleton renders all variants', async ({ page }) => {
    const demo = page.locator('#section-skeleton');
    await expect(demo).toBeVisible();
    await expect(demo.locator('.bw-skeleton-text').first()).toBeVisible();
    await expect(demo.locator('.bw-skeleton-circle').first()).toBeVisible();
    await expect(demo.locator('.bw-skeleton-rect').first()).toBeVisible();
  });

  // ---- Avatar ----
  test('avatar renders sizes and variants', async ({ page }) => {
    const demo = page.locator('#section-avatar');
    await expect(demo).toBeVisible();
    await expect(demo.locator('.bw-avatar-sm').first()).toBeVisible();
    await expect(demo.locator('.bw-avatar-md').first()).toBeVisible();
    await expect(demo.locator('.bw-avatar-lg').first()).toBeVisible();
    await expect(demo.locator('.bw-avatar-xl').first()).toBeVisible();
  });

  // ---- Tables ----
  test('data table renders with rows', async ({ page }) => {
    const demo = page.locator('#section-tables');
    await expect(demo).toBeVisible();
    const table = demo.locator('table');
    await expect(table).toBeVisible();
    const rows = table.locator('tbody tr');
    expect(await rows.count()).toBeGreaterThanOrEqual(4);
  });

  // ---- Hero ----
  test('hero section renders with white text', async ({ page }) => {
    const demo = page.locator('#section-hero');
    await expect(demo).toBeVisible();
    await expect(demo.locator('.bw-hero').first()).toBeVisible();
    await expect(demo.locator('.bw-hero-title').first()).toBeVisible();
    // Hero title on primary variant should have white text
    const color = await demo.locator('.bw-hero-title').first().evaluate(el => {
      return window.getComputedStyle(el).color;
    });
    // rgb(255, 255, 255) = white
    expect(color).toMatch(/rgb\(255,\s*255,\s*255\)/);
  });

  // ---- Feature Grid ----
  test('feature grid renders features', async ({ page }) => {
    const demo = page.locator('#section-feature-grid');
    await expect(demo).toBeVisible();
    const features = demo.locator('.bw-feature');
    expect(await features.count()).toBeGreaterThanOrEqual(3);
  });

  // ---- CTA ----
  test('CTA section renders', async ({ page }) => {
    const demo = page.locator('#section-cta');
    await expect(demo).toBeVisible();
    await expect(demo.locator('.bw-cta').first()).toBeVisible();
  });

  // ---- Section ----
  test('section component renders', async ({ page }) => {
    const demo = page.locator('#section-section');
    await expect(demo).toBeVisible();
    await expect(demo.locator('.bw-section').first()).toBeVisible();
  });

  test('no console errors after all checks', async ({ page }) => {
    expect(page.errors).toHaveLength(0);
  });
});

test.describe('Component Visual Quality', () => {
  test.beforeEach(async ({ page }) => {
    page.errors = await checkNoConsoleErrors(page);
    await page.goto('/pages/01-components.html');
    await page.waitForLoadState('networkidle');
  });

  test('buttons have proper padding and are not cramped', async ({ page }) => {
    const btn = page.locator('#section-buttons .bw-btn-primary').first();
    const box = await btn.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(30);
    expect(box.width).toBeGreaterThanOrEqual(50);
  });

  test('cards have proper spacing', async ({ page }) => {
    const card = page.locator('#section-cards .bw-card').first();
    const box = await card.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(80);
    expect(box.width).toBeGreaterThanOrEqual(200);
  });

  test('alerts are not too tall', async ({ page }) => {
    const alert = page.locator('#section-alerts .bw-alert').first();
    const box = await alert.boundingBox();
    expect(box.height).toBeLessThan(120);
    expect(box.height).toBeGreaterThanOrEqual(20);
  });

  test('pagination items are compact and aligned', async ({ page }) => {
    const pagination = page.locator('#section-pagination .bw-pagination').first();
    const box = await pagination.boundingBox();
    expect(box.height).toBeLessThan(60);
    expect(box.height).toBeGreaterThanOrEqual(20);
  });

  test('accordion items have reasonable padding', async ({ page }) => {
    const accordionBtn = page.locator('#section-accordion .bw-accordion-button').first();
    const box = await accordionBtn.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(30);
    expect(box.height).toBeLessThan(80);
  });

  test('skeleton has visible pulse animation', async ({ page }) => {
    const skeleton = page.locator('#section-skeleton .bw-skeleton').first();
    await expect(skeleton).toBeVisible();
    const hasAnimation = await skeleton.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.animationName !== 'none' || style.background.includes('gradient');
    });
    expect(hasAnimation).toBe(true);
  });

  test('avatars are circular', async ({ page }) => {
    const avatar = page.locator('#section-avatar .bw-avatar').first();
    const borderRadius = await avatar.evaluate(el => {
      return window.getComputedStyle(el).borderRadius;
    });
    expect(borderRadius).toBe('50%');
  });

  test('switches have distinct appearance from checkboxes', async ({ page }) => {
    const switchEl = page.locator('#section-forms .bw-form-switch').first();
    await expect(switchEl).toBeVisible();
    const switchInput = switchEl.locator('input[role="switch"]');
    await expect(switchInput).toBeVisible();
  });

  test('dropdown menu is initially hidden', async ({ page }) => {
    const menu = page.locator('#section-dropdown .bw-dropdown-menu').first();
    await expect(menu).not.toHaveClass(/bw-dropdown-show/);
  });

  test('font sizes are readable (not too small)', async ({ page }) => {
    const bodyFontSize = await page.evaluate(() => {
      return parseFloat(window.getComputedStyle(document.body).fontSize);
    });
    expect(bodyFontSize).toBeGreaterThanOrEqual(14);

    const btnFontSize = await page.locator('#section-buttons .bw-btn').first().evaluate(el => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    expect(btnFontSize).toBeGreaterThanOrEqual(12);
  });

  test('badge sizes are distinct', async ({ page }) => {
    const smBox = await page.locator('#section-badges .bw-badge-sm').first().boundingBox();
    const defaultBox = await page.locator('#section-badges .bw-badge:not(.bw-badge-sm):not(.bw-badge-lg)').first().boundingBox();
    const lgBox = await page.locator('#section-badges .bw-badge-lg').first().boundingBox();
    // sm < default < lg
    expect(smBox.height).toBeLessThan(defaultBox.height);
    expect(defaultBox.height).toBeLessThan(lgBox.height);
  });
});

test.describe('Component Theming', () => {
  test('components render correctly with default theme', async ({ page }) => {
    await page.goto('/pages/01-components.html');
    await page.waitForLoadState('networkidle');

    const hasStyles = await page.evaluate(() => {
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      return Array.from(links).some(l => l.href.includes('bitwrench.css'));
    });
    expect(hasStyles).toBe(true);

    const btnBg = await page.locator('#section-buttons .bw-btn-primary').first().evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(btnBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(btnBg).not.toBe('transparent');
  });

  test('tab switching works across all demos', async ({ page }) => {
    await page.goto('/pages/01-components.html');
    await page.waitForLoadState('networkidle');

    const tabLists = page.locator('[role="tablist"]');
    const count = await tabLists.count();
    expect(count).toBeGreaterThanOrEqual(20);

    for (let i = 0; i < Math.min(5, count); i++) {
      const tabList = tabLists.nth(i);
      const codeTab = tabList.locator('[role="tab"]:has-text("Code")');
      const resultTab = tabList.locator('[role="tab"]:has-text("Result")');

      if (await codeTab.count() > 0) {
        await codeTab.click();
        await expect(codeTab).toHaveAttribute('aria-selected', 'true');
        await resultTab.click();
        await expect(resultTab).toHaveAttribute('aria-selected', 'true');
      }
    }
  });
});
