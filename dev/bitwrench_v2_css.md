# Bitwrench v2 CSS System

## Overview

The Bitwrench CSS system provides a comprehensive styling framework that:
- Maintains IE8+/CSS2.1 compatibility for core functionality
- Uses fully class-based selectors (no element targeting)
- Generates CSS from JavaScript at runtime
- Supports both static CSS files and dynamic generation
- Enables powerful theming capabilities
- Works seamlessly with BCCL components

## Design Principles

1. **Class-Based Only**: All styles use `.bw-` prefixed classes, no element selectors
2. **Progressive Enhancement**: CSS2.1 base with CSS3 enhancements where supported
3. **JavaScript-First**: CSS can be generated from JS objects for dynamic theming
4. **Modular**: Each component has isolated styles
5. **Responsive**: Mobile-first with container queries where supported
6. **No Collisions**: `bw-` prefix prevents conflicts with other libraries

## CSS Architecture

### 1. Base Reset and Normalize

```css
/* Bitwrench Reset - IE8+ compatible */
.bw-reset {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 100%;
  font: inherit;
  vertical-align: baseline;
}

/* Box sizing for all bw- elements */
.bw-*, 
.bw-*:before, 
.bw-*:after {
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
}

/* Base typography */
.bw-body {
  font-family: Arial, sans-serif; /* IE8 safe */
  font-size: 16px;
  line-height: 1.5;
  color: #333;
  background-color: #fff;
}
```

### 2. Layout System

#### Container
```css
.bw-container {
  width: 100%;
  max-width: 1200px;
  margin-right: auto;
  margin-left: auto;
  padding-right: 15px;
  padding-left: 15px;
}

.bw-container-fluid {
  width: 100%;
  padding-right: 15px;
  padding-left: 15px;
}

/* Responsive containers - IE9+ */
@media (min-width: 576px) {
  .bw-container { max-width: 540px; }
}
@media (min-width: 768px) {
  .bw-container { max-width: 720px; }
}
@media (min-width: 992px) {
  .bw-container { max-width: 960px; }
}
@media (min-width: 1200px) {
  .bw-container { max-width: 1140px; }
}
```

#### Grid System (IE8 compatible)
```css
/* Row */
.bw-row {
  margin-right: -15px;
  margin-left: -15px;
  *zoom: 1; /* IE7 hasLayout */
}

.bw-row:before,
.bw-row:after {
  display: table;
  content: " ";
}

.bw-row:after {
  clear: both;
}

/* Columns - Float-based for IE8 */
.bw-col,
.bw-col-1, .bw-col-2, .bw-col-3, .bw-col-4,
.bw-col-5, .bw-col-6, .bw-col-7, .bw-col-8,
.bw-col-9, .bw-col-10, .bw-col-11, .bw-col-12 {
  position: relative;
  float: left;
  min-height: 1px;
  /* Responsive gutters */
  padding-right: 5px;
  padding-left: 5px;
}

/* Larger gutters on tablets and up */
@media (min-width: 768px) {
  .bw-col,
  .bw-col-1, .bw-col-2, .bw-col-3, .bw-col-4,
  .bw-col-5, .bw-col-6, .bw-col-7, .bw-col-8,
  .bw-col-9, .bw-col-10, .bw-col-11, .bw-col-12 {
    padding-right: 10px;
    padding-left: 10px;
  }
}

/* CSS custom properties for modern browsers */
@supports (--css: variables) {
  :root {
    --bw-gutter: 10px;
    --bw-gutter-sm: 5px;
    --bw-gutter-lg: 15px;
  }
  
  .bw-col,
  .bw-col-1, .bw-col-2, .bw-col-3, .bw-col-4,
  .bw-col-5, .bw-col-6, .bw-col-7, .bw-col-8,
  .bw-col-9, .bw-col-10, .bw-col-11, .bw-col-12 {
    padding-right: var(--bw-gutter, 10px);
    padding-left: var(--bw-gutter, 10px);
  }
}

.bw-col { width: 100%; }
.bw-col-1 { width: 8.333333%; }
.bw-col-2 { width: 16.666667%; }
.bw-col-3 { width: 25%; }
.bw-col-4 { width: 33.333333%; }
.bw-col-5 { width: 41.666667%; }
.bw-col-6 { width: 50%; }
.bw-col-7 { width: 58.333333%; }
.bw-col-8 { width: 66.666667%; }
.bw-col-9 { width: 75%; }
.bw-col-10 { width: 83.333333%; }
.bw-col-11 { width: 91.666667%; }
.bw-col-12 { width: 100%; }

/* Modern Grid Enhancement - CSS Grid for modern browsers */
@supports (display: grid) {
  .bw-row {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 30px;
    margin: 0;
  }
  
  .bw-col,
  .bw-col-1, .bw-col-2, .bw-col-3, .bw-col-4,
  .bw-col-5, .bw-col-6, .bw-col-7, .bw-col-8,
  .bw-col-9, .bw-col-10, .bw-col-11, .bw-col-12 {
    float: none;
    width: auto;
    padding: 0;
  }
  
  .bw-col { grid-column: span 12; }
  .bw-col-1 { grid-column: span 1; }
  .bw-col-2 { grid-column: span 2; }
  .bw-col-3 { grid-column: span 3; }
  .bw-col-4 { grid-column: span 4; }
  .bw-col-5 { grid-column: span 5; }
  .bw-col-6 { grid-column: span 6; }
  .bw-col-7 { grid-column: span 7; }
  .bw-col-8 { grid-column: span 8; }
  .bw-col-9 { grid-column: span 9; }
  .bw-col-10 { grid-column: span 10; }
  .bw-col-11 { grid-column: span 11; }
  .bw-col-12 { grid-column: span 12; }
}
```

#### Flexbox Utilities (Progressive Enhancement)
```css
/* Stack - Vertical by default */
.bw-stack {
  display: block;
}

.bw-stack > * {
  display: block;
  margin-bottom: 1rem;
}

.bw-stack > *:last-child {
  margin-bottom: 0;
}

/* Modern flexbox enhancement */
@supports (display: flex) {
  .bw-stack {
    display: flex;
    flex-direction: column;
  }
  
  .bw-stack.horizontal {
    flex-direction: row;
  }
  
  .bw-stack > * {
    margin-bottom: 0;
  }
  
  .bw-gap-1 { gap: 0.25rem; }
  .bw-gap-2 { gap: 0.5rem; }
  .bw-gap-3 { gap: 1rem; }
  .bw-gap-4 { gap: 1.5rem; }
  .bw-gap-5 { gap: 3rem; }
}
```

### 3. Component Styles

#### Buttons
```css
/* Base button - IE8 compatible */
.bw-btn {
  display: inline-block;
  *display: inline; /* IE7 */
  *zoom: 1; /* IE7 hasLayout */
  padding: 6px 12px;
  margin-bottom: 0;
  font-size: 14px;
  font-weight: normal;
  line-height: 1.42857143;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  background-image: none;
  border: 1px solid transparent;
  text-decoration: none;
  
  /* IE8 doesn't support border-radius */
  border-radius: 4px;
}

/* Button variants */
.bw-btn-primary {
  color: #fff;
  background-color: #007bff;
  border-color: #007bff;
}

.bw-btn-primary:hover {
  color: #fff;
  background-color: #0069d9;
  border-color: #0062cc;
}

.bw-btn-secondary {
  color: #fff;
  background-color: #6c757d;
  border-color: #6c757d;
}

/* Button sizes */
.bw-btn-sm {
  padding: 5px 10px;
  font-size: 12px;
  line-height: 1.5;
}

.bw-btn-lg {
  padding: 10px 16px;
  font-size: 18px;
  line-height: 1.3333333;
}

.bw-btn-block {
  display: block;
  width: 100%;
}

/* Disabled state */
.bw-btn[disabled],
.bw-btn.bw-disabled {
  cursor: not-allowed;
  opacity: .65;
  filter: alpha(opacity=65); /* IE8 */
}
```

#### Cards
```css
.bw-card {
  position: relative;
  display: block;
  margin-bottom: 1rem;
  background-color: #fff;
  border: 1px solid rgba(0,0,0,.125);
  border-radius: 4px;
  
  /* IE8 fallback */
  border: 1px solid #ddd\9;
}

.bw-card-header {
  padding: 12px 20px;
  margin-bottom: 0;
  background-color: rgba(0,0,0,.03);
  border-bottom: 1px solid rgba(0,0,0,.125);
  
  /* IE8 fallback */
  background-color: #f5f5f5\9;
  border-bottom: 1px solid #ddd\9;
}

.bw-card-body {
  padding: 20px;
}

.bw-card-footer {
  padding: 12px 20px;
  background-color: rgba(0,0,0,.03);
  border-top: 1px solid rgba(0,0,0,.125);
  
  /* IE8 fallback */
  background-color: #f5f5f5\9;
  border-top: 1px solid #ddd\9;
}

.bw-card-image {
  width: 100%;
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
}
```

#### Forms
```css
.bw-form-group {
  margin-bottom: 1rem;
}

.bw-form-label {
  display: inline-block;
  margin-bottom: .5rem;
  font-weight: bold;
}

.bw-form-control {
  display: block;
  width: 100%;
  padding: 6px 12px;
  font-size: 14px;
  line-height: 1.42857143;
  color: #555;
  background-color: #fff;
  background-image: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  
  /* IE8-9 doesn't support placeholder */
  *color: #555; /* IE7 */
}

.bw-form-control:focus {
  border-color: #66afe9;
  outline: 0;
  
  /* IE8 doesn't support box-shadow */
  -webkit-box-shadow: inset 0 1px 1px rgba(0,0,0,.075), 0 0 8px rgba(102,175,233,.6);
  box-shadow: inset 0 1px 1px rgba(0,0,0,.075), 0 0 8px rgba(102,175,233,.6);
}

/* Select styling - limited in IE8 */
.bw-form-control[type="select"],
select.bw-form-control {
  height: 34px;
  padding: 6px 12px;
}

/* Validation states */
.bw-is-invalid {
  border-color: #dc3545;
}

.bw-invalid-feedback {
  display: block;
  margin-top: .25rem;
  font-size: 80%;
  color: #dc3545;
}
```

#### Tables
```css
.bw-table {
  width: 100%;
  max-width: 100%;
  margin-bottom: 1rem;
  background-color: transparent;
  border-collapse: collapse;
}

.bw-table th,
.bw-table td {
  padding: 12px;
  vertical-align: top;
  border-top: 1px solid #dee2e6;
}

.bw-table thead th {
  vertical-align: bottom;
  border-bottom: 2px solid #dee2e6;
  font-weight: bold;
}

.bw-table tbody + tbody {
  border-top: 2px solid #dee2e6;
}

/* Striped rows */
.bw-table-striped tbody tr:nth-child(odd) {
  background-color: rgba(0,0,0,.05);
}

/* IE8 fallback for striping */
.bw-table-striped tbody tr {
  background-color: #fff;
}

.bw-table-striped tbody tr.bw-odd {
  background-color: #f9f9f9;
}

/* Hover effect */
.bw-table-hover tbody tr:hover {
  background-color: rgba(0,0,0,.075);
  /* IE8 fallback */
  background-color: #f5f5f5\9;
}

/* Sortable columns */
.bw-sortable {
  cursor: pointer;
  position: relative;
  padding-right: 20px;
}

.bw-sort-indicator {
  position: absolute;
  right: 5px;
  top: 50%;
  margin-top: -3px;
}
```

### 4. Utility Classes

#### Spacing
```css
/* Margin */
.bw-m-0 { margin: 0 !important; }
.bw-m-1 { margin: 0.25rem !important; }
.bw-m-2 { margin: 0.5rem !important; }
.bw-m-3 { margin: 1rem !important; }
.bw-m-4 { margin: 1.5rem !important; }
.bw-m-5 { margin: 3rem !important; }

/* Directional margins */
.bw-mt-0 { margin-top: 0 !important; }
.bw-mt-1 { margin-top: 0.25rem !important; }
.bw-mt-2 { margin-top: 0.5rem !important; }
.bw-mt-3 { margin-top: 1rem !important; }
.bw-mt-4 { margin-top: 1.5rem !important; }
.bw-mt-5 { margin-top: 3rem !important; }

/* Same pattern for mb-, ml-, mr-, mx-, my- */

/* Padding - same pattern as margin */
.bw-p-0 { padding: 0 !important; }
.bw-p-1 { padding: 0.25rem !important; }
.bw-p-2 { padding: 0.5rem !important; }
.bw-p-3 { padding: 1rem !important; }
.bw-p-4 { padding: 1.5rem !important; }
.bw-p-5 { padding: 3rem !important; }
```

#### Display
```css
.bw-d-none { display: none !important; }
.bw-d-inline { display: inline !important; }
.bw-d-inline-block { 
  display: inline-block !important;
  *display: inline !important; /* IE7 */
  *zoom: 1; /* IE7 */
}
.bw-d-block { display: block !important; }
.bw-d-table { display: table !important; }
.bw-d-table-row { display: table-row !important; }
.bw-d-table-cell { display: table-cell !important; }

/* Flexbox utilities - progressive enhancement */
@supports (display: flex) {
  .bw-d-flex { display: flex !important; }
  .bw-d-inline-flex { display: inline-flex !important; }
  
  .bw-flex-row { flex-direction: row !important; }
  .bw-flex-column { flex-direction: column !important; }
  
  .bw-justify-content-start { justify-content: flex-start !important; }
  .bw-justify-content-end { justify-content: flex-end !important; }
  .bw-justify-content-center { justify-content: center !important; }
  .bw-justify-content-between { justify-content: space-between !important; }
  
  .bw-align-items-start { align-items: flex-start !important; }
  .bw-align-items-end { align-items: flex-end !important; }
  .bw-align-items-center { align-items: center !important; }
}
```

#### Text
```css
.bw-text-left { text-align: left !important; }
.bw-text-right { text-align: right !important; }
.bw-text-center { text-align: center !important; }

.bw-text-lowercase { text-transform: lowercase !important; }
.bw-text-uppercase { text-transform: uppercase !important; }
.bw-text-capitalize { text-transform: capitalize !important; }

.bw-font-weight-light { font-weight: 300 !important; }
.bw-font-weight-normal { font-weight: 400 !important; }
.bw-font-weight-bold { font-weight: 700 !important; }

.bw-text-primary { color: #007bff !important; }
.bw-text-secondary { color: #6c757d !important; }
.bw-text-success { color: #28a745 !important; }
.bw-text-danger { color: #dc3545 !important; }
.bw-text-warning { color: #ffc107 !important; }
.bw-text-info { color: #17a2b8 !important; }
.bw-text-muted { color: #6c757d !important; }
```

#### Backgrounds
```css
.bw-bg-primary { background-color: #007bff !important; }
.bw-bg-secondary { background-color: #6c757d !important; }
.bw-bg-success { background-color: #28a745 !important; }
.bw-bg-danger { background-color: #dc3545 !important; }
.bw-bg-warning { background-color: #ffc107 !important; }
.bw-bg-info { background-color: #17a2b8 !important; }
.bw-bg-light { background-color: #f8f9fa !important; }
.bw-bg-dark { background-color: #343a40 !important; }
.bw-bg-white { background-color: #fff !important; }
```

### 5. SRMC (Selector-Rules-Media-Children) CSS Generation

The SRMC pattern provides a TACO-like structure for CSS generation:

```javascript
// SRMC Format - CSS as data structures
{
  s: '.bw-card',              // selector
  r: {                        // rules
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 4
  },
  m: '@media (min-width: 768px)', // media query (optional)
  c: [                        // children/nested rules (optional)
    {
      s: '&:hover',           // & = parent selector
      r: {
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        transform: 'translateY(-2px)'
      }
    },
    {
      s: '.bw-card-title',    // child selector
      r: { 
        fontSize: 18,
        fontWeight: 'bold'
      }
    }
  ]
}

// SRMC processor
bw.css.processSRMC = function(srmc) {
  var css = '';
  
  // Main selector and rules
  if (srmc.s && srmc.r) {
    css += bw.css.makeCSSRule(srmc.s, srmc.r);
  }
  
  // Process children
  if (srmc.c && Array.isArray(srmc.c)) {
    srmc.c.forEach(function(child) {
      if (child.s && child.r) {
        // Handle & parent reference
        var selector = child.s.replace(/&/g, srmc.s);
        // Handle nested selectors
        if (selector.indexOf(srmc.s) === -1 && child.s.indexOf('&') === -1) {
          selector = srmc.s + ' ' + child.s;
        }
        css += bw.css.makeCSSRule(selector, child.r);
      }
    });
  }
  
  // Wrap in media query if specified
  if (srmc.m) {
    css = srmc.m + ' {\n' + css + '}\n';
  }
  
  return css;
};

// Process array of SRMC objects
bw.css.buildFromSRMC = function(srmcArray) {
  return srmcArray.map(function(srmc) {
    return bw.css.processSRMC(srmc);
  }).join('\n');
};

// Export/Import theme as SRMC data
bw.themes.defaultSRMC = [
  {
    s: '.bw-btn',
    r: { 
      padding: '6px 12px',
      fontSize: 14,
      borderRadius: 4,
      border: '1px solid transparent',
      cursor: 'pointer'
    },
    c: [
      { s: '&:hover', r: { opacity: 0.9 } },
      { s: '&:active', r: { transform: 'scale(0.98)' } }
    ]
  },
  {
    s: '.bw-btn-primary',
    r: { 
      color: '#fff',
      backgroundColor: '#007bff',
      borderColor: '#007bff'
    }
  }
];

// Users can modify SRMC data before applying
const myTheme = bw.themes.defaultSRMC.map(srmc => {
  if (srmc.s === '.bw-btn') {
    // Make buttons bigger
    srmc.r.padding = '8px 16px';
    srmc.r.fontSize = 16;
  }
  return srmc;
});
```

### 6. JavaScript CSS Generation (Legacy API)

```javascript
// CSS generation from JavaScript
bw.css = {
  // Convert style object to CSS string
  makeCSS: function(styles) {
    var css = '';
    for (var prop in styles) {
      if (styles.hasOwnProperty(prop)) {
        var value = styles[prop];
        // Convert camelCase to kebab-case
        var cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        
        // Handle numeric values (add px)
        if (typeof value === 'number' && !bw.css.unitless[prop]) {
          value = value + 'px';
        }
        
        // Handle arrays (spacing shortcuts)
        if (Array.isArray(value)) {
          value = value.map(function(v) {
            return typeof v === 'number' ? v + 'px' : v;
          }).join(' ');
        }
        
        css += cssProp + ': ' + value + '; ';
      }
    }
    return css.trim();
  },
  
  // Generate CSS rule
  makeCSSRule: function(selector, styles) {
    var css = selector + ' { ';
    css += bw.css.makeCSS(styles);
    css += ' }\n';
    
    // Handle nested selectors (pseudo-classes, media queries)
    for (var key in styles) {
      if (key.charAt(0) === ':' || key.charAt(0) === '@') {
        if (key.charAt(0) === ':') {
          // Pseudo-class
          css += selector + key + ' { ';
          css += bw.css.makeCSS(styles[key]);
          css += ' }\n';
        } else if (key.charAt(0) === '@') {
          // Media query
          css += key + ' { ';
          css += bw.css.makeCSSRule(selector, styles[key]);
          css += ' }\n';
        }
      }
    }
    
    return css;
  },
  
  // Generate utility classes from config
  generateUtilityCSS: function(config) {
    var css = '';
    
    // Spacing utilities
    if (config.spacing) {
      var sides = {
        '': [''],
        't': ['top'],
        'r': ['right'],
        'b': ['bottom'],
        'l': ['left'],
        'x': ['left', 'right'],
        'y': ['top', 'bottom']
      };
      
      ['margin', 'padding'].forEach(function(property) {
        var prefix = property.charAt(0);
        
        Object.keys(sides).forEach(function(side) {
          config.spacing.forEach(function(size, i) {
            var className = '.bw-' + prefix + (side || '') + '-' + i;
            var rules = {};
            
            sides[side].forEach(function(direction) {
              var prop = property + (direction ? '-' + direction : '');
              rules[prop] = size;
            });
            
            css += bw.css.makeCSSRule(className, rules);
          });
        });
      });
    }
    
    // Color utilities
    if (config.colors) {
      Object.keys(config.colors).forEach(function(name) {
        // Text color
        css += bw.css.makeCSSRule('.bw-text-' + name, {
          color: config.colors[name] + ' !important'
        });
        
        // Background color
        css += bw.css.makeCSSRule('.bw-bg-' + name, {
          backgroundColor: config.colors[name] + ' !important'
        });
        
        // Border color
        css += bw.css.makeCSSRule('.bw-border-' + name, {
          borderColor: config.colors[name] + ' !important'
        });
      });
    }
    
    return css;
  },
  
  // Properties that shouldn't get 'px' added
  unitless: {
    opacity: true,
    zIndex: true,
    fontWeight: true,
    lineHeight: true,
    flexGrow: true,
    flexShrink: true,
    order: true
  }
};

// Theme-based CSS generation
bw.generateThemeCSS = function(theme) {
  var css = '';
  
  // Generate CSS variables for modern browsers
  css += ':root {\n';
  
  // Colors
  if (theme.colors) {
    Object.keys(theme.colors).forEach(function(name) {
      css += '  --bw-color-' + name + ': ' + theme.colors[name] + ';\n';
    });
  }
  
  // Spacing
  if (theme.spacing) {
    Object.keys(theme.spacing).forEach(function(name) {
      css += '  --bw-spacing-' + name + ': ' + theme.spacing[name] + 'px;\n';
    });
  }
  
  css += '}\n\n';
  
  // Generate utility classes
  css += bw.css.generateUtilityCSS(theme);
  
  // Component overrides
  if (theme.components) {
    Object.keys(theme.components).forEach(function(component) {
      var styles = theme.components[component];
      css += bw.css.makeCSSRule('.bw-' + component, styles);
    });
  }
  
  return css;
};

// Inject CSS into page
bw.injectCSS = function(css, options) {
  options = options || {};
  
  // Check if already injected
  var id = options.id || 'bw-styles';
  var existing = document.getElementById(id);
  
  if (existing && !options.replace) {
    return existing;
  }
  
  if (existing) {
    existing.parentNode.removeChild(existing);
  }
  
  // Create style element
  var style = document.createElement('style');
  style.id = id;
  style.type = 'text/css';
  
  if (style.styleSheet) {
    // IE8
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
  
  // Insert into head
  var head = document.head || document.getElementsByTagName('head')[0];
  head.appendChild(style);
  
  return style;
};

// Load default Bitwrench styles
bw.loadDefaultStyles = function(options) {
  var theme = options && options.theme || bw.themes.default;
  var css = bw.generateThemeCSS(theme);
  return bw.injectCSS(css, { id: 'bw-default-styles' });
};
```

### 6. Theme System

```javascript
// Default theme
bw.themes = {
  default: {
    colors: {
      primary: '#007bff',
      secondary: '#6c757d',
      success: '#28a745',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
      light: '#f8f9fa',
      dark: '#343a40'
    },
    spacing: [0, 4, 8, 16, 24, 48],
    typography: {
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30
      },
      lineHeight: {
        tight: 1.25,
        base: 1.5,
        relaxed: 1.75
      }
    },
    borderRadius: {
      none: 0,
      sm: 2,
      base: 4,
      lg: 8,
      full: 9999
    },
    shadows: {
      none: 'none',
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    },
    components: {
      button: {
        padding: '6px 12px',
        fontSize: '14px',
        fontWeight: 'normal',
        lineHeight: 1.5,
        borderRadius: 4,
        transition: 'all 0.15s ease-in-out'
      },
      card: {
        padding: 20,
        marginBottom: 20,
        borderRadius: 4,
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
      }
    }
  },
  
  // Dark theme
  dark: {
    colors: {
      primary: '#0d6efd',
      secondary: '#6c757d',
      success: '#198754',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#0dcaf0',
      light: '#212529',
      dark: '#f8f9fa'
    }
    // Inherit other properties from default
  }
};

// Apply theme to component
bw.applyTheme = function(component, theme) {
  theme = theme || bw.themes.default;
  
  // Add theme-based classes
  if (component.a && component.a.class) {
    component.a.class += ' bw-theme-' + (theme.name || 'default');
  }
  
  // Apply theme styles
  if (theme.components && theme.components[component.o.type]) {
    var themeStyles = theme.components[component.o.type];
    component.a = component.a || {};
    component.a.style = bw.css.makeCSS(
      Object.assign({}, themeStyles, component.a.style || {})
    );
  }
  
  return component;
};
```

### 7. Usage Patterns

Bitwrench CSS supports multiple usage patterns to fit different workflows:

#### Pattern 1: Static CSS Only (like W3.CSS)
```html
<!-- Pure HTML + CSS approach -->
<link rel="stylesheet" href="https://cdn.bitwrench.com/v2/bitwrench.min.css">

<div class="bw-container">
  <div class="bw-row">
    <div class="bw-col-4">
      <div class="bw-card">
        <div class="bw-card-header">Static Card</div>
        <div class="bw-card-body">No JavaScript needed!</div>
      </div>
    </div>
  </div>
</div>
```

#### Pattern 2: JavaScript HTML Generation + Prebuilt CSS
```javascript
// Use TACO to generate HTML, rely on prebuilt CSS
bw.loadDefaultStyles(); // Load prebuilt CSS

const card = bw.html({
  t: 'div',
  a: { class: 'bw-card' },
  c: [
    { t: 'div', a: { class: 'bw-card-header' }, c: 'Dynamic Card' },
    { t: 'div', a: { class: 'bw-card-body' }, c: 'Generated with JS' }
  ]
});

document.getElementById('app').innerHTML = card;
```

#### Pattern 3: Full Dynamic CSS Generation
```javascript
// Generate both HTML and CSS from JavaScript
const theme = {
  colors: { primary: '#007bff', secondary: '#6c757d' },
  spacing: [0, 4, 8, 16, 24, 32]
};

// Generate CSS from theme
const css = bw.css.buildFromSRMC([
  {
    s: '.bw-card',
    r: {
      padding: theme.spacing[4],
      backgroundColor: '#fff',
      borderColor: theme.colors.secondary
    }
  }
]);

bw.injectCSS(css);
```

#### Pattern 4: Customize from Defaults
```javascript
// Start with Bitwrench defaults and customize
const customTheme = bw.utils.deepMerge(bw.themes.default, {
  colors: {
    primary: '#ff6b6b',    // Override primary
    brand: '#4ecdc4'       // Add new color
  },
  spacing: [0, 2, 4, 8, 16, 32, 64], // Custom spacing scale
  components: {
    card: {
      padding: 24,         // Larger padding
      borderRadius: 8      // Rounder corners
    }
  }
});

// Generate customized CSS
bw.loadDefaultStyles({ theme: customTheme });
```

#### Pattern 5: SRMC-Based Theme System
```javascript
// Define theme as SRMC objects
const mySRMCTheme = [
  // Base styles
  {
    s: '.bw-card',
    r: { padding: 20, backgroundColor: '#fff' },
    c: [
      { s: '.bw-card-title', r: { fontSize: 20, marginBottom: 10 } },
      { s: '.bw-card-body', r: { lineHeight: 1.6 } }
    ]
  },
  // Responsive overrides
  {
    s: '.bw-card',
    r: { padding: 12 },
    m: '@media (max-width: 576px)'
  },
  // Dark mode variant
  {
    s: '.bw-dark .bw-card',
    r: { backgroundColor: '#1a1a1a', color: '#fff' }
  }
];

// Apply theme
const css = bw.css.buildFromSRMC(mySRMCTheme);
bw.injectCSS(css, { id: 'my-theme' });
```

#### CDN Distribution Options
```html
<!-- Option 1: Complete bundle (HTML + CSS generation) -->
<script src="https://cdn.bitwrench.com/v2/bitwrench.min.js"></script>

<!-- Option 2: Prebuilt CSS only -->
<link rel="stylesheet" href="https://cdn.bitwrench.com/v2/bitwrench.min.css">

<!-- Option 3: Core CSS + Theme -->
<link rel="stylesheet" href="https://cdn.bitwrench.com/v2/bitwrench-core.min.css">
<link rel="stylesheet" href="https://cdn.bitwrench.com/v2/themes/dark.min.css">

<!-- Option 4: SRMC definitions as JSON -->
<script>
  fetch('https://cdn.bitwrench.com/v2/themes/default.srmc.json')
    .then(r => r.json())
    .then(srmc => {
      // Customize SRMC before applying
      srmc[0].r.padding = 30;
      const css = bw.css.buildFromSRMC(srmc);
      bw.injectCSS(css);
    });
</script>
```

#### Workflow Examples

**Designer Workflow**: Start with static HTML/CSS, progressively enhance
```html
<!-- Start with static -->
<div class="bw-card">...</div>

<!-- Enhance with JavaScript later -->
<script>
  const cards = document.querySelectorAll('.bw-card');
  cards.forEach(el => {
    const handle = bw.enhance(el, { type: 'card' });
    handle.on('click', () => handle.toggle());
  });
</script>
```

**Developer Workflow**: Full JavaScript control
```javascript
// Everything as data
const app = {
  theme: customTheme,
  layout: pageLayout,
  components: [card1, card2, table1]
};

// Generate everything
const css = bw.generateThemeCSS(app.theme);
const html = bw.html(app.layout);
bw.injectCSS(css);
bw.DOM('#app', html);
```

**Hybrid Workflow**: Mix approaches as needed
```javascript
// Use prebuilt styles for common components
bw.loadDefaultStyles();

// Add custom styles for specific needs
const customCSS = bw.css.buildFromSRMC([
  { s: '.my-special-card', r: { background: 'linear-gradient(...)' } }
]);
bw.injectCSS(customCSS, { id: 'my-custom-styles' });
```

### 8. Complete SRMC Theme Implementation

Here's a comprehensive SRMC theme that creates a complete CSS framework:

```javascript
// Bitwrench Default Theme in SRMC Format
bw.themes.completeSRMC = [
  // ========================================
  // Reset and Base Styles
  // ========================================
  {
    s: '.bw-reset, .bw-reset *',
    r: {
      margin: 0,
      padding: 0,
      border: 0,
      fontSize: '100%',
      font: 'inherit',
      verticalAlign: 'baseline',
      boxSizing: 'border-box'
    }
  },
  {
    s: 'body.bw-body',
    r: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: 16,
      lineHeight: 1.5,
      color: '#212529',
      backgroundColor: '#fff',
      '-webkit-font-smoothing': 'antialiased',
      '-moz-osx-font-smoothing': 'grayscale'
    }
  },

  // ========================================
  // Typography
  // ========================================
  {
    s: '.bw-h1, .bw-h2, .bw-h3, .bw-h4, .bw-h5, .bw-h6',
    r: {
      marginTop: 0,
      marginBottom: '0.5rem',
      fontWeight: 500,
      lineHeight: 1.2,
      color: 'inherit'
    }
  },
  { s: '.bw-h1', r: { fontSize: '2.5rem' } },
  { s: '.bw-h2', r: { fontSize: '2rem' } },
  { s: '.bw-h3', r: { fontSize: '1.75rem' } },
  { s: '.bw-h4', r: { fontSize: '1.5rem' } },
  { s: '.bw-h5', r: { fontSize: '1.25rem' } },
  { s: '.bw-h6', r: { fontSize: '1rem' } },
  
  // Mobile typography scaling
  {
    s: '.bw-h1',
    r: { fontSize: '2rem' },
    m: '@media (max-width: 576px)'
  },
  {
    s: '.bw-h2',
    r: { fontSize: '1.75rem' },
    m: '@media (max-width: 576px)'
  },

  // Paragraphs and text
  {
    s: '.bw-p',
    r: {
      marginTop: 0,
      marginBottom: '1rem'
    }
  },
  {
    s: '.bw-lead',
    r: {
      fontSize: '1.25rem',
      fontWeight: 300
    }
  },
  {
    s: '.bw-small',
    r: {
      fontSize: '0.875rem'
    }
  },

  // Links
  {
    s: '.bw-link',
    r: {
      color: '#007bff',
      textDecoration: 'none',
      backgroundColor: 'transparent'
    },
    c: [
      {
        s: '&:hover',
        r: {
          color: '#0056b3',
          textDecoration: 'underline'
        }
      }
    ]
  },

  // ========================================
  // Layout Components
  // ========================================
  
  // Container
  {
    s: '.bw-container',
    r: {
      width: '100%',
      paddingRight: 15,
      paddingLeft: 15,
      marginRight: 'auto',
      marginLeft: 'auto'
    }
  },
  {
    s: '.bw-container',
    r: { maxWidth: 540 },
    m: '@media (min-width: 576px)'
  },
  {
    s: '.bw-container',
    r: { maxWidth: 720 },
    m: '@media (min-width: 768px)'
  },
  {
    s: '.bw-container',
    r: { maxWidth: 960 },
    m: '@media (min-width: 992px)'
  },
  {
    s: '.bw-container',
    r: { maxWidth: 1140 },
    m: '@media (min-width: 1200px)'
  },
  {
    s: '.bw-container-fluid',
    r: {
      width: '100%',
      paddingRight: 15,
      paddingLeft: 15
    }
  },

  // Grid System
  {
    s: '.bw-row',
    r: {
      display: 'flex',
      flexWrap: 'wrap',
      marginRight: -15,
      marginLeft: -15
    }
  },
  // No-gutters variant
  {
    s: '.bw-row.bw-no-gutters',
    r: {
      marginRight: 0,
      marginLeft: 0
    },
    c: [
      {
        s: '> .bw-col, > [class*="bw-col-"]',
        r: {
          paddingRight: 0,
          paddingLeft: 0
        }
      }
    ]
  },

  // Base column styles
  {
    s: '.bw-col, [class*="bw-col-"]',
    r: {
      position: 'relative',
      width: '100%',
      paddingRight: 15,
      paddingLeft: 15
    }
  },

  // Auto-sizing columns
  {
    s: '.bw-col',
    r: {
      flexBasis: 0,
      flexGrow: 1,
      maxWidth: '100%'
    }
  },

  // Fixed-size columns
  ...Array.from({length: 12}, (_, i) => ({
    s: `.bw-col-${i + 1}`,
    r: {
      flex: `0 0 ${((i + 1) / 12 * 100).toFixed(6)}%`,
      maxWidth: `${((i + 1) / 12 * 100).toFixed(6)}%`
    }
  })),

  // ========================================
  // Components
  // ========================================

  // Cards
  {
    s: '.bw-card',
    r: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      wordWrap: 'break-word',
      backgroundColor: '#fff',
      backgroundClip: 'border-box',
      border: '1px solid rgba(0,0,0,.125)',
      borderRadius: '.25rem',
      marginBottom: '1rem'
    },
    c: [
      {
        s: '&:hover',
        r: {
          boxShadow: '0 .5rem 1rem rgba(0,0,0,.15)',
          transform: 'translateY(-2px)',
          transition: 'all .3s ease'
        }
      }
    ]
  },
  {
    s: '.bw-card-body',
    r: {
      flex: '1 1 auto',
      minHeight: '1px',
      padding: '1.25rem'
    }
  },
  {
    s: '.bw-card-header',
    r: {
      padding: '.75rem 1.25rem',
      marginBottom: 0,
      backgroundColor: 'rgba(0,0,0,.03)',
      borderBottom: '1px solid rgba(0,0,0,.125)'
    },
    c: [
      {
        s: '&:first-child',
        r: {
          borderRadius: 'calc(.25rem - 1px) calc(.25rem - 1px) 0 0'
        }
      }
    ]
  },
  {
    s: '.bw-card-footer',
    r: {
      padding: '.75rem 1.25rem',
      backgroundColor: 'rgba(0,0,0,.03)',
      borderTop: '1px solid rgba(0,0,0,.125)'
    },
    c: [
      {
        s: '&:last-child',
        r: {
          borderRadius: '0 0 calc(.25rem - 1px) calc(.25rem - 1px)'
        }
      }
    ]
  },
  {
    s: '.bw-card-img-top',
    r: {
      flexShrink: 0,
      width: '100%',
      borderTopLeftRadius: 'calc(.25rem - 1px)',
      borderTopRightRadius: 'calc(.25rem - 1px)'
    }
  },

  // Buttons
  {
    s: '.bw-btn',
    r: {
      display: 'inline-block',
      fontWeight: 400,
      color: '#212529',
      textAlign: 'center',
      verticalAlign: 'middle',
      cursor: 'pointer',
      userSelect: 'none',
      backgroundColor: 'transparent',
      border: '1px solid transparent',
      padding: '.375rem .75rem',
      fontSize: '1rem',
      lineHeight: 1.5,
      borderRadius: '.25rem',
      transition: 'color .15s ease-in-out, background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out'
    },
    c: [
      {
        s: '&:hover',
        r: {
          textDecoration: 'none'
        }
      },
      {
        s: '&:focus',
        r: {
          outline: 0,
          boxShadow: '0 0 0 .2rem rgba(0,123,255,.25)'
        }
      },
      {
        s: '&:disabled, &.bw-disabled',
        r: {
          opacity: .65,
          cursor: 'not-allowed'
        }
      }
    ]
  },

  // Button variants
  ...[
    { name: 'primary', bg: '#007bff', border: '#007bff', text: '#fff', hover: '#0069d9', hoverBorder: '#0062cc' },
    { name: 'secondary', bg: '#6c757d', border: '#6c757d', text: '#fff', hover: '#5a6268', hoverBorder: '#545b62' },
    { name: 'success', bg: '#28a745', border: '#28a745', text: '#fff', hover: '#218838', hoverBorder: '#1e7e34' },
    { name: 'danger', bg: '#dc3545', border: '#dc3545', text: '#fff', hover: '#c82333', hoverBorder: '#bd2130' },
    { name: 'warning', bg: '#ffc107', border: '#ffc107', text: '#212529', hover: '#e0a800', hoverBorder: '#d39e00' },
    { name: 'info', bg: '#17a2b8', border: '#17a2b8', text: '#fff', hover: '#138496', hoverBorder: '#117a8b' },
    { name: 'light', bg: '#f8f9fa', border: '#f8f9fa', text: '#212529', hover: '#e2e6ea', hoverBorder: '#dae0e5' },
    { name: 'dark', bg: '#343a40', border: '#343a40', text: '#fff', hover: '#23272b', hoverBorder: '#1d2124' }
  ].map(variant => ({
    s: `.bw-btn-${variant.name}`,
    r: {
      color: variant.text,
      backgroundColor: variant.bg,
      borderColor: variant.border
    },
    c: [
      {
        s: '&:hover',
        r: {
          color: variant.text,
          backgroundColor: variant.hover,
          borderColor: variant.hoverBorder
        }
      },
      {
        s: '&:focus, &.bw-focus',
        r: {
          color: variant.text,
          backgroundColor: variant.hover,
          borderColor: variant.hoverBorder,
          boxShadow: `0 0 0 .2rem rgba(${variant.bg}, .5)`
        }
      }
    ]
  })),

  // Button sizes
  {
    s: '.bw-btn-lg',
    r: {
      padding: '.5rem 1rem',
      fontSize: '1.25rem',
      lineHeight: 1.5,
      borderRadius: '.3rem'
    }
  },
  {
    s: '.bw-btn-sm',
    r: {
      padding: '.25rem .5rem',
      fontSize: '.875rem',
      lineHeight: 1.5,
      borderRadius: '.2rem'
    }
  },
  {
    s: '.bw-btn-block',
    r: {
      display: 'block',
      width: '100%'
    },
    c: [
      {
        s: '+ .bw-btn-block',
        r: {
          marginTop: '.5rem'
        }
      }
    ]
  },

  // Forms
  {
    s: '.bw-form-group',
    r: {
      marginBottom: '1rem'
    }
  },
  {
    s: '.bw-form-control',
    r: {
      display: 'block',
      width: '100%',
      height: 'calc(1.5em + .75rem + 2px)',
      padding: '.375rem .75rem',
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
      color: '#495057',
      backgroundColor: '#fff',
      backgroundClip: 'padding-box',
      border: '1px solid #ced4da',
      borderRadius: '.25rem',
      transition: 'border-color .15s ease-in-out, box-shadow .15s ease-in-out'
    },
    c: [
      {
        s: '&:focus',
        r: {
          color: '#495057',
          backgroundColor: '#fff',
          borderColor: '#80bdff',
          outline: 0,
          boxShadow: '0 0 0 .2rem rgba(0,123,255,.25)'
        }
      },
      {
        s: '&::placeholder',
        r: {
          color: '#6c757d',
          opacity: 1
        }
      },
      {
        s: '&:disabled, &[readonly]',
        r: {
          backgroundColor: '#e9ecef',
          opacity: 1
        }
      }
    ]
  },
  {
    s: 'select.bw-form-control',
    r: {
      height: 'calc(1.5em + .75rem + 2px)',
      paddingTop: '.375rem',
      paddingBottom: '.375rem',
      backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'5\' viewBox=\'0 0 4 5\'%3e%3cpath fill=\'%23343a40\' d=\'M2 0L0 2h4zm0 5L0 3h4z\'/%3e%3c/svg%3e")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right .75rem center',
      backgroundSize: '8px 10px',
      paddingRight: '1.75rem'
    },
    c: [
      {
        s: '&:focus::-ms-value',
        r: {
          color: '#495057',
          backgroundColor: '#fff'
        }
      }
    ]
  },
  {
    s: 'textarea.bw-form-control',
    r: {
      height: 'auto'
    }
  },
  {
    s: '.bw-form-label',
    r: {
      display: 'inline-block',
      marginBottom: '.5rem'
    }
  },

  // Tables
  {
    s: '.bw-table',
    r: {
      width: '100%',
      marginBottom: '1rem',
      color: '#212529',
      borderCollapse: 'collapse'
    },
    c: [
      {
        s: 'th, td',
        r: {
          padding: '.75rem',
          verticalAlign: 'top',
          borderTop: '1px solid #dee2e6'
        }
      },
      {
        s: 'thead th',
        r: {
          verticalAlign: 'bottom',
          borderBottom: '2px solid #dee2e6',
          borderTop: 0,
          fontWeight: 'bold'
        }
      },
      {
        s: 'tbody + tbody',
        r: {
          borderTop: '2px solid #dee2e6'
        }
      }
    ]
  },
  {
    s: '.bw-table-striped tbody tr:nth-of-type(odd)',
    r: {
      backgroundColor: 'rgba(0,0,0,.05)'
    }
  },
  {
    s: '.bw-table-hover tbody tr',
    c: [
      {
        s: '&:hover',
        r: {
          color: '#212529',
          backgroundColor: 'rgba(0,0,0,.075)',
          cursor: 'pointer'
        }
      }
    ]
  },
  {
    s: '.bw-table-bordered',
    r: {
      border: '1px solid #dee2e6'
    },
    c: [
      {
        s: 'th, td',
        r: {
          border: '1px solid #dee2e6'
        }
      },
      {
        s: 'thead th, thead td',
        r: {
          borderBottomWidth: '2px'
        }
      }
    ]
  },

  // Alerts
  {
    s: '.bw-alert',
    r: {
      position: 'relative',
      padding: '.75rem 1.25rem',
      marginBottom: '1rem',
      border: '1px solid transparent',
      borderRadius: '.25rem'
    }
  },
  ...[
    { name: 'primary', bg: '#cfe2ff', border: '#b6d4fe', text: '#084298' },
    { name: 'secondary', bg: '#e2e3e5', border: '#d3d6d8', text: '#41464b' },
    { name: 'success', bg: '#d1e7dd', border: '#badbcc', text: '#0f5132' },
    { name: 'danger', bg: '#f8d7da', border: '#f5c2c7', text: '#842029' },
    { name: 'warning', bg: '#fff3cd', border: '#ffecb5', text: '#664d03' },
    { name: 'info', bg: '#cff4fc', border: '#b6effb', text: '#055160' }
  ].map(variant => ({
    s: `.bw-alert-${variant.name}`,
    r: {
      color: variant.text,
      backgroundColor: variant.bg,
      borderColor: variant.border
    }
  })),

  // Badges
  {
    s: '.bw-badge',
    r: {
      display: 'inline-block',
      padding: '.25em .4em',
      fontSize: '75%',
      fontWeight: 700,
      lineHeight: 1,
      textAlign: 'center',
      whiteSpace: 'nowrap',
      verticalAlign: 'baseline',
      borderRadius: '.25rem',
      transition: 'color .15s ease-in-out, background-color .15s ease-in-out'
    }
  },
  {
    s: '.bw-badge-pill',
    r: {
      paddingRight: '.6em',
      paddingLeft: '.6em',
      borderRadius: '10rem'
    }
  },

  // Lists
  {
    s: '.bw-list-group',
    r: {
      display: 'flex',
      flexDirection: 'column',
      paddingLeft: 0,
      marginBottom: 0,
      borderRadius: '.25rem'
    }
  },
  {
    s: '.bw-list-group-item',
    r: {
      position: 'relative',
      display: 'block',
      padding: '.75rem 1.25rem',
      backgroundColor: '#fff',
      border: '1px solid rgba(0,0,0,.125)'
    },
    c: [
      {
        s: '&:first-child',
        r: {
          borderTopLeftRadius: 'inherit',
          borderTopRightRadius: 'inherit'
        }
      },
      {
        s: '&:last-child',
        r: {
          borderBottomRightRadius: 'inherit',
          borderBottomLeftRadius: 'inherit'
        }
      },
      {
        s: '&.bw-active',
        r: {
          zIndex: 2,
          color: '#fff',
          backgroundColor: '#007bff',
          borderColor: '#007bff'
        }
      },
      {
        s: '&:hover',
        r: {
          zIndex: 1,
          textDecoration: 'none',
          backgroundColor: '#f8f9fa'
        }
      }
    ]
  },

  // Navigation
  {
    s: '.bw-nav',
    r: {
      display: 'flex',
      flexWrap: 'wrap',
      paddingLeft: 0,
      marginBottom: 0,
      listStyle: 'none'
    }
  },
  {
    s: '.bw-nav-link',
    r: {
      display: 'block',
      padding: '.5rem 1rem',
      color: '#007bff',
      textDecoration: 'none',
      transition: 'color .15s ease-in-out'
    },
    c: [
      {
        s: '&:hover',
        r: {
          color: '#0056b3',
          textDecoration: 'none'
        }
      },
      {
        s: '&.bw-active',
        r: {
          color: '#495057',
          backgroundColor: '#e9ecef',
          borderRadius: '.25rem'
        }
      }
    ]
  },
  {
    s: '.bw-nav-tabs',
    r: {
      borderBottom: '1px solid #dee2e6'
    },
    c: [
      {
        s: '.bw-nav-link',
        r: {
          marginBottom: '-1px',
          border: '1px solid transparent',
          borderTopLeftRadius: '.25rem',
          borderTopRightRadius: '.25rem'
        }
      },
      {
        s: '.bw-nav-link:hover',
        r: {
          borderColor: '#e9ecef #e9ecef #dee2e6'
        }
      },
      {
        s: '.bw-nav-link.bw-active',
        r: {
          color: '#495057',
          backgroundColor: '#fff',
          borderColor: '#dee2e6 #dee2e6 #fff'
        }
      }
    ]
  },

  // Modals
  {
    s: '.bw-modal',
    r: {
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 1050,
      display: 'none',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      outline: 0
    }
  },
  {
    s: '.bw-modal.bw-show',
    r: {
      display: 'block'
    }
  },
  {
    s: '.bw-modal-dialog',
    r: {
      position: 'relative',
      width: 'auto',
      margin: '.5rem',
      pointerEvents: 'none'
    }
  },
  {
    s: '.bw-modal-dialog',
    r: {
      maxWidth: '500px',
      margin: '1.75rem auto'
    },
    m: '@media (min-width: 576px)'
  },
  {
    s: '.bw-modal-content',
    r: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      pointerEvents: 'auto',
      backgroundColor: '#fff',
      backgroundClip: 'padding-box',
      border: '1px solid rgba(0,0,0,.2)',
      borderRadius: '.3rem',
      outline: 0
    }
  },
  {
    s: '.bw-modal-backdrop',
    r: {
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 1040,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      opacity: .5
    }
  },
  {
    s: '.bw-modal-header',
    r: {
      display: 'flex',
      flexShrink: 0,
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: '1rem',
      borderBottom: '1px solid #dee2e6',
      borderTopLeftRadius: 'calc(.3rem - 1px)',
      borderTopRightRadius: 'calc(.3rem - 1px)'
    }
  },
  {
    s: '.bw-modal-title',
    r: {
      marginBottom: 0,
      lineHeight: 1.5
    }
  },
  {
    s: '.bw-modal-body',
    r: {
      position: 'relative',
      flex: '1 1 auto',
      padding: '1rem'
    }
  },
  {
    s: '.bw-modal-footer',
    r: {
      display: 'flex',
      flexWrap: 'wrap',
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '.75rem',
      borderTop: '1px solid #dee2e6',
      borderBottomRightRadius: 'calc(.3rem - 1px)',
      borderBottomLeftRadius: 'calc(.3rem - 1px)'
    },
    c: [
      {
        s: '> *',
        r: {
          margin: '.25rem'
        }
      }
    ]
  },

  // ========================================
  // Utility Classes
  // ========================================
  
  // Spacing utilities
  ...(() => {
    const spacings = [0, 0.25, 0.5, 1, 1.5, 3];
    const sides = {
      '': [''],
      't': ['Top'],
      'r': ['Right'],
      'b': ['Bottom'],
      'l': ['Left'],
      'x': ['Left', 'Right'],
      'y': ['Top', 'Bottom']
    };
    const result = [];
    
    ['margin', 'padding'].forEach(property => {
      const prefix = property.charAt(0);
      Object.entries(sides).forEach(([key, values]) => {
        spacings.forEach((size, i) => {
          const rules = {};
          values.forEach(side => {
            rules[property + side] = size + 'rem';
          });
          result.push({
            s: `.bw-${prefix}${key}-${i}`,
            r: rules
          });
        });
      });
    });
    
    return result;
  })(),

  // Display utilities
  ...[
    'none', 'inline', 'inline-block', 'block', 'table', 'table-cell', 
    'table-row', 'flex', 'inline-flex'
  ].map(display => ({
    s: `.bw-d-${display}`,
    r: { display: display + ' !important' }
  })),

  // Flexbox utilities
  {
    s: '.bw-flex-row',
    r: { flexDirection: 'row !important' }
  },
  {
    s: '.bw-flex-column',
    r: { flexDirection: 'column !important' }
  },
  {
    s: '.bw-flex-wrap',
    r: { flexWrap: 'wrap !important' }
  },
  {
    s: '.bw-justify-content-start',
    r: { justifyContent: 'flex-start !important' }
  },
  {
    s: '.bw-justify-content-end',
    r: { justifyContent: 'flex-end !important' }
  },
  {
    s: '.bw-justify-content-center',
    r: { justifyContent: 'center !important' }
  },
  {
    s: '.bw-justify-content-between',
    r: { justifyContent: 'space-between !important' }
  },
  {
    s: '.bw-justify-content-around',
    r: { justifyContent: 'space-around !important' }
  },
  {
    s: '.bw-align-items-start',
    r: { alignItems: 'flex-start !important' }
  },
  {
    s: '.bw-align-items-end',
    r: { alignItems: 'flex-end !important' }
  },
  {
    s: '.bw-align-items-center',
    r: { alignItems: 'center !important' }
  },

  // Text utilities
  {
    s: '.bw-text-left',
    r: { textAlign: 'left !important' }
  },
  {
    s: '.bw-text-right',
    r: { textAlign: 'right !important' }
  },
  {
    s: '.bw-text-center',
    r: { textAlign: 'center !important' }
  },
  {
    s: '.bw-text-uppercase',
    r: { textTransform: 'uppercase !important' }
  },
  {
    s: '.bw-text-lowercase',
    r: { textTransform: 'lowercase !important' }
  },
  {
    s: '.bw-text-capitalize',
    r: { textTransform: 'capitalize !important' }
  },
  {
    s: '.bw-font-weight-bold',
    r: { fontWeight: '700 !important' }
  },
  {
    s: '.bw-font-weight-normal',
    r: { fontWeight: '400 !important' }
  },
  {
    s: '.bw-font-weight-light',
    r: { fontWeight: '300 !important' }
  },
  {
    s: '.bw-text-nowrap',
    r: { whiteSpace: 'nowrap !important' }
  },
  {
    s: '.bw-text-truncate',
    r: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  },

  // Color utilities
  ...[
    { name: 'primary', color: '#007bff' },
    { name: 'secondary', color: '#6c757d' },
    { name: 'success', color: '#28a745' },
    { name: 'danger', color: '#dc3545' },
    { name: 'warning', color: '#ffc107' },
    { name: 'info', color: '#17a2b8' },
    { name: 'light', color: '#f8f9fa' },
    { name: 'dark', color: '#343a40' },
    { name: 'white', color: '#fff' },
    { name: 'muted', color: '#6c757d' }
  ].flatMap(({ name, color }) => [
    {
      s: `.bw-text-${name}`,
      r: { color: color + ' !important' }
    },
    {
      s: `.bw-bg-${name}`,
      r: { backgroundColor: color + ' !important' }
    },
    {
      s: `.bw-border-${name}`,
      r: { borderColor: color + ' !important' }
    }
  ]),

  // Border utilities
  {
    s: '.bw-border',
    r: { border: '1px solid #dee2e6 !important' }
  },
  {
    s: '.bw-border-0',
    r: { border: '0 !important' }
  },
  {
    s: '.bw-border-top',
    r: { borderTop: '1px solid #dee2e6 !important' }
  },
  {
    s: '.bw-border-right',
    r: { borderRight: '1px solid #dee2e6 !important' }
  },
  {
    s: '.bw-border-bottom',
    r: { borderBottom: '1px solid #dee2e6 !important' }
  },
  {
    s: '.bw-border-left',
    r: { borderLeft: '1px solid #dee2e6 !important' }
  },
  {
    s: '.bw-rounded',
    r: { borderRadius: '.25rem !important' }
  },
  {
    s: '.bw-rounded-0',
    r: { borderRadius: '0 !important' }
  },
  {
    s: '.bw-rounded-circle',
    r: { borderRadius: '50% !important' }
  },
  {
    s: '.bw-rounded-pill',
    r: { borderRadius: '50rem !important' }
  },

  // Shadow utilities
  {
    s: '.bw-shadow-none',
    r: { boxShadow: 'none !important' }
  },
  {
    s: '.bw-shadow-sm',
    r: { boxShadow: '0 .125rem .25rem rgba(0,0,0,.075) !important' }
  },
  {
    s: '.bw-shadow',
    r: { boxShadow: '0 .5rem 1rem rgba(0,0,0,.15) !important' }
  },
  {
    s: '.bw-shadow-lg',
    r: { boxShadow: '0 1rem 3rem rgba(0,0,0,.175) !important' }
  },

  // Position utilities
  {
    s: '.bw-position-static',
    r: { position: 'static !important' }
  },
  {
    s: '.bw-position-relative',
    r: { position: 'relative !important' }
  },
  {
    s: '.bw-position-absolute',
    r: { position: 'absolute !important' }
  },
  {
    s: '.bw-position-fixed',
    r: { position: 'fixed !important' }
  },
  {
    s: '.bw-position-sticky',
    r: { position: 'sticky !important' }
  },

  // Visibility utilities
  {
    s: '.bw-visible',
    r: { visibility: 'visible !important' }
  },
  {
    s: '.bw-invisible',
    r: { visibility: 'hidden !important' }
  },

  // Width/Height utilities
  {
    s: '.bw-w-25',
    r: { width: '25% !important' }
  },
  {
    s: '.bw-w-50',
    r: { width: '50% !important' }
  },
  {
    s: '.bw-w-75',
    r: { width: '75% !important' }
  },
  {
    s: '.bw-w-100',
    r: { width: '100% !important' }
  },
  {
    s: '.bw-w-auto',
    r: { width: 'auto !important' }
  },
  {
    s: '.bw-h-25',
    r: { height: '25% !important' }
  },
  {
    s: '.bw-h-50',
    r: { height: '50% !important' }
  },
  {
    s: '.bw-h-75',
    r: { height: '75% !important' }
  },
  {
    s: '.bw-h-100',
    r: { height: '100% !important' }
  },
  {
    s: '.bw-h-auto',
    r: { height: 'auto !important' }
  },

  // Overflow utilities
  {
    s: '.bw-overflow-auto',
    r: { overflow: 'auto !important' }
  },
  {
    s: '.bw-overflow-hidden',
    r: { overflow: 'hidden !important' }
  },
  {
    s: '.bw-overflow-visible',
    r: { overflow: 'visible !important' }
  },
  {
    s: '.bw-overflow-scroll',
    r: { overflow: 'scroll !important' }
  },

  // Interactive utilities
  {
    s: '.bw-user-select-all',
    r: { userSelect: 'all !important' }
  },
  {
    s: '.bw-user-select-auto',
    r: { userSelect: 'auto !important' }
  },
  {
    s: '.bw-user-select-none',
    r: { userSelect: 'none !important' }
  },
  {
    s: '.bw-pe-none',
    r: { pointerEvents: 'none !important' }
  },
  {
    s: '.bw-pe-auto',
    r: { pointerEvents: 'auto !important' }
  },

  // Screen reader utilities
  {
    s: '.bw-sr-only',
    r: {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: 0,
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0,0,0,0)',
      whiteSpace: 'nowrap',
      border: 0
    }
  },
  {
    s: '.bw-sr-only-focusable:active, .bw-sr-only-focusable:focus',
    r: {
      position: 'static',
      width: 'auto',
      height: 'auto',
      overflow: 'visible',
      clip: 'auto',
      whiteSpace: 'normal'
    }
  }
];

// Generate CSS from SRMC
const defaultCSS = bw.css.buildFromSRMC(bw.themes.completeSRMC);

// Or generate with custom modifications
const customTheme = bw.themes.completeSRMC.map(rule => {
  // Make all cards have more padding
  if (rule.s === '.bw-card-body') {
    rule.r.padding = '2rem';
  }
  // Change primary color throughout
  if (rule.r && rule.r.backgroundColor === '#007bff') {
    rule.r.backgroundColor = '#ff6b6b';
  }
  return rule;
});

const customCSS = bw.css.buildFromSRMC(customTheme);
```

This comprehensive SRMC implementation provides:

1. **Complete Framework**: All essential components styled
2. **Responsive Design**: Mobile-first with proper breakpoints
3. **Beautiful Defaults**: Modern, clean design out of the box
4. **Easy Customization**: Modify any rule before generating CSS
5. **Data-Driven**: Entire theme is data that can be saved/shared
6. **No Build Required**: Generate at runtime or prebuild

The SRMC format makes it easy to:
- Override specific styles
- Add new components
- Create theme variations
- Generate optimized CSS for production

### 9. Distribution and Packaging

#### File Structure
```
bitwrench/dist/
├── bitwrench.js                   # Core library (no CSS)
├── bitwrench.min.js               # Minified core
├── bitwrench-with-css.js          # Includes default SRMC theme
├── bitwrench-with-css.min.js      # Minified with CSS
├── css/
│   ├── srmc/
│   │   ├── bw.core.srmc.json     # Core theme definition
│   │   ├── bw.dark.srmc.json     # Dark theme SRMC
│   │   ├── bw.modern.srmc.json   # Modern colorful theme
│   │   ├── bw.minimal.srmc.json  # Minimal/clean theme
│   │   └── bw.corporate.srmc.json # Corporate theme
│   ├── compiled/
│   │   ├── bw.css                # Default theme
│   │   ├── bw.min.css            # Minified default
│   │   ├── bw.dark.css           # Dark theme
│   │   ├── bw.modern.css         # Modern theme
│   │   ├── bw.minimal.css        # Minimal theme
│   │   ├── bw.corporate.css      # Corporate theme
│   │   └── bw.all.css            # All themes (class-based)
│   └── utils/
│       ├── bw.reset.css          # Just reset/normalize
│       ├── bw.grid.css           # Just grid system
│       └── bw.utilities.css      # Just utility classes
└── examples/
    ├── static-only.html          # Pure CSS example
    ├── theme-switcher.html       # Dynamic theme loading
    └── custom-theme.html         # Custom theme creation
```

#### Built-in CSS Option
```javascript
// bitwrench-with-css.js includes default theme
bw._builtinSRMC = [/* Complete SRMC array */];

// Auto-inject on load unless disabled
if (typeof bw.config.autoInjectCSS === 'undefined' || bw.config.autoInjectCSS) {
  bw.loadDefaultStyles();
}

// User can still override
bw.config.autoInjectCSS = false; // Disable auto-inject
bw.setTheme('dark'); // Switch to different built-in theme
```

#### Media Query Structure

All default themes include comprehensive responsive breakpoints:

```javascript
// Mobile-first breakpoints in SRMC
const breakpoints = {
  xs: 0,      // Extra small (phones)
  sm: 576,    // Small (landscape phones)
  md: 768,    // Medium (tablets)
  lg: 992,    // Large (desktops)
  xl: 1200,   // Extra large (wide screens)
  xxl: 1400   // Extra extra large
};

// Example responsive SRMC rules
{
  s: '.bw-container',
  r: { 
    width: '100%',
    paddingLeft: 10,
    paddingRight: 10
  }
},
{
  s: '.bw-container',
  r: { 
    maxWidth: 540,
    paddingLeft: 15,
    paddingRight: 15
  },
  m: '@media (min-width: 576px)'
},
{
  s: '.bw-container',
  r: { maxWidth: 720 },
  m: '@media (min-width: 768px)'
},
{
  s: '.bw-container',
  r: { maxWidth: 960 },
  m: '@media (min-width: 992px)'
},
{
  s: '.bw-container',
  r: { maxWidth: 1140 },
  m: '@media (min-width: 1200px)'
}
```

### 10. CSS Generation and Manipulation Functions

#### Core CSS Functions

```javascript
// SRMC Processing
bw.css.processSRMC(srmc)           // Convert single SRMC to CSS
bw.css.buildFromSRMC(srmcArray)    // Convert SRMC array to CSS string

// CSS Generation  
bw.css.makeCSS(styleObject)        // Convert JS object to CSS properties
bw.css.makeCSSRule(selector, rules) // Create complete CSS rule
bw.css.generateUtilityCSS(config)  // Generate utility classes from config

// Theme Management
bw.loadDefaultStyles(options)       // Load built-in or default theme
bw.setTheme(themeName)             // Switch to named theme
bw.getTheme()                      // Get current theme name
bw.themes.list()                   // List available themes
bw.themes.get(name)                // Get theme SRMC by name
bw.themes.register(name, srmc)     // Register custom theme

// CSS Injection
bw.injectCSS(css, options)         // Inject CSS into document
bw.removeCSS(id)                   // Remove injected CSS by ID
bw.replaceCSS(id, newCSS)          // Replace existing CSS

// Theme Customization
bw.themes.customize(baseSRMC, overrides) // Customize existing theme
bw.themes.merge(srmc1, srmc2)      // Merge two SRMC themes
bw.themes.extend(parentName, childSRMC) // Extend existing theme

// SRMC Manipulation
bw.srmc.create(selector, rules, media, children) // Create SRMC object
bw.srmc.find(srmcArray, selector)  // Find rules by selector
bw.srmc.filter(srmcArray, predicate) // Filter SRMC rules
bw.srmc.map(srmcArray, transformer) // Transform SRMC rules
bw.srmc.addRule(srmcArray, rule)   // Add new rule
bw.srmc.removeRule(srmcArray, selector) // Remove rule by selector
bw.srmc.updateRule(srmcArray, selector, updates) // Update existing rule

// Utility Functions
bw.css.camelToKebab(str)           // Convert camelCase to kebab-case
bw.css.addPx(value)                // Add 'px' to numeric values
bw.css.parseColor(color)           // Parse color to standard format
bw.css.stringify(cssObject)        // Convert CSS object to string
bw.css.parse(cssString)            // Parse CSS string to object

// Import/Export
bw.themes.toJSON(srmc)             // Export SRMC as JSON
bw.themes.fromJSON(json)           // Import SRMC from JSON
bw.themes.toCSS(themeName)         // Export theme as CSS string
bw.themes.download(themeName, format) // Download theme file

// Development Tools
bw.css.validate(srmc)              // Validate SRMC structure
bw.css.optimize(css)               // Optimize CSS (remove duplicates)
bw.css.minify(css)                 // Minify CSS
bw.css.format(css)                 // Format/prettify CSS
bw.css.diff(srmc1, srmc2)          // Show differences between themes
bw.css.stats(css)                  // Get CSS statistics
```

#### Usage Examples

```javascript
// Example 1: Load built-in theme
bw.loadDefaultStyles(); // Uses built-in SRMC

// Example 2: Switch themes dynamically
bw.setTheme('dark');

// Example 3: Create custom theme from scratch
const myTheme = [
  {
    s: '.bw-btn',
    r: { 
      padding: '10px 20px',
      borderRadius: 8
    }
  }
];
bw.injectCSS(bw.css.buildFromSRMC(myTheme));

// Example 4: Customize existing theme
const customDark = bw.themes.customize('dark', {
  colors: {
    primary: '#00ff00',
    background: '#000'
  }
});
bw.injectCSS(bw.css.buildFromSRMC(customDark));

// Example 5: Generate responsive utilities
const utils = bw.css.generateUtilityCSS({
  breakpoints: ['', 'sm', 'md', 'lg'],
  spacing: [0, 4, 8, 16, 24, 32],
  colors: {
    primary: '#007bff',
    success: '#28a745'
  }
});

// Example 6: Export theme for distribution
const themeJSON = bw.themes.toJSON('myCustomTheme');
const themeCSS = bw.themes.toCSS('myCustomTheme');
bw.themes.download('myCustomTheme', 'both'); // Downloads .json and .css
```

### 11. Responsive System

```css
/* Mobile-first breakpoints */
/* Extra small devices (phones, less than 576px) */
/* No media query since this is the default */

/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) {
  .bw-sm-col-1 { width: 8.333333%; }
  .bw-sm-col-2 { width: 16.666667%; }
  /* ... etc ... */
  
  .bw-sm-d-none { display: none !important; }
  .bw-sm-d-block { display: block !important; }
  /* ... etc ... */
}

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) {
  .bw-md-col-1 { width: 8.333333%; }
  /* ... etc ... */
}

/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) {
  .bw-lg-col-1 { width: 8.333333%; }
  /* ... etc ... */
}

/* Extra large devices (large desktops, 1200px and up) */
@media (min-width: 1200px) {
  .bw-xl-col-1 { width: 8.333333%; }
  /* ... etc ... */
}
```

### 8. Print Styles

```css
@media print {
  .bw-no-print,
  .bw-d-print-none {
    display: none !important;
  }
  
  .bw-page-break {
    page-break-after: always;
  }
  
  /* Ensure proper printing of components */
  .bw-card,
  .bw-table {
    page-break-inside: avoid;
  }
  
  /* Remove backgrounds for printing */
  .bw-bg-primary,
  .bw-bg-secondary,
  .bw-bg-success,
  .bw-bg-danger,
  .bw-bg-warning,
  .bw-bg-info,
  .bw-bg-dark {
    background-color: transparent !important;
    color: #000 !important;
  }
}
```

## Usage Examples

### 1. Loading CSS

```javascript
// Option 1: Load default styles
bw.loadDefaultStyles();

// Option 2: Load with custom theme
bw.loadDefaultStyles({ theme: myCustomTheme });

// Option 3: Generate and inject custom CSS
var customCSS = bw.css.generateUtilityCSS({
  spacing: [0, 5, 10, 15, 20, 30],
  colors: {
    brand: '#ff6b6b',
    accent: '#4ecdc4'
  }
});
bw.injectCSS(customCSS, { id: 'my-custom-styles' });
```

### 2. Dynamic Styling

```javascript
// Create styled component
var styledCard = bw.components.card({
  title: 'Dynamic Card',
  content: 'This card has dynamic styles',
  style: bw.css.makeCSS({
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    boxShadow: theme.shadows.lg
  })
});

// Apply theme to component
var themedButton = bw.applyTheme(
  bw.components.button({ text: 'Click me' }),
  darkTheme
);
```

### 3. Responsive Components

```javascript
// Responsive grid
var responsiveLayout = {
  t: 'div',
  a: { class: 'bw-row' },
  c: [
    {
      t: 'div',
      a: { class: 'bw-col-12 bw-md-col-6 bw-lg-col-4' },
      c: 'Responsive column'
    }
  ]
};

// Hide on mobile, show on desktop
var desktopOnly = {
  t: 'div',
  a: { class: 'bw-d-none bw-md-d-block' },
  c: 'Desktop content'
};
```

## IE8 Compatibility Notes

### What Works
- All layout systems (float-based grid)
- Basic component styles
- JavaScript CSS generation
- Core utilities
- Form elements (with limitations)

### What Doesn't Work (Graceful Degradation)
- Border-radius (square corners in IE8)
- Box-shadow (no shadows in IE8)
- CSS3 transitions/animations
- Flexbox (falls back to block/float)
- CSS Grid (falls back to float grid)
- Media queries (IE8 gets desktop styles)
- :nth-child selectors (use JS for striping)

### Polyfills Included
- Box-sizing behavior
- Opacity filter fallback
- HasLayout triggers
- Min/max-width simulation

## Performance Considerations

1. **CSS Size**: Core CSS ~20KB minified
2. **Runtime Generation**: CSS generation < 5ms
3. **Injection**: Style injection < 1ms
4. **Memory**: Minimal overhead for theme objects
5. **Rendering**: No reflows when using classes

## Best Practices

1. **Always use bw- prefix** for all classes
2. **Generate CSS once** at startup when possible
3. **Use utility classes** for common styles
4. **Theme at component level** not globally
5. **Test in IE8** for critical features
6. **Progressive enhance** for modern browsers
7. **Minimize inline styles** for better caching

## Summary

The Bitwrench CSS system provides:
- Complete styling solution with IE8+ support
- SRMC pattern for CSS as data structures (like TACO for HTML)
- Multiple usage patterns: static CSS, dynamic generation, or hybrid
- Responsive gutters that adapt to screen size
- JavaScript-based theme generation and customization
- Export/import themes as JSON data
- No conflicts with other libraries (bw- prefix)
- Both prebuilt distributions and runtime generation
- Seamless BCCL integration

Key advantages:
1. **Flexibility**: Use as static CSS library or full dynamic system
2. **Consistency**: SRMC mirrors TACO pattern for unified data approach
3. **Portability**: Themes are data that can be shared, modified, and versioned
4. **Performance**: Prebuilt CSS for production, dynamic for development
5. **Compatibility**: Works from IE8 to latest browsers

This enables developers to:
- Start with zero JavaScript (pure CSS)
- Progressively enhance with dynamic features
- Customize from known-good defaults
- Share themes as data structures
- Generate optimal CSS for their use case

The system maintains Bitwrench's "UI as data" philosophy while providing the flexibility to work however developers prefer.