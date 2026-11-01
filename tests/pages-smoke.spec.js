// @ts-check
/**
 * Every page in pages/ must load clean.
 *
 * Why this file exists. The audit of 2026-10-09 found dead API calls and
 * broken data reads on pages nothing ever loaded: self-load-test.html read a
 * builds.json field that does not exist (TypeError, swallowed, four empty
 * tables and a health check that always reported "pass"), shared-nav.js
 * called bw.applyStyles() with an object applyStyles rejects, on every theme
 * toggle on every page, and 12-bwserve-protocol.html linked to a page that
 * 404s. The existing specs visit 8 of 30 pages, so the other 22 could fail
 * forever in silence.
 *
 * This is deliberately shallow -- it asserts no page-specific content, only
 * that the page mounts something, raises no console error and no unhandled
 * exception, and that bitwrench itself loaded. Content assertions belong in
 * the per-page specs.
 */

import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Discovered, not listed, so a new page is covered the day it is added.
const PAGES = readdirSync(resolve(root, 'pages'))
  .filter((f) => f.endsWith('.html'))
  .sort();

// The example apps are the other half of "our own content". They are fuller
// programs than the doc pages -- a dashboard, an SPA, a todo app -- so they
// exercise composition the doc pages do not. Only the ones that actually load
// bitwrench from dist/ are servable here; the embedded and CircuitPython
// examples are firmware and have no page to open.
const EXAMPLES = ['index.html'].concat(
  readdirSync(resolve(root, 'examples'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name + '/index.html')
    .filter((rel) => {
      const abs = resolve(root, 'examples', rel);
      if (!existsSync(abs)) return false;
      return readFileSync(abs, 'utf8').includes('dist/bitwrench');
    })
).sort();

// Noise that is not the page's fault.
function isIgnorable(text) {
  // A missing favicon/logo is a 404 on a resource, not a script failure.
  if (text.includes('Failed to load resource')) return true;
  // Pages that demo a live server log a connection failure when none is running.
  if (/net::ERR_CONNECTION_REFUSED|EventSource|SSE/i.test(text)) return true;
  return false;
}

test.describe('every page loads clean', () => {
  // Enough pages that the default per-test timeout is the wrong unit.
  test.describe.configure({ timeout: 30000 });

  for (const file of PAGES) {
    test(file, async ({ page }) => {
      const problems = [];
      page.on('console', (msg) => {
        if (msg.type() !== 'error' && msg.type() !== 'warning') return;
        const text = msg.text();
        if (isIgnorable(text)) return;
        // A bitwrench console warning means the page called an API wrongly --
        // that is the class of bug this file exists to catch.
        if (msg.type() === 'warning' && !/^bw\./.test(text)) return;
        problems.push(msg.type() + ': ' + text);
      });
      page.on('pageerror', (err) => {
        problems.push('pageerror: ' + err.message);
      });

      const response = await page.goto('/pages/' + file, { waitUntil: 'load' });
      expect(response?.status(), file + ' should serve 200').toBeLessThan(400);

      // Let deferred mounts and theme restoration settle.
      await page.waitForTimeout(400);

      // bitwrench must have loaded and be the version this tree builds.
      const version = await page.evaluate(() => (window.bw ? window.bw.version : null));
      expect(version, file + ' should load bitwrench').toBeTruthy();

      // The page must have rendered something into the body.
      const bodyLength = await page.evaluate(() => document.body.innerHTML.trim().length);
      expect(bodyLength, file + ' rendered an empty body').toBeGreaterThan(200);

      expect(problems, file + ' logged problems:\n  ' + problems.join('\n  ')).toEqual([]);
    });
  }
});

test.describe('verify accepts the TACO the pages actually render', () => {
  // Dogfood at the other end. The unit tests check 51 BCCL factories in
  // isolation; this checks the composed trees 30 real pages build, by loading
  // bitwrench-verify into the page and wrapping bw.create.
  //
  // Errors only. Warnings are advisory by design -- raw-unchecked fires on
  // every legitimate bw.raw(), and handler-string is correct for a page that
  // serialises its handlers.
  test.describe.configure({ timeout: 40000 });

  for (const file of PAGES) {
    test(file, async ({ page }) => {
      // Install before the page's own scripts run, so the wrapper is in place
      // for the first bw.create() call.
      await page.addInitScript(() => {
        window.__bwFindings = [];
        // Counters so the test can prove it checked something. A dogfood that
        // silently stops instrumenting would otherwise pass forever.
        window.__bwRoots = 0;
        window.__bwNodes = 0;
        const countNodes = (t) => {
          if (!t || typeof t !== 'object') return 0;
          if (Array.isArray(t)) return t.reduce((a, x) => a + countNodes(x), 0);
          return 1 + (t.c !== undefined ? countNodes(t.c) : 0);
        };
        let installed = false;
        Object.defineProperty(window, 'bw', {
          configurable: true,
          set(value) {
            delete window.bw;
            window.bw = value;
            if (value && typeof value.create === 'function' && !installed) {
              installed = true;
              const origCreate = value.create;
              value.create = function (taco, opts) {
                try {
                  if (window.bwv && window.bwv.verify && taco && typeof taco === 'object') {
                    window.__bwRoots++;
                    window.__bwNodes += countNodes(taco);
                    window.bwv.verify(taco).forEach((f) => {
                      if (f.severity === 'error') window.__bwFindings.push(f);
                    });
                  }
                } catch (e) { /* a checker must never break the page */ }
                return origCreate.apply(this, arguments);
              };
            }
          },
          get() { return undefined; }
        });
      });

      // The verify build has to be present in the page for the wrapper to use.
      await page.addInitScript({ path: 'dist/bitwrench-verify.min.js' });

      await page.goto('/pages/' + file, { waitUntil: 'load' });
      await page.waitForTimeout(400);

      const probe = await page.evaluate(() => ({
        findings: window.__bwFindings || [],
        roots: window.__bwRoots || 0,
        nodes: window.__bwNodes || 0,
        hasVerify: !!(window.bwv && window.bwv.verify)
      }));

      // Prove the instrumentation ran. Pages mount a few large composed trees
      // rather than many small ones -- 01-components.html is 4 roots carrying
      // 3,536 nodes -- so the root count is low by design and the node count
      // is what shows the tree was actually walked.
      expect(probe.hasVerify, 'bitwrench-verify must be loaded in the page').toBe(true);
      expect(probe.roots, file + ': bw.create was never intercepted').toBeGreaterThan(0);
      expect(probe.nodes, file + ': no TACO nodes were walked').toBeGreaterThan(5);

      const findings = probe.findings;
      const unique = [];
      const seen = new Set();
      for (const f of findings) {
        const k = f.code + '|' + f.path + '|' + (f.key || '');
        if (!seen.has(k)) { seen.add(k); unique.push(f); }
      }
      expect(unique, file + ' renders TACO verify rejects:\n  ' +
        unique.map((f) => f.code + ' at ' + (f.path || 'root') + (f.key ? ' (' + f.key + ')' : '')).join('\n  ')
      ).toEqual([]);
    });
  }
});

test.describe('verify accepts the TACO the example apps render', () => {
  // B11 of dev/bw-2.1.12-plan.md names pages/ AND examples/. The example apps
  // are fuller programs than the doc pages, so they compose more deeply.
  // Same instrumentation as the pages dogfood: wrap bw.create, errors only.
  test.describe.configure({ timeout: 40000 });

  for (const file of EXAMPLES) {
    test(file, async ({ page }) => {
      const problems = [];
      page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));

      await page.addInitScript(() => {
        window.__bwFindings = [];
        window.__bwRoots = 0;
        window.__bwNodes = 0;
        const countNodes = (t) => {
          if (!t || typeof t !== 'object') return 0;
          if (Array.isArray(t)) return t.reduce((a, x) => a + countNodes(x), 0);
          return 1 + (t.c !== undefined ? countNodes(t.c) : 0);
        };
        let installed = false;
        Object.defineProperty(window, 'bw', {
          configurable: true,
          set(value) {
            delete window.bw;
            window.bw = value;
            if (value && typeof value.create === 'function' && !installed) {
              installed = true;
              const origCreate = value.create;
              value.create = function (taco) {
                try {
                  if (window.bwv && window.bwv.verify && taco && typeof taco === 'object') {
                    window.__bwRoots++;
                    window.__bwNodes += countNodes(taco);
                    window.bwv.verify(taco).forEach((f) => {
                      if (f.severity === 'error') window.__bwFindings.push(f);
                    });
                  }
                } catch (e) { /* a checker must never break the page */ }
                return origCreate.apply(this, arguments);
              };
            }
          },
          get() { return undefined; }
        });
      });
      await page.addInitScript({ path: 'dist/bitwrench-verify.min.js' });

      const res = await page.goto('/examples/' + file, { waitUntil: 'load' });
      expect(res?.status(), file + ' should serve').toBeLessThan(400);
      await page.waitForTimeout(500);

      const probe = await page.evaluate(() => ({
        findings: window.__bwFindings || [],
        roots: window.__bwRoots || 0,
        nodes: window.__bwNodes || 0,
        hasVerify: !!(window.bwv && window.bwv.verify)
      }));

      expect(probe.hasVerify, 'verify must be loaded in the page').toBe(true);
      expect(probe.roots, file + ': bw.create was never intercepted').toBeGreaterThan(0);
      expect(probe.nodes, file + ': no TACO nodes were walked').toBeGreaterThan(5);

      const seen = new Set();
      const unique = [];
      for (const f of probe.findings) {
        const k = f.code + '|' + f.path + '|' + (f.key || '');
        if (!seen.has(k)) { seen.add(k); unique.push(f); }
      }
      expect(unique, file + ' renders TACO verify rejects:\n  ' +
        unique.map((f) => f.code + ' at ' + (f.path || 'root') + (f.key ? ' (' + f.key + ')' : '')).join('\n  ')
      ).toEqual([]);
      expect(problems, file + ':\n  ' + problems.join('\n  ')).toEqual([]);
    });
  }
});

test.describe('no page links to a file that is missing', () => {
  test('every relative href between pages resolves', async ({ page }) => {
    const missing = [];
    for (const file of PAGES) {
      await page.goto('/pages/' + file, { waitUntil: 'load' });
      await page.waitForTimeout(200);
      const hrefs = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href]'))
          .map((a) => a.getAttribute('href'))
          .filter(
            (h) =>
              h &&
              !/^(https?:|mailto:|#|\/\/)/.test(h) &&
              !h.startsWith('/')
          )
      );
      for (const href of [...new Set(hrefs)]) {
        const target = href.split('#')[0];
        if (!target) continue;
        const res = await page.request.get('/pages/' + target).catch(() => null);
        if (!res || res.status() >= 400) {
          missing.push(file + ' -> ' + href);
        }
      }
    }
    expect(missing, 'dead links:\n  ' + missing.join('\n  ')).toEqual([]);
  });
});

test.describe('API reference search still filters', () => {
  // The filter was rewritten to drop 261 data-* attributes and the raw
  // document queries, matching on textContent and class tokens instead.
  // Load-clean does not prove it still works, so exercise it.
  test('typing narrows entries and hides emptied categories', async ({ page }) => {
    await page.goto('/pages/08-api-reference.html', { waitUntil: 'load' });
    await page.waitForTimeout(400);

    const allEntries = await page.locator('.api-entry').count();
    expect(allEntries, 'entries should render').toBeGreaterThan(50);

    const visible = () => page.locator('.api-entry:not(.hidden)').count();
    expect(await visible()).toBe(allEntries);

    await page.fill('#api-search', 'makecard');
    await page.waitForTimeout(250);

    const narrowed = await visible();
    expect(narrowed, 'search should narrow the list').toBeGreaterThan(0);
    expect(narrowed, 'search should narrow the list').toBeLessThan(allEntries);

    // The surviving entry really is the one asked for.
    const text = await page.locator('.api-entry:not(.hidden)').first().textContent();
    expect(text.toLowerCase()).toContain('makecard');

    // At least one category got hidden because all its entries filtered out.
    const hiddenCats = await page.locator('.api-category.hidden').count();
    expect(hiddenCats, 'emptied categories should hide').toBeGreaterThan(0);

    // TOC links narrow too.
    const tocVisible = await page.locator('.api-toc-link:not(.hidden)').count();
    const tocAll = await page.locator('.api-toc-link').count();
    expect(tocVisible).toBeLessThan(tocAll);

    // Clearing restores everything.
    await page.fill('#api-search', '');
    await page.waitForTimeout(250);
    expect(await visible()).toBe(allEntries);
    expect(await page.locator('.api-category.hidden').count()).toBe(0);
  });
});
