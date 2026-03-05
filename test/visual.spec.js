import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:8081';
const EXAMPLES = [
  { path: '/index.html', name: 'Index Page' },
  { path: '/pages/00-quick-start.html', name: 'Quick Start' },
  { path: '/pages/01-components.html', name: 'Components' },
  { path: '/pages/02-tables-forms.html', name: 'Tables & Forms' },
  { path: '/pages/03-styling.html', name: 'Styling' },
  { path: '/pages/04-dashboard.html', name: 'Dashboard' },
  { path: '/pages/05-state.html', name: 'State' },
  { path: '/pages/06-tic-tac-toe-tutorial.html', name: 'Tic Tac Toe Tutorial' }
];

// Visual regression test for each page
EXAMPLES.forEach(({ path, name }) => {
  test.describe(`${name} - Visual & Functional Tests`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}${path}`);
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
    });

    test('should have proper styling and layout', async ({ page }) => {
      // Check navigation is visible and styled
      const nav = page.locator('.example-nav');
      await expect(nav).toBeVisible();
      
      // Check navigation background color
      const navBg = await nav.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(navBg).toBe('rgb(26, 26, 26)'); // #1a1a1a - updated nav color
      
      // Check main content area
      const mainContent = page.locator('.bw-container').first();
      await expect(mainContent).toBeVisible();
      
      // Check font family
      const fontFamily = await page.evaluate(() => 
        window.getComputedStyle(document.body).fontFamily
      );
      expect(fontFamily).toContain('system-ui');
      
      // Take screenshot for visual regression
      await page.screenshot({ 
        path: `test/screenshots/${name.toLowerCase().replace(/\s+/g, '-')}-full.png`,
        fullPage: true 
      });
    });

    test('should have responsive design', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500); // Wait for responsive adjustments
      
      // Check navigation doesn't overflow
      const navOverflow = await page.evaluate(() => {
        const nav = document.querySelector('.example-nav');
        return nav.scrollWidth > nav.clientWidth;
      });
      expect(navOverflow).toBeFalsy();
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);
    });

    test('should have proper color contrast', async ({ page }) => {
      // Check text contrast ratios
      const contrastResults = await page.evaluate(() => {
        const getContrast = (rgb1, rgb2) => {
          const getLuminance = (r, g, b) => {
            const [rs, gs, bs] = [r, g, b].map(c => {
              c = c / 255;
              return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
          };
          
          const parseRgb = (rgb) => {
            const match = rgb.match(/\d+/g);
            return match ? match.map(Number) : [0, 0, 0];
          };
          
          const [r1, g1, b1] = parseRgb(rgb1);
          const [r2, g2, b2] = parseRgb(rgb2);
          
          const l1 = getLuminance(r1, g1, b1);
          const l2 = getLuminance(r2, g2, b2);
          
          const lighter = Math.max(l1, l2);
          const darker = Math.min(l1, l2);
          
          return (lighter + 0.05) / (darker + 0.05);
        };
        
        const results = [];
        const elements = document.querySelectorAll('h1, h2, h3, p, .bw-nav-link');
        
        elements.forEach(el => {
          const styles = window.getComputedStyle(el);
          const bg = styles.backgroundColor;
          const color = styles.color;
          const contrast = getContrast(color, bg);
          
          results.push({
            selector: el.tagName.toLowerCase() + (el.className ? '.' + el.className : ''),
            contrast,
            passes: contrast >= 4.5 // WCAG AA standard
          });
        });
        
        return results;
      });
      
      // All text should pass contrast requirements
      const failedContrast = contrastResults.filter(r => !r.passes);
      expect(failedContrast).toHaveLength(0);
    });
  });
});

// Specific functional tests for interactive components
test.describe('Interactive Components', () => {
  test('Tic Tac Toe game should be fully functional', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/06-tic-tac-toe-tutorial.html`);
    
    // Find the final game implementation
    const gameBoard = page.locator('#final-game .game-board').first();
    await expect(gameBoard).toBeVisible();
    
    // Play a game
    const squares = gameBoard.locator('.square');
    await expect(squares).toHaveCount(9);
    
    // Click squares to play (winning pattern for X)
    await squares.nth(0).click(); // X at (0,0)
    await squares.nth(1).click(); // O at (0,1)
    await squares.nth(4).click(); // X at (1,1)
    await squares.nth(2).click(); // O at (0,2)
    await squares.nth(8).click(); // X at (2,2) - diagonal win
    
    // Check for winner
    const status = page.locator('#final-game .status').first();
    await expect(status).toContainText('Winner: X');
    
    // Check winning squares are highlighted
    const winningSquares = page.locator('#final-game .square.winning');
    await expect(winningSquares).toHaveCount(3);
  });

  test('Table sorting should work correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/02-tables-forms.html`);
    
    // Find sortable table
    const table = page.locator('.bw-table').first();
    await expect(table).toBeVisible();
    
    // Click on Name header to sort
    const nameHeader = table.locator('th').filter({ hasText: 'Name' });
    await nameHeader.click();
    
    // Verify sorting indicator appears
    const sortIcon = nameHeader.locator('.sort-icon');
    await expect(sortIcon).toBeVisible();
    
    // Get first row name
    const firstName = await table.locator('tbody tr').first().locator('td').first().textContent();
    
    // Click again to reverse sort
    await nameHeader.click();
    
    // Verify order changed
    const newFirstName = await table.locator('tbody tr').first().locator('td').first().textContent();
    expect(firstName).not.toBe(newFirstName);
  });

  test('Theme switcher should apply themes correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/03-styling.html`);
    
    // Find theme buttons
    const darkThemeBtn = page.locator('[data-theme="dark"]');
    await darkThemeBtn.click();
    
    // Check body has dark-theme class
    await expect(page.locator('body')).toHaveClass(/dark-theme/);
    
    // Check background color changed
    const bgColor = await page.evaluate(() => 
      window.getComputedStyle(document.body).backgroundColor
    );
    expect(bgColor).toBe('rgb(26, 26, 26)'); // Dark theme background
  });

  test('Copy buttons should work', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/00-quick-start.html`);
    
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);
    
    // Find first copy button
    const copyBtn = page.locator('.copy-btn').first();
    await expect(copyBtn).toBeVisible();
    
    // Click copy button
    await copyBtn.click();
    
    // Check button text changed
    await expect(copyBtn).toHaveText('Copied!');
    
    // Wait for it to revert
    await page.waitForTimeout(2500);
    await expect(copyBtn).toHaveText('Copy');
  });
});

// Performance tests
test.describe('Performance', () => {
  test('Pages should load quickly', async ({ page }) => {
    const metrics = [];
    
    for (const { path, name } of EXAMPLES) {
      await page.goto(`${BASE_URL}${path}`);
      
      const performanceTiming = await page.evaluate(() => 
        JSON.parse(JSON.stringify(window.performance.timing))
      );
      
      const loadTime = performanceTiming.loadEventEnd - performanceTiming.navigationStart;
      
      metrics.push({
        page: name,
        loadTime,
        domReady: performanceTiming.domContentLoadedEventEnd - performanceTiming.navigationStart
      });
      
      // Page should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000);
    }
    
    console.table(metrics);
  });

  test('DOM updates should be efficient', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/06-tic-tac-toe-tutorial.html`);
    
    // Measure render performance
    const renderMetrics = await page.evaluate(async () => {
      const gameBoard = document.querySelector('#final-game .game-board');
      const squares = gameBoard.querySelectorAll('.square');
      
      const start = performance.now();
      
      // Simulate 100 clicks
      for (let i = 0; i < 100; i++) {
        const index = i % 9;
        squares[index].click();
      }
      
      const end = performance.now();
      
      return {
        totalTime: end - start,
        averageTime: (end - start) / 100
      };
    });
    
    // Average render time should be under 10ms
    expect(renderMetrics.averageTime).toBeLessThan(10);
  });
});

// Accessibility tests
test.describe('Accessibility', () => {
  test('All images should have alt text', async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    
    const imagesWithoutAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => !img.alt).map(img => img.src);
    });
    
    expect(imagesWithoutAlt).toHaveLength(0);
  });

  test('Forms should have proper labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/02-tables-forms.html`);
    
    const inputsWithoutLabels = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      return inputs.filter(input => {
        const id = input.id;
        if (!id) return true;
        const label = document.querySelector(`label[for="${id}"]`);
        return !label;
      }).length;
    });
    
    expect(inputsWithoutLabels).toBe(0);
  });

  test('Interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/01-components.html`);
    
    // Tab through page
    await page.keyboard.press('Tab');
    
    // Check focused element is visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el.tagName,
        visible: el.offsetParent !== null
      };
    });
    
    expect(focusedElement.visible).toBeTruthy();
  });
});

// CSS and styling tests
test.describe('CSS and Styling', () => {
  test('Custom CSS properties should be applied', async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    
    // Check CSS variables are defined
    const cssVars = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return {
        primary: styles.getPropertyValue('--bw-primary'),
        secondary: styles.getPropertyValue('--bw-secondary'),
        success: styles.getPropertyValue('--bw-success')
      };
    });
    
    // Bitwrench should define these variables
    expect(cssVars.primary).toBeTruthy();
  });

  test('Components should have consistent spacing', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/01-components.html`);
    
    const spacings = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.bw-card'));
      return cards.map(card => {
        const styles = window.getComputedStyle(card);
        return {
          padding: styles.padding,
          margin: styles.margin
        };
      });
    });
    
    // All cards should have same spacing
    const firstSpacing = spacings[0];
    spacings.forEach(spacing => {
      expect(spacing.padding).toBe(firstSpacing.padding);
    });
  });
});