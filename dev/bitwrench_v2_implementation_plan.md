# Bitwrench v2 Implementation Plan

## Overview

This document outlines the implementation strategy for refactoring Bitwrench to v2, incorporating the TACO and SRMC engines while maintaining backward compatibility.

## Current State Analysis

### Existing Structure
- **Source**: Multiple files in `/src` including v2 prototype
- **Build**: Rollup-based with UMD, ESM, CJS outputs
- **Tests**: Mocha/Chai with Karma for browser testing
- **Version**: Currently at 2.0.0 (but still using v1 architecture)

### Key Challenges
1. Backward compatibility with v1 API
2. Module architecture for tree-shaking
3. Progressive enhancement strategy
4. Migration path for existing users
5. Build size constraints
6. IE8+ compatibility requirements

## Implementation Phases

### Phase 1: Core Engine Foundation (Week 1-2)

#### 1.1 TACO Engine
```javascript
// src/core/taco.js
export const taco = {
  // Core TACO processing
  render(taco, options) {},
  validate(taco) {},
  normalize(taco) {},
  
  // TACO manipulation
  create(tag, attrs, content) {},
  find(taco, selector) {},
  map(taco, transformer) {},
  
  // Conversion
  toHTML(taco) {},
  toDOM(taco) {},
  fromHTML(html) {}
};
```

#### 1.2 SRMC Engine
```javascript
// src/core/srmc.js
export const srmc = {
  // Core SRMC processing
  process(srmc) {},
  build(srmcArray) {},
  
  // SRMC manipulation
  create(selector, rules, media) {},
  merge(srmc1, srmc2) {},
  optimize(srmcArray) {},
  
  // Theme management
  themes: new Map(),
  register(name, srmc) {},
  get(name) {},
  customize(base, overrides) {}
};
```

#### 1.3 Component Handle System
```javascript
// src/core/component.js
export class ComponentHandle {
  constructor(element, type, options) {}
  
  // Lifecycle
  mount() {}
  unmount() {}
  destroy() {}
  
  // State management
  setState(updates) {}
  getState(key) {}
  
  // DOM operations
  select(selector) {}
  addClass(className) {}
  css(prop, value) {}
}
```

### Phase 2: Module Architecture (Week 2-3)

#### 2.1 Directory Structure
```
src/
├── core/
│   ├── taco.js         # TACO engine
│   ├── srmc.js         # SRMC engine
│   ├── component.js    # Component handle base
│   ├── dom.js          # DOM utilities
│   └── utils.js        # Core utilities
├── components/
│   ├── layout/
│   │   ├── container.js
│   │   ├── grid.js
│   │   └── stack.js
│   ├── content/
│   │   ├── card.js
│   │   ├── alert.js
│   │   └── badge.js
│   ├── form/
│   │   ├── input.js
│   │   ├── select.js
│   │   └── form.js
│   └── index.js        # Component registry
├── themes/
│   ├── default.srmc.js
│   ├── dark.srmc.js
│   └── index.js
├── legacy/
│   ├── v1-compat.js    # v1 API compatibility layer
│   └── html-gen.js     # Legacy HTML generation
├── bitwrench.js        # Main entry point
└── index.js            # Module exports
```

#### 2.2 Build Configuration Updates
```javascript
// rollup.config.js additions
export default [
  // Core library (no components)
  {
    input: 'src/bitwrench.js',
    output: {
      file: 'dist/bitwrench.core.js',
      format: 'esm'
    }
  },
  
  // Full bundle (with all components)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/bitwrench.full.js',
      format: 'umd',
      name: 'bw'
    }
  },
  
  // CSS-included bundle
  {
    input: 'src/bitwrench-with-css.js',
    output: {
      file: 'dist/bitwrench-with-css.js',
      format: 'umd',
      name: 'bw'
    }
  }
];
```

### Phase 3: Component Implementation (Week 3-5)

#### 3.1 Component Factory Pattern
```javascript
// src/components/factory.js
export function createComponent(name, definition) {
  // Register make function
  bw[`make${name}`] = definition.make;
  
  // Register create function
  bw[`create${name}`] = (props) => {
    const taco = definition.make(props);
    return bw.renderComponent(taco);
  };
  
  // Register handle class
  if (definition.Handle) {
    bw.handles[name] = definition.Handle;
  }
}
```

#### 3.2 Component Implementation Priority
1. **Core Layout**: Container, Row, Col, Stack
2. **Basic Content**: Card, Button, Alert
3. **Forms**: Input, Select, Form
4. **Navigation**: Navbar, Tabs
5. **Data Display**: Table, List
6. **Feedback**: Modal, Toast
7. **Advanced**: DataGrid, Calendar

#### 3.3 Component Template
```javascript
// src/components/content/card.js
import { ComponentHandle } from '../../core/component.js';

export class CardHandle extends ComponentHandle {
  setTitle(title) {
    this._safe('setTitle', () => {
      this.select('.bw-card-title').textContent = title;
    });
    return this;
  }
  
  setContent(content) {
    this._safe('setContent', () => {
      bw.DOM(this.select('.bw-card-body'), content);
    });
    return this;
  }
}

export const card = {
  make: (props = {}) => ({
    t: 'div',
    a: { 
      class: `bw-card ${props.className || ''}`,
      style: props.style
    },
    c: [
      props.title && {
        t: 'div',
        a: { class: 'bw-card-header' },
        c: { t: 'h3', a: { class: 'bw-card-title' }, c: props.title }
      },
      {
        t: 'div',
        a: { class: 'bw-card-body' },
        c: props.content || props.children
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
  }),
  
  Handle: CardHandle
};
```

### Phase 4: CSS System Implementation (Week 4-5)

#### 4.1 SRMC Theme Structure
```javascript
// src/themes/default.srmc.js
export const defaultTheme = {
  meta: {
    name: 'Bitwrench Default',
    version: '2.0.0'
  },
  variables: {
    colors: {
      primary: '#007bff',
      secondary: '#6c757d'
    },
    spacing: [0, 4, 8, 16, 24, 32]
  },
  rules: [
    // SRMC rules array
  ]
};
```

#### 4.2 CSS Build Process
```javascript
// src/build/generate-css.js
import { themes } from '../themes/index.js';
import { srmc } from '../core/srmc.js';

// Generate static CSS files
themes.forEach(theme => {
  const css = srmc.build(theme.rules);
  fs.writeFileSync(`dist/css/bw.${theme.name}.css`, css);
});

// Generate combined theme file
const allThemes = themes.map(theme => 
  srmc.build(theme.rules, { prefix: `.bw-theme-${theme.name}` })
).join('\n');
fs.writeFileSync('dist/css/bw.all.css', allThemes);
```

### Phase 5: Testing Strategy (Week 5-6)

#### 5.1 Test Structure
```
test/
├── unit/
│   ├── core/
│   │   ├── taco.test.js
│   │   ├── srmc.test.js
│   │   └── component.test.js
│   ├── components/
│   │   ├── card.test.js
│   │   └── table.test.js
│   └── legacy/
│       └── v1-compat.test.js
├── integration/
│   ├── rendering.test.js
│   └── themes.test.js
├── browser/
│   ├── ie8.test.js
│   └── modern.test.js
└── performance/
    ├── render.bench.js
    └── memory.bench.js
```

#### 5.2 Test Requirements
- Unit tests for all core functions
- Component behavior tests
- Browser compatibility tests (IE8+)
- Performance benchmarks
- Memory leak tests
- Visual regression tests

### Phase 6: Migration and Documentation (Week 6)

#### 6.1 Migration Guide
```javascript
// v1 to v2 migration examples
// Before (v1)
var table = bw.htmlTable(data);
document.getElementById('app').innerHTML = table;

// After (v2) - Option 1: Minimal change
var table = bw.html(bw.makeTable(data));
document.getElementById('app').innerHTML = table;

// After (v2) - Option 2: Full v2
const table = bw.createTable(data);
bw.DOM('#app', table);
table.sortBy('name');
```

#### 6.2 Documentation Structure
- Getting Started Guide
- Component Reference
- API Documentation
- Migration Guide
- Examples Gallery
- Performance Guide

## Implementation Concerns

### 1. Bundle Size Management
- **Target**: Core < 30KB, Full < 100KB (minified + gzipped)
- **Strategy**: 
  - Modular architecture for tree-shaking
  - Separate component bundles
  - CSS on-demand loading

### 2. Backward Compatibility
- **v1 API Layer**: Maintain all v1 functions
- **Deprecation Warnings**: Console warnings for v1 usage
- **Migration Tools**: Automated code migration script

### 3. Performance Targets
- **Initial Render**: < 16ms for 100 components
- **Re-render**: < 8ms for state updates
- **Memory**: < 1MB for 1000 components

### 4. Browser Support Matrix
| Feature | IE8 | IE9-10 | IE11 | Modern |
|---------|-----|--------|------|---------|
| Core TACO | ✓ | ✓ | ✓ | ✓ |
| Basic Components | ✓ | ✓ | ✓ | ✓ |
| Advanced Components | ✗ | Partial | ✓ | ✓ |
| Animations | ✗ | ✗ | Basic | ✓ |
| CSS Variables | ✗ | ✗ | ✗ | ✓ |

### 5. Development Workflow
1. **Feature Branches**: One branch per component
2. **CI/CD**: Automated testing on all browsers
3. **Code Review**: All PRs require review
4. **Performance Budget**: Automated size checks

## Risk Mitigation

### Technical Risks
1. **Bundle Size Explosion**
   - Mitigation: Aggressive tree-shaking, lazy loading
   
2. **IE8 Compatibility Issues**
   - Mitigation: Polyfills, progressive enhancement
   
3. **Performance Regression**
   - Mitigation: Automated benchmarks, profiling

### Project Risks
1. **Scope Creep**
   - Mitigation: Phased implementation, MVP first
   
2. **Breaking Changes**
   - Mitigation: Comprehensive v1 compatibility layer
   
3. **Adoption Friction**
   - Mitigation: Excellent docs, migration tools

## Success Criteria

1. **Functionality**: All v1 features work in v2
2. **Performance**: 2x faster than v1
3. **Size**: No more than 20% larger than v1
4. **Compatibility**: Works in IE8+
5. **Developer Experience**: Clear upgrade path
6. **Test Coverage**: > 90% code coverage

## Timeline Summary

- **Week 1-2**: Core engines (TACO, SRMC)
- **Week 2-3**: Module architecture
- **Week 3-5**: Component implementation
- **Week 4-5**: CSS system
- **Week 5-6**: Testing
- **Week 6**: Documentation & migration

Total: 6 weeks for MVP, 8-10 weeks for full implementation

## Module Architecture Decisions

### Core Module Boundaries

#### 1. Core Engine (~10KB)
```javascript
// Minimal core - no components, just engines
import { taco } from './core/taco.js';
import { srmc } from './core/srmc.js';
import { dom } from './core/dom.js';
import { ComponentHandle } from './core/component.js';

// Core can work standalone
const myUI = taco.create('div', { class: 'my-app' }, 'Hello');
document.body.innerHTML = taco.toHTML(myUI);
```

#### 2. Component Modules (5-10KB each)
```javascript
// Each component category is separate
import '@bitwrench/components-layout';  // +5KB
import '@bitwrench/components-form';    // +10KB
import '@bitwrench/components-data';    // +8KB

// Or individual components
import { card } from '@bitwrench/components/card';
import { table } from '@bitwrench/components/table';
```

#### 3. Theme Modules (10-20KB each)
```javascript
// Themes are separate from core
import '@bitwrench/theme-default';  // Includes SRMC data
import '@bitwrench/theme-dark';     // Just the differences

// Or load dynamically
bw.loadTheme('dark').then(() => {
  bw.setTheme('dark');
});
```

### Build Targets

```javascript
// dist/
├── core/
│   ├── bitwrench.core.js         // Just TACO/SRMC engines (10KB)
│   ├── bitwrench.core.min.js     
│   └── bitwrench.core.d.ts       // TypeScript definitions
├── components/
│   ├── layout.js                 // Layout components bundle
│   ├── forms.js                  // Form components bundle
│   ├── data.js                   // Data components bundle
│   └── all.js                    // All components
├── themes/
│   ├── default.css               // Compiled CSS
│   ├── default.srmc.json         // SRMC source
│   ├── dark.css
│   └── dark.srmc.json
├── bundles/
│   ├── bitwrench.js              // Core + all components (no CSS)
│   ├── bitwrench.min.js
│   ├── bitwrench-with-css.js     // Core + components + default theme
│   └── bitwrench-with-css.min.js
└── legacy/
    ├── bitwrench.v1.js           // v1 compatibility build
    └── bitwrench.v1.min.js
```

### Import Strategies

#### 1. CDN Usage (No Build Tool)
```html
<!-- Option 1: Everything -->
<script src="https://cdn.bitwrench.com/2.0/bitwrench-with-css.min.js"></script>

<!-- Option 2: Modular -->
<script src="https://cdn.bitwrench.com/2.0/core/bitwrench.core.min.js"></script>
<script src="https://cdn.bitwrench.com/2.0/components/layout.min.js"></script>
<link rel="stylesheet" href="https://cdn.bitwrench.com/2.0/themes/default.css">
```

#### 2. NPM with Bundler
```javascript
// Full import
import bw from 'bitwrench';

// Tree-shakeable imports
import { makeCard, makeTable } from 'bitwrench/components';
import { processSRMC } from 'bitwrench/css';

// Dynamic imports
const { DataGrid } = await import('bitwrench/components/data-grid');
```

#### 3. Deno/URL Imports
```javascript
import bw from 'https://deno.land/x/bitwrench@2.0/mod.js';
```

### Dependency Graph

```
bitwrench (main)
├── core/
│   ├── taco (no deps)
│   ├── srmc (no deps)
│   ├── dom (depends on: taco)
│   └── component (depends on: dom, taco)
├── components/
│   └── * (depends on: core)
├── themes/
│   └── * (depends on: srmc)
└── legacy/
    └── v1-compat (depends on: core, components)
```

## Next Steps

1. Review and approve plan
2. Set up development environment
3. Create feature branches
4. Begin Phase 1 implementation
5. Weekly progress reviews

## Decision Points Needed

1. **Monorepo vs Multi-package**: Single repo or separate packages?
2. **TypeScript**: Generate from JSDoc or write in TS?
3. **CSS Strategy**: Runtime generation vs pre-built?
4. **Component Granularity**: One file per component or bundles?
5. **Version Strategy**: Semantic versioning for each module?