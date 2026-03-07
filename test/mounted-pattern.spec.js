// @ts-check
import { test, expect } from '@playwright/test';

test.describe('State on DOM element (o.state pattern)', () => {

  test('counters render and have state on el._bw_state', async ({ page }) => {
    await page.goto('/pages/05-state.html');
    await page.waitForTimeout(500);

    // Should find 3 counter cards (div[data-bw-id] inside #counter-demo)
    const counters = page.locator('#counter-demo [data-bw-id]');
    await expect(counters).toHaveCount(3);

    // Check initial values: Visitors=42, Orders=7, Errors=0
    // Value is the second child div inside the card wrapper (after h4)
    const values = page.locator('#counter-demo [data-bw-id] h4 + div');
    await expect(values.nth(0)).toHaveText('42');
    await expect(values.nth(1)).toHaveText('7');
    await expect(values.nth(2)).toHaveText('0');

    // Verify state is actually on the DOM element (not in a closure)
    const stateOnElement = await page.evaluate(() => {
      var els = document.querySelectorAll('#counter-demo [data-bw-id]');
      var results = [];
      els.forEach(function(el) {
        if (el._bw_state && typeof el._bw_state.count === 'number') {
          results.push(el._bw_state.count);
        }
      });
      return results;
    });
    expect(stateOnElement).toEqual([42, 7, 0]);
  });

  test('counters are independent — clicking one does not affect others', async ({ page }) => {
    await page.goto('/pages/05-state.html');
    await page.waitForTimeout(500);

    const values = page.locator('#counter-demo [data-bw-id] h4 + div');
    const counters = page.locator('#counter-demo [data-bw-id]');

    // Click + on first counter twice
    await counters.nth(0).locator('button', { hasText: '+' }).click();
    await page.waitForTimeout(50);
    await counters.nth(0).locator('button', { hasText: '+' }).click();
    await page.waitForTimeout(50);

    // First = 44, others unchanged
    await expect(values.nth(0)).toHaveText('44');
    await expect(values.nth(1)).toHaveText('7');
    await expect(values.nth(2)).toHaveText('0');

    // Click + on third counter
    await counters.nth(2).locator('button', { hasText: '+' }).click();
    await page.waitForTimeout(50);

    // Third = 1, others unchanged
    await expect(values.nth(0)).toHaveText('44');
    await expect(values.nth(1)).toHaveText('7');
    await expect(values.nth(2)).toHaveText('1');

    // Verify el._bw_state matches the displayed values
    const stateAfter = await page.evaluate(() => {
      var results = [];
      document.querySelectorAll('#counter-demo [data-bw-id]').forEach(function(el) {
        if (el._bw_state && typeof el._bw_state.count === 'number') {
          results.push(el._bw_state.count);
        }
      });
      return results;
    });
    expect(stateAfter).toEqual([44, 7, 1]);
  });

  test('reset returns counter to its start value', async ({ page }) => {
    await page.goto('/pages/05-state.html');
    await page.waitForTimeout(500);

    const values = page.locator('#counter-demo [data-bw-id] h4 + div');
    const counters = page.locator('#counter-demo [data-bw-id]');

    // Increment first counter, then reset
    await counters.nth(0).locator('button', { hasText: '+' }).click();
    await counters.nth(0).locator('button', { hasText: '+' }).click();
    await page.waitForTimeout(50);
    await expect(values.nth(0)).toHaveText('44');

    await counters.nth(0).locator('button', { hasText: 'Reset' }).click();
    await page.waitForTimeout(50);
    await expect(values.nth(0)).toHaveText('42'); // back to start value
  });

  test('todo list works with state on element', async ({ page }) => {
    await page.goto('/pages/05-state.html');
    await page.waitForTimeout(500);

    // Should have 3 initial items
    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(3);

    // Add an item
    const input = page.locator('#todo-demo input[type="text"]');
    await input.fill('New todo');
    await page.locator('#todo-demo button', { hasText: 'Add' }).click();
    await page.waitForTimeout(100);
    await expect(page.locator('.todo-item')).toHaveCount(4);

    // Check an item off
    const firstCheckbox = page.locator('.todo-item input[type="checkbox"]').first();
    await firstCheckbox.click();
    await page.waitForTimeout(100);

    // Verify state is on the element
    const todoState = await page.evaluate(() => {
      var els = document.querySelectorAll('[data-bw-id]');
      var result = null;
      els.forEach(function(el) {
        if (el._bw_state && el._bw_state.todos) {
          result = {
            count: el._bw_state.todos.length,
            nextId: el._bw_state.nextId
          };
        }
      });
      return result;
    });
    expect(todoState).not.toBeNull();
    expect(todoState.count).toBe(4);
    expect(todoState.nextId).toBe(5);
  });

  test('state survives re-render (bw.DOM preserves _bw_state)', async ({ page }) => {
    await page.goto('/pages/05-state.html');
    await page.waitForTimeout(500);

    // Click + 5 times on the first counter
    const btn = page.locator('#counter-demo [data-bw-id]').nth(0).locator('button', { hasText: '+' });
    for (let i = 0; i < 5; i++) {
      await btn.click();
      await page.waitForTimeout(30);
    }

    // Verify the displayed value AND the underlying state match
    const values = page.locator('#counter-demo [data-bw-id] h4 + div');
    await expect(values.nth(0)).toHaveText('47');

    const stateValue = await page.evaluate(() => {
      var els = document.querySelectorAll('#counter-demo [data-bw-id]');
      var result = null;
      els.forEach(function(el) {
        if (el._bw_state && el._bw_state.count === 47) {
          result = el._bw_state.count;
        }
      });
      return result;
    });
    expect(stateValue).toBe(47);
  });

  test('theme switcher works with state on element', async ({ page }) => {
    await page.goto('/pages/05-state.html');
    await page.waitForTimeout(500);

    // Click Sunset button
    await page.locator('#css-demo button', { hasText: 'Sunset' }).click();
    await page.waitForTimeout(100);

    // Verify state changed
    const themeState = await page.evaluate(() => {
      var result = null;
      document.querySelectorAll('[data-bw-id]').forEach(function(el) {
        if (el._bw_state && el._bw_state.current) {
          result = el._bw_state.current;
        }
      });
      return result;
    });
    expect(themeState).toBe('sunset');

    // Verify the themed card has sunset colors
    const h4 = page.locator('#css-demo .themed h4');
    await expect(h4).toContainText('Sunset Theme');
  });

  test('no JavaScript errors on page load', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    await page.goto('/pages/05-state.html');
    await page.waitForTimeout(500);

    expect(jsErrors).toEqual([]);
  });
});
