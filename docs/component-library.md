# Component Library

Bitwrench ships over 50 `make*()` factory functions. Each takes a props object and returns a TACO — a plain JavaScript object that describes UI. No DOM elements are created until you pass the result to `bw.DOM()` or `bw.html()`.

```javascript
// Every factory works the same way
var card = bw.makeCard({ title: 'Hello', content: 'World' });

// The result is a plain object — not a DOM element
typeof card;  // 'object'
card.t;       // 'div'

// Render it however you want
bw.DOM('#app', card);        // mount to DOM
var html = bw.html(card);    // or get HTML string
```

> **Coming from React?** Each `make*()` function is like a React component that returns JSX — except it returns a plain object instead of a virtual DOM node, and there is no build step.

> **Coming from Bootstrap?** The factory functions replace Bootstrap's HTML class conventions. Instead of memorizing `<div class="card"><div class="card-body">...`, you write `bw.makeCard({ title, content })` and the correct markup is generated for you.

---

## Layout

### makeContainer

Centered page container.

```javascript
bw.makeContainer({
  fluid: false,      // true = full width, false = max-width centered
  children: [...],   // content (TACO or array of TACOs)
  className: ''
})
```

### makeRow

Flexbox row for grid layouts.

```javascript
bw.makeRow({
  children: [...],   // array of makeCol() TACOs
  gap: 3,            // gap size (1-5)
  className: ''
})
```

### makeCol

Responsive grid column.

```javascript
bw.makeCol({
  size: 6,                          // fixed: 1-12
  // or responsive:
  size: { xs: 12, sm: 6, md: 4, lg: 3 },
  offset: 0,                        // column offset (1-12)
  content: 'Text or TACO',          // alias for children
  children: [...],
  className: ''
})
```

### makeStack

Flexbox stack (vertical or horizontal).

```javascript
bw.makeStack({
  children: [...],
  direction: 'vertical',   // 'vertical' or 'horizontal'
  gap: 3,                  // gap size (1-8)
  className: ''
})
```

**Grid example:**

```javascript
bw.DOM('#app', bw.makeContainer({
  children: bw.makeRow({ gap: 4, children: [
    bw.makeCol({ size: { md: 4 }, children: bw.makeCard({ title: 'One' }) }),
    bw.makeCol({ size: { md: 4 }, children: bw.makeCard({ title: 'Two' }) }),
    bw.makeCol({ size: { md: 4 }, children: bw.makeCard({ title: 'Three' }) })
  ]})
}));
```

---

## Content

### makeCard

Content card with optional header, footer, image, and variants.

```javascript
bw.makeCard({
  title: 'Title',
  subtitle: 'Subtitle',
  content: 'Body text or TACO',
  footer: 'Footer text',
  header: 'Header text',
  image: { src: 'photo.jpg', alt: 'Description' },
  imagePosition: 'top',     // 'top' | 'bottom' | 'left' | 'right'
  variant: 'primary',       // color variant
  bordered: true,
  shadow: 'md',              // 'none' | 'sm' | 'md' | 'lg'
  hoverable: false,          // add hover shadow effect
  className: '',
  style: ''
})
```

### makeAlert

Dismissible notification banner.

```javascript
bw.makeAlert({
  title: 'Warning',         // optional bold title
  content: 'Check your input.',
  variant: 'warning',       // 'info' | 'success' | 'warning' | 'danger'
  dismissible: true,        // show close button
  className: ''
})
```

### makeBadge

Small status indicator.

```javascript
bw.makeBadge({
  text: 'New',
  variant: 'primary',
  pill: false,               // rounded pill shape
  className: ''
})
```

### makeProgress

Progress bar with optional animation.

```javascript
bw.makeProgress({
  value: 65,
  max: 100,
  variant: 'primary',
  striped: false,
  animated: false,
  label: '65%',             // text inside the bar
  height: ''                // custom height
})
```

### makeStatCard

Statistic display with change indicator.

```javascript
bw.makeStatCard({
  value: 1234,
  label: 'Active Users',
  change: 12.5,             // positive = green arrow up, negative = red arrow down
  format: 'number',         // 'number' | 'currency' | 'percent'
  prefix: '',                // e.g. '$'
  suffix: '',                // e.g. '%'
  icon: '',
  variant: '',
  className: '',
  style: ''
})

// String shorthand:
bw.makeStatCard('Active Users')  // creates card with label only
```

### makeMediaObject

Image and text side-by-side.

```javascript
bw.makeMediaObject({
  src: 'avatar.jpg',
  alt: '',
  title: 'User Name',
  content: 'Description text',
  reverse: false,           // image on right instead of left
  imageSize: '3rem',
  className: ''
})
```

### makeTimeline

Vertical timeline with event markers.

```javascript
bw.makeTimeline({
  items: [
    { title: 'Event 1', content: 'Details...', date: '2026-01-15', variant: 'success' },
    { title: 'Event 2', content: 'Details...', date: '2026-02-01', variant: 'info' }
  ],
  className: ''
})
```

### makeStepper

Multi-step wizard indicator.

```javascript
bw.makeStepper({
  steps: ['Account', 'Profile', 'Review', 'Confirm'],
  currentStep: 1,           // 0-indexed; completed steps show checkmarks
  className: ''
})
```

---

## Navigation

### makeNav

Tab or pill navigation.

```javascript
bw.makeNav({
  items: [
    { text: 'Home', href: '#', active: true },
    { text: 'About', href: '#' },
    { text: 'Contact', href: '#', disabled: true }
  ],
  pills: false,             // pill style instead of tabs
  vertical: false,
  className: ''
})
```

### makeNavbar

Responsive navigation bar with brand and collapsible menu.

```javascript
bw.makeNavbar({
  brand: 'My App',
  brandHref: '#',
  items: [
    { text: 'Home', href: '#', active: true },
    { text: 'Docs', href: '#' }
  ],
  dark: true,                // dark background
  className: ''
})
```

### makeTabs

Tabbed content panels with click switching.

```javascript
bw.makeTabs({
  tabs: [
    { label: 'Tab 1', content: 'Panel 1 content' },
    { label: 'Tab 2', content: { t: 'div', c: 'Panel 2 TACO' } },
    { label: 'Tab 3', content: 'Panel 3 content' }
  ],
  activeIndex: 0
})
```

### makeBreadcrumb

Navigation breadcrumb trail.

```javascript
bw.makeBreadcrumb({
  items: [
    { text: 'Home', href: '#' },
    { text: 'Products', href: '#' },
    { text: 'Widget', active: true }    // active = no link
  ]
})
```

### makePagination

Page navigation control.

```javascript
bw.makePagination({
  pages: 10,
  currentPage: 3,
  onPageChange: function(page) { /* load page data */ },
  size: '',                  // 'sm' or 'lg'
  className: ''
})
```

---

## Buttons

### makeButton

Standard button with variants.

```javascript
bw.makeButton({
  text: 'Click Me',
  variant: 'primary',       // 'primary' | 'secondary' | 'success' | 'danger' |
                             // 'warning' | 'info' | 'light' | 'dark' |
                             // 'outline-primary' | 'outline-secondary' | ...
  size: '',                  // 'sm' or 'lg'
  disabled: false,
  onclick: function() {},
  type: 'button',           // 'button' | 'submit' | 'reset'
  className: '',
  style: ''
})

// String shorthand:
bw.makeButton('OK')  // primary button with text "OK"
```

### makeButtonGroup

Group of buttons with shared border-radius.

```javascript
bw.makeButtonGroup({
  children: [
    bw.makeButton({ text: 'Left' }),
    bw.makeButton({ text: 'Center' }),
    bw.makeButton({ text: 'Right' })
  ],
  size: '',                  // 'sm' or 'lg'
  vertical: false,
  className: ''
})
```

---

## Forms

### makeForm

Form wrapper with submit handler.

```javascript
bw.makeForm({
  children: [...],           // form controls
  onsubmit: function(e) { e.preventDefault(); },
  className: ''
})
```

### makeFormGroup

Label + input + help text wrapper.

```javascript
bw.makeFormGroup({
  label: 'Email',
  help: 'We will not share your email.',
  error: '',                 // error message (shows red)
  required: false,
  className: ''
})
```

### makeInput

Text input (supports all HTML5 types).

```javascript
bw.makeInput({
  type: 'text',             // 'text' | 'email' | 'password' | 'number' | 'url' | ...
  placeholder: '',
  value: '',
  id: '',
  name: '',
  disabled: false,
  readonly: false,
  required: false,
  className: '',
  style: '',
  oninput: function(e) {},
  onchange: function(e) {},
  onfocus: function(e) {},
  onblur: function(e) {}
})
```

### makeTextarea

Multi-line text input.

```javascript
bw.makeTextarea({
  placeholder: '',
  value: '',
  rows: 3,
  id: '',
  name: '',
  disabled: false,
  readonly: false,
  required: false,
  className: ''
})
```

### makeSelect

Dropdown select.

```javascript
bw.makeSelect({
  options: [
    { value: 'us', text: 'United States' },
    { value: 'uk', text: 'United Kingdom' },
    { value: 'ca', text: 'Canada' }
  ],
  value: 'us',              // pre-selected value
  id: '',
  name: '',
  disabled: false,
  required: false,
  className: '',
  onchange: function(e) {}
})
```

### makeCheckbox

Checkbox with label.

```javascript
bw.makeCheckbox({
  label: 'I agree to the terms',
  checked: false,
  id: '',
  name: '',
  disabled: false,
  value: '',
  className: ''
})
```

### makeRadio

Radio button.

```javascript
bw.makeRadio({
  label: 'Option A',
  name: 'choice',           // group name
  value: 'a',
  checked: false,
  id: '',
  disabled: false,
  className: ''
})
```

### makeSwitch

Toggle switch (styled checkbox).

```javascript
bw.makeSwitch({
  label: 'Enable notifications',
  checked: false,
  id: '',
  name: '',
  disabled: false,
  className: ''
})
```

### makeRange

Range slider.

```javascript
bw.makeRange({
  min: 0,
  max: 100,
  step: 1,
  value: 50,
  label: 'Volume',
  showValue: false,          // show current value next to slider
  id: '',
  name: '',
  disabled: false,
  className: ''
})
```

### makeSearchInput

Search box with clear button.

```javascript
bw.makeSearchInput({
  placeholder: 'Search...',
  value: '',
  onSearch: function(query) {},   // called on Enter
  onInput: function(e) {},         // called on each keystroke
  id: '',
  name: '',
  className: ''
})

// String shorthand:
bw.makeSearchInput('Search products...')
```

### makeChipInput

Tag/chip input with add/remove.

```javascript
bw.makeChipInput({
  chips: ['JavaScript', 'CSS'],
  placeholder: 'Add tag...',
  onAdd: function(text) {},
  onRemove: function(text) {},
  className: ''
})
```

### makeFileUpload

Drag-and-drop file upload zone.

```javascript
bw.makeFileUpload({
  accept: '.pdf,.doc',       // file type filter
  multiple: false,
  onFiles: function(files) {},
  text: 'Drop files here or click to browse',
  id: '',
  className: ''
})
```

---

## Interactive

### makeAccordion

Collapsible content sections.

```javascript
bw.makeAccordion({
  items: [
    { title: 'Section 1', content: 'Content here...', open: true },
    { title: 'Section 2', content: 'More content...' },
    { title: 'Section 3', content: { t: 'div', c: 'TACO content' } }
  ],
  multiOpen: false,          // allow multiple sections open at once
  className: ''
})
```

### makeModal

Dialog overlay.

```javascript
bw.makeModal({
  title: 'Confirm Action',
  content: 'Are you sure?',
  footer: bw.makeButtonGroup({ children: [
    bw.makeButton({ text: 'Cancel', variant: 'secondary' }),
    bw.makeButton({ text: 'Confirm', variant: 'danger' })
  ]}),
  size: '',                  // 'sm' | 'lg' | 'xl'
  closeButton: true,         // show X in header
  onClose: function() {},
  className: ''
})
```

### makeToast

Toast notification.

```javascript
bw.makeToast({
  title: 'Success',
  content: 'Your file was saved.',
  variant: 'success',
  autoDismiss: true,
  delay: 5000,               // ms before auto-dismiss
  position: 'top-right',    // 'top-left' | 'top-center' | 'top-right' |
                             // 'bottom-left' | 'bottom-center' | 'bottom-right'
  className: ''
})
```

### makeDropdown

Click-triggered dropdown menu.

```javascript
bw.makeDropdown({
  trigger: 'Actions',       // string or button TACO
  items: [
    { text: 'Edit', onclick: function() {} },
    { text: 'Duplicate', onclick: function() {} },
    { divider: true },
    { text: 'Delete', onclick: function() {}, disabled: false }
  ],
  align: 'start',           // 'start' | 'end'
  variant: 'primary',
  className: ''
})
```

### makeCarousel

Image carousel with controls and indicators.

```javascript
bw.makeCarousel({
  items: [
    { src: 'slide1.jpg', alt: 'Slide 1', caption: 'First slide' },
    { src: 'slide2.jpg', alt: 'Slide 2', caption: 'Second slide' }
  ],
  showControls: true,
  showIndicators: true,
  autoPlay: false,
  interval: 5000,            // ms between auto-advance
  height: '300px',
  startIndex: 0,
  className: ''
})
```

---

## Overlays

### makeTooltip

Hover/focus tooltip.

```javascript
bw.makeTooltip({
  content: bw.makeButton({ text: 'Hover me' }),   // the trigger element
  text: 'Tooltip text',
  placement: 'top',         // 'top' | 'bottom' | 'left' | 'right'
  className: ''
})
```

### makePopover

Click-triggered rich popover.

```javascript
bw.makePopover({
  trigger: bw.makeButton({ text: 'Info' }),
  title: 'Details',
  content: 'Extended information here...',
  placement: 'top',         // 'top' | 'bottom' | 'left' | 'right'
  className: ''
})
```

---

## Loading & Placeholder

### makeSpinner

Loading spinner.

```javascript
bw.makeSpinner({
  variant: 'primary',
  size: 'md',               // 'sm' | 'md' | 'lg'
  type: 'border'            // 'border' | 'grow'
})
```

### makeSkeleton

Content placeholder (loading state).

```javascript
bw.makeSkeleton({
  variant: 'text',          // 'text' | 'circle' | 'rect'
  width: '',
  height: '',
  count: 1,                 // number of text lines
  className: ''
})
```

### makeAvatar

User avatar (image or initials).

```javascript
bw.makeAvatar({
  src: 'photo.jpg',         // image URL
  alt: '',
  initials: 'AC',           // fallback when no src
  size: 'md',               // 'sm' | 'md' | 'lg' | 'xl'
  variant: 'primary',       // background color for initials
  className: ''
})
```

---

## Page-Level Components

### makeHero

Hero section with optional background image.

```javascript
bw.makeHero({
  title: 'Welcome',
  subtitle: 'Build fast, ship faster.',
  content: '',               // additional TACO content
  variant: 'primary',        // background color
  size: 'lg',                // 'sm' | 'md' | 'lg' | 'xl'
  centered: true,
  backgroundImage: '',       // URL for bg image
  overlay: false,            // dark overlay for text readability
  actions: [                 // array of button TACOs
    bw.makeButton({ text: 'Get Started', variant: 'light', size: 'lg' })
  ],
  className: ''
})
```

### makeSection

Semantic content section.

```javascript
bw.makeSection({
  title: 'Features',
  subtitle: 'What we offer',
  content: 'Text or TACO',
  variant: 'default',
  spacing: 'md',            // vertical padding
  className: ''
})
```

### makeFeatureGrid

Grid of feature cards with icons.

```javascript
bw.makeFeatureGrid({
  features: [
    { icon: '⚡', title: 'Fast', description: 'Sub-second rendering' },
    { icon: '📦', title: 'Small', description: 'Zero dependencies' },
    { icon: '🔧', title: 'Flexible', description: 'Works everywhere' }
  ],
  columns: 3,
  centered: true,
  iconSize: '3rem',
  className: ''
})
```

### makeCTA

Call-to-action section.

```javascript
bw.makeCTA({
  title: 'Ready to get started?',
  description: 'Join thousands of developers.',
  actions: [
    bw.makeButton({ text: 'Sign Up Free', variant: 'primary', size: 'lg' })
  ],
  variant: 'light',
  centered: true,
  className: ''
})
```

### makeCodeDemo

Code example with preview.

```javascript
bw.makeCodeDemo({
  title: 'Button Example',
  description: 'A simple button.',
  code: 'bw.makeButton({ text: "Click" })',
  result: bw.makeButton({ text: 'Click' }),
  language: 'javascript'
})
```

---

## Tables & Data

### makeTable

Sortable data table from an array of objects. Supports row selection, custom cell rendering, and pagination.

```javascript
bw.makeTable({
  data: [
    { name: 'Alice', age: 30, role: 'Engineer' },
    { name: 'Bob', age: 25, role: 'Designer' }
  ],
  columns: [                 // optional — auto-detected from data keys
    { key: 'name', label: 'Name' },
    { key: 'age', label: 'Age' },
    { key: 'role', label: 'Role' }
  ],
  sortable: true,            // click column headers to sort
  striped: false,
  hover: false,
  selectable: false,         // click rows to toggle selection
  onRowClick: null,          // function(row, index, event) — fires on row click
  pageSize: undefined,       // set to enable pagination (e.g. 10)
  currentPage: 1,            // current page (1-based)
  onPageChange: null,        // function(newPage) — fires on page navigation
  className: ''
})
```

**Cell renderers** — each column definition can include a `render` function for custom cell rendering. The function receives the cell value and the full row object, and can return a string or TACO:

```javascript
bw.makeTable({
  data: users,
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status', render: function(val, row) {
      return bw.makeBadge({ text: val, variant: val === 'active' ? 'success' : 'danger' });
    }},
    { key: 'age', label: 'Age', render: function(val) {
      return val >= 18 ? String(val) : bw.raw('<em>' + val + '</em>');
    }}
  ]
})
```

**Row selection** — enables click-to-select with visual feedback:

```javascript
bw.makeTable({
  data: users,
  selectable: true,
  onRowClick: function(row, index, event) {
    console.log('Selected:', row.name, 'at index', index);
  }
})
```

Clicking a row toggles the `bw_table_row_selected` CSS class. The `selectable` flag also enables hover highlighting automatically.

**Pagination** — set `pageSize` to limit visible rows:

```javascript
var page = 1;
function renderTable() {
  bw.DOM('#table', bw.makeTable({
    data: allData,        // full dataset — makeTable slices internally
    pageSize: 10,
    currentPage: page,
    onPageChange: function(newPage) {
      page = newPage;
      renderTable();      // re-render with new page
    }
  }));
}
renderTable();
```

When `pageSize` is set, the table is wrapped in a container with Prev/Next controls and a page indicator. The `onRowClick` index is the global index into the full dataset, not the page-local index.
```

### makeTableFromArray

Table from 2D arrays (CSV data, spreadsheets).

```javascript
bw.makeTableFromArray({
  data: [
    ['Name', 'Age', 'Role'],   // first row = headers
    ['Alice', 30, 'Engineer'],
    ['Bob', 25, 'Designer']
  ],
  headerRow: true,            // default true; false = auto-generate col0, col1, ...
  striped: true,
  hover: true,
  sortable: true
})
```

### makeDataTable

Convenience wrapper with title and responsive scrolling.

```javascript
bw.makeDataTable({
  title: 'Team Members',
  data: [...],
  columns: [...],
  responsive: true,          // wraps in scrollable div
  striped: true,
  hover: true
})
```

### makeBarChart

Vertical bar chart (pure CSS, no external library).

```javascript
bw.makeBarChart({
  data: [
    { label: 'Jan', value: 4200 },
    { label: 'Feb', value: 5100 },
    { label: 'Mar', value: 3800 }
  ],
  labelKey: 'label',
  valueKey: 'value',
  title: 'Monthly Revenue',
  color: '#006666',
  height: '200px',
  formatValue: function(v) { return '$' + (v/1000).toFixed(1) + 'k'; },
  showValues: true,
  showLabels: true,
  className: ''
})
```

---

## Factory dispatcher

The `bw.make()` function dispatches to any factory by type name:

```javascript
bw.make('card', { title: 'Hello' });
// equivalent to: bw.makeCard({ title: 'Hello' })

bw.make('button', { text: 'OK', variant: 'primary' });
// equivalent to: bw.makeButton({ text: 'OK', variant: 'primary' })
```

This enables data-driven component creation:

```javascript
var layout = [
  { type: 'card', props: { title: 'Stats', content: '42' } },
  { type: 'alert', props: { content: 'Warning!', variant: 'warning' } },
  { type: 'button', props: { text: 'Action' } }
];

bw.DOM('#app', {
  t: 'div',
  c: layout.map(function(item) { return bw.make(item.type, item.props); })
});
```

List available types with `Object.keys(bw.BCCL)`.

---

## Color variants

Most components accept a `variant` prop. The available variants are:

| Variant | Description |
|---------|-------------|
| `primary` | Brand color (default for most components) |
| `secondary` | Secondary accent |
| `success` | Positive action or status |
| `danger` | Destructive action or error |
| `warning` | Caution or attention needed |
| `info` | Informational |
| `light` | Light background |
| `dark` | Dark background |

Buttons also support outline variants: `outline-primary`, `outline-secondary`, etc.

## Composition

Because every factory returns a TACO object, you compose components with standard JavaScript:

```javascript
// Functions as component factories
function userRow(user) {
  return {
    t: 'div', a: { class: 'bw-card' }, c: [
      bw.makeAvatar({ initials: user.name[0], size: 'sm' }),
      { t: 'span', c: user.name },
      bw.makeBadge({ text: user.role, variant: 'info' })
    ]
  };
}

// Arrays for lists
var userList = users.map(userRow);
bw.DOM('#app', { t: 'div', c: userList });

// Conditionals for branching
var content = hasData
  ? bw.makeTable({ data: rows })
  : bw.makeAlert({ content: 'No data available', variant: 'info' });
```

See [TACO Format](taco-format.md) for more composition patterns.
