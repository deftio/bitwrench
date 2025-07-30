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