/**
 * Bitwrench v2 Temporary Shims
 * 
 * This file provides temporary implementations and feature stubs to get examples_v2 working
 * while the full v2 implementation is being completed.
 * 
 * NOT POLYFILLS - These are not providing modern JS features for old browsers.
 * These are temporary fixes for missing v2 functionality:
 * - Theme management system
 * - Utility CSS generation 
 * - API adapters for v1 functions
 * 
 * TO BE REMOVED once proper implementations are in place.
 */

// Add missing theme object
if (!bw.theme) {
  bw.theme = {
    colors: {
      primary: "#007bff",
      secondary: "#6c757d", 
      success: "#28a745",
      danger: "#dc3545",
      warning: "#ffc107",
      info: "#17a2b8",
      light: "#f8f9fa",
      dark: "#343a40",
      white: "#ffffff",
      transparent: "transparent"
    },
    spacing: {
      0: "0",
      1: "0.25rem",
      2: "0.5rem", 
      3: "1rem",
      4: "1.5rem",
      5: "3rem"
    },
    breakpoints: {
      sm: "576px",
      md: "768px",
      lg: "992px",
      xl: "1200px"
    },
    fonts: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    }
  };
}

// Generate utility CSS
if (!bw.generateUtilityCSS) {
  bw.generateUtilityCSS = function(options = {}) {
    const theme = bw.theme;
    const css = [];
    
    // Reset/Normalize
    css.push(`
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; padding: 0; font-family: ${theme.fonts.sans}; line-height: 1.5; }
      h1, h2, h3, h4, h5, h6 { margin-top: 0; margin-bottom: 0.5rem; font-weight: 500; line-height: 1.2; }
      h1 { font-size: 2.5rem; }
      h2 { font-size: 2rem; }
      h3 { font-size: 1.75rem; }
      h4 { font-size: 1.5rem; }
      h5 { font-size: 1.25rem; }
      h6 { font-size: 1rem; }
      p { margin-top: 0; margin-bottom: 1rem; }
      hr { margin: 1rem 0; border: 0; border-top: 1px solid rgba(0,0,0,0.1); }
    `);
    
    // Display utilities
    css.push('.d-none { display: none !important; }');
    css.push('.d-block { display: block !important; }');
    css.push('.d-inline { display: inline !important; }');
    css.push('.d-inline-block { display: inline-block !important; }');
    css.push('.d-flex { display: flex !important; }');
    css.push('.d-inline-flex { display: inline-flex !important; }');
    
    // Flexbox utilities
    css.push('.flex-row { flex-direction: row !important; }');
    css.push('.flex-column { flex-direction: column !important; }');
    css.push('.flex-wrap { flex-wrap: wrap !important; }');
    css.push('.flex-nowrap { flex-wrap: nowrap !important; }');
    css.push('.justify-content-start { justify-content: flex-start !important; }');
    css.push('.justify-content-end { justify-content: flex-end !important; }');
    css.push('.justify-content-center { justify-content: center !important; }');
    css.push('.justify-content-between { justify-content: space-between !important; }');
    css.push('.align-items-start { align-items: flex-start !important; }');
    css.push('.align-items-center { align-items: center !important; }');
    css.push('.align-items-end { align-items: flex-end !important; }');
    
    // Gap utilities (with fallback for older browsers)
    ['gap', 'row-gap', 'column-gap'].forEach(prop => {
      Object.entries(theme.spacing).forEach(([key, value]) => {
        css.push(`.${prop}-${key} { ${prop}: ${value} !important; }`);
      });
    });
    
    // Spacing utilities (margin and padding)
    ['m', 'p'].forEach(property => {
      const prop = property === 'm' ? 'margin' : 'padding';
      
      // All sides
      Object.entries(theme.spacing).forEach(([key, value]) => {
        css.push(`.${property}-${key} { ${prop}: ${value} !important; }`);
      });
      
      // Individual sides
      const sides = {
        't': 'top',
        'r': 'right', 
        'b': 'bottom',
        'l': 'left'
      };
      
      Object.entries(sides).forEach(([sideKey, sideName]) => {
        Object.entries(theme.spacing).forEach(([spaceKey, spaceValue]) => {
          css.push(`.${property}${sideKey}-${spaceKey} { ${prop}-${sideName}: ${spaceValue} !important; }`);
        });
      });
      
      // Horizontal and vertical
      Object.entries(theme.spacing).forEach(([key, value]) => {
        css.push(`.${property}x-${key} { ${prop}-left: ${value} !important; ${prop}-right: ${value} !important; }`);
        css.push(`.${property}y-${key} { ${prop}-top: ${value} !important; ${prop}-bottom: ${value} !important; }`);
      });
    });
    
    // Text utilities
    css.push('.text-start { text-align: left !important; }');
    css.push('.text-center { text-align: center !important; }');
    css.push('.text-end { text-align: right !important; }');
    css.push('.text-lowercase { text-transform: lowercase !important; }');
    css.push('.text-uppercase { text-transform: uppercase !important; }');
    css.push('.text-capitalize { text-transform: capitalize !important; }');
    css.push('.text-muted { color: #6c757d !important; }');
    css.push('.text-nowrap { white-space: nowrap !important; }');
    css.push('.text-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }');
    
    // Text color utilities
    Object.entries(theme.colors).forEach(([name, color]) => {
      css.push(`.text-${name} { color: ${color} !important; }`);
    });
    
    // Background color utilities
    Object.entries(theme.colors).forEach(([name, color]) => {
      css.push(`.bg-${name} { background-color: ${color} !important; }`);
    });
    
    // Border utilities
    css.push('.border { border: 1px solid #dee2e6 !important; }');
    css.push('.border-0 { border: 0 !important; }');
    css.push('.border-top { border-top: 1px solid #dee2e6 !important; }');
    css.push('.border-end { border-right: 1px solid #dee2e6 !important; }');
    css.push('.border-bottom { border-bottom: 1px solid #dee2e6 !important; }');
    css.push('.border-start { border-left: 1px solid #dee2e6 !important; }');
    
    // Border color utilities
    Object.entries(theme.colors).forEach(([name, color]) => {
      css.push(`.border-${name} { border-color: ${color} !important; }`);
    });
    
    // Border radius utilities
    css.push('.rounded { border-radius: 0.25rem !important; }');
    css.push('.rounded-0 { border-radius: 0 !important; }');
    css.push('.rounded-circle { border-radius: 50% !important; }');
    css.push('.rounded-pill { border-radius: 50rem !important; }');
    
    // Width and height utilities
    [25, 50, 75, 100].forEach(size => {
      css.push(`.w-${size} { width: ${size}% !important; }`);
      css.push(`.h-${size} { height: ${size}% !important; }`);
    });
    css.push('.w-auto { width: auto !important; }');
    css.push('.h-auto { height: auto !important; }');
    
    // Position utilities
    css.push('.position-static { position: static !important; }');
    css.push('.position-relative { position: relative !important; }');
    css.push('.position-absolute { position: absolute !important; }');
    css.push('.position-fixed { position: fixed !important; }');
    css.push('.position-sticky { position: sticky !important; }');
    
    // Shadow utilities
    css.push('.shadow-sm { box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.075) !important; }');
    css.push('.shadow { box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15) !important; }');
    css.push('.shadow-lg { box-shadow: 0 1rem 3rem rgba(0,0,0,0.175) !important; }');
    css.push('.shadow-none { box-shadow: none !important; }');
    
    // Component styles
    css.push(`
      /* Containers */
      .container { width: 100%; padding-right: 15px; padding-left: 15px; margin-right: auto; margin-left: auto; }
      @media (min-width: ${theme.breakpoints.sm}) { .container { max-width: 540px; } }
      @media (min-width: ${theme.breakpoints.md}) { .container { max-width: 720px; } }
      @media (min-width: ${theme.breakpoints.lg}) { .container { max-width: 960px; } }
      @media (min-width: ${theme.breakpoints.xl}) { .container { max-width: 1140px; } }
      .container-fluid { width: 100%; padding-right: 15px; padding-left: 15px; margin-right: auto; margin-left: auto; }
      
      /* Grid system */
      .row { display: flex; flex-wrap: wrap; margin-right: -15px; margin-left: -15px; }
      .col, [class*="col-"] { position: relative; width: 100%; padding-right: 15px; padding-left: 15px; }
      .col { flex-basis: 0; flex-grow: 1; max-width: 100%; }
      
      /* Column sizes */
      ${[...Array(12)].map((_, i) => {
        const n = i + 1;
        return `.col-${n} { flex: 0 0 ${(n/12*100).toFixed(6)}%; max-width: ${(n/12*100).toFixed(6)}%; }`;
      }).join('\n')}
      
      /* Responsive columns */
      ${['sm', 'md', 'lg', 'xl'].map(bp => `
        @media (min-width: ${theme.breakpoints[bp]}) {
          ${[...Array(12)].map((_, i) => {
            const n = i + 1;
            return `.col-${bp}-${n} { flex: 0 0 ${(n/12*100).toFixed(6)}%; max-width: ${(n/12*100).toFixed(6)}%; }`;
          }).join('\n')}
        }
      `).join('\n')}
      
      /* Lead text */
      .lead { font-size: 1.25rem; font-weight: 300; }
      
      /* Display headings */
      .display-1 { font-size: 6rem; font-weight: 300; line-height: 1.2; }
      .display-2 { font-size: 5.5rem; font-weight: 300; line-height: 1.2; }
      .display-3 { font-size: 4.5rem; font-weight: 300; line-height: 1.2; }
      .display-4 { font-size: 3.5rem; font-weight: 300; line-height: 1.2; }
      
      /* Page styling */
      .bw-page { min-height: 100vh; display: flex; flex-direction: column; }
      .bw-page-content { flex: 1; padding: 2rem 0; }
    `);
    
    return css.join('\n');
  };
}

// Theme switching functionality
if (!bw.themes) {
  bw.themes = {
    light: {
      name: 'Light',
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8',
        light: '#f8f9fa',
        dark: '#343a40',
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
        success: '#198754',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#0dcaf0',
        light: '#f8f9fa',
        dark: '#212529',
        background: '#212529',
        surface: '#343a40',
        text: '#ffffff',
        textMuted: '#adb5bd',
        border: '#495057'
      }
    }
  };
  
  bw.currentTheme = 'light';
  
  bw.setTheme = function(themeName) {
    if (!bw.themes[themeName]) return;
    
    bw.currentTheme = themeName;
    bw.theme.colors = { ...bw.theme.colors, ...bw.themes[themeName].colors };
    
    // Apply theme CSS
    const css = bw.generateThemeCSS();
    bw.injectCSS(css, { id: 'bw-theme-styles', append: false });
    
    return bw.theme;
  };
  
  bw.generateThemeCSS = function() {
    const theme = bw.theme;
    const css = [];
    
    // CSS custom properties
    css.push(':root {');
    Object.entries(theme.colors).forEach(([name, value]) => {
      css.push(`  --bw-color-${name}: ${value};`);
    });
    css.push('}');
    
    // Theme-aware styles
    css.push(`
      body {
        background-color: var(--bw-color-background);
        color: var(--bw-color-text);
        transition: background-color 0.3s, color 0.3s;
      }
      
      .card {
        background-color: var(--bw-color-surface);
        border-color: var(--bw-color-border);
        color: var(--bw-color-text);
      }
      
      .navbar-dark {
        background-color: var(--bw-color-dark) !important;
      }
      
      .navbar-light {
        background-color: var(--bw-color-light) !important;
      }
      
      .table {
        color: var(--bw-color-text);
      }
      
      .text-muted {
        color: var(--bw-color-textMuted) !important;
      }
    `);
    
    return css.join('\n');
  };
}

// Note: v1 already has random functions, but examples might expect different API
// Create convenience wrappers if needed
if (!bw.random.int) {
  bw.random.int = function(min, max) {
    return bw.random(min, max, { setType: 'int' });
  };
  
  bw.random.choice = function(array) {
    return array[bw.random(0, array.length - 1, { setType: 'int' })];
  };
  
  bw.random.color = function() {
    const r = bw.random(0, 255, { setType: 'int' });
    const g = bw.random(0, 255, { setType: 'int' });
    const b = bw.random(0, 255, { setType: 'int' });
    return '#' + [r,g,b].map(x => x.toString(16).padStart(2, '0')).join('');
  };
}

// v1 already has bw.random() which works great
// Examples should just use bw.random() directly

// v1 already has bw.htmlTable which is feature-rich and battle-tested
// If examples need a different API, they should be updated to use htmlTable directly
// For now, create an alias if needed
if (!bw.makeTable && bw.htmlTable) {
  bw.makeTable = bw.htmlTable;
}

// Fix loremIpsum to handle being called with no arguments (random length)
if (bw.loremIpsum) {
  const originalLoremIpsum = bw.loremIpsum;
  bw.loremIpsum = function(numChars, startSpot, startWithCapitalLetter) {
    // If called with no arguments, generate random length text
    if (arguments.length === 0) {
      const randomLength = bw.random(25, 150, { setType: 'int' });
      return originalLoremIpsum(randomLength);
    }
    return originalLoremIpsum.apply(this, arguments);
  };
}

// Add missing injectCSS function for examples
if (!bw.injectCSS) {
  bw.injectCSS = function(css, options = {}) {
    const { id, append = true } = options;
    
    // Check if style element with this id already exists
    let styleEl = id ? document.getElementById(id) : null;
    
    if (!styleEl || !append) {
      // Create new style element
      styleEl = document.createElement('style');
      styleEl.type = 'text/css';
      if (id) styleEl.id = id;
      
      // Remove old one if replacing
      if (!append && id) {
        const oldEl = document.getElementById(id);
        if (oldEl) oldEl.remove();
      }
      
      document.head.appendChild(styleEl);
    }
    
    // Add CSS
    if (styleEl.styleSheet) {
      // IE8 and below
      styleEl.styleSheet.cssText = append && styleEl.styleSheet.cssText ? 
        styleEl.styleSheet.cssText + css : css;
    } else {
      // Modern browsers
      if (append && styleEl.textContent) {
        styleEl.appendChild(document.createTextNode(css));
      } else {
        styleEl.textContent = css;
      }
    }
    
    return styleEl;
  };
}

// Inject the utility CSS
bw.injectCSS(bw.generateUtilityCSS(), { id: 'bw-utilities' });

// Log that shims are loaded
console.log('Bitwrench v2 temporary shims loaded. These are stopgap measures - full implementation coming soon.');