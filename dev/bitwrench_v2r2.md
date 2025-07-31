# Bitwrench v2 R2: Final Architecture Design

## Overview

This document defines the final architecture for Bitwrench v2, consolidating all design decisions and establishing clear patterns for component creation, rendering, and management.

## Core Concepts

### 1. Three Rendering Modes

Bitwrench v2 supports three distinct rendering modes, each with specific use cases:

```javascript
// Mode 1: HTML String Generation (Legacy v1)
const html = bw.html({ t: 'div', c: 'Hello' });
// Returns: "<div>Hello</div>"

// Mode 2: TACO Object Creation (Pure Data)
const taco = bw.makeCard({ title: 'Hello' });
// Returns: { t: 'div', a: { class: 'bw-card' }, c: [...] }

// Mode 3: Live Component Creation (Interactive)
const handle = bw.createCard({ title: 'Hello' });
// Returns: ComponentHandle with methods
```

### 2. TACO Structure

The foundational data structure remains consistent:

```javascript
{
  t: "tag",           // HTML tag name
  a: {                // Attributes
    class: "classes", // Always includes bw_uuid_xxx when rendered
    style: "...",     // Can be string or object
    onclick: fn       // Event handlers (Mode 1 uses registry, Mode 3 direct)
  },
  c: content,         // String, TACO, Array, or Function
  o: {                // Options (Bitwrench-specific)
    type: "card",     // Component type for handle creation
    state: {},        // Component state
    ref: "myCard",    // Reference name for parent access
    mounted: fn,      // Lifecycle: called after DOM insertion
    unmount: fn       // Lifecycle: called before removal
  }
}
```

## Naming Conventions

### Component Functions

To avoid namespace collisions and clarify return types:

```javascript
// HTML Generators (return strings) - Legacy v1
bw.htmlTable(data, options)        // Returns HTML string
bw.htmlTabs(tabs, options)         // Returns HTML string
bw.htmlAccordion(items, options)   // Returns HTML string

// TACO Generators (return objects) - Pure data
bw.makeTable(data, options)        // Returns TACO object
bw.makeTabs(tabs, options)         // Returns TACO object  
bw.makeCard(props)                 // Returns TACO object
bw.makeButton(props)               // Returns TACO object

// Component Creators (return handles) - Interactive
bw.createTable(data, options)      // Returns TableHandle
bw.createCard(props)               // Returns CardHandle
bw.createButton(props)             // Returns ButtonHandle
```

### BCCL (Bitwrench Core Component Library)

All components are namespaced under `bw.components`:

```javascript
// Component definitions
bw.components = {
  // Pure functions returning TACOs
  card: (props) => ({ t: 'div', a: { class: 'bw-card' }, ... }),
  button: (props) => ({ t: 'button', a: { class: 'bw-btn' }, ... }),
  table: (data, options) => ({ t: 'table', a: { class: 'bw-table' }, ... }),
  
  // Component presets/themes
  themes: {
    light: { ... },
    dark: { ... }
  }
};

// Convenience methods
bw.makeCard = (props) => bw.components.card(props);
bw.createCard = (props) => bw.renderComponent(bw.components.card(props));
```

## Component Lifecycle

### Creation and Rendering

```javascript
// Step 1: Define component (pure function)
const Card = (props) => ({
  t: 'div',
  a: { class: 'bw-card' },
  c: [
    { t: 'h3', a: { class: 'bw-card-title' }, c: props.title },
    { t: 'div', a: { class: 'bw-card-body' }, c: props.content }
  ],
  o: {
    type: 'card',
    state: { collapsed: false },
    mounted: (el, handle) => {
      console.log('Card mounted:', handle.uuid);
    },
    unmount: (el, handle) => {
      console.log('Card unmounting');
    }
  }
});

// Step 2: Create TACO (reusable template)
const cardTaco = Card({ title: 'Hello', content: 'World' });

// Step 3: Render to DOM (creates handle)
const cardHandle = bw.renderComponent(cardTaco);
// Automatically adds bw_uuid_xxx class

// Step 4: Insert into DOM
bw.DOM('#app', cardHandle); // or cardHandle.element for direct DOM manipulation
```

### Component Handle API

All component handles extend from base ComponentHandle class:

```javascript
class ComponentHandle {
  // Properties
  element      // DOM element reference
  uuid         // Unique identifier (bw_uuid_xxx)
  type         // Component type (card, table, etc.)
  state        // Component state object
  parent       // Parent component handle (if any)
  children     // Child component handles
  
  // Common Methods
  getBwId()                    // Returns uuid
  select(selector)             // Query within component
  on(event, handler)           // Add event listener
  off(event, handler)          // Remove event listener
  emit(event, data)            // Emit custom event
  subscribe(event, handler)    // Subscribe to global events
  
  // State Management
  setState(updates)            // Update state and re-render
  getState(key)               // Get state value
  
  // DOM Manipulation
  show()                      // Show component
  hide()                      // Hide component
  addClass(className)         // Add CSS class
  removeClass(className)      // Remove CSS class
  toggleClass(className)      // Toggle CSS class
  css(prop, value)           // Get/set inline styles
  
  // Lifecycle
  update(props)              // Update component props
  refresh()                  // Re-render component
  destroy()                  // Remove and cleanup
  
  // Component-specific methods added by type
  
  // Enhanced DOM methods
  focus()                      // Focus element
  blur()                       // Blur element
  enable()                     // Enable element
  disable()                    // Disable element
  hasClass(className)          // Check if class exists
  getAttribute(name)           // Get attribute value
  setAttribute(name, value)    // Set attribute value
  
  // Style helpers
  css(prop, value)            // Get/set inline styles
  // css('color') returns current color
  // css('color', 'red') sets color
  // css({color: 'red', padding: 16}) sets multiple
}
```

### Component-Specific Handles

```javascript
class TableHandle extends ComponentHandle {
  // Table-specific methods
  addRow(rowData)
  updateRow(index, rowData)
  deleteRow(index)
  sortBy(column, direction)
  filter(filterFn)
  getSelectedRows()
  clearSelection()
  exportToCSV()
  setData(newData)
}

class CardHandle extends ComponentHandle {
  // Card-specific methods  
  setTitle(title)
  setContent(content)
  setFooter(footer)
  collapse()
  expand()
  toggle()
}
```

## Movement and Composition Rules

### Rule: Components Cannot Be Moved Once Rendered

```javascript
// Create and render component
const card = bw.createCard({ title: 'My Card' });
bw.DOM('#sidebar', card);

// Attempting to use in another component throws error
const page = bw.renderComponent({
  t: 'div',
  c: [
    card  // ERROR: Component already mounted
  ]
});

// Error message:
// "Component bw_uuid_abc123 is already mounted. Use .detach() to move or create a new instance."
```

### Explicit Move Operations

```javascript
// Option 1: Detach and re-attach
const card = bw.createCard({ title: 'My Card' });
bw.DOM('#sidebar', card);

// Later, move to different location
card.detach();  // Removes from DOM but preserves handle
bw.DOM('#main', card);  // Re-attach elsewhere

// Option 2: Move instruction in TACO
const page = bw.renderComponent({
  t: 'div',
  c: [
    { move: card }  // Explicit move instruction
  ]
});

// Option 3: Replace pattern
const newCard = bw.createCard({ title: 'My Card' });
card.replaceWith(newCard);  // Old card destroyed, new card takes its place
```

### Mixed Content Arrays

Arrays in `c:` property can contain:

```javascript
{
  c: [
    "Plain text",                    // String → Text node
    { t: 'div', c: 'TACO' },        // TACO → New component
    bw.htmlTable(data),             // HTML string → innerHTML
    () => ({ t: 'span', c: 'Lazy' }), // Function → Call and process result
    existingHandle,                  // Handle → ERROR (unless detached)
    { move: existingHandle },        // Move instruction → OK
    null,                           // Null/undefined → Ignored
    [nested, array, items]          // Array → Flattened
  ]
}
```

## CSS and Styling

### Style Application Methods

```javascript
// Method 1: Inline styles as object
{
  a: {
    style: {
      padding: 16,              // Numbers become pixels
      margin: '1rem',           // Strings passed through
      backgroundColor: '#fff'   // Camel case converted
    }
  }
}

// Method 2: Inline styles as string  
{
  a: {
    style: 'padding: 16px; margin: 1rem;'
  }
}

// Method 3: CSS classes
{
  a: {
    class: 'bw-card bw-shadow-lg bw-m-4'
  }
}

// Method 4: Generated styles
const theme = {
  spacing: { sm: 8, md: 16, lg: 24 },
  colors: { primary: '#007bff' }
};

{
  a: {
    style: bw.makeCSS({
      padding: theme.spacing.md,
      background: theme.colors.primary
    })
  }
}
```

### CSS Generation Functions

```javascript
// Convert style object to CSS string
bw.makeCSS({
  padding: 16,
  margin: [8, 16],  // Array → "8px 16px"
  color: 'red'
});
// Returns: "padding: 16px; margin: 8px 16px; color: red;"

// Generate CSS rules
bw.makeCSSRule('.my-class', {
  padding: 16,
  ':hover': {
    background: '#f0f0f0'
  }
});
// Returns: ".my-class { padding: 16px; }\n.my-class:hover { background: #f0f0f0; }"

// Generate utility classes
bw.generateUtilityCSS({
  spacing: [4, 8, 16, 24, 32],
  colors: { primary: '#007bff', secondary: '#6c757d' }
});
// Generates: .bw-p-1 { padding: 4px; } .bw-m-2 { margin: 8px; } etc.
```

### Bitwrench CSS Classes

All Bitwrench CSS classes are prefixed with `bw-` to avoid collisions:

```css
/* Layout */
.bw-container     /* Max-width container */
.bw-row          /* Flex row */
.bw-col-*        /* Grid columns */

/* Spacing */
.bw-p-*          /* Padding */
.bw-m-*          /* Margin */
.bw-px-*, .bw-py-* /* Directional spacing */

/* Components */
.bw-card         /* Card component */
.bw-btn          /* Button */
.bw-table        /* Table */

/* Utilities */
.bw-text-center  /* Text alignment */
.bw-d-flex       /* Display flex */
.bw-shadow-*     /* Box shadows */
```

## Component Examples

### Basic Card Component

```javascript
// Define card component
bw.components.card = (props) => ({
  t: 'div',
  a: { 
    class: `bw-card ${props.className || ''}`,
    style: props.style
  },
  c: [
    props.image && {
      t: 'img',
      a: { 
        class: 'bw-card-img',
        src: props.image.src,
        alt: props.image.alt || ''
      }
    },
    {
      t: 'div',
      a: { class: 'bw-card-body' },
      c: [
        props.title && {
          t: 'h5',
          a: { class: 'bw-card-title' },
          c: props.title
        },
        props.content && {
          t: 'div',
          a: { class: 'bw-card-content' },
          c: props.content
        }
      ].filter(Boolean)
    },
    props.footer && {
      t: 'div',
      a: { class: 'bw-card-footer' },
      c: props.footer
    }
  ].filter(Boolean),
  o: {
    type: 'card',
    state: props.state || {}
  }
});

// Usage
const myCard = bw.createCard({
  title: 'Product Name',
  content: 'Product description here',
  image: { src: '/product.jpg', alt: 'Product' },
  footer: bw.makeButton({ text: 'Add to Cart' })
});

// Card handle methods
myCard.setTitle('New Product Name');
myCard.setContent('Updated description');
```

### Data Table Component

```javascript
// Define table component
bw.components.table = (data, options = {}) => ({
  t: 'table',
  a: { class: 'bw-table' },
  c: [
    // Header
    {
      t: 'thead',
      c: {
        t: 'tr',
        c: (options.headers || Object.keys(data[0] || {})).map(header => ({
          t: 'th',
          a: { 
            class: options.sortable ? 'bw-sortable' : '',
            'data-column': header
          },
          c: header
        }))
      }
    },
    // Body
    {
      t: 'tbody',
      c: data.map((row, i) => ({
        t: 'tr',
        a: { 'data-row-index': i },
        c: Object.values(row).map(cell => ({
          t: 'td',
          c: cell
        }))
      }))
    }
  ],
  o: {
    type: 'table',
    state: {
      data: data,
      sortColumn: null,
      sortDirection: 'asc',
      selectedRows: []
    }
  }
});

// Usage
const users = [
  { name: 'John', email: 'john@example.com', role: 'Admin' },
  { name: 'Jane', email: 'jane@example.com', role: 'User' }
];

const userTable = bw.createTable(users, {
  sortable: true,
  headers: ['Name', 'Email', 'Role']
});

// Table handle methods
userTable.addRow({ name: 'Bob', email: 'bob@example.com', role: 'User' });
userTable.sortBy('name', 'desc');
userTable.filter(row => row.role === 'Admin');
```

## Full Page Example

```javascript
// Page component combining multiple elements
const DashboardPage = (data) => ({
  t: 'div',
  a: { class: 'bw-page' },
  c: [
    // Header
    {
      t: 'header',
      a: { class: 'bw-header' },
      c: [
        { t: 'h1', c: 'Dashboard' },
        bw.makeButton({ 
          text: 'Logout',
          variant: 'secondary',
          onClick: () => window.location.href = '/logout'
        })
      ]
    },
    
    // Main content
    {
      t: 'main',
      a: { class: 'bw-container' },
      c: [
        // Stats row
        {
          t: 'div',
          a: { class: 'bw-row bw-mb-4' },
          c: data.stats.map(stat => ({
            t: 'div',
            a: { class: 'bw-col-3' },
            c: bw.makeCard({
              title: stat.label,
              content: {
                t: 'h2',
                c: stat.value.toLocaleString()
              }
            })
          }))
        },
        
        // Table section
        {
          t: 'div',
          a: { class: 'bw-row' },
          c: [
            {
              t: 'div',
              a: { class: 'bw-col-12' },
              c: [
                { t: 'h2', c: 'Recent Orders' },
                bw.makeTable(data.orders, {
                  sortable: true,
                  headers: ['Order ID', 'Customer', 'Amount', 'Status']
                })
              ]
            }
          ]
        }
      ]
    }
  ],
  o: {
    type: 'dashboard',
    mounted: (el, handle) => {
      // Set up real-time updates
      const ws = new WebSocket('/ws/dashboard');
      ws.onmessage = (e) => {
        const update = JSON.parse(e.data);
        handle.updateStats(update.stats);
      };
      
      handle.cleanup = () => ws.close();
    },
    unmount: (el, handle) => {
      if (handle.cleanup) handle.cleanup();
    }
  }
});

// Render complete page
const dashboardData = {
  stats: [
    { label: 'Revenue', value: 125000 },
    { label: 'Orders', value: 342 },
    { label: 'Customers', value: 1205 },
    { label: 'Growth', value: 12.5 }
  ],
  orders: [
    { id: '001', customer: 'John Doe', amount: 250, status: 'Completed' },
    { id: '002', customer: 'Jane Smith', amount: 175, status: 'Pending' }
  ]
};

const dashboard = bw.renderComponent(DashboardPage(dashboardData));
bw.DOM(document.body, dashboard);
```

## Automatic Cleanup

Bitwrench v2 includes automatic cleanup strategies to prevent memory leaks:

```javascript
// Configuration (can be customized)
bw.config.cleanup = {
  checkBeforeOp: true,       // Validate element connection before operations
  useMutationObserver: true, // Watch DOM for removed elements
  useGarbageCollector: true, // Periodic cleanup of orphaned components
  gcInterval: 10000          // GC runs every 10 seconds
};

// Manual cleanup
bw.cleanup(element);  // Clean up specific element and children
bw.cleanupAll();     // Clean up all orphaned components
```

### Cleanup Strategy Details

1. **Check Before Operations**: Each handle method validates the element is still connected
2. **MutationObserver**: Watches for removed nodes and cleans up their handles
3. **Periodic GC**: Scans all components and removes orphaned references

## Error Handling and Logging

### Event Logging System

Non-throwing error system that logs issues without breaking execution:

```javascript
// Log an error
bw.eventLog.error('component', 'Card mount failed', { id: card.uuid });

// Log a warning  
bw.eventLog.warn('performance', 'Render took > 100ms', { time: 125 });

// Query logs
const errors = bw.eventLog.query({ level: 'error', category: 'component' });

// Subscribe to events
bw.eventLog.subscribe((event) => {
  if (event.level === 'error') {
    console.error(`[${event.category}] ${event.message}`, event.details);
  }
});

// Get statistics
const stats = bw.eventLog.stats();
// { errors: 3, warnings: 12, info: 45 }
```

### Safe Method Pattern

Component methods use safe wrappers:

```javascript
class ComponentHandle {
  addClass(className) {
    return this._safe('addClass', () => {
      this.element.classList.add(className);
      return this;
    });
  }
  
  _safe(methodName, operation) {
    try {
      if (!this.element.isConnected) {
        bw.eventLog.warn('component', `${methodName} called on disconnected element`, {
          uuid: this.uuid
        });
        return this;
      }
      return operation.call(this);
    } catch (error) {
      bw.eventLog.error('component', `${methodName} failed`, {
        uuid: this.uuid,
        error: error.message
      });
      return this; // Allow chaining to continue
    }
  }
}
```

## Debug Tools

Development tools for inspecting and debugging components:

```javascript
// List all active components
bw.debug.listComponents();
// [{uuid: 'bw_uuid_abc123', type: 'card', connected: true}, ...]

// Find component by element
const handle = bw.debug.findByElement(document.querySelector('.my-card'));

// Check for memory leaks
const leaks = bw.debug.checkLeaks();
// [{uuid: 'bw_uuid_xyz789', type: 'table', reason: 'element removed but handle exists'}]

// Enable lifecycle tracing
bw.debug.traceLifecycle = true;
// Now all mount/unmount operations are logged

// Component tree visualization
bw.debug.showTree(rootHandle);
// Logs hierarchical component structure

// Performance metrics
bw.debug.metrics();
// {renders: 145, avgRenderTime: 12.5, slowestRender: 89}
```

## TACO Utilities

Helper functions for TACO manipulation:

```javascript
// Create TACO with builder pattern
const card = bw.taco.create('div')
  .addClass('bw-card')
  .addChild({ t: 'h3', c: 'Title' })
  .addChild({ t: 'p', c: 'Content' })
  .build();

// Manipulate existing TACOs
bw.taco.addClass(myTaco, 'highlight');
bw.taco.setAttribute(myTaco, 'data-id', '123');

// Find nested elements
const buttons = bw.taco.find(pageTaco, (node) => node.t === 'button');

// Transform TACOs
const darkTheme = bw.taco.map(lightTaco, (node) => {
  if (node.a?.class?.includes('bw-bg-light')) {
    return { ...node, a: { ...node.a, class: node.a.class.replace('bw-bg-light', 'bw-bg-dark') }};
  }
  return node;
});

// Insert/remove children
bw.taco.insertChild(parent, 0, newChild);  // Insert at position
bw.taco.appendChild(parent, child);        // Append
bw.taco.removeChild(parent, child);        // Remove
```

## Performance Budgets

Target performance metrics for v2:

```javascript
// Rendering performance
- Render 1000 simple elements: < 100ms
- Render 100 complex components: < 50ms  
- Initial library load: < 10ms

// Bundle sizes
- UMD build: < 50KB minified
- ESM build: < 45KB minified
- Core CSS: < 20KB minified
- Gzipped total: < 25KB

// Memory usage
- Component handle overhead: < 1KB per component
- Event listener cleanup: 100% on destroy
- No memory leaks after 1000 create/destroy cycles

// Browser support
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions  
- Safari: Latest 2 versions
- IE: 11+ (with polyfills)
- IE: 8+ (core features only, no MutationObserver)
```

## Import/Export Patterns

### ESM Module Pattern

```javascript
// components/cards.js
export const ProductCard = (product) => ({
  t: 'div',
  a: { class: 'bw-product-card' },
  c: [
    { t: 'img', a: { src: product.image } },
    { t: 'h3', c: product.name },
    { t: 'p', c: product.price }
  ]
});

// pages/shop.js
import { ProductCard } from './components/cards.js';

export const ShopPage = (products) => ({
  t: 'div',
  a: { class: 'bw-shop' },
  c: products.map(ProductCard)
});

// main.js
import { ShopPage } from './pages/shop.js';
const shop = bw.renderComponent(ShopPage(productData));
```

### JSON Configuration Pattern

```javascript
// Server can send page configuration
fetch('/api/page/dashboard')
  .then(res => res.json())
  .then(pageConfig => {
    // pageConfig is a TACO object from server
    const page = bw.renderComponent(pageConfig);
    bw.DOM('#app', page);
  });

// Server response example
{
  "t": "div",
  "a": { "class": "bw-dashboard" },
  "c": [
    {
      "t": "h1",
      "c": "Dashboard"
    },
    {
      "t": "div",
      "a": { "data-component": "chart", "data-source": "/api/chart/sales" }
    }
  ]
}
```

## Browser Compatibility

### IE8+ Core Support

Core functionality works in IE8+ with these polyfills:

```javascript
// isConnected polyfill
if (!('isConnected' in Node.prototype)) {
  Object.defineProperty(Node.prototype, 'isConnected', {
    get: function() { return document.contains(this); }
  });
}

// classList polyfill for IE9
if (!('classList' in Element.prototype)) {
  // Polyfill implementation
}

// Array methods for IE8
if (!Array.prototype.filter) {
  Array.prototype.filter = function(fn) { /* ... */ };
}
```

### Feature Detection

```javascript
bw.support = {
  mutationObserver: 'MutationObserver' in window,
  classList: 'classList' in Element.prototype,
  isConnected: 'isConnected' in Node.prototype,
  flexbox: CSS.supports && CSS.supports('display', 'flex'),
  grid: CSS.supports && CSS.supports('display', 'grid')
};

// Graceful degradation
if (!bw.support.mutationObserver) {
  bw.config.cleanup.useMutationObserver = false;
}
```

## Migration Path from v1

```javascript
// v1 style (still supported)
const table = bw.htmlTable(data);
document.getElementById('app').innerHTML = table;

// v2 approach 1: Use TACO
const table = bw.makeTable(data);
document.getElementById('app').innerHTML = bw.html(table);

// v2 approach 2: Full interactive
const table = bw.createTable(data);
bw.DOM('#app', table);
table.sortBy('name');  // Now has methods!
```

## Error Handling

```javascript
// Component already mounted
try {
  const card = bw.createCard({ title: 'Test' });
  bw.DOM('#app', card);
  bw.DOM('#sidebar', card); // Throws error
} catch (e) {
  console.error(e.message);
  // "Component bw_uuid_abc123 is already mounted. Use .detach() to move."
}

// Invalid TACO structure
try {
  const invalid = bw.renderComponent({
    // Missing 't' property
    a: { class: 'test' }
  });
} catch (e) {
  console.error(e.message);
  // "Invalid TACO: missing required property 't' (tag)"
}

// Component type not found
const custom = bw.renderComponent({
  t: 'div',
  o: { type: 'unknown-component' }
});
// Warning: "Unknown component type 'unknown-component', using base ComponentHandle"
```

## Summary

Bitwrench v2 provides three clear paths:
1. **Static HTML generation** for SSR and simple cases
2. **TACO objects** for component composition and reuse  
3. **Interactive components** with handles for dynamic UIs

The architecture maintains v1's simplicity while adding the structure needed for complex applications. Components are just functions returning data, but when rendered, they become powerful interactive elements with type-specific methods.