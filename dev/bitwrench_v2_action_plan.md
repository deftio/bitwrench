# Bitwrench v2 Action Plan

## Critical Friction Points to Address

Based on the evaluation, here are the top issues that need immediate attention:

### 1. Event Handling System (Priority: HIGH)

**Current Problem:**
```javascript
// Awkward and error-prone
dynamicCard.select('.bw-btn').onclick = () => { };
```

**Proposed Solution:**
```javascript
// Add jQuery-like event methods to ComponentHandle
class ComponentHandle {
  on(event, selector, handler) {
    if (typeof selector === 'function') {
      handler = selector;
      selector = null;
    }
    // Implement event delegation
    this._events = this._events || [];
    this._events.push({ event, selector, handler });
    return this;
  }
  
  off(event, handler) {
    // Remove event handlers
    return this;
  }
  
  trigger(event, data) {
    // Trigger custom events
    return this;
  }
}
```

### 2. Automatic Cleanup (Priority: HIGH)

**Current Problem:**
- Memory leaks from orphaned handles
- Event listeners never removed

**Proposed Solution:**
```javascript
// Add MutationObserver for automatic cleanup
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.removedNodes.forEach(node => {
      if (node.nodeType === 1) { // Element node
        bw.cleanup(node); // Recursively cleanup handles
      }
    });
  });
});

observer.observe(document.body, { childList: true, subtree: true });
```

### 3. Performance Optimization (Priority: MEDIUM)

**Current Problem:**
- Creating 100 live components takes 80-120ms

**Proposed Solution:**
```javascript
// Implement component pooling
bw.componentPool = {
  cards: [],
  tables: [],
  
  get(type) {
    const pool = this[type + 's'];
    return pool.pop() || null;
  },
  
  release(component) {
    const pool = this[component.type + 's'];
    component.reset();
    pool.push(component);
  }
};

// Batch DOM updates
bw.batch = (fn) => {
  bw._batchUpdates = [];
  fn();
  bw._flushBatch();
};
```

### 4. State Management (Priority: MEDIUM)

**Current Problem:**
- No way for components to share state
- No reactivity

**Proposed Solution:**
```javascript
// Simple reactive store
bw.createStore = (initialState) => {
  const state = { ...initialState };
  const subscribers = new Set();
  
  return {
    get(key) {
      return key ? state[key] : state;
    },
    
    set(key, value) {
      if (typeof key === 'object') {
        Object.assign(state, key);
      } else {
        state[key] = value;
      }
      this.notify();
    },
    
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
    
    notify() {
      subscribers.forEach(fn => fn(state));
    }
  };
};
```

### 5. Better Component Composition (Priority: LOW)

**Current Problem:**
- Mixing TACO objects and helper functions is confusing

**Proposed Solution:**
```javascript
// Allow components to accept both TACO and strings
bw.makeCard = (props) => {
  // Normalize content
  const content = Array.isArray(props.content) 
    ? props.content 
    : [props.content];
  
  const normalizedContent = content.map(item => {
    if (typeof item === 'string') {
      return { t: 'span', c: item };
    }
    return item;
  });
  
  // ... rest of implementation
};
```

## Implementation Timeline

### Week 1: Core Fixes
- [ ] Implement proper event delegation system
- [ ] Add automatic cleanup with MutationObserver
- [ ] Add basic error boundaries

### Week 2: Performance
- [ ] Implement component pooling
- [ ] Add batch update system
- [ ] Profile and optimize hot paths

### Week 3: Developer Experience
- [ ] Add simple state management
- [ ] Improve component composition
- [ ] Add debug mode with helpful warnings

## Quick Wins (Can do immediately)

1. **Fix event handling in demo**:
```javascript
// Replace this pattern throughout
const btn = dynamicCard.select('.bw-btn');
if (btn) {
  dynamicCard._addEvent('click', btn, handler);
}
```

2. **Add convenience methods**:
```javascript
ComponentHandle.prototype.find = ComponentHandle.prototype.select;
ComponentHandle.prototype.$ = ComponentHandle.prototype.select;
```

3. **Better error messages**:
```javascript
if (!element) {
  console.error(`[Bitwrench] Cannot find element with selector: ${selector}`);
  return null;
}
```

## Success Metrics

- Event handling feels natural (similar to jQuery)
- No memory leaks in long-running apps
- Component creation < 50ms for 100 components
- Clear patterns for state management
- Zero friction for common use cases