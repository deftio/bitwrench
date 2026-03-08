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
 * Create a card component with optional header, body, footer, and image support
 *
 * Supports images (top, bottom, left, right), shadow levels, subtitle,
 * hover animation, and custom section class overrides. For horizontal
 * image layouts (left/right), content is wrapped in a row grid.
 *
 * @param {Object} [props] - Card configuration
 * @param {string} [props.title] - Card title displayed in the body
 * @param {string} [props.subtitle] - Card subtitle (muted text below title)
 * @param {string|Object|Array} [props.content] - Card body content (string, TACO, or array)
 * @param {string|Object} [props.footer] - Card footer content
 * @param {string|Object} [props.header] - Card header content
 * @param {Object} [props.image] - Card image configuration
 * @param {string} props.image.src - Image source URL
 * @param {string} [props.image.alt] - Image alt text
 * @param {string} [props.imagePosition="top"] - Image position ("top", "bottom", "left", "right")
 * @param {string} [props.variant] - Color variant (e.g. "primary", "danger")
 * @param {boolean} [props.bordered=true] - Show card border
 * @param {string} [props.shadow] - Shadow level ("none", "sm", "md", "lg")
 * @param {boolean} [props.hoverable=false] - Enable hover lift animation
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Inline style object
 * @param {string} [props.headerClass] - Additional header CSS classes
 * @param {string} [props.bodyClass] - Additional body CSS classes
 * @param {string} [props.footerClass] - Additional footer CSS classes
 * @param {Object} [props.state] - Component state object
 * @returns {Object} TACO object representing a card component
 * @category Component Builders
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
    subtitle,
    content,
    footer,
    header,
    image,
    imagePosition = 'top',
    variant,
    bordered = true,
    shadow,
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

  const cardClasses = [
    'bw-card',
    variant ? `bw-card-${variant}` : '',
    shadow ? (shadowClasses[shadow] || '') : '',
    !bordered ? 'bw-border-0' : '',
    hoverable ? 'bw-card-hoverable' : '',
    className
  ].filter(Boolean).join(' ').trim();

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
      a: { class: cardClasses, style },
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
    a: { class: cardClasses, style },
    c: cardContent,
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
 * @category Component Builders
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
 * @category Component Builders
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
 * @category Component Builders
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
 * @category Component Builders
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
 * @category Component Builders
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
 * @category Component Builders
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
 * @category Component Builders
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
              tabindex: index === actualActiveIndex ? '0' : '-1',
              'aria-selected': index === actualActiveIndex ? 'true' : 'false',
              'data-tab-index': index,
              onclick: (e) => {
                const tabsContainer = e.target.closest('.bw-tabs');
                const allTabs = tabsContainer.querySelectorAll('.bw-nav-link');
                const allPanes = tabsContainer.querySelectorAll('.bw-tab-pane');

                allTabs.forEach(t => {
                  t.classList.remove('active');
                  t.setAttribute('aria-selected', 'false');
                  t.setAttribute('tabindex', '-1');
                });
                allPanes.forEach(p => p.classList.remove('active'));

                e.target.classList.add('active');
                e.target.setAttribute('aria-selected', 'true');
                e.target.setAttribute('tabindex', '0');
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
      state: { activeIndex: actualActiveIndex },
      mounted: function(el) {
        var tablist = el.querySelector('[role="tablist"]');
        if (!tablist) return;
        tablist.addEventListener('keydown', function(e) {
          var tabButtons = tablist.querySelectorAll('[role="tab"]');
          var currentIndex = -1;
          for (var i = 0; i < tabButtons.length; i++) {
            if (tabButtons[i] === e.target) { currentIndex = i; break; }
          }
          if (currentIndex === -1) return;

          var newIndex = -1;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            newIndex = currentIndex > 0 ? currentIndex - 1 : tabButtons.length - 1;
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            newIndex = currentIndex < tabButtons.length - 1 ? currentIndex + 1 : 0;
          } else if (e.key === 'Home') {
            e.preventDefault();
            newIndex = 0;
          } else if (e.key === 'End') {
            e.preventDefault();
            newIndex = tabButtons.length - 1;
          }

          if (newIndex >= 0) {
            tabButtons[newIndex].focus();
            tabButtons[newIndex].click();
          }
        });
      }
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
 * @category Component Builders
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
          'aria-label': 'Close',
          onclick: function(e) {
            var alert = e.target.closest('.bw-alert');
            if (alert) { alert.remove(); }
          }
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
 * @param {string} [props.size] - Size variant: 'sm' or 'lg' (default is medium)
 * @param {boolean} [props.pill=false] - Use pill (rounded) shape
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a badge span
 * @category Component Builders
 * @example
 * const badge = makeBadge({ text: "New", variant: "danger", pill: true });
 * const small = makeBadge({ text: "3", variant: "info", size: "sm" });
 */
export function makeBadge(props = {}) {
  const {
    text,
    variant = 'primary',
    size,
    pill = false,
    className = ''
  } = props;

  const sizeClass = size === 'sm' ? ' bw-badge-sm' : size === 'lg' ? ' bw-badge-lg' : '';

  return {
    t: 'span',
    a: {
      class: `bw-badge bw-badge-${variant}${sizeClass} ${pill ? 'bw-badge-pill' : ''} ${className}`.trim()
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
 * @category Component Builders
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
 * @category Component Builders
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
 * @category Component Builders
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
 * @category Component Builders
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
 * @category Component Builders
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
 * @category Component Builders
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
 * @category Component Builders
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
 * @category Component Builders
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
 * @category Component Builders
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
    value,
    className = '',
    ...eventHandlers
  } = props;

  return {
    t: 'div',
    a: { class: `bw-form-check ${className}`.trim() },
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
          value,
          ...eventHandlers
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
 * @category Component Builders
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
 * @category Component Builders
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
 * @category Component Builders
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
 * @category Component Builders
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
                class: 'bw-feature-icon bw-mb-3 bw-text-primary',
                style: `font-size: ${iconSize};`
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
 * @category Component Builders
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
 * @category Component Builders
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
 *
 * @category Component Handles
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
 *
 * @category Component Handles
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
 *
 * @category Component Handles
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
 *
 * @category Component Handles
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
 * @category Component Builders
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
              class: 'bw-copy-btn bw-code-copy-btn',
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
          (typeof globalThis !== 'undefined' && typeof globalThis.bw !== 'undefined' && typeof globalThis.bw.codeEditor === 'function')
            ? globalThis.bw.codeEditor({ code: code, lang: language === 'javascript' ? 'js' : language, readOnly: true, height: 'auto' })
            : {
                t: 'pre',
                a: { class: 'bw-code-pre' },
                c: {
                  t: 'code',
                  a: { class: `bw-code-block language-${language}` },
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
      a: { class: 'bw-text-muted', style: 'margin-bottom: 1rem;' },
      c: description
    },
    makeTabs({ tabs, id: demoId })
  ].filter(Boolean);

  return {
    t: 'div',
    a: { class: 'bw-code-demo' },
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
// =========================================================================
// Phase 1: Quick Wins
// =========================================================================

/**
 * Create a pagination navigation component
 *
 * @param {Object} [props] - Pagination configuration
 * @param {number} [props.pages=1] - Total number of pages
 * @param {number} [props.currentPage=1] - Currently active page (1-based)
 * @param {Function} [props.onPageChange] - Callback when page changes, receives page number
 * @param {string} [props.size] - Size variant ("sm" or "lg")
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a pagination nav
 * @category Component Builders
 * @example
 * const pager = makePagination({
 *   pages: 10,
 *   currentPage: 3,
 *   onPageChange: (page) => loadPage(page)
 * });
 */
export function makePagination(props = {}) {
  const {
    pages = 1,
    currentPage = 1,
    onPageChange,
    size,
    className = ''
  } = props;

  function handleClick(page) {
    return function(e) {
      e.preventDefault();
      if (page < 1 || page > pages || page === currentPage) return;
      if (onPageChange) onPageChange(page);
    };
  }

  const items = [];

  // Previous arrow
  items.push({
    t: 'li',
    a: { class: `bw-page-item ${currentPage <= 1 ? 'bw-disabled' : ''}`.trim() },
    c: {
      t: 'a',
      a: { class: 'bw-page-link', href: '#', onclick: handleClick(currentPage - 1), 'aria-label': 'Previous' },
      c: '\u2039'
    }
  });

  // Page numbers
  for (var i = 1; i <= pages; i++) {
    (function(pageNum) {
      items.push({
        t: 'li',
        a: { class: `bw-page-item ${pageNum === currentPage ? 'bw-active' : ''}`.trim() },
        c: {
          t: 'a',
          a: { class: 'bw-page-link', href: '#', onclick: handleClick(pageNum) },
          c: '' + pageNum
        }
      });
    })(i);
  }

  // Next arrow
  items.push({
    t: 'li',
    a: { class: `bw-page-item ${currentPage >= pages ? 'bw-disabled' : ''}`.trim() },
    c: {
      t: 'a',
      a: { class: 'bw-page-link', href: '#', onclick: handleClick(currentPage + 1), 'aria-label': 'Next' },
      c: '\u203A'
    }
  });

  return {
    t: 'nav',
    a: { 'aria-label': 'Pagination' },
    c: {
      t: 'ul',
      a: {
        class: `bw-pagination ${size ? 'bw-pagination-' + size : ''} ${className}`.trim()
      },
      c: items
    }
  };
}

/**
 * Create a radio button input with label
 *
 * @param {Object} [props] - Radio configuration
 * @param {string} [props.label] - Radio label text
 * @param {string} [props.name] - Radio group name
 * @param {string} [props.value] - Radio value attribute
 * @param {boolean} [props.checked=false] - Whether the radio is selected
 * @param {string} [props.id] - Element ID (links label to radio)
 * @param {boolean} [props.disabled=false] - Whether the radio is disabled
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a radio form group
 * @category Component Builders
 * @example
 * const radio = makeRadio({
 *   label: "Option A",
 *   name: "choice",
 *   value: "a",
 *   checked: true
 * });
 */
export function makeRadio(props = {}) {
  const {
    label,
    name,
    value,
    checked = false,
    id,
    disabled = false,
    className = '',
    ...eventHandlers
  } = props;

  return {
    t: 'div',
    a: { class: `bw-form-check ${className}`.trim() },
    c: [
      {
        t: 'input',
        a: {
          type: 'radio',
          class: 'bw-form-check-input',
          name,
          value,
          checked,
          id,
          disabled,
          ...eventHandlers
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
 * Create a button group wrapper
 *
 * @param {Object} [props] - Button group configuration
 * @param {Array} [props.children] - Button TACO objects to group
 * @param {string} [props.size] - Size variant ("sm" or "lg")
 * @param {boolean} [props.vertical=false] - Stack buttons vertically
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a button group
 * @category Component Builders
 * @example
 * const group = makeButtonGroup({
 *   children: [
 *     makeButton({ text: "Left", variant: "primary" }),
 *     makeButton({ text: "Middle", variant: "primary" }),
 *     makeButton({ text: "Right", variant: "primary" })
 *   ]
 * });
 */
export function makeButtonGroup(props = {}) {
  const {
    children,
    size,
    vertical = false,
    className = ''
  } = props;

  return {
    t: 'div',
    a: {
      class: `${vertical ? 'bw-btn-group-vertical' : 'bw-btn-group'} ${size ? 'bw-btn-group-' + size : ''} ${className}`.trim(),
      role: 'group'
    },
    c: children
  };
}

// =========================================================================
// Phase 2: Core Interactive
// =========================================================================

/**
 * Create an accordion component with collapsible items
 *
 * @param {Object} [props] - Accordion configuration
 * @param {Array<Object>} [props.items=[]] - Accordion items
 * @param {string} props.items[].title - Header text for the accordion item
 * @param {string|Object|Array} props.items[].content - Collapsible content
 * @param {boolean} [props.items[].open=false] - Whether the item is initially open
 * @param {boolean} [props.multiOpen=false] - Allow multiple items open simultaneously
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing an accordion
 * @category Component Builders
 * @example
 * const accordion = makeAccordion({
 *   items: [
 *     { title: "Section 1", content: "Content 1", open: true },
 *     { title: "Section 2", content: "Content 2" }
 *   ]
 * });
 */
export function makeAccordion(props = {}) {
  const {
    items = [],
    multiOpen = false,
    className = ''
  } = props;

  return {
    t: 'div',
    a: { class: `bw-accordion ${className}`.trim() },
    c: items.map(function(item, index) {
      return {
        t: 'div',
        a: { class: 'bw-accordion-item' },
        c: [
          {
            t: 'h2',
            a: { class: 'bw-accordion-header' },
            c: {
              t: 'button',
              a: {
                class: `bw-accordion-button ${item.open ? '' : 'bw-collapsed'}`.trim(),
                type: 'button',
                'aria-expanded': item.open ? 'true' : 'false',
                'data-accordion-index': index,
                onclick: function(e) {
                  var btn = e.target.closest('.bw-accordion-button');
                  var accordionEl = btn.closest('.bw-accordion');
                  var accordionItem = btn.closest('.bw-accordion-item');
                  var collapse = accordionItem.querySelector('.bw-accordion-collapse');
                  var isOpen = collapse.classList.contains('bw-collapse-show');

                  if (!multiOpen) {
                    // Animate-close all other open siblings
                    var allItems = accordionEl.querySelectorAll('.bw-accordion-item');
                    for (var j = 0; j < allItems.length; j++) {
                      if (allItems[j] === accordionItem) continue;
                      var sibCollapse = allItems[j].querySelector('.bw-accordion-collapse');
                      var sibBtn = allItems[j].querySelector('.bw-accordion-button');
                      if (sibCollapse.classList.contains('bw-collapse-show')) {
                        sibCollapse.style.maxHeight = sibCollapse.scrollHeight + 'px';
                        sibCollapse.offsetHeight; // force reflow
                        sibCollapse.style.maxHeight = '0px';
                        sibCollapse.classList.remove('bw-collapse-show');
                        sibBtn.classList.add('bw-collapsed');
                        sibBtn.setAttribute('aria-expanded', 'false');
                      }
                    }
                  }

                  if (isOpen) {
                    // Animate close
                    collapse.style.maxHeight = collapse.scrollHeight + 'px';
                    collapse.offsetHeight; // force reflow
                    collapse.style.maxHeight = '0px';
                    collapse.classList.remove('bw-collapse-show');
                    btn.classList.add('bw-collapsed');
                    btn.setAttribute('aria-expanded', 'false');
                  } else {
                    // Animate open
                    collapse.classList.add('bw-collapse-show');
                    collapse.style.maxHeight = '0px';
                    collapse.offsetHeight; // force reflow
                    collapse.style.maxHeight = collapse.scrollHeight + 'px';
                    btn.classList.remove('bw-collapsed');
                    btn.setAttribute('aria-expanded', 'true');
                    // After transition, allow dynamic content sizing
                    var onEnd = function(ev) {
                      if (ev.propertyName === 'max-height' && collapse.classList.contains('bw-collapse-show')) {
                        collapse.style.maxHeight = 'none';
                      }
                      collapse.removeEventListener('transitionend', onEnd);
                    };
                    collapse.addEventListener('transitionend', onEnd);
                  }
                }
              },
              c: item.title
            }
          },
          {
            t: 'div',
            a: { class: `bw-accordion-collapse ${item.open ? 'bw-collapse-show' : ''}`.trim() },
            c: {
              t: 'div',
              a: { class: 'bw-accordion-body' },
              c: item.content
            },
            o: item.open ? {
              mounted: function(el) {
                el.style.maxHeight = 'none';
              }
            } : undefined
          }
        ]
      };
    }),
    o: {
      type: 'accordion',
      state: { multiOpen: multiOpen }
    }
  };
}

/**
 * Imperative handle for a rendered modal component
 *
 * Provides `.show()`, `.hide()`, `.toggle()`, and `.destroy()` methods
 * for controlling the modal programmatically.
 *
 * @category Component Handles
 */
export class ModalHandle {
  /**
   * @param {Element} element - The modal backdrop DOM element
   * @param {Object} taco - The original TACO object
   */
  constructor(element, taco) {
    this.element = element;
    this._taco = taco;
    this._escHandler = null;
  }

  /** Show the modal */
  show() {
    this.element.classList.add('bw-modal-show');
    document.body.style.overflow = 'hidden';
    return this;
  }

  /** Hide the modal */
  hide() {
    this.element.classList.remove('bw-modal-show');
    document.body.style.overflow = '';
    return this;
  }

  /** Toggle modal visibility */
  toggle() {
    if (this.element.classList.contains('bw-modal-show')) {
      this.hide();
    } else {
      this.show();
    }
    return this;
  }

  /** Remove the modal from DOM and clean up */
  destroy() {
    this.hide();
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
    }
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

/**
 * Create a modal dialog overlay
 *
 * @param {Object} [props] - Modal configuration
 * @param {string} [props.title] - Modal title in header
 * @param {string|Object|Array} [props.content] - Modal body content
 * @param {string|Object|Array} [props.footer] - Modal footer content
 * @param {string} [props.size] - Modal size ("sm", "lg", "xl")
 * @param {boolean} [props.closeButton=true] - Show X close button in header
 * @param {Function} [props.onClose] - Callback when modal is closed
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a modal
 * @category Component Builders
 * @example
 * const modal = makeModal({
 *   title: "Confirm",
 *   content: "Are you sure?",
 *   footer: makeButton({ text: "OK", variant: "primary" })
 * });
 */
export function makeModal(props = {}) {
  const {
    title,
    content,
    footer,
    size,
    closeButton = true,
    onClose,
    className = ''
  } = props;

  function closeModal(el) {
    var backdrop = el.closest('.bw-modal');
    if (backdrop) {
      backdrop.classList.remove('bw-modal-show');
      document.body.style.overflow = '';
    }
    if (onClose) onClose();
  }

  return {
    t: 'div',
    a: { class: `bw-modal ${className}`.trim() },
    c: {
      t: 'div',
      a: { class: `bw-modal-dialog ${size ? 'bw-modal-' + size : ''}`.trim() },
      c: {
        t: 'div',
        a: { class: 'bw-modal-content' },
        c: [
          (title || closeButton) && {
            t: 'div',
            a: { class: 'bw-modal-header' },
            c: [
              title && { t: 'h5', a: { class: 'bw-modal-title' }, c: title },
              closeButton && {
                t: 'button',
                a: {
                  type: 'button',
                  class: 'bw-close',
                  'aria-label': 'Close',
                  onclick: function(e) { closeModal(e.target); }
                },
                c: '\u00D7'
              }
            ].filter(Boolean)
          },
          content && {
            t: 'div',
            a: { class: 'bw-modal-body' },
            c: content
          },
          footer && {
            t: 'div',
            a: { class: 'bw-modal-footer' },
            c: footer
          }
        ].filter(Boolean)
      }
    },
    o: {
      type: 'modal',
      mounted: function(el) {
        // Click backdrop to close
        el.addEventListener('click', function(e) {
          if (e.target === el) closeModal(el);
        });
        // Escape key to close
        var escHandler = function(e) {
          if (e.key === 'Escape' && el.classList.contains('bw-modal-show')) {
            closeModal(el);
          }
        };
        document.addEventListener('keydown', escHandler);
        el._bw_escHandler = escHandler;
      },
      unmount: function(el) {
        if (el._bw_escHandler) {
          document.removeEventListener('keydown', el._bw_escHandler);
        }
        document.body.style.overflow = '';
      }
    }
  };
}

/**
 * Create a toast notification popup
 *
 * @param {Object} [props] - Toast configuration
 * @param {string} [props.title] - Toast title
 * @param {string|Object|Array} [props.content] - Toast body content
 * @param {string} [props.variant="info"] - Color variant ("primary", "success", "danger", "warning", "info")
 * @param {boolean} [props.autoDismiss=true] - Auto-dismiss after delay
 * @param {number} [props.delay=5000] - Auto-dismiss delay in ms
 * @param {string} [props.position="top-right"] - Container position
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a toast
 * @category Component Builders
 * @example
 * const toast = makeToast({
 *   title: "Success",
 *   content: "File saved!",
 *   variant: "success"
 * });
 */
export function makeToast(props = {}) {
  const {
    title,
    content,
    variant = 'info',
    autoDismiss = true,
    delay = 5000,
    position = 'top-right',
    className = ''
  } = props;

  return {
    t: 'div',
    a: {
      class: `bw-toast bw-toast-${variant} ${className}`.trim(),
      role: 'alert',
      'data-position': position
    },
    c: [
      (title) && {
        t: 'div',
        a: { class: 'bw-toast-header' },
        c: [
          { t: 'strong', c: title },
          {
            t: 'button',
            a: {
              type: 'button',
              class: 'bw-close',
              'aria-label': 'Close',
              onclick: function(e) {
                var toast = e.target.closest('.bw-toast');
                if (toast) {
                  toast.classList.add('bw-toast-hiding');
                  setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
                }
              }
            },
            c: '\u00D7'
          }
        ]
      },
      content && {
        t: 'div',
        a: { class: 'bw-toast-body' },
        c: content
      }
    ].filter(Boolean),
    o: {
      type: 'toast',
      mounted: function(el) {
        // Trigger show animation
        requestAnimationFrame(function() {
          el.classList.add('bw-toast-show');
        });
        // Auto-dismiss
        if (autoDismiss) {
          setTimeout(function() {
            el.classList.add('bw-toast-hiding');
            setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
          }, delay);
        }
      }
    }
  };
}

// =========================================================================
// Phase 3: Essential Modern
// =========================================================================

/**
 * Create a dropdown menu triggered by a button
 *
 * @param {Object} [props] - Dropdown configuration
 * @param {string|Object} [props.trigger] - Button text or TACO for the trigger
 * @param {Array<Object>} [props.items=[]] - Menu items
 * @param {string} [props.items[].text] - Item display text
 * @param {string} [props.items[].href] - Item link URL
 * @param {Function} [props.items[].onclick] - Item click handler
 * @param {boolean} [props.items[].divider] - Render as a divider line
 * @param {boolean} [props.items[].disabled] - Whether the item is disabled
 * @param {string} [props.align="start"] - Menu alignment ("start" or "end")
 * @param {string} [props.variant="primary"] - Trigger button variant
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a dropdown
 * @category Component Builders
 * @example
 * const dropdown = makeDropdown({
 *   trigger: "Actions",
 *   items: [
 *     { text: "Edit", onclick: () => edit() },
 *     { divider: true },
 *     { text: "Delete", onclick: () => del() }
 *   ]
 * });
 */
export function makeDropdown(props = {}) {
  const {
    trigger,
    items = [],
    align = 'start',
    variant = 'primary',
    className = ''
  } = props;

  var triggerTaco;
  if (typeof trigger === 'string' || trigger === undefined) {
    triggerTaco = {
      t: 'button',
      a: {
        class: `bw-btn bw-btn-${variant} bw-dropdown-toggle`,
        type: 'button',
        onclick: function(e) {
          var dropdown = e.target.closest('.bw-dropdown');
          var menu = dropdown.querySelector('.bw-dropdown-menu');
          menu.classList.toggle('bw-dropdown-show');
        }
      },
      c: trigger || 'Dropdown'
    };
  } else {
    triggerTaco = trigger;
  }

  return {
    t: 'div',
    a: { class: `bw-dropdown ${className}`.trim() },
    c: [
      triggerTaco,
      {
        t: 'div',
        a: { class: `bw-dropdown-menu ${align === 'end' ? 'bw-dropdown-menu-end' : ''}`.trim() },
        c: items.map(function(item) {
          if (item.divider) {
            return { t: 'hr', a: { class: 'bw-dropdown-divider' } };
          }
          return {
            t: 'a',
            a: {
              class: `bw-dropdown-item ${item.disabled ? 'disabled' : ''}`.trim(),
              href: item.href || '#',
              onclick: item.disabled ? undefined : function(e) {
                if (!item.href) e.preventDefault();
                var dropdown = e.target.closest('.bw-dropdown');
                var menu = dropdown.querySelector('.bw-dropdown-menu');
                menu.classList.remove('bw-dropdown-show');
                if (item.onclick) item.onclick(e);
              }
            },
            c: item.text
          };
        })
      }
    ],
    o: {
      type: 'dropdown',
      mounted: function(el) {
        // Click outside to close
        var outsideHandler = function(e) {
          if (!el.contains(e.target)) {
            var menu = el.querySelector('.bw-dropdown-menu');
            if (menu) menu.classList.remove('bw-dropdown-show');
          }
        };
        document.addEventListener('click', outsideHandler);
        el._bw_outsideHandler = outsideHandler;
      },
      unmount: function(el) {
        if (el._bw_outsideHandler) {
          document.removeEventListener('click', el._bw_outsideHandler);
        }
      }
    }
  };
}

/**
 * Create a toggle switch (styled checkbox)
 *
 * @param {Object} [props] - Switch configuration
 * @param {string} [props.label] - Switch label text
 * @param {boolean} [props.checked=false] - Whether the switch is on
 * @param {string} [props.id] - Element ID (links label to switch)
 * @param {string} [props.name] - Input name attribute
 * @param {boolean} [props.disabled=false] - Whether the switch is disabled
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a toggle switch
 * @category Component Builders
 * @example
 * const toggle = makeSwitch({
 *   label: "Dark mode",
 *   checked: false,
 *   onchange: (e) => toggleDark(e.target.checked)
 * });
 */
export function makeSwitch(props = {}) {
  const {
    label,
    checked = false,
    id,
    name,
    disabled = false,
    className = '',
    ...eventHandlers
  } = props;

  return {
    t: 'div',
    a: { class: `bw-form-check bw-form-switch ${className}`.trim() },
    c: [
      {
        t: 'input',
        a: {
          type: 'checkbox',
          class: 'bw-form-check-input bw-switch-input',
          role: 'switch',
          checked,
          id,
          name,
          disabled,
          ...eventHandlers
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
 * Create a skeleton loading placeholder
 *
 * @param {Object} [props] - Skeleton configuration
 * @param {string} [props.variant="text"] - Shape variant ("text", "circle", "rect")
 * @param {string} [props.width] - Custom width (e.g. "200px", "100%")
 * @param {string} [props.height] - Custom height (e.g. "20px")
 * @param {number} [props.count=1] - Number of skeleton lines (for text variant)
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a skeleton placeholder
 * @category Component Builders
 * @example
 * const skeleton = makeSkeleton({ variant: "text", count: 3, width: "100%" });
 */
export function makeSkeleton(props = {}) {
  const {
    variant = 'text',
    width,
    height,
    count = 1,
    className = ''
  } = props;

  if (variant === 'circle') {
    var circleSize = width || height || '3rem';
    return {
      t: 'div',
      a: {
        class: `bw-skeleton bw-skeleton-circle ${className}`.trim(),
        style: { width: circleSize, height: circleSize }
      }
    };
  }

  if (variant === 'rect') {
    return {
      t: 'div',
      a: {
        class: `bw-skeleton bw-skeleton-rect ${className}`.trim(),
        style: {
          width: width || '100%',
          height: height || '120px'
        }
      }
    };
  }

  // Text variant — multiple lines
  if (count === 1) {
    return {
      t: 'div',
      a: {
        class: `bw-skeleton bw-skeleton-text ${className}`.trim(),
        style: {
          width: width || '100%',
          height: height || '1em'
        }
      }
    };
  }

  var lines = [];
  for (var i = 0; i < count; i++) {
    lines.push({
      t: 'div',
      a: {
        class: 'bw-skeleton bw-skeleton-text',
        style: {
          width: i === count - 1 ? '75%' : (width || '100%'),
          height: height || '1em'
        }
      }
    });
  }

  return {
    t: 'div',
    a: { class: `bw-skeleton-group ${className}`.trim() },
    c: lines
  };
}

/**
 * Create a user avatar with image or initials fallback
 *
 * @param {Object} [props] - Avatar configuration
 * @param {string} [props.src] - Image source URL
 * @param {string} [props.alt] - Image alt text
 * @param {string} [props.initials] - Fallback initials (e.g. "JD")
 * @param {string} [props.size="md"] - Size ("sm", "md", "lg", "xl")
 * @param {string} [props.variant="primary"] - Background color variant for initials
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing an avatar
 * @category Component Builders
 * @example
 * const avatar = makeAvatar({ src: "/photo.jpg", alt: "Jane Doe", size: "lg" });
 * const avatarInitials = makeAvatar({ initials: "JD", variant: "success" });
 */
export function makeAvatar(props = {}) {
  const {
    src,
    alt = '',
    initials,
    size = 'md',
    variant = 'primary',
    className = ''
  } = props;

  if (src) {
    return {
      t: 'img',
      a: {
        class: `bw-avatar bw-avatar-${size} ${className}`.trim(),
        src: src,
        alt: alt
      }
    };
  }

  return {
    t: 'div',
    a: {
      class: `bw-avatar bw-avatar-${size} bw-avatar-${variant} ${className}`.trim()
    },
    c: initials || ''
  };
}

/**
 * Create a carousel/slideshow component with slide transitions
 *
 * Supports image slides, TACO content slides, captions, prev/next controls,
 * dot indicators, and optional auto-play. Uses CSS translateX transitions.
 *
 * @param {Object} [props] - Carousel configuration
 * @param {Array<Object>} [props.items=[]] - Slide items
 * @param {string|Object} props.items[].content - Slide content (TACO, string, or img element)
 * @param {string} [props.items[].caption] - Caption text shown at bottom of slide
 * @param {boolean} [props.showControls=true] - Show prev/next arrow buttons
 * @param {boolean} [props.showIndicators=true] - Show dot navigation
 * @param {boolean} [props.autoPlay=false] - Auto-advance slides
 * @param {number} [props.interval=5000] - Auto-advance interval in ms
 * @param {string} [props.height='300px'] - Carousel height
 * @param {number} [props.startIndex=0] - Initial slide index
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a carousel
 * @category Component Builders
 * @example
 * const carousel = makeCarousel({
 *   items: [
 *     { content: { t: 'img', a: { src: 'photo.jpg' } }, caption: 'Photo 1' },
 *     { content: { t: 'div', c: 'Text slide' } }
 *   ],
 *   autoPlay: true,
 *   interval: 3000
 * });
 */
export function makeCarousel(props = {}) {
  const {
    items = [],
    showControls = true,
    showIndicators = true,
    autoPlay = false,
    interval = 5000,
    height = '300px',
    startIndex = 0,
    className = ''
  } = props;

  // Shared navigation logic
  function goToSlide(carouselEl, index) {
    var total = carouselEl.querySelectorAll('.bw-carousel-slide').length;
    if (index < 0) index = total - 1;
    if (index >= total) index = 0;
    carouselEl.setAttribute('data-carousel-index', index);
    var track = carouselEl.querySelector('.bw-carousel-track');
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    // Update indicators
    var indicators = carouselEl.querySelectorAll('.bw-carousel-indicator');
    for (var i = 0; i < indicators.length; i++) {
      if (i === index) {
        indicators[i].classList.add('active');
      } else {
        indicators[i].classList.remove('active');
      }
    }
  }

  // Arrow SVGs (inline data URIs, same pattern as accordion chevrons)
  var prevArrow = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23fff'%3e%3cpath d='M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z'/%3e%3c/svg%3e";
  var nextArrow = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23fff'%3e%3cpath d='M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e";

  var slides = items.map(function(item) {
    var slideContent = [
      item.content,
      item.caption && {
        t: 'div',
        a: { class: 'bw-carousel-caption' },
        c: item.caption
      }
    ].filter(Boolean);

    return {
      t: 'div',
      a: { class: 'bw-carousel-slide' },
      c: slideContent.length === 1 ? slideContent[0] : slideContent
    };
  });

  var children = [
    // Track
    {
      t: 'div',
      a: {
        class: 'bw-carousel-track',
        style: 'transform: translateX(-' + (startIndex * 100) + '%)'
      },
      c: slides
    }
  ];

  // Prev/Next controls
  if (showControls && items.length > 1) {
    children.push({
      t: 'button',
      a: {
        class: 'bw-carousel-control bw-carousel-control-prev',
        type: 'button',
        'aria-label': 'Previous slide',
        onclick: function(e) {
          var carousel = e.target.closest('.bw-carousel');
          var idx = parseInt(carousel.getAttribute('data-carousel-index') || '0');
          goToSlide(carousel, idx - 1);
        }
      },
      c: { t: 'img', a: { src: prevArrow, alt: '', role: 'presentation' } }
    });
    children.push({
      t: 'button',
      a: {
        class: 'bw-carousel-control bw-carousel-control-next',
        type: 'button',
        'aria-label': 'Next slide',
        onclick: function(e) {
          var carousel = e.target.closest('.bw-carousel');
          var idx = parseInt(carousel.getAttribute('data-carousel-index') || '0');
          goToSlide(carousel, idx + 1);
        }
      },
      c: { t: 'img', a: { src: nextArrow, alt: '', role: 'presentation' } }
    });
  }

  // Indicators
  if (showIndicators && items.length > 1) {
    children.push({
      t: 'div',
      a: { class: 'bw-carousel-indicators' },
      c: items.map(function(_, i) {
        return {
          t: 'button',
          a: {
            class: 'bw-carousel-indicator' + (i === startIndex ? ' active' : ''),
            type: 'button',
            'aria-label': 'Go to slide ' + (i + 1),
            'data-slide-index': i,
            onclick: function(e) {
              var carousel = e.target.closest('.bw-carousel');
              var idx = parseInt(e.target.getAttribute('data-slide-index'));
              goToSlide(carousel, idx);
            }
          }
        };
      })
    });
  }

  return {
    t: 'div',
    a: {
      class: ('bw-carousel ' + className).trim(),
      style: 'height: ' + height,
      tabindex: '0',
      'aria-roledescription': 'carousel',
      'data-carousel-index': startIndex
    },
    c: children,
    o: {
      type: 'carousel',
      state: { activeIndex: startIndex, autoPlay: autoPlay, interval: interval },
      mounted: function(el) {
        // Keyboard navigation
        el.addEventListener('keydown', function(e) {
          var idx = parseInt(el.getAttribute('data-carousel-index') || '0');
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goToSlide(el, idx - 1);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            goToSlide(el, idx + 1);
          }
        });
        // Auto-play
        if (autoPlay) {
          var intervalId = setInterval(function() {
            var idx = parseInt(el.getAttribute('data-carousel-index') || '0');
            goToSlide(el, idx + 1);
          }, interval);
          el._bw_carouselInterval = intervalId;
          // Pause on hover/focus for usability
          el.addEventListener('mouseenter', function() {
            if (el._bw_carouselInterval) clearInterval(el._bw_carouselInterval);
          });
          el.addEventListener('mouseleave', function() {
            el._bw_carouselInterval = setInterval(function() {
              var idx = parseInt(el.getAttribute('data-carousel-index') || '0');
              goToSlide(el, idx + 1);
            }, interval);
          });
        }
      },
      unmount: function(el) {
        if (el._bw_carouselInterval) {
          clearInterval(el._bw_carouselInterval);
        }
      }
    }
  };
}

export const componentHandles = {
  card: CardHandle,
  table: TableHandle,
  navbar: NavbarHandle,
  tabs: TabsHandle,
  modal: ModalHandle
};
