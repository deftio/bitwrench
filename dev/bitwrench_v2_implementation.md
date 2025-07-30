# Bitwrench v2 Implementation Plan

## Executive Summary

After analyzing the design documents and current implementation, there are significant gaps between what's designed and what's built. The examples_v2 are failing because many core features and components are missing from the implementation. However, many functions already exist in bitwrench v1 and should be leveraged rather than recreated.

## Current State Analysis

### What's Implemented ✅

1. **Core TACO Engine** (src/bitwrench_v2.js)
   - `bw.html()` - Convert TACO to HTML string
   - `bw.createDOM()` - Create DOM elements from TACO  
   - `bw.DOM()` - Mount TACO to DOM
   - `bw.cleanup()` - Lifecycle management
   - `bw.css()` - Basic CSS generation
   - `bw.injectCSS()` - Inject CSS into document

2. **Basic Components** (src/bitwrench-components-inline.js)
   - Navbar, Container, Row, Col
   - Card, Button, Alert, Badge, Progress
   - PageHeader, StatCard, Table, SortableTable

3. **Utility Functions**
   - Type detection, UUID generation
   - Color functions (parse, HSL/RGB conversion)
   - Basic array utilities
   - Cookie and URL param handling

### What's Already in v1 That We Can Use 🔄

1. **Random Data Generation** - ALREADY EXISTS
   - `bw.random(rangeBegin, rangeEnd, options)` - Full featured random with array generation
   - `bw.prandom()` - Pseudo-random number generator
   - Can generate integers, floats, and multi-dimensional arrays

2. **File I/O** - ALREADY EXISTS
   - `bw.getFile(fname, callback, options)` - Load files (browser/Node)
   - `bw.getJSONFile(fname, callback)` - Load JSON files
   - `bw.saveClientFile(fname, data)` - Save files (browser/Node)

3. **Lorem Ipsum** - ALREADY EXISTS
   - `bw.loremIpsum(numChars, startSpot, startWithCapitalLetter)`

4. **Table Generation** - ALREADY EXISTS
   - `bw.htmlTable(data, opts)` - Basic table generation
   - `bw.htmlTabs(tabData, opts)` - Tab interface
   - `bw.htmlAccordian(data, opts)` - Accordion interface

5. **Timing Functions** - ALREADY EXISTS
   - `bw.setIntervalX()` - Run interval N times
   - `bw.repeatUntil()` - Retry until condition met

6. **Other Utilities** - ALREADY EXISTS
   - `bw.makeCSS()` - CSS generation from JS objects
   - `bw.makeCSSRule()` - Generate CSS rules
   - `bw.naturalCompare()` - Natural sort comparison

### What's Truly Missing ❌

1. **CSS Generation System**
   - No `bw.generateUtilityCSS()` implementation for Bootstrap-like classes
   - No theme-based utility CSS generation
   - Missing responsive grid CSS generation
   - No integration between theme object and CSS generation

2. **Enhanced Component Functions**
   - `bw.makeTable()` needs: search, pagination, export features
   - `bw.makeForm()` - Form generation with validation
   - `bw.makeModal()` - Modal dialogs
   - `bw.makeDropdown()` - Dropdown menus
   - `bw.makeTooltip()` - Tooltips
   - `bw.makeSpinner()` - Loading spinners

3. **Theme System**
   - No `bw.theme` object
   - No theme switching functionality
   - No dark mode support
   - No CSS variable generation from theme

4. **Integration Issues**
   - v1 functions not exposed in v2 module
   - Need to port/wrap v1 functions for v2 API consistency
   - Examples expect different signatures than v1 provides

## Why Examples Are Failing

1. **Missing CSS Classes**
   - Examples expect `.bw-*` utility classes that aren't generated
   - No responsive grid classes (`.bw-col-md-6`, etc.)
   - Missing spacing utilities (`.mb-3`, `.p-2`, etc.)

2. **Undefined Functions**
   - Examples use `bw.makeTable()` which exists but lacks features
   - Missing component factory functions
   - No theme object implementation

3. **Style Issues**
   - Components render but have no default spacing
   - No base normalization CSS
   - Bootstrap-like classes referenced but not implemented

## Implementation Roadmap

### Phase 0: Integrate v1 Functions (Priority: IMMEDIATE)

```javascript
// In bitwrench_v2.js, import and expose v1 functions

// Import from v1
import { 
  random, prandom, loremIpsum, multiArray,
  htmlTable, htmlTabs, htmlAccordian, htmlSign,
  getFile, getJSONFile, saveClientFile,
  setIntervalX, repeatUntil,
  makeCSS, makeCSSRule,
  naturalCompare
} from '../src_1x/bitwrench_1x.js';

// Add to bw namespace with consistent naming
Object.assign(bw, {
  // Random functions (keep v1 signatures)
  random,
  prandom,
  
  // File I/O (rename for consistency)
  fileLoad: getFile,
  fileLoadJSON: getJSONFile,
  fileSave: saveClientFile,
  
  // Keep other v1 functions
  loremIpsum,
  multiArray,
  setIntervalX,
  repeatUntil,
  naturalCompare,
  
  // CSS generation from v1
  makeCSS,
  makeCSSRule
});

// Enhance makeTable to use v1 htmlTable as base
bw.makeTable = function(config) {
  // If old v1 style call
  if (Array.isArray(config)) {
    return htmlTable.apply(this, arguments);
  }
  
  // New v2 enhanced version
  const { data, columns, ...opts } = config;
  // ... enhanced implementation
};
```

### Phase 1: CSS Foundation & Theme System (Priority: CRITICAL)

```javascript
// 1. Implement bw.theme object
bw.theme = {
  colors: {
    primary: "#007bff",
    secondary: "#6c757d",
    success: "#28a745",
    danger: "#dc3545",
    warning: "#ffc107",
    info: "#17a2b8",
    light: "#f8f9fa",
    dark: "#343a40"
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "3rem"
  },
  breakpoints: {
    sm: "576px",
    md: "768px",
    lg: "992px",
    xl: "1200px"
  },
  components: {
    borderRadius: "0.375rem",
    boxShadow: "0 0.125rem 0.25rem rgba(0,0,0,0.075)"
  }
};

// 2. Implement CSS generation
bw.generateUtilityCSS = function(options = {}) {
  const css = [];
  const theme = bw.theme;
  
  // Spacing utilities
  ['margin', 'padding'].forEach(prop => {
    const prefix = prop[0];
    ['', 't', 'r', 'b', 'l', 'x', 'y'].forEach(side => {
      Object.entries(theme.spacing).forEach(([key, val]) => {
        const className = `.${prefix}${side}-${key}`;
        // Generate CSS rules
      });
    });
  });
  
  // Color utilities
  Object.entries(theme.colors).forEach(([name, color]) => {
    css.push(`.text-${name} { color: ${color}; }`);
    css.push(`.bg-${name} { background-color: ${color}; }`);
    css.push(`.border-${name} { border-color: ${color}; }`);
  });
  
  return css.join('\n');
};

// 3. Base normalization
bw.cssBaseNorm = function() {
  return `
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    h1, h2, h3, h4, h5, h6 { margin-top: 0; margin-bottom: 0.5rem; }
    p { margin-top: 0; margin-bottom: 1rem; }
    /* ... more base styles ... */
  `;
};
```

### Phase 2: Theme Switching System (Priority: HIGH)

```javascript
// Theme management
bw.themes = {
  light: {
    name: 'Light',
    colors: {
      primary: '#007bff',
      secondary: '#6c757d',
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#212529',
      textMuted: '#6c757d',
      border: '#dee2e6'
    }
  },
  dark: {
    name: 'Dark',
    colors: {
      primary: '#0d6efd',
      secondary: '#6c757d',
      background: '#212529',
      surface: '#343a40',
      text: '#ffffff',
      textMuted: '#adb5bd',
      border: '#495057'
    }
  },
  highContrast: {
    name: 'High Contrast',
    colors: {
      primary: '#0000ff',
      secondary: '#666666',
      background: '#000000',
      surface: '#000000',
      text: '#ffffff',
      textMuted: '#ffff00',
      border: '#ffffff'
    }
  }
};

// Current theme
bw.currentTheme = 'light';

// Theme switching
bw.setTheme = function(themeName) {
  if (!bw.themes[themeName]) {
    console.warn(`Theme '${themeName}' not found`);
    return;
  }
  
  const oldTheme = bw.currentTheme;
  bw.currentTheme = themeName;
  bw.theme = { ...bw.theme, ...bw.themes[themeName] };
  
  // Regenerate CSS
  if (bw._isBrowser) {
    const css = bw.generateThemeCSS();
    bw.injectCSS(css, { id: 'bw-theme-styles', append: false });
    
    // Emit theme change event
    if (window.CustomEvent) {
      window.dispatchEvent(new CustomEvent('bw-theme-change', {
        detail: { oldTheme, newTheme: themeName }
      }));
    }
  }
  
  return bw.theme;
};

// Generate theme-specific CSS
bw.generateThemeCSS = function() {
  const theme = bw.theme;
  const css = [];
  
  // CSS custom properties for easy theming
  css.push(':root {');
  Object.entries(theme.colors).forEach(([name, value]) => {
    css.push(`  --bw-color-${name}: ${value};`);
  });
  css.push('}');
  
  // Theme-aware classes
  css.push(`
    body {
      background-color: var(--bw-color-background);
      color: var(--bw-color-text);
    }
    
    .bw-theme-surface {
      background-color: var(--bw-color-surface);
      color: var(--bw-color-text);
    }
    
    .bw-theme-primary {
      background-color: var(--bw-color-primary);
      color: white;
    }
    
    .bw-theme-border {
      border-color: var(--bw-color-border);
    }
    
    /* Component theming */
    .card {
      background-color: var(--bw-color-surface);
      border-color: var(--bw-color-border);
    }
    
    .btn-primary {
      background-color: var(--bw-color-primary);
      border-color: var(--bw-color-primary);
    }
    
    .table {
      color: var(--bw-color-text);
    }
    
    .table-striped tbody tr:nth-of-type(odd) {
      background-color: rgba(0,0,0,0.05);
    }
    
    /* Dark mode specific */
    ${bw.currentTheme === 'dark' ? `
      .table-striped tbody tr:nth-of-type(odd) {
        background-color: rgba(255,255,255,0.05);
      }
      
      .btn-light {
        background-color: var(--bw-color-surface);
        color: var(--bw-color-text);
      }
    ` : ''}
  `);
  
  return css.join('\n');
};

// Auto-detect preferred theme
bw.detectPreferredTheme = function() {
  if (bw._isBrowser && window.matchMedia) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
  return 'light';
};

// Theme toggle component
bw.makeThemeToggle = function(options = {}) {
  const {
    themes = Object.keys(bw.themes),
    className = 'bw-theme-toggle',
    onChange
  } = options;
  
  return {
    t: 'select',
    a: {
      class: className,
      onchange: function(e) {
        const theme = e.target.value;
        bw.setTheme(theme);
        if (onChange) onChange(theme);
      }
    },
    c: themes.map(theme => ({
      t: 'option',
      a: {
        value: theme,
        selected: theme === bw.currentTheme
      },
      c: bw.themes[theme].name
    }))
  };
};
```

### Phase 3: Component Implementations (Priority: HIGH)

```javascript
// Enhanced makeTable with all features
bw.makeTable = function(config) {
  const {
    data = [],
    columns,
    searchable = false,
    paginate = false,
    pageSize = 10,
    exportable = false,
    className = "table",
    ...opts
  } = config;
  
  // State management
  let currentPage = 0;
  let searchTerm = '';
  let sortColumn = opts.sortColumn;
  let sortDirection = opts.sortDirection || 'asc';
  
  // Filter data based on search
  let filteredData = data;
  if (searchable && searchTerm) {
    filteredData = data.filter(row => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }
  
  // Pagination
  let paginatedData = filteredData;
  if (paginate) {
    const start = currentPage * pageSize;
    paginatedData = filteredData.slice(start, start + pageSize);
  }
  
  // Build complete table with controls
  return {
    t: 'div',
    a: { class: 'bw-table-container' },
    c: [
      // Search box
      searchable && bw.makeSearchBox({ onSearch: (term) => { searchTerm = term; } }),
      
      // Table
      {
        t: 'div',
        a: { class: 'table-responsive' },
        c: buildTableElement(paginatedData, columns, sortColumn, sortDirection)
      },
      
      // Pagination controls
      paginate && bw.makePagination({
        currentPage,
        totalPages: Math.ceil(filteredData.length / pageSize),
        onPageChange: (page) => { currentPage = page; }
      }),
      
      // Export buttons
      exportable && bw.makeExportButtons({ data: filteredData, columns })
    ].filter(Boolean)
  };
};

// Modal implementation
bw.makeModal = function(config) {
  const {
    title,
    content,
    footer,
    size = 'md',
    closable = true,
    onClose,
    show = false
  } = config;
  
  const modalId = bw.uuid();
  
  return {
    t: 'div',
    a: { 
      class: `bw-modal ${show ? 'show' : ''}`,
      id: modalId,
      tabindex: -1
    },
    c: {
      t: 'div',
      a: { class: `bw-modal-dialog bw-modal-${size}` },
      c: {
        t: 'div',
        a: { class: 'bw-modal-content' },
        c: [
          // Header
          {
            t: 'div',
            a: { class: 'bw-modal-header' },
            c: [
              { t: 'h5', a: { class: 'bw-modal-title' }, c: title },
              closable && {
                t: 'button',
                a: { 
                  type: 'button',
                  class: 'bw-close',
                  onclick: onClose || (() => bw.hideModal(modalId))
                },
                c: '×'
              }
            ].filter(Boolean)
          },
          
          // Body
          {
            t: 'div',
            a: { class: 'bw-modal-body' },
            c: content
          },
          
          // Footer
          footer && {
            t: 'div',
            a: { class: 'bw-modal-footer' },
            c: footer
          }
        ].filter(Boolean)
      }
    }
  };
};
```

### Phase 3: Random Data Generation (Priority: MEDIUM)

```javascript
// Random data suite
bw.random = function(min = 0, max = 1) {
  if (arguments.length === 0) return Math.random();
  if (arguments.length === 1) return Math.random() * min;
  return Math.random() * (max - min) + min;
};

bw.random.int = function(min, max) {
  return Math.floor(bw.random(min, max + 1));
};

bw.random.choice = function(array) {
  return array[bw.random.int(0, array.length - 1)];
};

bw.random.shuffle = function(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = bw.random.int(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

bw.random.uuid = function() {
  return bw.uuid(); // Use existing UUID generator
};

bw.random.color = function(format = 'hex') {
  const r = bw.random.int(0, 255);
  const g = bw.random.int(0, 255);
  const b = bw.random.int(0, 255);
  
  switch(format) {
    case 'hex': return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    case 'rgb': return `rgb(${r}, ${g}, ${b})`;
    case 'array': return [r, g, b, 255, 'rgb'];
    default: return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  }
};

bw.random.date = function(start = new Date(2020, 0, 1), end = new Date()) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

bw.random.name = function() {
  const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Emma', 'Oliver', 'Sophia'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller'];
  return `${bw.random.choice(firstNames)} ${bw.random.choice(lastNames)}`;
};

bw.random.email = function(name) {
  name = name || bw.random.name();
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'example.com'];
  const username = name.toLowerCase().replace(' ', '.');
  return `${username}@${bw.random.choice(domains)}`;
};

bw.random.lorem = function(words = null) {
  if (!words) words = bw.random.int(5, 25);
  return bw.loremIpsum(words * 5); // Approximate chars from words
};
```

### Phase 4: File I/O Implementation (Priority: MEDIUM)

```javascript
// File save functionality
bw.fileSave = function(filename, content, options = {}) {
  const { type = 'text/plain' } = options;
  
  if (bw._isNode) {
    // Node.js implementation
    const fs = require('fs');
    fs.writeFileSync(filename, content);
  } else {
    // Browser implementation
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};

// File load functionality
bw.fileLoad = function(callback, options = {}) {
  const { accept = '*', multiple = false } = options;
  
  if (bw._isBrowser) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      
      if (multiple) {
        Promise.all(files.map(file => readFile(file)))
          .then(results => callback(results));
      } else {
        readFile(files[0]).then(result => callback(result));
      }
    };
    
    input.click();
  }
  
  function readFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({
        name: file.name,
        content: e.target.result,
        size: file.size,
        type: file.type
      });
      reader.readAsText(file);
    });
  }
};
```

### Phase 5: Build System Updates (Priority: HIGH)

1. **Update rollup.config.js**
   - Bundle bitwrench-components separately
   - Create combined distribution with all components
   - Generate source maps for debugging

2. **Create build targets**
   ```bash
   npm run build:core      # Core only
   npm run build:components # Components only  
   npm run build:full      # Everything bundled
   npm run build:css       # Generate all CSS
   ```

3. **Test coverage**
   - Add tests for all new components
   - Test CSS generation
   - Test file I/O in both environments

## Quick Fixes for Examples

To get examples_v2 working immediately:

1. **Add missing CSS classes**
   ```javascript
   // In examples_v2 files, add this after loading bitwrench:
   bw.injectCSS(`
     .mb-3 { margin-bottom: 1rem; }
     .mb-4 { margin-bottom: 1.5rem; }
     .mb-5 { margin-bottom: 3rem; }
     .me-2 { margin-right: 0.5rem; }
     .p-3 { padding: 1rem; }
     .gap-2 { gap: 0.5rem; }
     .d-flex { display: flex; }
     .flex-wrap { flex-wrap: wrap; }
     .text-center { text-align: center; }
     /* Add more as needed */
   `);
   ```

2. **Fix component references**
   - Ensure all components are properly imported
   - Check that `ExamplePage` function is available
   - Verify paths to CSS and JS files

3. **Add bootstrap CSS temporarily**
   ```html
   <!-- Add to examples while building native CSS -->
   <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
   ```

## Testing Strategy

See [bitwrench_v2_testing.md](./bitwrench_v2_testing.md) for the comprehensive testing strategy, including:
- Unit and integration test approaches
- Cross-environment testing (browsers and Node.js)
- Visual regression testing
- Performance benchmarks
- Legacy compatibility verification

## Migration Guide

For users upgrading from v1:

```javascript
// v1 style
bw.html(['div', {class: 'card'}, 'Content']);

// v2 style (both work)
bw.html({ t: 'div', a: {class: 'card'}, c: 'Content' });

// v2 component style
bw.makeCard({ title: 'Card', content: 'Content' });
```

## Conclusion

The main gap is between the ambitious design and the current implementation. However, many required functions already exist in v1 and should be leveraged rather than recreated. Priority should be:

1. **Integrate v1 functions into v2** (immediate - many "missing" features already exist)
2. **Implement CSS generation system** (critical for examples to work)
3. **Add theme switching** (requested feature for seamless theme changes)
4. **Enhance components** with v2-specific features (search, pagination, etc.)
5. **Update build system** to properly bundle v1 functions with v2

Key insights:
- `bw.random()` already exists in v1 with full array generation support
- File I/O (`getFile`, `saveClientFile`) already implemented for browser/Node
- Table, tabs, accordion components exist in v1
- CSS generation (`makeCSS`) already available in v1
- Many utility functions (loremIpsum, naturalCompare, etc.) ready to use

The fastest path to working examples:
1. Import v1 functions into v2 module
2. Add the utility CSS generation layer
3. Implement theme switching on top
4. Enhance existing components rather than recreating

With this approach, bitwrench v2 can quickly achieve its design goals while maintaining backward compatibility and leveraging years of battle-tested v1 code.