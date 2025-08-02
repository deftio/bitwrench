# Bitwrench v2 Performance Notes

## Why Bitwrench Should Be Fast

### Initial Render Performance

Bitwrench v2 should match or exceed other frameworks because:

```javascript
// What React does (simplified):
1. Parse JSX → JavaScript
2. Create React elements (objects)
3. Build Virtual DOM tree
4. Diff against previous (even on mount)
5. Generate DOM operations
6. Call createElement/appendChild

// What Vue does:
1. Parse template
2. Create VNodes
3. Build Virtual DOM
4. Patch DOM
5. Call createElement/appendChild

// What Bitwrench does:
1. Read TACO object
2. Call createElement/appendChild

// Fewer steps = faster
```

### No Overhead Layers

```javascript
// React component
function Card({ title }) {
  return <div className="card"><h2>{title}</h2></div>;
}
// Transpiles to: React.createElement('div', {className: 'card'}, ...)
// Then: VDOM diffing → DOM operations

// Bitwrench
const card = { t: 'div', a: { class: 'card' }, c: [...] };
// Direct: createElement → appendChild
```

### Memory Efficiency

```javascript
// React/Vue maintain:
- Virtual DOM tree (copy of your UI)
- Component instances
- Props/state history
- Event synthetic event system

// Bitwrench maintains:
- Handle objects (thin wrappers)
- Direct DOM references
- Minimal state
```

## Update Performance Considerations

### Current Approach
```javascript
handle.setContent(newContent);
// If this does: element.innerHTML = bw.html(newContent)
// That's a full re-render of that subtree
```

### Optimized Approach
```javascript
handle.updateText(newText);
// Just: element.textContent = newText

handle.updateAttribute('class', 'new-class');
// Just: element.className = 'new-class'

handle.replaceChild(index, newChild);
// Surgical DOM update
```

## Real Performance Bottlenecks

### 1. String Building
```javascript
// Slow for large trees
function buildHTML(taco) {
  let html = '<' + taco.t;
  // ... string concatenation
  return html;
}

// Fast
function buildDOM(taco) {
  const el = document.createElement(taco.t);
  // ... direct DOM manipulation
  return el;
}
```

### 2. Event Listeners
```javascript
// Bad: One listener per element
elements.forEach(el => {
  el.addEventListener('click', handler);
});

// Good: Event delegation
container.addEventListener('click', (e) => {
  if (e.target.matches('.button')) {
    handler(e);
  }
});
```

### 3. Layout Thrashing
```javascript
// Bad: Read/write/read/write
elements.forEach(el => {
  el.style.height = el.offsetHeight + 10 + 'px';  // Forces reflow
});

// Good: Batch reads, then writes
const heights = elements.map(el => el.offsetHeight);
elements.forEach((el, i) => {
  el.style.height = heights[i] + 10 + 'px';
});
```

## Component Handle Optimization

```javascript
class OptimizedHandle {
  constructor(element) {
    // Cache everything on creation
    this.element = element;
    this.cache = {
      title: element.querySelector('.title'),
      body: element.querySelector('.body'),
      buttons: element.querySelectorAll('.btn')
    };
  }
  
  setTitle(text) {
    // Direct reference, no searching
    if (this.cache.title) {
      this.cache.title.textContent = text;
    }
  }
}
```

## Benchmark Ideas

### 1. Initial Render
```javascript
// Test: Create 1000 cards
console.time('render');
const cards = Array(1000).fill(0).map((_, i) => 
  bw.makeCard({ title: `Card ${i}`, content: `Content ${i}` })
);
const html = cards.map(c => bw.html(c)).join('');
container.innerHTML = html;
console.timeEnd('render');
```

### 2. Updates
```javascript
// Test: Update 1000 components
console.time('updates');
handles.forEach((handle, i) => {
  handle.setTitle(`Updated ${i}`);
});
console.timeEnd('updates');
```

### 3. Memory
```javascript
// Test: Memory usage
const before = performance.memory.usedJSHeapSize;
// Create components
const after = performance.memory.usedJSHeapSize;
console.log('Memory used:', (after - before) / 1024 / 1024, 'MB');
```

## Performance Best Practices

### 1. Use Direct DOM When Possible
```javascript
// Instead of recreating
handle.setContent(bw.makeCard({...}));

// Update directly
handle.element.querySelector('.title').textContent = newTitle;
```

### 2. Batch Operations
```javascript
// Good
bw.batch(() => {
  handle1.update();
  handle2.update();
  handle3.update();
});
```

### 3. Lazy Initialization
```javascript
class LazyTable {
  constructor(element, data) {
    this.element = element;
    this.data = data;
    this._rendered = false;
  }
  
  render() {
    if (!this._rendered) {
      this._buildTable();
      this._rendered = true;
    }
  }
}
```

## Conclusion

Bitwrench v2's performance should be excellent because:
1. No parsing/compilation step
2. No virtual DOM overhead
3. Direct DOM manipulation
4. Minimal abstraction

The key is to:
- Document the fast paths
- Avoid recreating DOM unnecessarily  
- Use handles for direct updates
- Batch operations when possible

The architecture is sound - it just needs the patterns documented and some convenience methods for common operations.