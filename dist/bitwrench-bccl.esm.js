/*! bitwrench-bccl v2.0.27 | BSD-2-Clause | https://deftio.github.com/bitwrench/pages */
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
 * @module bitwrench-bccl
 * @license BSD-2-Clause
 * @author M A Chatterjee <deftio [at] deftio [dot] com>
 */

// =========================================================================
// Variant → Utility Class Mapping
//
// Components compose these shared utility classes instead of owning
// their own variant selectors. The CSS is generated once by
// generatePaletteUtilities() + generateInteractionRules().
// =========================================================================

/**
 * Maps component type to a function that returns utility classes for a variant.
 * Each function takes a variant name (e.g. 'primary') and returns a class string.
 * @type {Object.<string, function(string): string>}
 */
/**
 * Convert a variant name to a single palette class.
 * All BCCL components use this: variant='primary' → class includes 'bw_primary'.
 * The CSS palette class (.bw-primary) sets bg/color/border; component-specific
 * overrides in generatePaletteClasses() adjust per component type.
 *
 * @param {string} v - Variant name (e.g. 'primary', 'danger', 'outline_primary')
 * @returns {string} CSS class string
 */
function variantClass(v) {
  if (!v) return '';
  // Handle outline variants: 'outline_primary' or 'outline-primary'
  if (v.indexOf('outline') === 0) {
    var base = v.replace(/^outline[_-]/, '');
    return 'bw_btn_outline bw_' + base;
  }
  return 'bw_' + v;
}

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
function makeCard(props = {}) {
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
    sm: 'bw_shadow_sm',
    md: 'bw_shadow',
    lg: 'bw_shadow_lg'
  };

  const cardClasses = [
    'bw_card',
    variantClass(variant),
    shadow ? (shadowClasses[shadow] || '') : '',
    !bordered ? 'bw_border_0' : '',
    hoverable ? 'bw_card_hoverable' : '',
    className
  ].filter(Boolean).join(' ').trim();

  const cardContent = [
    header && {
      t: 'div',
      a: { class: `bw_card_header ${headerClass}`.trim() },
      c: header
    },
    image && (imagePosition === 'top' || imagePosition === 'left') && {
      t: 'img',
      a: {
        class: `bw_card_img_${imagePosition}`,
        src: image.src,
        alt: image.alt || ''
      }
    },
    {
      t: 'div',
      a: { class: `bw_card_body ${bodyClass}`.trim() },
      c: [
        title && { t: 'h5', a: { class: 'bw_card_title' }, c: title },
        subtitle && { t: 'h6', a: { class: 'bw_card_subtitle bw_mb_2 bw_text_muted' }, c: subtitle },
        content && (Array.isArray(content) ? content : [content])
      ].flat().filter(Boolean)
    },
    image && (imagePosition === 'bottom' || imagePosition === 'right') && {
      t: 'img',
      a: {
        class: `bw_card_img_${imagePosition}`,
        src: image.src,
        alt: image.alt || ''
      }
    },
    footer && {
      t: 'div',
      a: { class: `bw_card_footer ${footerClass}`.trim() },
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
        a: { class: 'bw_row bw_g_0' },
        c: cardContent
      },
      o: {
        type: 'card',
        state: props.state || {},
        slots: {
          title: '.bw_card_title',
          content: '.bw_card_body',
          footer: '.bw_card_footer'
        }
      }
    };
  }

  return {
    t: 'div',
    a: { class: cardClasses, style },
    c: cardContent,
    o: {
      type: 'card',
      state: props.state || {},
      slots: {
        title: '.bw_card_title',
        content: '.bw_card_body',
        footer: '.bw_card_footer'
      }
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
 * // String shorthand:
 * const ok = makeButton("OK");
 */
function makeButton(props = {}) {
  if (typeof props === 'string') props = { text: props };
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
        'bw_btn',
        variantClass(variant),
        size && `bw_btn_${size}`,
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
function makeContainer(props = {}) {
  const { fluid = false, children, className = '' } = props;

  return {
    t: 'div',
    a: { class: `bw_container${fluid ? '-fluid' : ''} ${className}`.trim() },
    c: children
  };
}

/**
 * Create a flexbox row for the grid system
 *
 * @param {Object} [props] - Row configuration
 * @param {Array|Object|string} [props.children] - Child columns
 * @param {string} [props.className] - Additional CSS classes
 * @param {number} [props.gap] - Gap size (1-5) applied via bw_g_{gap} class
 * @returns {Object} TACO object representing a grid row
 * @category Component Builders
 * @example
 * const row = makeRow({
 *   gap: 4,
 *   children: [makeCol({ size: 6, content: "Left" }), makeCol({ size: 6, content: "Right" })]
 * });
 */
function makeRow(props = {}) {
  const { children, className = '', gap } = props;

  return {
    t: 'div',
    a: {
      class: `bw_row ${gap ? `bw_g_${gap}` : ''} ${className}`.trim()
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
function makeCol(props = {}) {
  const { size, offset, push, pull, content, children, className = '' } = props;

  const classes = [];

  if (typeof size === 'object') {
    // Responsive sizes
    Object.entries(size).forEach(([breakpoint, value]) => {
      if (breakpoint === 'xs') {
        classes.push(`bw_col_${value}`);
      } else {
        classes.push(`bw_col_${breakpoint}_${value}`);
      }
    });
  } else if (size) {
    classes.push(`bw_col_${size}`);
  } else {
    classes.push('bw_col');
  }

  if (offset) classes.push(`bw_offset_${offset}`);
  if (push) classes.push(`bw_push_${push}`);
  if (pull) classes.push(`bw_pull_${pull}`);

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
function makeNav(props = {}) {
  const {
    items = [],
    pills = false,
    vertical = false,
    className = ''
  } = props;

  return {
    t: 'ul',
    a: {
      class: `bw_nav ${pills ? 'bw_nav_pills' : 'bw_nav_tabs'} ${vertical ? 'bw_nav_vertical' : ''} ${className}`.trim()
    },
    c: items.map(item => ({
      t: 'li',
      a: { class: 'bw_nav_item' },
      c: {
        t: 'a',
        a: {
          href: item.href || '#',
          class: `bw_nav_link ${item.active ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`.trim()
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
function makeNavbar(props = {}) {
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
      class: `bw_navbar ${dark ? 'bw_navbar_dark' : 'bw_navbar_light'} ${className}`.trim()
    },
    c: {
      t: 'div',
      a: { class: 'bw_container' },
      c: [
        brand && {
          t: 'a',
          a: { href: brandHref, class: 'bw_navbar_brand' },
          c: brand
        },
        items.length > 0 && {
          t: 'div',
          a: { class: 'bw_navbar_nav' },
          c: items.map(item => ({
            t: 'a',
            a: {
              href: item.href || '#',
              class: `bw_nav_link ${item.active ? 'active' : ''}`
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
function makeTabs(props = {}) {
  const { tabs = [], activeIndex = 0 } = props;

  // Find the active tab index based on the active property or use activeIndex
  let actualActiveIndex = activeIndex;
  tabs.forEach((tab, index) => {
    if (tab.active) {
      actualActiveIndex = index;
    }
  });

  // Shared tab switching logic
  function switchTab(el, index) {
    var allTabs = el.querySelectorAll('.bw_nav_link');
    var allPanes = el.querySelectorAll('.bw_tab_pane');
    if (index < 0 || index >= allTabs.length) return;
    allTabs.forEach(function(t) {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });
    allPanes.forEach(function(p) { p.classList.remove('active'); });
    allTabs[index].classList.add('active');
    allTabs[index].setAttribute('aria-selected', 'true');
    allTabs[index].setAttribute('tabindex', '0');
    allPanes[index].classList.add('active');
    if (el._bw_state) el._bw_state.activeIndex = index;
  }

  return {
    t: 'div',
    a: { class: 'bw_tabs' },
    c: [
      {
        t: 'ul',
        a: { class: 'bw_nav bw_nav_tabs', role: 'tablist' },
        c: tabs.map((tab, index) => ({
          t: 'li',
          a: { class: 'bw_nav_item', role: 'presentation' },
          c: {
            t: 'button',
            a: {
              class: `bw_nav_link ${index === actualActiveIndex ? 'active' : ''}`,
              type: 'button',
              role: 'tab',
              tabindex: index === actualActiveIndex ? '0' : '-1',
              'aria-selected': index === actualActiveIndex ? 'true' : 'false',
              onclick: (e) => {
                switchTab(e.target.closest('.bw_tabs'), index);
              }
            },
            c: tab.label
          }
        }))
      },
      {
        t: 'div',
        a: { class: 'bw_tab_content' },
        c: tabs.map((tab, index) => ({
          t: 'div',
          a: {
            class: `bw_tab_pane ${index === actualActiveIndex ? 'active' : ''}`,
            role: 'tabpanel'
          },
          c: tab.content
        }))
      }
    ],
    o: {
      type: 'tabs',
      state: { activeIndex: actualActiveIndex },
      handle: {
        setActiveTab: switchTab,
        getActiveTab: function(el) { return (el._bw_state && el._bw_state.activeIndex) || 0; }
      },
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
 * // String shorthand:
 * const msg = makeAlert("Something happened");
 */
function makeAlert(props = {}) {
  if (typeof props === 'string') props = { content: props };
  const {
    content,
    variant = 'info',
    dismissible = false,
    className = ''
  } = props;

  return {
    t: 'div',
    a: {
      class: `bw_alert ${variantClass(variant)} ${dismissible ? 'bw_alert_dismissible' : ''} ${className}`.trim(),
      role: 'alert'
    },
    c: [
      content,
      dismissible && {
        t: 'button',
        a: {
          type: 'button',
          class: 'bw_close',
          'aria-label': 'Close',
          onclick: function(e) {
            var alert = e.target.closest('.bw_alert');
            if (alert) { alert.remove(); }
          }
        },
        c: '×'
      }
    ].filter(Boolean),
    o: {
      type: 'alert',
      handle: {
        dismiss: function(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }
      }
    }
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
 * // String shorthand:
 * const tag = makeBadge("New");
 */
function makeBadge(props = {}) {
  if (typeof props === 'string') props = { text: props };
  const {
    text,
    variant = 'primary',
    size,
    pill = false,
    className = ''
  } = props;

  const sizeClass = size === 'sm' ? ' bw_badge_sm' : size === 'lg' ? ' bw_badge_lg' : '';

  return {
    t: 'span',
    a: {
      class: `bw_badge ${variantClass(variant)}${sizeClass} ${pill ? 'bw_badge_pill' : ''} ${className}`.trim()
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
function makeProgress(props = {}) {
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
      class: 'bw_progress',
      style: height ? { height: `${height}px` } : undefined
    },
    c: {
      t: 'div',
      a: {
        class: [
          'bw_progress_bar',
          variantClass(variant),
          striped && 'bw_progress_bar_striped',
          animated && 'bw_progress_bar_animated'
        ].filter(Boolean).join(' '),
        role: 'progressbar',
        style: { width: `${percentage}%` },
        'aria-valuenow': value,
        'aria-valuemin': 0,
        'aria-valuemax': max
      },
      c: label || `${percentage}%`
    },
    o: {
      type: 'progress',
      handle: {
        setValue: function(el, n) {
          var bar = el.querySelector('.bw_progress_bar');
          if (!bar) return;
          var maxVal = parseInt(bar.getAttribute('aria-valuemax')) || 100;
          var pct = Math.round((n / maxVal) * 100);
          bar.style.width = pct + '%';
          bar.setAttribute('aria-valuenow', n);
          bar.textContent = pct + '%';
        },
        getValue: function(el) {
          var bar = el.querySelector('.bw_progress_bar');
          return bar ? parseInt(bar.getAttribute('aria-valuenow')) || 0 : 0;
        }
      }
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
function makeListGroup(props = {}) {
  const { items = [], flush = false, interactive = false } = props;

  return {
    t: 'div',
    a: { class: `bw_list_group ${flush ? 'bw_list_group_flush' : ''}`.trim() },
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
              'bw_list_group_item',
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
            'bw_list_group_item',
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
function makeBreadcrumb(props = {}) {
  const { items = [] } = props;

  return {
    t: 'nav',
    a: { 'aria-label': 'breadcrumb' },
    c: {
      t: 'ol',
      a: { class: 'bw_breadcrumb' },
      c: items.map((item, index) => ({
        t: 'li',
        a: {
          class: `bw_breadcrumb_item ${item.active ? 'active' : ''}`,
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
function makeForm(props = {}) {
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
 * Create a form group with label, input, optional help text and validation feedback
 *
 * @param {Object} [props] - Form group configuration
 * @param {string} [props.label] - Label text
 * @param {Object} [props.input] - Input TACO object (from makeInput, makeSelect, etc.)
 * @param {string} [props.help] - Help text displayed below the input
 * @param {string} [props.id] - Input ID (links label to input via for/id)
 * @param {string} [props.validation] - Validation state ("valid" or "invalid")
 * @param {string} [props.feedback] - Validation feedback text shown below input
 * @param {boolean} [props.required=false] - Show required indicator (*) on label
 * @returns {Object} TACO object representing a form group
 * @category Component Builders
 * @example
 * const group = makeFormGroup({
 *   label: "Email",
 *   id: "email",
 *   input: makeInput({ type: "email", id: "email", placeholder: "you@example.com" }),
 *   validation: "invalid",
 *   feedback: "Please enter a valid email address."
 * });
 */
function makeFormGroup(props = {}) {
  var { label, input, help, id, validation, feedback, required } = props;

  // Shallow-clone input TACO to add validation class without mutating original
  var styledInput = input;
  if (validation && input && input.a) {
    styledInput = { t: input.t, a: Object.assign({}, input.a), c: input.c, o: input.o };
    var validClass = validation === 'valid' ? 'bw_is_valid' : validation === 'invalid' ? 'bw_is_invalid' : '';
    if (validClass) {
      styledInput.a.class = ((styledInput.a.class || '') + ' ' + validClass).trim();
    }
  }

  return {
    t: 'div',
    a: { class: 'bw_form_group' },
    c: [
      label && {
        t: 'label',
        a: { for: id, class: 'bw_form_label' },
        c: required ? [label, { t: 'span', a: { class: 'bw_text_danger bw_ms_1' }, c: '*' }] : label
      },
      styledInput,
      feedback && validation && {
        t: 'div',
        a: { class: validation === 'valid' ? 'bw_valid_feedback' : 'bw_invalid_feedback' },
        c: feedback
      },
      help && {
        t: 'small',
        a: { class: 'bw_form_text bw_text_muted' },
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
function makeInput(props = {}) {
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
      class: `bw_form_control ${className}`.trim(),
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
function makeTextarea(props = {}) {
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
      class: `bw_form_control ${className}`.trim(),
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
function makeSelect(props = {}) {
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
      class: `bw_form_control ${className}`.trim(),
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
function makeCheckbox(props = {}) {
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
    a: { class: `bw_form_check ${className}`.trim() },
    c: [
      {
        t: 'input',
        a: {
          type: 'checkbox',
          class: 'bw_form_check_input',
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
        a: { class: 'bw_form_check_label', for: id },
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
function makeStack(props = {}) {
  const {
    children,
    direction = 'vertical',
    gap = 3,
    className = ''
  } = props;

  return {
    t: 'div',
    a: {
      class: `bw_${direction === 'vertical' ? 'vstack' : 'hstack'} bw_gap_${gap} ${className}`.trim()
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
function makeSpinner(props = {}) {
  const {
    variant = 'primary',
    size = 'md',
    type = 'border'
  } = props;

  return {
    t: 'div',
    a: {
      class: `bw_spinner_${type} bw_spinner_${type}-${size} ${variantClass(variant)}`,
      role: 'status'
    },
    c: {
      t: 'span',
      a: { class: 'bw_visually_hidden' },
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
function makeHero(props = {}) {
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
    sm: 'bw_py_3',
    md: 'bw_py_4',
    lg: 'bw_py_5',
    xl: 'bw_py_6'
  };

  return {
    t: 'section',
    a: {
      class: `bw_hero ${variantClass(variant)} ${sizeClasses[size] || sizeClasses.lg} ${centered ? 'bw_text_center' : ''} ${className}`.trim(),
      style: backgroundImage ? `background-image: url('${backgroundImage}'); background-size: cover; background-position: center;` : undefined
    },
    c: [
      overlay && {
        t: 'div',
        a: { class: 'bw_hero_overlay' }
      },
      {
        t: 'div',
        a: { class: 'bw_container' },
        c: {
          t: 'div',
          a: { class: 'bw_hero_content' },
          c: [
            title && {
              t: 'h1',
              a: { class: 'bw_hero_title bw_display_4 bw_mb_3' },
              c: title
            },
            subtitle && {
              t: 'p',
              a: { class: 'bw_hero_subtitle bw_lead bw_mb_4' },
              c: subtitle
            },
            content,
            actions && {
              t: 'div',
              a: { class: 'bw_hero_actions bw_mt_4' },
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
function makeFeatureGrid(props = {}) {
  const {
    features = [],
    columns = 3,
    centered = true,
    iconSize = '3rem',
    className = ''
  } = props;

  const colClass = `bw_col_md_${12/columns}`;

  return {
    t: 'div',
    a: { class: `bw_feature_grid ${className}`.trim() },
    c: {
      t: 'div',
      a: { class: 'bw_row bw_g_4' },
      c: features.map(feature => ({
        t: 'div',
        a: { class: colClass },
        c: {
          t: 'div',
          a: { class: `bw_feature ${centered ? 'bw_text_center' : ''}` },
          c: [
            feature.icon && {
              t: 'div',
              a: {
                class: 'bw_feature_icon bw_mb_3 bw_text_primary',
                style: `font-size: ${iconSize};`
              },
              c: feature.icon
            },
            feature.title && {
              t: 'h3',
              a: { class: 'bw_feature_title bw_h5 bw_mb_2' },
              c: feature.title
            },
            feature.description && {
              t: 'p',
              a: { class: 'bw_feature_description bw_text_muted' },
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
function makeCTA(props = {}) {
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
    a: { class: `bw_cta bw_bg_${variant} bw_py_5 ${className}`.trim() },
    c: {
      t: 'div',
      a: { class: 'bw_container' },
      c: {
        t: 'div',
        a: { class: `bw_cta_content ${centered ? 'bw_text_center' : ''}` },
        c: [
          title && { t: 'h2', a: { class: 'bw_cta_title bw_mb_3' }, c: title },
          description && { t: 'p', a: { class: 'bw_cta_description bw_lead bw_mb_4' }, c: description },
          actions && {
            t: 'div',
            a: { class: 'bw_cta_actions' },
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
function makeSection(props = {}) {
  const {
    title,
    subtitle,
    content,
    variant = 'default',
    spacing = 'md',
    className = ''
  } = props;

  const spacingClasses = {
    sm: 'bw_py_3',
    md: 'bw_py_4',
    lg: 'bw_py_5',
    xl: 'bw_py_6'
  };

  return {
    t: 'section',
    a: {
      class: `bw_section ${spacingClasses[spacing] || spacingClasses.md} ${variant !== 'default' ? `bw_bg_${variant}` : ''} ${className}`.trim()
    },
    c: {
      t: 'div',
      a: { class: 'bw_container' },
      c: [
        (title || subtitle) && {
          t: 'div',
          a: { class: 'bw_section_header bw_text_center bw_mb_5' },
          c: [
            title && { t: 'h2', a: { class: 'bw_section_title' }, c: title },
            subtitle && { t: 'p', a: { class: 'bw_section_subtitle bw_text_muted' }, c: subtitle }
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

// Handle classes (CardHandle, TableHandle, NavbarHandle, TabsHandle)
// removed in v2.0.15 — superseded by ComponentHandle.
// See dev/dead-code-elimination-v2.0.15.md for recovery.

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
function makeCodeDemo(props = {}) {
  const {
    title,
    description,
    code,
    result,
    language = 'javascript'
  } = props;

  // Generate unique ID for this demo
  `demo-${Math.random().toString(36).substr(2, 9)}`;

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
              class: 'bw_copy_btn bw_code_copy_btn',
              onclick: function(e) {
                navigator.clipboard.writeText(code).then(function() {
                  var btn = e.target;
                  var originalText = btn.textContent;
                  btn.textContent = 'Copied!';
                  btn.classList.add('bw_code_copy_btn_copied');
                  setTimeout(function() {
                    btn.textContent = originalText;
                    btn.classList.remove('bw_code_copy_btn_copied');
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
                a: { class: 'bw_code_pre' },
                c: {
                  t: 'code',
                  a: { class: `bw_code_block language-${language}` },
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
      a: { class: 'bw_text_muted bw_mb_3' },
      c: description
    },
    makeTabs({ tabs})
  ].filter(Boolean);

  return {
    t: 'div',
    a: { class: 'bw_code_demo' },
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
function makePagination(props = {}) {
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
    a: { class: `bw_page_item ${currentPage <= 1 ? 'bw_disabled' : ''}`.trim() },
    c: {
      t: 'button',
      a: { class: 'bw_page_link', type: 'button', onclick: handleClick(currentPage - 1), 'aria-label': 'Previous', disabled: currentPage <= 1 ? true : undefined },
      c: '\u2039'
    }
  });

  // Page numbers
  for (var i = 1; i <= pages; i++) {
    (function(pageNum) {
      items.push({
        t: 'li',
        a: { class: `bw_page_item ${pageNum === currentPage ? 'bw_active' : ''}`.trim() },
        c: {
          t: 'button',
          a: { class: 'bw_page_link', type: 'button', onclick: handleClick(pageNum), 'aria-current': pageNum === currentPage ? 'page' : undefined },
          c: '' + pageNum
        }
      });
    })(i);
  }

  // Next arrow
  items.push({
    t: 'li',
    a: { class: `bw_page_item ${currentPage >= pages ? 'bw_disabled' : ''}`.trim() },
    c: {
      t: 'button',
      a: { class: 'bw_page_link', type: 'button', onclick: handleClick(currentPage + 1), 'aria-label': 'Next', disabled: currentPage >= pages ? true : undefined },
      c: '\u203A'
    }
  });

  return {
    t: 'nav',
    a: { 'aria-label': 'Pagination' },
    c: {
      t: 'ul',
      a: {
        class: `bw_pagination ${size ? 'bw_pagination_' + size : ''} ${className}`.trim()
      },
      c: items
    },
    o: {
      type: 'pagination',
      state: { currentPage: currentPage, pages: pages },
      handle: {
        setPage: function(el, n) {
          if (n < 1 || n > pages) return;
          var allItems = el.querySelectorAll('.bw_page_item');
          for (var i = 0; i < allItems.length; i++) {
            allItems[i].classList.remove('bw_active');
          }
          // +1 offset: first item is prev arrow
          if (allItems[n]) allItems[n].classList.add('bw_active');
          if (el._bw_state) el._bw_state.currentPage = n;
          if (onPageChange) onPageChange(n);
        },
        getPage: function(el) {
          return (el._bw_state && el._bw_state.currentPage) || 1;
        }
      }
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
function makeRadio(props = {}) {
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
    a: { class: `bw_form_check ${className}`.trim() },
    c: [
      {
        t: 'input',
        a: {
          type: 'radio',
          class: 'bw_form_check_input',
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
        a: { class: 'bw_form_check_label', for: id },
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
function makeButtonGroup(props = {}) {
  const {
    children,
    size,
    vertical = false,
    className = ''
  } = props;

  return {
    t: 'div',
    a: {
      class: `${vertical ? 'bw_btn_group_vertical' : 'bw_btn_group'} ${size ? 'bw_btn_group_' + size : ''} ${className}`.trim(),
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
function makeAccordion(props = {}) {
  const {
    items = [],
    multiOpen = false,
    className = ''
  } = props;

  return {
    t: 'div',
    a: { class: `bw_accordion ${className}`.trim() },
    c: items.map(function(item, index) {
      return {
        t: 'div',
        a: { class: 'bw_accordion_item' },
        c: [
          {
            t: 'h2',
            a: { class: 'bw_accordion_header' },
            c: {
              t: 'button',
              a: {
                class: `bw_accordion_button ${item.open ? '' : 'bw_collapsed'}`.trim(),
                type: 'button',
                'aria-expanded': item.open ? 'true' : 'false',
                onclick: function(e) {
                  var btn = e.target.closest('.bw_accordion_button');
                  var accordionEl = btn.closest('.bw_accordion');
                  var accordionItem = btn.closest('.bw_accordion_item');
                  var collapse = accordionItem.querySelector('.bw_accordion_collapse');
                  var isOpen = collapse.classList.contains('bw_collapse_show');

                  if (!multiOpen) {
                    // Animate-close all other open siblings
                    var allItems = accordionEl.querySelectorAll('.bw_accordion_item');
                    for (var j = 0; j < allItems.length; j++) {
                      if (allItems[j] === accordionItem) continue;
                      var sibCollapse = allItems[j].querySelector('.bw_accordion_collapse');
                      var sibBtn = allItems[j].querySelector('.bw_accordion_button');
                      if (sibCollapse.classList.contains('bw_collapse_show')) {
                        sibCollapse.style.maxHeight = sibCollapse.scrollHeight + 'px';
                        sibCollapse.offsetHeight; // force reflow
                        sibCollapse.style.maxHeight = '0px';
                        sibCollapse.classList.remove('bw_collapse_show');
                        sibBtn.classList.add('bw_collapsed');
                        sibBtn.setAttribute('aria-expanded', 'false');
                      }
                    }
                  }

                  if (isOpen) {
                    // Animate close
                    collapse.style.maxHeight = collapse.scrollHeight + 'px';
                    collapse.offsetHeight; // force reflow
                    collapse.style.maxHeight = '0px';
                    collapse.classList.remove('bw_collapse_show');
                    btn.classList.add('bw_collapsed');
                    btn.setAttribute('aria-expanded', 'false');
                  } else {
                    // Animate open
                    collapse.classList.add('bw_collapse_show');
                    collapse.style.maxHeight = '0px';
                    collapse.offsetHeight; // force reflow
                    collapse.style.maxHeight = collapse.scrollHeight + 'px';
                    btn.classList.remove('bw_collapsed');
                    btn.setAttribute('aria-expanded', 'true');
                    // After transition, allow dynamic content sizing
                    var onEnd = function(ev) {
                      if (ev.propertyName === 'max-height' && collapse.classList.contains('bw_collapse_show')) {
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
            a: { class: `bw_accordion_collapse ${item.open ? 'bw_collapse_show' : ''}`.trim() },
            c: {
              t: 'div',
              a: { class: 'bw_accordion_body' },
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
      state: { multiOpen: multiOpen },
      handle: {
        toggle: function(el, index) {
          var items = el.querySelectorAll('.bw_accordion_item');
          if (index < 0 || index >= items.length) return;
          var btn = items[index].querySelector('.bw_accordion_button');
          if (btn) btn.click();
        },
        openAll: function(el) {
          var items = el.querySelectorAll('.bw_accordion_item');
          for (var i = 0; i < items.length; i++) {
            var collapse = items[i].querySelector('.bw_accordion_collapse');
            var btn = items[i].querySelector('.bw_accordion_button');
            if (!collapse.classList.contains('bw_collapse_show')) {
              collapse.classList.add('bw_collapse_show');
              collapse.style.maxHeight = 'none';
              btn.classList.remove('bw_collapsed');
              btn.setAttribute('aria-expanded', 'true');
            }
          }
        },
        closeAll: function(el) {
          var items = el.querySelectorAll('.bw_accordion_item');
          for (var i = 0; i < items.length; i++) {
            var collapse = items[i].querySelector('.bw_accordion_collapse');
            var btn = items[i].querySelector('.bw_accordion_button');
            if (collapse.classList.contains('bw_collapse_show')) {
              collapse.style.maxHeight = collapse.scrollHeight + 'px';
              collapse.offsetHeight;
              collapse.style.maxHeight = '0px';
              collapse.classList.remove('bw_collapse_show');
              btn.classList.add('bw_collapsed');
              btn.setAttribute('aria-expanded', 'false');
            }
          }
        }
      }
    }
  };
}

// ModalHandle removed in v2.0.15 — superseded by ComponentHandle.
// See dev/dead-code-elimination-v2.0.15.md for recovery.

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
function makeModal(props = {}) {
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
    var backdrop = el.closest('.bw_modal');
    if (backdrop) {
      backdrop.classList.remove('bw_modal_show');
      document.body.style.overflow = '';
    }
    if (onClose) onClose();
  }

  return {
    t: 'div',
    a: { class: `bw_modal ${className}`.trim() },
    c: {
      t: 'div',
      a: { class: `bw_modal_dialog ${size ? 'bw_modal_' + size : ''}`.trim() },
      c: {
        t: 'div',
        a: { class: 'bw_modal_content' },
        c: [
          (title || closeButton) && {
            t: 'div',
            a: { class: 'bw_modal_header' },
            c: [
              title && { t: 'h5', a: { class: 'bw_modal_title' }, c: title },
              closeButton && {
                t: 'button',
                a: {
                  type: 'button',
                  class: 'bw_close',
                  'aria-label': 'Close',
                  onclick: function(e) { closeModal(e.target); }
                },
                c: '\u00D7'
              }
            ].filter(Boolean)
          },
          content && {
            t: 'div',
            a: { class: 'bw_modal_body' },
            c: content
          },
          footer && {
            t: 'div',
            a: { class: 'bw_modal_footer' },
            c: footer
          }
        ].filter(Boolean)
      }
    },
    o: {
      type: 'modal',
      handle: {
        open: function(el) {
          el.classList.add('bw_modal_show');
          el.style.display = 'flex';
          document.body.style.overflow = 'hidden';
        },
        close: function(el) { closeModal(el); }
      },
      mounted: function(el) {
        // Click backdrop to close
        el.addEventListener('click', function(e) {
          if (e.target === el) closeModal(el);
        });
        // Escape key to close
        var escHandler = function(e) {
          if (e.key === 'Escape' && el.classList.contains('bw_modal_show')) {
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
function makeToast(props = {}) {
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
      class: `bw_toast ${variantClass(variant)} bw_toast_${position.replace(/-/g, '_')} ${className}`.trim(),
      role: 'alert'
    },
    c: [
      (title) && {
        t: 'div',
        a: { class: 'bw_toast_header' },
        c: [
          { t: 'strong', c: title },
          {
            t: 'button',
            a: {
              type: 'button',
              class: 'bw_close',
              'aria-label': 'Close',
              onclick: function(e) {
                var toast = e.target.closest('.bw_toast');
                if (toast) {
                  toast.classList.add('bw_toast_hiding');
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
        a: { class: 'bw_toast_body' },
        c: content
      }
    ].filter(Boolean),
    o: {
      type: 'toast',
      handle: {
        dismiss: function(el) {
          el.classList.add('bw_toast_hiding');
          setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
        }
      },
      mounted: function(el) {
        // Trigger show animation
        requestAnimationFrame(function() {
          el.classList.add('bw_toast_show');
        });
        // Auto-dismiss
        if (autoDismiss) {
          setTimeout(function() {
            el.classList.add('bw_toast_hiding');
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
function makeDropdown(props = {}) {
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
        class: `bw_btn ${variantClass(variant)} bw_dropdown_toggle`,
        type: 'button',
        onclick: function(e) {
          var dropdown = e.target.closest('.bw_dropdown');
          var menu = dropdown.querySelector('.bw_dropdown_menu');
          menu.classList.toggle('bw_dropdown_show');
        }
      },
      c: trigger || 'Dropdown'
    };
  } else {
    triggerTaco = trigger;
  }

  return {
    t: 'div',
    a: { class: `bw_dropdown ${className}`.trim() },
    c: [
      triggerTaco,
      {
        t: 'div',
        a: { class: `bw_dropdown_menu ${align === 'end' ? 'bw_dropdown_menu_end' : ''}`.trim() },
        c: items.map(function(item) {
          if (item.divider) {
            return { t: 'hr', a: { class: 'bw_dropdown_divider' } };
          }
          return {
            t: 'a',
            a: {
              class: `bw_dropdown_item ${item.disabled ? 'disabled' : ''}`.trim(),
              href: item.href || '#',
              onclick: item.disabled ? undefined : function(e) {
                if (!item.href) e.preventDefault();
                var dropdown = e.target.closest('.bw_dropdown');
                var menu = dropdown.querySelector('.bw_dropdown_menu');
                menu.classList.remove('bw_dropdown_show');
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
            var menu = el.querySelector('.bw_dropdown_menu');
            if (menu) menu.classList.remove('bw_dropdown_show');
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
function makeSwitch(props = {}) {
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
    a: { class: `bw_form_check bw_form_switch ${className}`.trim() },
    c: [
      {
        t: 'input',
        a: {
          type: 'checkbox',
          class: 'bw_form_check_input bw_switch_input',
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
        a: { class: 'bw_form_check_label', for: id },
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
function makeSkeleton(props = {}) {
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
        class: `bw_skeleton bw_skeleton_circle ${className}`.trim(),
        style: { width: circleSize, height: circleSize }
      }
    };
  }

  if (variant === 'rect') {
    return {
      t: 'div',
      a: {
        class: `bw_skeleton bw_skeleton_rect ${className}`.trim(),
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
        class: `bw_skeleton bw_skeleton_text ${className}`.trim(),
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
        class: 'bw_skeleton bw_skeleton_text',
        style: {
          width: i === count - 1 ? '75%' : (width || '100%'),
          height: height || '1em'
        }
      }
    });
  }

  return {
    t: 'div',
    a: { class: `bw_skeleton_group ${className}`.trim() },
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
function makeAvatar(props = {}) {
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
        class: `bw_avatar bw_avatar_${size} ${className}`.trim(),
        src: src,
        alt: alt
      }
    };
  }

  return {
    t: 'div',
    a: {
      class: `bw_avatar bw_avatar_${size} ${variantClass(variant)} ${className}`.trim()
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
function makeCarousel(props = {}) {
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
    var total = carouselEl.querySelectorAll('.bw_carousel_slide').length;
    if (index < 0) index = total - 1;
    if (index >= total) index = 0;
    carouselEl._bw_carouselIndex = index;
    var track = carouselEl.querySelector('.bw_carousel_track');
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    // Update indicators
    var indicators = carouselEl.querySelectorAll('.bw_carousel_indicator');
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
        a: { class: 'bw_carousel_caption' },
        c: item.caption
      }
    ].filter(Boolean);

    return {
      t: 'div',
      a: { class: 'bw_carousel_slide' },
      c: slideContent.length === 1 ? slideContent[0] : slideContent
    };
  });

  var children = [
    // Track
    {
      t: 'div',
      a: {
        class: 'bw_carousel_track',
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
        class: 'bw_carousel_control bw_carousel_control_prev',
        type: 'button',
        'aria-label': 'Previous slide',
        onclick: function(e) {
          var carousel = e.target.closest('.bw_carousel');
          var idx = carousel._bw_carouselIndex || 0;
          goToSlide(carousel, idx - 1);
        }
      },
      c: { t: 'img', a: { src: prevArrow, alt: '', role: 'presentation' } }
    });
    children.push({
      t: 'button',
      a: {
        class: 'bw_carousel_control bw_carousel_control_next',
        type: 'button',
        'aria-label': 'Next slide',
        onclick: function(e) {
          var carousel = e.target.closest('.bw_carousel');
          var idx = carousel._bw_carouselIndex || 0;
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
      a: { class: 'bw_carousel_indicators' },
      c: items.map(function(_, i) {
        return {
          t: 'button',
          a: {
            class: 'bw_carousel_indicator' + (i === startIndex ? ' active' : ''),
            type: 'button',
            'aria-label': 'Go to slide ' + (i + 1),
            onclick: function(e) {
              var carousel = e.target.closest('.bw_carousel');
              goToSlide(carousel, i);
            }
          }
        };
      })
    });
  }

  return {
    t: 'div',
    a: {
      class: ('bw_carousel ' + className).trim(),
      style: 'height: ' + height,
      tabindex: '0',
      'aria-roledescription': 'carousel'
    },
    c: children,
    o: {
      type: 'carousel',
      state: { activeIndex: startIndex, autoPlay: autoPlay, interval: interval },
      handle: {
        goToSlide: function(el, index) { goToSlide(el, index); },
        next: function(el) { goToSlide(el, (el._bw_carouselIndex || 0) + 1); },
        prev: function(el) { goToSlide(el, (el._bw_carouselIndex || 0) - 1); },
        getActiveIndex: function(el) { return el._bw_carouselIndex || 0; },
        pause: function(el) {
          if (el._bw_carouselInterval) {
            clearInterval(el._bw_carouselInterval);
            el._bw_carouselInterval = null;
          }
        },
        play: function(el) {
          if (!el._bw_carouselInterval && el._bw_state) {
            var ms = el._bw_state.interval || 5000;
            el._bw_carouselInterval = setInterval(function() {
              goToSlide(el, (el._bw_carouselIndex || 0) + 1);
            }, ms);
          }
        }
      },
      mounted: function(el) {
        el._bw_carouselIndex = startIndex;
        // Keyboard navigation
        el.addEventListener('keydown', function(e) {
          var idx = el._bw_carouselIndex || 0;
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
            var idx = el._bw_carouselIndex || 0;
            goToSlide(el, idx + 1);
          }, interval);
          el._bw_carouselInterval = intervalId;
          // Pause on hover/focus for usability
          el.addEventListener('mouseenter', function() {
            if (el._bw_carouselInterval) clearInterval(el._bw_carouselInterval);
          });
          el.addEventListener('mouseleave', function() {
            el._bw_carouselInterval = setInterval(function() {
              var idx = el._bw_carouselIndex || 0;
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

// =========================================================================
// Phase 4: Dashboard & Data Display
// =========================================================================

/**
 * Create a stat card for dashboard metrics display
 *
 * Shows a large value with a label and optional change indicator.
 * Designed for dashboard grid layouts with left-border accent.
 *
 * @param {Object|string} [props] - Stat card configuration (string shorthand sets label)
 * @param {string|number} [props.value=0] - The main stat value to display
 * @param {string} [props.label] - Descriptive label below the value
 * @param {number} [props.change] - Percentage change indicator (positive = green arrow, negative = red)
 * @param {string} [props.format] - Value format ("number", "currency", "percent")
 * @param {string} [props.prefix] - Custom prefix (e.g. "$")
 * @param {string} [props.suffix] - Custom suffix (e.g. "%")
 * @param {string} [props.icon] - Icon content (emoji or text) shown above value
 * @param {string} [props.variant] - Left-border color variant ("primary", "success", "danger", etc.)
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Inline style object
 * @returns {Object} TACO object representing a stat card
 * @category Component Builders
 * @example
 * const stat = makeStatCard({
 *   value: 2345,
 *   label: 'Active Users',
 *   change: 5.3,
 *   format: 'number',
 *   variant: 'primary'
 * });
 */
function makeStatCard(props = {}) {
  if (typeof props === 'string') props = { label: props };
  var {
    value = 0,
    label,
    change,
    format,
    prefix,
    suffix,
    icon,
    variant,
    className = '',
    style
  } = props;

  function formatValue(val, fmt) {
    if (prefix || suffix) return (prefix || '') + val + (suffix || '');
    switch (fmt) {
      case 'currency': return '$' + Number(val).toLocaleString();
      case 'percent': return val + '%';
      case 'number': return Number(val).toLocaleString();
      default: return '' + val;
    }
  }

  var classes = [
    'bw_stat_card',
    variantClass(variant),
    className
  ].filter(Boolean).join(' ').trim();

  var children = [];

  if (icon) {
    children.push({
      t: 'div',
      a: { class: 'bw_stat_icon' },
      c: icon
    });
  }

  children.push({
    t: 'div',
    a: { class: 'bw_stat_value' },
    c: formatValue(value, format)
  });

  if (label) {
    children.push({
      t: 'div',
      a: { class: 'bw_stat_label' },
      c: label
    });
  }

  if (change !== undefined && change !== null) {
    children.push({
      t: 'div',
      a: {
        class: 'bw_stat_change ' + (change >= 0 ? 'bw_stat_change_up' : 'bw_stat_change_down')
      },
      c: (change >= 0 ? '\u2191 +' : '\u2193 ') + change + '%'
    });
  }

  return {
    t: 'div',
    a: { class: classes, style: style },
    c: children,
    o: {
      type: 'stat-card',
      slots: {
        value: '.bw_stat_value',
        label: '.bw_stat_label'
      }
    }
  };
}

// =========================================================================
// Phase 5: Overlays & Popovers
// =========================================================================

/**
 * Create a tooltip wrapper around trigger content
 *
 * Wraps the trigger element in a container that shows tooltip text
 * on hover and focus. Pure CSS-driven show/hide with JS lifecycle
 * for event binding.
 *
 * @param {Object} [props] - Tooltip configuration
 * @param {string|Object|Array} [props.content] - Trigger content (what the user hovers/focuses)
 * @param {string} [props.text=""] - Tooltip text to display
 * @param {string} [props.placement="top"] - Tooltip placement ("top", "bottom", "left", "right")
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a tooltip wrapper
 * @category Component Builders
 * @example
 * const tip = makeTooltip({
 *   content: makeButton({ text: 'Hover me' }),
 *   text: 'This is a tooltip!',
 *   placement: 'top'
 * });
 */
function makeTooltip(props = {}) {
  var {
    content,
    text = '',
    placement = 'top',
    className = ''
  } = props;

  return {
    t: 'span',
    a: { class: ('bw_tooltip_wrapper ' + className).trim() },
    c: [
      content,
      {
        t: 'span',
        a: {
          class: 'bw_tooltip bw_tooltip_' + placement,
          role: 'tooltip'
        },
        c: text
      }
    ],
    o: {
      type: 'tooltip',
      mounted: function(el) {
        var tip = el.querySelector('.bw_tooltip');
        el.addEventListener('mouseenter', function() {
          tip.classList.add('bw_tooltip_show');
        });
        el.addEventListener('mouseleave', function() {
          tip.classList.remove('bw_tooltip_show');
        });
        el.addEventListener('focusin', function() {
          tip.classList.add('bw_tooltip_show');
        });
        el.addEventListener('focusout', function() {
          tip.classList.remove('bw_tooltip_show');
        });
      }
    }
  };
}

/**
 * Create a popover wrapper around trigger content
 *
 * Like a tooltip but richer — supports title + body content and is
 * triggered by click rather than hover. Dismisses on click outside.
 *
 * @param {Object} [props] - Popover configuration
 * @param {string|Object|Array} [props.trigger] - Trigger content (what the user clicks)
 * @param {string} [props.title] - Popover header title
 * @param {string|Object|Array} [props.content] - Popover body content
 * @param {string} [props.placement="top"] - Placement ("top", "bottom", "left", "right")
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a popover wrapper
 * @category Component Builders
 * @example
 * const pop = makePopover({
 *   trigger: makeButton({ text: 'Click me' }),
 *   title: 'Popover Title',
 *   content: 'Some helpful information here.',
 *   placement: 'bottom'
 * });
 */
function makePopover(props = {}) {
  var {
    trigger,
    title,
    content,
    placement = 'top',
    className = ''
  } = props;

  var popoverContent = [
    title && {
      t: 'div',
      a: { class: 'bw_popover_header' },
      c: title
    },
    content && {
      t: 'div',
      a: { class: 'bw_popover_body' },
      c: content
    }
  ].filter(Boolean);

  return {
    t: 'span',
    a: { class: ('bw_popover_wrapper ' + className).trim() },
    c: [
      {
        t: 'span',
        a: {
          class: 'bw_popover_trigger',
          onclick: function(e) {
            var wrapper = e.target.closest('.bw_popover_wrapper');
            var pop = wrapper.querySelector('.bw_popover');
            pop.classList.toggle('bw_popover_show');
          }
        },
        c: trigger
      },
      {
        t: 'div',
        a: {
          class: 'bw_popover bw_popover_' + placement
        },
        c: popoverContent
      }
    ],
    o: {
      type: 'popover',
      mounted: function(el) {
        // Click outside to close
        var outsideHandler = function(e) {
          if (!el.contains(e.target)) {
            var pop = el.querySelector('.bw_popover');
            if (pop) pop.classList.remove('bw_popover_show');
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

// =========================================================================
// Phase 6: Form Enhancements & Layout
// =========================================================================

/**
 * Create a search input with clear button
 *
 * Wraps a text input with a clear (×) button that appears when
 * the field has content. Calls onSearch on Enter key.
 *
 * @param {Object} [props] - Search input configuration
 * @param {string} [props.placeholder="Search..."] - Placeholder text
 * @param {string} [props.value] - Initial value
 * @param {Function} [props.onSearch] - Callback when Enter is pressed, receives value
 * @param {Function} [props.onInput] - Callback on each keystroke, receives value
 * @param {string} [props.id] - Element ID
 * @param {string} [props.name] - Input name attribute
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a search input
 * @category Component Builders
 * @example
 * const search = makeSearchInput({
 *   placeholder: 'Search users...',
 *   onSearch: (val) => filterUsers(val)
 * });
 */
function makeSearchInput(props = {}) {
  if (typeof props === 'string') props = { placeholder: props };
  var {
    placeholder = 'Search...',
    value,
    onSearch,
    onInput,
    id,
    name,
    className = ''
  } = props;

  return {
    t: 'div',
    a: { class: ('bw_search_input ' + className).trim() },
    c: [
      {
        t: 'input',
        a: {
          type: 'search',
          class: 'bw_form_control bw_search_field',
          placeholder: placeholder,
          value: value,
          id: id,
          name: name,
          onkeydown: function(e) {
            if (e.key === 'Enter' && onSearch) {
              e.preventDefault();
              onSearch(e.target.value);
            }
          },
          oninput: function(e) {
            var wrapper = e.target.closest('.bw_search_input');
            var clearBtn = wrapper.querySelector('.bw_search_clear');
            if (clearBtn) {
              clearBtn.style.display = e.target.value ? 'flex' : 'none';
            }
            if (onInput) onInput(e.target.value);
          }
        }
      },
      {
        t: 'button',
        a: {
          type: 'button',
          class: 'bw_search_clear',
          'aria-label': 'Clear search',
          style: value ? undefined : 'display: none',
          onclick: function(e) {
            var wrapper = e.target.closest('.bw_search_input');
            var input = wrapper.querySelector('.bw_search_field');
            input.value = '';
            e.target.style.display = 'none';
            input.focus();
            if (onInput) onInput('');
            if (onSearch) onSearch('');
          }
        },
        c: '\u00D7'
      }
    ],
    o: { type: 'search-input' }
  };
}

/**
 * Create a styled range slider input
 *
 * @param {Object} [props] - Range configuration
 * @param {number} [props.min=0] - Minimum value
 * @param {number} [props.max=100] - Maximum value
 * @param {number} [props.step=1] - Step increment
 * @param {number} [props.value=50] - Current value
 * @param {string} [props.label] - Label text
 * @param {boolean} [props.showValue=false] - Show current value display
 * @param {string} [props.id] - Element ID
 * @param {string} [props.name] - Input name attribute
 * @param {boolean} [props.disabled=false] - Whether the slider is disabled
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a range input
 * @category Component Builders
 * @example
 * const slider = makeRange({
 *   min: 0, max: 100, value: 50,
 *   label: 'Volume',
 *   showValue: true,
 *   oninput: (e) => setVolume(e.target.value)
 * });
 */
function makeRange(props = {}) {
  var {
    min = 0,
    max = 100,
    step = 1,
    value = 50,
    label,
    showValue = false,
    id,
    name,
    disabled = false,
    className = '',
    ...eventHandlers
  } = props;

  var children = [];

  if (label || showValue) {
    var labelContent = [];
    if (label) {
      labelContent.push({
        t: 'span',
        c: label
      });
    }
    if (showValue) {
      labelContent.push({
        t: 'span',
        a: { class: 'bw_range_value' },
        c: '' + value
      });
    }
    children.push({
      t: 'div',
      a: { class: 'bw_range_label' },
      c: labelContent
    });
  }

  // Wrap oninput to update value display
  var userOnInput = eventHandlers.oninput;
  if (showValue) {
    eventHandlers.oninput = function(e) {
      var wrapper = e.target.closest('.bw_range_wrapper');
      var valDisplay = wrapper.querySelector('.bw_range_value');
      if (valDisplay) valDisplay.textContent = e.target.value;
      if (userOnInput) userOnInput(e);
    };
  }

  children.push({
    t: 'input',
    a: {
      type: 'range',
      class: 'bw_range',
      min: min,
      max: max,
      step: step,
      value: value,
      id: id,
      name: name,
      disabled: disabled,
      ...eventHandlers
    }
  });

  return {
    t: 'div',
    a: { class: ('bw_range_wrapper ' + className).trim() },
    c: children,
    o: { type: 'range' }
  };
}

/**
 * Create a media object layout (image + text side-by-side)
 *
 * Classic media object pattern: image/icon on one side, text content
 * on the other, using flexbox. Supports reversed layout.
 *
 * @param {Object} [props] - Media object configuration
 * @param {string} [props.src] - Image source URL
 * @param {string} [props.alt=""] - Image alt text
 * @param {string} [props.title] - Title text
 * @param {string|Object|Array} [props.content] - Body content
 * @param {boolean} [props.reverse=false] - Put image on the right
 * @param {string} [props.imageSize="3rem"] - Image width/height
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a media object
 * @category Component Builders
 * @example
 * const media = makeMediaObject({
 *   src: '/avatar.jpg',
 *   title: 'Jane Doe',
 *   content: 'Posted a comment 5 minutes ago.'
 * });
 */
function makeMediaObject(props = {}) {
  var {
    src,
    alt = '',
    title,
    content,
    reverse = false,
    imageSize = '3rem',
    className = ''
  } = props;

  var imgEl = src ? {
    t: 'img',
    a: {
      class: 'bw_media_img',
      src: src,
      alt: alt,
      style: 'width:' + imageSize + ';height:' + imageSize
    }
  } : null;

  var bodyEl = {
    t: 'div',
    a: { class: 'bw_media_body' },
    c: [
      title && { t: 'h5', a: { class: 'bw_media_title' }, c: title },
      content
    ].filter(Boolean)
  };

  return {
    t: 'div',
    a: { class: ('bw_media ' + (reverse ? 'bw_media_reverse ' : '') + className).trim() },
    c: reverse
      ? [bodyEl, imgEl].filter(Boolean)
      : [imgEl, bodyEl].filter(Boolean),
    o: { type: 'media-object' }
  };
}

/**
 * Create a file upload zone with drag-and-drop support
 *
 * Styled drop zone with file input. Supports drag-and-drop visuals
 * and multiple file selection.
 *
 * @param {Object} [props] - File upload configuration
 * @param {string} [props.accept] - Accepted file types (e.g. "image/*", ".pdf,.doc")
 * @param {boolean} [props.multiple=false] - Allow multiple file selection
 * @param {Function} [props.onFiles] - Callback when files are selected, receives FileList
 * @param {string} [props.text="Drop files here or click to browse"] - Zone label text
 * @param {string} [props.id] - Element ID
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a file upload zone
 * @category Component Builders
 * @example
 * const upload = makeFileUpload({
 *   accept: 'image/*',
 *   multiple: true,
 *   onFiles: (files) => uploadFiles(files)
 * });
 */
function makeFileUpload(props = {}) {
  var {
    accept,
    multiple = false,
    onFiles,
    text = 'Drop files here or click to browse',
    id,
    className = ''
  } = props;

  return {
    t: 'div',
    a: {
      class: ('bw_file_upload ' + className).trim(),
      tabindex: '0',
      role: 'button',
      'aria-label': text
    },
    c: [
      { t: 'div', a: { class: 'bw_file_upload_icon' }, c: '\uD83D\uDCC1' },
      { t: 'div', a: { class: 'bw_file_upload_text' }, c: text },
      {
        t: 'input',
        a: {
          type: 'file',
          class: 'bw_file_upload_input',
          accept: accept,
          multiple: multiple,
          id: id,
          onchange: function(e) {
            if (onFiles && e.target.files.length) onFiles(e.target.files);
          }
        }
      }
    ],
    o: {
      type: 'file-upload',
      mounted: function(el) {
        var input = el.querySelector('.bw_file_upload_input');

        // Click zone to trigger file input
        el.addEventListener('click', function(e) {
          if (e.target !== input) input.click();
        });

        // Keyboard activation
        el.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            input.click();
          }
        });

        // Drag-and-drop visuals
        el.addEventListener('dragover', function(e) {
          e.preventDefault();
          el.classList.add('bw_file_upload_active');
        });
        el.addEventListener('dragleave', function() {
          el.classList.remove('bw_file_upload_active');
        });
        el.addEventListener('drop', function(e) {
          e.preventDefault();
          el.classList.remove('bw_file_upload_active');
          if (onFiles && e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
        });
      }
    }
  };
}

// =========================================================================
// Phase 7: Data Display & Workflow
// =========================================================================

/**
 * Create a vertical timeline for chronological event display
 *
 * Renders events as a vertical line with markers and content cards.
 * Each item can have a colored variant marker.
 *
 * @param {Object} [props] - Timeline configuration
 * @param {Array<Object>} [props.items=[]] - Timeline events
 * @param {string} [props.items[].title] - Event title
 * @param {string|Object|Array} [props.items[].content] - Event description content
 * @param {string} [props.items[].date] - Date or time label
 * @param {string} [props.items[].variant="primary"] - Marker color variant
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a timeline
 * @category Component Builders
 * @example
 * const timeline = makeTimeline({
 *   items: [
 *     { title: 'Project Started', date: 'Jan 2026', variant: 'primary' },
 *     { title: 'Beta Release', date: 'Mar 2026', content: 'v2.0 beta shipped' },
 *     { title: 'Stable Release', date: 'Jun 2026', variant: 'success' }
 *   ]
 * });
 */
function makeTimeline(props = {}) {
  var {
    items = [],
    className = ''
  } = props;

  return {
    t: 'div',
    a: { class: ('bw_timeline ' + className).trim() },
    c: items.map(function(item) {
      return {
        t: 'div',
        a: { class: 'bw_timeline_item' },
        c: [
          {
            t: 'div',
            a: { class: 'bw_timeline_marker ' + variantClass(item.variant || 'primary') }
          },
          {
            t: 'div',
            a: { class: 'bw_timeline_content' },
            c: [
              item.date && {
                t: 'div',
                a: { class: 'bw_timeline_date' },
                c: item.date
              },
              item.title && {
                t: 'h5',
                a: { class: 'bw_timeline_title' },
                c: item.title
              },
              item.content && (typeof item.content === 'string'
                ? { t: 'p', a: { class: 'bw_timeline_text' }, c: item.content }
                : item.content)
            ].filter(Boolean)
          }
        ]
      };
    }),
    o: { type: 'timeline' }
  };
}

/**
 * Create a multi-step wizard/progress indicator
 *
 * Displays numbered steps with active and completed states.
 * Steps before currentStep are marked completed, the currentStep
 * is active, and subsequent steps are pending.
 *
 * @param {Object} [props] - Stepper configuration
 * @param {Array<Object>} [props.steps=[]] - Step definitions
 * @param {string} [props.steps[].label] - Step label text
 * @param {string} [props.steps[].description] - Optional step description
 * @param {number} [props.currentStep=0] - Zero-based index of the active step
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a stepper
 * @category Component Builders
 * @example
 * const stepper = makeStepper({
 *   currentStep: 1,
 *   steps: [
 *     { label: 'Account', description: 'Create account' },
 *     { label: 'Profile', description: 'Set up profile' },
 *     { label: 'Confirm', description: 'Review & submit' }
 *   ]
 * });
 */
function makeStepper(props = {}) {
  var {
    steps = [],
    currentStep = 0,
    className = ''
  } = props;

  return {
    t: 'div',
    a: { class: ('bw_stepper ' + className).trim(), role: 'list' },
    c: steps.map(function(step, index) {
      var state = index < currentStep ? 'completed' : index === currentStep ? 'active' : 'pending';
      return {
        t: 'div',
        a: {
          class: 'bw_step bw_step_' + state,
          role: 'listitem',
          'aria-current': state === 'active' ? 'step' : undefined
        },
        c: [
          {
            t: 'div',
            a: { class: 'bw_step_indicator' },
            c: state === 'completed' ? '\u2713' : '' + (index + 1)
          },
          {
            t: 'div',
            a: { class: 'bw_step_body' },
            c: [
              { t: 'div', a: { class: 'bw_step_label' }, c: step.label },
              step.description && { t: 'div', a: { class: 'bw_step_description' }, c: step.description }
            ].filter(Boolean)
          }
        ]
      };
    }),
    o: { type: 'stepper' }
  };
}

/**
 * Create a chip/tag input for managing a list of items
 *
 * Displays existing chips with remove buttons and an input field
 * for adding new ones. Chips are added on Enter and removed on
 * clicking the × button.
 *
 * @param {Object} [props] - Chip input configuration
 * @param {Array<string>} [props.chips=[]] - Initial chip values
 * @param {string} [props.placeholder="Add..."] - Input placeholder text
 * @param {Function} [props.onAdd] - Callback when a chip is added, receives value
 * @param {Function} [props.onRemove] - Callback when a chip is removed, receives value
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a chip input
 * @category Component Builders
 * @example
 * const tags = makeChipInput({
 *   chips: ['JavaScript', 'CSS'],
 *   placeholder: 'Add tag...',
 *   onAdd: (val) => addTag(val),
 *   onRemove: (val) => removeTag(val)
 * });
 */
function makeChipInput(props = {}) {
  var {
    chips = [],
    placeholder = 'Add...',
    onAdd,
    onRemove,
    className = ''
  } = props;

  function makeChipEl(text) {
    return {
      t: 'span',
      a: { class: 'bw_chip' },
      c: [
        text,
        {
          t: 'button',
          a: {
            type: 'button',
            class: 'bw_chip_remove',
            'aria-label': 'Remove ' + text,
            onclick: function(e) {
              var chip = e.target.closest('.bw_chip');
              chip.parentNode.removeChild(chip);
              if (onRemove) onRemove(text);
            }
          },
          c: '\u00D7'
        }
      ]
    };
  }

  return {
    t: 'div',
    a: { class: ('bw_chip_input ' + className).trim() },
    c: [
      ...chips.map(makeChipEl),
      {
        t: 'input',
        a: {
          type: 'text',
          class: 'bw_chip_field',
          placeholder: placeholder,
          onkeydown: function(e) {
            if (e.key === 'Enter' && e.target.value.trim()) {
              e.preventDefault();
              var val = e.target.value.trim();
              var wrapper = e.target.closest('.bw_chip_input');
              // Insert chip before the input
              var chipEl = document.createElement('span');
              chipEl.className = 'bw_chip';
              chipEl._bw_chipValue = val;
              chipEl.innerHTML = '';
              chipEl.textContent = val;
              var removeBtn = document.createElement('button');
              removeBtn.type = 'button';
              removeBtn.className = 'bw_chip_remove';
              removeBtn.setAttribute('aria-label', 'Remove ' + val);
              removeBtn.textContent = '\u00D7';
              removeBtn.onclick = function() {
                chipEl.parentNode.removeChild(chipEl);
                if (onRemove) onRemove(val);
              };
              chipEl.appendChild(removeBtn);
              wrapper.insertBefore(chipEl, e.target);
              e.target.value = '';
              if (onAdd) onAdd(val);
            }
            // Backspace on empty input removes last chip
            if (e.key === 'Backspace' && !e.target.value) {
              var wrapper = e.target.closest('.bw_chip_input');
              var chipEls = wrapper.querySelectorAll('.bw_chip');
              if (chipEls.length) {
                var last = chipEls[chipEls.length - 1];
                var removedVal = last._bw_chipValue || last.firstChild.textContent;
                last.parentNode.removeChild(last);
                if (onRemove) onRemove(removedVal);
              }
            }
          }
        }
      }
    ],
    o: {
      type: 'chip-input',
      handle: {
        addChip: function(el, text) {
          if (!text) return;
          var input = el.querySelector('.bw_chip_field');
          var chipEl = document.createElement('span');
          chipEl.className = 'bw_chip';
          chipEl._bw_chipValue = text;
          chipEl.textContent = text;
          var removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'bw_chip_remove';
          removeBtn.setAttribute('aria-label', 'Remove ' + text);
          removeBtn.textContent = '\u00D7';
          removeBtn.onclick = function() { chipEl.parentNode.removeChild(chipEl); };
          chipEl.appendChild(removeBtn);
          el.insertBefore(chipEl, input);
        },
        removeChip: function(el, text) {
          var chips = el.querySelectorAll('.bw_chip');
          for (var i = 0; i < chips.length; i++) {
            if ((chips[i]._bw_chipValue || chips[i].firstChild.textContent) === text) {
              chips[i].parentNode.removeChild(chips[i]);
              return;
            }
          }
        },
        getChips: function(el) {
          var chips = el.querySelectorAll('.bw_chip');
          var values = [];
          for (var i = 0; i < chips.length; i++) {
            values.push(chips[i]._bw_chipValue || chips[i].firstChild.textContent);
          }
          return values;
        },
        clear: function(el) {
          var chips = el.querySelectorAll('.bw_chip');
          for (var i = chips.length - 1; i >= 0; i--) {
            chips[i].parentNode.removeChild(chips[i]);
          }
        }
      }
    }
  };
}

// componentHandles registry removed in v2.0.15.
// See dev/dead-code-elimination-v2.0.15.md for recovery.

// =========================================================================
// BCCL Component Registry
//
// Single registry mapping type names to their factory functions.
// Enables bw.make('card', props) dispatch and introspection via
// Object.keys(BCCL).
// =========================================================================

/**
 * BCCL component registry — maps component type names to factory functions.
 * Each entry's `make` function is the corresponding exported makeXxx().
 *
 * @type {Object.<string, {make: Function}>}
 */
var BCCL = {
  card:          { make: makeCard },
  button:        { make: makeButton },
  container:     { make: makeContainer },
  row:           { make: makeRow },
  col:           { make: makeCol },
  nav:           { make: makeNav },
  navbar:        { make: makeNavbar },
  tabs:          { make: makeTabs },
  alert:         { make: makeAlert },
  badge:         { make: makeBadge },
  progress:      { make: makeProgress },
  listGroup:     { make: makeListGroup },
  breadcrumb:    { make: makeBreadcrumb },
  form:          { make: makeForm },
  formGroup:     { make: makeFormGroup },
  input:         { make: makeInput },
  textarea:      { make: makeTextarea },
  select:        { make: makeSelect },
  checkbox:      { make: makeCheckbox },
  stack:         { make: makeStack },
  spinner:       { make: makeSpinner },
  hero:          { make: makeHero },
  featureGrid:   { make: makeFeatureGrid },
  cta:           { make: makeCTA },
  section:       { make: makeSection },
  codeDemo:      { make: makeCodeDemo },
  pagination:    { make: makePagination },
  radio:         { make: makeRadio },
  buttonGroup:   { make: makeButtonGroup },
  accordion:     { make: makeAccordion },
  modal:         { make: makeModal },
  toast:         { make: makeToast },
  dropdown:      { make: makeDropdown },
  switch:        { make: makeSwitch },
  skeleton:      { make: makeSkeleton },
  avatar:        { make: makeAvatar },
  carousel:      { make: makeCarousel },
  statCard:      { make: makeStatCard },
  tooltip:       { make: makeTooltip },
  popover:       { make: makePopover },
  searchInput:   { make: makeSearchInput },
  range:         { make: makeRange },
  mediaObject:   { make: makeMediaObject },
  fileUpload:    { make: makeFileUpload },
  timeline:      { make: makeTimeline },
  stepper:       { make: makeStepper },
  chipInput:     { make: makeChipInput }
};

/**
 * Factory function — create any BCCL component by type name.
 *
 * @param {string} type - Component type (e.g. 'card', 'button', 'alert')
 * @param {Object} [props] - Component properties
 * @returns {Object} TACO object
 * @throws {Error} If type is not found in the registry
 * @example
 * var card = make('card', { title: 'Hello', variant: 'primary' });
 * var btn = make('button', { text: 'Click', variant: 'success' });
 * var types = Object.keys(BCCL); // list all available types
 */
function make(type, props) {
  var def = BCCL[type];
  if (!def) throw new Error('bw.make: unknown component type "' + type + '". Available: ' + Object.keys(BCCL).join(', '));
  var taco = def.make(props || {});
  if (taco && typeof taco === 'object') {
    taco._bwFactory = { type: type, props: props || {} };
  }
  return taco;
}

var components = /*#__PURE__*/Object.freeze({
  __proto__: null,
  BCCL: BCCL,
  make: make,
  makeAccordion: makeAccordion,
  makeAlert: makeAlert,
  makeAvatar: makeAvatar,
  makeBadge: makeBadge,
  makeBreadcrumb: makeBreadcrumb,
  makeButton: makeButton,
  makeButtonGroup: makeButtonGroup,
  makeCTA: makeCTA,
  makeCard: makeCard,
  makeCarousel: makeCarousel,
  makeCheckbox: makeCheckbox,
  makeChipInput: makeChipInput,
  makeCodeDemo: makeCodeDemo,
  makeCol: makeCol,
  makeContainer: makeContainer,
  makeDropdown: makeDropdown,
  makeFeatureGrid: makeFeatureGrid,
  makeFileUpload: makeFileUpload,
  makeForm: makeForm,
  makeFormGroup: makeFormGroup,
  makeHero: makeHero,
  makeInput: makeInput,
  makeListGroup: makeListGroup,
  makeMediaObject: makeMediaObject,
  makeModal: makeModal,
  makeNav: makeNav,
  makeNavbar: makeNavbar,
  makePagination: makePagination,
  makePopover: makePopover,
  makeProgress: makeProgress,
  makeRadio: makeRadio,
  makeRange: makeRange,
  makeRow: makeRow,
  makeSearchInput: makeSearchInput,
  makeSection: makeSection,
  makeSelect: makeSelect,
  makeSkeleton: makeSkeleton,
  makeSpinner: makeSpinner,
  makeStack: makeStack,
  makeStatCard: makeStatCard,
  makeStepper: makeStepper,
  makeSwitch: makeSwitch,
  makeTabs: makeTabs,
  makeTextarea: makeTextarea,
  makeTimeline: makeTimeline,
  makeToast: makeToast,
  makeTooltip: makeTooltip,
  variantClass: variantClass
});

/**
 * bitwrench-bccl-entry.js — Standalone entry point for BCCL component library.
 *
 * Use this alongside bitwrench-lean when you want the core library and
 * BCCL components as separate files. The UMD build auto-registers all
 * make*() functions onto the global `bw` object if present.
 *
 * Usage (browser):
 *   <script src="bitwrench-lean.umd.min.js"></script>
 *   <script src="bitwrench-bccl.umd.min.js"></script>
 *
 * Usage (ESM):
 *   import bw from 'bitwrench/lean';
 *   import { registerBCCL } from 'bitwrench/bccl';
 *   registerBCCL(bw);
 *
 * @module bitwrench-bccl
 * @license BSD-2-Clause
 */


/**
 * Register all BCCL components onto a bitwrench instance.
 * Called automatically in UMD builds when `bw` is a global.
 *
 * @param {Object} bw - The bitwrench instance to register on
 */
function registerBCCL(bw) {
  if (!bw) return;

  // Register all make* functions
  Object.entries(components).forEach(function(entry) {
    var name = entry[0], fn = entry[1];
    if (name.indexOf('make') === 0) {
      bw[name] = fn;
    }
  });

  // Factory dispatch: bw.make('card', props) → bw.makeCard(props)
  bw.make = make;

  // Component registry
  bw.BCCL = BCCL;

  // Variant class helper
  bw.variantClass = variantClass;

  // Create functions that return DOM elements
  if (typeof bw.createDOM === 'function') {
    Object.entries(components).forEach(function(entry) {
      var name = entry[0], fn = entry[1];
      if (name.indexOf('make') === 0) {
        var createName = 'create' + name.substring(4);
        bw[createName] = function(props) {
          return bw.createDOM(fn(props));
        };
      }
    });
  }
}

// UMD auto-registration: if `bw` exists as a global, register automatically
if (typeof window !== 'undefined' && typeof window.bw !== 'undefined') {
  registerBCCL(window.bw);
} else if (typeof globalThis !== 'undefined' && typeof globalThis.bw !== 'undefined') {
  registerBCCL(globalThis.bw);
}

export { BCCL, make, registerBCCL, variantClass };
//# sourceMappingURL=bitwrench-bccl.esm.js.map
