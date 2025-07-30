# Bitwrench v2 Core Architecture Thinking

## The Fundamental Question

How do we build a UI library that provides the power of modern frameworks without their complexity? After analyzing jQuery, Bootstrap, React, Vue, Svelte, SolidJS, and Web Components, I believe the answer lies in treating **UI as data transformation**.

## Framework Evolution: Learning from History

### The Timeline of Pain Points

1. **2006 - jQuery**: "The DOM API is hostile to developers"
   - Solution: Friendly API wrapper
   - Key insight: Developer experience matters more than purity

2. **2010 - Backbone**: "We need structure for complex apps"
   - Solution: MVC patterns for JavaScript
   - Key insight: Patterns help manage complexity

3. **2013 - React**: "UI state synchronization is error-prone"
   - Solution: UI = f(state), virtual DOM
   - Key insight: Declarative > Imperative

4. **2014 - Vue**: "React is too complex for simple use cases"
   - Solution: Progressive framework
   - Key insight: Gradual adoption path

5. **2019 - Svelte**: "Runtime overhead is wasteful"
   - Solution: Compile-time optimization
   - Key insight: Do more at build time

6. **2020 - SolidJS**: "Virtual DOM is unnecessary overhead"
   - Solution: Fine-grained reactivity
   - Key insight: Surgical updates > full re-renders

### What They All Missed

Every framework added tooling complexity. Build steps, transpilation, bundlers, dev servers. **The cure became part of the disease**.

## Bitwrench's Opportunity

**Core Thesis**: Modern web development's complexity isn't essential - it's accidental. We can have the power without the pain.

### The Key Insight

UI libraries solve three fundamental problems:
1. **Creation**: How do we describe UI?
2. **Updates**: How do we change UI over time?
3. **Composition**: How do we build complex UIs from simple parts?

Everything else is optimization or convention.

## Deep Dive: How Frameworks Handle Core Concerns

### 1. Styles & Theming

#### The Spectrum of Approaches

```javascript
// Global CSS (Bootstrap/jQuery)
// ✅ Simple, shareable
// ❌ Naming conflicts, specificity wars
<div class="btn btn-primary btn-lg">

// CSS Modules (React)
// ✅ Locally scoped
// ❌ Build step required
import styles from './Button.module.css';
<button className={styles.primary}>

// CSS-in-JS (Styled Components)
// ✅ Dynamic, themeable
// ❌ Runtime overhead, learning curve
const Button = styled.button`
  background: ${props => props.theme.primary};
`;

// Utility-First (Tailwind)
// ✅ Rapid prototyping
// ❌ Verbose HTML, memorization required
<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">

// Scoped Styles (Vue/Svelte)
// ✅ Component encapsulation
// ❌ Build step, can't share dynamically
<style scoped>
.button { background: var(--primary); }
</style>
```

#### The Bitwrench Way: Styles as Data

```javascript
// Themes are just constants - plain JavaScript objects
const lightTheme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    background: '#ffffff',
    text: '#212529'
  },
  spacing: {
    sm: 8,
    md: 16,
    lg: 24
  }
};

const darkTheme = {
  colors: {
    primary: '#375a7f',
    secondary: '#6c757d',
    background: '#222222',
    text: '#ffffff'
  },
  spacing: lightTheme.spacing  // Can share values
};

// Components receive theme as props
const Button = (props, theme = lightTheme) => ({
  t: 'button',
  a: {
    class: `btn btn-${props.variant || 'primary'} bw_uuid_${bw.uuid()}`,
    // Convert style object to CSS string or inline styles
    style: bw.makeCSS({
      padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
      background: theme.colors.primary,
      color: 'white',
      border: 'none',
      borderRadius: '4px'
    })
  },
  c: props.text
});

// Or pass complex style objects
const cardStyles = {
  base: {
    padding: 24,
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  dark: {
    background: '#303030',
    color: '#fff'
  }
};

const Card = (props, theme) => ({
  t: 'div',
  a: {
    class: `card bw_uuid_${bw.uuid()}`,  // Always add UUID
    style: bw.makeCSS(theme === 'dark' ? {...cardStyles.base, ...cardStyles.dark} : cardStyles.base)
  },
  c: props.content
});
```

**Why This Works**:
- No build step required
- Styles are programmatic and composable
- Can generate CSS or inline styles
- Theme switching is just recomputing
- Type-checkable (if using TypeScript)

### 2. Component State & Updates

#### The Spectrum of Approaches

```javascript
// Manual DOM (jQuery)
// ✅ Direct, predictable
// ❌ Error-prone, tedious
$('#counter').text(parseInt($('#counter').text()) + 1);

// Virtual DOM (React)
// ✅ Declarative, reliable
// ❌ Overhead, requires reconciliation
function Counter() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}

// Reactive Bindings (Vue)
// ✅ Intuitive, automatic
// ❌ "Magic", debugging harder
data() {
  return { count: 0 }
}
// Template auto-updates when count changes

// Compiled Reactivity (Svelte)
// ✅ Minimal runtime, fast
// ❌ Build step required
let count = 0;
$: doubled = count * 2; // Reactive declaration

// Fine-grained Reactivity (SolidJS)
// ✅ Optimal updates, explicit
// ❌ Learning curve, different mental model
const [count, setCount] = createSignal(0);
return <div>{count()}</div>; // Only this updates
```

#### The Bitwrench Way: Handles with Component-Specific Methods

```javascript
// Each rendered component gets a unique class for selection
const Table = (data, columns) => ({
  t: 'table',
  a: { 
    class: `bw-table bw_uuid_${bw.uuid()}`,  // Unique identifier
    'data-sortable': 'true'
  },
  c: [
    // Table header and body...
  ],
  o: {
    type: 'table',  // Component type for handle generation
    state: { 
      data: data,
      sortColumn: null,
      sortDirection: 'asc'
    }
  }
});

// Render returns a handle with component-specific methods
const tableHandle = bw.render('#data-table', Table(myData, columns));

// Handle has generic methods plus table-specific ones:
tableHandle.element;           // DOM element reference
tableHandle.uuid;              // 'bw_uuid_abc123'
tableHandle.select();          // bw.$('.bw_uuid_abc123')

// Table-specific methods
tableHandle.addRow(rowData);                    // Add new row
tableHandle.updateRow(index, newData);          // Update specific row  
tableHandle.deleteRow(index);                   // Remove row
tableHandle.sortBy(columnName, direction);      // Sort table
tableHandle.filter(filterFn);                   // Filter rows
tableHandle.getSelectedRows();                  // Get selected rows
tableHandle.exportToCSV();                      // Export data

// Example: Dynamic table updates
fetch('/api/users')
  .then(res => res.json())
  .then(users => {
    users.forEach(user => tableHandle.addRow(user));
  });

// Find component by UUID
const table = bw.$('.bw_uuid_abc123')[0];
const handle = bw.getHandle(table);  // Get handle from element
```

**Why This Works**:
- Explicit is better than implicit
- Multiple update strategies for different needs
- No magic - you can see exactly what updates
- Performance when needed, simplicity by default

### 3. Props, Composition & Communication

#### The Spectrum of Approaches

```javascript
// Props Drilling (React)
// ✅ Explicit data flow
// ❌ Verbose, refactoring pain
<Parent user={user}>
  <Child user={user}>
    <GrandChild user={user} />
  </Child>
</Parent>

// Context/Provide (React/Vue)
// ✅ Avoids drilling
// ❌ Implicit dependencies
const UserContext = createContext();
<UserContext.Provider value={user}>

// Stores (Svelte)
// ✅ Global reactive state
// ❌ Another concept to learn
import { writable } from 'svelte/store';
export const user = writable({});

// Events (Web Components)
// ✅ Decoupled, standard
// ❌ Stringly typed, bubble complexity
this.dispatchEvent(new CustomEvent('user-update', { 
  detail: user,
  bubbles: true 
}));
```

#### The Bitwrench Way: Multiple Communication Patterns

```javascript
// 1. Direct Props (like React)
const UserCard = (props) => ({
  t: 'div',
  c: `Hello ${props.user.name}`
});

// 2. Handle References (like Swing/MFC)
const app = bw.render('#app', App());
const userCard = app.find('userCard'); // Find by ref
userCard.update({ user: newUser });

// 3. Event Bus (like Vue 2)
const Menu = () => ({
  t: 'nav',
  a: {
    onclick: (e) => {
      if (e.target.matches('.menu-item')) {
        bw.emit('menu:select', { 
          item: e.target.dataset.item 
        });
      }
    }
  }
});

// Listen anywhere
bw.on('menu:select', (data) => {
  console.log('Selected:', data.item);
});

// 4. Shared State (like Zustand)
const store = bw.createStore({
  user: null,
  theme: 'light'
});

// Components can subscribe
const Header = () => ({
  t: 'header',
  c: store.user?.name || 'Guest',
  o: {
    mounted: (el, handle) => {
      store.subscribe('user', (user) => {
        handle.update({ userName: user.name });
      });
    }
  }
});

// 5. DOM as Communication Layer
// Components can find and communicate through DOM
const Dashboard = () => ({
  t: 'div',
  a: { 'data-role': 'dashboard' },
  o: {
    methods: {
      refreshData: function() {
        // Public method other components can call
        this.loadData();
      }
    }
  }
});

// Another component can find and call
const refreshButton = {
  a: {
    onclick: () => {
      const dashboard = document.querySelector('[data-role="dashboard"]');
      bw.getHandle(dashboard).refreshData();
    }
  }
};
```

**Why This Works**:
- Use the right tool for the job
- No forced architectural decisions
- Gradual complexity - start simple
- Interop with existing code

## The Core Architecture Decision

After deep analysis, here's my recommendation for Bitwrench v2:

### 1. Pure Functional Core

```javascript
// Everything starts as pure functions returning data
const Component = (props) => ({
  t: 'div',
  a: { ...computeAttributes(props) },
  c: computeChildren(props),
  o: { ...lifecycleOptions(props) }
});

// No classes, no inheritance, just function composition
const Button = (props) => ({
  ...BaseComponent(props),
  t: 'button',
  a: {
    ...BaseComponent(props).a,
    class: `btn btn-${props.variant || 'default'}`
  }
});
```

### 2. Handle System for Runtime Control

```javascript
// Handles bridge the functional and imperative worlds
const handle = {
  id: 'bw_abc123',
  element: domElement,
  state: componentState,
  props: componentProps,
  
  // Core methods
  update: (changes) => smartUpdate(element, changes),
  destroy: () => cleanup(element),
  
  // Event system
  on: (event, handler) => addEventListener(element, event, handler),
  emit: (event, data) => dispatchEvent(element, event, data),
  
  // Component methods
  ...componentMethods
};
```

### 3. Styles as First-Class Data

```javascript
// Style system that understands structure
bw.styles = {
  // Atomic styles
  atoms: {
    p1: { padding: 8 },
    p2: { padding: 16 },
    rounded: { borderRadius: 4 },
    shadow: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
  },
  
  // Semantic styles
  components: {
    card: ['p2', 'rounded', 'shadow'],
    button: {
      base: ['p1', 'rounded'],
      primary: { background: '#007bff', color: 'white' }
    }
  },
  
  // Compute final styles
  compute: (styleRefs, conditions) => {
    // Resolve references, apply conditions, return style object
  }
};
```

### 4. Theme System as Global State

```javascript
// Themes are just data that components reference
bw.theme = {
  current: 'light',
  
  values: {
    light: {
      colors: { primary: '#007bff', background: '#ffffff' },
      spacing: { unit: 8 }
    },
    dark: {
      colors: { primary: '#375a7f', background: '#222222' },
      spacing: { unit: 8 }
    }
  },
  
  // Get current theme value
  get: (path) => {
    // e.g., theme.get('colors.primary') returns current theme's primary
  },
  
  // Switch themes globally
  set: (themeName) => {
    bw.theme.current = themeName;
    bw.updateAll(); // Re-render all components
  }
};
```

## Why This Architecture?

### 1. **Progressive Complexity**
Start with simple TACO objects, add handles when needed, use stores for complex state.

### 2. **No Lock-In**
Each pattern (functional, handles, events, stores) is optional and interoperable.

### 3. **Debugging Paradise**
```javascript
console.log(component);  // See the exact TACO
console.log(handle);     // See all methods and state
console.log(bw.theme);   // See current theme
```

### 4. **Performance Options**
- Default: Full re-render (simple, reliable)
- Optimized: Surgical updates via handles
- Advanced: Custom update strategies

### 5. **True Portability**
```python
# Server can generate UI
def create_dashboard(data):
    return {
        "t": "div",
        "a": {"class": "dashboard"},
        "c": [
            {"t": "h1", "c": f"Welcome {data['user']}"},
            create_chart(data['metrics'])
        ]
    }
```

## The Philosophy

Bitwrench isn't trying to be React or Vue. It's trying to be what jQuery could have become if it evolved differently:

1. **Direct Manipulation When Needed**: Like jQuery's `$('.thing').text('new')`
2. **Declarative When Beneficial**: Like React's component model
3. **No Build Step Required**: Like the good old days
4. **Modern JavaScript**: Using ES6+ features browsers actually support
5. **Composable Everything**: Functions, styles, themes, components

## Implementation Priority

1. **Core TACO Engine** ✓ (Done)
2. **Handle System** (Next)
3. **Style Computation**
4. **Theme System**
5. **Component Library**
6. **Communication Patterns**

## The Litmus Test

Can a developer understand the entire system in an afternoon? If not, we've failed.

Bitwrench should feel like **"Oh, of course that's how it works"** not **"Wait, what's happening here?"**

## Complete Example: Interactive Dashboard

Let's build a real dashboard that demonstrates all these concepts working together:

```javascript
// Themes are just constants
const themes = {
  light: {
    colors: {
      primary: '#007bff',
      success: '#28a745',
      danger: '#dc3545',
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#212529',
      border: '#dee2e6'
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32
    }
  },
  dark: {
    colors: {
      primary: '#375a7f',
      success: '#00bc8c',
      danger: '#e74c3c',
      background: '#222222',
      surface: '#303030',
      text: '#ffffff',
      border: '#495057'
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32
    }
  }
};

// Current theme (could be in localStorage)
let currentTheme = themes.light;

// Shared state store
const dashboardStore = bw.createStore({
  user: { name: 'John Doe', role: 'Admin' },
  metrics: {
    revenue: 125000,
    users: 1234,
    growth: 12.5
  },
  selectedPeriod: '7d',
  notifications: []
});

// Metric Card Component with UUID
const MetricCard = ({ title, value, change, format = 'number' }, theme = currentTheme) => {
  const uuid = bw.uuid();
  return {
    t: 'div',
    a: { 
      class: `metric-card bw_uuid_${uuid}`,
      style: bw.makeCSS({
        padding: theme.spacing.lg,
        background: theme.colors.surface,
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s',
        cursor: 'pointer'
      }),
      onmouseover: function() { 
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
      },
      onmouseout: function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      }
    },
  c: [
    { 
      t: 'h3', 
      a: { 
        style: { 
          margin: 0, 
          color: bw.theme.get('colors.text'),
          fontSize: 14,
          opacity: 0.7
        } 
      }, 
      c: title 
    },
    { 
      t: 'div', 
      a: { 
        style: { 
          fontSize: 32, 
          fontWeight: 'bold',
          color: bw.theme.get('colors.text'),
          marginTop: 8
        },
        'data-bind': 'value'
      }, 
      c: format === 'currency' ? `$${value.toLocaleString()}` : value.toLocaleString()
    },
    change !== undefined && {
      t: 'div',
      a: {
        style: {
          fontSize: 14,
          marginTop: 8,
          color: change >= 0 ? bw.theme.get('colors.success') : bw.theme.get('colors.danger')
        }
      },
      c: [
        { t: 'span', c: change >= 0 ? '↑' : '↓' },
        ` ${Math.abs(change)}%`
      ]
    }
  ].filter(Boolean),
  o: {
    ref: `metric-${title.toLowerCase().replace(/\s+/g, '-')}`,
    updates: {
      value: (el, val) => {
        const valueEl = el.querySelector('[data-bind="value"]');
        valueEl.textContent = format === 'currency' ? `$${val.toLocaleString()}` : val.toLocaleString();
      }
    }
  }
});

// Period Selector Component
const PeriodSelector = ({ selected = '7d', onChange }) => ({
  t: 'div',
  a: { class: 'period-selector' },
  c: [
    { t: 'label', c: 'Period:', a: { style: { marginRight: 8 } } },
    {
      t: 'select',
      a: {
        value: selected,
        onchange: function(e) {
          const newPeriod = e.target.value;
          // Update store
          dashboardStore.set('selectedPeriod', newPeriod);
          // Emit event
          bw.emit('period:change', { period: newPeriod });
          // Call callback if provided
          if (onChange) onChange(newPeriod);
        },
        style: {
          padding: '8px 12px',
          borderRadius: 4,
          border: '1px solid #ddd'
        }
      },
      c: [
        { t: 'option', a: { value: '1d' }, c: 'Today' },
        { t: 'option', a: { value: '7d' }, c: 'Last 7 days' },
        { t: 'option', a: { value: '30d' }, c: 'Last 30 days' },
        { t: 'option', a: { value: '90d' }, c: 'Last 90 days' }
      ]
    }
  ]
});

// Chart Component (simplified)
const Chart = ({ data, type = 'line' }) => ({
  t: 'div',
  a: { 
    class: 'chart-container',
    style: {
      background: bw.theme.get('colors.surface'),
      padding: 24,
      borderRadius: 8,
      minHeight: 300
    }
  },
  c: {
    t: 'canvas',
    a: { id: 'chart', width: 400, height: 200 }
  },
  o: {
    mounted: (el, handle) => {
      // In real app, integrate Chart.js or similar
      const canvas = el.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      
      // Simple placeholder visualization
      ctx.fillStyle = bw.theme.get('colors.primary');
      ctx.fillRect(10, 150, 50, -data[0] || 0);
      ctx.fillRect(70, 150, 50, -data[1] || 0);
      ctx.fillRect(130, 150, 50, -data[2] || 0);
      
      // Store chart instance for updates
      handle.chartCtx = ctx;
    },
    updates: {
      data: (el, newData, oldData, handle) => {
        // Redraw chart with new data
        const ctx = handle.chartCtx;
        ctx.clearRect(0, 0, 400, 200);
        ctx.fillStyle = bw.theme.get('colors.primary');
        newData.forEach((val, i) => {
          ctx.fillRect(10 + (i * 60), 150, 50, -val);
        });
      }
    }
  }
});

// Header Component
const Header = ({ user }) => ({
  t: 'header',
  a: {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 32px',
      background: bw.theme.get('colors.primary'),
      color: 'white'
    }
  },
  c: [
    { t: 'h1', a: { style: { margin: 0 } }, c: 'Analytics Dashboard' },
    {
      t: 'div',
      a: { style: { display: 'flex', alignItems: 'center', gap: 16 } },
      c: [
        { 
          t: 'span', 
          c: `Welcome, ${user.name}`,
          a: { 'data-bind': 'userName' }
        },
        {
          t: 'button',
          a: {
            onclick: () => {
              const newTheme = bw.theme.current === 'light' ? 'dark' : 'light';
              bw.theme.set(newTheme);
              // Re-render entire dashboard
              dashboardHandle.update();
            },
            style: {
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 4,
              color: 'white',
              cursor: 'pointer'
            }
          },
          c: '🌓 Toggle Theme'
        }
      ]
    }
  ],
  o: {
    updates: {
      userName: (el, name) => {
        el.querySelector('[data-bind="userName"]').textContent = `Welcome, ${name}`;
      }
    }
  }
});

// Notification Component
const NotificationList = ({ notifications = [] }) => ({
  t: 'div',
  a: { 
    class: 'notifications',
    style: {
      position: 'fixed',
      top: 80,
      right: 20,
      width: 300,
      zIndex: 1000
    }
  },
  c: notifications.map((notif, i) => ({
    t: 'div',
    a: {
      class: `notification notification-${notif.type}`,
      style: {
        background: bw.theme.get('colors.surface'),
        border: `1px solid ${bw.theme.get(`colors.${notif.type}`)}`,
        borderRadius: 4,
        padding: 12,
        marginBottom: 8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    },
    c: [
      { t: 'span', c: notif.message },
      {
        t: 'button',
        a: {
          onclick: () => {
            // Remove notification
            const newNotifs = dashboardStore.get('notifications').filter((_, idx) => idx !== i);
            dashboardStore.set('notifications', newNotifs);
          },
          style: {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18
          }
        },
        c: '×'
      }
    ]
  }))
});

// Main Dashboard Component
const Dashboard = () => ({
  t: 'div',
  a: { 
    class: 'dashboard',
    style: {
      minHeight: '100vh',
      background: bw.theme.get('colors.background'),
      color: bw.theme.get('colors.text')
    }
  },
  c: [
    Header({ user: dashboardStore.get('user') }),
    
    {
      t: 'main',
      a: { style: { padding: 32 } },
      c: [
        // Controls row
        {
          t: 'div',
          a: { 
            style: { 
              marginBottom: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            } 
          },
          c: [
            { t: 'h2', c: 'Overview', a: { style: { margin: 0 } } },
            PeriodSelector({ 
              selected: dashboardStore.get('selectedPeriod'),
              onChange: (period) => {
                // Simulate loading new data
                addNotification('info', `Loading data for ${period}...`);
                
                // Update metrics after "loading"
                setTimeout(() => {
                  const multiplier = { '1d': 0.1, '7d': 1, '30d': 4.3, '90d': 12.9 }[period];
                  
                  dashboardStore.set('metrics', {
                    revenue: Math.floor(125000 * multiplier),
                    users: Math.floor(1234 * multiplier * 0.8),
                    growth: (12.5 * multiplier * 0.3).toFixed(1)
                  });
                  
                  // Update chart
                  const chartHandle = dashboardHandle.find('main-chart');
                  if (chartHandle) {
                    chartHandle.update({ 
                      data: [30 * multiplier, 50 * multiplier, 70 * multiplier] 
                    });
                  }
                  
                  addNotification('success', 'Data updated successfully');
                }, 1000);
              }
            })
          ]
        },
        
        // Metrics row
        {
          t: 'div',
          a: { 
            style: { 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 24,
              marginBottom: 24
            } 
          },
          c: [
            MetricCard({ 
              title: 'Revenue', 
              value: dashboardStore.get('metrics.revenue'),
              change: 12.5,
              format: 'currency'
            }),
            MetricCard({ 
              title: 'Active Users', 
              value: dashboardStore.get('metrics.users'),
              change: -3.2
            }),
            MetricCard({ 
              title: 'Growth Rate', 
              value: dashboardStore.get('metrics.growth') + '%',
              change: dashboardStore.get('metrics.growth')
            })
          ]
        },
        
        // Chart
        Chart({ data: [30, 50, 70] })
      ]
    },
    
    // Notifications
    NotificationList({ notifications: dashboardStore.get('notifications') })
  ],
  o: {
    ref: 'main-dashboard',
    mounted: (el, handle) => {
      // Subscribe to store changes
      dashboardStore.subscribe('metrics', (newMetrics) => {
        // Update metric cards
        Object.entries(newMetrics).forEach(([key, value]) => {
          const metricHandle = handle.find(`metric-${key}`);
          if (metricHandle) {
            metricHandle.update({ value });
          }
        });
      });
      
      dashboardStore.subscribe('notifications', () => {
        // Re-render notifications
        handle.update();
      });
      
      // Listen for global events
      bw.on('user:logout', () => {
        addNotification('info', 'Logging out...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      });
    }
  }
});

// Helper function to add notifications
function addNotification(type, message) {
  const notifications = dashboardStore.get('notifications');
  notifications.push({ type, message, timestamp: Date.now() });
  dashboardStore.set('notifications', notifications);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    const current = dashboardStore.get('notifications');
    const filtered = current.filter(n => n.timestamp !== notifications[notifications.length - 1].timestamp);
    dashboardStore.set('notifications', filtered);
  }, 5000);
}

// Complete Dashboard as single TACO - can be imported from JSON/ESM
const DashboardPage = (initialData = {}) => ({
  t: 'div',
  a: { 
    class: `dashboard-page bw_uuid_${bw.uuid()}`,
    style: bw.makeCSS({
      minHeight: '100vh',
      background: currentTheme.colors.background,
      color: currentTheme.colors.text
    })
  },
  c: [
    Header({ user: initialData.user || { name: 'Guest' } }, currentTheme),
    MainContent(initialData, currentTheme),
    NotificationArea([], currentTheme)
  ],
  o: {
    type: 'dashboard',
    mounted: (el, handle) => {
      // Dashboard-specific handle methods
      handle.addNotification = (type, message) => {
        const notifArea = bw.$('.notification-area', el)[0];
        const notifHandle = bw.getHandle(notifArea);
        notifHandle.add({ type, message });
      };
      
      handle.updateMetric = (metricName, value) => {
        const metric = bw.$(`.metric-${metricName}`, el)[0];
        const metricHandle = bw.getHandle(metric);
        metricHandle.updateValue(value);
      };
      
      handle.switchTheme = (themeName) => {
        currentTheme = themes[themeName];
        handle.rerender();  // Full re-render with new theme
      };
    }
  }
});

// Initialize the dashboard
const dashboardHandle = bw.render('#app', DashboardPage(initialData));

// Table with specific methods
const UsersTable = (users = []) => ({
  t: 'table',
  a: { 
    class: `users-table bw_uuid_${bw.uuid()}`,
    style: 'width: 100%'
  },
  c: [
    { t: 'thead', c: /* headers */ },
    { t: 'tbody', c: /* rows */ }
  ],
  o: {
    type: 'table',
    state: { 
      data: users,
      sortColumn: null,
      filter: null 
    }
  }
});

// Render table and get handle with table-specific methods
const tableHandle = bw.render('#users-container', UsersTable(userData));

// Use table-specific methods
tableHandle.addRow({ name: 'New User', email: 'new@example.com' });
tableHandle.sortBy('name', 'asc');
tableHandle.filter(row => row.active === true);
tableHandle.highlightRow(3);

// Find components by UUID
const allMetricCards = bw.$('[class*="bw_uuid_"]').filter(el => 
  el.classList.contains('metric-card')
);

// Update specific component
const revenueCard = bw.$('.metric-revenue')[0];
const revenueHandle = bw.getHandle(revenueCard);
revenueHandle.updateValue(150000);

// Import complete pages
import { AdminDashboard } from './pages/admin-dashboard.js';
bw.render('#app', AdminDashboard({ user: currentUser }));

// Or load from JSON
fetch('/api/page-config/dashboard')
  .then(res => res.json())
  .then(pageConfig => {
    bw.render('#app', pageConfig);  // TACO from server
  });
```

### Key Patterns Demonstrated

1. **UUID Classes**: Every component gets `bw_uuid_xxxx` for unique selection via `bw.$('.bw_uuid_xxxx')`
2. **Themes as Constants**: Themes are plain objects passed to components, not global state
3. **Handle Methods**: Component-specific methods on handles (e.g., `tableHandle.addRow()`)
4. **DOM Selectors**: `bw.$()` provides jQuery-like selection returning arrays
5. **Style Objects**: `bw.makeCSS()` converts style objects to CSS strings
6. **Nested Composition**: Full pages as single TACO objects with nested components
7. **Import/Export**: Pages can be ESM modules or loaded as JSON
8. **Component Types**: `o.type` determines which handle methods are added

### Architecture Summary

```javascript
// 1. Everything is a TACO
const component = {
  t: 'div',                              // HTML tag
  a: { 
    class: `my-class bw_uuid_${uuid}`,   // Always add UUID
    style: bw.makeCSS(styleObject)       // Convert styles
  },
  c: [...],                              // Children (TACOs, strings, arrays)
  o: {                                   // Options
    type: 'table',                       // Component type for handles
    state: {},                           // Component state
    mounted: (el, handle) => {},         // Lifecycle
    unmount: (el, handle) => {}          // Cleanup
  }
};

// 2. Render returns handle with methods
const handle = bw.render(target, component);
handle.element;                          // DOM element
handle.uuid;                             // Component UUID
handle.update(changes);                  // Update component
handle[componentMethod]();               // Type-specific methods

// 3. Find and manipulate
const el = bw.$('.bw_uuid_abc123')[0];  // Find by UUID
const handle = bw.getHandle(el);         // Get handle from element
handle.updateValue(newValue);            // Use handle methods
```

This approach maintains the simplicity of "UI as data" while providing the programmatic control needed for complex applications.