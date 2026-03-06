# Bitwrench v2 Component Library

This document defines the built-in component generators for Bitwrench v2. These components follow the pattern established in v1 (like `bw.htmlTable()` and `bw.htmlTabs()`) but are modernized with proper lifecycle management, responsive design, and Bootstrap/shadcn-inspired styling.

## Design Principles

1. **Developer-Friendly APIs**: Components accept simple data structures, not TACO objects
2. **Smart Defaults**: Work beautifully out-of-the-box with zero configuration
3. **Full Customization**: Every aspect can be overridden when needed
4. **Lifecycle Management**: Automatic cleanup and event handling
5. **Responsive & Themeable**: Mobile-first design with CSS variables
6. **UUID Tracking**: Each component gets a unique `bw-uuid-xxx` class for targeting

## Lessons from v1 and v2 Improvements

### What v1 Got Right (and v2 Preserves)

1. **Simple Data Input**: v1's `bw.htmlTable()` accepted a simple 2D array - v2 continues this pattern
2. **Built-in Interactivity**: v1 tables had sorting built-in - v2 expands this with filtering, pagination
3. **CSS Grid System**: v1's 12-column grid with `bw-col-*` classes - v2 enhances with modern CSS Grid
4. **Typography Classes**: v1's `.bw-h1` through `.bw-h6` - v2 adds responsive typography
5. **Default Styling**: v1 components looked good without extra CSS - v2 uses modern design principles

### v2 Enhancements

1. **Proper Spacing**:
   - v1: Components could butt against each other
   - v2: Automatic margin/padding with CSS variables, smart container detection

2. **Uniform Heights**:
   - v1: Cards/components had varying heights
   - v2: Flexbox ensures uniform heights in grids/rows

3. **Modern Features**:
   - v1: Basic tabs, tables
   - v2: Pagination, filtering, virtual scrolling, drag-and-drop

4. **Accessibility**:
   - v1: Limited ARIA support
   - v2: Full WCAG 2.1 AA compliance built-in

5. **Lifecycle Management**:
   - v1: Manual cleanup required
   - v2: Automatic cleanup with mount/unmount hooks

### Example: Table Evolution

```javascript
// v1 - Simple but limited
bw.htmlTable([
  ["Name", "Age", "City"],
  ["John", 30, "NYC"],
  ["Jane", 25, "LA"]
], { sortable: true });

// v2 - Rich features, same simplicity
bw.makeTable([
  ["Name", "Age", "City"],
  ["John", 30, "NYC"],
  ["Jane", 25, "LA"]
], {
  sortable: true,
  filterable: true,
  paginate: true,
  hover: true,
  onRowClick: (row) => console.log('Clicked:', row)
});
```

## Testing Strategy

Bitwrench v2 requires comprehensive testing across multiple environments while maintaining the zero-build philosophy. Tests must verify functionality in both Node.js and browser environments, with and without the component library.

### Documentation Standards

All Bitwrench functions must include comprehensive JSDoc documentation:

```javascript
/**
 * Creates a feature-rich data table with sorting, pagination, and filtering
 * 
 * @function bw.makeTable
 * @param {Array<Array<any>>|Array<Object>} data - Table data as 2D array or object array
 * @param {Object} [options={}] - Configuration options
 * @param {boolean} [options.sortable=true] - Enable column sorting
 * @param {boolean} [options.filterable=false] - Enable search/filter box
 * @param {boolean} [options.paginate=false] - Enable pagination
 * @param {number} [options.pageSize=10] - Rows per page when paginated
 * @param {Function} [options.onRowClick] - Row click handler(rowData, index)
 * @returns {Object} TACO object ready for rendering
 * @since 2.0.0
 * 
 * @example
 * // Simple 2D array
 * const table = bw.makeTable([
 *   ["Name", "Age"],
 *   ["John", 30]
 * ]);
 * 
 * @example  
 * // Object array with options
 * const table = bw.makeTable(userData, {
 *   sortable: true,
 *   filterable: true,
 *   onRowClick: (row) => console.log(row)
 * });
 */
```

### Testing Environments

#### 1. Unit Testing (Jest + jsdom)

Test core functionality in both Node.js and simulated browser environments:

```javascript
// test/bitwrench.test.js
describe('Bitwrench Core', () => {
  // Test in both environments
  const environments = [
    { name: 'Browser', setup: setupBrowserEnv },
    { name: 'Node.js', setup: setupNodeEnv }
  ];
  
  environments.forEach(env => {
    describe(`in ${env.name}`, () => {
      beforeEach(() => {
        env.setup();
      });
      
      test('bw.html generates correct HTML', () => {
        const taco = { t: 'div', a: { id: 'test' }, c: 'Hello' };
        expect(bw.html(taco)).toBe('<div id="test">Hello</div>');
      });
      
      test('bw.isNodeJS detects environment correctly', () => {
        const expected = env.name === 'Node.js';
        expect(bw.isNodeJS()).toBe(expected);
      });
      
      test('works without component library', () => {
        // Core should function without components
        expect(typeof bw.html).toBe('function');
        expect(typeof bw.makeTable).toBe('undefined');
      });
    });
  });
});
```

#### 2. Component Testing (Jest + jsdom)

Test component rendering and interaction:

```javascript
// test/components.test.js
describe('Bitwrench Components', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
  });
  
  test('bw.makeTable renders correctly', () => {
    const table = bw.makeTable([
      ['Name', 'Age'],
      ['John', 30]
    ]);
    
    bw.render('#root', table);
    
    const rendered = document.querySelector('#root table');
    expect(rendered).toBeTruthy();
    expect(rendered.querySelectorAll('tr').length).toBe(2);
  });
  
  test('Table sorting works', async () => {
    const table = bw.makeTable([
      ['Name', 'Age'],
      ['Zoe', 25],
      ['Alice', 30]
    ], { sortable: true });
    
    bw.render('#root', table);
    
    // Click header to sort
    const header = document.querySelector('th');
    header.click();
    
    await new Promise(r => setTimeout(r, 10)); // Wait for DOM update
    
    const firstCell = document.querySelector('tbody tr:first-child td');
    expect(firstCell.textContent).toBe('Alice');
  });
  
  test('Component lifecycle hooks fire correctly', () => {
    const mounted = jest.fn();
    const unmount = jest.fn();
    
    const component = {
      t: 'div',
      c: 'Test',
      o: { mounted, unmount }
    };
    
    const el = bw.render('#root', component);
    expect(mounted).toHaveBeenCalledWith(el);
    
    bw.cleanup(el);
    expect(unmount).toHaveBeenCalledWith(el);
  });
});
```

#### 3. Browser Testing (Karma)

Real browser testing across multiple browsers:

```javascript
// karma.conf.js
module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'chai'],
    files: [
      'dist/bitwrench.umd.js',
      'dist/bitwrench-components.umd.js',
      'test/browser/*.test.js'
    ],
    browsers: ['Chrome', 'Firefox', 'Safari', 'IE11'],
    reporters: ['progress', 'coverage'],
    
    // Test different build configurations
    preprocessors: {
      'test/browser/*.test.js': ['webpack']
    },
    
    webpack: {
      module: {
        rules: [
          // Transpile for IE11 compatibility
          {
            test: /\.js$/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [['@babel/preset-env', { targets: 'ie 11' }]]
              }
            }
          }
        ]
      }
    }
  });
};
```

#### 4. Module Format Testing

Verify all module formats work correctly:

```javascript
// test/modules.test.js
describe('Module Formats', () => {
  test('UMD format works in browser', () => {
    // Simulate browser global
    global.window = {};
    require('../dist/bitwrench.umd.js');
    expect(global.window.bw).toBeDefined();
  });
  
  test('CommonJS format works in Node', () => {
    const bw = require('../dist/bitwrench.cjs.js');
    expect(bw.html).toBeDefined();
  });
  
  test('ESM format works', async () => {
    const { bw } = await import('../dist/bitwrench.esm.js');
    expect(bw.html).toBeDefined();
  });
});
```

#### 5. Visual Regression Testing

For component appearance consistency:

```javascript
// test/visual.test.js
describe('Visual Regression', () => {
  test('Table component appearance', async () => {
    const table = bw.makeTable(testData, { striped: true });
    document.body.innerHTML = bw.html(table);
    
    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot();
  });
});
```

### Testing Best Practices

1. **No External Dependencies**: Tests should run without npm install (except test runners)
2. **Fast Execution**: All tests should complete in under 10 seconds
3. **Environment Agnostic**: Same tests must pass in Node.js and browsers
4. **Backward Compatible**: Test in IE11+ to ensure compatibility
5. **Component Isolation**: Each component testable independently

### Continuous Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [14.x, 16.x, 18.x]
    
    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v2
      with:
        node-version: ${{ matrix.node-version }}
    
    - name: Install test dependencies only
      run: npm install --no-save jest jsdom karma karma-chrome-launcher
    
    - name: Run unit tests
      run: npm test
    
    - name: Run browser tests
      run: npm run test:browser
    
    - name: Test builds
      run: |
        npm run build
        node -e "require('./dist/bitwrench.umd.js')"
        node -e "require('./dist/bitwrench.cjs.js')"
```

### Performance Testing

```javascript
// test/performance.test.js
describe('Performance', () => {
  test('Renders 1000 row table in < 100ms', () => {
    const data = Array(1000).fill(0).map((_, i) => 
      [`User ${i}`, Math.floor(Math.random() * 100), 'City']
    );
    
    const start = performance.now();
    const table = bw.makeTable(data);
    const html = bw.html(table);
    const end = performance.now();
    
    expect(end - start).toBeLessThan(100);
    expect(html.length).toBeGreaterThan(0);
  });
});
```

## Core Concept: Component Generators Return TACO

```javascript
// Component generators accept data, return TACO
const tableData = [
  ["Name", "Age", "City"],
  ["John", 30, "New York"],
  ["Jane", 25, "London"]
];

// Returns a TACO object with all the complexity handled internally
const tableTaco = bw.makeTable(tableData, { sortable: true });

// Render using standard bitwrench methods
bw.render("#app", tableTaco);  // Managed rendering with lifecycle
// or
bw.DOM("#app", tableTaco);     // Direct DOM insertion
// or
const html = bw.html(tableTaco); // HTML string generation
```

## bw.makeTable()

Creates a feature-rich data table with sorting, pagination, filtering, and responsive design. Accepts simple 2D arrays or arrays of objects and automatically handles headers, sorting, and pagination.

**Parameters:**
- `data` (Array): 2D array of data or array of objects
- `options` (Object): Configuration options

**Options:**
```javascript
{
  // Data handling
  headers: null,              // Custom headers array, auto-detected if null
  useFirstRowAsHeaders: true, // Treat first row as headers
  
  // Features
  sortable: true,             // Enable column sorting
  filterable: true,           // Enable search/filter box
  paginate: true,             // Enable pagination
  pageSize: 10,               // Rows per page
  
  // Styling
  striped: true,              // Zebra striping
  bordered: true,             // Table borders
  hover: true,                // Hover effects
  compact: false,             // Compact spacing
  responsive: true,           // Mobile responsive
  
  // Advanced
  caption: "",                // Table caption
  footer: null,               // Footer data array
  emptyMessage: "No data",    // Message when empty
  
  // Callbacks
  onSort: null,               // Custom sort function(column, direction)
  onFilter: null,             // Custom filter function(query)
  onPageChange: null,         // Page change callback(page)
  onRowClick: null,           // Row click handler(rowData, index)
  
  // Custom rendering
  cellRenderer: null,         // Function(value, row, col) => TACO|string
  headerRenderer: null,       // Function(value, col) => TACO|string
}
```

### Usage Examples

```javascript
// Simple usage with 2D array
const table = bw.makeTable([
  ["Product", "Price", "Stock"],
  ["Laptop", 999.99, 15],
  ["Mouse", 29.99, 150],
  ["Keyboard", 79.99, 45]
], { 
  sortable: true,
  filterable: true 
});

// Render to page
bw.render("#table-container", table);

// Advanced usage with objects
const users = [
  { name: "John", age: 30, email: "john@example.com" },
  { name: "Jane", age: 25, email: "jane@example.com" }
];

const userTable = bw.makeTable(users, {
  headers: ["Name", "Age", "Email Address"],
  paginate: true,
  pageSize: 20,
  striped: true,
  hover: true,
  onRowClick: (row) => console.log('Clicked:', row),
  cellRenderer: (value, row, col) => {
    if (col === 2) { // Email column
      return { t: "a", a: { href: `mailto:${value}` }, c: value };
    }
    return value;
  }
});

// Mount with lifecycle management
bw.render("#users", userTable);
```

## bw.makeList()

Creates styled lists with various formats and interactive features. Supports unordered lists, ordered lists, and definition lists with options for selection, reordering, and custom rendering.

**Parameters:**
- `items` (Array): Array of items (strings, objects, or TACO)
- `options` (Object): Configuration options

**Options:**
```javascript
{
  type: "ul",                 // "ul", "ol", or "dl"
  style: "disc",              // List style (disc, circle, square, decimal, etc.)
  
  // For definition lists
  termKey: "term",            // Key for term in objects
  definitionKey: "definition", // Key for definition in objects
  
  // Features
  collapsible: false,         // Make items collapsible
  selectable: false,          // Allow item selection
  draggable: false,           // Enable drag-n-drop reordering
  
  // Styling
  inline: false,              // Horizontal list
  divided: false,             // Dividers between items
  
  // Callbacks
  onSelect: null,             // Selection handler(item, index)
  onReorder: null,            // Reorder handler(newOrder)
  
  // Custom rendering
  itemRenderer: null          // Function(item, index) => TACO
}
```

### Usage Examples

```javascript
// Simple list
const simpleList = bw.makeList([
  "First item",
  "Second item", 
  "Third item"
]);

// Ordered list with custom style
const orderedList = bw.makeList([
  "Step one",
  "Step two",
  "Step three"
], {
  type: "ol",
  style: "decimal"
});

// Definition list
const terms = [
  { term: "HTML", definition: "HyperText Markup Language" },
  { term: "CSS", definition: "Cascading Style Sheets" },
  { term: "JS", definition: "JavaScript" }
];

const defList = bw.makeList(terms, {
  type: "dl"
});

// Interactive list with selection
const selectableList = bw.makeList([
  { id: 1, text: "Option A" },
  { id: 2, text: "Option B" },
  { id: 3, text: "Option C" }
], {
  selectable: true,
  onSelect: (item, index) => {
    console.log('Selected:', item.text);
  },
  itemRenderer: (item) => ({
    t: "span",
    c: [
      { t: "input", a: { type: "radio", name: "options" } },
      " " + item.text
    ]
  })
});

// Render all lists
bw.render("#lists", [simpleList, orderedList, defList, selectableList]);
```

## bw.makeCard()

Creates a flexible card component with header, body, and footer sections that maintains uniform height and spacing. Cards automatically adjust their layout when placed in grids or flex containers.

**Parameters:**
- `content` (String|Object|TACO): Card content
- `options` (Object): Configuration options

**Options:**
```javascript
{
  // Content sections
  title: "",                  // Card title
  subtitle: "",               // Card subtitle
  header: null,               // Custom header TACO
  body: null,                 // Body content (overrides content param)
  footer: null,               // Footer content
  
  // Media
  image: null,                // { src, alt, position: "top"|"left"|"right" }
  icon: null,                 // Icon TACO or string
  
  // Style
  variant: "default",         // default, primary, secondary, success, danger
  shadow: true,               // Box shadow
  border: true,               // Border
  rounded: true,              // Rounded corners
  
  // Layout
  align: "left",              // Content alignment: left, center, right
  padding: "default",         // default, compact, spacious, none
  height: "auto",             // auto, full (stretches to container)
  
  // Features
  collapsible: false,         // Make card collapsible
  dismissible: false,         // Show close button
  href: null,                 // Make entire card clickable
  
  // Callbacks
  onClick: null,              // Click handler
  onDismiss: null,            // Dismiss handler
}
```

### Usage Examples

```javascript
// Simple card
const simpleCard = bw.makeCard("This is the card content", {
  title: "Card Title"
});

// Card with all sections
const fullCard = bw.makeCard({
  title: "Product Name",
  subtitle: "Category",
  body: "Detailed product description goes here...",
  image: { 
    src: "/product.jpg", 
    alt: "Product image",
    position: "top" 
  },
  footer: bw.makeButton("Buy Now", { variant: "primary" })
});

// Cards in a grid - all same height
const productCards = products.map(product => 
  bw.makeCard({
    title: product.name,
    subtitle: product.category,
    body: product.description,
    image: { src: product.image, position: "top" },
    footer: {
      t: "div",
      a: { style: { display: "flex", justifyContent: "space-between" } },
      c: [
        { t: "span", a: { style: { fontSize: "1.25rem" } }, c: `$${product.price}` },
        bw.makeButton("Add to Cart", { size: "sm" })
      ]
    },
    height: "full" // Ensures all cards stretch to same height
  })
);

// Render cards in responsive grid
const cardGrid = bw.makeGrid(productCards, { 
  columns: 3, 
  gap: "1.5rem",
  breakpoints: { sm: 1, md: 2, lg: 3 }
});

bw.render("#products", cardGrid);
```

## bw.makeTabs()

Creates a tabbed interface with smooth transitions and optional features. Supports horizontal and vertical layouts, closeable tabs, and lazy loading of content.

**Parameters:**
- `tabs` (Array): Array of tab objects with { label, content, [icon], [disabled] }
- `options` (Object): Configuration options

**Options:**
```javascript
{
  // Behavior
  defaultActive: 0,           // Initially active tab index
  orientation: "horizontal",  // horizontal or vertical
  
  // Style
  variant: "default",         // default, pills, underline
  fullWidth: false,           // Stretch tabs to full width
  
  // Features
  closeable: false,           // Allow closing tabs
  addable: false,             // Show add tab button
  draggable: false,           // Allow tab reordering
  lazy: false,                // Lazy load tab content
  
  // Callbacks
  onChange: null,             // Tab change handler(index, tab)
  onClose: null,              // Tab close handler(index, tab)
  onAdd: null,                // Add tab handler()
  onReorder: null,            // Reorder handler(newOrder)
}
```

### Usage Examples

```javascript
// Simple tabs
const simpleTabs = bw.makeTabs([
  { label: "Tab 1", content: "Content for tab 1" },
  { label: "Tab 2", content: "Content for tab 2" },
  { label: "Tab 3", content: "Content for tab 3" }
]);

// Tabs with icons and rich content
const iconTabs = bw.makeTabs([
  { 
    label: "Dashboard", 
    icon: "📊",
    content: bw.makeCard("Dashboard content", { title: "Analytics" })
  },
  { 
    label: "Users", 
    icon: "👥",
    content: bw.makeTable(userData, { sortable: true })
  },
  { 
    label: "Settings", 
    icon: "⚙️",
    content: bw.makeForm(settingsFields),
    disabled: false
  }
], {
  variant: "pills",
  fullWidth: true,
  onChange: (index, tab) => {
    console.log(`Switched to ${tab.label}`);
  }
});

// Closeable tabs with add button
const dynamicTabs = bw.makeTabs([
  { label: "Home", content: "Home content", closeable: false },
  { label: "Document 1", content: "Doc 1 content" },
  { label: "Document 2", content: "Doc 2 content" }
], {
  closeable: true,
  addable: true,
  onClose: (index, tab) => {
    console.log(`Closed ${tab.label}`);
  },
  onAdd: () => {
    console.log("Add new tab");
    // Return new tab data
    return { 
      label: `Document ${Date.now()}`, 
      content: "New document content" 
    };
  }
});

// Render tabs
bw.render("#app", iconTabs);
```

## bw.makeNav()

Creates navigation menus with multiple styles and configurations. Supports navbars, sidebars, breadcrumbs, and pagination with dropdowns, search, and mobile responsiveness.

**Parameters:**
- `items` (Array): Navigation items in various formats (see below)
- `options` (Object): Configuration options

**Item Formats:**
```javascript
// Simple format: [text, url]
const simpleNav = [
  ["Home", "/"],
  ["About", "/about"],
  ["Contact", "/contact"]
];

// Object format with more options
const objectNav = [
  { text: "Home", href: "/", active: true },
  { text: "About", href: "/about", icon: "📋" },
  { text: "Products", href: "/products", badge: "New" },
  { text: "Contact", href: "/contact", disabled: true }
];

// With dropdowns
const dropdownNav = [
  { text: "Home", href: "/" },
  { 
    text: "Products",
    dropdown: [
      { text: "All Products", href: "/products" },
      { divider: true },
      { text: "Category 1", href: "/products/cat1" },
      { text: "Category 2", href: "/products/cat2" }
    ]
  },
  {
    text: "Resources",
    dropdown: [
      { text: "Documentation", href: "/docs", icon: "📚" },
      { text: "API Reference", href: "/api", icon: "🔧" },
      { divider: true },
      { text: "Support", href: "/support", badge: "Help" }
    ]
  }
];

// With custom TACO content
const customNav = [
  { text: "Home", href: "/" },
  { 
    text: "User",
    dropdown: [
      { text: "Profile", href: "/profile" },
      { divider: true },
      { 
        // Custom TACO for complex dropdown items
        taco: {
          t: "div",
          a: { class: "custom-nav-item" },
          c: [
            { t: "img", a: { src: "/avatar.jpg", width: 32 } },
            { t: "span", c: "John Doe" }
          ]
        }
      }
    ]
  },
  // Completely custom nav item
  {
    taco: bw.makeButton("Sign Out", { 
      variant: "danger", 
      size: "sm",
      onClick: () => logout()
    })
  }
];
```

**Options:**
```javascript
{
  // Type
  type: "navbar",             // navbar, sidebar, breadcrumb, pagination
  
  // Navbar specific
  brand: null,                // Brand text/logo/TACO
  sticky: false,              // Sticky positioning
  expand: "lg",               // Breakpoint for mobile menu (sm, md, lg, xl)
  
  // Common options
  variant: "light",           // light, dark, primary
  align: "left",              // left, center, right, between
  vertical: false,            // Vertical orientation
  
  // Features
  search: false,              // Include search box
  searchPlaceholder: "Search...", // Search placeholder text
  onSearch: null,             // Search callback(query)
  
  // User menu
  userMenu: {
    avatar: "/user.jpg",      // Avatar image URL
    name: "John Doe",         // User name
    items: [                  // Dropdown items
      { text: "Profile", href: "/profile" },
      { text: "Settings", href: "/settings" },
      { divider: true },
      { text: "Logout", onClick: () => logout() }
    ]
  },
  
  // Mobile
  hamburger: true,            // Show mobile hamburger
  offcanvas: false,           // Use offcanvas on mobile
  mobileBreakpoint: 768,      // When to show mobile menu
  
  // Callbacks
  onItemClick: null,          // Item click handler(item)
}
```

### Usage Examples

```javascript
// Simple navbar with array format
const simpleNav = bw.makeNav([
  ["Home", "/"],
  ["About", "/about"],
  ["Contact", "/contact"]
], {
  brand: "My Site",
  sticky: true
});

// Complex navbar with dropdowns and search
const complexNav = bw.makeNav([
  { text: "Home", href: "/", active: true },
  {
    text: "Products",
    dropdown: [
      { text: "All Products", href: "/products" },
      { divider: true },
      { text: "Electronics", href: "/products/electronics" },
      { text: "Clothing", href: "/products/clothing" }
    ]
  },
  { text: "About", href: "/about" }
], {
  brand: {
    t: "div",
    a: { style: { display: "flex", alignItems: "center", gap: "0.5rem" } },
    c: [
      { t: "img", a: { src: "/logo.png", height: 30 } },
      { t: "span", c: "My Brand" }
    ]
  },
  search: true,
  onSearch: (query) => console.log('Search:', query),
  userMenu: {
    avatar: "/user.jpg",
    name: "John Doe",
    items: [
      { text: "Profile", href: "/profile" },
      { text: "Logout", onClick: () => logout() }
    ]
  },
  variant: "dark",
  sticky: true
});

// Sidebar navigation
const sidebar = bw.makeNav([
  { text: "Dashboard", href: "/", icon: "🏠" },
  { text: "Analytics", href: "/analytics", icon: "📊" },
  {
    text: "Content",
    icon: "📝",
    dropdown: [
      { text: "Pages", href: "/pages" },
      { text: "Posts", href: "/posts" },
      { text: "Media", href: "/media" }
    ]
  }
], {
  type: "sidebar",
  vertical: true,
  variant: "light"
});

// Breadcrumb navigation
const breadcrumbs = bw.makeNav([
  { text: "Home", href: "/" },
  { text: "Products", href: "/products" },
  { text: "Electronics", href: "/products/electronics" },
  { text: "Laptops" } // Last item without href is current page
], {
  type: "breadcrumb"
});

// Render navigation
bw.render("#header", complexNav);
bw.render("#sidebar", sidebar);
bw.render("#breadcrumbs", breadcrumbs);
```

## bw.makeForm()

Creates dynamic forms with validation and various input types. Automatically handles form layout, validation, and submission with support for all HTML5 input types.

**Parameters:**
- `fields` (Array): Array of field definitions
- `options` (Object): Form configuration

**Field Definition:**
```javascript
{
  name: "email",              // Field name attribute
  type: "email",              // Input type
  label: "Email Address",     // Field label
  placeholder: "",            // Placeholder text
  value: "",                  // Default value
  required: false,            // Required field
  disabled: false,            // Disabled state
  
  // Validation
  validate: null,             // Custom validation function
  pattern: null,              // Regex pattern
  min: null,                  // Min value/length
  max: null,                  // Max value/length
  
  // For select/radio/checkbox
  options: [],                // Array of {value, label} objects
  multiple: false,            // Multiple selection
  
  // Layout
  width: "full",              // full, half, third, quarter
  help: "",                   // Help text
  error: "",                  // Error message
}
```

**Form Options:**
```javascript
{
  // Layout
  layout: "vertical",         // vertical, horizontal, inline
  columns: 1,                 // Number of columns
  
  // Behavior
  validateOn: "submit",       // submit, blur, change
  ajax: false,                // Submit via AJAX
  resetButton: true,          // Show reset button
  
  // Styling
  variant: "default",         // default, floating, material
  size: "md",                 // sm, md, lg
  
  // Callbacks
  onSubmit: null,             // Submit handler(data)
  onValidate: null,           // Validation handler(fields)
  onChange: null,             // Change handler(field, value)
}
```

### Usage Examples

```javascript
// Simple contact form
const contactForm = bw.makeForm([
  { name: "name", type: "text", label: "Your Name", required: true },
  { name: "email", type: "email", label: "Email Address", required: true },
  { name: "message", type: "textarea", label: "Message", rows: 5, required: true }
], {
  onSubmit: (data) => {
    console.log('Form submitted:', data);
    // Send data to server
  }
});

// Advanced form with validation
const registrationForm = bw.makeForm([
  {
    name: "username",
    type: "text",
    label: "Username",
    placeholder: "Choose a username",
    required: true,
    pattern: "^[a-zA-Z0-9_]{3,20}$",
    help: "3-20 characters, letters, numbers, and underscores only"
  },
  {
    name: "email",
    type: "email",
    label: "Email",
    required: true,
    validate: (value) => {
      if (!value.includes('@')) return "Invalid email";
      return null; // Valid
    }
  },
  {
    name: "password",
    type: "password",
    label: "Password",
    required: true,
    min: 8,
    help: "Minimum 8 characters"
  },
  {
    name: "country",
    type: "select",
    label: "Country",
    options: [
      { value: "", label: "Select a country" },
      { value: "us", label: "United States" },
      { value: "uk", label: "United Kingdom" },
      { value: "ca", label: "Canada" }
    ],
    required: true
  },
  {
    name: "newsletter",
    type: "checkbox",
    label: "Subscribe to newsletter",
    value: "1"
  }
], {
  layout: "vertical",
  validateOn: "blur",
  onSubmit: async (data) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      console.log('Registration successful');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  }
});

// Multi-column form
const checkoutForm = bw.makeForm([
  { name: "firstName", label: "First Name", type: "text", width: "half", required: true },
  { name: "lastName", label: "Last Name", type: "text", width: "half", required: true },
  { name: "email", label: "Email", type: "email", width: "full", required: true },
  { name: "address", label: "Street Address", type: "text", width: "full", required: true },
  { name: "city", label: "City", type: "text", width: "half", required: true },
  { name: "zip", label: "ZIP Code", type: "text", width: "half", pattern: "\\d{5}", required: true }
], {
  columns: 2,
  onSubmit: (data) => processCheckout(data)
});

// Render forms
bw.render("#contact", contactForm);
bw.render("#register", registrationForm);
```

## bw.makeInput()

Creates individual form inputs with consistent styling. Supports all HTML5 input types with built-in validation, icons, and addons.

**Parameters:**
- `type` (String): Input type (text, email, password, etc.)
- `options` (Object): Input configuration

**Options:**
```javascript
{
  name: "",                   // Input name
  label: "",                  // Label text
  value: "",                  // Default value
  placeholder: "",            // Placeholder
  
  // Features
  icon: null,                 // Input icon
  addon: null,                // Input addon (prefix/suffix)
  clearable: false,           // Show clear button
  
  // For specific types
  // Number
  step: 1,                    // Number step
  
  // Date/Time
  format: "YYYY-MM-DD",       // Date format
  
  // File
  accept: "",                 // Accepted file types
  multiple: false,            // Multiple files
  
  // Textarea
  rows: 3,                    // Number of rows
  autosize: false,            // Auto-resize
}
```

### Usage Examples

```javascript
// Simple text input
const nameInput = bw.makeInput("text", {
  name: "fullName",
  label: "Full Name",
  placeholder: "Enter your full name",
  required: true
});

// Email with icon
const emailInput = bw.makeInput("email", {
  name: "email",
  label: "Email Address",
  icon: "✉️",
  placeholder: "user@example.com"
});

// Password with visibility toggle
const passwordInput = bw.makeInput("password", {
  name: "password",
  label: "Password",
  clearable: true,
  help: "Use a strong password"
});

// Number input with min/max
const ageInput = bw.makeInput("number", {
  name: "age",
  label: "Age",
  min: 18,
  max: 120,
  step: 1
});

// Search input with addon
const searchInput = bw.makeInput("search", {
  name: "query",
  placeholder: "Search...",
  addon: {
    position: "right",
    content: bw.makeButton("Search", { size: "sm" })
  }
});

// Render inputs
const form = {
  t: "form",
  c: [nameInput, emailInput, passwordInput, ageInput, searchInput]
};

bw.render("#form", form);
```

## bw.makeModal()

Creates modal dialogs with various styles and behaviors. Supports different sizes, animations, and backdrop options with proper focus management.

**Parameters:**
- `content` (String|Object|TACO): Modal content
- `options` (Object): Modal configuration

**Options:**
```javascript
{
  // Content
  title: "",                  // Modal title
  body: null,                 // Body content (overrides content)
  footer: null,               // Footer content/buttons
  
  // Size & Position
  size: "md",                 // sm, md, lg, xl, full
  centered: true,             // Center vertically
  
  // Behavior
  closeable: true,            // Allow closing
  closeOnBackdrop: true,      // Close on backdrop click
  closeOnEscape: true,        // Close on ESC key
  autoFocus: true,            // Auto focus first input
  
  // Style
  variant: "default",         // default, success, danger, etc.
  backdrop: true,             // Show backdrop
  animation: true,            // Animate open/close
  
  // Callbacks
  onShow: null,               // Show handler
  onHide: null,               // Hide handler
  onConfirm: null,            // Confirm button handler
  onCancel: null,             // Cancel button handler
}
```

### Usage Examples

```javascript
// Simple alert modal
const alertModal = bw.makeModal("Operation completed successfully!", {
  title: "Success",
  variant: "success",
  footer: bw.makeButton("OK", { 
    variant: "success",
    onClick: () => bw.closeModal(alertModal)
  })
});

// Confirmation dialog
const confirmModal = bw.makeModal("Are you sure you want to delete this item?", {
  title: "Confirm Delete",
  variant: "danger",
  footer: [
    bw.makeButton("Cancel", {
      variant: "secondary",
      onClick: () => bw.closeModal(confirmModal)
    }),
    bw.makeButton("Delete", {
      variant: "danger",
      onClick: () => {
        deleteItem();
        bw.closeModal(confirmModal);
      }
    })
  ]
});

// Form in modal
const formModal = bw.makeModal({
  body: bw.makeForm([
    { name: "name", label: "Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true }
  ], {
    onSubmit: (data) => {
      saveUser(data);
      bw.closeModal(formModal);
    }
  }),
  title: "Add New User",
  size: "lg",
  closeable: false
});

// Show modals
bw.showModal(alertModal);
```

## bw.makeTooltip()

Creates tooltips with smart positioning. Automatically adjusts position to stay within viewport and supports HTML content.

**Parameters:**
- `target` (String|Element): Target element selector or element
- `content` (String): Tooltip content
- `options` (Object): Tooltip configuration

**Options:**
```javascript
{
  // Position
  placement: "top",           // top, bottom, left, right, auto
  offset: 8,                  // Distance from target
  
  // Behavior
  trigger: "hover",           // hover, click, focus, manual
  delay: { show: 0, hide: 0 }, // Show/hide delays
  
  // Style
  variant: "dark",            // dark, light, primary, etc.
  arrow: true,                // Show arrow
  maxWidth: 250,              // Max width
  
  // Features
  html: false,                // Allow HTML content
  interactive: false,         // Keep open on hover
}
```

### Usage Examples

```javascript
// Simple tooltip
bw.makeTooltip("#help-icon", "Click here for more information");

// Tooltip with options
bw.makeTooltip(".info-button", "This action cannot be undone", {
  placement: "bottom",
  variant: "warning",
  delay: { show: 500, hide: 100 }
});

// HTML tooltip
bw.makeTooltip("#user-avatar", "<strong>John Doe</strong><br>Administrator", {
  html: true,
  placement: "right"
});

// Apply tooltips to multiple elements
document.querySelectorAll('[data-tooltip]').forEach(el => {
  bw.makeTooltip(el, el.dataset.tooltip, {
    placement: el.dataset.placement || "top"
  });
});
```

## bw.makeDropdown()

Creates dropdown menus with various triggers and styles. Supports click, hover, and contextual menus with dividers and custom content.

**Parameters:**
- `trigger` (String|TACO): Trigger element
- `items` (Array): Menu items array
- `options` (Object): Dropdown configuration

**Options:**
```javascript
{
  // Position
  placement: "bottom-start",  // Popper.js placements
  
  // Behavior
  trigger: "click",           // click, hover, focus
  autoClose: true,            // Close on item click
  
  // Style
  variant: "default",         // default, dark
  size: "md",                 // sm, md, lg
  
  // Features
  dividers: true,             // Auto-add dividers
  search: false,              // Include search
  multiSelect: false,         // Allow multiple selection
  
  // Callbacks
  onSelect: null,             // Item select handler
  onOpen: null,               // Open handler
  onClose: null,              // Close handler
}
```

### Usage Examples

```javascript
// Simple dropdown
const dropdown = bw.makeDropdown("Options", [
  { text: "Edit", onClick: () => editItem() },
  { text: "Duplicate", onClick: () => duplicateItem() },
  { divider: true },
  { text: "Delete", onClick: () => deleteItem(), className: "text-danger" }
]);

// User menu dropdown
const userMenu = bw.makeDropdown(
  { t: "img", a: { src: "/avatar.jpg", class: "avatar" } },
  [
    { text: "Profile", href: "/profile", icon: "👤" },
    { text: "Settings", href: "/settings", icon: "⚙️" },
    { divider: true },
    { text: "Sign Out", onClick: () => logout(), icon: "🚪" }
  ],
  { placement: "bottom-end", trigger: "click" }
);

// Context menu
const contextMenu = bw.makeDropdown(null, [
  { text: "Cut", onClick: () => cut() },
  { text: "Copy", onClick: () => copy() },
  { text: "Paste", onClick: () => paste() }
], {
  trigger: "contextmenu" // Right-click
});

// Render dropdowns
bw.render("#dropdown", dropdown);
bw.render("#user", userMenu);
```

## bw.makeGrid()

Creates responsive grid layouts with flexible configuration. Automatically handles responsive breakpoints and gap spacing.

**Parameters:**
- `items` (Array): Array of grid items
- `options` (Object): Grid configuration

**Options:**
```javascript
{
  // Layout
  columns: 12,                // Number of columns
  gap: "1rem",                // Gap between items
  
  // Responsive
  breakpoints: {
    sm: 1,                    // Columns on small screens
    md: 2,                    // Columns on medium screens
    lg: 3,                    // Columns on large screens
    xl: 4                     // Columns on extra large screens
  },
  
  // Features
  masonry: false,             // Masonry layout
  animate: false,             // Animate on scroll
  
  // Item options
  itemClass: "",              // Additional item classes
  itemRenderer: null          // Custom item renderer
}
```

### Usage Examples

```javascript
// Simple grid
const simpleGrid = bw.makeGrid([
  bw.makeCard("Card 1"),
  bw.makeCard("Card 2"),
  bw.makeCard("Card 3"),
  bw.makeCard("Card 4")
], {
  columns: 4,
  gap: "1.5rem"
});

// Responsive grid
const responsiveGrid = bw.makeGrid(products.map(p => 
  bw.makeCard({
    title: p.name,
    body: p.description,
    image: { src: p.image },
    footer: bw.makeButton("View Details")
  })
), {
  columns: 12,
  breakpoints: {
    sm: 12,  // 1 column on mobile
    md: 6,   // 2 columns on tablet
    lg: 4,   // 3 columns on desktop
    xl: 3    // 4 columns on large screens
  },
  gap: "2rem"
});

// Masonry layout
const masonryGrid = bw.makeGrid(galleryItems, {
  columns: 3,
  masonry: true,
  gap: "1rem",
  animate: true
});

bw.render("#products", responsiveGrid);
```

## bw.makeContainer()

Creates a container with consistent spacing and max-width.

**Parameters:**
- `content` (TACO|Array): Container content
- `options` (Object): Container configuration

**Options:**
```javascript
{
  // Size
  size: "default",            // default, sm, lg, xl, fluid
  
  // Spacing
  padding: true,              // Add padding
  margin: true,               // Add margin
  
  // Style
  background: null,           // Background color/image
  border: false,              // Add border
  shadow: false,              // Add shadow
  rounded: false,             // Rounded corners
}
```

## Utility Components

### bw.makeSpinner(options)

Creates loading spinners with various styles.

**Options:**
```javascript
{
  // Type
  type: "border",             // border, grow, dots, pulse
  
  // Size
  size: "md",                 // sm, md, lg
  
  // Style
  color: "primary",           // Color variant
  
  // Features
  label: "",                  // Loading text
  fullscreen: false,          // Fullscreen overlay
}
```

### bw.makeProgress(value, options)

Creates progress bars with animations.

**Parameters:**
- `value` (Number): Progress value (0-100)
- `options` (Object): Progress configuration

**Options:**
```javascript
{
  // Display
  label: "",                  // Progress label
  showValue: true,            // Show percentage
  
  // Style
  variant: "primary",         // Color variant
  striped: false,             // Striped pattern
  animated: false,            // Animated stripes
  height: "1rem",             // Bar height
  
  // Features
  segments: null,             // Array of segments for stacked progress
}
```

### bw.makeBadge(text, options)

Creates badges for labels and counters.

**Parameters:**
- `text` (String|Number): Badge content
- `options` (Object): Badge configuration

**Options:**
```javascript
{
  // Style
  variant: "primary",         // Color variant
  pill: false,                // Pill shape
  
  // Features
  dismissible: false,         // Show close button
  animate: false,             // Pulse animation
  
  // Position (when attached)
  position: "top-right",      // Position when attached to element
}
```

## Advanced Components

### bw.makeCalendar(options)

Creates an interactive calendar component.

**Options:**
```javascript
{
  // Date
  value: new Date(),          // Selected date(s)
  min: null,                  // Min selectable date
  max: null,                  // Max selectable date
  
  // Display
  view: "month",              // month, week, day, year
  showWeekNumbers: false,     // Show week numbers
  
  // Features
  multiple: false,            // Multiple date selection
  range: false,               // Date range selection
  events: [],                 // Array of events
  
  // Callbacks
  onChange: null,             // Date change handler
  onEventClick: null,         // Event click handler
}
```

### bw.makeChart(data, options)

Creates simple charts using CSS and SVG.

**Parameters:**
- `data` (Array): Chart data
- `options` (Object): Chart configuration

**Options:**
```javascript
{
  // Type
  type: "bar",                // bar, line, pie, donut
  
  // Display
  width: "100%",              // Chart width
  height: "300px",            // Chart height
  
  // Features
  legend: true,               // Show legend
  tooltip: true,              // Show tooltips
  animate: true,              // Animate on load
  
  // Styling
  colors: [],                 // Custom colors
  theme: "default",           // Color theme
}
```

### bw.makeTree(data, options)

Creates tree views for hierarchical data.

**Parameters:**
- `data` (Array): Tree data with nested children
- `options` (Object): Tree configuration

**Options:**
```javascript
{
  // Display
  expanded: false,            // Initially expanded
  showLines: true,            // Show connector lines
  showIcons: true,            // Show folder/file icons
  
  // Features
  selectable: true,           // Allow selection
  checkable: false,           // Show checkboxes
  draggable: false,           // Drag-n-drop support
  editable: false,            // Inline editing
  
  // Callbacks
  onSelect: null,             // Selection handler
  onCheck: null,              // Check handler
  onDrop: null,               // Drop handler
  onEdit: null,               // Edit handler
}
```

## Implementation Guidelines

### Component Generator Pattern

All component generators follow this pattern:

```javascript
bw.makeComponentName = function(data, options) {
  // 1. Generate unique ID
  const uuid = bw.uuid();
  const componentClass = `bw-uuid-${uuid}`;
  
  // 2. Merge options with defaults
  const opts = Object.assign({
    // sensible defaults
  }, options);
  
  // 3. Build TACO structure
  const taco = {
    t: "div",
    a: { 
      class: `bw-component-name ${componentClass} ${opts.className || ''}`.trim(),
      id: opts.id || undefined
    },
    c: /* component content */,
    o: {
      mounted: function(el) {
        // Setup event listeners, observers, etc.
      },
      unmount: function(el) {
        // Cleanup listeners, timers, etc.
      },
      state: {
        // Component state
      }
    }
  };
  
  // 4. Return TACO
  return taco;
};
```

### JavaScript-Based Theming (No CSS Variables Needed!)

Bitwrench components use a JavaScript theme object that gets compiled into inline styles or generated CSS. This approach eliminates external CSS dependencies:

```javascript
// Default theme object - can be customized
bw.theme = {
  // Colors
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
  
  // Spacing scale
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem", 
    md: "1rem",
    lg: "1.5rem",
    xl: "3rem"
  },
  
  // Component defaults
  components: {
    margin: "1rem",
    padding: "1.25rem",
    gap: "1rem"
  },
  
  // Typography
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem"
    },
    lineHeight: 1.5
  },
  
  // Borders
  borders: {
    radius: {
      none: "0",
      sm: "0.125rem",
      base: "0.25rem",
      md: "0.375rem",
      lg: "0.5rem",
      full: "9999px"
    },
    width: "1px",
    color: "#dee2e6"
  },
  
  // Shadows  
  shadows: {
    sm: "0 0.125rem 0.25rem rgba(0,0,0,0.075)",
    base: "0 0.5rem 1rem rgba(0,0,0,0.15)",
    lg: "0 1rem 3rem rgba(0,0,0,0.175)",
    none: "none"
  }
};

// Components use theme values directly
bw.makeCard = function(content, options) {
  const opts = Object.assign({
    padding: bw.theme.components.padding,
    margin: bw.theme.components.margin,
    borderRadius: bw.theme.borders.radius.base,
    borderColor: bw.theme.borders.color,
    shadow: bw.theme.shadows.base
  }, options);
  
  return {
    t: "div",
    a: {
      class: `bw-card bw-uuid-${bw.uuid()}`,
      style: {
        marginBottom: opts.margin,
        padding: 0,
        border: `1px solid ${opts.borderColor}`,
        borderRadius: opts.borderRadius,
        boxShadow: opts.shadow,
        display: "flex",
        flexDirection: "column",
        height: "100%"
      }
    },
    c: [
      // Card content with proper spacing
    ]
  };
};
```

### Dynamic Theme Customization

```javascript
// Users can customize the theme
const customTheme = Object.assign({}, bw.theme, {
  colors: {
    ...bw.theme.colors,
    primary: "#e91e63",    // Pink
    secondary: "#9c27b0"   // Purple
  },
  spacing: {
    ...bw.theme.spacing,
    md: "1.25rem"  // Slightly larger medium spacing
  }
});

// Apply custom theme
bw.setTheme(customTheme);

// Or customize per component
bw.makeCard("Content", {
  padding: "2rem",
  margin: "1.5rem",
  borderColor: "#e0e0e0"
});
```

### Component Spacing & Layout System

All components follow consistent spacing rules to ensure they work well together:

## CSS Generation System

Bitwrench v2 generates utility CSS classes dynamically, maintaining backward compatibility with IE8+ while using modern patterns where possible.

### Core CSS Utilities

```javascript
// Generate all utility classes with bw- prefix
bw.generateUtilityCSS = function(options) {
  const opts = Object.assign({
    prefix: "bw-",
    legacy: true,  // IE8+ compatibility
    normalize: false  // Include normalization
  }, options);
  
  const theme = bw.theme;
  const rules = {};
  
  // Typography utilities
  [1, 2, 3, 4, 5, 6].forEach(level => {
    rules[`.${opts.prefix}h${level}`] = {
      fontSize: theme.typography.fontSize[`h${level}`],
      fontWeight: theme.typography.fontWeight.heading,
      lineHeight: theme.typography.lineHeight.heading,
      marginTop: 0,
      marginBottom: theme.spacing.md
    };
  });
  
  // Display utilities
  ["block", "inline", "inline-block", "none"].forEach(display => {
    rules[`.${opts.prefix}d-${display}`] = { display: display };
  });
  
  // Float utilities (for legacy support)
  if (opts.legacy) {
    rules[`.${opts.prefix}float-left`] = { 
      float: "left", 
      marginRight: theme.spacing.md 
    };
    rules[`.${opts.prefix}float-right`] = { 
      float: "right", 
      marginLeft: theme.spacing.md 
    };
    rules[`.${opts.prefix}clearfix:after`] = {
      content: '""',
      display: "table",
      clear: "both"
    };
  }
  
  // Text alignment
  ["left", "center", "right", "justify"].forEach(align => {
    rules[`.${opts.prefix}text-${align}`] = { textAlign: align };
  });
  
  // Spacing utilities
  const spacingScale = ["0", "1", "2", "3", "4", "5"];
  const spacingProps = {
    m: "margin",
    p: "padding"
  };
  const spacingDirections = {
    t: "Top",
    b: "Bottom", 
    l: "Left",
    r: "Right"
  };
  
  Object.entries(spacingProps).forEach(([propKey, propName]) => {
    spacingScale.forEach((scale, index) => {
      const value = index === 0 ? "0" : theme.spacing[["xs", "sm", "md", "lg", "xl"][index - 1]];
      
      // All sides
      rules[`.${opts.prefix}${propKey}-${scale}`] = {
        [propName]: value
      };
      
      // Individual sides
      Object.entries(spacingDirections).forEach(([dirKey, dirName]) => {
        rules[`.${opts.prefix}${propKey}${dirKey}-${scale}`] = {
          [`${propName}${dirName}`]: value
        };
      });
      
      // Horizontal/Vertical
      rules[`.${opts.prefix}${propKey}x-${scale}`] = {
        [`${propName}Left`]: value,
        [`${propName}Right`]: value
      };
      rules[`.${opts.prefix}${propKey}y-${scale}`] = {
        [`${propName}Top`]: value,
        [`${propName}Bottom`]: value
      };
    });
  });
  
  // Grid system (12 columns)
  rules[`.${opts.prefix}row`] = {
    marginLeft: "-15px",
    marginRight: "-15px"
  };
  
  if (opts.legacy) {
    rules[`.${opts.prefix}row:after`] = {
      content: '""',
      display: "table",
      clear: "both"
    };
  }
  
  for (let i = 1; i <= 12; i++) {
    rules[`.${opts.prefix}col-${i}`] = {
      float: opts.legacy ? "left" : "none",
      width: `${(i / 12 * 100)}%`,
      paddingLeft: "15px",
      paddingRight: "15px",
      boxSizing: "border-box"
    };
  }
  
  // Color utilities
  Object.entries(theme.colors).forEach(([name, color]) => {
    rules[`.${opts.prefix}text-${name}`] = { color: color };
    rules[`.${opts.prefix}bg-${name}`] = { backgroundColor: color };
    rules[`.${opts.prefix}border-${name}`] = { borderColor: color };
  });
  
  // Border utilities
  rules[`.${opts.prefix}border`] = { 
    border: `${theme.borders.width} solid ${theme.borders.color}` 
  };
  rules[`.${opts.prefix}border-0`] = { border: "0" };
  ["top", "bottom", "left", "right"].forEach(side => {
    rules[`.${opts.prefix}border-${side}`] = {
      [`border${side.charAt(0).toUpperCase() + side.slice(1)}`]: 
        `${theme.borders.width} solid ${theme.borders.color}`
    };
  });
  
  // Rounded corners
  Object.entries(theme.borders.radius).forEach(([name, value]) => {
    rules[`.${opts.prefix}rounded-${name}`] = { borderRadius: value };
  });
  
  // Shadow utilities
  Object.entries(theme.shadows).forEach(([name, value]) => {
    rules[`.${opts.prefix}shadow-${name}`] = { boxShadow: value };
  });
  
  return bw.css(rules, { pretty: true });
};

// Optional base normalization
bw.cssBaseNorm = function() {
  return bw.css({
    "*": {
      boxSizing: "border-box"
    },
    "body": {
      margin: 0,
      fontFamily: bw.theme.typography.fontFamily,
      fontSize: bw.theme.typography.fontSize.base,
      lineHeight: bw.theme.typography.lineHeight,
      color: bw.theme.colors.dark,
      backgroundColor: bw.theme.colors.white
    },
    "h1, h2, h3, h4, h5, h6": {
      marginTop: 0,
      marginBottom: bw.theme.spacing.md,
      fontWeight: bw.theme.typography.fontWeight.heading
    },
    "p": {
      marginTop: 0,
      marginBottom: bw.theme.spacing.md
    },
    "a": {
      color: bw.theme.colors.primary,
      textDecoration: "underline"
    },
    "a:hover": {
      textDecoration: "none"
    }
  });
};

// Usage
// Generate only utility classes (no global styles)
const utilityCSS = bw.generateUtilityCSS();
bw.injectCSS(utilityCSS);

// Optionally add base normalization
if (needsNormalization) {
  bw.injectCSS(bw.cssBaseNorm());
}

// Or generate everything at once
const allCSS = bw.generateUtilityCSS({ normalize: true });
```

### Legacy Browser Support

The generated CSS maintains compatibility with IE8+ by:

1. **Using floats for grid system** instead of flexbox/grid
2. **Avoiding CSS variables** - all values are compiled
3. **Including clearfix** for float clearing
4. **Using compatible selectors** - no advanced pseudo-selectors
5. **Fallback values** for newer properties

### Responsive Utilities (Progressive Enhancement)

```javascript
// Add responsive utilities only if media queries are supported
bw.generateResponsiveCSS = function() {
  const breakpoints = {
    sm: "576px",
    md: "768px", 
    lg: "992px",
    xl: "1200px"
  };
  
  const rules = {};
  
  // Only add if browser supports media queries
  if (window.matchMedia) {
    Object.entries(breakpoints).forEach(([name, width]) => {
      // Display utilities
      ["none", "block", "inline", "inline-block"].forEach(display => {
        rules[`@media (min-width: ${width})`] = {
          ...rules[`@media (min-width: ${width})`],
          [`.bw-${name}-d-${display}`]: { display: display }
        };
      });
      
      // Column spans
      for (let i = 1; i <= 12; i++) {
        rules[`@media (min-width: ${width})`] = {
          ...rules[`@media (min-width: ${width})`],
          [`.bw-col-${name}-${i}`]: { width: `${(i / 12 * 100)}%` }
        };
      }
    });
  }
  
  return bw.css(rules);
};
```

#### Default Component Styles Generated from JavaScript

Components can either use inline styles or generate CSS dynamically:

```javascript
// Option 1: Inline styles (no external CSS needed)
bw.makeCard = function(content, options) {
  const theme = bw.theme;
  const uuid = bw.uuid();
  
  return {
    t: "div",
    a: {
      class: `bw-card bw-uuid-${uuid}`,
      style: {
        marginBottom: theme.components.margin,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        border: `1px solid ${theme.borders.color}`,
        borderRadius: theme.borders.radius.base,
        backgroundColor: theme.colors.white,
        boxShadow: theme.shadows.base,
        overflow: "hidden"
      }
    },
    c: [
      options.title && {
        t: "div",
        a: {
          style: {
            padding: theme.components.padding,
            borderBottom: `1px solid ${theme.borders.color}`
          }
        },
        c: options.title
      },
      {
        t: "div",
        a: {
          style: {
            padding: theme.components.padding,
            flex: 1
          }
        },
        c: content
      },
      options.footer && {
        t: "div",
        a: {
          style: {
            padding: theme.components.padding,
            borderTop: `1px solid ${theme.borders.color}`,
            marginTop: "auto"
          }
        },
        c: options.footer
      }
    ].filter(Boolean)
  };
};

// Option 2: Generate CSS from JavaScript
bw.generateComponentCSS = function() {
  const theme = bw.theme;
  
  return bw.css({
    // Base component spacing
    ".bw-component": {
      marginBottom: theme.components.margin,
      boxSizing: "border-box"
    },
    
    ".bw-component:last-child": {
      marginBottom: 0
    },
    
    // Container context
    ".bw-row > .bw-component, .bw-grid > .bw-component": {
      marginBottom: 0
    },
    
    // Grid system
    ".bw-grid": {
      display: "grid",
      gap: theme.components.gap
    },
    
    ".bw-row": {
      display: "flex",
      flexWrap: "wrap",
      margin: `calc(${theme.components.gap} / -2)`
    },
    
    ".bw-row > *": {
      padding: `calc(${theme.components.gap} / 2)`
    }
  });
};

// Inject generated CSS
bw.injectCSS(bw.generateComponentCSS());
```

#### Alignment Utilities Generated from Theme

Components can use alignment utilities either as classes or inline styles:

```javascript
// Generate utility classes from theme
bw.generateUtilityCSS = function() {
  const theme = bw.theme;
  const rules = {};
  
  // Text alignment
  ["left", "center", "right", "justify"].forEach(align => {
    rules[`.bw-text-${align}`] = { textAlign: align };
  });
  
  // Flex alignment
  const flexAlignments = {
    start: "flex-start",
    center: "center", 
    end: "flex-end",
    stretch: "stretch"
  };
  
  Object.entries(flexAlignments).forEach(([key, value]) => {
    rules[`.bw-align-${key}`] = { alignItems: value };
  });
  
  const flexJustify = {
    start: "flex-start",
    center: "center",
    end: "flex-end", 
    between: "space-between",
    around: "space-around"
  };
  
  Object.entries(flexJustify).forEach(([key, value]) => {
    rules[`.bw-justify-${key}`] = { justifyContent: value };
  });
  
  // Spacing utilities
  Object.entries(theme.spacing).forEach(([key, value], index) => {
    // Margin
    rules[`.bw-m-${index}`] = { margin: value };
    rules[`.bw-mt-${index}`] = { marginTop: value };
    rules[`.bw-mb-${index}`] = { marginBottom: value };
    rules[`.bw-ml-${index}`] = { marginLeft: value };
    rules[`.bw-mr-${index}`] = { marginRight: value };
    rules[`.bw-mx-${index}`] = { marginLeft: value, marginRight: value };
    rules[`.bw-my-${index}`] = { marginTop: value, marginBottom: value };
    
    // Padding
    rules[`.bw-p-${index}`] = { padding: value };
    rules[`.bw-pt-${index}`] = { paddingTop: value };
    rules[`.bw-pb-${index}`] = { paddingBottom: value };
    rules[`.bw-pl-${index}`] = { paddingLeft: value };
    rules[`.bw-pr-${index}`] = { paddingRight: value };
    rules[`.bw-px-${index}`] = { paddingLeft: value, paddingRight: value };
    rules[`.bw-py-${index}`] = { paddingTop: value, paddingBottom: value };
    
    // Gap
    rules[`.bw-gap-${index}`] = { gap: value };
  });
  
  // Auto margins
  rules[".bw-mt-auto"] = { marginTop: "auto" };
  rules[".bw-mb-auto"] = { marginBottom: "auto" };
  rules[".bw-ml-auto"] = { marginLeft: "auto" };
  rules[".bw-mr-auto"] = { marginRight: "auto" };
  rules[".bw-mx-auto"] = { marginLeft: "auto", marginRight: "auto" };
  rules[".bw-my-auto"] = { marginTop: "auto", marginBottom: "auto" };
  
  return bw.css(rules);
};

// Or apply directly as inline styles
bw.applyAlignment = function(element, options) {
  const theme = bw.theme;
  const styles = {};
  
  if (options.align) {
    styles.textAlign = options.align;
  }
  
  if (options.margin) {
    const spacing = theme.spacing[options.margin] || options.margin;
    styles.margin = spacing;
  }
  
  if (options.padding) {
    const spacing = theme.spacing[options.padding] || options.padding;
    styles.padding = spacing;
  }
  
  return Object.assign(element.a.style || {}, styles);
};

// Example usage in component
bw.makeText = function(content, options) {
  const opts = Object.assign({
    align: "left",
    margin: "md",
    padding: null
  }, options);
  
  return {
    t: "p",
    a: {
      class: opts.className,
      style: bw.applyAlignment({a:{style:{}}}, opts)
    },
    c: content
  };
};
```

#### Component Spacing Examples

```javascript
// Cards in a grid - all same height with proper spacing
const cardGrid = bw.makeGrid([
  bw.makeCard({ 
    title: "Short Card",
    content: "Brief content",
    footer: bw.makeButton("Action")
  }),
  bw.makeCard({
    title: "Long Card", 
    content: "Much longer content that takes up more space and demonstrates how cards stretch to match heights in a grid layout",
    footer: bw.makeButton("Action")
  }),
  bw.makeCard({
    title: "Medium Card",
    content: "Medium length content here",
    footer: bw.makeButton("Action") 
  })
], {
  columns: 3,
  gap: "1rem" // Built-in spacing between cards
});

// Buttons with consistent spacing
const buttonGroup = {
  t: "div",
  a: { class: "bw-button-group bw-gap-2" },
  c: [
    bw.makeButton("Save", { variant: "primary" }),
    bw.makeButton("Cancel", { variant: "secondary" }),
    bw.makeButton("Delete", { variant: "danger" })
  ]
};

// Form with proper field spacing
const form = bw.makeForm([
  { name: "name", label: "Name", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "message", label: "Message", type: "textarea" }
], {
  // Each field automatically gets margin-bottom spacing
});
```

#### Container Rules

Components automatically adjust spacing based on their container:

```javascript
// In a flex row - no bottom margins, gap handles spacing
bw.makeRow({
  children: [
    bw.makeCard({ title: "Card 1" }), // No bottom margin
    bw.makeCard({ title: "Card 2" }), // No bottom margin
    bw.makeCard({ title: "Card 3" })  // No bottom margin
  ],
  gap: "1rem" // Gap between cards
});

// Standalone - has bottom margin
bw.makeCard({ title: "Standalone Card" }); // Has bottom margin

// In a list - consistent spacing
bw.makeContainer({
  children: [
    bw.makeAlert("Info message"),    // margin-bottom: 1rem
    bw.makeCard({ title: "Card" }),  // margin-bottom: 1rem
    bw.makeTable(data),              // margin-bottom: 1rem
    bw.makeButton("Submit")          // margin-bottom: 0 (last child)
  ]
});
```

### Responsive Breakpoints

Components use consistent breakpoints:

```javascript
const BREAKPOINTS = {
  sm: 576,   // Small devices (landscape phones)
  md: 768,   // Medium devices (tablets)
  lg: 992,   // Large devices (desktops)
  xl: 1200,  // Extra large devices (large desktops)
  xxl: 1400  // Extra extra large devices
};
```

### Accessibility Requirements

All components must:

1. Include proper ARIA attributes
2. Support keyboard navigation
3. Have sufficient color contrast
4. Include focus indicators
5. Support screen readers

Example:
```javascript
bw.makeButton = function(text, options) {
  const opts = Object.assign({
    variant: "primary",
    disabled: false,
    ariaLabel: text
  }, options);
  
  return {
    t: "button",
    a: {
      class: `bw-btn bw-btn-${opts.variant}`,
      disabled: opts.disabled,
      "aria-label": opts.ariaLabel,
      "aria-disabled": opts.disabled ? "true" : undefined,
      role: "button",
      tabindex: opts.disabled ? "-1" : "0"
    },
    c: text
  };
};
```

### Performance Considerations

1. **Lazy Loading**: Components should only initialize when needed
2. **Event Delegation**: Use event delegation for repeated elements
3. **Debouncing**: Debounce expensive operations (search, resize)
4. **Virtual Scrolling**: For large lists, implement virtual scrolling
5. **CSS Containment**: Use CSS containment for better performance

### Example Implementation: Table Component

Here's a complete example of how `bw.makeTable` would be implemented:

```javascript
bw.makeTable = function(data, options) {
  // Generate unique ID
  const uuid = bw.uuid();
  const tableClass = `bw-uuid-${uuid}`;
  
  // Process options
  const opts = Object.assign({
    headers: null,
    useFirstRowAsHeaders: true,
    sortable: true,
    filterable: false,
    paginate: false,
    pageSize: 10,
    striped: true,
    hover: true,
    responsive: true,
    emptyMessage: "No data available",
    onSort: null,
    onRowClick: null
  }, options);
  
  // Process data
  let headers = opts.headers;
  let rows = data;
  
  if (!headers && opts.useFirstRowAsHeaders && data.length > 0) {
    headers = data[0];
    rows = data.slice(1);
  }
  
  // State
  const state = {
    sortColumn: -1,
    sortDirection: 'asc',
    currentPage: 0,
    filterQuery: ''
  };
  
  // Build table TACO
  const taco = {
    t: "div",
    a: { 
      class: `bw-table-wrapper ${tableClass} ${opts.responsive ? 'bw-table-responsive' : ''}`.trim()
    },
    c: [
      // Filter input (if enabled)
      opts.filterable && {
        t: "div",
        a: { class: "bw-table-filter" },
        c: {
          t: "input",
          a: {
            type: "text",
            placeholder: "Search...",
            class: "bw-form-control",
            oninput: function() {
              state.filterQuery = this.value;
              updateTable();
            }
          }
        }
      },
      
      // Table
      {
        t: "table",
        a: {
          class: [
            "bw-table",
            opts.striped && "bw-table-striped",
            opts.hover && "bw-table-hover"
          ].filter(Boolean).join(" ")
        },
        c: [
          // Header
          headers && {
            t: "thead",
            c: {
              t: "tr",
              c: headers.map((header, idx) => ({
                t: "th",
                a: opts.sortable ? {
                  class: "bw-sortable",
                  onclick: function() {
                    if (state.sortColumn === idx) {
                      state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
                    } else {
                      state.sortColumn = idx;
                      state.sortDirection = 'asc';
                    }
                    updateTable();
                  },
                  style: { cursor: "pointer", userSelect: "none" }
                } : {},
                c: [
                  header,
                  opts.sortable && {
                    t: "span",
                    a: { class: "bw-sort-indicator" },
                    c: state.sortColumn === idx 
                      ? (state.sortDirection === 'asc' ? ' ▲' : ' ▼')
                      : ' ↕'
                  }
                ].filter(Boolean)
              }))
            }
          },
          
          // Body
          {
            t: "tbody",
            c: rows.length > 0 
              ? rows.map((row, rowIdx) => ({
                  t: "tr",
                  a: opts.onRowClick ? {
                    onclick: () => opts.onRowClick(row, rowIdx),
                    style: { cursor: "pointer" }
                  } : {},
                  c: (Array.isArray(row) ? row : Object.values(row)).map(cell => ({
                    t: "td",
                    c: typeof cell === 'object' && cell.t ? cell : String(cell)
                  }))
                }))
              : [{
                  t: "tr",
                  c: {
                    t: "td",
                    a: { 
                      colspan: headers ? headers.length : 1,
                      class: "bw-text-center bw-text-muted"
                    },
                    c: opts.emptyMessage
                  }
                }]
          }
        ]
      },
      
      // Pagination (if enabled)
      opts.paginate && {
        t: "div",
        a: { class: "bw-table-pagination" },
        c: [
          {
            t: "button",
            a: {
              class: "bw-btn bw-btn-sm",
              disabled: state.currentPage === 0,
              onclick: () => {
                state.currentPage--;
                updateTable();
              }
            },
            c: "Previous"
          },
          {
            t: "span",
            a: { class: "bw-pagination-info" },
            c: `Page ${state.currentPage + 1}`
          },
          {
            t: "button",
            a: {
              class: "bw-btn bw-btn-sm",
              onclick: () => {
                state.currentPage++;
                updateTable();
              }
            },
            c: "Next"
          }
        ]
      }
    ].filter(Boolean),
    o: {
      state: state,
      mounted: function(el) {
        // Store reference for updates
        el._bwTableUpdate = updateTable;
      },
      unmount: function(el) {
        // Cleanup
        delete el._bwTableUpdate;
      }
    }
  };
  
  // Update function (would be implemented to update DOM)
  function updateTable() {
    // This would update the table based on current state
    // In real implementation, this would manipulate the DOM
  }
  
  return taco;
};
```

## v1 to v2 Component Migration

### Grid System
```javascript
// v1 - Manual HTML structure
{ t: "div", a: { class: "bw-row" }, c: [
  { t: "div", a: { class: "bw-col-4" }, c: "Column 1" },
  { t: "div", a: { class: "bw-col-4" }, c: "Column 2" },
  { t: "div", a: { class: "bw-col-4" }, c: "Column 3" }
]}

// v2 - Component with automatic spacing
bw.makeRow({
  children: [
    bw.makeCol({ span: 4, children: "Column 1" }),
    bw.makeCol({ span: 4, children: "Column 2" }),
    bw.makeCol({ span: 4, children: "Column 3" })
  ],
  gap: "1rem", // Automatic spacing
  align: "stretch" // All columns same height
});
```

### Tables
```javascript
// v1
bw.htmlTable(data, { sortable: true });

// v2 - Enhanced with modern features
bw.makeTable(data, {
  sortable: true,
  filterable: true,
  paginate: true,
  striped: true,
  hover: true,
  responsive: true, // Mobile-friendly
  emptyMessage: "No data available"
});
```

### Tabs
```javascript
// v1
bw.htmlTabs([
  ["Tab1", "Content 1"],
  ["Tab2", "Content 2"],
  ["Tab3", "Content 3"]
]);

// v2 - Richer API with icons and callbacks
bw.makeTabs([
  { label: "Tab 1", icon: "📊", content: "Content 1" },
  { label: "Tab 2", icon: "📈", content: "Content 2" },
  { label: "Tab 3", icon: "📉", content: "Content 3", disabled: false }
], {
  variant: "pills", // Modern pill-style tabs
  fullWidth: true,
  onChange: (index, tab) => console.log('Tab changed:', tab)
});
```

### Lorem Ipsum
```javascript
// v1
bw.loremIpsum(200);

// v2 - Component wrapper with typography options
bw.makeText({
  content: bw.loremIpsum(200),
  variant: "lead", // Typography variant
  align: "justify",
  className: "bw-mb-3" // Spacing utility
});
```

### Signs/Jumbotrons
```javascript
// v1 - bw.htmlSign()
bw.htmlSign("This is a big sign!");

// v2 - Modern hero/jumbotron component
bw.makeHero({
  title: "This is a big sign!",
  subtitle: "With optional subtitle",
  size: "lg", // sm, md, lg, xl
  align: "center",
  background: "gradient", // or image URL
  cta: {
    text: "Learn More",
    href: "#more",
    variant: "primary"
  }
});
```

### Favicon Generation
```javascript
// v1
bw.htmlFavicon("♫", "teal");

// v2 - Returns proper favicon TACO
bw.makeFavicon({
  text: "♫",
  background: "teal",
  type: "emoji" // or "letter", "svg"
});
```

## Complete Component List Summary

The Bitwrench v2 component library provides 30+ components covering:

1. **Data Display**: Tables, Lists, Cards, Trees, Charts
2. **Navigation**: Navbar, Tabs, Breadcrumbs, Pagination, Sidebar
3. **Forms**: Inputs, Selects, Checkboxes, Radio buttons, File uploads
4. **Interactive**: Modals, Tooltips, Dropdowns, Accordions, Carousels
5. **Layout**: Grid, Container, Row/Column, Spacers
6. **Feedback**: Alerts, Toasts, Progress bars, Spinners
7. **Utility**: Badges, Buttons, Icons, Dividers

Each component is:
- **Zero-dependency**: Pure JavaScript, no external libraries
- **Accessible**: WCAG 2.1 AA compliant
- **Responsive**: Mobile-first design
- **Themeable**: CSS variables for easy customization
- **Performant**: Optimized for speed and memory usage
- **Developer-friendly**: Simple API with sensible defaults

## Pure JavaScript Approach: No External CSS

Bitwrench's philosophy is that everything comes from JavaScript. Here's how components handle all styling internally:

```javascript
// Complete button implementation with all styles
bw.makeButton = function(text, options) {
  const theme = bw.theme;
  const uuid = bw.uuid();
  
  const opts = Object.assign({
    variant: "primary",
    size: "md",
    disabled: false,
    block: false,
    margin: theme.components.margin
  }, options);
  
  // Size mappings
  const sizes = {
    sm: { padding: `${theme.spacing.xs} ${theme.spacing.sm}`, fontSize: theme.typography.fontSize.sm },
    md: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, fontSize: theme.typography.fontSize.base },
    lg: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, fontSize: theme.typography.fontSize.lg }
  };
  
  // Variant colors
  const variants = {
    primary: { bg: theme.colors.primary, color: theme.colors.white, border: theme.colors.primary },
    secondary: { bg: theme.colors.secondary, color: theme.colors.white, border: theme.colors.secondary },
    danger: { bg: theme.colors.danger, color: theme.colors.white, border: theme.colors.danger }
  };
  
  const variant = variants[opts.variant] || variants.primary;
  const size = sizes[opts.size] || sizes.md;
  
  return {
    t: "button",
    a: {
      class: `bw-btn bw-uuid-${uuid}`,
      disabled: opts.disabled,
      style: {
        // Spacing
        padding: size.padding,
        marginBottom: opts.margin,
        
        // Typography
        fontFamily: theme.typography.fontFamily,
        fontSize: size.fontSize,
        lineHeight: theme.typography.lineHeight,
        
        // Colors
        backgroundColor: variant.bg,
        color: variant.color,
        border: `1px solid ${variant.border}`,
        
        // Appearance
        borderRadius: theme.borders.radius.base,
        cursor: opts.disabled ? "not-allowed" : "pointer",
        opacity: opts.disabled ? 0.6 : 1,
        transition: "all 0.15s ease-in-out",
        
        // Layout
        display: opts.block ? "flex" : "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.sm,
        width: opts.block ? "100%" : "auto"
      },
      onmouseover: function() {
        if (!opts.disabled) {
          this.style.opacity = "0.85";
          this.style.transform = "translateY(-1px)";
        }
      },
      onmouseout: function() {
        if (!opts.disabled) {
          this.style.opacity = "1";
          this.style.transform = "translateY(0)";
        }
      }
    },
    c: text
  };
};

// Smart spacing: Components detect their context
bw.makeSmartComponent = function(content, options) {
  const theme = bw.theme;
  const uuid = bw.uuid();
  
  return {
    t: "div",
    a: {
      class: `bw-component bw-uuid-${uuid}`,
      style: {
        marginBottom: theme.components.margin
      }
    },
    c: content,
    o: {
      mounted: function(el) {
        // Remove margin if last child
        if (!el.nextElementSibling) {
          el.style.marginBottom = "0";
        }
        
        // Remove margin if in flex/grid container
        const parent = el.parentElement;
        if (parent) {
          const parentDisplay = window.getComputedStyle(parent).display;
          if (parentDisplay === "flex" || parentDisplay === "grid") {
            el.style.marginBottom = "0";
          }
        }
      }
    }
  };
};
```

### Benefits of the Pure JavaScript Approach

1. **No External Dependencies**: Everything is self-contained
2. **Dynamic Theming**: Change theme at runtime without reloading CSS
3. **Component Intelligence**: Components can adapt based on context
4. **Smaller Footprint**: Only generate styles for components you use
5. **Better Performance**: No CSS parsing, direct style application

### Example: Complete Page with Zero External CSS

```javascript
// Everything including layout comes from JavaScript
const app = bw.makeContainer({
  children: [
    bw.makeNav({
      brand: "My App",
      items: [
        { text: "Home", href: "/" },
        { text: "About", href: "/about" }
      ]
    }),
    
    bw.makeGrid({
      columns: 3,
      gap: bw.theme.spacing.lg,
      children: [
        bw.makeCard({
          title: "Feature 1",
          content: "Description",
          footer: bw.makeButton("Learn More")
        }),
        bw.makeCard({
          title: "Feature 2", 
          content: "Description",
          footer: bw.makeButton("Learn More")
        }),
        bw.makeCard({
          title: "Feature 3",
          content: "Description",
          footer: bw.makeButton("Learn More")
        })
      ]
    })
  ]
});

// Render with all styles included
bw.render("#app", app);
```

This ensures that:
1. Components never overlap or butt against each other
2. Spacing is consistent and predictable  
3. Components look professional without ANY external CSS
4. Layout adapts properly in different containers
5. Everything is customizable through JavaScript