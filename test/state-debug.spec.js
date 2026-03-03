// @ts-check
import { test, expect } from '@playwright/test';

test.describe('State Management Debug Page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/state-debug.html');
    await page.waitForTimeout(600); // wait for mounted callbacks
  });

  test('three cards render with correct initial values', async ({ page }) => {
    const values = page.locator('[data-testid="value"]');
    await expect(values).toHaveCount(3);
    await expect(values.nth(0)).toHaveText('10');  // Alpha
    await expect(values.nth(1)).toHaveText('20');  // Beta
    await expect(values.nth(2)).toHaveText('30');  // Gamma
  });

  test('each card has independent state on el._bw_state', async ({ page }) => {
    const states = await page.evaluate(() => {
      var results = [];
      document.querySelectorAll('[data-card-name]').forEach(function(el) {
        if (el._bw_state) {
          results.push({ name: el.getAttribute('data-card-name'), count: el._bw_state.count });
        }
      });
      return results;
    });
    expect(states).toEqual([
      { name: 'Alpha', count: 10 },
      { name: 'Beta', count: 20 },
      { name: 'Gamma', count: 30 }
    ]);
  });

  test('local + button increments only that card', async ({ page }) => {
    const cards = page.locator('[data-card-name]');
    const values = page.locator('[data-testid="value"]');

    // Click + on Alpha twice
    await cards.nth(0).locator('button', { hasText: '+' }).click();
    await page.waitForTimeout(50);
    await cards.nth(0).locator('button', { hasText: '+' }).click();
    await page.waitForTimeout(50);

    await expect(values.nth(0)).toHaveText('12');  // Alpha: 10 + 2
    await expect(values.nth(1)).toHaveText('20');  // Beta unchanged
    await expect(values.nth(2)).toHaveText('30');  // Gamma unchanged
  });

  test('local - button decrements only that card', async ({ page }) => {
    const cards = page.locator('[data-card-name]');
    const values = page.locator('[data-testid="value"]');

    // Click – on Beta
    await cards.nth(1).locator('button', { hasText: '\u2013' }).click();
    await page.waitForTimeout(50);

    await expect(values.nth(0)).toHaveText('10');  // Alpha unchanged
    await expect(values.nth(1)).toHaveText('19');  // Beta: 20 - 1
    await expect(values.nth(2)).toHaveText('30');  // Gamma unchanged
  });

  test('Clear button sets card to 0', async ({ page }) => {
    const cards = page.locator('[data-card-name]');
    const values = page.locator('[data-testid="value"]');

    await cards.nth(2).locator('button', { hasText: 'Clear' }).click();
    await page.waitForTimeout(50);

    await expect(values.nth(0)).toHaveText('10');  // Alpha unchanged
    await expect(values.nth(1)).toHaveText('20');  // Beta unchanged
    await expect(values.nth(2)).toHaveText('0');   // Gamma cleared
  });

  test('Set button sets card to specific value', async ({ page }) => {
    const cards = page.locator('[data-card-name]');
    const values = page.locator('[data-testid="value"]');

    // Type 99 into Alpha's input and click Set
    const input = cards.nth(0).locator('input[type="number"]');
    await input.fill('99');
    await cards.nth(0).locator('button', { hasText: 'Set' }).click();
    await page.waitForTimeout(50);

    await expect(values.nth(0)).toHaveText('99');  // Alpha set to 99
    await expect(values.nth(1)).toHaveText('20');  // Beta unchanged
    await expect(values.nth(2)).toHaveText('30');  // Gamma unchanged
  });

  test('global Inc All increments all three cards', async ({ page }) => {
    const values = page.locator('[data-testid="value"]');

    await page.locator('button', { hasText: 'Inc All (+1)' }).click();
    await page.waitForTimeout(100);

    await expect(values.nth(0)).toHaveText('11');  // Alpha: 10 + 1
    await expect(values.nth(1)).toHaveText('21');  // Beta: 20 + 1
    await expect(values.nth(2)).toHaveText('31');  // Gamma: 30 + 1
  });

  test('global Dec All decrements all three cards', async ({ page }) => {
    const values = page.locator('[data-testid="value"]');

    await page.locator('button', { hasText: /Dec All/ }).click();
    await page.waitForTimeout(100);

    await expect(values.nth(0)).toHaveText('9');   // Alpha: 10 - 1
    await expect(values.nth(1)).toHaveText('19');  // Beta: 20 - 1
    await expect(values.nth(2)).toHaveText('29');  // Gamma: 30 - 1
  });

  test('global Reset All sets all cards to 0', async ({ page }) => {
    const values = page.locator('[data-testid="value"]');

    await page.locator('button', { hasText: 'Reset All (0)' }).click();
    await page.waitForTimeout(100);

    await expect(values.nth(0)).toHaveText('0');
    await expect(values.nth(1)).toHaveText('0');
    await expect(values.nth(2)).toHaveText('0');
  });

  test('global Double All doubles all counts', async ({ page }) => {
    const values = page.locator('[data-testid="value"]');

    await page.locator('button', { hasText: 'Double All' }).click();
    await page.waitForTimeout(100);

    await expect(values.nth(0)).toHaveText('20');  // Alpha: 10 * 2
    await expect(values.nth(1)).toHaveText('40');  // Beta: 20 * 2
    await expect(values.nth(2)).toHaveText('60');  // Gamma: 30 * 2
  });

  test('sum display shows breakdown and correct total after mixed operations', async ({ page }) => {
    const cards = page.locator('[data-card-name]');

    // Alpha +3
    for (var i = 0; i < 3; i++) {
      await cards.nth(0).locator('button', { hasText: '+' }).click();
      await page.waitForTimeout(30);
    }

    // Beta Clear
    await cards.nth(1).locator('button', { hasText: 'Clear' }).click();
    await page.waitForTimeout(100);

    // Sum auto-updates on local clicks, no need for Refresh
    // Alpha=13, Beta=0, Gamma=30 → sum=43
    const sumText = await page.locator('#sum-display').textContent();
    expect(sumText).toContain('Alpha(13)');
    expect(sumText).toContain('Beta(0)');
    expect(sumText).toContain('Gamma(30)');
    expect(sumText).toContain('43');
  });

  test('sum display shows initial breakdown on load', async ({ page }) => {
    const sumText = await page.locator('#sum-display').textContent();
    // Alpha(10) + Beta(20) + Gamma(30) = 60
    expect(sumText).toContain('Alpha(10)');
    expect(sumText).toContain('Beta(20)');
    expect(sumText).toContain('Gamma(30)');
    expect(sumText).toContain('60');
  });

  test('el._bw_state matches displayed values after operations', async ({ page }) => {
    const cards = page.locator('[data-card-name]');

    // Increment Alpha, decrement Gamma
    await cards.nth(0).locator('button', { hasText: '+' }).click();
    await page.waitForTimeout(50);
    await cards.nth(2).locator('button', { hasText: '\u2013' }).click();
    await page.waitForTimeout(50);

    const states = await page.evaluate(() => {
      var results = [];
      document.querySelectorAll('[data-card-name]').forEach(function(el) {
        if (el._bw_state) {
          results.push(el._bw_state.count);
        }
      });
      return results;
    });
    expect(states).toEqual([11, 20, 29]);
  });

  test('local and global operations compose correctly', async ({ page }) => {
    const cards = page.locator('[data-card-name]');
    const values = page.locator('[data-testid="value"]');

    // Local: Alpha +5
    for (var i = 0; i < 5; i++) {
      await cards.nth(0).locator('button', { hasText: '+' }).click();
      await page.waitForTimeout(20);
    }
    await expect(values.nth(0)).toHaveText('15'); // 10 + 5

    // Global: Inc All
    await page.locator('button', { hasText: 'Inc All (+1)' }).click();
    await page.waitForTimeout(100);

    await expect(values.nth(0)).toHaveText('16'); // 15 + 1
    await expect(values.nth(1)).toHaveText('21'); // 20 + 1
    await expect(values.nth(2)).toHaveText('31'); // 30 + 1

    // Global: Double All
    await page.locator('button', { hasText: 'Double All' }).click();
    await page.waitForTimeout(100);

    await expect(values.nth(0)).toHaveText('32'); // 16 * 2
    await expect(values.nth(1)).toHaveText('42'); // 21 * 2
    await expect(values.nth(2)).toHaveText('62'); // 31 * 2

    // Verify el._bw_state matches
    const states = await page.evaluate(() => {
      var results = [];
      document.querySelectorAll('[data-card-name]').forEach(function(el) {
        if (el._bw_state) results.push(el._bw_state.count);
      });
      return results;
    });
    expect(states).toEqual([32, 42, 62]);
  });

  test('no JavaScript errors on page load', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    await page.goto('/state-debug.html');
    await page.waitForTimeout(600);

    expect(jsErrors).toEqual([]);
  });

  // ---- o.render / _bw_render tests ----

  test('cards have el._bw_render stored (o.render pattern)', async ({ page }) => {
    const hasRender = await page.evaluate(() => {
      var results = [];
      document.querySelectorAll('[data-card-name]').forEach(function(el) {
        results.push(typeof el._bw_render === 'function');
      });
      return results;
    });
    expect(hasRender).toEqual([true, true, true]);
  });

  test('bw.update(el) re-renders and emits statechange', async ({ page }) => {
    // Manually modify state and call bw.update
    const result = await page.evaluate(() => {
      var el = document.querySelector('[data-card-name="Alpha"]');
      var eventFired = false;
      el.addEventListener('bw:statechange', function() { eventFired = true; });
      el._bw_state.count = 999;
      bw.update(el);
      return {
        displayed: el.querySelector('[data-testid="value"]').textContent,
        state: el._bw_state.count,
        eventFired: eventFired
      };
    });
    expect(result.displayed).toBe('999');
    expect(result.state).toBe(999);
    expect(result.eventFired).toBe(true);
  });

  test('bw.on() receives statechange from card button clicks', async ({ page }) => {
    // Set up a listener on the cards container and click a button
    await page.evaluate(() => {
      window._testEventCount = 0;
      bw.on('#cards-mount', 'statechange', function() {
        window._testEventCount++;
      });
    });

    const cards = page.locator('[data-card-name]');
    await cards.nth(0).locator('button', { hasText: '+' }).click();
    await page.waitForTimeout(100);

    const count = await page.evaluate(() => window._testEventCount);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // ---- Dynamic Counter List tests ----

  test('dynamic list starts empty', async ({ page }) => {
    const items = page.locator('[data-list-item]');
    await expect(items).toHaveCount(0);
  });

  test('Add Counter creates list items', async ({ page }) => {
    // Click Add Counter twice
    await page.locator('button', { hasText: 'Add Counter' }).first().click();
    await page.waitForTimeout(50);
    await page.locator('button', { hasText: 'Add Counter' }).first().click();
    await page.waitForTimeout(50);

    const items = page.locator('[data-list-item]');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText('Counter #1');
    await expect(items.nth(1)).toContainText('Counter #2');
  });

  test('list item + button uses bw.patch (targeted update)', async ({ page }) => {
    // Add a counter, then click + three times
    await page.locator('button', { hasText: 'Add Counter' }).first().click();
    await page.waitForTimeout(50);

    const item = page.locator('[data-list-item]').first();
    for (var i = 0; i < 3; i++) {
      await item.locator('button', { hasText: '+' }).click();
      await page.waitForTimeout(30);
    }

    const val = item.locator('[data-testid="list-value"]');
    await expect(val).toHaveText('3');
  });

  test('list item - button uses bw.patch (targeted update)', async ({ page }) => {
    await page.locator('button', { hasText: 'Add Counter' }).first().click();
    await page.waitForTimeout(50);

    const item = page.locator('[data-list-item]').first();
    // Click + twice then - once → value should be 1
    await item.locator('button', { hasText: '+' }).click();
    await page.waitForTimeout(30);
    await item.locator('button', { hasText: '+' }).click();
    await page.waitForTimeout(30);
    await item.locator('button', { hasText: '\u2013' }).click();
    await page.waitForTimeout(30);

    const val = item.locator('[data-testid="list-value"]');
    await expect(val).toHaveText('1');
  });

  test('Remove button removes only that list item', async ({ page }) => {
    // Add 3 counters
    await page.locator('button', { hasText: 'Add 3' }).click();
    await page.waitForTimeout(100);

    const items = page.locator('[data-list-item]');
    await expect(items).toHaveCount(3);

    // Remove the middle one (Counter #2)
    await items.nth(1).locator('button', { hasText: 'Remove' }).click();
    await page.waitForTimeout(50);

    await expect(page.locator('[data-list-item]')).toHaveCount(2);
    await expect(page.locator('[data-list-item]').nth(0)).toContainText('Counter #1');
    await expect(page.locator('[data-list-item]').nth(1)).toContainText('Counter #3');
  });

  test('UUID survives removal — remaining items keep their IDs', async ({ page }) => {
    // Add 3 counters, record IDs, remove middle, verify IDs
    await page.locator('button', { hasText: 'Add 3' }).click();
    await page.waitForTimeout(100);

    const idsBefore = await page.evaluate(() => {
      var items = document.querySelectorAll('[data-list-item]');
      return Array.from(items).map(function(el) { return el.id; });
    });
    expect(idsBefore).toHaveLength(3);

    // Remove middle item
    await page.locator('[data-list-item]').nth(1).locator('button', { hasText: 'Remove' }).click();
    await page.waitForTimeout(50);

    const idsAfter = await page.evaluate(() => {
      var items = document.querySelectorAll('[data-list-item]');
      return Array.from(items).map(function(el) { return el.id; });
    });
    expect(idsAfter).toHaveLength(2);
    // First and third items should keep their original IDs
    expect(idsAfter[0]).toBe(idsBefore[0]);
    expect(idsAfter[1]).toBe(idsBefore[2]);
  });

  test('bw.patch updates value without rebuilding list', async ({ page }) => {
    // Add a counter, increment it, verify the item's DOM element is the same
    await page.locator('button', { hasText: 'Add Counter' }).first().click();
    await page.waitForTimeout(50);

    // Get the item element's id
    const itemId = await page.evaluate(() => {
      return document.querySelector('[data-list-item]').id;
    });

    // Click + which uses bw.patch
    const item = page.locator('[data-list-item]').first();
    await item.locator('button', { hasText: '+' }).click();
    await page.waitForTimeout(30);

    // The item element should still be the same (not replaced)
    const itemIdAfter = await page.evaluate(() => {
      return document.querySelector('[data-list-item]').id;
    });
    expect(itemIdAfter).toBe(itemId);

    // But the value should have changed
    await expect(item.locator('[data-testid="list-value"]')).toHaveText('1');
  });

  test('Clear All removes all list items', async ({ page }) => {
    await page.locator('button', { hasText: 'Add 3' }).click();
    await page.waitForTimeout(100);
    await expect(page.locator('[data-list-item]')).toHaveCount(3);

    await page.locator('button', { hasText: 'Clear All' }).click();
    await page.waitForTimeout(50);
    await expect(page.locator('[data-list-item]')).toHaveCount(0);
  });

  // ---- List Dashboard tests ----

  test('dashboard appears after adding first item', async ({ page }) => {
    // No dashboard before adding items
    await expect(page.locator('#list-dash')).toHaveCount(0);

    await page.locator('button', { hasText: 'Add Counter' }).first().click();
    await page.waitForTimeout(50);

    await expect(page.locator('#list-dash')).toHaveCount(1);
    await expect(page.locator('#list-dash-count')).toHaveText('1');
    await expect(page.locator('#list-dash-sum')).toHaveText('0');
  });

  test('dashboard stats update on add/remove', async ({ page }) => {
    await page.locator('button', { hasText: 'Add 3' }).click();
    await page.waitForTimeout(100);

    await expect(page.locator('#list-dash-count')).toHaveText('3');

    // Remove one
    await page.locator('[data-list-item]').nth(1).locator('button', { hasText: 'Remove' }).click();
    await page.waitForTimeout(50);

    await expect(page.locator('#list-dash-count')).toHaveText('2');
  });

  test('dashboard sum and average update via bw.patch on value changes', async ({ page }) => {
    await page.locator('button', { hasText: 'Add 3' }).click();
    await page.waitForTimeout(100);

    // Increment first item 6 times → sum=6, avg=2.0
    const items = page.locator('[data-list-item]');
    for (var i = 0; i < 6; i++) {
      await items.nth(0).locator('button', { hasText: '+' }).click();
      await page.waitForTimeout(20);
    }

    await expect(page.locator('#list-dash-sum')).toHaveText('6');
    await expect(page.locator('#list-dash-avg')).toHaveText('2');
  });

  test('sparkline chart records history of item count', async ({ page }) => {
    // Add 3, remove 1, add 1 → history should be [1, 2, 3, 2, 3]
    await page.locator('button', { hasText: 'Add Counter' }).first().click();
    await page.waitForTimeout(30);
    await page.locator('button', { hasText: 'Add Counter' }).first().click();
    await page.waitForTimeout(30);
    await page.locator('button', { hasText: 'Add Counter' }).first().click();
    await page.waitForTimeout(50);

    // Remove middle item
    await page.locator('[data-list-item]').nth(1).locator('button', { hasText: 'Remove' }).click();
    await page.waitForTimeout(50);

    // Add another
    await page.locator('button', { hasText: 'Add Counter' }).first().click();
    await page.waitForTimeout(50);

    // Should have 5 bars in the sparkline
    const bars = page.locator('.spark-bar');
    await expect(bars).toHaveCount(5);
  });

  test('dashboard persists after Clear All (shows history)', async ({ page }) => {
    await page.locator('button', { hasText: 'Add 3' }).click();
    await page.waitForTimeout(100);

    await page.locator('button', { hasText: 'Clear All' }).click();
    await page.waitForTimeout(50);

    // Dashboard should still be visible (history exists)
    await expect(page.locator('#list-dash')).toHaveCount(1);
    await expect(page.locator('#list-dash-count')).toHaveText('0');
    await expect(page.locator('#list-dash-sum')).toHaveText('0');

    // Sparkline should show history including the 0
    const bars = page.locator('.spark-bar');
    const count = await bars.count();
    expect(count).toBeGreaterThanOrEqual(4); // 1,2,3,0
  });

  test('list item values persist after other items are removed', async ({ page }) => {
    // Add 3 counters, increment #1 and #3, remove #2, verify #1 and #3 values
    await page.locator('button', { hasText: 'Add 3' }).click();
    await page.waitForTimeout(100);

    // Increment #1 three times
    const items = page.locator('[data-list-item]');
    for (var i = 0; i < 3; i++) {
      await items.nth(0).locator('button', { hasText: '+' }).click();
      await page.waitForTimeout(20);
    }
    // Increment #3 five times
    for (var j = 0; j < 5; j++) {
      await items.nth(2).locator('button', { hasText: '+' }).click();
      await page.waitForTimeout(20);
    }

    // Remove #2
    await items.nth(1).locator('button', { hasText: 'Remove' }).click();
    await page.waitForTimeout(50);

    // After removal, #1 (now index 0) should still show 3, #3 (now index 1) should show 5
    const remainingItems = page.locator('[data-list-item]');
    await expect(remainingItems).toHaveCount(2);
    await expect(remainingItems.nth(0).locator('[data-testid="list-value"]')).toHaveText('3');
    await expect(remainingItems.nth(1).locator('[data-testid="list-value"]')).toHaveText('5');
  });

  // ---- Section 7: Event Paradigms (pub/sub) tests ----

  test('Section 7 renders with comparison table and demo panels', async ({ page }) => {
    // Comparison table exists
    const emitOnText = page.locator('th:has-text("emit/on"), td:has-text("emit/on")');
    const emitOnCount = await emitOnText.count();
    expect(emitOnCount).toBeGreaterThanOrEqual(1);

    // Notification input and Send button exist
    await expect(page.locator('#notif-input')).toHaveCount(1);
    const sendBtns = page.locator('button', { hasText: 'Send' });
    const sendCount = await sendBtns.count();
    expect(sendCount).toBeGreaterThanOrEqual(1);

    // Subscriber panels exist
    await expect(page.locator('#notif-panel-a')).toHaveCount(1);
    await expect(page.locator('#notif-panel-b')).toHaveCount(1);
  });

  test('notification pub/sub delivers to both subscribers', async ({ page }) => {
    const input = page.locator('#notif-input');
    await input.fill('Hello world');
    await page.locator('button', { hasText: 'Send' }).first().click();
    await page.waitForTimeout(100);

    // Both panels should show the message
    await expect(page.locator('#notif-panel-a')).toContainText('Hello world');
    await expect(page.locator('#notif-panel-b')).toContainText('Hello world');
  });

  test('destroying subscriber B stops it from receiving messages', async ({ page }) => {
    // Send first message to both
    const input = page.locator('#notif-input');
    await input.fill('before destroy');
    await page.locator('button', { hasText: 'Send' }).first().click();
    await page.waitForTimeout(200);

    // Both should have the message
    await expect(page.locator('#notif-panel-a')).toContainText('before destroy');
    await expect(page.locator('#notif-panel-b')).toContainText('before destroy');

    // Destroy subscriber B
    await page.locator('button', { hasText: 'Destroy Subscriber B' }).click();
    await page.waitForTimeout(200);

    // B should show destroyed state
    await expect(page.locator('#notif-panel-b')).toContainText('Cleaned up');

    // Send another message
    await input.fill('after destroy');
    await page.locator('button', { hasText: 'Send' }).first().click();
    await page.waitForTimeout(200);

    // A should have the second message
    await expect(page.locator('#notif-panel-a')).toContainText('after destroy');
    // B should still show destroyed state, not the new message
    await expect(page.locator('#notif-panel-b')).toContainText('Cleaned up');
    await expect(page.locator('#notif-panel-b')).not.toContainText('after destroy');
  });

  test('counter audit log receives events from card buttons', async ({ page }) => {
    // Click + on Alpha card
    const cards = page.locator('[data-card-name]');
    await cards.nth(0).locator('button', { hasText: '+' }).click();
    await page.waitForTimeout(100);

    // Audit log should show the event
    const auditLog = page.locator('#audit-log-box');
    await expect(auditLog).toContainText('Alpha');
    await expect(auditLog).toContainText('+1');
  });

  test('no JavaScript errors with pub/sub section', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    await page.goto('/state-debug.html');
    await page.waitForTimeout(600);

    // Interact with pub/sub demos
    const input = page.locator('#notif-input');
    await input.fill('test message');
    await page.locator('button', { hasText: 'Send' }).first().click();
    await page.waitForTimeout(100);

    expect(jsErrors).toEqual([]);
  });
});
