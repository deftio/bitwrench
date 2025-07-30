# Bitwrench v2 Automatic Cleanup Strategies

## Overview

Manual cleanup (`ref.destroy()`) is error-prone. We need automatic detection when DOM nodes are removed externally (e.g., `innerHTML = ''`, `removeChild()`, jQuery operations).

## Strategy 1: Existence Check Before Operations

Check if the component's DOM element still exists before any operation.

```javascript
class BWComponent {
  // Check if component is still in DOM
  get isConnected() {
    return this.element && this.element.isConnected;
  }
  
  // Wrap all public methods with existence check
  _ensureConnected(methodName) {
    if (!this.isConnected) {
      console.warn(`Component ${this.id} is no longer in DOM, cleaning up...`);
      this._autoCleanup();
      throw new Error(`Cannot call ${methodName} on disconnected component`);
    }
  }
  
  update(props) {
    this._ensureConnected('update');
    // ... actual update logic
  }
  
  on(event, handler) {
    this._ensureConnected('on');
    // ... actual event logic
  }
  
  _autoCleanup() {
    // Remove from registry but skip DOM removal (already gone)
    bw._componentRefs.delete(this.id);
    
    // Unlink relationships
    this._linkedComponents.forEach(comp => {
      comp._linkedComponents.delete(this);
    });
    
    // Clear references
    this._events = {};
    this._linkedComponents.clear();
    this.element = null;
  }
}

// Alternative: Use Proxy for automatic checking
function createComponentProxy(component) {
  return new Proxy(component, {
    get(target, prop) {
      // Check connection for methods (not properties)
      if (typeof target[prop] === 'function' && !prop.startsWith('_')) {
        return function(...args) {
          if (!target.isConnected) {
            target._autoCleanup();
            throw new Error(`Component ${target.id} is disconnected`);
          }
          return target[prop].apply(target, args);
        };
      }
      return target[prop];
    }
  });
}
```

**Pros:**
- No background processes
- Immediate detection on use
- Works in all browsers

**Cons:**
- Overhead on every method call
- Only detects on interaction
- Orphaned components remain until accessed

## Strategy 2: MutationObserver for DOM Changes

Watch for DOM mutations and clean up removed components.

```javascript
class ComponentCleanupObserver {
  constructor() {
    this.observer = null;
    this.checkQueue = new Set();
    this.checking = false;
  }
  
  start() {
    if (this.observer) return;
    
    this.observer = new MutationObserver((mutations) => {
      // Batch checks for performance
      mutations.forEach(mutation => {
        mutation.removedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            this.queueCheck(node);
          }
        });
      });
      
      this.processQueue();
    });
    
    // Observe entire document
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  queueCheck(node) {
    // Check the node and all descendants
    const elements = [node];
    if (node.querySelectorAll) {
      elements.push(...node.querySelectorAll('[data-bw-id]'));
    }
    
    elements.forEach(el => {
      const id = el.getAttribute && el.getAttribute('data-bw-id');
      if (id) {
        this.checkQueue.add(id);
      }
    });
  }
  
  processQueue() {
    if (this.checking || this.checkQueue.size === 0) return;
    
    this.checking = true;
    
    // Process in next tick to batch multiple mutations
    requestAnimationFrame(() => {
      this.checkQueue.forEach(id => {
        const ref = bw._componentRefs.get(id);
        if (ref && !ref.element.isConnected) {
          console.log(`Auto-cleaning disconnected component: ${id}`);
          ref._autoCleanup();
        }
      });
      
      this.checkQueue.clear();
      this.checking = false;
    });
  }
  
  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Initialize observer
bw._cleanupObserver = new ComponentCleanupObserver();
bw._cleanupObserver.start();
```

**Pros:**
- Automatic and immediate detection
- No polling overhead
- Catches all DOM mutations

**Cons:**
- MutationObserver has performance cost
- Not supported in very old browsers (IE10-)
- Can miss mutations if observer is disconnected

## Strategy 3: Periodic Garbage Collection

Periodically scan for orphaned components.

```javascript
class ComponentGarbageCollector {
  constructor(interval = 5000) {
    this.interval = interval;
    this.timer = null;
    this.stats = {
      runs: 0,
      cleaned: 0,
      lastRun: null
    };
  }
  
  start() {
    if (this.timer) return;
    
    this.timer = setInterval(() => {
      this.collect();
    }, this.interval);
    
    // Run immediately
    this.collect();
  }
  
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  
  collect() {
    const startTime = performance.now();
    let cleaned = 0;
    
    // Check all registered components
    const toClean = [];
    bw._componentRefs.forEach((ref, id) => {
      if (!ref.element || !ref.element.isConnected) {
        toClean.push(id);
      }
    });
    
    // Clean disconnected components
    toClean.forEach(id => {
      const ref = bw._componentRefs.get(id);
      if (ref) {
        ref._autoCleanup();
        cleaned++;
      }
    });
    
    // Update stats
    this.stats.runs++;
    this.stats.cleaned += cleaned;
    this.stats.lastRun = new Date();
    
    const duration = performance.now() - startTime;
    
    if (cleaned > 0 || bw.debug.verboseGC) {
      console.log(`[GC] Cleaned ${cleaned} components in ${duration.toFixed(2)}ms`);
    }
    
    return cleaned;
  }
  
  // Manual trigger with immediate return
  collectNow() {
    return this.collect();
  }
}

// Initialize GC
bw._gc = new ComponentGarbageCollector();
bw._gc.start();
```

**Pros:**
- Simple and reliable
- Batches cleanup operations
- Provides statistics
- Works everywhere

**Cons:**
- Delayed cleanup (up to interval)
- Continuous background process
- May impact performance

## Hybrid Approach (Recommended)

Combine all three strategies with configurable options:

```javascript
// Configuration
bw.config = {
  cleanup: {
    checkBeforeOp: true,      // Strategy 1: Check before operations
    useMutationObserver: true, // Strategy 2: Watch DOM mutations
    useGarbageCollector: true, // Strategy 3: Periodic cleanup
    gcInterval: 10000,        // GC interval in ms
    warnOnDisconnected: true  // Warn when accessing disconnected components
  }
};

// Enhanced base component
class BWComponent {
  constructor(element, config) {
    this.element = element;
    this.id = bw.uuid();
    this._isDestroyed = false;
    
    // ... rest of constructor
  }
  
  // Combined checking
  _ensureValid() {
    if (this._isDestroyed) {
      throw new Error(`Component ${this.id} has been destroyed`);
    }
    
    if (bw.config.cleanup.checkBeforeOp && !this.isConnected) {
      if (bw.config.cleanup.warnOnDisconnected) {
        console.warn(`Component ${this.id} disconnected, auto-cleaning...`);
      }
      this._autoCleanup();
      throw new Error(`Component ${this.id} is disconnected`);
    }
  }
  
  // Wrap public methods
  update(props) {
    this._ensureValid();
    return this._update(props);
  }
  
  // Internal cleanup (called by any strategy)
  _autoCleanup() {
    if (this._isDestroyed) return;
    
    this._isDestroyed = true;
    
    // Emit cleanup event
    this.emit('autoCleanup');
    
    // Standard cleanup
    this._unlinkAll();
    this._removeFromRegistry();
    this._clearReferences();
    
    // Log if debugging
    if (bw.debug.traceCleanup) {
      console.log(`[AUTO-CLEANUP] ${this.constructor.name} ${this.id}`);
    }
  }
}

// Initialize all strategies based on config
bw._initCleanupStrategies = function() {
  if (this.config.cleanup.useMutationObserver && typeof MutationObserver !== 'undefined') {
    this._cleanupObserver = new ComponentCleanupObserver();
    this._cleanupObserver.start();
  }
  
  if (this.config.cleanup.useGarbageCollector) {
    this._gc = new ComponentGarbageCollector(this.config.cleanup.gcInterval);
    this._gc.start();
  }
};

// Public cleanup API
bw.cleanup = {
  // Force immediate cleanup
  now() {
    let cleaned = 0;
    
    // Run GC if available
    if (bw._gc) {
      cleaned += bw._gc.collectNow();
    }
    
    // Also check all components
    const toClean = [];
    bw._componentRefs.forEach((ref, id) => {
      if (!ref.isConnected) {
        toClean.push(ref);
      }
    });
    
    toClean.forEach(ref => {
      ref._autoCleanup();
      cleaned++;
    });
    
    return cleaned;
  },
  
  // Get cleanup statistics
  stats() {
    return {
      activeComponents: bw._componentRefs.size,
      gcStats: bw._gc ? bw._gc.stats : null,
      observerActive: !!bw._cleanupObserver,
      config: bw.config.cleanup
    };
  },
  
  // Configure cleanup strategies
  configure(options) {
    Object.assign(bw.config.cleanup, options);
    
    // Restart strategies with new config
    if (bw._cleanupObserver) {
      bw._cleanupObserver.stop();
    }
    if (bw._gc) {
      bw._gc.stop();
    }
    
    bw._initCleanupStrategies();
  }
};
```

## Performance Considerations

### MutationObserver Optimization
```javascript
// Debounce mutation handling
class OptimizedCleanupObserver {
  constructor() {
    this.pendingCleanups = new Map();
    this.cleanupTimer = null;
  }
  
  queueCleanup(id, element) {
    this.pendingCleanups.set(id, element);
    
    if (!this.cleanupTimer) {
      this.cleanupTimer = requestIdleCallback(() => {
        this.processPendingCleanups();
      }, { timeout: 100 });
    }
  }
  
  processPendingCleanups() {
    this.pendingCleanups.forEach((element, id) => {
      if (!element.isConnected) {
        const ref = bw._componentRefs.get(id);
        if (ref) ref._autoCleanup();
      }
    });
    
    this.pendingCleanups.clear();
    this.cleanupTimer = null;
  }
}
```

### Smart GC Scheduling
```javascript
// Adaptive GC that runs less frequently when idle
class AdaptiveGarbageCollector {
  constructor() {
    this.baseInterval = 10000;
    this.currentInterval = this.baseInterval;
    this.idleCount = 0;
  }
  
  collect() {
    const cleaned = super.collect();
    
    if (cleaned === 0) {
      // No garbage found, increase interval
      this.idleCount++;
      this.currentInterval = Math.min(
        this.baseInterval * Math.pow(2, this.idleCount),
        60000 // Max 1 minute
      );
    } else {
      // Garbage found, reset to base interval
      this.idleCount = 0;
      this.currentInterval = this.baseInterval;
    }
    
    // Reschedule with new interval
    this.reschedule();
  }
}
```

## Testing Automatic Cleanup

```javascript
describe('Automatic Cleanup', () => {
  it('should clean components removed via innerHTML', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    // Create component
    const card = bw.render(container, 'append', bw.makeCard({
      title: 'Test Card'
    }));
    
    const id = card.id;
    assert(bw._componentRefs.has(id));
    
    // Remove via innerHTML
    container.innerHTML = '';
    
    // Wait for cleanup (depends on strategy)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should be cleaned up
    assert(!bw._componentRefs.has(id));
  });
  
  it('should handle rapid DOM mutations', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    // Rapid creation and destruction
    for (let i = 0; i < 100; i++) {
      const card = bw.render(container, 'append', bw.makeCard({
        title: `Card ${i}`
      }));
      container.removeChild(card.element);
    }
    
    // Force cleanup
    const cleaned = bw.cleanup.now();
    assert(cleaned >= 100);
    assert(bw._componentRefs.size === 0);
  });
});
```

## Recommendations

1. **Use Hybrid Approach** - All three strategies complement each other
2. **Make Configurable** - Let developers choose based on their needs
3. **Default to Safe** - Enable all strategies by default
4. **Provide Manual Control** - `bw.cleanup.now()` for immediate cleanup
5. **Add Debugging** - Clear logging for what's being cleaned and why
6. **Test Thoroughly** - Each strategy needs comprehensive tests
7. **Document Behavior** - Make it clear when components are auto-cleaned

## Browser Compatibility

- **isConnected**: IE not supported, needs polyfill
- **MutationObserver**: IE11+, older needs polling only
- **requestIdleCallback**: Limited support, needs fallback
- **WeakMap/WeakSet**: IE11+, polyfillable

```javascript
// Polyfill for isConnected
if (!('isConnected' in Node.prototype)) {
  Object.defineProperty(Node.prototype, 'isConnected', {
    get() {
      return document.contains(this);
    }
  });
}
```