# Bitwrench v2 Examples: Composing Full Pages

This document shows how to compose complete, interactive pages using bitwrench components.

## Example 1: Blog/Article Page

```javascript
// Import components (or define inline)
import { Navbar, Card, Footer, Sidebar } from './components.js';

// Theme configuration
const theme = {
  colors: {
    primary: '#2c3e50',
    secondary: '#3498db',
    text: '#333',
    bg: '#ecf0f1'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '2rem',
    xl: '3rem'
  }
};

// Article component
const Article = ({ title, author, date, content, tags }) => ({
  t: "article",
  a: { class: "article" },
  c: [
    {
      t: "header",
      a: { class: "article-header" },
      c: [
        { t: "h1", c: title },
        {
          t: "div",
          a: { class: "article-meta" },
          c: [
            { t: "span", c: `By ${author}` },
            { t: "span", c: " • " },
            { t: "time", a: { datetime: date }, c: new Date(date).toLocaleDateString() }
          ]
        }
      ]
    },
    {
      t: "div",
      a: { class: "article-content" },
      c: content
    },
    tags && {
      t: "div",
      a: { class: "article-tags" },
      c: tags.map(tag => ({
        t: "span",
        a: { class: "tag" },
        c: tag
      }))
    }
  ].filter(Boolean)
});

// Compose the blog page
const BlogPage = () => {
  // Sample data (could come from API)
  const articles = [
    {
      id: 1,
      title: "Getting Started with Bitwrench",
      author: "Jane Doe",
      date: "2024-01-15",
      excerpt: "Learn how to build UIs with just JavaScript objects...",
      tags: ["tutorial", "javascript"]
    },
    {
      id: 2,
      title: "Advanced Component Patterns",
      author: "John Smith",
      date: "2024-01-10",
      excerpt: "Explore advanced patterns for building reusable components...",
      tags: ["advanced", "patterns"]
    }
  ];

  const sidebarContent = {
    t: "div",
    c: [
      { t: "h3", c: "Categories" },
      {
        t: "ul",
        c: ["JavaScript", "Tutorial", "Advanced"].map(cat => ({
          t: "li",
          c: { t: "a", a: { href: `#${cat.toLowerCase()}` }, c: cat }
        }))
      },
      { t: "h3", c: "Recent Posts" },
      {
        t: "ul",
        c: articles.slice(0, 5).map(article => ({
          t: "li",
          c: { t: "a", a: { href: `#${article.id}` }, c: article.title }
        }))
      }
    ]
  };

  return {
    t: "div",
    a: { class: "page blog-page" },
    c: [
      Navbar({
        brand: "My Blog",
        links: [
          { text: "Home", href: "/" },
          { text: "Articles", href: "/articles", active: true },
          { text: "About", href: "/about" },
          { text: "Contact", href: "/contact" }
        ]
      }),
      {
        t: "div",
        a: { class: "container" },
        c: {
          t: "div",
          a: { class: "content-with-sidebar" },
          c: [
            {
              t: "main",
              a: { class: "main-content" },
              c: [
                { t: "h1", c: "Latest Articles" },
                {
                  t: "div",
                  a: { class: "articles-grid" },
                  c: articles.map(article => 
                    Card({
                      title: article.title,
                      content: [
                        { t: "p", c: article.excerpt },
                        {
                          t: "div",
                          a: { class: "article-footer" },
                          c: [
                            { t: "small", c: `By ${article.author} • ${new Date(article.date).toLocaleDateString()}` },
                            {
                              t: "a",
                              a: { href: `#article-${article.id}`, class: "read-more" },
                              c: "Read more →"
                            }
                          ]
                        }
                      ]
                    })
                  )
                }
              ]
            },
            {
              t: "aside",
              a: { class: "sidebar" },
              c: sidebarContent
            }
          ]
        }
      },
      Footer({
        copyright: "© 2024 My Blog. All rights reserved."
      })
    ]
  };
};

// Render the page
bw.DOM("body", BlogPage());

// Add styles
const blogStyles = bw.css({
  '.content-with-sidebar': {
    display: 'grid',
    'grid-template-columns': '1fr 300px',
    gap: theme.spacing.lg,
    'margin-top': theme.spacing.lg
  },
  '.articles-grid': {
    display: 'grid',
    gap: theme.spacing.md,
    'margin-top': theme.spacing.md
  },
  '.article-footer': {
    display: 'flex',
    'justify-content': 'space-between',
    'align-items': 'center',
    'margin-top': theme.spacing.sm
  },
  '.read-more': {
    color: theme.colors.primary,
    'text-decoration': 'none',
    'font-weight': 'bold'
  }
});

// Inject styles
bw.injectCSS(blogStyles);
```

## Example 2: Dashboard Application

```javascript
// Dashboard with real-time updates
const Dashboard = () => {
  // Metrics data (could be from WebSocket)
  const metrics = {
    users: 1234,
    revenue: 45678,
    orders: 89,
    growth: 12.5
  };

  // Metric card component
  const MetricCard = ({ label, value, trend, icon }) => ({
    t: "div",
    a: { class: "metric-card" },
    c: [
      {
        t: "div",
        a: { class: "metric-header" },
        c: [
          icon && { t: "span", a: { class: "metric-icon" }, c: icon },
          { t: "h3", c: label }
        ]
      },
      {
        t: "div",
        a: { class: "metric-value" },
        c: String(value)
      },
      trend && {
        t: "div",
        a: { 
          class: "metric-trend " + (trend > 0 ? "positive" : "negative")
        },
        c: `${trend > 0 ? '↑' : '↓'} ${Math.abs(trend)}%`
      }
    ].filter(Boolean)
  });

  // Chart component (simplified)
  const Chart = ({ data, type = "line" }) => ({
    t: "div",
    a: { class: "chart-container" },
    c: {
      t: "canvas",
      a: { id: "chart-" + Date.now() }
    },
    o: {
      mounted: (el) => {
        // Here you'd initialize a chart library
        // For demo, just show placeholder
        const canvas = el.querySelector('canvas');
        canvas.width = 400;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 400, 200);
        ctx.fillStyle = '#333';
        ctx.font = '14px sans-serif';
        ctx.fillText('Chart placeholder', 150, 100);
      }
    }
  });

  // Activity feed
  const ActivityFeed = ({ activities }) => ({
    t: "div",
    a: { class: "activity-feed" },
    c: [
      { t: "h3", c: "Recent Activity" },
      {
        t: "ul",
        a: { class: "activity-list" },
        c: activities.map(activity => ({
          t: "li",
          a: { class: "activity-item" },
          c: [
            {
              t: "div",
              a: { class: "activity-content" },
              c: [
                { t: "strong", c: activity.user },
                { t: "span", c: ` ${activity.action}` }
              ]
            },
            {
              t: "time",
              a: { class: "activity-time" },
              c: activity.time
            }
          ]
        }))
      }
    ]
  });

  return {
    t: "div",
    a: { class: "dashboard" },
    c: [
      // Header with user menu
      {
        t: "header",
        a: { class: "dashboard-header" },
        c: [
          { t: "h1", c: "Dashboard" },
          {
            t: "div",
            a: { class: "user-menu" },
            c: [
              { t: "span", c: "Welcome, Admin" },
              Dropdown({
                label: "⚙️",
                items: [
                  { text: "Profile", href: "#profile" },
                  { text: "Settings", href: "#settings" },
                  { divider: true },
                  { text: "Logout", onclick: () => alert("Logging out...") }
                ]
              })
            ]
          }
        ]
      },

      // Metrics grid
      {
        t: "section",
        a: { class: "metrics-section" },
        c: {
          t: "div",
          a: { class: "metrics-grid" },
          c: [
            MetricCard({ label: "Total Users", value: metrics.users, trend: 5.2, icon: "👥" }),
            MetricCard({ label: "Revenue", value: `$${metrics.revenue}`, trend: metrics.growth, icon: "💰" }),
            MetricCard({ label: "Orders", value: metrics.orders, trend: -2.1, icon: "📦" }),
            MetricCard({ label: "Growth", value: `${metrics.growth}%`, icon: "📈" })
          ]
        }
      },

      // Charts and activity
      {
        t: "section",
        a: { class: "dashboard-content" },
        c: [
          {
            t: "div",
            a: { class: "charts-column" },
            c: [
              { t: "h2", c: "Analytics" },
              Chart({ type: "line" }),
              Chart({ type: "bar" })
            ]
          },
          {
            t: "div",
            a: { class: "activity-column" },
            c: ActivityFeed({
              activities: [
                { user: "John", action: "created a new order", time: "2 min ago" },
                { user: "Jane", action: "updated profile", time: "5 min ago" },
                { user: "Bob", action: "completed payment", time: "10 min ago" }
              ]
            })
          }
        ]
      }
    ]
  };
};

// Render dashboard
bw.DOM("#app", Dashboard());

// Dashboard styles
const dashboardStyles = bw.css({
  '.dashboard': {
    'min-height': '100vh',
    'background-color': '#f5f5f5'
  },
  '.dashboard-header': {
    display: 'flex',
    'justify-content': 'space-between',
    'align-items': 'center',
    padding: '1rem 2rem',
    'background-color': 'white',
    'box-shadow': '0 2px 4px rgba(0,0,0,0.1)'
  },
  '.metrics-grid': {
    display: 'grid',
    'grid-template-columns': 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
    padding: '2rem'
  },
  '.metric-card': {
    'background-color': 'white',
    padding: '1.5rem',
    'border-radius': '8px',
    'box-shadow': '0 2px 4px rgba(0,0,0,0.1)'
  },
  '.dashboard-content': {
    display: 'grid',
    'grid-template-columns': '2fr 1fr',
    gap: '2rem',
    padding: '0 2rem'
  }
});
```

## Example 3: E-commerce Product Page

```javascript
const ProductPage = ({ product }) => {
  // Image gallery component
  const ImageGallery = ({ images }) => ({
    t: "div",
    a: { class: "image-gallery" },
    c: [
      {
        t: "div",
        a: { class: "main-image" },
        c: {
          t: "img",
          a: {
            src: images[0],
            alt: "Product image",
            id: "main-product-image"
          }
        }
      },
      {
        t: "div",
        a: { class: "thumbnail-list" },
        c: images.map((img, idx) => ({
          t: "img",
          a: {
            src: img,
            alt: `Product ${idx + 1}`,
            class: "thumbnail" + (idx === 0 ? " active" : ""),
            onclick: function() {
              document.getElementById('main-product-image').src = img;
              document.querySelectorAll('.thumbnail').forEach(t => 
                t.classList.remove('active')
              );
              this.classList.add('active');
            }
          }
        }))
      }
    ]
  });

  // Product info with reactive quantity
  const ProductInfo = ({ product }) => ({
    t: "div",
    a: { class: "product-info" },
    c: [
      { t: "h1", c: product.name },
      {
        t: "div",
        a: { class: "price" },
        c: `$${product.price}`
      },
      {
        t: "div",
        a: { class: "rating" },
        c: [
          { t: "span", c: "★★★★☆" },
          { t: "span", c: ` (${product.reviews} reviews)` }
        ]
      },
      { t: "p", c: product.description },
      {
        t: "div",
        a: { class: "product-options" },
        c: [
          // Size selector
          product.sizes && {
            t: "div",
            a: { class: "option-group" },
            c: [
              { t: "label", c: "Size:" },
              {
                t: "select",
                a: { name: "size" },
                c: product.sizes.map(size => ({
                  t: "option",
                  a: { value: size },
                  c: size
                }))
              }
            ]
          },
          // Quantity selector
          {
            t: "div",
            a: { class: "option-group" },
            c: [
              { t: "label", c: "Quantity:" },
              {
                t: "div",
                a: { class: "quantity-selector" },
                c: [
                  {
                    t: "button",
                    a: {
                      onclick: function() {
                        const input = this.nextElementSibling;
                        input.value = Math.max(1, parseInt(input.value) - 1);
                      }
                    },
                    c: "-"
                  },
                  {
                    t: "input",
                    a: {
                      type: "number",
                      value: "1",
                      min: "1",
                      id: "quantity"
                    }
                  },
                  {
                    t: "button",
                    a: {
                      onclick: function() {
                        const input = this.previousElementSibling;
                        input.value = parseInt(input.value) + 1;
                      }
                    },
                    c: "+"
                  }
                ]
              }
            ]
          }
        ].filter(Boolean)
      },
      {
        t: "div",
        a: { class: "product-actions" },
        c: [
          Button({
            text: "Add to Cart",
            variant: "primary",
            size: "lg",
            onClick: () => {
              const quantity = document.getElementById('quantity').value;
              alert(`Added ${quantity} item(s) to cart!`);
            }
          }),
          Button({
            text: "♡ Add to Wishlist",
            variant: "secondary"
          })
        ]
      }
    ]
  });

  // Reviews section
  const ReviewsSection = ({ reviews }) => ({
    t: "section",
    a: { class: "reviews-section" },
    c: [
      { t: "h2", c: "Customer Reviews" },
      {
        t: "div",
        a: { class: "reviews-list" },
        c: reviews.map(review => ({
          t: "div",
          a: { class: "review" },
          c: [
            {
              t: "div",
              a: { class: "review-header" },
              c: [
                { t: "strong", c: review.author },
                { t: "span", c: " • " },
                { t: "span", c: "★".repeat(review.rating) },
                { t: "span", c: " • " },
                { t: "time", c: review.date }
              ]
            },
            { t: "p", c: review.comment }
          ]
        }))
      }
    ]
  });

  return {
    t: "div",
    a: { class: "product-page" },
    c: [
      Navbar({
        brand: "ShopName",
        links: [
          { text: "Home", href: "/" },
          { text: "Products", href: "/products" },
          { text: "Cart", href: "/cart" }
        ]
      }),
      {
        t: "main",
        a: { class: "container" },
        c: [
          {
            t: "div",
            a: { class: "product-detail" },
            c: [
              ImageGallery({ images: product.images }),
              ProductInfo({ product })
            ]
          },
          ReviewsSection({
            reviews: [
              { author: "Alice", rating: 5, date: "Jan 10, 2024", comment: "Great product!" },
              { author: "Bob", rating: 4, date: "Jan 8, 2024", comment: "Good quality, fast shipping." }
            ]
          })
        ]
      }
    ]
  };
};

// Sample product data
const sampleProduct = {
  name: "Premium Widget",
  price: 99.99,
  description: "This is a high-quality widget perfect for all your needs.",
  images: [
    "/img/product1.jpg",
    "/img/product2.jpg",
    "/img/product3.jpg"
  ],
  sizes: ["Small", "Medium", "Large"],
  reviews: 42
};

// Render the page
bw.DOM("body", ProductPage({ product: sampleProduct }));
```

## Example 4: Interactive SPA with Routing

```javascript
// Simple router
const Router = {
  routes: {},
  current: null,
  
  register(path, component) {
    this.routes[path] = component;
  },
  
  navigate(path) {
    const component = this.routes[path] || this.routes['404'];
    this.current = path;
    window.history.pushState({}, '', path);
    bw.DOM("#app", component());
  },
  
  init() {
    window.addEventListener('popstate', () => {
      this.navigate(window.location.pathname);
    });
    
    // Handle link clicks
    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && e.target.href.startsWith(window.location.origin)) {
        e.preventDefault();
        this.navigate(e.target.pathname);
      }
    });
  }
};

// Define pages
const HomePage = () => ({
  t: "div",
  c: [
    { t: "h1", c: "Welcome Home" },
    { t: "p", c: "This is the home page." },
    { t: "a", a: { href: "/about" }, c: "Go to About" }
  ]
});

const AboutPage = () => ({
  t: "div",
  c: [
    { t: "h1", c: "About Us" },
    { t: "p", c: "Learn more about our company." },
    { t: "a", a: { href: "/" }, c: "Back to Home" }
  ]
});

const NotFoundPage = () => ({
  t: "div",
  c: [
    { t: "h1", c: "404 - Page Not Found" },
    { t: "a", a: { href: "/" }, c: "Go Home" }
  ]
});

// Register routes
Router.register('/', HomePage);
Router.register('/about', AboutPage);
Router.register('404', NotFoundPage);

// Initialize router
Router.init();
Router.navigate(window.location.pathname);
```

## Dynamic Updates Pattern

```javascript
// Store pattern for reactive updates
const Store = {
  state: {
    todos: [],
    filter: 'all'
  },
  
  subscribers: [],
  
  subscribe(fn) {
    this.subscribers.push(fn);
  },
  
  setState(updates) {
    Object.assign(this.state, updates);
    this.notify();
  },
  
  notify() {
    this.subscribers.forEach(fn => fn(this.state));
  }
};

// Todo app with reactive updates
const TodoApp = () => {
  const TodoItem = ({ todo, index }) => ({
    t: "li",
    a: { class: todo.completed ? "completed" : "" },
    c: [
      {
        t: "input",
        a: {
          type: "checkbox",
          checked: todo.completed,
          onchange: function() {
            const todos = [...Store.state.todos];
            todos[index].completed = this.checked;
            Store.setState({ todos });
          }
        }
      },
      { t: "span", c: todo.text },
      {
        t: "button",
        a: {
          onclick: () => {
            const todos = Store.state.todos.filter((_, i) => i !== index);
            Store.setState({ todos });
          }
        },
        c: "Delete"
      }
    ]
  });

  const filteredTodos = () => {
    const { todos, filter } = Store.state;
    switch (filter) {
      case 'active': return todos.filter(t => !t.completed);
      case 'completed': return todos.filter(t => t.completed);
      default: return todos;
    }
  };

  return {
    t: "div",
    a: { class: "todo-app" },
    c: [
      { t: "h1", c: "Todo List" },
      {
        t: "form",
        a: {
          onsubmit: function(e) {
            e.preventDefault();
            const input = this.querySelector('input');
            if (input.value.trim()) {
              const todos = [...Store.state.todos, {
                text: input.value,
                completed: false
              }];
              Store.setState({ todos });
              input.value = '';
            }
          }
        },
        c: [
          {
            t: "input",
            a: {
              type: "text",
              placeholder: "What needs to be done?"
            }
          },
          { t: "button", a: { type: "submit" }, c: "Add" }
        ]
      },
      {
        t: "ul",
        a: { class: "todo-list" },
        c: filteredTodos().map((todo, idx) => 
          TodoItem({ todo, index: idx })
        )
      },
      {
        t: "div",
        a: { class: "filters" },
        c: ['all', 'active', 'completed'].map(filter => ({
          t: "button",
          a: {
            class: Store.state.filter === filter ? "active" : "",
            onclick: () => Store.setState({ filter })
          },
          c: filter.charAt(0).toUpperCase() + filter.slice(1)
        }))
      }
    ]
  };
};

// Subscribe to updates
Store.subscribe(() => {
  bw.DOM("#app", TodoApp());
});

// Initial render
bw.DOM("#app", TodoApp());
```

## Key Patterns for Page Composition

1. **Component Composition**: Build pages by combining smaller components
2. **Data Flow**: Pass data down through props, events bubble up
3. **State Management**: Use simple store pattern for app-wide state
4. **Routing**: Implement client-side routing for SPAs
5. **Dynamic Updates**: Re-render components when data changes
6. **Event Delegation**: Use event bubbling for efficient event handling
7. **Lifecycle Hooks**: Clean up resources in unmount hooks

## Performance Tips

1. **Batch Updates**: Update multiple elements in one pass
2. **Event Delegation**: Attach events to parent elements
3. **Lazy Loading**: Load components only when needed
4. **Memoization**: Cache expensive computations
5. **Virtual Scrolling**: Render only visible items in long lists

## Server-Side Rendering

```javascript
// On the server (Node.js)
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  // Generate TACO on server
  const page = HomePage();
  
  // Convert to HTML string
  const html = bw.html(page);
  
  // Send full HTML page
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>My App</title>
      <script src="/bitwrench.js"></script>
    </head>
    <body>
      <div id="app">${html}</div>
      <script>
        // Hydrate on client
        const pageData = ${JSON.stringify(page)};
        bw.hydrate("#app", pageData);
      </script>
    </body>
    </html>
  `);
});
```

This approach gives you:
- SEO-friendly server-rendered HTML
- Fast initial page load
- Client-side interactivity after hydration
- Progressive enhancement