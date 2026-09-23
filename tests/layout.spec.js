// Layout checks that need a real layout engine. Each one measures something a
// user reported as broken while the jsdom suite was green (#101, #103, #104).
import { test, expect } from '@playwright/test';

async function boxes(page, sel) {
  return page.$$eval(sel, els => els.map(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, right: r.right }; }));
}

test.describe('Layout (computed geometry)', () => {
  test('navbar: brand and links sit on one row (#101)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/tests/fixtures/layout.html');
    const inner = page.locator('.bw_bccl_navbar > div').first();
    await expect(inner).toHaveCSS('display', 'flex');
    const brand = await page.locator('.bw_bccl_navbar_brand').boundingBox();
    const link = await page.locator('.bw_bccl_navbar a').last().boundingBox();
    expect(Math.abs(brand.y - link.y)).toBeLessThan(brand.height);
  });

  test('grid: default columns have a gutter between them (#104)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/tests/fixtures/layout.html');
    const [a, b] = await boxes(page, '#row-default .probe');
    expect(b.x - a.right).toBeGreaterThan(4);   // 0.75rem gutter = 12px
    expect(Math.abs(a.y - b.y)).toBeLessThan(1);
  });

  test('grid: bw_g_4 widens the gutter, bw_g_0 removes it (#104)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/tests/fixtures/layout.html');
    const [d1, d2] = await boxes(page, '#row-default .probe');
    const [w1, w2] = await boxes(page, '#row-g4 .probe');
    const [z1, z2] = await boxes(page, '#row-g0 .probe');
    expect(w2.x - w1.right).toBeGreaterThan(d2.x - d1.right);
    expect(Math.round(z2.x - z1.right)).toBe(0);
  });

  test('grid: size {xs:12, lg:3} is four across at lg and stacked below (#103)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/tests/fixtures/layout.html');
    let cells = await boxes(page, '#row-resp .probe');
    expect(new Set(cells.map(c => Math.round(c.y))).size).toBe(1);

    await page.setViewportSize({ width: 600, height: 800 });
    cells = await boxes(page, '#row-resp .probe');
    expect(new Set(cells.map(c => Math.round(c.y))).size).toBe(4);
  });

  test('container: max-width steps with the viewport (#103)', async ({ page }) => {
    await page.goto('/tests/fixtures/layout.html');
    const expected = { 600: '540px', 800: '720px', 1000: '960px', 1300: '1140px' };
    for (const [w, max] of Object.entries(expected)) {
      await page.setViewportSize({ width: Number(w), height: 800 });
      await expect(page.locator('#container > .bw_bccl_container')).toHaveCSS('max-width', max);
    }
  });
});
