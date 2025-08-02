/**
 * Bitwrench v2 Components Implementation
 * All core components with make/create functions
 */

// Card Component
export function makeCard(props = {}) {
  const {
    title,
    content,
    footer,
    header,
    variant,
    className = '',
    style
  } = props;
  
  return {
    t: 'div',
    a: { 
      class: `bw-card ${variant ? `bw-card-${variant}` : ''} ${className}`.trim(),
      style
    },
    c: [
      header && {
        t: 'div',
        a: { class: 'bw-card-header' },
        c: header
      },
      {
        t: 'div',
        a: { class: 'bw-card-body' },
        c: [
          title && { t: 'h5', a: { class: 'bw-card-title' }, c: title },
          content && (Array.isArray(content) ? content : [content])
        ].flat().filter(Boolean)
      },
      footer && {
        t: 'div',
        a: { class: 'bw-card-footer' },
        c: footer
      }
    ].filter(Boolean),
    o: {
      type: 'card',
      state: props.state || {}
    }
  };
}

// Button Component
export function makeButton(props = {}) {
  const {
    text,
    variant = 'primary',
    size,
    disabled = false,
    onclick,
    type = 'button',
    className = '',
    style
  } = props;
  
  return {
    t: 'button',
    a: {
      type,
      class: [
        'bw-btn',
        `bw-btn-${variant}`,
        size && `bw-btn-${size}`,
        className
      ].filter(Boolean).join(' '),
      disabled,
      onclick,
      style
    },
    c: text,
    o: {
      type: 'button'
    }
  };
}

// Container Component
export function makeContainer(props = {}) {
  const { fluid = false, children, className = '' } = props;
  
  return {
    t: 'div',
    a: { class: `bw-container${fluid ? '-fluid' : ''} ${className}`.trim() },
    c: children
  };
}

// Row Component
export function makeRow(props = {}) {
  const { children, className = '', gap } = props;
  
  return {
    t: 'div',
    a: { 
      class: `bw-row ${gap ? `bw-g-${gap}` : ''} ${className}`.trim()
    },
    c: children
  };
}

// Column Component
export function makeCol(props = {}) {
  const { size, offset, push, pull, content, children, className = '' } = props;
  
  const classes = [];
  
  if (typeof size === 'object') {
    // Responsive sizes
    Object.entries(size).forEach(([breakpoint, value]) => {
      if (breakpoint === 'xs') {
        classes.push(`bw-col-${value}`);
      } else {
        classes.push(`bw-col-${breakpoint}-${value}`);
      }
    });
  } else if (size) {
    classes.push(`bw-col-${size}`);
  } else {
    classes.push('bw-col');
  }
  
  if (offset) classes.push(`bw-offset-${offset}`);
  if (push) classes.push(`bw-push-${push}`);
  if (pull) classes.push(`bw-pull-${pull}`);
  
  return {
    t: 'div',
    a: { class: `${classes.join(' ')} ${className}`.trim() },
    c: content || children
  };
}

// Nav Component (simple navigation)
export function makeNav(props = {}) {
  const {
    items = [],
    pills = false,
    vertical = false,
    className = ''
  } = props;
  
  return {
    t: 'ul',
    a: { 
      class: `bw-nav ${pills ? 'bw-nav-pills' : 'bw-nav-tabs'} ${vertical ? 'bw-nav-vertical' : ''} ${className}`.trim()
    },
    c: items.map(item => ({
      t: 'li',
      a: { class: 'bw-nav-item' },
      c: {
        t: 'a',
        a: { 
          href: item.href || '#',
          class: `bw-nav-link ${item.active ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`.trim()
        },
        c: item.text
      }
    }))
  };
}

// Navbar Component
export function makeNavbar(props = {}) {
  const {
    brand,
    brandHref = '#',
    items = [],
    dark = true,
    className = ''
  } = props;
  
  return {
    t: 'nav',
    a: { 
      class: `bw-navbar ${dark ? 'bw-navbar-dark' : 'bw-navbar-light'} ${className}`.trim()
    },
    c: {
      t: 'div',
      a: { class: 'bw-container' },
      c: [
        brand && {
          t: 'a',
          a: { href: brandHref, class: 'bw-navbar-brand' },
          c: brand
        },
        items.length > 0 && {
          t: 'div',
          a: { class: 'bw-navbar-nav' },
          c: items.map(item => ({
            t: 'a',
            a: { 
              href: item.href || '#',
              class: `bw-nav-link ${item.active ? 'active' : ''}`
            },
            c: item.text
          }))
        }
      ].filter(Boolean)
    },
    o: {
      type: 'navbar',
      state: { activeItem: items.findIndex(i => i.active) }
    }
  };
}

// Tabs Component
export function makeTabs(props = {}) {
  const { tabs = [], activeIndex = 0 } = props;
  
  // Find the active tab index based on the active property or use activeIndex
  let actualActiveIndex = activeIndex;
  tabs.forEach((tab, index) => {
    if (tab.active) {
      actualActiveIndex = index;
    }
  });
  
  return {
    t: 'div',
    a: { class: 'bw-tabs' },
    c: [
      {
        t: 'ul',
        a: { class: 'bw-nav bw-nav-tabs', role: 'tablist' },
        c: tabs.map((tab, index) => ({
          t: 'li',
          a: { class: 'bw-nav-item', role: 'presentation' },
          c: {
            t: 'button',
            a: {
              class: `bw-nav-link ${index === actualActiveIndex ? 'active' : ''}`,
              type: 'button',
              role: 'tab',
              'aria-selected': index === actualActiveIndex ? 'true' : 'false',
              'data-tab-index': index,
              onclick: (e) => {
                const tabsContainer = e.target.closest('.bw-tabs');
                const allTabs = tabsContainer.querySelectorAll('.bw-nav-link');
                const allPanes = tabsContainer.querySelectorAll('.bw-tab-pane');
                
                allTabs.forEach(t => {
                  t.classList.remove('active');
                  t.setAttribute('aria-selected', 'false');
                });
                allPanes.forEach(p => p.classList.remove('active'));
                
                e.target.classList.add('active');
                e.target.setAttribute('aria-selected', 'true');
                const targetIndex = parseInt(e.target.getAttribute('data-tab-index'));
                allPanes[targetIndex].classList.add('active');
              }
            },
            c: tab.label
          }
        }))
      },
      {
        t: 'div',
        a: { class: 'bw-tab-content' },
        c: tabs.map((tab, index) => ({
          t: 'div',
          a: {
            class: `bw-tab-pane ${index === actualActiveIndex ? 'active' : ''}`,
            role: 'tabpanel'
          },
          c: tab.content
        }))
      }
    ],
    o: {
      type: 'tabs',
      state: { activeIndex: actualActiveIndex }
    }
  };
}

// Alert Component
export function makeAlert(props = {}) {
  const {
    content,
    variant = 'info',
    dismissible = false,
    className = ''
  } = props;
  
  return {
    t: 'div',
    a: { 
      class: `bw-alert bw-alert-${variant} ${dismissible ? 'bw-alert-dismissible' : ''} ${className}`.trim(),
      role: 'alert'
    },
    c: [
      content,
      dismissible && {
        t: 'button',
        a: {
          type: 'button',
          class: 'bw-close',
          'aria-label': 'Close'
        },
        c: '×'
      }
    ].filter(Boolean)
  };
}

// Badge Component
export function makeBadge(props = {}) {
  const {
    text,
    variant = 'primary',
    pill = false,
    className = ''
  } = props;
  
  return {
    t: 'span',
    a: { 
      class: `bw-badge bw-badge-${variant} ${pill ? 'bw-badge-pill' : ''} ${className}`.trim()
    },
    c: text
  };
}

// Progress Component
export function makeProgress(props = {}) {
  const {
    value = 0,
    max = 100,
    variant = 'primary',
    striped = false,
    animated = false,
    label,
    height
  } = props;
  
  const percentage = Math.round((value / max) * 100);
  
  return {
    t: 'div',
    a: { 
      class: 'bw-progress',
      style: height ? { height: `${height}px` } : undefined
    },
    c: {
      t: 'div',
      a: {
        class: [
          'bw-progress-bar',
          `bw-progress-bar-${variant}`,
          striped && 'bw-progress-bar-striped',
          animated && 'bw-progress-bar-animated'
        ].filter(Boolean).join(' '),
        role: 'progressbar',
        style: { width: `${percentage}%` },
        'aria-valuenow': value,
        'aria-valuemin': 0,
        'aria-valuemax': max
      },
      c: label || `${percentage}%`
    }
  };
}

// List Group Component
export function makeListGroup(props = {}) {
  const { items = [], flush = false, interactive = false } = props;
  
  return {
    t: 'div',
    a: { class: `bw-list-group ${flush ? 'bw-list-group-flush' : ''}`.trim() },
    c: items.map(item => {
      const isObject = typeof item === 'object';
      const text = isObject ? item.text : item;
      const active = isObject ? item.active : false;
      const disabled = isObject ? item.disabled : false;
      const href = isObject ? item.href : null;
      const onclick = isObject ? item.onclick : null;
      
      // For interactive items or items with href/onclick, use anchor tag
      if (interactive || href || onclick) {
        return {
          t: 'a',
          a: { 
            class: [
              'bw-list-group-item',
              active && 'active',
              disabled && 'disabled'
            ].filter(Boolean).join(' '),
            href: href || '#',
            onclick: onclick || ((e) => {
              if (!href) e.preventDefault();
            }),
            style: disabled ? 'pointer-events: none; opacity: 0.65;' : ''
          },
          c: text
        };
      }
      
      // For non-interactive items, use div
      return {
        t: 'div',
        a: { 
          class: [
            'bw-list-group-item',
            active && 'active',
            disabled && 'disabled'
          ].filter(Boolean).join(' ')
        },
        c: text
      };
    })
  };
}

// Breadcrumb Component
export function makeBreadcrumb(props = {}) {
  const { items = [] } = props;
  
  return {
    t: 'nav',
    a: { 'aria-label': 'breadcrumb' },
    c: {
      t: 'ol',
      a: { class: 'bw-breadcrumb' },
      c: items.map((item, index) => ({
        t: 'li',
        a: { 
          class: `bw-breadcrumb-item ${item.active ? 'active' : ''}`,
          'aria-current': item.active ? 'page' : undefined
        },
        c: item.active ? item.text : {
          t: 'a',
          a: { href: item.href || '#' },
          c: item.text
        }
      }))
    }
  };
}

// Form Components
export function makeForm(props = {}) {
  const { children, onsubmit, className = '' } = props;
  
  return {
    t: 'form',
    a: { 
      class: className,
      onsubmit: onsubmit || ((e) => e.preventDefault())
    },
    c: children
  };
}

export function makeFormGroup(props = {}) {
  const { label, input, help, id } = props;
  
  return {
    t: 'div',
    a: { class: 'bw-form-group' },
    c: [
      label && {
        t: 'label',
        a: { for: id, class: 'bw-form-label' },
        c: label
      },
      input,
      help && {
        t: 'small',
        a: { class: 'bw-form-text bw-text-muted' },
        c: help
      }
    ].filter(Boolean)
  };
}

export function makeInput(props = {}) {
  const {
    type = 'text',
    placeholder,
    value,
    id,
    name,
    disabled = false,
    readonly = false,
    required = false,
    className = '',
    style,
    ...eventHandlers
  } = props;
  
  return {
    t: 'input',
    a: {
      type,
      class: `bw-form-control ${className}`.trim(),
      placeholder,
      value,
      id,
      name,
      style,
      disabled,
      readonly,
      required,
      ...eventHandlers
    }
  };
}

export function makeTextarea(props = {}) {
  const {
    placeholder,
    value,
    rows = 3,
    id,
    name,
    disabled = false,
    readonly = false,
    required = false,
    className = '',
    ...eventHandlers
  } = props;
  
  return {
    t: 'textarea',
    a: {
      class: `bw-form-control ${className}`.trim(),
      placeholder,
      rows,
      id,
      name,
      disabled,
      readonly,
      required,
      ...eventHandlers
    },
    c: value
  };
}

export function makeSelect(props = {}) {
  const {
    options = [],
    value,
    id,
    name,
    disabled = false,
    required = false,
    className = '',
    ...eventHandlers
  } = props;
  
  return {
    t: 'select',
    a: {
      class: `bw-form-control ${className}`.trim(),
      id,
      name,
      disabled,
      required,
      ...eventHandlers
    },
    c: options.map(opt => ({
      t: 'option',
      a: { 
        value: opt.value,
        selected: opt.value === value
      },
      c: opt.text || opt.value
    }))
  };
}

export function makeCheckbox(props = {}) {
  const {
    label,
    checked = false,
    id,
    name,
    disabled = false,
    value
  } = props;
  
  return {
    t: 'div',
    a: { class: 'bw-form-check' },
    c: [
      {
        t: 'input',
        a: {
          type: 'checkbox',
          class: 'bw-form-check-input',
          checked,
          id,
          name,
          disabled,
          value
        }
      },
      label && {
        t: 'label',
        a: { class: 'bw-form-check-label', for: id },
        c: label
      }
    ].filter(Boolean)
  };
}

// Stack Component (Flexbox utility)
export function makeStack(props = {}) {
  const {
    children,
    direction = 'vertical',
    gap = 3,
    className = ''
  } = props;
  
  return {
    t: 'div',
    a: { 
      class: `bw-${direction === 'vertical' ? 'vstack' : 'hstack'} bw-gap-${gap} ${className}`.trim()
    },
    c: children
  };
}

// Spinner Component
export function makeSpinner(props = {}) {
  const {
    variant = 'primary',
    size = 'md',
    type = 'border'
  } = props;
  
  return {
    t: 'div',
    a: {
      class: `bw-spinner-${type} bw-spinner-${type}-${size} bw-text-${variant}`,
      role: 'status'
    },
    c: {
      t: 'span',
      a: { class: 'bw-visually-hidden' },
      c: 'Loading...'
    }
  };
}

// Component Handle Classes
export class CardHandle {
  constructor(element, taco) {
    this.element = element;
    this._taco = taco;
    this.state = taco.o?.state || {};
    
    // Cache child elements
    this.children = {
      header: element.querySelector('.bw-card-header'),
      title: element.querySelector('.bw-card-title'),
      body: element.querySelector('.bw-card-body'),
      footer: element.querySelector('.bw-card-footer')
    };
  }
  
  setTitle(title) {
    if (this.children.title) {
      this.children.title.textContent = title;
    }
    return this;
  }
  
  setContent(content) {
    if (this.children.body) {
      if (typeof content === 'string') {
        this.children.body.textContent = content;
      } else {
        // Re-render content
        this.children.body.innerHTML = '';
        const newContent = window.bw.taco.toDOM(content);
        this.children.body.appendChild(newContent);
      }
    }
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
  
  select(selector) {
    return this.element.querySelector(selector);
  }
}

export class TableHandle {
  constructor(element, taco) {
    this.element = element;
    this._taco = taco;
    this.state = taco.o?.state || {};
    this._data = this.state.data || [];
    this._sortColumn = null;
    this._sortDirection = 'asc';
    
    // Cache elements
    this.children = {
      thead: element.querySelector('thead'),
      tbody: element.querySelector('tbody'),
      headers: element.querySelectorAll('th')
    };
    
    // Set up sorting if enabled
    if (this.state.sortable) {
      this._setupSorting();
    }
  }
  
  _setupSorting() {
    this.children.headers.forEach((th, index) => {
      th.style.cursor = 'pointer';
      th.onclick = () => this.sortBy(th.textContent);
    });
  }
  
  setData(data) {
    this._data = data;
    this._renderBody();
    return this;
  }
  
  sortBy(column, direction) {
    if (column === this._sortColumn && !direction) {
      this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortColumn = column;
      this._sortDirection = direction || 'asc';
    }
    
    const columnKey = Object.keys(this._data[0])[
      Array.from(this.children.headers).findIndex(th => th.textContent === column)
    ];
    
    this._data.sort((a, b) => {
      const aVal = a[columnKey];
      const bVal = b[columnKey];
      const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return this._sortDirection === 'asc' ? result : -result;
    });
    
    this._renderBody();
    return this;
  }
  
  _renderBody() {
    this.children.tbody.innerHTML = '';
    this._data.forEach(row => {
      const tr = document.createElement('tr');
      Object.values(row).forEach(value => {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });
      this.children.tbody.appendChild(tr);
    });
  }
}

export class NavbarHandle {
  constructor(element, taco) {
    this.element = element;
    this._taco = taco;
    this.state = taco.o?.state || {};
    
    this.children = {
      brand: element.querySelector('.bw-navbar-brand'),
      links: element.querySelectorAll('.bw-nav-link')
    };
  }
  
  setActive(href) {
    this.children.links.forEach(link => {
      if (link.getAttribute('href') === href) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    return this;
  }
}

export class TabsHandle {
  constructor(element, taco) {
    this.element = element;
    this._taco = taco;
    this.state = taco.o?.state || {};
    
    this.children = {
      navItems: element.querySelectorAll('.bw-nav-link'),
      tabPanes: element.querySelectorAll('.bw-tab-pane')
    };
    
    this._setupTabs();
  }
  
  _setupTabs() {
    this.children.navItems.forEach((navItem, index) => {
      navItem.onclick = (e) => {
        e.preventDefault();
        this.switchTo(index);
      };
    });
  }
  
  switchTo(index) {
    this.children.navItems.forEach((item, i) => {
      if (i === index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    this.children.tabPanes.forEach((pane, i) => {
      if (i === index) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });
    
    this.state.activeIndex = index;
    return this;
  }
}

// Code Demo Component - for documentation pages
export function makeCodeDemo(props = {}) {
  const { 
    title,
    description,
    code,
    result,
    language = 'javascript'
  } = props;
  
  // Generate unique ID for this demo
  const demoId = `demo-${Math.random().toString(36).substr(2, 9)}`;
  
  const tabs = [
    {
      label: 'Result',
      active: true,
      content: result
    },
    {
      label: 'Code',
      content: {
        t: 'div',
        a: { style: 'position: relative;' },
        c: [
          {
            t: 'button',
            a: {
              class: 'copy-btn',
              style: 'position: absolute; top: 0.5rem; right: 0.5rem; padding: 0.25rem 0.5rem; font-size: 0.75rem; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;',
              onclick: (e) => {
                navigator.clipboard.writeText(code).then(() => {
                  const btn = e.target;
                  const originalText = btn.textContent;
                  btn.textContent = 'Copied!';
                  btn.style.background = '#28a745';
                  setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '#007bff';
                  }, 2000);
                });
              }
            },
            c: 'Copy'
          },
          {
            t: 'pre',
            a: { 
              style: 'margin: 0; background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 4px; overflow-x: auto;'
            },
            c: {
              t: 'code',
              a: { 
                class: `language-${language}`,
                style: 'display: block; padding: 1rem; font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace; font-size: 0.875rem; line-height: 1.5;'
              },
              c: code
            }
          }
        ]
      }
    }
  ];
  
  const content = [
    title && { t: 'h3', c: title },
    description && { 
      t: 'p', 
      a: { style: 'color: #6c757d; margin-bottom: 1rem;' },
      c: description 
    },
    makeTabs({ tabs, id: demoId })
  ].filter(Boolean);
  
  return {
    t: 'div',
    a: { class: 'code-demo', style: 'margin-bottom: 2rem;' },
    c: content
  };
}

// Handle registry
export const componentHandles = {
  card: CardHandle,
  table: TableHandle,
  navbar: NavbarHandle,
  tabs: TabsHandle
};