# Bitwrench v2 Error Handling & Logging System

## Philosophy

- **Never throw errors** from within the framework for recoverable situations
- **Log problems** to a central event system
- **Provide graceful fallbacks** whenever possible
- **Give developers tools** to monitor and debug issues

## Event Logging System

```javascript
// Central event log
bw.eventLog = {
  _entries: [],
  _maxEntries: 1000,
  _listeners: new Set(),
  _levels: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
  },
  
  // Log an event
  log(level, category, message, details = {}) {
    const entry = {
      id: bw.uuid(),
      timestamp: new Date(),
      level,
      category,
      message,
      details,
      stack: level === 'error' ? new Error().stack : undefined
    };
    
    // Add to log
    this._entries.push(entry);
    
    // Trim if needed
    if (this._entries.length > this._maxEntries) {
      this._entries.shift();
    }
    
    // Notify listeners
    this._listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (e) {
        console.error('Error in log listener:', e);
      }
    });
    
    // Console output in dev mode
    if (bw.config.debug) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${category}] ${message}`, details);
    }
    
    return entry;
  },
  
  // Convenience methods
  error(category, message, details) {
    return this.log('error', category, message, details);
  },
  
  warn(category, message, details) {
    return this.log('warn', category, message, details);
  },
  
  info(category, message, details) {
    return this.log('info', category, message, details);
  },
  
  debug(category, message, details) {
    return this.log('debug', category, message, details);
  },
  
  // Query the log
  query(filter = {}) {
    return this._entries.filter(entry => {
      if (filter.level && entry.level !== filter.level) return false;
      if (filter.category && entry.category !== filter.category) return false;
      if (filter.since && entry.timestamp < filter.since) return false;
      if (filter.search && !entry.message.includes(filter.search)) return false;
      return true;
    });
  },
  
  // Subscribe to events
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  },
  
  // Clear log
  clear() {
    this._entries = [];
  },
  
  // Get summary stats
  stats() {
    const stats = {
      total: this._entries.length,
      byLevel: {},
      byCategory: {},
      recentErrors: []
    };
    
    this._entries.forEach(entry => {
      stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;
      stats.byCategory[entry.category] = (stats.byCategory[entry.category] || 0) + 1;
    });
    
    stats.recentErrors = this.query({ level: 'error' })
      .slice(-5)
      .map(e => ({
        time: e.timestamp.toLocaleTimeString(),
        message: e.message
      }));
    
    return stats;
  }
};
```

## Graceful Component Error Handling

```javascript
class BWComponent {
  constructor(element, config) {
    this.element = element;
    this.id = bw.uuid();
    this._isDestroyed = false;
    this._failedOperations = 0;
    this._config = { ...config };
  }
  
  // Safe wrapper for all public methods
  _safe(methodName, operation) {
    try {
      // Check if component is valid
      if (this._isDestroyed) {
        bw.eventLog.warn('component', `Attempted to call ${methodName} on destroyed component`, {
          componentId: this.id,
          method: methodName
        });
        return this; // Return self for chaining
      }
      
      if (!this.isConnected) {
        bw.eventLog.warn('component', `Component disconnected, auto-cleaning`, {
          componentId: this.id,
          method: methodName
        });
        this._autoCleanup();
        return this; // Still return self
      }
      
      // Execute the operation
      return operation.call(this);
      
    } catch (error) {
      // Log the error
      bw.eventLog.error('component', `Error in ${methodName}`, {
        componentId: this.id,
        method: methodName,
        error: error.message,
        config: this._config
      });
      
      // Track failures
      this._failedOperations++;
      
      // Return self for chaining (graceful failure)
      return this;
    }
  }
  
  // Public methods use the safe wrapper
  update(props) {
    return this._safe('update', function() {
      this._updateInternal(props);
      return this;
    });
  }
  
  on(event, handler) {
    return this._safe('on', function() {
      if (!this._events[event]) this._events[event] = [];
      this._events[event].push(handler);
      return this;
    });
  }
  
  setTitle(title) {
    return this._safe('setTitle', function() {
      const el = this.find('.card-title');
      if (el) {
        el.textContent = title;
        this._config.title = title;
      } else {
        bw.eventLog.warn('component', 'Title element not found', {
          componentId: this.id,
          selector: '.card-title'
        });
      }
      return this;
    });
  }
  
  // Provide component health status
  getHealth() {
    return {
      id: this.id,
      connected: this.isConnected,
      destroyed: this._isDestroyed,
      failedOperations: this._failedOperations,
      lastError: bw.eventLog.query({ 
        category: 'component',
        search: this.id 
      }).pop()
    };
  }
}
```

## User-Friendly Error Recovery

```javascript
// Enhanced table component with error recovery
class BWTable extends BWComponent {
  addRow(rowData) {
    return this._safe('addRow', function() {
      // Validate input
      if (!rowData || typeof rowData !== 'object') {
        bw.eventLog.warn('table', 'Invalid row data provided', {
          componentId: this.id,
          data: rowData
        });
        return this;
      }
      
      // Try to add row
      try {
        this._data.push(rowData);
        this._renderRow(rowData);
      } catch (e) {
        // Log but don't fail
        bw.eventLog.error('table', 'Failed to render row', {
          componentId: this.id,
          error: e.message,
          rowData
        });
        
        // Try recovery - re-render entire table
        this._renderBody();
      }
      
      return this;
    });
  }
  
  sort(column) {
    return this._safe('sort', function() {
      // Check if column exists
      if (!this._columns.find(c => c.key === column)) {
        bw.eventLog.warn('table', 'Sort requested on non-existent column', {
          componentId: this.id,
          column,
          availableColumns: this._columns.map(c => c.key)
        });
        return this;
      }
      
      // Perform sort...
      return this;
    });
  }
}
```

## Developer Tools

```javascript
// Log viewer component
bw.createLogViewer = function(options = {}) {
  const {
    maxEntries = 100,
    level = 'all',
    category = 'all',
    compact = false
  } = options;
  
  return {
    t: 'div',
    a: { class: 'bw-log-viewer' },
    c: [
      // Controls
      {
        t: 'div',
        a: { class: 'bw-log-controls' },
        c: [
          // Level filter
          {
            t: 'select',
            a: { 
              onchange: function(e) {
                this.setState({ level: e.target.value });
              }
            },
            c: ['all', 'error', 'warn', 'info', 'debug'].map(l => ({
              t: 'option',
              a: { value: l },
              c: l
            }))
          },
          // Clear button
          {
            t: 'button',
            a: { 
              onclick: () => {
                bw.eventLog.clear();
                this.update();
              }
            },
            c: 'Clear Log'
          }
        ]
      },
      
      // Log entries
      {
        t: 'div',
        a: { class: 'bw-log-entries' },
        o: {
          mounted: function(el) {
            // Subscribe to updates
            const unsubscribe = bw.eventLog.subscribe(entry => {
              // Add new entry to viewer
              const entryEl = bw.createDOM({
                t: 'div',
                a: { 
                  class: `bw-log-entry bw-log-${entry.level}`,
                  title: JSON.stringify(entry.details, null, 2)
                },
                c: [
                  { t: 'span', a: { class: 'bw-log-time' }, c: entry.timestamp.toLocaleTimeString() },
                  { t: 'span', a: { class: 'bw-log-level' }, c: entry.level },
                  { t: 'span', a: { class: 'bw-log-category' }, c: entry.category },
                  { t: 'span', a: { class: 'bw-log-message' }, c: entry.message }
                ]
              });
              
              el.appendChild(entryEl);
              
              // Limit entries
              while (el.children.length > maxEntries) {
                el.removeChild(el.firstChild);
              }
              
              // Auto-scroll
              el.scrollTop = el.scrollHeight;
            });
            
            // Store unsubscribe for cleanup
            el._unsubscribe = unsubscribe;
          },
          
          unmount: function(el) {
            if (el._unsubscribe) el._unsubscribe();
          }
        }
      }
    ]
  };
};

// Console helper
bw.showLog = function() {
  console.table(bw.eventLog.query().slice(-20));
};

bw.showErrors = function() {
  console.table(bw.eventLog.query({ level: 'error' }));
};

bw.showStats = function() {
  console.log(bw.eventLog.stats());
};
```

## Error Monitoring Dashboard

```javascript
// Create a monitoring dashboard
bw.createMonitorDashboard = function() {
  const stats = bw.eventLog.stats();
  
  return {
    t: 'div',
    a: { class: 'bw-monitor' },
    c: [
      {
        t: 'h3',
        c: 'System Health'
      },
      {
        t: 'div',
        a: { class: 'bw-stats-grid' },
        c: [
          // Error count
          {
            t: 'div',
            a: { 
              class: 'bw-stat-card',
              style: { 
                background: stats.byLevel.error > 0 ? '#fee' : '#efe' 
              }
            },
            c: [
              { t: 'div', a: { class: 'bw-stat-value' }, c: String(stats.byLevel.error || 0) },
              { t: 'div', a: { class: 'bw-stat-label' }, c: 'Errors' }
            ]
          },
          // Warning count
          {
            t: 'div',
            a: { class: 'bw-stat-card' },
            c: [
              { t: 'div', a: { class: 'bw-stat-value' }, c: String(stats.byLevel.warn || 0) },
              { t: 'div', a: { class: 'bw-stat-label' }, c: 'Warnings' }
            ]
          },
          // Component health
          {
            t: 'div',
            a: { class: 'bw-stat-card' },
            c: [
              { t: 'div', a: { class: 'bw-stat-value' }, c: String(bw._componentRefs.size) },
              { t: 'div', a: { class: 'bw-stat-label' }, c: 'Active Components' }
            ]
          }
        ]
      },
      // Recent errors
      stats.recentErrors.length > 0 && {
        t: 'div',
        a: { class: 'bw-recent-errors' },
        c: [
          { t: 'h4', c: 'Recent Errors' },
          ...stats.recentErrors.map(err => ({
            t: 'div',
            a: { class: 'bw-error-item' },
            c: `${err.time}: ${err.message}`
          }))
        ]
      }
    ].filter(Boolean),
    o: {
      mounted: function(el) {
        // Auto-refresh every 5 seconds
        this._refreshTimer = setInterval(() => {
          bw.DOM(el, this);
        }, 5000);
      },
      unmount: function() {
        if (this._refreshTimer) {
          clearInterval(this._refreshTimer);
        }
      }
    }
  };
};
```

## Configuration

```javascript
bw.config = {
  // Error handling settings
  errorHandling: {
    logErrors: true,        // Log all errors
    logWarnings: true,      // Log warnings
    consoleOutput: false,   // Mirror to console (dev mode)
    maxLogEntries: 1000,    // Max entries to keep
    
    // Recovery strategies
    autoRecover: true,      // Try to recover from errors
    retryFailedOps: false,  // Retry failed operations
    maxRetries: 3          // Max retry attempts
  },
  
  // Debug mode
  debug: false,  // Set to true in development
  
  // Component health monitoring
  monitoring: {
    enabled: true,
    checkInterval: 30000,   // Check component health every 30s
    warnThreshold: 5,       // Warn if component has >5 failed ops
    autoCleanupUnhealthy: true
  }
};
```

## Usage Examples

```javascript
// Normal usage - errors are handled gracefully
const card = bw.render('#app', 'append', bw.makeCard({
  title: 'My Card'
}));

// This won't throw even if card is disconnected
card.setTitle('New Title')
    .setContent('New Content')
    .highlight();

// Check if there were problems
if (card.getHealth().failedOperations > 0) {
  console.log('Card had issues:', card.getHealth());
}

// Monitor errors in development
if (bw.config.debug) {
  const monitor = bw.render('#debug', 'append', bw.createMonitorDashboard());
}

// Subscribe to errors
const unsubscribe = bw.eventLog.subscribe(entry => {
  if (entry.level === 'error') {
    // Send to error tracking service
    trackError(entry);
  }
});

// Query specific errors
const componentErrors = bw.eventLog.query({
  level: 'error',
  category: 'component',
  since: new Date(Date.now() - 3600000) // Last hour
});
```

## Benefits

1. **No surprise errors** - Framework handles issues gracefully
2. **Better debugging** - Complete event log with context
3. **Monitoring tools** - Built-in dashboard and stats
4. **Flexible logging** - Subscribe to events for external monitoring
5. **Developer friendly** - Clear messages about what went wrong
6. **Production safe** - Errors logged but app continues
7. **Chainable API** - Methods return self even on failure