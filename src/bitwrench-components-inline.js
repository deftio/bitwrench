/**
 * Bitwrench v2 Component Library - Inline Version
 * This file contains component factory functions that can be used directly in browsers
 * without ES module support. All components return TACO objects.
 */

// Attach to the global bw object
if (typeof window !== 'undefined' && window.bw) {
  
  // Navigation Components
  window.bw.components = window.bw.components || {};
  const c = window.bw.components;
  
  c.Navbar = function({ brand, brandHref = '#', dark = true, items = [] }) {
    return {
      t: 'nav',
      a: { class: `navbar navbar-expand-lg ${dark ? 'navbar-dark bg-dark' : 'navbar-light bg-light'}` },
      c: {
        t: 'div',
        a: { class: 'container' },
        c: [
          {
            t: 'a',
            a: { href: brandHref, class: 'navbar-brand' },
            c: brand
          },
          items.length > 0 && {
            t: 'div',
            a: { class: 'navbar-collapse' },
            c: {
              t: 'ul',
              a: { class: 'navbar-nav ms-auto' },
              c: items.map(item => ({
                t: 'li',
                a: { class: 'nav-item' },
                c: {
                  t: 'a',
                  a: { 
                    href: item.href || '#',
                    class: `nav-link ${item.active ? 'active' : ''}`
                  },
                  c: item.text
                }
              }))
            }
          }
        ].filter(Boolean)
      }
    };
  };

  // Layout Components
  c.Container = function({ fluid = false, children }) {
    return {
      t: 'div',
      a: { class: fluid ? 'container-fluid' : 'container' },
      c: children
    };
  };

  c.Row = function({ children, class: className = '' }) {
    return {
      t: 'div',
      a: { class: `row ${className}`.trim() },
      c: children
    };
  };

  c.Col = function({ size, sm, md, lg, xl, children, class: className = '' }) {
    const classes = ['col'];
    
    if (size) classes.push(`col-${size}`);
    if (sm) classes.push(`col-sm-${sm}`);
    if (md) classes.push(`col-md-${md}`);
    if (lg) classes.push(`col-lg-${lg}`);
    if (xl) classes.push(`col-xl-${xl}`);
    
    if (classes.length === 1 && !size) classes[0] = 'col';
    
    return {
      t: 'div',
      a: { class: `${classes.join(' ')} ${className}`.trim() },
      c: children
    };
  };

  // Card Components
  c.Card = function({ 
    header, 
    title, 
    subtitle, 
    text, 
    footer, 
    children, 
    class: className = '',
    shadow = false 
  }) {
    return {
      t: 'div',
      a: { class: `card ${shadow ? 'shadow' : ''} ${className}`.trim() },
      c: [
        header && {
          t: 'div',
          a: { class: 'card-header' },
          c: header
        },
        {
          t: 'div',
          a: { class: 'card-body' },
          c: children || [
            title && { t: 'h5', a: { class: 'card-title' }, c: title },
            subtitle && { t: 'h6', a: { class: 'card-subtitle mb-2 text-muted' }, c: subtitle },
            text && { t: 'p', a: { class: 'card-text' }, c: text }
          ].filter(Boolean)
        },
        footer && {
          t: 'div',
          a: { class: 'card-footer' },
          c: footer
        }
      ].filter(Boolean)
    };
  };

  // Button Components
  c.Button = function({ 
    variant = 'primary', 
    size, 
    block = false,
    disabled = false,
    onClick,
    children,
    type = 'button',
    class: className = ''
  }) {
    return {
      t: 'button',
      a: {
        type,
        class: [
          'btn',
          `btn-${variant}`,
          size && `btn-${size}`,
          block && 'btn-block w-100',
          className
        ].filter(Boolean).join(' '),
        disabled,
        onclick: onClick
      },
      c: children
    };
  };

  // Alert Components
  c.Alert = function({ variant = 'primary', dismissible = false, children, onClose }) {
    return {
      t: 'div',
      a: { 
        class: `alert alert-${variant} ${dismissible ? 'alert-dismissible fade show' : ''}`.trim(),
        role: 'alert'
      },
      c: [
        ...(Array.isArray(children) ? children : [children]),
        dismissible && {
          t: 'button',
          a: {
            type: 'button',
            class: 'btn-close',
            onclick: onClose || function(e) { e.target.closest('.alert').remove(); }
          }
        }
      ].filter(Boolean)
    };
  };

  // Badge Components  
  c.Badge = function({ variant = 'primary', pill = false, children }) {
    return {
      t: 'span',
      a: { class: `badge badge-${variant} ${pill ? 'rounded-pill' : ''}`.trim() },
      c: children
    };
  };

  // Progress Components
  c.Progress = function({ value = 0, max = 100, height, striped = false, animated = false, variant = 'primary' }) {
    return {
      t: 'div',
      a: { 
        class: 'progress',
        style: height ? { height: `${height}px` } : undefined
      },
      c: {
        t: 'div',
        a: {
          class: [
            'progress-bar',
            `bg-${variant}`,
            striped && 'progress-bar-striped',
            animated && 'progress-bar-animated'
          ].filter(Boolean).join(' '),
          role: 'progressbar',
          style: { width: `${(value / max) * 100}%` },
          'aria-valuenow': value,
          'aria-valuemin': 0,
          'aria-valuemax': max
        },
        c: `${Math.round((value / max) * 100)}%`
      }
    };
  };

  // Page Layout Components
  c.PageHeader = function({ title, subtitle, breadcrumb }) {
    return {
      t: 'div',
      a: { class: 'page-header mb-4' },
      c: [
        breadcrumb && {
          t: 'nav',
          a: { 'aria-label': 'breadcrumb' },
          c: {
            t: 'ol',
            a: { class: 'breadcrumb' },
            c: breadcrumb.map((item, idx) => ({
              t: 'li',
              a: { 
                class: `breadcrumb-item ${idx === breadcrumb.length - 1 ? 'active' : ''}`,
                'aria-current': idx === breadcrumb.length - 1 ? 'page' : undefined
              },
              c: item.href && idx !== breadcrumb.length - 1 ? {
                t: 'a',
                a: { href: item.href },
                c: item.text
              } : item.text || item
            }))
          }
        },
        {
          t: 'h1',
          a: { class: 'display-4' },
          c: title
        },
        subtitle && {
          t: 'p',
          a: { class: 'lead' },
          c: subtitle
        }
      ].filter(Boolean)
    };
  };

  // Stat Card for dashboards
  c.StatCard = function({ title, value, change, icon, variant = 'primary' }) {
    return {
      t: 'div',
      a: { class: 'card' },
      c: {
        t: 'div',
        a: { class: 'card-body' },
        c: [
          {
            t: 'div',
            a: { class: 'd-flex justify-content-between align-items-center' },
            c: [
              {
                t: 'div',
                c: [
                  { t: 'h6', a: { class: 'text-muted mb-2' }, c: title },
                  { t: 'h2', a: { class: 'mb-0' }, c: value },
                  change && {
                    t: 'small',
                    a: { 
                      class: `text-${change > 0 ? 'success' : 'danger'}`
                    },
                    c: `${change > 0 ? '↑' : '↓'} ${Math.abs(change)}%`
                  }
                ].filter(Boolean)
              },
              icon && {
                t: 'div',
                a: { 
                  class: `text-${variant}`,
                  style: { fontSize: '3rem', opacity: 0.3 }
                },
                c: icon
              }
            ].filter(Boolean)
          }
        ]
      }
    };
  };
  
  // Table Component
  c.Table = function({ 
    striped = false, 
    hover = false, 
    bordered = false,
    responsive = false,
    class: className = '',
    children 
  }) {
    const table = {
      t: 'table',
      a: { 
        class: [
          'table',
          striped && 'table-striped',
          hover && 'table-hover',
          bordered && 'table-bordered',
          className
        ].filter(Boolean).join(' ')
      },
      c: children
    };
    
    return responsive ? {
      t: 'div',
      a: { class: 'table-responsive' },
      c: table
    } : table;
  };
  
  // Table with sorting support
  c.SortableTable = function({ data = [], columns = [], sortColumn = null, sortDirection = 'asc', onSort }) {
    const table = {
      t: 'table',
      a: { class: 'table table-striped table-hover' },
      c: [
        {
          t: 'thead',
          c: {
            t: 'tr',
            c: columns.map(col => ({
              t: 'th',
              a: {
                scope: 'col',
                style: { cursor: 'pointer', userSelect: 'none' },
                onclick: () => onSort && onSort(col.key)
              },
              c: [
                col.label,
                {
                  t: 'span',
                  a: { class: 'ms-1' },
                  c: sortColumn === col.key 
                    ? (sortDirection === 'asc' ? '↑' : '↓')
                    : '↕'
                }
              ]
            }))
          }
        },
        {
          t: 'tbody',
          c: data.map(row => ({
            t: 'tr',
            c: columns.map(col => ({
              t: 'td',
              c: col.render ? col.render(row[col.key], row) : row[col.key]
            }))
          }))
        }
      ]
    };
    
    return {
      t: 'div',
      a: { class: 'table-responsive' },
      c: table
    };
  };
}