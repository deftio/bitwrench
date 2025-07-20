/**
 * Bitwrench v2 Component Library
 * Reusable UI components using TACO format
 */

// Navigation Components
export const Navbar = ({ brand, brandHref = '#', dark = true, items = [] }) => ({
  t: 'nav',
  a: { class: `navbar ${dark ? 'navbar-dark bg-dark' : 'navbar-light bg-light'}` },
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
        a: { class: 'navbar-nav ms-auto' },
        c: items.map(item => ({
          t: 'a',
          a: { 
            href: item.href || '#',
            class: `nav-link ${item.active ? 'active' : ''}`
          },
          c: item.text
        }))
      }
    ].filter(Boolean)
  }
});

// Layout Components
export const Container = ({ fluid = false, children }) => ({
  t: 'div',
  a: { class: fluid ? 'container-fluid' : 'container' },
  c: children
});

export const Row = ({ children, class: className = '' }) => ({
  t: 'div',
  a: { class: `row ${className}`.trim() },
  c: children
});

export const Col = ({ size, sm, md, lg, xl, children, class: className = '' }) => {
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
export const Card = ({ 
  header, 
  title, 
  subtitle, 
  text, 
  footer, 
  children, 
  class: className = '',
  shadow = false 
}) => ({
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
});

// Button Components
export const Button = ({ 
  variant = 'primary', 
  size, 
  block = false,
  disabled = false,
  onClick,
  children,
  type = 'button',
  class: className = ''
}) => ({
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
});

export const ButtonGroup = ({ children, size, vertical = false }) => ({
  t: 'div',
  a: { 
    class: [
      vertical ? 'btn-group-vertical' : 'btn-group',
      size && `btn-group-${size}`
    ].filter(Boolean).join(' '),
    role: 'group'
  },
  c: children
});

// Alert Components
export const Alert = ({ variant = 'primary', dismissible = false, children, onClose }) => ({
  t: 'div',
  a: { 
    class: `alert alert-${variant} ${dismissible ? 'alert-dismissible fade show' : ''}`.trim(),
    role: 'alert'
  },
  c: [
    children,
    dismissible && {
      t: 'button',
      a: {
        type: 'button',
        class: 'btn-close',
        onclick: onClose || function(e) { e.target.closest('.alert').remove(); }
      }
    }
  ].filter(Boolean)
});

// Badge Components
export const Badge = ({ variant = 'primary', pill = false, children }) => ({
  t: 'span',
  a: { class: `badge badge-${variant} ${pill ? 'rounded-pill' : ''}`.trim() },
  c: children
});

// Progress Components
export const Progress = ({ value = 0, max = 100, height, striped = false, animated = false }) => ({
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
});

// Form Components
export const FormGroup = ({ label, children, id }) => ({
  t: 'div',
  a: { class: 'mb-3' },
  c: [
    label && {
      t: 'label',
      a: { class: 'form-label', for: id },
      c: label
    },
    children
  ].filter(Boolean)
});

export const Input = ({ 
  type = 'text', 
  value, 
  placeholder, 
  disabled = false,
  readonly = false,
  id,
  name,
  onChange,
  class: className = ''
}) => ({
  t: 'input',
  a: {
    type,
    class: `form-control ${className}`.trim(),
    value,
    placeholder,
    disabled,
    readonly,
    id,
    name,
    oninput: onChange
  }
});

export const Select = ({ 
  options = [], 
  value, 
  disabled = false,
  id,
  name,
  onChange,
  placeholder,
  class: className = ''
}) => ({
  t: 'select',
  a: {
    class: `form-control ${className}`.trim(),
    value,
    disabled,
    id,
    name,
    onchange: onChange
  },
  c: [
    placeholder && { t: 'option', a: { value: '' }, c: placeholder },
    ...options.map(opt => ({
      t: 'option',
      a: { 
        value: opt.value,
        selected: opt.value === value
      },
      c: opt.label || opt.value
    }))
  ]
});

export const Textarea = ({ 
  value, 
  placeholder, 
  rows = 3,
  disabled = false,
  readonly = false,
  id,
  name,
  onChange,
  class: className = ''
}) => ({
  t: 'textarea',
  a: {
    class: `form-control ${className}`.trim(),
    rows,
    placeholder,
    disabled,
    readonly,
    id,
    name,
    oninput: onChange
  },
  c: value
});

export const Checkbox = ({ 
  label, 
  checked = false, 
  disabled = false,
  id,
  name,
  onChange,
  inline = false
}) => ({
  t: 'div',
  a: { class: `form-check ${inline ? 'form-check-inline' : ''}`.trim() },
  c: [
    {
      t: 'input',
      a: {
        type: 'checkbox',
        class: 'form-check-input',
        checked,
        disabled,
        id,
        name,
        onchange: onChange
      }
    },
    label && {
      t: 'label',
      a: { class: 'form-check-label', for: id },
      c: label
    }
  ].filter(Boolean)
});

export const Radio = ({ 
  label, 
  value,
  checked = false, 
  disabled = false,
  id,
  name,
  onChange,
  inline = false
}) => ({
  t: 'div',
  a: { class: `form-check ${inline ? 'form-check-inline' : ''}`.trim() },
  c: [
    {
      t: 'input',
      a: {
        type: 'radio',
        class: 'form-check-input',
        value,
        checked,
        disabled,
        id,
        name,
        onchange: onChange
      }
    },
    label && {
      t: 'label',
      a: { class: 'form-check-label', for: id },
      c: label
    }
  ].filter(Boolean)
});

// Table Components
export const Table = ({ 
  data = [], 
  columns = [],
  striped = true,
  hover = true,
  bordered = false,
  small = false,
  responsive = true,
  sortable = false,
  onSort
}) => {
  const table = {
    t: 'table',
    a: { 
      class: [
        'table',
        striped && 'table-striped',
        hover && 'table-hover',
        bordered && 'table-bordered',
        small && 'table-sm'
      ].filter(Boolean).join(' ')
    },
    c: [
      columns.length > 0 && {
        t: 'thead',
        c: {
          t: 'tr',
          c: columns.map((col, idx) => ({
            t: 'th',
            a: {
              scope: 'col',
              style: sortable && col.sortable !== false ? { cursor: 'pointer' } : undefined,
              onclick: sortable && col.sortable !== false && onSort ? () => onSort(col.key || idx) : undefined
            },
            c: [
              col.label || col,
              sortable && col.sortable !== false && {
                t: 'span',
                a: { class: 'ms-1' },
                c: '↕'
              }
            ].filter(Boolean)
          }))
        }
      },
      {
        t: 'tbody',
        c: data.map(row => ({
          t: 'tr',
          c: columns.length > 0
            ? columns.map(col => ({
                t: 'td',
                c: col.render ? col.render(row[col.key], row) : row[col.key]
              }))
            : (Array.isArray(row) ? row : Object.values(row)).map(cell => ({
                t: 'td',
                c: cell
              }))
        }))
      }
    ].filter(Boolean)
  };

  return responsive ? {
    t: 'div',
    a: { class: 'table-responsive' },
    c: table
  } : table;
};

// List Group Components
export const ListGroup = ({ items = [], flush = false, numbered = false }) => ({
  t: numbered ? 'ol' : 'ul',
  a: { class: `list-group ${flush ? 'list-group-flush' : ''} ${numbered ? 'list-group-numbered' : ''}`.trim() },
  c: items.map(item => ({
    t: 'li',
    a: { 
      class: [
        'list-group-item',
        item.active && 'active',
        item.disabled && 'disabled',
        item.variant && `list-group-item-${item.variant}`
      ].filter(Boolean).join(' ')
    },
    c: item.content || item
  }))
});

// Modal Components (simplified for now)
export const Modal = ({ title, body, footer, show = false, onClose }) => ({
  t: 'div',
  a: { 
    class: `modal ${show ? 'd-block' : 'd-none'}`,
    style: show ? { backgroundColor: 'rgba(0,0,0,0.5)' } : undefined,
    onclick: (e) => {
      if (e.target.classList.contains('modal') && onClose) onClose();
    }
  },
  c: {
    t: 'div',
    a: { class: 'modal-dialog' },
    c: {
      t: 'div',
      a: { class: 'modal-content' },
      c: [
        {
          t: 'div',
          a: { class: 'modal-header' },
          c: [
            { t: 'h5', a: { class: 'modal-title' }, c: title },
            {
              t: 'button',
              a: { 
                type: 'button',
                class: 'btn-close',
                onclick: onClose
              }
            }
          ]
        },
        {
          t: 'div',
          a: { class: 'modal-body' },
          c: body
        },
        footer && {
          t: 'div',
          a: { class: 'modal-footer' },
          c: footer
        }
      ].filter(Boolean)
    }
  }
});

// Spacing utility
export const Spacer = ({ size = 3 }) => ({
  t: 'div',
  a: { class: `mb-${size}` }
});

// Page Layout Components
export const PageHeader = ({ title, subtitle, breadcrumb }) => ({
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
});

// Stat Card for dashboards
export const StatCard = ({ title, value, change, icon, variant = 'primary' }) => ({
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
});

// Export all components
export default {
  // Layout
  Navbar,
  Container,
  Row,
  Col,
  PageHeader,
  Spacer,
  
  // Components
  Card,
  Button,
  ButtonGroup,
  Alert,
  Badge,
  Progress,
  
  // Forms
  FormGroup,
  Input,
  Select,
  Textarea,
  Checkbox,
  Radio,
  
  // Data
  Table,
  ListGroup,
  
  // Overlays
  Modal,
  
  // Dashboard
  StatCard
};