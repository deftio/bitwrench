# Bitwrench v2 Component Lifecycle & Memory Management

## Overview

Based on the interaction example, here are the key considerations for component lifecycle and memory management in Bitwrench v2.

## Component Lifecycle Stages

### 1. Creation
```javascript
const card = bw.render('#container', 'append', bw.makeCard({...}));
// - DOM element created
// - Component reference instantiated
// - Added to global registry
// - Events initialized
```

### 2. Active Use
```javascript
card.update({ title: 'New Title' });
card.on('click', handler);
card.link(otherComponent);
// - Properties updated
// - Events handled
// - Relationships established
```

### 3. Destruction
```javascript
card.destroy();
// - Unlink from other components
// - Remove event listeners
// - Remove from DOM
// - Remove from registry
// - Clear references
```

## Memory Management Strategies

### 1. Component Registry

```javascript
// Global registry with WeakMap option for better GC
bw._componentRefs = new Map(); // Current approach

// Alternative: Use WeakMap for automatic cleanup
bw._componentElements = new WeakMap(); // element -> reference
bw._componentRefs = new Map();         // id -> reference
```

### 2. Component Linking

The example shows a bidirectional linking system:

```javascript
class BWComponent {
  constructor() {
    this._linkedComponents = new Set(); // Tracks relationships
  }
  
  link(otherComponent) {
    this._linkedComponents.add(otherComponent);
    otherComponent._linkedComponents.add(this);
  }
  
  unlink(otherComponent) {
    this._linkedComponents.delete(otherComponent);
    otherComponent._linkedComponents.delete(this);
  }
  
  destroy() {
    // Critical: unlink all relationships
    this._linkedComponents.forEach(comp => {
      comp._linkedComponents.delete(this);
    });
    this._linkedComponents.clear();
  }
}
```

### 3. Event Management

```javascript
class BWComponent {
  constructor() {
    this._events = {};
    this._domListeners = new Map(); // Track DOM listeners
  }
  
  _addEventListener(element, event, handler) {
    element.addEventListener(event, handler);
    
    // Track for cleanup
    if (!this._domListeners.has(element)) {
      this._domListeners.set(element, []);
    }
    this._domListeners.get(element).push({ event, handler });
  }
  
  destroy() {
    // Remove all DOM event listeners
    this._domListeners.forEach((listeners, element) => {
      listeners.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this._domListeners.clear();
    
    // Clear component events
    this._events = {};
  }
}
```

## Potential Memory Leaks & Solutions

### 1. Orphaned DOM Elements

**Problem**: Elements with data-bw-id but no component reference
```javascript
// Detection code from example
const orphanedElements = document.querySelectorAll('[data-bw-id]');
orphanedElements.forEach(el => {
  const id = el.getAttribute('data-bw-id');
  if (!bw._componentRefs.has(id)) {
    console.warn('Orphaned element:', id);
  }
});
```

**Solution**: Cleanup utility
```javascript
bw.cleanupOrphans = function() {
  const elements = document.querySelectorAll('[data-bw-id]');
  let cleaned = 0;
  
  elements.forEach(el => {
    const id = el.getAttribute('data-bw-id');
    if (!this._componentRefs.has(id)) {
      el.remove();
      cleaned++;
    }
  });
  
  return cleaned;
};
```

### 2. Circular References

**Problem**: Components referencing each other
```javascript
// Potential circular reference
cardA.link(cardB);
cardB.link(cardA);
// If not properly cleaned, prevents GC
```

**Solution**: Weak references for non-critical links
```javascript
class BWComponent {
  constructor() {
    this._weakLinks = new WeakSet(); // For optional relationships
    this._strongLinks = new Set();   // For required relationships
  }
}
```

### 3. Event Listener Accumulation

**Problem**: Adding listeners without removing
```javascript
// Bad: Creates new listener each time
function updateCard(card) {
  card.element.addEventListener('click', () => {...});
}
```

**Solution**: Named functions and tracking
```javascript
class BWComponent {
  _ensureListener(event, handler) {
    const key = `${event}:${handler.name}`;
    if (!this._activeListeners.has(key)) {
      this.on(event, handler);
      this._activeListeners.add(key);
    }
  }
}
```

## Best Practices

### 1. Component Creation
```javascript
// Always store reference if you need to clean up later
const refs = [];
function createCards() {
  for (let i = 0; i < 10; i++) {
    refs.push(bw.render('#container', 'append', bw.makeCard({...})));
  }
}

// Clean up when done
function cleanup() {
  refs.forEach(ref => ref.destroy());
  refs.length = 0;
}
```

### 2. Event Management
```javascript
// Use named functions for removability
const handleClick = (e) => console.log('clicked');
card.on('click', handleClick);

// Later
card.off('click', handleClick);
```

### 3. Relationship Management
```javascript
// Document relationships
class FormCard extends BWComponent {
  setTarget(targetCard) {
    // Unlink previous target
    if (this._targetCard) {
      this.unlink(this._targetCard);
    }
    
    // Link new target
    this._targetCard = targetCard;
    if (targetCard) {
      this.link(targetCard);
    }
  }
  
  destroy() {
    // Clear specific relationships
    this._targetCard = null;
    super.destroy();
  }
}
```

## Testing for Memory Leaks

### 1. Manual Testing
```javascript
// Memory leak test
function memoryLeakTest() {
  const before = performance.memory.usedJSHeapSize;
  
  // Create and destroy many components
  for (let i = 0; i < 1000; i++) {
    const card = bw.render('#test', 'append', bw.makeCard({
      title: `Card ${i}`,
      content: 'Test content'
    }));
    card.destroy();
  }
  
  // Force GC if available (Chrome DevTools)
  if (global.gc) global.gc();
  
  setTimeout(() => {
    const after = performance.memory.usedJSHeapSize;
    console.log('Memory delta:', after - before);
  }, 1000);
}
```

### 2. Automated Checks
```javascript
// Add to test suite
describe('Memory Management', () => {
  it('should not leak memory on destroy', async () => {
    const initialRefs = bw._componentRefs.size;
    const initialElements = document.querySelectorAll('[data-bw-id]').length;
    
    // Create components
    const refs = [];
    for (let i = 0; i < 100; i++) {
      refs.push(bw.render('#test', 'append', bw.makeCard({...})));
    }
    
    // Destroy all
    refs.forEach(ref => ref.destroy());
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check cleanup
    assert(bw._componentRefs.size === initialRefs);
    assert(document.querySelectorAll('[data-bw-id]').length === initialElements);
  });
});
```

## Debugging Tools

### 1. Component Inspector
```javascript
bw.debug = {
  // List all active components
  listComponents() {
    console.table(Array.from(bw._componentRefs.values()).map(ref => ({
      id: ref.id,
      type: ref.type,
      links: ref._linkedComponents.size,
      element: ref.element.tagName
    })));
  },
  
  // Find component by element
  findByElement(element) {
    const id = element.getAttribute('data-bw-id');
    return bw._componentRefs.get(id);
  },
  
  // Check for leaks
  checkLeaks() {
    const refs = bw._componentRefs.size;
    const elements = document.querySelectorAll('[data-bw-id]').length;
    const orphans = elements - refs;
    
    console.log({
      activeRefs: refs,
      domElements: elements,
      orphans: orphans,
      status: orphans === 0 ? '✓ Clean' : '⚠️ Potential leak'
    });
  }
};
```

### 2. Lifecycle Hooks for Debugging
```javascript
class BWComponent {
  constructor() {
    if (bw.debug.traceLifecycle) {
      console.log(`[CREATE] ${this.constructor.name} ${this.id}`);
    }
  }
  
  destroy() {
    if (bw.debug.traceLifecycle) {
      console.log(`[DESTROY] ${this.constructor.name} ${this.id}`);
    }
    // ... cleanup code
  }
}
```

## Recommendations

1. **Use WeakMap/WeakSet** where appropriate for automatic GC
2. **Always call destroy()** when removing components programmatically
3. **Track relationships** explicitly and clean them up
4. **Test memory usage** as part of the test suite
5. **Provide debugging tools** for developers to diagnose issues
6. **Document lifecycle** clearly in component docs
7. **Consider MutationObserver** to detect removed elements automatically

## Future Enhancements

1. **Automatic Cleanup**: Use MutationObserver to detect DOM removals
2. **Lifecycle Events**: Emit global events for component lifecycle
3. **Memory Profiler**: Built-in tool to track component memory usage
4. **Relationship Visualizer**: Debug tool to show component relationships
5. **Garbage Collection Hints**: Help browser GC with explicit nulling