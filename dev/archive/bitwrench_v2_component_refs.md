# Bitwrench v2 Component Reference Architecture

## Overview

Component references are live objects that provide methods to interact with rendered components. Each component type extends a base class with common functionality.

## Base Component Class

```javascript
// Base class for all component references
class BWComponent {
  constructor(element, config, taco) {
    this.element = element;           // Root DOM element
    this.id = element.getAttribute('data-bw-id') || bw.uuid();
    this.type = this.constructor.componentType;
    this._config = { ...config };     // Initial configuration
    this._state = {};                 // Runtime state
    this._taco = taco;               // Original TACO for re-rendering
    this._events = {};               // Event listeners
    
    // Set ID on element for later retrieval
    this.element.setAttribute('data-bw-id', this.id);
    
    // Initialize component-specific features
    this._init();
  }
  
  // To be overridden by subclasses
  _init() {}
  
  // Generic property access
  get(prop) {
    return this._config[prop];
  }
  
  set(prop, value) {
    const oldValue = this._config[prop];
    if (oldValue === value) return this;
    
    this._config[prop] = value;
    this._onPropChange(prop, value, oldValue);
    this.emit('change', { prop, value, oldValue });
    return this;
  }
  
  update(props) {
    Object.entries(props).forEach(([key, value]) => {
      this.set(key, value);
    });
    return this;
  }
  
  // State management (doesn't trigger prop changes)
  getState(key) {
    return key ? this._state[key] : { ...this._state };
  }
  
  setState(updates) {
    Object.assign(this._state, updates);
    this.emit('stateChange', updates);
    return this;
  }
  
  // DOM utilities
  find(selector) {
    return this.element.querySelector(selector);
  }
  
  findAll(selector) {
    return Array.from(this.element.querySelectorAll(selector));
  }
  
  show() {
    this.element.style.display = '';
    return this;
  }
  
  hide() {
    this.element.style.display = 'none';
    return this;
  }
  
  addClass(className) {
    this.element.classList.add(className);
    return this;
  }
  
  removeClass(className) {
    this.element.classList.remove(className);
    return this;
  }
  
  toggleClass(className) {
    this.element.classList.toggle(className);
    return this;
  }
  
  // Event system
  on(event, handler) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(handler);
    return this;
  }
  
  off(event, handler) {
    if (!this._events[event]) return this;
    if (handler) {
      this._events[event] = this._events[event].filter(h => h !== handler);
    } else {
      delete this._events[event];
    }
    return this;
  }
  
  emit(event, data) {
    if (this._events[event]) {
      this._events[event].forEach(handler => {
        handler.call(this, data);
      });
    }
    return this;
  }
  
  // Lifecycle
  destroy() {
    this.emit('beforeDestroy');
    
    // Remove from registry
    bw._componentRefs.delete(this.id);
    
    // Remove element
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    // Clear references
    this._events = {};
    this.element = null;
    
    this.emit('destroyed');
  }
  
  // To be implemented by subclasses
  _onPropChange(prop, newValue, oldValue) {
    // Default: update specific DOM element if updater exists
    if (this._updaters && this._updaters[prop]) {
      this._updaters[prop].call(this, newValue, oldValue);
    }
  }
}
```

## Card Component Reference

```javascript
class BWCard extends BWComponent {
  static componentType = 'card';
  
  _init() {
    // Define how to update specific parts of the card
    this._updaters = {
      title: (value) => {
        const el = this.find('.card-title');
        if (el) el.textContent = value;
      },
      
      subtitle: (value) => {
        const el = this.find('.card-subtitle');
        if (el) el.textContent = value;
      },
      
      content: (value) => {
        const el = this.find('.card-text');
        if (el) {
          if (typeof value === 'string') {
            el.innerHTML = bw.escapeHTML(value);
          } else {
            // Handle TACO content
            el.innerHTML = '';
            el.appendChild(bw.createDOM(value));
          }
        }
      },
      
      footer: (value) => {
        let el = this.find('.card-footer');
        if (value && !el) {
          // Create footer if doesn't exist
          const footer = bw.createDOM({
            t: 'div',
            a: { class: 'card-footer' },
            c: value
          });
          this.element.appendChild(footer);
        } else if (el && !value) {
          // Remove footer if value is empty
          el.remove();
        } else if (el) {
          // Update existing footer
          el.textContent = value;
        }
      },
      
      image: (value) => {
        let el = this.find('.card-img-top');
        if (value && !el) {
          // Create image
          const img = bw.createDOM({
            t: 'img',
            a: { class: 'card-img-top', src: value.src, alt: value.alt || '' }
          });
          const body = this.find('.card-body');
          this.element.insertBefore(img, body);
        } else if (el && !value) {
          // Remove image
          el.remove();
        } else if (el && value) {
          // Update image
          el.src = value.src;
          if (value.alt !== undefined) el.alt = value.alt;
        }
      }
    };
  }
  
  // Convenience methods for common updates
  setTitle(title) {
    return this.set('title', title);
  }
  
  setContent(content) {
    return this.set('content', content);
  }
  
  setFooter(footer) {
    return this.set('footer', footer);
  }
  
  setImage(src, alt) {
    return this.set('image', { src, alt });
  }
  
  // Card-specific methods
  setLoading(isLoading) {
    if (isLoading) {
      this.addClass('loading');
      this._originalContent = this.get('content');
      this.setContent({ t: 'div', a: { class: 'spinner' }, c: 'Loading...' });
    } else {
      this.removeClass('loading');
      if (this._originalContent) {
        this.setContent(this._originalContent);
      }
    }
    return this;
  }
  
  highlight(duration = 1000) {
    this.addClass('highlight');
    setTimeout(() => this.removeClass('highlight'), duration);
    return this;
  }
}
```

## Table Component Reference

```javascript
class BWTable extends BWComponent {
  static componentType = 'table';
  
  _init() {
    this._data = [...(this._config.data || [])];
    this._columns = this._config.columns || [];
    this._sortColumn = null;
    this._sortDirection = 'asc';
    this._filters = [];
    
    // Setup event delegation for efficiency
    this.element.addEventListener('click', this._handleClick.bind(this));
  }
  
  _handleClick(e) {
    // Handle header clicks for sorting
    const th = e.target.closest('th');
    if (th && th.dataset.column) {
      this.sort(th.dataset.column);
    }
    
    // Handle row clicks
    const tr = e.target.closest('tbody tr');
    if (tr) {
      const index = Array.from(tr.parentNode.children).indexOf(tr);
      this.emit('rowClick', { 
        index, 
        row: this._getVisibleData()[index],
        element: tr 
      });
    }
  }
  
  // Data manipulation
  addRow(rowData, index) {
    if (index !== undefined) {
      this._data.splice(index, 0, rowData);
    } else {
      this._data.push(rowData);
    }
    this._renderBody();
    this.emit('rowAdded', { row: rowData, index: index ?? this._data.length - 1 });
    return this;
  }
  
  updateRow(index, rowData) {
    if (index < 0 || index >= this._data.length) return this;
    
    const oldData = this._data[index];
    this._data[index] = { ...oldData, ...rowData };
    
    // Update just this row in DOM
    const tr = this.find(`tbody tr:nth-child(${index + 1})`);
    if (tr) {
      this._updateRowElement(tr, this._data[index]);
    }
    
    this.emit('rowUpdated', { index, oldData, newData: this._data[index] });
    return this;
  }
  
  removeRow(index) {
    if (index < 0 || index >= this._data.length) return this;
    
    const removed = this._data.splice(index, 1)[0];
    
    // Remove from DOM
    const tr = this.find(`tbody tr:nth-child(${index + 1})`);
    if (tr) tr.remove();
    
    this.emit('rowRemoved', { index, row: removed });
    return this;
  }
  
  // Bulk operations
  setData(data) {
    this._data = [...data];
    this._renderBody();
    this.emit('dataChanged', { data: this._data });
    return this;
  }
  
  getData() {
    return [...this._data];
  }
  
  clear() {
    this._data = [];
    this._renderBody();
    this.emit('cleared');
    return this;
  }
  
  // Sorting
  sort(column, direction) {
    if (column === this._sortColumn && !direction) {
      // Toggle direction
      this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortColumn = column;
      this._sortDirection = direction || 'asc';
    }
    
    this._renderBody();
    this.emit('sorted', { column: this._sortColumn, direction: this._sortDirection });
    return this;
  }
  
  // Filtering
  filter(filterFn) {
    if (typeof filterFn === 'function') {
      this._filters.push(filterFn);
    }
    this._renderBody();
    return this;
  }
  
  clearFilters() {
    this._filters = [];
    this._renderBody();
    return this;
  }
  
  // Search
  search(term, columns) {
    if (!term) {
      this.clearFilters();
      return this;
    }
    
    const searchColumns = columns || this._columns.map(c => c.key);
    const searchFilter = (row) => {
      return searchColumns.some(col => {
        const value = String(row[col] || '').toLowerCase();
        return value.includes(term.toLowerCase());
      });
    };
    
    this._filters = [searchFilter];
    this._renderBody();
    this.emit('search', { term, columns: searchColumns });
    return this;
  }
  
  // Get processed data (after filters and sorting)
  _getVisibleData() {
    let data = [...this._data];
    
    // Apply filters
    this._filters.forEach(filter => {
      data = data.filter(filter);
    });
    
    // Apply sorting
    if (this._sortColumn) {
      const column = this._columns.find(c => c.key === this._sortColumn);
      const compareFn = column?.compare || this._defaultCompare;
      
      data.sort((a, b) => {
        const result = compareFn(a[this._sortColumn], b[this._sortColumn]);
        return this._sortDirection === 'asc' ? result : -result;
      });
    }
    
    return data;
  }
  
  _defaultCompare(a, b) {
    if (a === b) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    return a < b ? -1 : 1;
  }
  
  // Rendering
  _renderBody() {
    const tbody = this.find('tbody');
    if (!tbody) return;
    
    const data = this._getVisibleData();
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Render new rows
    data.forEach(row => {
      const tr = bw.createDOM(this._createRowTaco(row));
      tbody.appendChild(tr);
    });
    
    // Update sort indicators
    this._updateSortIndicators();
  }
  
  _createRowTaco(row) {
    return {
      t: 'tr',
      c: this._columns.map(col => ({
        t: 'td',
        c: col.render ? col.render(row[col.key], row) : String(row[col.key] || '')
      }))
    };
  }
  
  _updateRowElement(tr, rowData) {
    const cells = tr.querySelectorAll('td');
    this._columns.forEach((col, i) => {
      if (cells[i]) {
        const content = col.render ? col.render(rowData[col.key], rowData) : String(rowData[col.key] || '');
        if (typeof content === 'string') {
          cells[i].textContent = content;
        } else {
          cells[i].innerHTML = '';
          cells[i].appendChild(bw.createDOM(content));
        }
      }
    });
  }
  
  _updateSortIndicators() {
    // Update header indicators
    this.findAll('th').forEach(th => {
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (th.dataset.column === this._sortColumn) {
        th.classList.add(`sorted-${this._sortDirection}`);
      }
    });
  }
  
  // Column operations
  addColumn(column, index) {
    if (index !== undefined) {
      this._columns.splice(index, 0, column);
    } else {
      this._columns.push(column);
    }
    this._renderHeaders();
    this._renderBody();
    return this;
  }
  
  removeColumn(key) {
    this._columns = this._columns.filter(col => col.key !== key);
    this._renderHeaders();
    this._renderBody();
    return this;
  }
  
  _renderHeaders() {
    const thead = this.find('thead tr');
    if (!thead) return;
    
    thead.innerHTML = '';
    this._columns.forEach(col => {
      const th = bw.createDOM({
        t: 'th',
        a: { 'data-column': col.key },
        c: col.label
      });
      thead.appendChild(th);
    });
  }
}
```

## Enhanced Render Function

```javascript
// Component registry
bw._componentRefs = new Map();
bw._componentClasses = {
  card: BWCard,
  table: BWTable,
  modal: BWModal,
  // ... other components
};

// Enhanced render that returns component references
bw.render = function(target, position, componentOrTaco) {
  // Get target element
  const targetEl = typeof target === 'string' 
    ? document.querySelector(target) 
    : target;
    
  if (!targetEl) throw new Error(`Target not found: ${target}`);
  
  // Check if it's a component
  const componentType = componentOrTaco._bw_component_type;
  
  if (componentType && bw._componentClasses[componentType]) {
    // Create DOM element
    const element = bw.createDOM(componentOrTaco);
    
    // Insert into DOM
    switch(position) {
      case 'append': targetEl.appendChild(element); break;
      case 'prepend': targetEl.insertBefore(element, targetEl.firstChild); break;
      case 'replace': targetEl.parentNode.replaceChild(element, targetEl); break;
      // ... other positions
    }
    
    // Create component reference
    const ComponentClass = bw._componentClasses[componentType];
    const ref = new ComponentClass(element, componentOrTaco._bw_config, componentOrTaco);
    
    // Register reference
    bw._componentRefs.set(ref.id, ref);
    
    return ref;
  } else {
    // Regular TACO rendering
    const element = bw.createDOM(componentOrTaco);
    // ... insert into DOM
    return element;
  }
};

// Get reference from element
bw.getRef = function(element) {
  const id = element.getAttribute('data-bw-id');
  return id ? bw._componentRefs.get(id) : null;
};

// Get all references of a type
bw.getRefs = function(type) {
  const refs = [];
  bw._componentRefs.forEach(ref => {
    if (!type || ref.type === type) {
      refs.push(ref);
    }
  });
  return refs;
};
```

## Usage Examples

### Card Example
```javascript
// Create and render a card
const card = bw.render('#container', 'append', bw.makeCard({
  title: 'User Profile',
  content: 'Loading user data...',
  footer: 'Last updated: never'
}));

// Listen for events
card.on('click', () => {
  card.highlight();
});

// Update when data arrives
fetch('/api/user/123')
  .then(res => res.json())
  .then(user => {
    card.setTitle(user.name)
        .setContent(`Email: ${user.email}\nRole: ${user.role}`)
        .setFooter(`Last updated: ${new Date().toLocaleString()}`);
    
    if (user.avatar) {
      card.setImage(user.avatar, `${user.name}'s avatar`);
    }
  })
  .catch(err => {
    card.addClass('error')
        .setContent('Failed to load user data');
  });

// Loading state
card.setLoading(true);
setTimeout(() => card.setLoading(false), 2000);
```

### Table Example
```javascript
// Create table with initial data
const table = bw.render('#container', 'append', bw.makeTable({
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status', render: (val) => 
      bw.html({ t: 'span', a: { class: `badge-${val}` }, c: val })
    }
  ],
  data: [
    { id: 1, name: 'John', email: 'john@example.com', status: 'active' },
    { id: 2, name: 'Jane', email: 'jane@example.com', status: 'inactive' }
  ]
}));

// Add new rows
table.addRow({ id: 3, name: 'Bob', email: 'bob@example.com', status: 'active' });

// Update specific row
table.updateRow(1, { status: 'active' });

// Remove row
table.removeRow(0);

// Search functionality
document.querySelector('#search').addEventListener('input', (e) => {
  table.search(e.target.value);
});

// Sort on header click (automatic via event delegation)

// Listen for row clicks
table.on('rowClick', (data) => {
  console.log('Clicked row:', data.row);
  // Open edit modal, etc.
});

// Bulk update
fetch('/api/users')
  .then(res => res.json())
  .then(users => table.setData(users));
```

## Benefits

1. **Object-Oriented**: Natural class hierarchy for components
2. **Type-Specific Methods**: Each component has relevant methods
3. **Efficient Updates**: Only update what changed
4. **Event System**: Built-in events for interactivity
5. **Extensible**: Easy to add new component types
6. **Memory Safe**: References cleaned up on destroy
7. **Intuitive API**: Methods match what developers expect

## Next Steps

1. Implement base class and 2-3 components
2. Add TypeScript definitions
3. Create more specialized components (Form, Modal, etc.)
4. Add animation/transition support
5. Consider virtual DOM diffing for complex updates