# Dead Code Elimination — v2.0.15

**Date**: 2026-03-08
**Branch**: feature/reactivity-cleanup

This document records all code removed in v2.0.15 and why, so it can be
recovered if any removal turns out to be premature.

---

## 1. Handle Classes (bitwrench-components-v2.js)

**Removed**: 5 imperative Handle classes + `componentHandles` registry export.

| Class | Lines | Reason |
|-------|------:|--------|
| CardHandle | 84 | Zero external usage. Superseded by ComponentHandle. |
| TableHandle | 98 | Only used internally by `bw.createTable()` Handle wiring. |
| NavbarHandle | 33 | Zero external usage. |
| TabsHandle | 58 | Zero external usage. |
| ModalHandle | 46 | Only tested in isolation, never exposed to users. |
| componentHandles export | 7 | Registry for above — dead with the classes. |
| **Total** | **326** | |

### Recovery

All 5 classes followed the same pattern:
```javascript
export class XxxHandle {
  constructor(element, taco) {
    this.element = element;
    this._taco = taco;
    this.state = taco.o?.state || {};
    this.children = { /* querySelector caches */ };
  }
  // setTitle(), setData(), switchTo(), show()/hide(), etc.
}
```

If any external code relied on `bw._componentHandles.xxx`, the
replacement is `bw.component()` which returns a full `ComponentHandle`.

### CardHandle (was lines 1530-1613)
```javascript
export class CardHandle {
  constructor(element, taco) {
    this.element = element;
    this._taco = taco;
    this.state = taco.o?.state || {};
    this.children = {
      header: element.querySelector('.bw-card-header'),
      title: element.querySelector('.bw-card-title'),
      body: element.querySelector('.bw-card-body'),
      footer: element.querySelector('.bw-card-footer')
    };
  }
  setTitle(title) { if (this.children.title) this.children.title.textContent = title; return this; }
  setContent(content) { /* innerHTML or taco.toDOM */ return this; }
  addClass(className) { this.element.classList.add(className); return this; }
  removeClass(className) { this.element.classList.remove(className); return this; }
  select(selector) { return this.element.querySelector(selector); }
}
```

### TableHandle (was lines 1624-1721)
```javascript
export class TableHandle {
  constructor(element, taco) {
    this.element = element;
    this._taco = taco;
    this.state = taco.o?.state || {};
    this._data = this.state.data || [];
    this._sortColumn = null;
    this._sortDirection = 'asc';
    this.children = { thead, tbody, headers };
    if (this.state.sortable) this._setupSorting();
  }
  _setupSorting() { /* click handlers on th */ }
  setData(data) { this._data = data; this._renderBody(); return this; }
  sortBy(column, direction) { /* sort + re-render */ return this; }
  _renderBody() { /* innerHTML rebuild from _data */ }
}
```

### NavbarHandle (was lines 1731-1763)
```javascript
export class NavbarHandle {
  constructor(element, taco) {
    this.element = element;
    this._taco = taco;
    this.state = taco.o?.state || {};
    this.children = { brand, links };
  }
  setActive(href) { /* toggle .active on matching link */ return this; }
}
```

### TabsHandle (was lines 1774-1831)
```javascript
export class TabsHandle {
  constructor(element, taco) {
    this.element = element;
    this._taco = taco;
    this.state = taco.o?.state || {};
    this.children = { navItems, tabPanes };
    this._setupTabs();
  }
  _setupTabs() { /* click handlers */ }
  switchTo(index) { /* toggle .active on navItems + tabPanes */ return this; }
}
```

### ModalHandle (was lines 2266-2311)
```javascript
export class ModalHandle {
  constructor(element, taco) {
    this.element = element;
    this._taco = taco;
    this._escHandler = null;
  }
  show() { this.element.classList.add('bw-modal-show'); document.body.style.overflow = 'hidden'; return this; }
  hide() { this.element.classList.remove('bw-modal-show'); document.body.style.overflow = ''; return this; }
  toggle() { /* show/hide based on classList */ return this; }
  destroy() { this.hide(); /* remove event listener, remove from DOM */ }
}
```

---

## 2. Handle Wiring (bitwrench.js)

**Removed**: `bw._componentHandles` registry, `create*()` Handle wrapper loop,
and manual `bw.createTable()` Handle wrapper.

### _componentHandles registry (was line 5018)
```javascript
bw._componentHandles = components.componentHandles || {};
```

### create*() Handle loop (was lines 5020-5042)
```javascript
Object.entries(components).forEach(([name, fn]) => {
  if (name.startsWith('make')) {
    const componentType = name.substring(4).toLowerCase();
    const createName = 'create' + name.substring(4);
    bw[createName] = function(props) {
      const taco = fn(props);
      const handle = bw.renderComponent(taco);
      const HandleClass = bw._componentHandles[componentType];
      if (HandleClass) {
        const specializedHandle = new HandleClass(handle.element, taco);
        Object.setPrototypeOf(specializedHandle, handle);
        return specializedHandle;
      }
      return handle;
    };
  }
});
```

### Manual createTable Handle wrapper (was lines 5046-5059)
```javascript
bw.createTable = function(data, options = {}) {
  const taco = bw.makeTable({ data, ...options });
  const handle = bw.renderComponent(taco);
  const TableHandle = bw._componentHandles.table;
  if (TableHandle) {
    const specializedHandle = new TableHandle(handle.element, taco);
    Object.setPrototypeOf(specializedHandle, handle);
    return specializedHandle;
  }
  return handle;
};
```

**Replacement**: The `create*()` functions still exist (created by the loop
that remains at lines 5020-5042 after edit). They just return a plain
`renderComponent()` handle without the specialized Handle class overlay.
The new `bw.component()` / `ComponentHandle` is the forward path.

---

## 3. Duplicate Color Functions (bitwrench.js)

**Removed**: 3 functions that were exact duplicates of functions already in
`bitwrench-color-utils.js`. The bitwrench.js copies are replaced by imports
from color-utils + re-export as `bw.*` properties.

| Function | Lines | Notes |
|----------|------:|-------|
| bw.colorHslToRgb | 40 | Duplicate of color-utils.colorHslToRgb |
| bw.colorRgbToHsl | 39 | Duplicate of color-utils.colorRgbToHsl |
| bw.colorParse | 51 | Duplicate of color-utils.colorParse |
| **Total** | **130** | Now imported from bitwrench-color-utils.js |

The color-utils versions use `var` and avoid ES6 default params for IE11
compat. The bitwrench.js duplicates used `const`/`let` and `= 255` default
params. After dedup, the color-utils versions (which are the canonical ones
used by the theming pipeline) win.

---

## 4. Tests Updated

| Test file | Change |
|-----------|--------|
| bitwrench_test_components.js | Removed `ModalHandle` import, removed `ModalHandle` describe block (2 tests), removed `componentHandles` describe block (1 test). Net: -3 tests. |

---

## 5. NOT Removed (deliberate keeps)

| Item | Reason |
|------|--------|
| Deprecated functions (htmlTable, htmlTabs, getTheme, setTheme) | Still tested and used in v1 examples. Removal is a breaking change. |
| `bw.renderComponent()` / `bw.compileProps()` | Used by create*() loop. Phase 2 removal. |
| `bw.colorInterp()` | Not duplicated — only exists in bitwrench.js. |
| All 47 make*() functions | User directive: keep all BCCL components. |
| create*() loop (lines 5020-5042) | Still generates bw.createCard etc. Just no longer wraps in Handle. |

---

## Size Impact

| Metric | Before | After | Delta |
|--------|-------:|------:|------:|
| components-v2.js lines | 3,865 | ~3,539 | -326 |
| bitwrench.js lines | 5,066 | ~4,894 | -172 |
| Total source lines | 14,368 | ~13,870 | -498 |
| Estimated gzip savings | — | — | ~3-4KB |

---

## Future Optimization Notes

### CSS Generation Size (v1x pattern)
In v1.x, style generation used formula-based loops like:
```javascript
for (var i = 1; i <= 6; i++) {
  rules['h' + i] = { 'font-size': (2.5 - i * 0.3) + 'rem' };
}
```
This is more compact than writing out all 6 heading rules explicitly.
The v2 `defaultStyles` object (3,203 lines, 64% of styles.js) could benefit
from this pattern for repetitive rule sets (grid columns, heading sizes,
spacing utilities). This is a Tier 2 optimization — architectural change
that affects the CSS generation pipeline.

### BCCL Extended Pack (future)
8 specialized components (makeCarousel, makeChipInput, makeRange,
makeFileUpload, makePopover, makeStepper, makeTimeline, makeMediaObject)
= 784 lines (~5KB gz) could become an optional addon for size-constrained
environments, similar to bitwrench-code-edit today.
