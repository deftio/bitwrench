# Bitwrench v2 R1: Core Design Principles & Implementation

## Executive Summary

Bitwrench v2 has drifted from its core philosophy. This document refocuses on:
- Legacy browser compatibility (IE8+)
- Zero namespace collisions (bs css classes with other frameworks, bw functions with common libraries)
- Clear component lifecycle
- Memory leak prevention
- Practical, working examples

## Core Precepts (Non-Negotiable)

1. **Works in legacy browsers** - If it doesn't work in IE8, it's not bitwrench
2. **Zero dependencies** - (polyfills OK)
3. **No namespace collisions** - Coexists with jQuery, React, anything 
4. **UI as data** - TACO objects are just data and functions, not magic
5. **Memory safe** - Components clean up after themselves

## The TACO Model: Clarified

```javascript
{
  t: "tag",          // HTML tag name
  a: {attributes},   // HTML attributes ONLY
  c: content,        // Children: string, TACO, or array of TACOs
  o: {               // OPTIONS - bitwrench-specific, never rendered to HTML
    // Lifecycle hooks
    mount: function(element) {},      // Called after element added to DOM
    unmount: function(element) {},    // Called when element removed from DOM
    update: function(element, newTACO) {}, // Called when updating
    
    // Component state
    state: {},        // Component's private state
    
    // References
    ref: "myComponent",  // String ID for later reference NOTE: also in a{"class" : [bw-uuid-xxxx, "other","class","strings"]}
    
    // Nothing else! No random properties.
  }
}
```

### What NEVER goes in 'o':
- Style information (use 'a.style' or 'a["class"]')
- Event handlers (use 'a.onclick' etc)
- Random config like 'interval' or 'format'

## Two Rendering Modes: When to Use Each

### Mode 1: Static HTML Generation (`bw.html()`)

**Use when:**
- Server-side rendering
- Email templates  
- SEO is critical
- No interactivity needed

```javascript
const myCard = {
  t: "div",
  a: { "class": "card" },
  c: [
    { t: "h3", c: "Static Card" },
    { t: "p", c: "I'm just HTML" }
  ]
};

// Generates: <div class="card"><h3>Static Card</h3><p>I'm just HTML</p></div>
const html = bw.html(myCard);
document.getElementById('container').innerHTML = html;
```

### Event Handlers in HTML Generation

Bitwrench v1.x pioneered the function registry system, allowing event handlers in static HTML:

```javascript
// Event handlers work in bw.html()!
const button = {
  t: "button",
  a: {
    "class": "bw-btn",
    onclick: function() {
      alert('Clicked!');
    }
  },
  c: "Click Me"
};

// This generates HTML with registered onclick handler
const html = bw.html(button);
// Output: <button class="bw-btn" onclick="bw.funcCall('f_123')">Click Me</button>

// The function is stored in bw's registry and called when clicked
document.getElementById('container').innerHTML = html;
```

**How it works:**
1. Functions are registered with unique IDs
2. HTML gets `onclick="bw.funcCall('f_123')"`  
3. Click events lookup and execute the registered function
4. No inline JavaScript strings, just function references


### Mode 2: Managed Components (`bw.render()`)

**Use when:**
- Component needs lifecycle management
- Self-updating components (clocks, live data)
- Event handlers that need cleanup
- Stateful components

```javascript
const myClock = {
  t: "div",
  a: { "class": "clock" },
  c: new Date().toLocaleTimeString(),
  o: {
    state: { timer: null },
    mount: function(element) {
      const state = this.state;
      state.timer = setInterval(() => {
        element.textContent = new Date().toLocaleTimeString();
      }, 1000);
    },
    unmount: function(element) {
      if (this.state.timer) {
        clearInterval(this.state.timer);
      }
    }
  }
};

// Returns a handle for lifecycle management
const clockHandle = bw.render('#clock-container', myClock);

// Later...
clockHandle.destroy(); // Calls unmount, cleans up timer
```

## Component Lifecycle Management

### The Lifecycle Flow

```
1. Create TACO object
2. bw.render() creates DOM element
3. Element added to DOM
4. mount() hook called
5. Component lives...
6. Element removed from DOM (or destroy() called)
7. unmount() hook called
8. Cleanup complete
```

### Automatic Cleanup via MutationObserver (IE11+)

```javascript
// For modern browsers, auto-detect removal
bw._watchForRemoval = function(element, unmountFn) {
  if (typeof MutationObserver === 'undefined') return;
  
  const observer = new MutationObserver(function() {
    if (!document.contains(element)) {
      unmountFn();
      observer.disconnect();
    }
  });
  
  observer.observe(element.parentNode || document.body, {
    childList: true,
    subtree: true
  });
  
  return observer;
};
```

### Manual Cleanup for IE8-10

```javascript
// For legacy browsers, require manual cleanup
const handles = [];

// Track all handles
handles.push(bw.render('#container', myComponent));

// Clean up when done
function cleanup() {
  handles.forEach(h => h.destroy());
  handles.length = 0;
}
```

## Component State Management

### Local State Pattern

```javascript
function Counter(initialValue = 0) {
  // State is just a closure variable
  let count = initialValue;
  
  // Return a function that generates fresh TACO
  return function() {
    return {
      t: "div",
      a: { "class": "counter" },
      c: [
        { t: "span", c: `Count: ${count}` },
        { 
          t: "button",
          a: { 
            onclick: function() {
              count++;
              // Re-render just this component
              bw.update(this.parentElement, Counter(count)());
            }
          },
          c: "Increment"
        }
      ]
    };
  };
}

// Usage
const myCounter = Counter(0);
bw.render('#app', myCounter());
```

### Shared State Pattern

```javascript
// Simple state store
const store = {
  _state: {},
  _listeners: [],
  
  get(key) {
    return this._state[key];
  },
  
  set(key, value) {
    this._state[key] = value;
    this._listeners.forEach(fn => fn(key, value));
  },
  
  subscribe(fn) {
    this._listeners.push(fn);
    return () => {
      const idx = this._listeners.indexOf(fn);
      if (idx > -1) this._listeners.splice(idx, 1);
    };
  }
};
```

## The UUID System (New in v2)

### What is the UUID System?

Every element created by bitwrench automatically gets a unique class name injected. This enables:
- Precise element selection without IDs
- Component tracking across re-renders  
- Memory leak detection
- Debugging which TACO created which element

### How it Works

```javascript
// When you create a TACO:
const myCard = {
  t: "div",
  a: { "class": "bw-card" },
  c: "Hello"
};

// bitwrench automatically adds a UUID class:
// <div class="bw-card bw-uuid-a4f8e2c1">Hello</div>

// You can now select this specific element:
const element = document.querySelector('.bw-uuid-a4f8e2c1');
```

### Why Classes Instead of Data Attributes?

1. **Legacy browser support**: `class` works in IE6+, data attributes require IE11+
2. **querySelector compatibility**: `.bw-uuid-123` works everywhere
3. **CSS targeting**: Can style specific instances if needed
4. **No special escaping**: Class selectors are simple

### UUID Implementation

```javascript
// Generate UUID (works in all browsers)
bw._generateUUID = function() {
  // Use timestamp + counter for uniqueness
  return 'bw-uuid-' + Date.now().toString(36) + '-' + (++bw._uuidCounter);
};

bw._uuidCounter = 0;

// Inject UUID during element creation
bw._injectUUID = function(taco) {
  const uuid = bw._generateUUID();
  
  // Add to existing classes
  if (!taco.a) taco.a = {};
  if (!taco.a.class) {
    taco.a.class = uuid;
  } else {
    taco.a.class += ' ' + uuid;
  }
  
  return uuid;
};
```

### Using UUIDs for Component Tracking

```javascript
// Component registry maps UUIDs to component handles
bw._registry = {};

bw.render = function(selector, taco) {
  // Inject UUID
  const uuid = bw._injectUUID(taco);
  
  // Create element
  const element = bw._createDOMElement(taco);
  
  // Create handle
  const handle = {
    uuid: uuid,
    element: element,
    taco: taco,
    
    // Find element by UUID
    getElement: function() {
      return document.querySelector('.' + this.uuid);
    },
    
    // Check if still in DOM
    isInDOM: function() {
      return !!this.getElement();
    },
    
    // Update component
    update: function(newTaco) {
      const el = this.getElement();
      if (!el) {
        console.warn('Component no longer in DOM:', this.uuid);
        return;
      }
      
      // Update logic...
    }
  };
  
  // Store in registry
  bw._registry[uuid] = handle;
  
  return handle;
};
```

### Practical UUID Usage Examples

```javascript
// 1. Creating multiple instances of same component
const cards = [];
for (let i = 0; i < 5; i++) {
  const handle = bw.render('#container', Card({
    title: `Card ${i}`,
    content: 'Click to see UUID'
  }));
  cards.push(handle);
}

// Each card has unique UUID class:
// bw-uuid-ka5n2b-1, bw-uuid-ka5n2b-2, etc.

// 2. Finding specific component
const card3 = cards[2];
const element = document.querySelector('.' + card3.uuid);
element.style.border = '2px solid red';

// 3. Checking if component still exists
setTimeout(() => {
  cards.forEach((card, i) => {
    if (!card.isInDOM()) {
      console.log(`Card ${i} was removed from DOM`);
    }
  });
}, 5000);

// 4. Cleanup orphaned components
bw._cleanupOrphans = function() {
  Object.keys(bw._registry).forEach(uuid => {
    const handle = bw._registry[uuid];
    if (!handle.isInDOM()) {
      // Component was removed, clean up
      if (handle.taco.o && handle.taco.o.unmount) {
        handle.taco.o.unmount.call(handle, handle.element);
      }
      delete bw._registry[uuid];
    }
  });
};
```

### Debugging with UUIDs

```javascript
// 1. See all bitwrench elements on page
const allBWElements = document.querySelectorAll('[class*="bw-uuid-"]');
console.log('Bitwrench elements:', allBWElements.length);

// 2. Find which TACO created an element
function findTACOForElement(element) {
  const classes = element.className.split(' ');
  const uuid = classes.find(c => c.startsWith('bw-uuid-'));
  if (uuid && bw._registry[uuid]) {
    return bw._registry[uuid].taco;
  }
  return null;
}

// 3. Highlight all components of a certain type
function highlightComponentType(componentName) {
  Object.values(bw._registry).forEach(handle => {
    if (handle.taco._componentName === componentName) {
      const el = document.querySelector('.' + handle.uuid);
      if (el) el.style.outline = '2px solid red';
    }
  });
}

// 4. Track component lifecycle
bw._enableDebugMode = function() {
  const originalRender = bw.render;
  bw.render = function(selector, taco) {
    const handle = originalRender.call(this, selector, taco);
    console.log('Component rendered:', handle.uuid, taco);
    
    // Override destroy to log
    const originalDestroy = handle.destroy;
    handle.destroy = function() {
      console.log('Component destroyed:', handle.uuid);
      originalDestroy.call(this);
    };
    
    return handle;
  };
};
```

### UUID System Benefits in Practice

1. **No ID Conflicts**: Unlike manual IDs, UUIDs never collide
2. **Component Tracking**: Know exactly which components are live
3. **Memory Leak Detection**: Find components that should be cleaned up
4. **CSS Targeting**: Style specific instances without touching the TACO
5. **Legacy Browser Support**: Works all the way back to IE6
6. **DevTools Friendly**: Easy to inspect in browser developer tools

## CSS Namespace Safety

### All bitwrench CSS classes are prefixed

```javascript
// NEVER use generic classes
BAD:  { a: { "class": "card" } }
GOOD: { a: { "class": "bw-card" } }

// UUID classes are automatically added
const card = { 
  t: "div", 
  a: { "class": "bw-card" }  // Becomes: "bw-card bw-uuid-ka5n2b-1"
};

// CSS generation example
bw.generateCSS = function() {
  return `
    /* Component styles */
    .bw-card {
      border: 1px solid #ddd;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    
    .bw-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #ccc;
      background: white;
      cursor: pointer;
    }
    
    .bw-btn:hover {
      background: #f0f0f0;
    }
    
    /* UUID classes for debugging */
    [class*="bw-uuid-"] {
      /* Add debug styles if needed */
    }
  `;
};
```

### Safe inline styles using objects

```javascript
// Inline styles are namespace-safe
const card = {
  t: "div",
  a: {
    style: {
      border: "1px solid #ddd",
      padding: "1rem",
      marginBottom: "1rem"
    }
  }
};

// bitwrench converts style objects to strings
// { marginBottom: "1rem" } → "margin-bottom: 1rem"
```

## Example 1: Card Component

```javascript
// Card component with proper lifecycle
function Card(options = {}) {
  const {
    title = "",
    content = "",
    footer = null,
    theme = "default",
    onClose = null
  } = options;
  
  return {
    t: "div",
    a: { 
      class: `bw-card bw-card-${theme}`,
      style: {
        border: "1px solid #ddd",
        borderRadius: "4px",
        marginBottom: "1rem"
      }
    },
    c: [
      // Header with optional close button
      {
        t: "div",
        a: { 
          class: "bw-card-header",
          style: {
            padding: "0.75rem 1rem",
            borderBottom: "1px solid #ddd",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }
        },
        c: [
          { t: "h3", a: { style: { margin: 0 } }, c: title },
          onClose && {
            t: "button",
            a: {
              onclick: onClose,
              style: {
                border: "none",
                background: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                padding: "0",
                lineHeight: "1"
              }
            },
            c: "×"
          }
        ].filter(Boolean)
      },
      // Body
      {
        t: "div",
        a: { 
          class: "bw-card-body",
          style: { padding: "1rem" }
        },
        c: content
      },
      // Optional footer
      footer && {
        t: "div",
        a: { 
          class: "bw-card-footer",
          style: {
            padding: "0.75rem 1rem",
            borderTop: "1px solid #ddd",
            background: "#f8f9fa"
          }
        },
        c: footer
      }
    ].filter(Boolean)
  };
}

// Usage examples
// 1. Static rendering
const staticCard = Card({
  title: "Static Card",
  content: "I'm just HTML",
  theme: "primary"
});
document.getElementById('static').innerHTML = bw.html(staticCard);

// 2. Interactive rendering
const interactiveCard = Card({
  title: "Interactive Card",
  content: "Click X to close",
  onClose: function() {
    this.closest('.bw-card').remove();
  }
});
const handle = bw.render('#interactive', interactiveCard);

// 3. Multiple themed cards
['default', 'primary', 'success', 'danger'].forEach((theme, i) => {
  const card = Card({
    title: `${theme} Card`,
    content: `This is a ${theme} themed card`,
    theme: theme
  });
  bw.render(`#card-${i}`, card);
});
```

## Example 2: Self-Updating Clock Component

```javascript
function Clock(options = {}) {
  const {
    format = "locale", // "locale", "24h", "12h"
    updateInterval = 1000
  } = options;
  
  function formatTime(date) {
    switch(format) {
      case "24h":
        return date.toTimeString().slice(0, 8);
      case "12h":
        const hours = date.getHours();
        const mins = date.getMinutes().toString().padStart(2, '0');
        const secs = date.getSeconds().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h = hours % 12 || 12;
        return `${h}:${mins}:${secs} ${ampm}`;
      default:
        return date.toLocaleTimeString();
    }
  }
  
  return {
    t: "div",
    a: { 
      class: "bw-clock",
      style: {
        fontFamily: "monospace",
        fontSize: "2rem",
        textAlign: "center",
        padding: "1rem",
        border: "2px solid #333",
        borderRadius: "8px",
        background: "#f0f0f0"
      }
    },
    c: formatTime(new Date()),
    o: {
      state: { 
        timer: null,
        observer: null
      },
      mount: function(element) {
        const state = this.state;
        
        // Update time
        state.timer = setInterval(() => {
          // Check if still in DOM
          if (!document.contains(element)) {
            this.unmount(element);
            return;
          }
          element.textContent = formatTime(new Date());
        }, updateInterval);
        
        // Watch for removal (if MutationObserver available)
        if (typeof MutationObserver !== 'undefined') {
          state.observer = new MutationObserver(() => {
            if (!document.contains(element)) {
              this.unmount(element);
            }
          });
          state.observer.observe(document.body, {
            childList: true,
            subtree: true
          });
        }
      },
      unmount: function(element) {
        const state = this.state;
        
        if (state.timer) {
          clearInterval(state.timer);
          state.timer = null;
        }
        
        if (state.observer) {
          state.observer.disconnect();
          state.observer = null;
        }
        
        console.log('Clock cleaned up');
      }
    }
  };
}

// Usage
const clock1 = bw.render('#clock1', Clock());
const clock2 = bw.render('#clock2', Clock({ format: "24h" }));
const clock3 = bw.render('#clock3', Clock({ format: "12h", updateInterval: 100 }));

// Test cleanup
setTimeout(() => {
  document.getElementById('clock2').remove();
  // Should auto-cleanup and log "Clock cleaned up"
}, 5000);
```

## Example 3: Data Table Component

```javascript
function DataTable(options = {}) {
  const {
    columns = [],
    data = [],
    sortable = true,
    striped = true,
    bordered = true
  } = options;
  
  // Internal state
  let sortColumn = null;
  let sortDirection = 'asc';
  let currentData = [...data];
  
  function sortData(colIndex) {
    if (!sortable) return;
    
    if (sortColumn === colIndex) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = colIndex;
      sortDirection = 'asc';
    }
    
    currentData.sort((a, b) => {
      const aVal = a[columns[colIndex].key];
      const bVal = b[columns[colIndex].key];
      
      const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? result : -result;
    });
  }
  
  function generateTable() {
    const classes = ['bw-table'];
    if (striped) classes.push('bw-table-striped');
    if (bordered) classes.push('bw-table-bordered');
    
    return {
      t: "table",
      a: { 
        class: classes.join(' '),
        style: {
          width: "100%",
          borderCollapse: "collapse"
        }
      },
      c: [
        // Header
        {
          t: "thead",
          c: {
            t: "tr",
            c: columns.map((col, i) => ({
              t: "th",
              a: {
                style: {
                  padding: "0.75rem",
                  textAlign: "left",
                  borderBottom: "2px solid #dee2e6",
                  cursor: sortable ? "pointer" : "default",
                  userSelect: "none"
                },
                onclick: sortable ? function() {
                  sortData(i);
                  // Re-render table
                  const newTable = generateTable();
                  const parent = this.closest('table').parentNode;
                  parent.innerHTML = bw.html(newTable);
                } : null
              },
              c: [
                col.label,
                sortable && sortColumn === i && {
                  t: "span",
                  a: { style: { marginLeft: "0.5rem" } },
                  c: sortDirection === 'asc' ? '▲' : '▼'
                }
              ].filter(Boolean)
            }))
          }
        },
        // Body
        {
          t: "tbody",
          c: currentData.map((row, rowIndex) => ({
            t: "tr",
            a: striped && rowIndex % 2 ? {
              style: { background: "#f8f9fa" }
            } : {},
            c: columns.map(col => ({
              t: "td",
              a: {
                style: {
                  padding: "0.75rem",
                  borderTop: "1px solid #dee2e6"
                }
              },
              c: col.render ? col.render(row[col.key], row) : row[col.key]
            }))
          }))
        }
      ]
    };
  }
  
  return generateTable();
}

// Usage
const tableData = [
  { id: 1, name: "John Doe", age: 30, status: "active" },
  { id: 2, name: "Jane Smith", age: 25, status: "inactive" },
  { id: 3, name: "Bob Johnson", age: 35, status: "active" }
];

const table = DataTable({
  columns: [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "age", label: "Age" },
    { 
      key: "status", 
      label: "Status",
      render: (value) => ({
        t: "span",
        a: {
          style: {
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            background: value === "active" ? "#28a745" : "#6c757d",
            color: "white",
            fontSize: "0.875rem"
          }
        },
        c: value
      })
    }
  ],
  data: tableData,
  sortable: true,
  striped: true
});

// Render it
document.getElementById('table-container').innerHTML = bw.html(table);
```

## Page Composition: Building Complete Pages

### The Composition Pattern

Bitwrench pages are just TACO objects composed of smaller TACO objects. Components are functions that return TACOs, making composition natural:

```javascript
// Page structure as TACO
const HomePage = (data) => ({
  t: "body",
  a: { "class": "bw-page" },
  c: [
    NavBar({ 
      brand: "My App",
      links: data.navLinks 
    }),
    Hero({
      title: data.heroTitle,
      subtitle: data.heroSubtitle
    }),
    {
      t: "main",
      a: { "class": "bw-container" },
      c: [
        SectionTitle("Features"),
        CardGrid(data.features.map(f => 
          FeatureCard(f)
        )),
        SectionTitle("Pricing"),
        PricingTable(data.pricing),
        SectionTitle("Testimonials"),
        TestimonialCarousel(data.testimonials)
      ]
    },
    Footer({
      copyright: "© 2025 My App",
      links: data.footerLinks
    })
  ]
});

// Render the entire page
bw.render(document.body, HomePage(pageData));
```

### Component Building Blocks

```javascript
// Navigation component
const NavBar = (props) => ({
  t: "nav",
  a: { "class": "bw-navbar" },
  c: {
    t: "div",
    a: { "class": "bw-container" },
    c: [
      { t: "a", a: { href: "/", class: "bw-brand" }, c: props.brand },
      {
        t: "ul",
        a: { "class": "bw-nav-links" },
        c: props.links.map(link => ({
          t: "li",
          c: { t: "a", a: { href: link.url }, c: link.text }
        }))
      }
    ]
  }
});

// Hero section
const Hero = (props) => ({
  t: "section",
  a: { "class": "bw-hero" },
  c: [
    { t: "h1", c: props.title },
    { t: "p", a: { "class": "bw-lead" }, c: props.subtitle },
    props.cta && Button({
      text: props.cta.text,
      onClick: props.cta.action,
      variant: "primary"
    })
  ].filter(Boolean)
});

// Card grid layout
const CardGrid = (cards) => ({
  t: "div",
  a: { "class": "bw-card-grid" },
  c: cards
});

// Reusable section title
const SectionTitle = (text) => ({
  t: "h2",
  a: { "class": "bw-section-title" },
  c: text
});

// Footer component
const Footer = (props) => ({
  t: "footer",
  a: { "class": "bw-footer" },
  c: {
    t: "div",
    a: { "class": "bw-container" },
    c: [
      { t: "p", c: props.copyright },
      {
        t: "nav",
        c: props.links.map(link => ({
          t: "a",
          a: { href: link.url, class: "bw-footer-link" },
          c: link.text
        }))
      }
    ]
  }
});
```

### Dynamic Page Assembly

```javascript
// Build page based on configuration
function assemblePage(config) {
  const components = [];
  
  // Always add navbar
  components.push(NavBar(config.nav));
  
  // Add sections based on config
  if (config.hero) {
    components.push(Hero(config.hero));
  }
  
  // Main content area
  const mainContent = [];
  
  if (config.features) {
    mainContent.push(
      SectionTitle("Features"),
      CardGrid(config.features.map(FeatureCard))
    );
  }
  
  if (config.data) {
    mainContent.push(
      SectionTitle("Data"),
      DataTable(config.data)
    );
  }
  
  if (config.gallery) {
    mainContent.push(
      SectionTitle("Gallery"),
      ImageGallery(config.gallery)
    );
  }
  
  // Wrap main content
  components.push({
    t: "main",
    a: { "class": "bw-main" },
    c: mainContent
  });
  
  // Always add footer
  components.push(Footer(config.footer));
  
  return {
    t: "div",
    a: { "class": "bw-page-wrapper" },
    c: components
  };
}

// Use it
const myPage = assemblePage({
  nav: { brand: "My Site", links: navLinks },
  hero: { title: "Welcome", subtitle: "Build with bitwrench" },
  features: featuresData,
  data: { columns: [...], rows: [...] },
  footer: { copyright: "© 2025", links: footerLinks }
});

bw.render('#app', myPage);
```

### Layout Components

```javascript
// Two-column layout
const TwoColumnLayout = ({ sidebar, content }) => ({
  t: "div",
  a: { "class": "bw-layout-2col" },
  c: [
    { t: "aside", a: { "class": "bw-sidebar" }, c: sidebar },
    { t: "main", a: { "class": "bw-content" }, c: content }
  ]
});

// Container with consistent spacing
const Container = (children) => ({
  t: "div",
  a: { "class": "bw-container" },
  c: children
});

// Responsive grid
const Grid = ({ cols = 3, gap = "1rem", children }) => ({
  t: "div",
  a: { 
    class: "bw-grid",
    style: {
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: gap
    }
  },
  c: children
});
```

### Complete Example: Dashboard Page

```javascript
// Dashboard page composition
const DashboardPage = (userData) => ({
  t: "div",
  a: { "class": "bw-dashboard" },
  c: [
    // Top navigation
    NavBar({
      brand: "Dashboard",
      links: [
        { text: "Overview", url: "#overview" },
        { text: "Analytics", url: "#analytics" },
        { text: "Settings", url: "#settings" }
      ]
    }),
    
    // Page layout
    TwoColumnLayout({
      // Sidebar
      sidebar: [
        UserProfile(userData.profile),
        QuickStats(userData.stats),
        RecentActivity(userData.activity)
      ],
      
      // Main content
      content: [
        // Stats cards row
        {
          t: "div",
          a: { "class": "bw-stats-row" },
          c: [
            StatCard({ label: "Users", value: userData.userCount }),
            StatCard({ label: "Revenue", value: userData.revenue }),
            StatCard({ label: "Growth", value: userData.growth })
          ]
        },
        
        // Charts section
        Section({
          title: "Analytics",
          content: [
            LineChart(userData.chartData),
            BarChart(userData.barData)
          ]
        }),
        
        // Data table
        Section({
          title: "Recent Orders",
          content: DataTable({
            columns: [
              { key: "id", label: "Order ID" },
              { key: "customer", label: "Customer" },
              { key: "amount", label: "Amount" },
              { key: "status", label: "Status" }
            ],
            data: userData.recentOrders
          })
        })
      ]
    }),
    
    // Footer
    Footer({
      copyright: "Dashboard © 2025"
    })
  ]
});

// Helper: Section wrapper
const Section = ({ title, content }) => ({
  t: "section",
  a: { "class": "bw-section" },
  c: [
    { t: "h2", a: { "class": "bw-section-title" }, c: title },
    ...Array.isArray(content) ? content : [content]
  ]
});
```

### Server-Side Page Generation

```javascript
// Generate complete HTML page on server
function generateHTMLPage(data) {
  const pageTACO = HomePage(data);
  const pageHTML = bw.html(pageTACO);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <style>${bw.generateCSS()}</style>
</head>
${pageHTML}
<script src="/bitwrench.js"></script>
<script>
    // Hydrate interactive components
    bw.hydrate('body', ${JSON.stringify(pageTACO)});
</script>
</html>`;
}
```

### Best Practices for Page Composition

1. **Components are just functions**: Keep them pure and simple
2. **Compose, don't inherit**: Build pages by combining components
3. **Data flows down**: Pass data from page to components
4. **Keep layout separate**: Use layout components for structure
5. **Filter falsy values**: Use `.filter(Boolean)` to remove conditionals

## Standard Component Library

### Problem: Inconsistent Component Usage

In the v2 examples, components were built from scratch repeatedly instead of using a standard library. This led to:
- Inconsistent styling and behavior
- Duplicated code
- Different APIs for similar components
- No shared defaults

### Solution: Core Component Set

Every bitwrench project should include these standard components:

```javascript
// Button with consistent API
bw.Button = function(props) {
  const {
    text = "",
    onClick = null,
    type = "button",
    variant = "default", // default, primary, success, danger, warning
    size = "md",         // sm, md, lg
    disabled = false,
    block = false
  } = props;
  
  const classes = [
    "bw-btn",
    `bw-btn-${variant}`,
    `bw-btn-${size}`,
    block && "bw-btn-block",
    disabled && "bw-btn-disabled"
  ].filter(Boolean).join(" ");
  
  return {
    t: "button",
    a: {
      type: type,
      class: classes,
      onclick: onClick,
      disabled: disabled
    },
    c: text
  };
};

// Card with consistent structure
bw.Card = function(props) {
  const {
    title = null,
    subtitle = null,
    content = null,
    footer = null,
    shadow = false,
    padding = true
  } = props;
  
  return {
    t: "div",
    a: { 
      class: `bw-card ${shadow ? 'bw-shadow' : ''}` 
    },
    c: [
      (title || subtitle) && {
        t: "div",
        a: { "class": "bw-card-header" },
        c: [
          title && { t: "h3", a: { "class": "bw-card-title" }, c: title },
          subtitle && { t: "p", a: { "class": "bw-card-subtitle" }, c: subtitle }
        ].filter(Boolean)
      },
      {
        t: "div",
        a: { 
          class: `bw-card-body ${!padding ? 'bw-no-padding' : ''}` 
        },
        c: content
      },
      footer && {
        t: "div",
        a: { "class": "bw-card-footer" },
        c: footer
      }
    ].filter(Boolean)
  };
};

// Alert with consistent styling
bw.Alert = function(props) {
  const {
    message = "",
    variant = "info", // info, success, warning, danger
    dismissible = false,
    onDismiss = null
  } = props;
  
  return {
    t: "div",
    a: { 
      class: `bw-alert bw-alert-${variant}`,
      role: "alert"
    },
    c: [
      message,
      dismissible && {
        t: "button",
        a: {
          class: "bw-alert-close",
          onclick: onDismiss || function() {
            this.parentElement.remove();
          }
        },
        c: "×"
      }
    ].filter(Boolean)
  };
};

// Form controls
bw.FormGroup = function(props) {
  const {
    label = "",
    type = "text",
    name = "",
    value = "",
    placeholder = "",
    required = false,
    help = null,
    error = null
  } = props;
  
  const inputId = `bw-input-${name}`;
  
  return {
    t: "div",
    a: { "class": "bw-form-group" },
    c: [
      label && {
        t: "label",
        a: { 
          for: inputId,
          class: "bw-form-label"
        },
        c: [
          label,
          required && { t: "span", a: { "class": "bw-required" }, c: "*" }
        ]
      },
      {
        t: "input",
        a: {
          type: type,
          id: inputId,
          name: name,
          class: `bw-form-control ${error ? 'bw-invalid' : ''}`,
          value: value,
          placeholder: placeholder,
          required: required
        }
      },
      help && !error && {
        t: "small",
        a: { "class": "bw-form-help" },
        c: help
      },
      error && {
        t: "small",
        a: { "class": "bw-form-error" },
        c: error
      }
    ].filter(Boolean)
  };
};

// Table with consistent features
bw.Table = function(props) {
  const {
    columns = [],
    data = [],
    striped = true,
    bordered = true,
    hover = true,
    responsive = true,
    sortable = false,
    onSort = null
  } = props;
  
  const table = {
    t: "table",
    a: {
      class: [
        "bw-table",
        striped && "bw-table-striped",
        bordered && "bw-table-bordered",
        hover && "bw-table-hover"
      ].filter(Boolean).join(" ")
    },
    c: [
      {
        t: "thead",
        c: {
          t: "tr",
          c: columns.map((col, i) => ({
            t: "th",
            a: {
              class: sortable ? "bw-sortable" : "",
              onclick: sortable && onSort ? () => onSort(i) : null
            },
            c: col.label
          }))
        }
      },
      {
        t: "tbody",
        c: data.map(row => ({
          t: "tr",
          c: columns.map(col => ({
            t: "td",
            c: col.render ? col.render(row[col.key], row) : row[col.key]
          }))
        }))
      }
    ]
  };
  
  return responsive ? {
    t: "div",
    a: { "class": "bw-table-responsive" },
    c: table
  } : table;
};
```

### How Examples Should Have Been Built

```javascript
// WRONG: Building from scratch in each example
const App = () => ({
  t: "div",
  c: [
    // Manually building a card
    {
      t: "div",
      a: { "class": "card" },  // Wrong: not using bw- prefix
      c: {
        t: "div",
        a: { "class": "card-body" },
        c: "Content"
      }
    }
  ]
});

// RIGHT: Using standard components
const App = () => ({
  t: "div",
  c: [
    bw.Card({
      title: "My Card",
      content: "Content",
      shadow: true
    })
  ]
});

// WRONG: Inconsistent button creation
{ t: "button", a: { onclick: fn }, c: "Click" }
{ t: "button", a: { "class": "btn btn-primary" }, c: "Submit" }
{ t: "a", a: { href: "#", class: "button" }, c: "Link" }

// RIGHT: Always use Button component
bw.Button({ text: "Click", onClick: fn })
bw.Button({ text: "Submit", variant: "primary" })
bw.Button({ text: "Link", variant: "link" })

// WRONG: Different table implementations
const table1 = { t: "table", c: [...] };
const table2 = makeTable({ ... });
const table3 = DataTable({ ... });

// RIGHT: One Table component
bw.Table({
  columns: [...],
  data: [...],
  sortable: true
})
```

### Component Standards

1. **Naming**: All components prefixed with `bw.`
2. **Props**: Use destructuring with defaults
3. **Classes**: All CSS classes prefixed with `bw-`
4. **Events**: Pass functions, not strings
5. **Children**: Accept via `content` or `children` prop
6. **Returns**: Always return a TACO object

## Component Communication & Updates

### The Challenge

Once components are rendered, they need to:
1. Update themselves based on state changes
2. Communicate with other components
3. Respond to user interactions
4. Update without full page re-renders

### Pattern 1: Direct Handle References

The simplest approach - components get handles to other components they need to update.

```javascript
// Render components and keep handles
const counterHandle = bw.render('#counter', Counter({ value: 0 }));
const displayHandle = bw.render('#display', Display({ text: '0' }));

// Button directly updates both
const incrementButton = bw.render('#inc-btn', Button({
  text: 'Increment',
  onClick: function() {
    // Direct handle access
    counterHandle.state.value++;
    displayHandle.update(Display({ 
      text: counterHandle.state.value.toString() 
    }));
  }
}));
```

**Pros:**
- Simple and explicit
- No magic or hidden behavior
- Works in all browsers
- Easy to debug

**Cons:**
- Tight coupling between components
- Handle management becomes complex
- Doesn't scale well

### Pattern 2: Event Bus (Pub/Sub)

A central event system that components can publish to and subscribe from.

```javascript
// Simple event bus
bw.events = {
  _handlers: {},
  
  on: function(event, handler) {
    if (!this._handlers[event]) this._handlers[event] = [];
    this._handlers[event].push(handler);
    
    // Return unsubscribe function
    return function() {
      const idx = this._handlers[event].indexOf(handler);
      if (idx > -1) this._handlers[event].splice(idx, 1);
    }.bind(this);
  },
  
  emit: function(event, data) {
    if (!this._handlers[event]) return;
    this._handlers[event].forEach(h => h(data));
  }
};

// Components communicate via events
const Counter = (initial = 0) => {
  let value = initial;
  
  // Subscribe to increment events
  const unsubscribe = bw.events.on('increment', () => {
    value++;
    bw.events.emit('valueChanged', value);
  });
  
  return {
    t: "div",
    c: `Count: ${value}`,
    o: {
      unmount: function() {
        unsubscribe(); // Clean up subscription
      }
    }
  };
};

// Button emits events
const IncrementButton = () => ({
  t: "button",
  a: { 
    onclick: () => bw.events.emit('increment')
  },
  c: "+"
});

// Display listens for changes
const Display = () => {
  return {
    t: "div",
    a: { "class": "display" },
    c: "0",
    o: {
      mount: function(el) {
        this.unsubscribe = bw.events.on('valueChanged', (value) => {
          el.textContent = value;
        });
      },
      unmount: function() {
        if (this.unsubscribe) this.unsubscribe();
      }
    }
  };
};
```

**Pros:**
- Loose coupling
- Scales well
- Components don't need to know about each other
- Easy to add new listeners

**Cons:**
- Harder to trace data flow
- Memory leaks if not unsubscribed
- Global namespace pollution

### Pattern 3: Parent-Child Props Flow

Parent components manage state and pass update functions to children.

```javascript
// Parent manages all state
const TodoApp = () => {
  const state = {
    todos: [],
    filter: 'all'
  };
  
  const addTodo = (text) => {
    state.todos.push({ id: Date.now(), text, done: false });
    refresh();
  };
  
  const toggleTodo = (id) => {
    const todo = state.todos.find(t => t.id === id);
    if (todo) todo.done = !todo.done;
    refresh();
  };
  
  const setFilter = (filter) => {
    state.filter = filter;
    refresh();
  };
  
  const refresh = () => {
    bw.update('#app', TodoApp());
  };
  
  return {
    t: "div",
    c: [
      TodoInput({ onAdd: addTodo }),
      TodoList({ 
        todos: state.todos,
        filter: state.filter,
        onToggle: toggleTodo
      }),
      FilterBar({ 
        current: state.filter,
        onChange: setFilter
      })
    ]
  };
};
```

**Pros:**
- Clear data flow (top-down)
- No global state
- Easy to reason about
- Natural React-like pattern

**Cons:**
- Prop drilling for deep components
- Parent re-renders everything
- Not efficient for large apps

### Pattern 4: Shared State Store

A central store that components can read from and update.

```javascript
// Simple store
bw.createStore = function(initialState = {}) {
  let state = initialState;
  const listeners = [];
  
  return {
    getState: () => state,
    
    setState: (updates) => {
      state = Object.assign({}, state, updates);
      listeners.forEach(fn => fn(state));
    },
    
    subscribe: (fn) => {
      listeners.push(fn);
      return () => {
        const idx = listeners.indexOf(fn);
        if (idx > -1) listeners.splice(idx, 1);
      };
    }
  };
};

// Create app store
const store = bw.createStore({
  count: 0,
  user: null,
  theme: 'light'
});

// Components connect to store
const Counter = () => ({
  t: "div",
  c: `Count: ${store.getState().count}`,
  o: {
    mount: function(el) {
      // Re-render on store changes
      this.unsubscribe = store.subscribe((state) => {
        el.textContent = `Count: ${state.count}`;
      });
    },
    unmount: function() {
      if (this.unsubscribe) this.unsubscribe();
    }
  }
});

// Update store from anywhere
const IncrementButton = () => ({
  t: "button",
  a: {
    onclick: () => {
      const state = store.getState();
      store.setState({ count: state.count + 1 });
    }
  },
  c: "+"
});
```

**Pros:**
- Single source of truth
- Predictable state updates
- Time-travel debugging possible
- Works well with large apps

**Cons:**
- More boilerplate
- Learning curve
- Overkill for simple apps

### Pattern 5: Component Registry with Selectors

Use the UUID system to find and update specific components.

```javascript
// Update any component by selector
bw.updateComponent = function(selector, updates) {
  const elements = document.querySelectorAll(selector);
  
  elements.forEach(el => {
    // Find component by UUID class
    const uuid = Array.from(el.classList)
      .find(c => c.startsWith('bw-uuid-'));
    
    if (uuid && bw._registry[uuid]) {
      const handle = bw._registry[uuid];
      
      // Merge updates into component state
      Object.assign(handle.state, updates);
      
      // Re-render
      handle.update(handle.taco);
    }
  });
};

// Usage
bw.updateComponent('.counter', { value: 10 });
bw.updateComponent('#user-profile', { name: 'John' });
```

### Recommended Approach: Hybrid Pattern

For bitwrench, I recommend a hybrid approach that combines the best patterns:

```javascript
// 1. Direct handles for simple parent-child
const form = bw.render('#form', Form({
  onSubmit: (data) => {
    // Direct update of related component
    results.update(Results({ data }));
  }
}));
const results = bw.render('#results', Results());

// 2. Event bus for cross-component communication
bw.events.on('user:login', (user) => {
  // Multiple components can react
  bw.updateComponent('.user-widget', { user });
  bw.updateComponent('#nav', { loggedIn: true });
});

// 3. Local state for component internals
const TabPanel = (tabs) => {
  let activeTab = 0;
  
  return function() {
    return {
      t: "div",
      c: [
        // Tab buttons
        {
          t: "div",
          a: { "class": "tab-buttons" },
          c: tabs.map((tab, i) => ({
            t: "button",
            a: {
              class: i === activeTab ? "active" : "",
              onclick: function() {
                activeTab = i;
                // Re-render just this component
                bw.update(this.closest('.bw-tabs'), TabPanel(tabs)());
              }
            },
            c: tab.label
          }))
        },
        // Tab content
        tabs[activeTab].content
      ]
    };
  };
};

// 4. Store for app-wide state
const appStore = bw.createStore({
  user: null,
  theme: 'light',
  locale: 'en'
});
```

### Guidelines for Choosing Patterns

1. **Use Direct Handles when:**
   - Components have clear parent-child relationship
   - Updates are simple and localized
   - You need maximum performance

2. **Use Event Bus when:**
   - Components are far apart in the tree
   - Multiple components need to react
   - Building plugin/extension systems

3. **Use Shared Store when:**
   - Many components share the same data
   - You need undo/redo functionality
   - State changes need to be tracked

4. **Use Component Registry when:**
   - Updating components by CSS selector
   - Building developer tools
   - Need to find components dynamically

### Memory Management

Regardless of pattern, always clean up:

```javascript
const Component = () => ({
  t: "div",
  o: {
    mount: function(el) {
      // Store all cleanup functions
      this.cleanup = [];
      
      // Event listener
      const handler = () => console.log('clicked');
      el.addEventListener('click', handler);
      this.cleanup.push(() => el.removeEventListener('click', handler));
      
      // Event bus subscription
      const unsub = bw.events.on('update', () => {});
      this.cleanup.push(unsub);
      
      // Store subscription
      const unsubStore = store.subscribe(() => {});
      this.cleanup.push(unsubStore);
    },
    
    unmount: function() {
      // Run all cleanup
      if (this.cleanup) {
        this.cleanup.forEach(fn => fn());
      }
    }
  }
});
```

## Implementation: Core Functions

### UUID Generation and Injection

```javascript
// UUID counter for uniqueness
bw._uuidCounter = 0;

// Generate a unique UUID
bw._generateUUID = function() {
  return 'bw-uuid-' + Date.now().toString(36) + '-' + (++bw._uuidCounter);
};

// Inject UUID into TACO's class attribute
bw._injectUUID = function(taco) {
  if (typeof taco === 'string' || !taco.t) return null;
  
  const uuid = bw._generateUUID();
  
  if (!taco.a) taco.a = {};
  
  // Add UUID to class attribute
  if (taco.a.class) {
    taco.a.class += ' ' + uuid;
  } else {
    taco.a.class = uuid;
  }
  
  // Also inject into children recursively
  if (taco.c) {
    const children = Array.isArray(taco.c) ? taco.c : [taco.c];
    children.forEach(child => {
      if (typeof child === 'object' && child.t) {
        bw._injectUUID(child);
      }
    });
  }
  
  return uuid;
};
```

### HTML String Generation with UUIDs

```javascript
bw.html = function(taco) {
  // Clone to avoid mutating original
  const clone = JSON.parse(JSON.stringify(taco));
  
  // Inject UUIDs
  bw._injectUUID(clone);
  
  // Generate HTML
  return bw._generateHTML(clone);
};

bw._generateHTML = function(taco) {
  if (typeof taco === 'string') return bw._escapeHTML(taco);
  if (!taco || !taco.t) return '';
  
  let html = '<' + taco.t;
  
  // Add attributes
  if (taco.a) {
    for (let key in taco.a) {
      if (key === 'style' && typeof taco.a.style === 'object') {
        const styles = [];
        for (let prop in taco.a.style) {
          const cssProp = prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
          styles.push(cssProp + ': ' + taco.a.style[prop]);
        }
        html += ' style="' + styles.join('; ') + '"';
      } else if (key.startsWith('on') && typeof taco.a[key] === 'function') {
        // Skip event handlers in HTML generation
        continue;
      } else {
        html += ' ' + key + '="' + bw._escapeHTML(taco.a[key]) + '"';
      }
    }
  }
  
  html += '>';
  
  // Add children
  if (taco.c) {
    const children = Array.isArray(taco.c) ? taco.c : [taco.c];
    children.forEach(child => {
      html += bw._generateHTML(child);
    });
  }
  
  html += '</' + taco.t + '>';
  
  return html;
};

bw._escapeHTML = function(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
};
```

### Managed Component Rendering

```javascript
// Component registry for lifecycle management
bw._registry = {};

bw.render = function(selector, taco) {
  // Get container element
  const container = typeof selector === 'string' ? 
    document.querySelector(selector) : selector;
    
  if (!container) {
    throw new Error('Container not found: ' + selector);
  }
  
  // Clone to avoid mutating original
  const clone = JSON.parse(JSON.stringify(taco));
  
  // Inject UUID and get the root UUID
  const uuid = bw._injectUUID(clone);
  
  // Create DOM element
  const element = bw._createDOMElement(clone);
  
  // Clear container and append
  container.innerHTML = '';
  container.appendChild(element);
  
  // Create component handle
  const handle = {
    uuid: uuid,
    element: element,
    taco: clone,
    state: (clone.o && clone.o.state) || {},
    
    update: function(newTaco) {
      // Update the component
      const newElement = bw._createDOMElement(newTaco);
      newElement.className = (newElement.className || '') + ' ' + componentId;
      
      // Call unmount on old
      if (this.taco.o && this.taco.o.unmount) {
        this.taco.o.unmount.call(this, this.element);
      }
      
      // Replace element
      this.element.parentNode.replaceChild(newElement, this.element);
      this.element = newElement;
      this.taco = newTaco;
      
      // Call mount on new
      if (newTaco.o && newTaco.o.mount) {
        newTaco.o.mount.call(this, newElement);
      }
    },
    
    destroy: function() {
      // Call unmount
      if (this.taco.o && this.taco.o.unmount) {
        this.taco.o.unmount.call(this, this.element);
      }
      
      // Remove from DOM
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Remove from registry
      bw._components.delete(componentId);
    }
  };
  
  // Store in registry
  bw._components.set(componentId, handle);
  
  // Call mount hook
  if (taco.o && taco.o.mount) {
    taco.o.mount.call(handle, element);
  }
  
  return handle;
};

// Helper to create DOM elements
bw._createDOMElement = function(taco) {
  if (typeof taco === 'string') {
    return document.createTextNode(taco);
  }
  
  const el = document.createElement(taco.t);
  
  // Set attributes
  if (taco.a) {
    for (let key in taco.a) {
      if (key === 'style' && typeof taco.a.style === 'object') {
        // Handle style object
        const styles = [];
        for (let prop in taco.a.style) {
          const cssProp = prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
          styles.push(cssProp + ': ' + taco.a.style[prop]);
        }
        el.setAttribute('style', styles.join('; '));
      } else if (key.startsWith('on') && typeof taco.a[key] === 'function') {
        // Event handler
        el[key] = taco.a[key];
      } else {
        el.setAttribute(key, taco.a[key]);
      }
    }
  }
  
  // Add children
  if (taco.c) {
    const children = Array.isArray(taco.c) ? taco.c : [taco.c];
    children.forEach(child => {
      if (child) {
        el.appendChild(bw._createDOMElement(child));
      }
    });
  }
  
  return el;
};
```

## Key Learnings from v1

### What v1 Got Right

1. **bw.typeof()** - Proper type checking that handles edge cases
2. **Always return arrays** - Consistent API for DOM selection
3. **Color utilities** - Genuinely useful, no native equivalent
4. **Simple table generation** - Clean API for common use case

### What We Must Keep

```javascript
// Proper type checking from v1
bw.typeof = function(obj) {
  if (obj === null) return "null";
  if (obj === undefined) return "undefined";
  const type = Object.prototype.toString.call(obj);
  return type.slice(8, -1).toLowerCase();
};

// Array-always DOM selection
bw.$ = function(selector) {
  if (!selector) return [];
  if (typeof selector === 'string') {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }
  if (selector.nodeType) return [selector];
  if (selector.length !== undefined) return Array.prototype.slice.call(selector);
  return [];
};
```

## Browser Compatibility & Build Strategy

### Modern Development, Legacy Deployment

We write modern JavaScript and use build tools to ensure IE8+ compatibility:

```javascript
// We write modern code:
const Button = ({ text, onClick, variant = 'primary' }) => ({
  t: "button",
  a: { 
    "class": `bw-btn bw-btn-${variant}`,
    onclick: onClick
  },
  c: text
});

// Rollup + Babel compiles to ES5:
var Button = function(props) {
  var text = props.text;
  var onClick = props.onClick;
  var variant = props.variant || 'primary';
  
  return {
    t: "button",
    a: {
      "class": "bw-btn bw-btn-" + variant,
      onclick: onClick
    },
    c: text
  };
};
```

### Build Configuration

```javascript
// rollup.config.js
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/bitwrench.js',
  output: [
    {
      file: 'dist/bitwrench.js',
      format: 'umd',
      name: 'bw'
    },
    {
      file: 'dist/bitwrench.min.js',
      format: 'umd',
      name: 'bw',
      plugins: [terser()]
    }
  ],
  plugins: [
    babel({
      babelHelpers: 'bundled',
      presets: [
        ['@babel/preset-env', {
          targets: {
            ie: '8'
          }
        }]
      ]
    })
  ]
};
```

### What Gets Transpiled

| Modern Feature | Compiles To |
|----------------|-------------|
| Template literals | String concatenation |
| Arrow functions | Function expressions |
| Destructuring | Individual assignments |
| Default parameters | OR checks |
| Spread operator | Array/Object methods |
| const/let | var |
| for...of | for loops |
| Object.assign | Polyfill |
| Array methods | Polyfills where needed |

### Minimal Polyfills

For IE8 support, we include only essential polyfills:

```javascript
// Array.prototype.forEach (IE8)
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(fn, scope) {
    for (var i = 0, len = this.length; i < len; ++i) {
      fn.call(scope || this, this[i], i, this);
    }
  };
}

// Array.prototype.map (IE8)
if (!Array.prototype.map) {
  Array.prototype.map = function(fn, scope) {
    var result = [];
    for (var i = 0, len = this.length; i < len; ++i) {
      result.push(fn.call(scope || this, this[i], i, this));
    }
    return result;
  };
}

// Array.prototype.indexOf (IE8)
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(searchElement, fromIndex) {
    var k;
    if (this == null) throw new TypeError();
    var o = Object(this);
    var len = parseInt(o.length) || 0;
    if (len === 0) return -1;
    var n = parseInt(fromIndex) || 0;
    if (n >= len) return -1;
    k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
    for (; k < len; k++) {
      if (k in o && o[k] === searchElement) return k;
    }
    return -1;
  };
}
```

### Development Guidelines

1. **Write modern, clean JavaScript** - Use ES6+ features freely
2. **Quote object keys when needed** - `{ "class": "foo" }` to avoid reserved words
3. **Let tools handle compatibility** - Don't write ES5 manually
4. **Test in target browsers** - Verify the compiled output works
5. **Keep bundle size in mind** - Some transpilations add overhead

### Testing Strategy

```javascript
// Use modern test frameworks but compile tests for IE8
// karma.conf.js
module.exports = function(config) {
  config.set({
    browsers: ['IE8', 'IE11', 'Chrome', 'Firefox'],
    files: [
      'dist/bitwrench.js',
      'test/**/*.spec.js'
    ],
    preprocessors: {
      'test/**/*.spec.js': ['rollup']
    }
  });
};
```

## Summary: The Path Forward

1. **Simplify the 'o' object** - Only lifecycle hooks and state
2. **Clear rendering modes** - html() for static, render() for managed
3. **Automatic cleanup** - Components clean themselves up
4. **Namespace safety** - All classes prefixed with 'bw-'
5. **Legacy browser support** - Test everything in IE8
6. **Learn from v1** - Keep what worked, fix what didn't

The goal: A library that is genuinely simple, not just claiming to be simple.