# Bitwrench 2.x Browser Compatibility Strategy

**Date**: February 2026

## Philosophy

Supporting older browsers is not just about backward compatibility - it enforces architectural discipline. If it works in IE8, it almost certainly works everywhere: every mobile browser, every embedded WebView, every kiosk, every smart TV browser. Constraints breed better design.

The same principle applies to bitwrench's "no compiler needed" philosophy. If we require modern JS syntax, we implicitly require a build step for older environments. That undermines the core value proposition.

## Compatibility Tiers

### Tier 1: Full Support (Must Work)
- **Modern browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile**: iOS Safari, Chrome Android (latest 2 versions)
- **IE11**: Last version with significant enterprise usage

Everything works: TACO rendering, components, CSS generation, lifecycle hooks, event handling.

### Tier 2: Core Support (Basic Functionality)
- **IE9-10**: No MutationObserver, limited CSS3
- **Older mobile**: Android 4.x WebView

Core works: `bw.html()`, `bw.DOM()`, basic components, CSS class application. Advanced features (lifecycle hooks, MutationObserver cleanup, CSS Grid layouts) gracefully degrade.

### Tier 3: Minimal Support (HTML Generation Only)
- **IE8**: No addEventListener, no querySelector, no classList
- **Very old mobile**: Pre-Android 4

HTML string generation works: `bw.html(taco)` produces valid HTML. Can be used server-side or in environments where innerHTML is the only option. No interactive features.

## What Each Tier Loses

| Feature | Tier 1 | Tier 2 | Tier 3 |
|---------|--------|--------|--------|
| `bw.html()` (string gen) | Yes | Yes | Yes |
| `bw.DOM()` (mount to DOM) | Yes | Yes | Partial (innerHTML) |
| `bw.css()` (CSS generation) | Yes | Yes | Yes |
| Event handlers in TACO | Yes | Yes (with attachEvent) | No |
| Lifecycle hooks (mounted/unmount) | Yes | Partial (no MutationObserver) | No |
| CSS Grid layouts | Yes | No (flexbox fallback) | No (float fallback) |
| Flexbox layouts | Yes | Yes | No (float fallback) |
| CSS transitions/animations | Yes | Partial | No |
| `bw.cleanup()` auto-cleanup | Yes | Manual only | No |
| Component handles | Yes | Partial | No |
| `bw.$()` selector | Yes | Yes (querySelector) | Partial (getElementById) |
| WeakMap for references | Yes | Polyfill needed | No |

## Implementation Strategy

### Feature Detection (Not Browser Detection)

Never sniff user agents. Always detect capabilities:

```javascript
bw.support = {};

// Check once at init, store results
bw.support.addEventListener = typeof window !== 'undefined' && 'addEventListener' in window;
bw.support.querySelector = typeof document !== 'undefined' && 'querySelector' in document;
bw.support.classList = typeof document !== 'undefined' && 'classList' in document.createElement('div');
bw.support.mutationObserver = typeof MutationObserver !== 'undefined';
bw.support.weakMap = typeof WeakMap !== 'undefined';
bw.support.flexbox = typeof document !== 'undefined' && 'flexBasis' in document.createElement('div').style;
bw.support.cssGrid = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('display', 'grid');
bw.support.customEvent = typeof CustomEvent === 'function';
bw.support.structuredClone = typeof structuredClone === 'function';
bw.support.isConnected = typeof document !== 'undefined' && 'isConnected' in document.createElement('div');
```

### Graceful Degradation Patterns

#### Event Handling
```javascript
// Internal helper - attach event cross-browser
function addEvent(el, event, handler) {
  if (el.addEventListener) {
    el.addEventListener(event, handler, false);
  } else if (el.attachEvent) {
    el.attachEvent('on' + event, handler);
  } else {
    el['on' + event] = handler;
  }
}
```

#### Class Manipulation
```javascript
// Internal helper - classList or string manipulation
function addClass(el, className) {
  if (el.classList) {
    el.classList.add(className);
  } else {
    if ((' ' + el.className + ' ').indexOf(' ' + className + ' ') === -1) {
      el.className += ' ' + className;
    }
  }
}
```

#### DOM Selection
```javascript
// bw.$ always returns array
bw.$ = function(selector) {
  if (typeof selector !== 'string') return selector.nodeType ? [selector] : [];

  if (document.querySelectorAll) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  // IE8 fallback: only ID selectors
  if (selector.charAt(0) === '#') {
    var el = document.getElementById(selector.substring(1));
    return el ? [el] : [];
  }

  // IE8: getElementsByTagName / getElementsByClassName
  if (selector.charAt(0) === '.') {
    if (document.getElementsByClassName) {
      return Array.prototype.slice.call(document.getElementsByClassName(selector.substring(1)));
    }
  }

  return Array.prototype.slice.call(document.getElementsByTagName(selector));
};
```

### CSS Fallback Strategy

#### Layout Fallbacks
```javascript
// Grid generation accounts for browser support
bw._generateGridCSS = function(columns, gap) {
  var rules = {};

  // Modern: CSS Grid
  rules['.bw-grid'] = {
    display: 'grid',
    'grid-template-columns': 'repeat(' + columns + ', 1fr)',
    gap: gap
  };

  // Fallback: Flexbox
  rules['.bw-grid'] = {
    display: 'flex',          // Flex works in IE10+
    'flex-wrap': 'wrap'
  };
  rules['.bw-grid > *'] = {
    'flex': '0 0 ' + (100 / columns) + '%',
    'padding': '0 ' + (parseInt(gap) / 2) + 'px'
  };

  // Deep fallback: Floats (IE8+)
  rules['.bw-grid > *'] = {
    'float': 'left',
    'width': (100 / columns) + '%',
    'padding': '0 ' + (parseInt(gap) / 2) + 'px',
    'box-sizing': 'border-box'  // IE8 with polyfill
  };
  rules['.bw-grid::after'] = {
    content: '""',
    display: 'table',
    clear: 'both'
  };

  return rules;
};
```

#### Progressive CSS Output
```javascript
// bw.css() can output with fallbacks
bw.css = function(rules, options) {
  var opts = options || {};
  var output = '';

  // If legacy mode, include fallbacks
  if (opts.legacy || !bw.support.flexbox) {
    output += generateFallbackCSS(rules);
  }

  output += generateModernCSS(rules);

  return output;
};
```

## Polyfills: Include vs Require

### Included in bitwrench (tiny, essential)
- `Array.isArray` (IE8)
- `Array.prototype.indexOf` (IE8)
- `Array.prototype.forEach` (IE8)
- `Array.prototype.map` (IE8)
- `Array.prototype.filter` (IE8)
- `Object.keys` (IE8)
- `String.prototype.trim` (IE8)
- `JSON.parse` / `JSON.stringify` (IE7 - only if not present)

These are small (< 1KB total), essential for core functionality, and safe to include.

### NOT included (user must provide if targeting IE8-10)
- `Promise` (use es6-promise if needed)
- `WeakMap` (bitwrench degrades without it)
- `MutationObserver` (bitwrench degrades without it)
- `CustomEvent` constructor (bitwrench degrades without it)
- `CSS.supports` (bitwrench degrades without it)

## Testing Strategy

### Automated
- Modern browsers: Playwright (Chrome, Firefox, WebKit)
- IE11: Karma or manual testing in VM

### Manual / Periodic
- IE9-10: BrowserStack or VM
- IE8: VM only, test `bw.html()` output
- Mobile: BrowserStack device farm

### Compatibility Test Suite
```javascript
// test/compatibility.js
// These tests must pass in ALL tiers

describe('Tier 3 (HTML generation)', function() {
  it('bw.html() produces valid HTML from TACO', function() { });
  it('bw.css() produces valid CSS from rules', function() { });
  it('Nested TACO objects render correctly', function() { });
  it('Attributes are properly escaped', function() { });
});

describe('Tier 2 (Basic DOM)', function() {
  it('bw.DOM() mounts content to selector', function() { });
  it('Event handlers fire on click', function() { });
  it('bw.$() returns array of elements', function() { });
});

describe('Tier 1 (Full features)', function() {
  it('Lifecycle hooks fire correctly', function() { });
  it('Component cleanup removes listeners', function() { });
  it('Theme switching updates all components', function() { });
});
```

## The Discipline Argument

Supporting older browsers forces us to:

1. **Keep the core small**: No WeakRef, no Proxy, no optional chaining in core paths
2. **Use simple DOM APIs**: If `classList` isn't available, our class manipulation must work with `className` strings too
3. **Avoid CSS-only solutions**: If CSS Grid isn't available, layouts must degrade to floats
4. **Ship less JavaScript**: Older browsers have slower JS engines, so every byte matters
5. **Test fundamentals**: If `bw.html()` works in IE8, it works EVERYWHERE

This discipline directly benefits:
- Embedded systems (IoT dashboards, industrial HMIs)
- Kiosks and point-of-sale systems
- Government/enterprise environments with locked-down browsers
- Email HTML generation (email clients are effectively IE8-level)
- Mobile WebViews in developing markets

## Decision Points

1. **Should polyfills be in the main bundle or separate?** Recommendation: Separate file `bitwrench-polyfills.js` that users include BEFORE bitwrench if needed.

2. **Should we use ES5 syntax in source?** Recommendation: Write in modern JS, transpile to ES5 for the legacy build. Two dist files: `bitwrench.js` (ES2015+) and `bitwrench.es5.js` (IE8+).

3. **How much performance overhead is acceptable for compatibility?** Feature detection at init is fine (runs once). Per-operation checks (like `classList` vs `className`) add trivial overhead.

4. **When does IE8 support become a burden?** When it prevents shipping a feature that 99% of users need. At that point, the feature goes in Tier 1/2 only and Tier 3 gets the degraded path.
