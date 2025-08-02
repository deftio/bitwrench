# Bitwrench v2 R2 Examples

This directory contains comprehensive examples demonstrating the new Bitwrench v2 architecture with TACO (Tag-Attributes-Content-Options) and SRMC (Selector-Rules-Media-Children) patterns.

## Running the Examples

The examples reference the built library files in `../dist/`. To run them:

### Option 1: Use the provided server (recommended)
```bash
# From the project root directory
npm run serve
# Or for build + serve:
npm run dev
```
Then open http://localhost:8080/examples_v2r2/

### Option 2: Run server from examples_v2r2 directory
```bash
# From examples_v2r2 directory
python3 -m http.server 8081
# Or
npx http-server -p 8081
```
Note: A local `dist/` folder has been created with copies of the built files.

### Option 3: Use any static server from project root
```bash
# From project root
python3 -m http.server 8080
# Or
npx http-server -p 8080
```

### Option 4: Use file:// protocol
Open the HTML files directly in your browser. Note: Some features may be limited due to CORS restrictions.

## Important: Build First!
Make sure to build the library before viewing examples:
```bash
npm run build
```

## Available Examples

### 1. Basic Components (`01-basic-components.html`)
Comprehensive showcase of all UI components:
- Cards with variants and interactions
- Navigation components (navbar, tabs, breadcrumb)
- Grid system with responsive layouts
- Buttons, alerts, badges, progress bars
- List groups and modals

### 2. Interactive Tables & Forms (`02-interactive-tables-forms.html`)
Data management and user input:
- Sortable tables with dynamic data
- Form components with validation
- Dynamic list management
- Interactive component handles

### 3. Themes & Styling (`03-themes-styling.html`)
Dynamic theming with SRMC:
- Pre-built themes (Light, Dark, Blue, Green, Sunset)
- Live theme switching
- Dynamic theme creator
- Component-specific styling

### 4. Dashboard Application (`04-dashboard-app.html`)
Complete single-page application:
- Multi-view navigation
- Real-time data updates
- Interactive charts (simulated)
- Component communication
- State management patterns

## Key Concepts

### TACO Format
```javascript
{
  t: 'div',                    // tag
  a: { class: 'my-class' },   // attributes
  c: 'Content',               // content
  o: { /* options */ }        // bitwrench options
}
```

### Three Rendering Modes
```javascript
// 1. HTML String (Legacy)
const html = bw.html(taco);

// 2. TACO Object (Pure Data)
const taco = bw.makeCard({ title: 'Hello' });

// 3. Live Component (Interactive)
const handle = bw.createCard({ title: 'Hello' });
```

### SRMC Format
```javascript
{
  s: '.selector',              // CSS selector
  r: { color: 'red' },        // CSS rules
  m: '@media (min-width: 768px)', // Media query
  c: [ /* children */ ]       // Nested rules
}
```

## Component Naming Convention

- `bw.htmlXXX()` - Returns HTML string (v1 compatibility)
- `bw.makeXXX()` - Returns TACO object (pure data)
- `bw.createXXX()` - Returns component handle (interactive)

## Browser Compatibility

These examples require a modern browser with ES6 support. For IE11 support, use the ES5 build:
```html
<script src="../dist/bitwrench.es5.min.js"></script>
```

## Development Tips

1. Open browser console to see debug information
2. All examples log useful data to console
3. Component handles expose methods for interaction
4. Use `bw.version` to check loaded version

## Next Steps

- Review the evaluation document at `/dev/bitwrench_v2_evaluation.md`
- Check the action plan at `/dev/bitwrench_v2_action_plan.md`
- See design documentation in `/dev/bitwrench_v2r2.md`