# Bitwrench v2 Component Handle API Design

## Overview

Component handles provide a way to interact with rendered components after they're in the DOM. This enables dynamic updates without re-rendering the entire component.

## Basic Concept

```javascript
// Render a component and get a handle
const cardHandle = bw.render('#container', 'append', bw.makeCard({
  title: 'My Card',
  content: 'Initial content',
  footer: 'Card footer'
}));

// Update the card later
cardHandle.updateTitle('New Title');
cardHandle.updateContent('Updated content');
```

## Handle API Design

### Core Handle Methods

```javascript
const handle = {
  // Component metadata
  type: 'card',           // Component type
  id: 'bw_12345',        // Unique component ID
  element: domElement,    // Root DOM element
  
  // Generic property access
  get(prop) {},          // Get single property
  set(prop, value) {},   // Set single property
  update(props) {},      // Update multiple properties
  
  // State management
  getState() {},         // Get component state
  setState(updates) {},  // Update state (triggers re-render if needed)
  
  // DOM manipulation
  show() {},
  hide() {},
  remove() {},
  destroy() {},          // Remove and cleanup
  
  // Event handling
  on(event, handler) {},
  off(event, handler) {},
  trigger(event, data) {},
  
  // Component-specific methods (see below)
};
```

### Component-Specific Methods

Each component type would have specific update methods:

#### Card Handle
```javascript
const cardHandle = {
  ...baseHandle,
  
  // Card-specific updates
  updateTitle(title) {
    this.set('title', title);
    this._updateDOM('title', title);
  },
  
  updateContent(content) {
    this.set('content', content);
    this._updateDOM('content', content);
  },
  
  updateFooter(footer) {
    this.set('footer', footer);
    this._updateDOM('footer', footer);
  },
  
  setImage(src, alt) {
    this.update({ imageSrc: src, imageAlt: alt });
    this._updateDOM('image', { src, alt });
  },
  
  // Batch update
  updateCard(updates) {
    this.update(updates);
    Object.keys(updates).forEach(key => {
      this._updateDOM(key, updates[key]);
    });
  }
};
```

#### Table Handle
```javascript
const tableHandle = {
  ...baseHandle,
  
  // Table-specific updates
  addRow(rowData) {
    const rows = this.get('data');
    rows.push(rowData);
    this._appendRow(rowData);
  },
  
  updateRow(index, rowData) {
    const rows = this.get('data');
    rows[index] = rowData;
    this._updateRowDOM(index, rowData);
  },
  
  removeRow(index) {
    const rows = this.get('data');
    rows.splice(index, 1);
    this._removeRowDOM(index);
  },
  
  sort(column, direction) {
    this.setState({ sortColumn: column, sortDirection: direction });
    this._sortAndRender();
  },
  
  filter(filterFn) {
    this.setState({ filter: filterFn });
    this._filterAndRender();
  },
  
  // Pagination
  setPage(pageNum) {
    this.setState({ currentPage: pageNum });
    this._renderPage();
  }
};
```

#### Modal Handle
```javascript
const modalHandle = {
  ...baseHandle,
  
  show() {
    this.element.classList.add('show');
    this.trigger('show');
  },
  
  hide() {
    this.element.classList.remove('show');
    this.trigger('hide');
  },
  
  updateTitle(title) {
    this.set('title', title);
    this._updateDOM('title', title);
  },
  
  updateBody(content) {
    this.set('body', content);
    this._updateDOM('body', content);
  },
  
  setButtons(buttons) {
    this.set('buttons', buttons);
    this._renderButtons(buttons);
  }
};
```

## Implementation Strategy

### 1. Enhanced Render Function

```javascript
bw.render = function(target, position, componentOrTaco) {
  // Detect if it's a component with handle support
  const isComponent = componentOrTaco._bw_component_type;
  
  if (isComponent) {
    // Create enhanced handle
    const handle = createComponentHandle(componentOrTaco);
    
    // Render to DOM
    const element = bw.createDOM(componentOrTaco);
    insertIntoDOM(target, position, element);
    
    // Initialize handle
    handle._init(element, componentOrTaco);
    
    // Register for cleanup
    bw._componentHandles.set(handle.id, handle);
    
    return handle;
  } else {
    // Regular TACO rendering
    return standardRender(target, position, componentOrTaco);
  }
};
```

### 2. Component Factory Enhancement

```javascript
bw.makeCard = function(config) {
  const taco = {
    t: 'div',
    a: { class: 'card', 'data-bw-component': 'card' },
    c: [...],
    o: {
      state: config,
      mounted: (el) => {
        // Setup event delegation
      }
    }
  };
  
  // Mark as component for handle creation
  taco._bw_component_type = 'card';
  taco._bw_config = config;
  
  return taco;
};
```

### 3. Handle Factory

```javascript
function createComponentHandle(component) {
  const type = component._bw_component_type;
  const config = component._bw_config;
  
  // Base handle
  const handle = {
    type,
    id: bw.uuid(),
    _props: { ...config },
    _state: {},
    
    // Generic methods
    get(prop) {
      return this._props[prop];
    },
    
    set(prop, value) {
      const oldValue = this._props[prop];
      this._props[prop] = value;
      this._updateDOM(prop, value, oldValue);
      this.trigger('change', { prop, value, oldValue });
    },
    
    update(props) {
      Object.entries(props).forEach(([key, value]) => {
        this.set(key, value);
      });
    },
    
    _updateDOM(prop, value, oldValue) {
      // Component-specific DOM update logic
      const updater = this._updaters[prop];
      if (updater) {
        updater.call(this, value, oldValue);
      }
    }
  };
  
  // Add component-specific methods
  const componentHandles = {
    card: CardHandle,
    table: TableHandle,
    modal: ModalHandle,
    // ... etc
  };
  
  if (componentHandles[type]) {
    Object.assign(handle, componentHandles[type]);
  }
  
  return handle;
}
```

### 4. DOM Update Strategies

```javascript
// Efficient DOM updates without full re-render
const CardHandle = {
  _updaters: {
    title: function(value) {
      const titleEl = this.element.querySelector('.card-title');
      if (titleEl) {
        titleEl.textContent = value;
      }
    },
    
    content: function(value) {
      const bodyEl = this.element.querySelector('.card-body');
      if (bodyEl) {
        // Handle both string and TACO content
        if (typeof value === 'string') {
          bodyEl.innerHTML = bw.escapeHTML(value);
        } else {
          bodyEl.innerHTML = '';
          bodyEl.appendChild(bw.createDOM(value));
        }
      }
    },
    
    class: function(value, oldValue) {
      if (oldValue) {
        this.element.classList.remove(...oldValue.split(' '));
      }
      this.element.classList.add(...value.split(' '));
    }
  }
};
```

## Event System

```javascript
// Mixin for event handling
const EventEmitter = {
  _events: {},
  
  on(event, handler) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(handler);
    return this;
  },
  
  off(event, handler) {
    if (!this._events[event]) return this;
    
    if (handler) {
      this._events[event] = this._events[event].filter(h => h !== handler);
    } else {
      delete this._events[event];
    }
    return this;
  },
  
  trigger(event, data) {
    if (!this._events[event]) return this;
    
    this._events[event].forEach(handler => {
      handler.call(this, data);
    });
    return this;
  }
};

// Add to handle
Object.assign(handle, EventEmitter);
```

## Usage Examples

### Interactive Card
```javascript
const card = bw.render('#app', 'append', bw.makeCard({
  title: 'User Profile',
  content: 'Loading...'
}));

// Listen for events
card.on('click', () => {
  console.log('Card clicked');
});

// Update when data arrives
fetch('/api/user/123')
  .then(res => res.json())
  .then(user => {
    card.updateTitle(user.name);
    card.updateContent(`
      Email: ${user.email}
      Joined: ${user.joinDate}
    `);
  });
```

### Dynamic Table
```javascript
const table = bw.render('#app', 'append', bw.makeTable({
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' }
  ],
  data: []
}));

// Add rows as they come in
websocket.on('newUser', user => {
  table.addRow(user);
});

// Update specific row
table.on('rowClick', (data) => {
  table.updateRow(data.index, {
    ...data.row,
    status: 'active'
  });
});

// Sort when header clicked
table.on('headerClick', (column) => {
  const currentSort = table.getState('sortDirection');
  table.sort(column, currentSort === 'asc' ? 'desc' : 'asc');
});
```

### Modal Control
```javascript
const modal = bw.render('body', 'append', bw.makeModal({
  title: 'Confirm Action',
  body: 'Are you sure?',
  buttons: [
    { text: 'Cancel', variant: 'secondary', action: 'close' },
    { text: 'Confirm', variant: 'primary', action: 'confirm' }
  ]
}));

// Show modal
document.querySelector('#delete-btn').addEventListener('click', () => {
  modal.show();
});

// Handle button clicks
modal.on('confirm', () => {
  deleteItem();
  modal.hide();
});

// Update content dynamically
modal.updateBody('Processing... please wait');
```

## Benefits

1. **No Re-rendering**: Updates only affected DOM nodes
2. **Event Handling**: Built-in event system for components
3. **State Management**: Components maintain their own state
4. **Memory Efficient**: Cleanup handled automatically
5. **Intuitive API**: Natural method names for updates
6. **Backward Compatible**: Still works with direct TACO manipulation

## Considerations

1. **Performance**: Direct DOM manipulation is faster than re-rendering
2. **Complexity**: Adds abstraction layer but provides better DX
3. **Memory**: Need to track handles and clean up on destroy
4. **Type Safety**: Could add TypeScript definitions for better IDE support

## Alternative Approach: Reactive Properties

```javascript
// Alternative: Make properties reactive
const card = bw.makeCard({
  title: bw.reactive('Initial Title'),
  content: bw.reactive('Initial Content')
});

// Later updates automatically reflect in DOM
card.title.value = 'New Title';
card.content.value = 'New Content';
```

This could use Proxy or getter/setter pattern for automatic updates.