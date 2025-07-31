# Bitwrench v2 Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for Bitwrench v2, ensuring reliability across different environments (browsers, Node.js) and module formats (UMD, ESM, CJS).

## Testing Philosophy

1. **Zero-dependency testing** - Tests should work without external testing frameworks when possible
2. **Cross-environment** - Same tests run in browsers and Node.js
3. **Visual verification** - Component tests should be visually verifiable
4. **Performance awareness** - Track bundle size and execution speed
5. **Backward compatibility** - Ensure v1 functions still work correctly

## Test Categories

### 1. Unit Tests

#### Core Functions
```javascript
// test/unit/core.test.js
describe('Core Functions', () => {
  describe('bw.typeOf', () => {
    it('detects basic types', () => {
      assert(bw.typeOf(123) === 'number');
      assert(bw.typeOf('hello') === 'string');
      assert(bw.typeOf(true) === 'boolean');
      assert(bw.typeOf(null) === 'null');
      assert(bw.typeOf(undefined) === 'undefined');
    });
    
    it('detects complex types', () => {
      assert(bw.typeOf([]) === 'array');
      assert(bw.typeOf(new Date()) === 'Date');
      assert(bw.typeOf(/regex/) === 'RegExp');
      assert(bw.typeOf(new Map()) === 'Map');
    });
  });
  
  describe('bw.uuid', () => {
    it('generates unique ids', () => {
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        ids.add(bw.uuid());
      }
      assert(ids.size === 1000);
    });
    
    it('follows expected format', () => {
      const uuid = bw.uuid();
      assert(uuid.startsWith('bw_'));
      assert(uuid.length > 10);
    });
  });
});
```

#### TACO Engine Tests
```javascript
// test/unit/taco.test.js
describe('TACO Engine', () => {
  describe('bw.html', () => {
    it('converts simple TACO to HTML', () => {
      const taco = { t: 'div', a: { class: 'test' }, c: 'Hello' };
      const html = bw.html(taco);
      assert(html === '<div class="test">Hello</div>');
    });
    
    it('handles nested TACO', () => {
      const taco = {
        t: 'ul',
        c: [
          { t: 'li', c: 'Item 1' },
          { t: 'li', c: 'Item 2' }
        ]
      };
      const html = bw.html(taco);
      assert(html === '<ul><li>Item 1</li><li>Item 2</li></ul>');
    });
    
    it('escapes HTML in content', () => {
      const taco = { t: 'div', c: '<script>alert("xss")</script>' };
      const html = bw.html(taco);
      assert(html.includes('&lt;script&gt;'));
      assert(!html.includes('<script>'));
    });
    
    it('handles self-closing tags', () => {
      const taco = { t: 'img', a: { src: 'test.jpg' } };
      const html = bw.html(taco);
      assert(html === '<img src="test.jpg" />');
    });
  });
  
  describe('bw.createDOM', () => {
    it('creates DOM elements (browser only)', function() {
      if (bw._isNode) this.skip();
      
      const taco = { t: 'button', a: { class: 'btn' }, c: 'Click' };
      const el = bw.createDOM(taco);
      
      assert(el.tagName === 'BUTTON');
      assert(el.className === 'btn');
      assert(el.textContent === 'Click');
    });
    
    it('attaches event handlers', function() {
      if (bw._isNode) this.skip();
      
      let clicked = false;
      const taco = {
        t: 'button',
        a: { onclick: () => { clicked = true; } },
        c: 'Click'
      };
      
      const el = bw.createDOM(taco);
      el.click();
      assert(clicked === true);
    });
  });
});
```

### 2. Component Tests

#### Visual Component Tests
```javascript
// test/components/visual.test.js
describe('Component Library', () => {
  describe('Button Component', () => {
    it('renders all variants', () => {
      const variants = ['primary', 'secondary', 'success', 'danger'];
      const buttons = variants.map(variant => 
        bw.components.Button({ variant, children: variant })
      );
      
      // Visual test - render to test container
      if (bw._isBrowser) {
        const container = document.getElementById('test-container');
        buttons.forEach(btn => {
          container.appendChild(bw.createDOM(btn));
        });
      }
      
      // Structural test
      buttons.forEach((btn, i) => {
        assert(btn.t === 'button');
        assert(btn.a.class.includes(`btn-${variants[i]}`));
      });
    });
  });
  
  describe('Card Component', () => {
    it('renders with all options', () => {
      const card = bw.components.Card({
        header: 'Header',
        title: 'Title',
        subtitle: 'Subtitle',
        text: 'Content',
        footer: 'Footer'
      });
      
      const html = bw.html(card);
      assert(html.includes('Header'));
      assert(html.includes('Title'));
      assert(html.includes('Subtitle'));
      assert(html.includes('Content'));
      assert(html.includes('Footer'));
    });
  });
});
```

### 3. Integration Tests

#### Theme Switching Tests
```javascript
// test/integration/theme.test.js
describe('Theme System', () => {
  it('switches themes', function() {
    if (bw._isNode) this.skip();
    
    // Set light theme
    bw.setTheme('light');
    assert(bw.currentTheme === 'light');
    
    // Check CSS variables
    const styles = getComputedStyle(document.documentElement);
    assert(styles.getPropertyValue('--bw-color-background') === '#ffffff');
    
    // Switch to dark
    bw.setTheme('dark');
    assert(bw.currentTheme === 'dark');
    assert(styles.getPropertyValue('--bw-color-background') === '#212529');
  });
  
  it('emits theme change events', function(done) {
    if (bw._isNode) this.skip();
    
    window.addEventListener('bw-theme-change', function handler(e) {
      assert(e.detail.oldTheme === 'light');
      assert(e.detail.newTheme === 'dark');
      window.removeEventListener('bw-theme-change', handler);
      done();
    });
    
    bw.setTheme('dark');
  });
});
```

#### Module Format Tests
```javascript
// test/integration/modules.test.js
describe('Module Formats', () => {
  it('works as UMD', function() {
    // Test global attachment
    assert(typeof window.bw !== 'undefined');
    assert(typeof window.bw.html === 'function');
  });
  
  it('works as CommonJS', function() {
    if (!bw._isNode) this.skip();
    
    // Test require
    const bw2 = require('../dist/bitwrench.cjs.js');
    assert(typeof bw2.html === 'function');
  });
  
  it('works as ESM', async function() {
    if (!bw._isNode) this.skip();
    
    // Test import
    const { default: bw3 } = await import('../dist/bitwrench.esm.js');
    assert(typeof bw3.html === 'function');
  });
});
```

### 4. Legacy Compatibility Tests

```javascript
// test/legacy/v1-compat.test.js
describe('v1 Compatibility', () => {
  describe('Random Functions', () => {
    it('bw.random works with v1 signature', () => {
      const n = bw.random(0, 100);
      assert(n >= 0 && n <= 100);
      assert(Number.isInteger(n));
    });
    
    it('generates arrays with dims option', () => {
      const arr = bw.random(0, 10, { dims: [3, 4] });
      assert(arr.length === 3);
      assert(arr[0].length === 4);
      assert(typeof arr[0][0] === 'number');
    });
  });
  
  describe('File I/O', () => {
    it('bw.getFile exists', () => {
      assert(typeof bw.getFile === 'function');
    });
    
    it('bw.saveClientFile exists', () => {
      assert(typeof bw.saveClientFile === 'function');
    });
  });
  
  describe('HTML Generation', () => {
    it('v1 style array syntax works', () => {
      const html = bw.html(['div', { class: 'test' }, 'content']);
      assert(html === '<div class="test">content</div>');
    });
  });
});
```

### 5. Performance Tests

```javascript
// test/performance/perf.test.js
describe('Performance', () => {
  it('renders 1000 elements quickly', function() {
    const start = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      bw.html({ t: 'div', a: { id: `div-${i}` }, c: `Content ${i}` });
    }
    
    const duration = performance.now() - start;
    assert(duration < 100, `Took ${duration}ms, should be < 100ms`);
  });
  
  it('bundle size is reasonable', function() {
    // Check dist file sizes
    const maxSizes = {
      'bitwrench.umd.min.js': 50 * 1024, // 50KB
      'bitwrench.esm.min.js': 45 * 1024, // 45KB
      'bitwrench.css': 20 * 1024 // 20KB
    };
    
    // Implementation would check actual file sizes
  });
});
```

### 6. Browser Compatibility Tests

```javascript
// test/compat/browsers.test.js
describe('Browser Compatibility', () => {
  it('works in IE11', function() {
    // Check for ES5 compatibility
    assert(typeof Object.assign === 'function' || bw._polyfills);
    assert(typeof Array.from === 'function' || bw._polyfills);
  });
  
  it('uses native features when available', function() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      const uuid = bw.uuid();
      // Should use native randomUUID
      assert(uuid.length === 36 || uuid.startsWith('bw_'));
    }
  });
});
```

## Test Infrastructure

### Test Runner Configuration

```javascript
// test/runner.js
const TestRunner = {
  suites: [],
  results: { passed: 0, failed: 0, skipped: 0 },
  
  describe(name, fn) {
    this.suites.push({ name, fn });
  },
  
  it(name, fn) {
    try {
      if (fn.length > 0) {
        // Async test
        return new Promise((resolve, reject) => {
          fn((err) => err ? reject(err) : resolve());
        });
      } else {
        fn();
      }
      this.results.passed++;
      console.log('✓', name);
    } catch (e) {
      this.results.failed++;
      console.error('✗', name, e.message);
    }
  },
  
  async run() {
    console.log('Running Bitwrench v2 Tests...\n');
    
    for (const suite of this.suites) {
      console.log(suite.name);
      await suite.fn();
      console.log('');
    }
    
    console.log('\nResults:');
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Skipped: ${this.results.skipped}`);
    
    return this.results.failed === 0;
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.TestRunner = TestRunner;
} else {
  module.exports = TestRunner;
}
```

### Browser Test Page

```html
<!-- test/index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Bitwrench v2 Tests</title>
  <link rel="stylesheet" href="../dist/bitwrench.css">
  <style>
    body { padding: 20px; font-family: monospace; }
    .pass { color: green; }
    .fail { color: red; }
    #test-container { 
      border: 1px solid #ccc; 
      padding: 20px; 
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>Bitwrench v2 Browser Tests</h1>
  
  <div id="test-output"></div>
  <div id="test-container"></div>
  
  <script src="../dist/bitwrench.umd.js"></script>
  <script src="runner.js"></script>
  <script src="unit/core.test.js"></script>
  <script src="unit/taco.test.js"></script>
  <script src="components/visual.test.js"></script>
  <script src="integration/theme.test.js"></script>
  <script>
    TestRunner.run().then(success => {
      document.body.className = success ? 'pass' : 'fail';
    });
  </script>
</body>
</html>
```

### Node.js Test Script

```javascript
// test/node-test.js
const path = require('path');
const { JSDOM } = require('jsdom');

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = window.document;

// Load bitwrench
const bw = require('../dist/bitwrench.cjs.js');
global.bw = bw;

// Load test runner
const TestRunner = require('./runner.js');
global.describe = TestRunner.describe.bind(TestRunner);
global.it = TestRunner.it.bind(TestRunner);
global.assert = require('assert').strict;

// Load tests
require('./unit/core.test.js');
require('./unit/taco.test.js');
require('./integration/modules.test.js');
require('./legacy/v1-compat.test.js');

// Run tests
TestRunner.run().then(success => {
  process.exit(success ? 0 : 1);
});
```

## Coverage Requirements

- **Overall**: 80% minimum
- **Core functions**: 95% minimum
- **Components**: 90% minimum
- **Legacy compatibility**: 100%

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [14, 16, 18]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm run test:browser
```

## Visual Regression Testing

```javascript
// test/visual/capture.js
const puppeteer = require('puppeteer');

async function captureVisualTests() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Load test page
  await page.goto('file://' + path.join(__dirname, 'visual-tests.html'));
  
  // Capture each component
  const components = ['button', 'card', 'table', 'form'];
  
  for (const comp of components) {
    await page.screenshot({
      path: `screenshots/${comp}.png`,
      clip: await page.$eval(`#${comp}-test`, el => {
        const { x, y, width, height } = el.getBoundingClientRect();
        return { x, y, width, height };
      })
    });
  }
  
  await browser.close();
}
```

## Testing Commands

```json
{
  "scripts": {
    "test": "npm run test:node && npm run test:browser",
    "test:node": "node test/node-test.js",
    "test:browser": "karma start",
    "test:visual": "node test/visual/capture.js",
    "test:coverage": "nyc npm test",
    "test:size": "size-limit",
    "test:lint": "eslint src test"
  }
}
```

## Best Practices

1. **Test file naming**: `*.test.js` for unit tests, `*.spec.js` for integration
2. **Test isolation**: Each test should be independent
3. **Mock sparingly**: Prefer real implementations when possible
4. **Visual tests**: Include screenshots in PR reviews
5. **Performance budgets**: Fail tests if size/speed exceeds limits
6. **Cross-browser**: Test on Chrome, Firefox, Safari, Edge, and IE11

## Future Enhancements

1. **E2E Testing**: Add Playwright for full application testing
2. **Accessibility**: Automated a11y testing with axe-core
3. **Mutation Testing**: Ensure test quality with Stryker
4. **Fuzz Testing**: Random input generation for robustness
5. **Benchmark Suite**: Track performance over time