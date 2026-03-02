/**
 * Bitwrench v2 Components
 *
 * TACO-based UI component library providing Bootstrap-inspired components
 * as pure JavaScript objects. Every make* function returns a TACO object
 * ({t, a, c, o}) that can be rendered with bw.html() or bw.DOM().
 *
 * Components included: Card, Button, Container, Row, Col, Nav, Navbar,
 * Tabs, Alert, Badge, Progress, ListGroup, Breadcrumb, Form controls,
 * Stack, Spinner, Hero, FeatureGrid, CardV2, CTA, Section, CodeDemo.
 *
 * Handle classes (CardHandle, TableHandle, NavbarHandle, TabsHandle)
 * provide imperative DOM manipulation for rendered components.
 *
 * @module bitwrench-components-v2
 * @license BSD-2-Clause
 * @author M A Chatterjee <deftio [at] deftio [dot] com>
 */

/**
 * Create a card component with optional header, body, and footer
 *
 * @param {Object} [props] - Card configuration
 * @param {string} [props.title] - Card title displayed in the body
 * @param {string|Object|Array} [props.content] - Card body content (string, TACO, or array)
 * @param {string|Object} [props.footer] - Card footer content
 * @param {string|Object} [props.header] - Card header content
 * @param {string} [props.variant] - Color variant (e.g. "primary", "danger")
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Inline style object
 * @param {Object} [props.state] - Component state object
 * @returns {Object} TACO object representing a card component
 * @example
 * const card = makeCard({
 *   title: "Status",
 *   content: "All systems operational",
 *   variant: "success"
 * });
 * bw.DOM("#app", card);
 */
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

/**
 * Create a button component
 *
 * @param {Object} [props] - Button configuration
 * @param {string} [props.text] - Button label text
 * @param {string} [props.variant="primary"] - Color variant (e.g. "primary", "secondary", "danger")
 * @param {string} [props.size] - Size variant ("sm" or "lg")
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 * @param {Function} [props.onclick] - Click event handler
 * @param {string} [props.type="button"] - HTML button type ("button", "submit", "reset")
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Inline style object
 * @returns {Object} TACO object representing a button element
 * @example
 * const btn = makeButton({
 *   text: "Save",
 *   variant: "success",
 *   onclick: () => console.log("saved")
 * });
 */
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

/**
 * Create a container component for centering and constraining content width
 *
 * @param {Object} [props] - Container configuration
 * @param {boolean} [props.fluid=false] - Use full-width fluid container
 * @param {Array|Object|string} [props.children] - Child content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a container div
 * @example
 * const container = makeContainer({
 *   fluid: true,
 *   children: [makeRow({ children: [...] })]
 * });
 */
export function makeContainer(props = {}) {
  const { fluid = false, children, className = '' } = props;

  return {
    t: 'div',
    a: { class: `bw-container${fluid ? '-fluid' : ''} ${className}`.trim() },
    c: children
  };
}

/**
 * Create a flexbox row for the grid system
 *
 * @param {Object} [props] - Row configuration
 * @param {Array|Object|string} [props.children] - Child columns
 * @param {string} [props.className] - Additional CSS classes
 * @param {number} [props.gap] - Gap size (1-5) applied via bw-g-{gap} class
 * @returns {Object} TACO object representing a grid row
 * @example
 * const row = makeRow({
 *   gap: 4,
 *   children: [makeCol({ size: 6, content: "Left" }), makeCol({ size: 6, content: "Right" })]
 * });
 */
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

/**
 * Create a grid column with responsive sizing
 *
 * Supports both fixed and responsive column sizes. Pass an object for
 * responsive breakpoints (e.g. {xs: 12, md: 6, lg: 4}).
 *
 * @param {Object} [props] - Column configuration
 * @param {number|Object} [props.size] - Column size (1-12) or responsive object {xs, sm, md, lg, xl}
 * @param {number} [props.offset] - Column offset (1-12)
 * @param {number} [props.push] - Column push (1-12)
 * @param {number} [props.pull] - Column pull (1-12)
 * @param {Array|Object|string} [props.content] - Column content (alias for children)
 * @param {Array|Object|string} [props.children] - Column content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a grid column
 * @example
 * const col = makeCol({ size: { xs: 12, md: 6 }, content: "Responsive column" });
 */
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

/**
 * Create a navigation component with tabs or pills styling
 *
 * @param {Object} [props] - Nav configuration
 * @param {Array<Object>} [props.items=[]] - Navigation items
 * @param {string} props.items[].text - Item display text
 * @param {string} [props.items[].href="#"] - Item link URL
 * @param {boolean} [props.items[].active] - Whether this item is active
 * @param {boolean} [props.items[].disabled] - Whether this item is disabled
 * @param {boolean} [props.pills=false] - Use pill styling instead of tabs
 * @param {boolean} [props.vertical=false] - Stack items vertically
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a nav element
 * @example
 * const nav = makeNav({
 *   pills: true,
 *   items: [
 *     { text: "Home", href: "/", active: true },
 *     { text: "About", href: "/about" }
 *   ]
 * });
 */
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

/**
 * Create a navbar component with brand and navigation links
 *
 * @param {Object} [props] - Navbar configuration
 * @param {string} [props.brand] - Brand name or logo text
 * @param {string} [props.brandHref="#"] - Brand link URL
 * @param {Array<Object>} [props.items=[]] - Navigation items
 * @param {string} props.items[].text - Item display text
 * @param {string} [props.items[].href="#"] - Item link URL
 * @param {boolean} [props.items[].active] - Whether this item is active
 * @param {boolean} [props.dark=true] - Use dark theme styling
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a navbar element
 * @example
 * const navbar = makeNavbar({
 *   brand: "MyApp",
 *   dark: true,
 *   items: [
 *     { text: "Home", href: "/", active: true },
 *     { text: "Docs", href: "/docs" }
 *   ]
 * });
 */
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

/**
 * Create a tabbed interface with accessible tab navigation
 *
 * Each tab is rendered as a button with ARIA attributes for accessibility.
 * Clicking a tab shows its content pane and hides others. The active tab
 * can be set via activeIndex or by setting active:true on a tab item.
 *
 * @param {Object} [props] - Tabs configuration
 * @param {Array<Object>} [props.tabs=[]] - Tab definitions
 * @param {string} props.tabs[].label - Tab button label
 * @param {string|Object|Array} props.tabs[].content - Tab pane content
 * @param {boolean} [props.tabs[].active] - Whether this tab is initially active
 * @param {number} [props.activeIndex=0] - Default active tab index (overridden by tab.active)
 * @returns {Object} TACO object representing a tabbed interface
 * @example
 * const tabs = makeTabs({
 *   tabs: [
 *     { label: "Overview", content: "Tab 1 content", active: true },
 *     { label: "Details", content: "Tab 2 content" }
 *   ]
 * });
 * bw.DOM("#app", tabs);
 */
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

/**
 * Create an alert/notification component
 *
 * @param {Object} [props] - Alert configuration
 * @param {string|Object|Array} [props.content] - Alert message content
 * @param {string} [props.variant="info"] - Color variant ("primary", "secondary", "success", "danger", "warning", "info", "light", "dark")
 * @param {boolean} [props.dismissible=false] - Show a close button to dismiss the alert
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing an alert element
 * @example
 * const alert = makeAlert({
 *   content: "Operation completed successfully!",
 *   variant: "success",
 *   dismissible: true
 * });
 */
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

/**
 * Create an inline badge/label component
 *
 * @param {Object} [props] - Badge configuration
 * @param {string} [props.text] - Badge display text
 * @param {string} [props.variant="primary"] - Color variant
 * @param {boolean} [props.pill=false] - Use pill (rounded) shape
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a badge span
 * @example
 * const badge = makeBadge({ text: "New", variant: "danger", pill: true });
 */
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

/**
 * Create a progress bar component with ARIA accessibility
 *
 * @param {Object} [props] - Progress bar configuration
 * @param {number} [props.value=0] - Current progress value
 * @param {number} [props.max=100] - Maximum value
 * @param {string} [props.variant="primary"] - Color variant
 * @param {boolean} [props.striped=false] - Use striped pattern
 * @param {boolean} [props.animated=false] - Animate the stripes
 * @param {string} [props.label] - Custom label text (defaults to percentage)
 * @param {number} [props.height] - Custom height in pixels
 * @returns {Object} TACO object representing a progress bar
 * @example
 * const progress = makeProgress({
 *   value: 75,
 *   variant: "success",
 *   striped: true,
 *   animated: true
 * });
 */
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

/**
 * Create a list group component for displaying lists of items
 *
 * Items can be simple strings or objects with text, active, disabled,
 * href, and onclick properties. When interactive is true or items have
 * href/onclick, items render as anchor tags.
 *
 * @param {Object} [props] - List group configuration
 * @param {Array<string|Object>} [props.items=[]] - List items (strings or objects)
 * @param {string} props.items[].text - Item display text
 * @param {boolean} [props.items[].active] - Whether this item is active
 * @param {boolean} [props.items[].disabled] - Whether this item is disabled
 * @param {string} [props.items[].href] - Item link URL
 * @param {Function} [props.items[].onclick] - Item click handler
 * @param {boolean} [props.flush=false] - Remove borders for use inside cards
 * @param {boolean} [props.interactive=false] - Make all items interactive (anchor tags)
 * @returns {Object} TACO object representing a list group
 * @example
 * const list = makeListGroup({
 *   interactive: true,
 *   items: [
 *     { text: "Active item", active: true },
 *     { text: "Regular item" },
 *     { text: "Disabled item", disabled: true }
 *   ]
 * });
 */
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

/**
 * Create a breadcrumb navigation component
 *
 * The last item with active:true is rendered as plain text (no link).
 * All other items render as anchor tags.
 *
 * @param {Object} [props] - Breadcrumb configuration
 * @param {Array<Object>} [props.items=[]] - Breadcrumb items
 * @param {string} props.items[].text - Item display text
 * @param {string} [props.items[].href="#"] - Item link URL
 * @param {boolean} [props.items[].active] - Whether this is the current page
 * @returns {Object} TACO object representing a breadcrumb nav
 * @example
 * const crumbs = makeBreadcrumb({
 *   items: [
 *     { text: "Home", href: "/" },
 *     { text: "Products", href: "/products" },
 *     { text: "Widget", active: true }
 *   ]
 * });
 */
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

/**
 * Create a form wrapper with default submit prevention
 *
 * @param {Object} [props] - Form configuration
 * @param {Array|Object|string} [props.children] - Form contents (form groups, inputs, buttons)
 * @param {Function} [props.onsubmit] - Submit handler (defaults to preventDefault)
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a form element
 * @example
 * const form = makeForm({
 *   onsubmit: (e) => { e.preventDefault(); handleSubmit(); },
 *   children: [
 *     makeFormGroup({ label: "Name", input: makeInput({ placeholder: "Enter name" }) }),
 *     makeButton({ text: "Submit", type: "submit" })
 *   ]
 * });
 */
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

/**
 * Create a form group with label, input, and optional help text
 *
 * @param {Object} [props] - Form group configuration
 * @param {string} [props.label] - Label text
 * @param {Object} [props.input] - Input TACO object (from makeInput, makeSelect, etc.)
 * @param {string} [props.help] - Help text displayed below the input
 * @param {string} [props.id] - Input ID (links label to input via for/id)
 * @returns {Object} TACO object representing a form group
 * @example
 * const group = makeFormGroup({
 *   label: "Email",
 *   id: "email",
 *   input: makeInput({ type: "email", id: "email", placeholder: "you@example.com" }),
 *   help: "We'll never share your email."
 * });
 */
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

/**
 * Create an input element with form control styling
 *
 * Additional event handlers (oninput, onchange, etc.) can be passed
 * as extra properties and are spread onto the element attributes.
 *
 * @param {Object} [props] - Input configuration
 * @param {string} [props.type="text"] - Input type ("text", "email", "password", "number", etc.)
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.value] - Input value
 * @param {string} [props.id] - Element ID
 * @param {string} [props.name] - Input name attribute
 * @param {boolean} [props.disabled=false] - Whether the input is disabled
 * @param {boolean} [props.readonly=false] - Whether the input is read-only
 * @param {boolean} [props.required=false] - Whether the input is required
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Inline style object
 * @returns {Object} TACO object representing an input element
 * @example
 * const input = makeInput({
 *   type: "email",
 *   placeholder: "you@example.com",
 *   required: true,
 *   oninput: (e) => validate(e.target.value)
 * });
 */
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

/**
 * Create a textarea element with form control styling
 *
 * @param {Object} [props] - Textarea configuration
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.value] - Textarea content
 * @param {number} [props.rows=3] - Number of visible text rows
 * @param {string} [props.id] - Element ID
 * @param {string} [props.name] - Textarea name attribute
 * @param {boolean} [props.disabled=false] - Whether the textarea is disabled
 * @param {boolean} [props.readonly=false] - Whether the textarea is read-only
 * @param {boolean} [props.required=false] - Whether the textarea is required
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a textarea element
 * @example
 * const textarea = makeTextarea({
 *   rows: 5,
 *   placeholder: "Enter your message...",
 *   required: true
 * });
 */
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

/**
 * Create a select dropdown with options
 *
 * @param {Object} [props] - Select configuration
 * @param {Array<Object>} [props.options=[]] - Dropdown options
 * @param {string} props.options[].value - Option value
 * @param {string} [props.options[].text] - Option display text (defaults to value)
 * @param {string} [props.value] - Currently selected value
 * @param {string} [props.id] - Element ID
 * @param {string} [props.name] - Select name attribute
 * @param {boolean} [props.disabled=false] - Whether the select is disabled
 * @param {boolean} [props.required=false] - Whether the select is required
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a select element
 * @example
 * const select = makeSelect({
 *   value: "b",
 *   options: [
 *     { value: "a", text: "Option A" },
 *     { value: "b", text: "Option B" },
 *     { value: "c", text: "Option C" }
 *   ]
 * });
 */
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

/**
 * Create a checkbox input with label
 *
 * @param {Object} [props] - Checkbox configuration
 * @param {string} [props.label] - Checkbox label text
 * @param {boolean} [props.checked=false] - Whether the checkbox is checked
 * @param {string} [props.id] - Element ID (links label to checkbox)
 * @param {string} [props.name] - Input name attribute
 * @param {boolean} [props.disabled=false] - Whether the checkbox is disabled
 * @param {string} [props.value] - Checkbox value attribute
 * @returns {Object} TACO object representing a checkbox form group
 * @example
 * const checkbox = makeCheckbox({
 *   label: "I agree to the terms",
 *   id: "agree",
 *   checked: false
 * });
 */
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

/**
 * Create a flexbox stack layout (vertical or horizontal)
 *
 * @param {Object} [props] - Stack configuration
 * @param {Array|Object|string} [props.children] - Stack children
 * @param {string} [props.direction="vertical"] - Stack direction ("vertical" or "horizontal")
 * @param {number} [props.gap=3] - Gap size (0-5)
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a stack layout
 * @example
 * const stack = makeStack({
 *   direction: "horizontal",
 *   gap: 2,
 *   children: [
 *     makeButton({ text: "Cancel", variant: "secondary" }),
 *     makeButton({ text: "Save", variant: "primary" })
 *   ]
 * });
 */
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

/**
 * Create a loading spinner indicator
 *
 * @param {Object} [props] - Spinner configuration
 * @param {string} [props.variant="primary"] - Color variant
 * @param {string} [props.size="md"] - Spinner size ("sm", "md", "lg")
 * @param {string} [props.type="border"] - Spinner type ("border" or "grow")
 * @returns {Object} TACO object representing a spinner with screen-reader text
 * @example
 * const spinner = makeSpinner({ variant: "info", size: "sm" });
 */
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

/**
 * Create a hero section for landing pages and headers
 *
 * Supports gradient backgrounds, background images with overlays,
 * and action buttons. Commonly used as the first visible section.
 *
 * @param {Object} [props] - Hero configuration
 * @param {string} [props.title] - Main headline text
 * @param {string} [props.subtitle] - Supporting description text
 * @param {string|Object|Array} [props.content] - Additional body content
 * @param {string} [props.variant="primary"] - Background variant ("primary", "secondary", "light", "dark")
 * @param {string} [props.size="lg"] - Vertical padding size ("sm", "md", "lg", "xl")
 * @param {boolean} [props.centered=true] - Center-align text
 * @param {boolean} [props.overlay=false] - Add dark overlay (for background images)
 * @param {string} [props.backgroundImage] - Background image URL
 * @param {Array|Object} [props.actions] - Call-to-action buttons
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a hero section
 * @example
 * const hero = makeHero({
 *   title: "Welcome to Bitwrench",
 *   subtitle: "Build UIs with pure JavaScript",
 *   variant: "dark",
 *   actions: [
 *     makeButton({ text: "Get Started", variant: "primary", size: "lg" }),
 *     makeButton({ text: "Learn More", variant: "outline-light", size: "lg" })
 *   ]
 * });
 */
export function makeHero(props = {}) {
  const {
    title,
    subtitle,
    content,
    variant = 'primary',
    size = 'lg',
    centered = true,
    overlay = false,
    backgroundImage,
    actions,
    className = ''
  } = props;

  const sizeClasses = {
    sm: 'bw-py-3',
    md: 'bw-py-4',
    lg: 'bw-py-5',
    xl: 'bw-py-6'
  };

  return {
    t: 'section',
    a: {
      class: `bw-hero bw-hero-${variant} ${sizeClasses[size] || sizeClasses.lg} ${centered ? 'bw-text-center' : ''} ${className}`.trim(),
      style: backgroundImage ? `background-image: url('${backgroundImage}'); background-size: cover; background-position: center;` : undefined
    },
    c: [
      overlay && {
        t: 'div',
        a: { class: 'bw-hero-overlay' }
      },
      {
        t: 'div',
        a: { class: 'bw-container' },
        c: {
          t: 'div',
          a: { class: 'bw-hero-content' },
          c: [
            title && {
              t: 'h1',
              a: { class: 'bw-hero-title bw-display-4 bw-mb-3' },
              c: title
            },
            subtitle && {
              t: 'p',
              a: { class: 'bw-hero-subtitle bw-lead bw-mb-4' },
              c: subtitle
            },
            content,
            actions && {
              t: 'div',
              a: { class: 'bw-hero-actions bw-mt-4' },
              c: actions
            }
          ].filter(Boolean)
        }
      }
    ].filter(Boolean)
  };
}

/**
 * Create a responsive feature grid for showcasing capabilities
 *
 * Renders features in an equal-width column grid with optional icons,
 * titles, and descriptions.
 *
 * @param {Object} [props] - Feature grid configuration
 * @param {Array<Object>} [props.features=[]] - Feature items
 * @param {string} [props.features[].icon] - Icon content (emoji, HTML entity, or text)
 * @param {string} [props.features[].title] - Feature title
 * @param {string} [props.features[].description] - Feature description text
 * @param {number} [props.columns=3] - Number of columns (divides 12-col grid)
 * @param {boolean} [props.centered=true] - Center-align feature text
 * @param {string} [props.iconSize="3rem"] - Icon font size
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a feature grid
 * @example
 * const features = makeFeatureGrid({
 *   columns: 3,
 *   features: [
 *     { icon: "⚡", title: "Fast", description: "Zero build step" },
 *     { icon: "📦", title: "Small", description: "Under 45KB gzipped" },
 *     { icon: "🔧", title: "Flexible", description: "Pure JS objects" }
 *   ]
 * });
 */
export function makeFeatureGrid(props = {}) {
  const {
    features = [],
    columns = 3,
    centered = true,
    iconSize = '3rem',
    className = ''
  } = props;

  const colClass = `bw-col-md-${12/columns}`;

  return {
    t: 'div',
    a: { class: `bw-feature-grid ${className}`.trim() },
    c: {
      t: 'div',
      a: { class: 'bw-row bw-g-4' },
      c: features.map(feature => ({
        t: 'div',
        a: { class: colClass },
        c: {
          t: 'div',
          a: { class: `bw-feature ${centered ? 'bw-text-center' : ''}` },
          c: [
            feature.icon && {
              t: 'div',
              a: {
                class: 'bw-feature-icon bw-mb-3',
                style: `font-size: ${iconSize}; color: var(--bw-primary);`
              },
              c: feature.icon
            },
            feature.title && {
              t: 'h3',
              a: { class: 'bw-feature-title bw-h5 bw-mb-2' },
              c: feature.title
            },
            feature.description && {
              t: 'p',
              a: { class: 'bw-feature-description bw-text-muted' },
              c: feature.description
            }
          ].filter(Boolean)
        }
      }))
    }
  };
}

/**
 * Create an enhanced card with image support, shadows, and hover effects
 *
 * Extended version of makeCard with support for images (top, bottom, left, right),
 * shadow levels, subtitle, hover animation, and custom section class overrides.
 * For horizontal image layouts (left/right), content is wrapped in a row grid.
 *
 * @param {Object} [props] - Enhanced card configuration
 * @param {string} [props.title] - Card title
 * @param {string} [props.subtitle] - Card subtitle (muted text below title)
 * @param {string|Object|Array} [props.content] - Card body content
 * @param {string|Object} [props.footer] - Card footer content
 * @param {string|Object} [props.header] - Card header content
 * @param {Object} [props.image] - Card image configuration
 * @param {string} props.image.src - Image source URL
 * @param {string} [props.image.alt] - Image alt text
 * @param {string} [props.imagePosition="top"] - Image position ("top", "bottom", "left", "right")
 * @param {string} [props.variant] - Color variant
 * @param {boolean} [props.bordered=true] - Show card border
 * @param {string} [props.shadow="sm"] - Shadow level ("none", "sm", "md", "lg")
 * @param {boolean} [props.hoverable=false] - Enable hover lift animation
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Inline style object
 * @param {string} [props.headerClass] - Additional header CSS classes
 * @param {string} [props.bodyClass] - Additional body CSS classes
 * @param {string} [props.footerClass] - Additional footer CSS classes
 * @param {Object} [props.state] - Component state object
 * @returns {Object} TACO object representing an enhanced card
 * @example
 * const card = makeCardV2({
 *   title: "Project Alpha",
 *   subtitle: "v2.0 Release",
 *   content: "Major performance improvements.",
 *   image: { src: "/img/alpha.jpg", alt: "Alpha" },
 *   imagePosition: "top",
 *   shadow: "lg",
 *   hoverable: true
 * });
 */
export function makeCardV2(props = {}) {
  const {
    title,
    subtitle,
    content,
    footer,
    header,
    image,
    imagePosition = 'top', // top, bottom, left, right
    variant,
    bordered = true,
    shadow = 'sm',
    hoverable = false,
    className = '',
    style,
    headerClass = '',
    bodyClass = '',
    footerClass = ''
  } = props;

  const shadowClasses = {
    none: '',
    sm: 'bw-shadow-sm',
    md: 'bw-shadow',
    lg: 'bw-shadow-lg'
  };

  const cardContent = [
    header && {
      t: 'div',
      a: { class: `bw-card-header ${headerClass}`.trim() },
      c: header
    },
    image && (imagePosition === 'top' || imagePosition === 'left') && {
      t: 'img',
      a: {
        class: `bw-card-img-${imagePosition}`,
        src: image.src,
        alt: image.alt || ''
      }
    },
    {
      t: 'div',
      a: { class: `bw-card-body ${bodyClass}`.trim() },
      c: [
        title && { t: 'h5', a: { class: 'bw-card-title' }, c: title },
        subtitle && { t: 'h6', a: { class: 'bw-card-subtitle bw-mb-2 bw-text-muted' }, c: subtitle },
        content && (Array.isArray(content) ? content : [content])
      ].flat().filter(Boolean)
    },
    image && (imagePosition === 'bottom' || imagePosition === 'right') && {
      t: 'img',
      a: {
        class: `bw-card-img-${imagePosition}`,
        src: image.src,
        alt: image.alt || ''
      }
    },
    footer && {
      t: 'div',
      a: { class: `bw-card-footer ${footerClass}`.trim() },
      c: footer
    }
  ].filter(Boolean);

  // Handle horizontal layout for left/right images
  if (image && (imagePosition === 'left' || imagePosition === 'right')) {
    return {
      t: 'div',
      a: {
        class: `bw-card ${variant ? `bw-card-${variant}` : ''} ${!bordered ? 'bw-border-0' : ''} ${shadowClasses[shadow]} ${hoverable ? 'bw-card-hoverable' : ''} ${className}`.trim(),
        style
      },
      c: {
        t: 'div',
        a: { class: 'bw-row bw-g-0' },
        c: cardContent
      },
      o: {
        type: 'card',
        state: props.state || {}
      }
    };
  }

  return {
    t: 'div',
    a: {
      class: `bw-card ${variant ? `bw-card-${variant}` : ''} ${!bordered ? 'bw-border-0' : ''} ${shadowClasses[shadow]} ${hoverable ? 'bw-card-hoverable' : ''} ${className}`.trim(),
      style
    },
    c: cardContent,
    o: {
      type: 'card',
      state: props.state || {}
    }
  };
}

/**
 * Create a call-to-action section with title, description, and action buttons
 *
 * @param {Object} [props] - CTA configuration
 * @param {string} [props.title] - CTA headline
 * @param {string} [props.description] - CTA description text
 * @param {Array|Object} [props.actions] - CTA buttons or content
 * @param {string} [props.variant="light"] - Background variant
 * @param {boolean} [props.centered=true] - Center-align content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a CTA section
 * @example
 * const cta = makeCTA({
 *   title: "Ready to get started?",
 *   description: "Join thousands of developers using Bitwrench.",
 *   actions: [
 *     makeButton({ text: "Sign Up Free", variant: "primary", size: "lg" })
 *   ]
 * });
 */
export function makeCTA(props = {}) {
  const {
    title,
    description,
    actions,
    variant = 'light',
    centered = true,
    className = ''
  } = props;

  return {
    t: 'section',
    a: { class: `bw-cta bw-bg-${variant} bw-py-5 ${className}`.trim() },
    c: {
      t: 'div',
      a: { class: 'bw-container' },
      c: {
        t: 'div',
        a: { class: `bw-cta-content ${centered ? 'bw-text-center' : ''}` },
        c: [
          title && { t: 'h2', a: { class: 'bw-cta-title bw-mb-3' }, c: title },
          description && { t: 'p', a: { class: 'bw-cta-description bw-lead bw-mb-4' }, c: description },
          actions && {
            t: 'div',
            a: { class: 'bw-cta-actions' },
            c: actions
          }
        ].filter(Boolean)
      }
    }
  };
}

/**
 * Create a page section with optional centered header and background
 *
 * @param {Object} [props] - Section configuration
 * @param {string} [props.title] - Section title
 * @param {string} [props.subtitle] - Section subtitle (muted)
 * @param {string|Object|Array} [props.content] - Section body content
 * @param {string} [props.variant="default"] - Background variant ("default" for none, or a color name)
 * @param {string} [props.spacing="md"] - Vertical padding ("sm", "md", "lg", "xl")
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a content section
 * @example
 * const section = makeSection({
 *   title: "Features",
 *   subtitle: "Everything you need to build great UIs",
 *   spacing: "lg",
 *   content: makeFeatureGrid({ features: [...] })
 * });
 */
export function makeSection(props = {}) {
  const {
    title,
    subtitle,
    content,
    variant = 'default',
    spacing = 'md',
    className = ''
  } = props;

  const spacingClasses = {
    sm: 'bw-py-3',
    md: 'bw-py-4',
    lg: 'bw-py-5',
    xl: 'bw-py-6'
  };

  return {
    t: 'section',
    a: {
      class: `bw-section ${spacingClasses[spacing] || spacingClasses.md} ${variant !== 'default' ? `bw-bg-${variant}` : ''} ${className}`.trim()
    },
    c: {
      t: 'div',
      a: { class: 'bw-container' },
      c: [
        (title || subtitle) && {
          t: 'div',
          a: { class: 'bw-section-header bw-text-center bw-mb-5' },
          c: [
            title && { t: 'h2', a: { class: 'bw-section-title' }, c: title },
            subtitle && { t: 'p', a: { class: 'bw-section-subtitle bw-text-muted' }, c: subtitle }
          ].filter(Boolean)
        },
        content
      ].filter(Boolean)
    }
  };
}

// =========================================================================
// Component Handle Classes
//
// Handle classes provide imperative DOM manipulation for rendered components.
// They cache child element references for efficient updates without
// full re-renders. Used by bw.createCard(), bw.createTable(), etc.
// =========================================================================

/**
 * Imperative handle for a rendered card component
 *
 * Provides methods to update card title, content, and CSS classes
 * without re-rendering the entire component. Created automatically
 * when using bw.createCard().
 */
export class CardHandle {
  /**
   * @param {Element} element - The card's root DOM element
   * @param {Object} taco - The original TACO object used to create the card
   */
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

  /**
   * Update the card title text
   *
   * @param {string} title - New title text
   * @returns {CardHandle} this (for chaining)
   */
  setTitle(title) {
    if (this.children.title) {
      this.children.title.textContent = title;
    }
    return this;
  }

  /**
   * Replace the card body content
   *
   * @param {string|Object} content - New content (string or TACO object)
   * @returns {CardHandle} this (for chaining)
   */
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

  /**
   * Add a CSS class to the card root element
   *
   * @param {string} className - Class to add
   * @returns {CardHandle} this (for chaining)
   */
  addClass(className) {
    this.element.classList.add(className);
    return this;
  }

  /**
   * Remove a CSS class from the card root element
   *
   * @param {string} className - Class to remove
   * @returns {CardHandle} this (for chaining)
   */
  removeClass(className) {
    this.element.classList.remove(className);
    return this;
  }

  /**
   * Query a child element within the card
   *
   * @param {string} selector - CSS selector
   * @returns {Element|null} Matching element or null
   */
  select(selector) {
    return this.element.querySelector(selector);
  }
}

/**
 * Imperative handle for a rendered table component
 *
 * Provides methods for data updates and column sorting. Caches
 * thead/tbody/header references for efficient DOM updates.
 * Created automatically when using bw.createTable().
 */
export class TableHandle {
  /**
   * @param {Element} element - The table's root DOM element
   * @param {Object} taco - The original TACO object used to create the table
   */
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

  /**
   * Attach click-to-sort handlers on all column headers
   * @private
   */
  _setupSorting() {
    this.children.headers.forEach((th, index) => {
      th.style.cursor = 'pointer';
      th.onclick = () => this.sortBy(th.textContent);
    });
  }

  /**
   * Replace the table data and re-render the body
   *
   * @param {Array<Object>} data - Array of row objects
   * @returns {TableHandle} this (for chaining)
   */
  setData(data) {
    this._data = data;
    this._renderBody();
    return this;
  }

  /**
   * Sort the table by a column name
   *
   * Toggles direction if the same column is sorted again.
   *
   * @param {string} column - Column header text to sort by
   * @param {string} [direction] - Sort direction ("asc" or "desc"); toggles if omitted
   * @returns {TableHandle} this (for chaining)
   */
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

  /**
   * Re-render the tbody from current _data
   * @private
   */
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

/**
 * Imperative handle for a rendered navbar component
 *
 * Provides methods to update the active navigation link.
 * Created automatically when using bw.createNavbar().
 */
export class NavbarHandle {
  /**
   * @param {Element} element - The navbar's root DOM element
   * @param {Object} taco - The original TACO object used to create the navbar
   */
  constructor(element, taco) {
    this.element = element;
    this._taco = taco;
    this.state = taco.o?.state || {};

    this.children = {
      brand: element.querySelector('.bw-navbar-brand'),
      links: element.querySelectorAll('.bw-nav-link')
    };
  }

  /**
   * Set the active navigation link by href
   *
   * @param {string} href - The href value of the link to activate
   * @returns {NavbarHandle} this (for chaining)
   */
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

/**
 * Imperative handle for a rendered tabs component
 *
 * Provides programmatic tab switching. Sets up click handlers
 * on tab buttons and manages active states on both buttons and panes.
 * Created automatically when using bw.createTabs().
 */
export class TabsHandle {
  /**
   * @param {Element} element - The tabs container DOM element
   * @param {Object} taco - The original TACO object used to create the tabs
   */
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

  /**
   * Attach click handlers to tab navigation buttons
   * @private
   */
  _setupTabs() {
    this.children.navItems.forEach((navItem, index) => {
      navItem.onclick = (e) => {
        e.preventDefault();
        this.switchTo(index);
      };
    });
  }

  /**
   * Programmatically switch to a tab by index
   *
   * @param {number} index - Zero-based tab index to activate
   * @returns {TabsHandle} this (for chaining)
   */
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

/**
 * Create a code demo component for documentation pages
 *
 * Displays a live result alongside source code in a tabbed interface.
 * Includes a copy-to-clipboard button on the code tab.
 *
 * @param {Object} [props] - Code demo configuration
 * @param {string} [props.title] - Demo title heading
 * @param {string} [props.description] - Demo description text
 * @param {string} [props.code] - Source code to display (adds a "Code" tab when present)
 * @param {string|Object|Array} [props.result] - Live result content for the "Result" tab
 * @param {string} [props.language="javascript"] - Code language for syntax class
 * @returns {Object} TACO object representing a code demo with tabbed Result/Code views
 * @example
 * const demo = makeCodeDemo({
 *   title: "Button Example",
 *   description: "A simple primary button",
 *   code: 'makeButton({ text: "Click me" })',
 *   result: makeButton({ text: "Click me" })
 * });
 */
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
    }
  ];

  // Only add Code tab if code is provided
  if (code) {
    tabs.push({
      label: 'Code',
      content: {
        t: 'div',
        a: { style: 'position: relative;' },
        c: [
          {
            t: 'button',
            a: {
              class: 'copy-btn',
              style: 'position: absolute; top: 0.5rem; right: 0.5rem; padding: 0.25rem 0.625rem; font-size: 0.6875rem; background: rgba(255,255,255,0.12); color: #aaa; border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; cursor: pointer; font-family: inherit; transition: all 0.15s;',
              onclick: (e) => {
                navigator.clipboard.writeText(code).then(() => {
                  const btn = e.target;
                  const originalText = btn.textContent;
                  btn.textContent = 'Copied!';
                  btn.style.background = '#006666';
                  btn.style.color = '#fff';
                  setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = 'rgba(255,255,255,0.12)';
                    btn.style.color = '#aaa';
                  }, 2000);
                });
              }
            },
            c: 'Copy'
          },
          {
            t: 'pre',
            a: {
              style: 'margin: 0; background: #1e293b; border: none; border-radius: 6px; overflow-x: auto;'
            },
            c: {
              t: 'code',
              a: {
                class: `language-${language}`,
                style: 'display: block; padding: 1.25rem; font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace; font-size: 0.8125rem; line-height: 1.6; color: #e2e8f0;'
              },
              c: code
            }
          }
        ]
      }
    });
  }

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

/**
 * Registry mapping component type names to their handle classes
 *
 * Used by bw.createCard(), bw.createTable(), etc. to wrap rendered
 * DOM elements in the appropriate imperative handle.
 *
 * @type {Object.<string, Function>}
 */
export const componentHandles = {
  card: CardHandle,
  table: TableHandle,
  navbar: NavbarHandle,
  tabs: TabsHandle
};
