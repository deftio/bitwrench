# TACO Objects: Plain Objects vs Classes

## Current Design (Plain Objects)

```javascript
// TACO as plain object
const taco = {
  t: 'div',
  a: { class: 'card' },
  c: [
    { t: 'h1', c: 'Title' },
    { t: 'p', c: () => `Time: ${new Date()}` } // v1 supported functions
  ]
};

// Usage
const html = bw.html(taco);
const element = bw.createDOM(taco);
```

### Pros:
- Simple, lightweight
- JSON serializable
- Easy to understand
- No `new` keyword needed
- Composable through nesting

### Cons:
- No methods for manipulation
- Manual tree traversal
- No type checking
- Hard to validate structure

## Class-Based Alternative

```javascript
// TACO as class
class TACO {
  constructor(tag, attributes, content, options) {
    this.t = tag;
    this.a = attributes || {};
    this.c = content || [];
    this.o = options || {};
  }
  
  // Helper methods
  add(child) {
    if (typeof child === 'string') {
      this.c.push(child);
    } else if (child instanceof TACO || (child.t && child.c)) {
      this.c.push(child);
    }
    return this; // chainable
  }
  
  insert(position, child) {
    this.c.splice(position, 0, child);
    return this;
  }
  
  remove(child) {
    const idx = this.c.indexOf(child);
    if (idx > -1) this.c.splice(idx, 1);
    return this;
  }
  
  find(selector) {
    // Find child TACOs matching criteria
  }
  
  addClass(className) {
    this.a.class = this.a.class ? 
      `${this.a.class} ${className}` : className;
    return this;
  }
  
  attr(key, value) {
    if (value === undefined) return this.a[key];
    this.a[key] = value;
    return this;
  }
  
  toHTML() {
    return bw.html(this);
  }
  
  toDOM() {
    return bw.createDOM(this);
  }
  
  mount(selector) {
    return bw.DOM(selector, this);
  }
}

// Usage
const page = new TACO('div', { class: 'page' });
page
  .add(new TACO('h1', {}, 'Welcome'))
  .add(new TACO('p', {}, 'Hello world'))
  .addClass('container');

// Or with builder pattern
const card = bw.taco('div')
  .addClass('card')
  .add(bw.taco('h2').text('Card Title'))
  .add(bw.taco('p').text('Card content'));
```

## Hybrid Approach - Builder Pattern with Plain Objects

```javascript
// TACOBuilder that produces plain objects
class TACOBuilder {
  constructor(taco = {}) {
    this.taco = { ...taco };
  }
  
  tag(t) {
    this.taco.t = t;
    return this;
  }
  
  attr(key, value) {
    this.taco.a = this.taco.a || {};
    this.taco.a[key] = value;
    return this;
  }
  
  add(child) {
    this.taco.c = this.taco.c || [];
    this.taco.c.push(child);
    return this;
  }
  
  build() {
    return this.taco; // Returns plain object
  }
}

// Helper function
bw.build = function(tag) {
  return new TACOBuilder({ t: tag });
};

// Usage - still produces plain objects
const taco = bw.build('div')
  .attr('class', 'card')
  .add({ t: 'h1', c: 'Title' })
  .add({ t: 'p', c: 'Content' })
  .build(); // Returns plain object
```

## Function Content Support

v1 supported inline functions for dynamic content:

```javascript
// v1 style
bw.html({ 
  t: 'div', 
  c: function() { return new Date().toString(); }
});

// This should work in v2 too
const taco = {
  t: 'table',
  c: [
    {
      t: 'tbody',
      c: function() {
        // Dynamically generate rows
        return data.map(row => ({
          t: 'tr',
          c: row.map(cell => ({ t: 'td', c: cell }))
        }));
      }
    }
  ]
};
```

## Recommendation: Keep Plain Objects, Add Utilities

```javascript
// Keep TACO as plain objects for simplicity
const taco = {
  t: 'div',
  a: { class: 'page' },
  c: []
};

// But provide utility functions for manipulation
bw.taco = {
  // Create helpers
  create(tag, attrs, content) {
    return { t: tag, a: attrs || {}, c: content || [] };
  },
  
  // Manipulation helpers
  add(taco, child) {
    taco.c = taco.c || [];
    taco.c.push(child);
    return taco;
  },
  
  insert(taco, position, child) {
    taco.c = taco.c || [];
    taco.c.splice(position, 0, child);
    return taco;
  },
  
  remove(taco, child) {
    if (!taco.c) return taco;
    const idx = taco.c.indexOf(child);
    if (idx > -1) taco.c.splice(idx, 1);
    return taco;
  },
  
  addClass(taco, className) {
    taco.a = taco.a || {};
    taco.a.class = taco.a.class ? 
      `${taco.a.class} ${className}` : className;
    return taco;
  },
  
  // Query helpers
  find(taco, predicate) {
    // Recursively find matching children
  },
  
  // Transform helpers
  map(taco, transformer) {
    // Transform taco tree
  }
};

// Usage remains simple
const page = bw.taco.create('div', { class: 'page' });
bw.taco.add(page, { t: 'h1', c: 'Welcome' });
bw.taco.add(page, { t: 'p', c: () => `Time: ${new Date()}` });

// Or use chaining with a wrapper
const $ = (taco) => ({
  add(child) { bw.taco.add(taco, child); return this; },
  addClass(cls) { bw.taco.addClass(taco, cls); return this; },
  build() { return taco; }
});

$(page)
  .add({ t: 'h2', c: 'Section' })
  .addClass('container')
  .build();
```

## Conclusion

Keep TACO objects as plain objects because:
1. **Simplicity** - Easy to understand and create
2. **Serializable** - Can be stored/transmitted as JSON
3. **Lightweight** - No prototype chain or methods
4. **Flexible** - Works with existing bw.html() system

But provide utility functions for common operations:
- Creating TACOs
- Adding/removing children
- Finding elements
- Transforming trees
- Supporting function content (already works in v1)

This gives us the best of both worlds - simple data structures with powerful utilities when needed.