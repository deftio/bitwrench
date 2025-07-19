# Bitwrench v2 Component Library

This document shows how to build common UI components using bitwrench's TACO format and convert them to DOM elements.

## Core Concept: TACO to DOM

```javascript
// TACO object
const taco = {
  t: "div",           // tag
  a: { class: "box" }, // attributes
  c: "Hello",         // content
  o: {}               // options (lifecycle, state, etc.)
};

// Convert to DOM
bw.DOM("#app", taco);
// or
const html = bw.html(taco);
```

## Typography Components

### Headings (H1-H6)

```javascript
// Heading component
const Heading = ({ level = 1, children, className = "" }) => ({
  t: `h${level}`,
  a: { class: `bw-h${level} ${className}`.trim() },
  c: children
});

// Usage
Heading({ level: 1, children: "Page Title" })
Heading({ level: 2, children: "Section Title", className: "text-primary" })

// Or direct TACO
{ t: "h1", a: { class: "bw-h1" }, c: "Page Title" }
{ t: "h2", a: { class: "bw-h2" }, c: "Section Title" }
```

### Paragraph with Styles

```javascript
const Text = ({ children, size = "md", align = "left", color }) => ({
  t: "p",
  a: {
    class: `text-${size} text-${align}`,
    style: color ? { color } : {}
  },
  c: children
});
```

## Container Components

### Card

```javascript
const Card = ({ title, content, footer, image, onClick }) => ({
  t: "div",
  a: { 
    class: "card",
    onclick: onClick
  },
  c: [
    image && {
      t: "img",
      a: { 
        src: image.src,
        alt: image.alt || "",
        class: "card-image"
      }
    },
    {
      t: "div",
      a: { class: "card-body" },
      c: [
        title && { t: "h3", a: { class: "card-title" }, c: title },
        { t: "div", a: { class: "card-content" }, c: content }
      ]
    },
    footer && {
      t: "div",
      a: { class: "card-footer" },
      c: footer
    }
  ].filter(Boolean)
});

// Usage
Card({
  title: "Product Name",
  content: "Product description goes here",
  image: { src: "/product.jpg", alt: "Product" },
  footer: { t: "button", c: "Add to Cart" }
})
```

### Jumbotron/Hero

```javascript
const Jumbotron = ({ title, subtitle, cta, backgroundImage }) => ({
  t: "section",
  a: {
    class: "jumbotron",
    style: {
      "background-image": backgroundImage ? `url(${backgroundImage})` : undefined,
      "background-size": "cover",
      "background-position": "center",
      padding: "4rem 2rem",
      "text-align": "center"
    }
  },
  c: [
    { t: "h1", a: { class: "jumbotron-title" }, c: title },
    subtitle && { t: "p", a: { class: "jumbotron-subtitle" }, c: subtitle },
    cta && {
      t: "a",
      a: {
        href: cta.href || "#",
        class: "btn btn-primary btn-lg",
        onclick: cta.onclick
      },
      c: cta.text
    }
  ].filter(Boolean)
});
```

## Data Display Components

### Table

```javascript
const Table = ({ headers, rows, striped = true, sortable = false }) => ({
  t: "table",
  a: { 
    class: [
      "bw-table",
      striped && "bw-table-stripe",
      sortable && "bw-sortable"
    ].filter(Boolean).join(" ")
  },
  c: [
    {
      t: "thead",
      c: {
        t: "tr",
        c: headers.map((header, idx) => ({
          t: "th",
          a: sortable ? {
            onclick: function() {
              // Sorting logic here
              const table = this.closest('table');
              const tbody = table.querySelector('tbody');
              const rows = Array.from(tbody.querySelectorAll('tr'));
              
              rows.sort((a, b) => {
                const aVal = a.cells[idx].textContent;
                const bVal = b.cells[idx].textContent;
                return aVal.localeCompare(bVal);
              });
              
              tbody.innerHTML = '';
              rows.forEach(row => tbody.appendChild(row));
            },
            style: { cursor: "pointer" }
          } : {},
          c: header
        }))
      }
    },
    {
      t: "tbody",
      c: rows.map(row => ({
        t: "tr",
        c: Array.isArray(row) 
          ? row.map(cell => ({
              t: "td",
              c: typeof cell === 'object' && cell.t ? cell : String(cell)
            }))
          : Object.values(row).map(cell => ({
              t: "td",
              c: typeof cell === 'object' && cell.t ? cell : String(cell)
            }))
      }))
    }
  ]
});

// Usage
Table({
  headers: ["Name", "Age", "City"],
  rows: [
    ["John", 30, "New York"],
    ["Jane", 25, "London"],
    ["Bob", 35, "Paris"]
  ],
  sortable: true
})
```

### Lists

```javascript
// Unordered List
const List = ({ items, ordered = false }) => ({
  t: ordered ? "ol" : "ul",
  a: { class: "bw-list" },
  c: items.map(item => ({
    t: "li",
    c: typeof item === 'object' && item.t ? item : String(item)
  }))
});

// Definition List
const DefList = ({ items }) => ({
  t: "dl",
  a: { class: "bw-def-list" },
  c: items.flatMap(({ term, definition }) => [
    { t: "dt", c: term },
    { t: "dd", c: definition }
  ])
});
```

## Navigation Components

### Navbar

```javascript
const Navbar = ({ brand, links, sticky = false }) => ({
  t: "nav",
  a: {
    class: "navbar" + (sticky ? " navbar-sticky" : ""),
    style: sticky ? {
      position: "sticky",
      top: "0",
      "z-index": "1000"
    } : {}
  },
  c: [
    {
      t: "div",
      a: { class: "navbar-brand" },
      c: typeof brand === 'string' ? brand : brand
    },
    {
      t: "ul",
      a: { class: "navbar-nav" },
      c: links.map(link => ({
        t: "li",
        a: { class: "nav-item" },
        c: {
          t: "a",
          a: {
            href: link.href,
            class: "nav-link" + (link.active ? " active" : ""),
            onclick: link.onclick
          },
          c: link.text
        }
      }))
    }
  ]
});
```

### Breadcrumbs

```javascript
const Breadcrumbs = ({ items }) => ({
  t: "nav",
  a: { "aria-label": "breadcrumb" },
  c: {
    t: "ol",
    a: { class: "breadcrumb" },
    c: items.map((item, idx) => ({
      t: "li",
      a: { 
        class: "breadcrumb-item" + (idx === items.length - 1 ? " active" : "")
      },
      c: idx === items.length - 1 
        ? item.text
        : { t: "a", a: { href: item.href }, c: item.text }
    }))
  }
});
```

### Sidebar

```javascript
const Sidebar = ({ sections, collapsible = false }) => ({
  t: "aside",
  a: { class: "sidebar" },
  c: sections.map(section => ({
    t: "div",
    a: { class: "sidebar-section" },
    c: [
      {
        t: collapsible ? "button" : "h3",
        a: {
          class: "sidebar-title",
          ...(collapsible && {
            onclick: function() {
              const content = this.nextElementSibling;
              content.style.display = content.style.display === 'none' ? 'block' : 'none';
            }
          })
        },
        c: section.title
      },
      {
        t: "ul",
        a: { 
          class: "sidebar-content",
          style: collapsible ? { display: "none" } : {}
        },
        c: section.items.map(item => ({
          t: "li",
          c: {
            t: "a",
            a: { href: item.href },
            c: item.text
          }
        }))
      }
    ]
  }))
});
```

## Interactive Components

### Tabs

```javascript
const Tabs = ({ tabs, defaultActive = 0 }) => ({
  t: "div",
  a: { class: "tabs" },
  c: [
    {
      t: "div",
      a: { class: "tab-list" },
      c: tabs.map((tab, idx) => ({
        t: "button",
        a: {
          class: "tab-button" + (idx === defaultActive ? " active" : ""),
          onclick: function() {
            // Update active states
            const container = this.closest('.tabs');
            const buttons = container.querySelectorAll('.tab-button');
            const panels = container.querySelectorAll('.tab-panel');
            
            buttons.forEach((btn, i) => {
              btn.classList.toggle('active', i === idx);
              panels[i].style.display = i === idx ? 'block' : 'none';
            });
          }
        },
        c: tab.label
      }))
    },
    {
      t: "div",
      a: { class: "tab-panels" },
      c: tabs.map((tab, idx) => ({
        t: "div",
        a: {
          class: "tab-panel",
          style: { display: idx === defaultActive ? 'block' : 'none' }
        },
        c: tab.content
      }))
    }
  ]
});
```

### Accordion

```javascript
const Accordion = ({ items, allowMultiple = false }) => ({
  t: "div",
  a: { class: "accordion" },
  c: items.map((item, idx) => ({
    t: "div",
    a: { class: "accordion-item" },
    c: [
      {
        t: "button",
        a: {
          class: "accordion-header",
          onclick: function() {
            const panel = this.nextElementSibling;
            const isOpen = panel.style.display === 'block';
            
            if (!allowMultiple) {
              // Close all other panels
              const accordion = this.closest('.accordion');
              accordion.querySelectorAll('.accordion-panel').forEach(p => {
                p.style.display = 'none';
              });
            }
            
            panel.style.display = isOpen ? 'none' : 'block';
            this.classList.toggle('active');
          }
        },
        c: item.title
      },
      {
        t: "div",
        a: {
          class: "accordion-panel",
          style: { display: item.open ? 'block' : 'none' }
        },
        c: item.content
      }
    ]
  }))
});
```

### Dropdown

```javascript
const Dropdown = ({ label, items, variant = "default" }) => ({
  t: "div",
  a: { class: "dropdown" },
  c: [
    {
      t: "button",
      a: {
        class: `dropdown-toggle btn btn-${variant}`,
        onclick: function(e) {
          e.stopPropagation();
          const menu = this.nextElementSibling;
          menu.classList.toggle('show');
        }
      },
      c: label
    },
    {
      t: "div",
      a: { class: "dropdown-menu" },
      c: items.map(item => 
        item.divider 
          ? { t: "div", a: { class: "dropdown-divider" } }
          : {
              t: "a",
              a: {
                class: "dropdown-item",
                href: item.href || "#",
                onclick: item.onclick
              },
              c: item.text
            }
      )
    }
  ],
  o: {
    mounted: (el) => {
      // Close on outside click
      document.addEventListener('click', () => {
        el.querySelector('.dropdown-menu').classList.remove('show');
      });
    }
  }
});
```

### Carousel

```javascript
const Carousel = ({ slides, autoPlay = false, interval = 3000 }) => ({
  t: "div",
  a: { class: "carousel" },
  c: [
    {
      t: "div",
      a: { class: "carousel-inner" },
      c: slides.map((slide, idx) => ({
        t: "div",
        a: {
          class: "carousel-item" + (idx === 0 ? " active" : ""),
          style: { display: idx === 0 ? 'block' : 'none' }
        },
        c: slide
      }))
    },
    {
      t: "button",
      a: {
        class: "carousel-prev",
        onclick: function() {
          const carousel = this.closest('.carousel');
          const items = carousel.querySelectorAll('.carousel-item');
          const current = Array.from(items).findIndex(item => 
            item.style.display === 'block'
          );
          
          items[current].style.display = 'none';
          const prev = (current - 1 + items.length) % items.length;
          items[prev].style.display = 'block';
        }
      },
      c: "‹"
    },
    {
      t: "button",
      a: {
        class: "carousel-next",
        onclick: function() {
          const carousel = this.closest('.carousel');
          const items = carousel.querySelectorAll('.carousel-item');
          const current = Array.from(items).findIndex(item => 
            item.style.display === 'block'
          );
          
          items[current].style.display = 'none';
          const next = (current + 1) % items.length;
          items[next].style.display = 'block';
        }
      },
      c: "›"
    }
  ],
  o: {
    state: { timer: null },
    mounted: (el, state) => {
      if (autoPlay) {
        state.timer = setInterval(() => {
          el.querySelector('.carousel-next').click();
        }, interval);
      }
    },
    unmount: (el, state) => {
      clearInterval(state.timer);
    }
  }
});
```

## Form Components

### Button

```javascript
const Button = ({ 
  text, 
  variant = "primary", 
  size = "md", 
  disabled = false, 
  onClick,
  type = "button"
}) => ({
  t: "button",
  a: {
    class: `btn btn-${variant} btn-${size}`,
    disabled: disabled,
    type: type,
    onclick: onClick
  },
  c: text
});

// Button Group
const ButtonGroup = ({ buttons }) => ({
  t: "div",
  a: { class: "btn-group" },
  c: buttons.map(btn => Button(btn))
});
```

### Sign-in Form

```javascript
const SignInForm = ({ onSubmit, forgotPasswordLink }) => ({
  t: "form",
  a: {
    class: "sign-in-form",
    onsubmit: function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);
      onSubmit(data);
    }
  },
  c: [
    { t: "h2", c: "Sign In" },
    {
      t: "div",
      a: { class: "form-group" },
      c: [
        { t: "label", a: { for: "email" }, c: "Email" },
        {
          t: "input",
          a: {
            type: "email",
            id: "email",
            name: "email",
            class: "form-control",
            required: true,
            placeholder: "Enter your email"
          }
        }
      ]
    },
    {
      t: "div",
      a: { class: "form-group" },
      c: [
        { t: "label", a: { for: "password" }, c: "Password" },
        {
          t: "input",
          a: {
            type: "password",
            id: "password",
            name: "password",
            class: "form-control",
            required: true,
            placeholder: "Enter your password"
          }
        }
      ]
    },
    {
      t: "div",
      a: { class: "form-group" },
      c: [
        {
          t: "label",
          c: [
            {
              t: "input",
              a: {
                type: "checkbox",
                name: "remember",
                value: "1"
              }
            },
            " Remember me"
          ]
        }
      ]
    },
    Button({
      text: "Sign In",
      type: "submit",
      variant: "primary",
      size: "lg"
    }),
    forgotPasswordLink && {
      t: "p",
      a: { class: "text-center" },
      c: {
        t: "a",
        a: { href: forgotPasswordLink },
        c: "Forgot password?"
      }
    }
  ].filter(Boolean)
});
```

## Layout Components

### Grid System

```javascript
// Responsive Grid
const Grid = ({ cols = 12, gap = "1rem", children }) => ({
  t: "div",
  a: {
    class: "grid",
    style: {
      display: "grid",
      "grid-template-columns": `repeat(${cols}, 1fr)`,
      gap: gap
    }
  },
  c: children
});

// Flexbox Row/Col
const Row = ({ children, align = "stretch", justify = "start" }) => ({
  t: "div",
  a: {
    class: "row",
    style: {
      display: "flex",
      "align-items": align,
      "justify-content": justify,
      "flex-wrap": "wrap",
      margin: "0 -0.5rem"
    }
  },
  c: children
});

const Col = ({ children, span = 12, sm, md, lg }) => ({
  t: "div",
  a: {
    class: [
      `col-${span}`,
      sm && `col-sm-${sm}`,
      md && `col-md-${md}`,
      lg && `col-lg-${lg}`
    ].filter(Boolean).join(" "),
    style: {
      padding: "0 0.5rem"
    }
  },
  c: children
});
```

### Footer

```javascript
const Footer = ({ 
  columns, 
  copyright, 
  sticky = false,
  social 
}) => ({
  t: "footer",
  a: {
    class: "footer" + (sticky ? " footer-sticky" : ""),
    style: sticky ? {
      position: "sticky",
      bottom: "0",
      "margin-top": "auto"
    } : {}
  },
  c: [
    {
      t: "div",
      a: { class: "footer-content" },
      c: {
        t: "div",
        a: { class: "footer-columns" },
        c: columns.map(col => ({
          t: "div",
          a: { class: "footer-column" },
          c: [
            { t: "h4", c: col.title },
            {
              t: "ul",
              c: col.links.map(link => ({
                t: "li",
                c: {
                  t: "a",
                  a: { href: link.href },
                  c: link.text
                }
              }))
            }
          ]
        }))
      }
    },
    {
      t: "div",
      a: { class: "footer-bottom" },
      c: [
        copyright && { t: "p", c: copyright },
        social && {
          t: "div",
          a: { class: "social-links" },
          c: social.map(link => ({
            t: "a",
            a: {
              href: link.href,
              class: "social-link",
              "aria-label": link.label
            },
            c: link.icon
          }))
        }
      ].filter(Boolean)
    }
  ]
});
```

## Usage Example: Complete Page

```javascript
// Build a complete page
const App = () => ({
  t: "div",
  a: { class: "app" },
  c: [
    Navbar({
      brand: "My App",
      links: [
        { text: "Home", href: "/", active: true },
        { text: "About", href: "/about" },
        { text: "Contact", href: "/contact" }
      ],
      sticky: true
    }),
    
    Jumbotron({
      title: "Welcome to Bitwrench",
      subtitle: "Build amazing UIs with just JavaScript objects",
      cta: {
        text: "Get Started",
        href: "#docs"
      }
    }),
    
    {
      t: "main",
      a: { class: "container" },
      c: [
        Row({
          children: [
            Col({ span: 4, children: Card({ title: "Feature 1", content: "Description" }) }),
            Col({ span: 4, children: Card({ title: "Feature 2", content: "Description" }) }),
            Col({ span: 4, children: Card({ title: "Feature 3", content: "Description" }) })
          ]
        }),
        
        Tabs({
          tabs: [
            { label: "Overview", content: "Overview content..." },
            { label: "Features", content: "Features content..." },
            { label: "Pricing", content: "Pricing content..." }
          ]
        })
      ]
    },
    
    Footer({
      columns: [
        {
          title: "Product",
          links: [
            { text: "Features", href: "#" },
            { text: "Pricing", href: "#" }
          ]
        },
        {
          title: "Company",
          links: [
            { text: "About", href: "#" },
            { text: "Contact", href: "#" }
          ]
        }
      ],
      copyright: "© 2024 My Company",
      sticky: true
    })
  ]
});

// Render it
bw.DOM("body", App());
```

## Key Patterns

1. **Components are just functions** returning TACO objects
2. **Composition over inheritance** - combine simple components
3. **Event handlers as regular functions** in the attributes
4. **Lifecycle hooks in options** for setup/cleanup
5. **Direct DOM manipulation** for dynamic behavior
6. **No external dependencies** - pure JavaScript

This approach makes components:
- Easy to understand (just objects)
- Easy to test (pure functions)
- Easy to compose (nest objects)
- Easy to debug (inspect objects)
- Easy to serialize (send over network)