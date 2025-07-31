# Bitwrench v2 BCCL (Bitwrench Core Component Library)

## Overview

The Bitwrench Core Component Library provides a comprehensive set of UI components that work out-of-the-box with minimal configuration. All components follow consistent patterns, support theming, and are designed to work together seamlessly.

## Design Principles

1. **Components as Functions**: All components are pure functions returning TACO objects
2. **Theme-aware**: Components accept theme objects but never depend on global state
3. **Responsive by Default**: Components adapt to their containers
4. **Composable**: Components can contain other components
5. **Progressive Enhancement**: Basic functionality works everywhere, enhanced features detect support
6. **Zero Dependencies**: No external libraries required

## Complete Component List

### Layout Components
| Component | Function | Features |
|-----------|----------|----------|
| Container | `bw.makeContainer()` | fluid option, responsive max-widths |
| Row | `bw.makeRow()` | gutters, no-gutters, align options |
| Col | `bw.makeCol()` | responsive sizes, offset, order |
| Stack | `bw.makeStack()` | vertical/horizontal, gap control |
| Grid | `bw.makeGrid()` | CSS Grid wrapper, template areas |
| Flex | `bw.makeFlex()` | flex utilities wrapper |
| Spacer | `bw.makeSpacer()` | flexible spacing component |
| Divider | `bw.makeDivider()` | horizontal/vertical dividers |
| AspectRatio | `bw.makeAspectRatio()` | maintain aspect ratios |

### Navigation Components
| Component | Function | Features |
|-----------|----------|----------|
| Navbar | `bw.makeNavbar()` | responsive, collapsible, sticky |
| Sidebar | `bw.makeSidebar()` | collapsible, fixed/static |
| Tabs | `bw.makeTabs()` | horizontal/vertical, icons |
| Breadcrumb | `bw.makeBreadcrumb()` | separator options |
| Pagination | `bw.makePagination()` | sizes, alignment, boundaries |
| Steps | `bw.makeSteps()` | wizard-style navigation |
| Menu | `bw.makeMenu()` | dropdown, context menus |
| CommandPalette | `bw.makeCommandPalette()` | searchable command menu |

### Content Components
| Component | Function | Features |
|-----------|----------|----------|
| Card | `bw.makeCard()` | header/footer, actions, hover effects |
| Accordion | `bw.makeAccordion()` | single/multiple open, icons |
| Alert | `bw.makeAlert()` | variants, dismissible, actions |
| Badge | `bw.makeBadge()` | variants, pill, dot notation |
| Avatar | `bw.makeAvatar()` | sizes, fallback, groups |
| Carousel | `bw.makeCarousel()` | autoplay, indicators, controls |
| Collapse | `bw.makeCollapse()` | toggle, accordion behavior |
| List | `bw.makeList()` | ordered/unordered, interactive |
| Timeline | `bw.makeTimeline()` | vertical/horizontal |
| Stats | `bw.makeStats()` | metric displays, trends |
| EmptyState | `bw.makeEmptyState()` | illustrations, actions |
| Jumbotron | `bw.makeJumbotron()` | hero sections |

### Data Display Components
| Component | Function | Features |
|-----------|----------|----------|
| Table | `bw.makeTable()` | sortable, filterable, pagination, selection |
| DataGrid | `bw.makeDataGrid()` | virtual scrolling, column resize |
| TreeView | `bw.makeTreeView()` | expandable, checkboxes, drag-drop |
| Calendar | `bw.makeCalendar()` | month/week/day views, events |
| Chart | `bw.makeChart()` | line/bar/pie, responsive |
| Progress | `bw.makeProgress()` | linear/circular, segments |
| Skeleton | `bw.makeSkeleton()` | loading placeholders |
| DataTable | `bw.makeDataTable()` | advanced filtering, export |
| KanbanBoard | `bw.makeKanbanBoard()` | drag-drop columns |

### Form Components
| Component | Function | Features |
|-----------|----------|----------|
| Form | `bw.makeForm()` | validation, layouts |
| Input | `bw.makeInput()` | types, icons, validation |
| Textarea | `bw.makeTextarea()` | autosize, char count |
| Select | `bw.makeSelect()` | single/multiple, search |
| Checkbox | `bw.makeCheckbox()` | indeterminate, groups |
| Radio | `bw.makeRadio()` | groups, buttons style |
| Switch | `bw.makeSwitch()` | on/off toggle, labels |
| Slider | `bw.makeSlider()` | range, steps, marks |
| DatePicker | `bw.makeDatePicker()` | calendar, ranges |
| TimePicker | `bw.makeTimePicker()` | 12/24 hour |
| ColorPicker | `bw.makeColorPicker()` | palettes, alpha |
| FileUpload | `bw.makeFileUpload()` | drag-drop, preview |
| Rating | `bw.makeRating()` | stars, hearts, custom |
| Toggle | `bw.makeToggleGroup()` | exclusive selection |
| Combobox | `bw.makeCombobox()` | autocomplete, create new |
| OTP | `bw.makeOTPInput()` | one-time password input |

### Feedback Components
| Component | Function | Features |
|-----------|----------|----------|
| Modal | `bw.makeModal()` | sizes, positions, backdrop |
| Drawer | `bw.makeDrawer()` | sides, overlay, push |
| Toast | `bw.makeToast()` | positions, auto-dismiss |
| Tooltip | `bw.makeTooltip()` | positions, triggers |
| Popover | `bw.makePopover()` | rich content, positions |
| ContextMenu | `bw.makeContextMenu()` | right-click menus |
| Sheet | `bw.makeSheet()` | bottom sheet, modal-like |
| Dialog | `bw.makeDialog()` | confirm/alert patterns |
| Notification | `bw.makeNotification()` | system notifications |
| Banner | `bw.makeBanner()` | page-top announcements |

### Interactive Components
| Component | Function | Features |
|-----------|----------|----------|
| Button | `bw.makeButton()` | variants, sizes, loading |
| ButtonGroup | `bw.makeButtonGroup()` | grouped actions |
| Dropdown | `bw.makeDropdown()` | menu items, dividers |
| SplitButton | `bw.makeSplitButton()` | primary + dropdown |
| FloatingAction | `bw.makeFAB()` | floating action button |
| SpeedDial | `bw.makeSpeedDial()` | FAB with options |
| Chip | `bw.makeChip()` | deletable, clickable |
| Tag | `bw.makeTag()` | categorization |
| SegmentedControl | `bw.makeSegmentedControl()` | iOS-style toggle |

### Media Components
| Component | Function | Features |
|-----------|----------|----------|
| Image | `bw.makeImage()` | lazy load, placeholder |
| Video | `bw.makeVideo()` | controls, poster |
| Audio | `bw.makeAudio()` | waveform, controls |
| Gallery | `bw.makeGallery()` | lightbox, thumbnails |
| MediaObject | `bw.makeMediaObject()` | image + content layout |
| Lightbox | `bw.makeLightbox()` | zoom, gallery mode |

### Utility Components
| Component | Function | Features |
|-----------|----------|----------|
| ScrollArea | `bw.makeScrollArea()` | custom scrollbars |
| ResizablePanel | `bw.makeResizable()` | drag to resize |
| Draggable | `bw.makeDraggable()` | drag and drop |
| VirtualList | `bw.makeVirtualList()` | infinite scroll |
| Portal | `bw.makePortal()` | render outside parent |
| FocusTrap | `bw.makeFocusTrap()` | trap keyboard focus |
| ScrollSpy | `bw.makeScrollSpy()` | track scroll position |
| Intersection | `bw.makeIntersection()` | observe visibility |
| Transition | `bw.makeTransition()` | enter/leave animations |
| Parallax | `bw.makeParallax()` | scroll effects |

### Advanced Components
| Component | Function | Features |
|-----------|----------|----------|
| CodeEditor | `bw.makeCodeEditor()` | syntax highlighting |
| MarkdownEditor | `bw.makeMarkdownEditor()` | preview, toolbar |
| RichTextEditor | `bw.makeRichTextEditor()` | WYSIWYG editing |
| JsonView | `bw.makeJsonView()` | collapsible tree |
| Terminal | `bw.makeTerminal()` | command interface |
| Diff | `bw.makeDiff()` | compare changes |
| Tour | `bw.makeTour()` | guided tour/onboarding |
| HeatMap | `bw.makeHeatMap()` | data visualization |
| TreeMap | `bw.makeTreeMap()` | hierarchical data |
| MindMap | `bw.makeMindMap()` | node relationships |

## Component API Pattern

Every BCCL component follows the same pattern with three usage modes:

### 1. TACO Generation (Pure Data)
```javascript
// Returns TACO object
const cardTaco = bw.makeCard({
  title: 'Hello',
  content: 'World',
  footer: bw.makeButton({ text: 'Click me' })
});
// Returns: { t: 'div', a: { class: 'bw-card' }, c: [...] }
```

### 2. HTML String Generation (Legacy/SSR)
```javascript
// Returns HTML string
const cardHtml = bw.html(bw.makeCard({
  title: 'Hello',
  content: 'World'
}));
// Returns: "<div class='bw-card'>...</div>"
```

### 3. Live Component Creation (Interactive)
```javascript
// Returns component handle with methods
const cardHandle = bw.createCard({
  title: 'Hello',
  content: 'World'
});
// Returns: CardHandle { element, setTitle(), setContent(), ... }

// Mount to DOM
bw.DOM('#app', cardHandle);
```

## Common Component Props

All components accept these base props:
- `className` - Additional CSS classes
- `style` - Inline styles (object or string)
- `id` - Element ID
- `attrs` - Additional HTML attributes
- `theme` - Component-specific theme overrides
- `responsive` - Responsive behavior options
- `a11y` - Accessibility options

## Component Implementation Details

### 1. Layout Components

#### Container
Provides consistent max-width and padding:
```javascript
bw.components.container = (props = {}) => ({
  t: 'div',
  a: { 
    class: `bw-container ${props.fluid ? 'bw-container-fluid' : ''} ${props.className || ''}`,
    style: props.style
  },
  c: props.children || props.content,
  o: {
    type: 'container'
  }
});
```

#### Row/Column Grid
Flexible grid system:
```javascript
bw.components.row = (props = {}) => ({
  t: 'div',
  a: { 
    class: `bw-row ${props.className || ''}`,
    style: props.style
  },
  c: props.children || props.columns,
  o: { type: 'row' }
});

bw.components.col = (props = {}) => ({
  t: 'div',
  a: { 
    class: `bw-col${props.size ? `-${props.size}` : ''} ${props.className || ''}`,
    style: props.style
  },
  c: props.children || props.content,
  o: { type: 'col' }
});
```

#### Stack
Vertical or horizontal stacking with gap control:
```javascript
bw.components.stack = (props = {}) => ({
  t: 'div',
  a: { 
    class: `bw-stack ${props.direction || 'vertical'} bw-gap-${props.gap || 3}`,
    style: props.style
  },
  c: props.children,
  o: { 
    type: 'stack',
    mounted: (el) => {
      // Smart spacing: remove margin from last child
      const lastChild = el.lastElementChild;
      if (lastChild) {
        lastChild.style.marginBottom = '0';
      }
    }
  }
});
```

### 2. Content Components

#### Card
Flexible content container:
```javascript
bw.components.card = (props = {}) => ({
  t: 'div',
  a: { 
    class: `bw-card ${props.variant || ''} ${props.className || ''}`,
    style: props.style
  },
  c: [
    props.image && {
      t: 'img',
      a: { 
        class: 'bw-card-image',
        src: props.image.src,
        alt: props.image.alt || '',
        loading: props.image.loading || 'lazy'
      }
    },
    (props.header || props.title) && {
      t: 'div',
      a: { class: 'bw-card-header' },
      c: props.header || { t: 'h3', c: props.title }
    },
    {
      t: 'div',
      a: { class: 'bw-card-body' },
      c: props.body || props.content || props.children
    },
    props.footer && {
      t: 'div',
      a: { class: 'bw-card-footer' },
      c: props.footer
    }
  ].filter(Boolean),
  o: {
    type: 'card',
    state: {
      collapsed: props.collapsible ? false : undefined
    }
  }
});
```

#### Alert
Contextual feedback messages:
```javascript
bw.components.alert = (props = {}) => ({
  t: 'div',
  a: { 
    class: `bw-alert bw-alert-${props.type || 'info'} ${props.dismissible ? 'bw-dismissible' : ''}`,
    role: 'alert',
    style: props.style
  },
  c: [
    props.icon && {
      t: 'span',
      a: { class: 'bw-alert-icon' },
      c: props.icon
    },
    {
      t: 'div',
      a: { class: 'bw-alert-content' },
      c: [
        props.title && { t: 'strong', c: props.title },
        props.message || props.content || props.children
      ].filter(Boolean)
    },
    props.dismissible && {
      t: 'button',
      a: { 
        class: 'bw-alert-close',
        type: 'button',
        'aria-label': 'Close'
      },
      c: '×'
    }
  ].filter(Boolean),
  o: {
    type: 'alert',
    mounted: (el, handle) => {
      if (props.dismissible) {
        const closeBtn = el.querySelector('.bw-alert-close');
        closeBtn.onclick = () => handle.dismiss();
      }
    }
  }
});
```

#### Badge
Small count and labeling component:
```javascript
bw.components.badge = (props = {}) => ({
  t: 'span',
  a: { 
    class: `bw-badge bw-badge-${props.variant || 'secondary'} ${props.pill ? 'bw-badge-pill' : ''}`,
    style: props.style
  },
  c: props.text || props.content || props.children,
  o: { type: 'badge' }
});
```

### 3. Form Components

#### Input
Text input with label and validation:
```javascript
bw.components.input = (props = {}) => ({
  t: 'div',
  a: { class: 'bw-form-group' },
  c: [
    props.label && {
      t: 'label',
      a: { 
        for: props.id || bw.uuid(),
        class: 'bw-form-label'
      },
      c: props.label
    },
    {
      t: 'input',
      a: {
        type: props.type || 'text',
        class: `bw-form-control ${props.error ? 'bw-is-invalid' : ''}`,
        id: props.id || bw.uuid(),
        name: props.name,
        value: props.value || '',
        placeholder: props.placeholder,
        required: props.required,
        disabled: props.disabled,
        readonly: props.readonly,
        ...props.attrs
      }
    },
    props.help && {
      t: 'small',
      a: { class: 'bw-form-text' },
      c: props.help
    },
    props.error && {
      t: 'div',
      a: { class: 'bw-invalid-feedback' },
      c: props.error
    }
  ].filter(Boolean),
  o: {
    type: 'input',
    state: {
      value: props.value || '',
      error: props.error || null
    }
  }
});
```

#### Select
Dropdown selection:
```javascript
bw.components.select = (props = {}) => ({
  t: 'div',
  a: { class: 'bw-form-group' },
  c: [
    props.label && {
      t: 'label',
      a: { 
        for: props.id || bw.uuid(),
        class: 'bw-form-label'
      },
      c: props.label
    },
    {
      t: 'select',
      a: {
        class: 'bw-form-control',
        id: props.id || bw.uuid(),
        name: props.name,
        disabled: props.disabled,
        multiple: props.multiple,
        ...props.attrs
      },
      c: [
        props.placeholder && {
          t: 'option',
          a: { value: '', disabled: true, selected: !props.value },
          c: props.placeholder
        },
        ...props.options.map(opt => ({
          t: 'option',
          a: { 
            value: opt.value,
            selected: opt.value === props.value
          },
          c: opt.label || opt.text || opt.value
        }))
      ].filter(Boolean)
    }
  ].filter(Boolean),
  o: {
    type: 'select',
    state: {
      value: props.value || '',
      options: props.options
    }
  }
});
```

#### Checkbox/Radio
Boolean and choice inputs:
```javascript
bw.components.checkbox = (props = {}) => ({
  t: 'div',
  a: { class: `bw-form-check ${props.inline ? 'bw-form-check-inline' : ''}` },
  c: [
    {
      t: 'input',
      a: {
        type: 'checkbox',
        class: 'bw-form-check-input',
        id: props.id || bw.uuid(),
        name: props.name,
        value: props.value,
        checked: props.checked,
        disabled: props.disabled,
        ...props.attrs
      }
    },
    {
      t: 'label',
      a: { 
        for: props.id || bw.uuid(),
        class: 'bw-form-check-label'
      },
      c: props.label
    }
  ],
  o: {
    type: 'checkbox',
    state: {
      checked: props.checked || false
    }
  }
});
```

### 4. Navigation Components

#### Navbar
Responsive navigation bar:
```javascript
bw.components.navbar = (props = {}) => ({
  t: 'nav',
  a: { 
    class: `bw-navbar ${props.variant ? `bw-navbar-${props.variant}` : ''} ${props.className || ''}`,
    style: props.style
  },
  c: [
    {
      t: 'div',
      a: { class: 'bw-navbar-brand' },
      c: props.brand
    },
    {
      t: 'button',
      a: { 
        class: 'bw-navbar-toggle',
        type: 'button',
        'aria-label': 'Toggle navigation'
      },
      c: '☰'
    },
    {
      t: 'div',
      a: { class: 'bw-navbar-collapse' },
      c: [
        {
          t: 'ul',
          a: { class: 'bw-navbar-nav' },
          c: props.items.map(item => ({
            t: 'li',
            a: { class: `bw-nav-item ${item.active ? 'bw-active' : ''}` },
            c: {
              t: 'a',
              a: { 
                class: 'bw-nav-link',
                href: item.href || '#'
              },
              c: item.text || item.label
            }
          }))
        },
        props.actions && {
          t: 'div',
          a: { class: 'bw-navbar-actions' },
          c: props.actions
        }
      ].filter(Boolean)
    }
  ],
  o: {
    type: 'navbar',
    state: {
      collapsed: true
    },
    mounted: (el, handle) => {
      const toggle = el.querySelector('.bw-navbar-toggle');
      toggle.onclick = () => handle.toggle();
    }
  }
});
```

#### Tabs
Tabbed interface:
```javascript
bw.components.tabs = (props = {}) => ({
  t: 'div',
  a: { class: 'bw-tabs' },
  c: [
    {
      t: 'ul',
      a: { class: 'bw-tab-list', role: 'tablist' },
      c: props.tabs.map((tab, i) => ({
        t: 'li',
        a: { class: 'bw-tab-item' },
        c: {
          t: 'button',
          a: {
            class: `bw-tab-link ${i === (props.activeIndex || 0) ? 'bw-active' : ''}`,
            role: 'tab',
            'aria-selected': i === (props.activeIndex || 0),
            'data-tab-index': i
          },
          c: tab.label || tab.title
        }
      }))
    },
    {
      t: 'div',
      a: { class: 'bw-tab-content' },
      c: props.tabs.map((tab, i) => ({
        t: 'div',
        a: {
          class: `bw-tab-pane ${i === (props.activeIndex || 0) ? 'bw-active' : ''}`,
          role: 'tabpanel',
          'data-tab-index': i
        },
        c: tab.content
      }))
    }
  ],
  o: {
    type: 'tabs',
    state: {
      activeIndex: props.activeIndex || 0
    },
    mounted: (el, handle) => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('bw-tab-link')) {
          const index = parseInt(e.target.dataset.tabIndex);
          handle.setActiveTab(index);
        }
      });
    }
  }
});
```

### 5. Data Display Components

#### Table
Enhanced data table:
```javascript
bw.components.table = (props = {}) => {
  const data = props.data || [];
  const headers = props.headers || (data[0] ? Object.keys(data[0]) : []);
  
  return {
    t: 'div',
    a: { class: 'bw-table-wrapper' },
    c: [
      props.title && {
        t: 'h3',
        a: { class: 'bw-table-title' },
        c: props.title
      },
      props.search && {
        t: 'input',
        a: {
          type: 'search',
          class: 'bw-table-search',
          placeholder: 'Search...'
        }
      },
      {
        t: 'table',
        a: { 
          class: `bw-table ${props.striped ? 'bw-table-striped' : ''} ${props.hover ? 'bw-table-hover' : ''}`,
          style: props.style
        },
        c: [
          {
            t: 'thead',
            c: {
              t: 'tr',
              c: headers.map(header => ({
                t: 'th',
                a: { 
                  class: props.sortable ? 'bw-sortable' : '',
                  'data-column': header
                },
                c: [
                  header,
                  props.sortable && {
                    t: 'span',
                    a: { class: 'bw-sort-indicator' },
                    c: ''
                  }
                ].filter(Boolean)
              }))
            }
          },
          {
            t: 'tbody',
            c: data.map((row, i) => ({
              t: 'tr',
              a: { 'data-row-index': i },
              c: headers.map(header => ({
                t: 'td',
                c: row[header] || ''
              }))
            }))
          }
        ]
      },
      props.pagination && {
        t: 'div',
        a: { class: 'bw-table-pagination' },
        c: bw.components.pagination({
          current: props.page || 1,
          total: props.totalPages || 1
        })
      }
    ].filter(Boolean),
    o: {
      type: 'table',
      state: {
        data: data,
        sortColumn: null,
        sortDirection: 'asc',
        searchTerm: '',
        page: props.page || 1
      }
    }
  };
};
```

#### List
Flexible list component:
```javascript
bw.components.list = (props = {}) => ({
  t: props.ordered ? 'ol' : 'ul',
  a: { 
    class: `bw-list ${props.variant || ''} ${props.className || ''}`,
    style: props.style
  },
  c: props.items.map(item => ({
    t: 'li',
    a: { 
      class: `bw-list-item ${item.active ? 'bw-active' : ''} ${item.disabled ? 'bw-disabled' : ''}`
    },
    c: item.content || item
  })),
  o: {
    type: 'list',
    state: {
      items: props.items
    }
  }
});
```

### 6. Interactive Components

#### Button
Versatile button component:
```javascript
bw.components.button = (props = {}) => ({
  t: props.href ? 'a' : 'button',
  a: {
    class: `bw-btn bw-btn-${props.variant || 'primary'} ${props.size ? `bw-btn-${props.size}` : ''} ${props.block ? 'bw-btn-block' : ''} ${props.className || ''}`,
    type: props.href ? undefined : (props.type || 'button'),
    href: props.href,
    disabled: props.disabled,
    style: props.style,
    ...props.attrs
  },
  c: [
    props.icon && {
      t: 'span',
      a: { class: 'bw-btn-icon' },
      c: props.icon
    },
    props.text || props.label || props.children
  ].filter(Boolean),
  o: {
    type: 'button',
    state: {
      loading: false
    }
  }
});
```

#### Modal
Overlay dialog:
```javascript
bw.components.modal = (props = {}) => ({
  t: 'div',
  a: { 
    class: `bw-modal ${props.show ? 'bw-show' : ''}`,
    tabindex: '-1',
    role: 'dialog'
  },
  c: [
    {
      t: 'div',
      a: { class: 'bw-modal-backdrop' }
    },
    {
      t: 'div',
      a: { class: `bw-modal-dialog ${props.size ? `bw-modal-${props.size}` : ''}` },
      c: {
        t: 'div',
        a: { class: 'bw-modal-content' },
        c: [
          {
            t: 'div',
            a: { class: 'bw-modal-header' },
            c: [
              { t: 'h5', a: { class: 'bw-modal-title' }, c: props.title },
              {
                t: 'button',
                a: { 
                  type: 'button',
                  class: 'bw-modal-close',
                  'aria-label': 'Close'
                },
                c: '×'
              }
            ]
          },
          {
            t: 'div',
            a: { class: 'bw-modal-body' },
            c: props.body || props.content
          },
          props.footer && {
            t: 'div',
            a: { class: 'bw-modal-footer' },
            c: props.footer
          }
        ].filter(Boolean)
      }
    }
  ],
  o: {
    type: 'modal',
    state: {
      show: props.show || false
    },
    mounted: (el, handle) => {
      // Close on backdrop click
      el.querySelector('.bw-modal-backdrop').onclick = () => handle.hide();
      // Close on X click
      el.querySelector('.bw-modal-close').onclick = () => handle.hide();
      // ESC key handler
      if (props.show) {
        document.addEventListener('keydown', handle._escHandler = (e) => {
          if (e.key === 'Escape') handle.hide();
        });
      }
    },
    unmount: (el, handle) => {
      if (handle._escHandler) {
        document.removeEventListener('keydown', handle._escHandler);
      }
    }
  }
});
```

#### Dropdown
Contextual overlay menu:
```javascript
bw.components.dropdown = (props = {}) => ({
  t: 'div',
  a: { class: 'bw-dropdown' },
  c: [
    {
      t: 'button',
      a: {
        class: 'bw-dropdown-toggle',
        type: 'button',
        'aria-expanded': 'false'
      },
      c: props.toggle || 'Dropdown'
    },
    {
      t: 'div',
      a: { class: 'bw-dropdown-menu' },
      c: props.items.map(item => 
        item.divider ? {
          t: 'div',
          a: { class: 'bw-dropdown-divider' }
        } : {
          t: 'a',
          a: {
            class: `bw-dropdown-item ${item.active ? 'bw-active' : ''} ${item.disabled ? 'bw-disabled' : ''}`,
            href: item.href || '#'
          },
          c: item.text || item.label
        }
      )
    }
  ],
  o: {
    type: 'dropdown',
    state: {
      open: false
    },
    mounted: (el, handle) => {
      const toggle = el.querySelector('.bw-dropdown-toggle');
      toggle.onclick = () => handle.toggle();
      
      // Close on outside click
      document.addEventListener('click', handle._outsideHandler = (e) => {
        if (!el.contains(e.target)) {
          handle.close();
        }
      });
    },
    unmount: (el, handle) => {
      document.removeEventListener('click', handle._outsideHandler);
    }
  }
});
```

## Theme Integration

All components accept a theme object:

```javascript
const theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: {
      sm: 14,
      base: 16,
      lg: 18,
      xl: 24
    }
  },
  borderRadius: {
    sm: 2,
    base: 4,
    lg: 8,
    full: 9999
  }
};

// Use theme in component
const card = bw.components.card({
  title: 'Themed Card',
  style: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md
  }
});
```

## Component Composition

Components naturally compose:

```javascript
// Dashboard layout
const dashboard = bw.components.container({
  children: [
    bw.components.navbar({
      brand: 'My App',
      items: [
        { text: 'Home', href: '/', active: true },
        { text: 'Dashboard', href: '/dashboard' },
        { text: 'Settings', href: '/settings' }
      ]
    }),
    bw.components.row({
      children: [
        bw.components.col({ size: 3, children: 
          bw.components.card({
            title: 'Revenue',
            content: '$125,000'
          })
        }),
        bw.components.col({ size: 3, children: 
          bw.components.card({
            title: 'Orders',
            content: '342'
          })
        }),
        bw.components.col({ size: 3, children: 
          bw.components.card({
            title: 'Customers',
            content: '1,205'
          })
        }),
        bw.components.col({ size: 3, children: 
          bw.components.card({
            title: 'Growth',
            content: '+12.5%'
          })
        })
      ]
    }),
    bw.components.table({
      title: 'Recent Orders',
      sortable: true,
      striped: true,
      data: orderData
    })
  ]
});
```

## Responsive Behavior

Components adapt to container size:

```javascript
// Components detect their environment
bw.components.smartCard = (props) => ({
  ...bw.components.card(props),
  o: {
    ...bw.components.card(props).o,
    mounted: (el, handle) => {
      // Detect container width
      const width = el.parentElement.offsetWidth;
      
      // Adjust layout based on available space
      if (width < 400) {
        el.classList.add('bw-card-compact');
      } else if (width > 800) {
        el.classList.add('bw-card-expanded');
      }
      
      // Remove bottom margin if last child
      if (!el.nextElementSibling) {
        el.style.marginBottom = '0';
      }
    }
  }
});
```

## Handle Methods by Component Type

Each component type gets specific handle methods:

```javascript
// Card handles
class CardHandle extends ComponentHandle {
  setTitle(title) { /* ... */ }
  setContent(content) { /* ... */ }
  collapse() { /* ... */ }
  expand() { /* ... */ }
}

// Table handles  
class TableHandle extends ComponentHandle {
  setData(data) { /* ... */ }
  addRow(row) { /* ... */ }
  deleteRow(index) { /* ... */ }
  sortBy(column, direction) { /* ... */ }
  filter(predicate) { /* ... */ }
  search(term) { /* ... */ }
  getSelectedRows() { /* ... */ }
  exportToCSV() { /* ... */ }
}

// Modal handles
class ModalHandle extends ComponentHandle {
  show() { /* ... */ }
  hide() { /* ... */ }
  setTitle(title) { /* ... */ }
  setContent(content) { /* ... */ }
}

// Form handles
class FormHandle extends ComponentHandle {
  validate() { /* ... */ }
  submit() { /* ... */ }
  reset() { /* ... */ }
  setValues(values) { /* ... */ }
  getValues() { /* ... */ }
  setErrors(errors) { /* ... */ }
}
```

## Accessibility

All components include proper ARIA attributes:

- Semantic HTML elements
- ARIA roles and labels
- Keyboard navigation support
- Focus management
- Screen reader announcements

## Browser Support

Core functionality works in IE8+ with progressive enhancement:

- IE8: Basic HTML/CSS, no animations
- IE9-10: Enhanced styling, basic transitions
- IE11: Full CSS3 support
- Modern: All features including CSS Grid, Flexbox

## Key Component Specifications

### Table Component
Most complex component with extensive features:

```javascript
// Props
bw.makeTable({
  // Data
  data: [],              // Array of objects or 2D array
  columns: [],           // Column definitions
  
  // Features
  sortable: true,        // Enable sorting
  filterable: true,      // Enable filtering
  selectable: true,      // Row selection
  pagination: true,      // Enable pagination
  pageSize: 20,          // Rows per page
  
  // Display
  striped: true,         // Zebra striping
  hover: true,           // Hover effects
  bordered: false,       // Cell borders
  compact: false,        // Reduced padding
  responsive: true,      // Horizontal scroll on mobile
  
  // Advanced
  virtualScroll: false,  // For large datasets
  exportable: true,      // CSV/Excel export
  editable: false,       // In-place editing
  expandable: false,     // Expandable rows
  groupBy: null,         // Group by column
  
  // Callbacks
  onSort: (column, direction) => {},
  onFilter: (filters) => {},
  onSelect: (rows) => {},
  onEdit: (row, column, value) => {}
});

// Handle methods
tableHandle.setData(newData)
tableHandle.sortBy(column, direction)
tableHandle.filter(filterObj)
tableHandle.selectRows(indices)
tableHandle.expandRow(index)
tableHandle.exportToCSV()
tableHandle.refresh()
```

### Form Component
Advanced form handling with validation:

```javascript
// Props
bw.makeForm({
  // Structure
  fields: [],            // Field definitions
  layout: 'vertical',    // vertical/horizontal/inline
  columns: 1,            // Multi-column layout
  
  // Validation
  validation: {},        // Validation rules
  validateOn: 'blur',    // blur/change/submit
  showErrors: 'inline',  // inline/summary/toast
  
  // Behavior
  autoComplete: 'on',    // Browser autocomplete
  autoSave: false,       // Save drafts
  resetOnSubmit: false,  // Clear after submit
  
  // Callbacks
  onSubmit: (values) => {},
  onChange: (field, value) => {},
  onValidate: (errors) => {}
});

// Field definition
{
  name: 'email',
  type: 'email',
  label: 'Email Address',
  placeholder: 'user@example.com',
  required: true,
  validation: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email address'
  },
  icon: 'envelope',
  help: 'We\'ll never share your email'
}

// Handle methods
formHandle.validate()
formHandle.submit()
formHandle.reset()
formHandle.setValues(values)
formHandle.setErrors(errors)
formHandle.getValues()
formHandle.isDirty()
formHandle.isValid()
```

### Modal Component
Full-featured modal dialogs:

```javascript
// Props
bw.makeModal({
  // Content
  title: 'Modal Title',
  body: content,
  footer: buttons,
  
  // Display
  size: 'md',           // sm/md/lg/xl/full
  centered: true,       // Vertical centering
  scrollable: true,     // Scrollable body
  backdrop: true,       // Show backdrop
  keyboard: true,       // Close on ESC
  focus: true,          // Focus trap
  
  // Animation
  animation: 'fade',    // fade/slide/zoom
  duration: 300,        // Animation duration
  
  // Behavior
  closable: true,       // Show close button
  closeOnBackdrop: true,
  closeOnEscape: true,
  preventClose: false,  // Prevent accidental close
  
  // Callbacks
  onShow: () => {},
  onShown: () => {},
  onHide: () => {},
  onHidden: () => {}
});

// Handle methods
modalHandle.show()
modalHandle.hide()
modalHandle.toggle()
modalHandle.setTitle(title)
modalHandle.setBody(content)
modalHandle.setSize(size)
modalHandle.lock() // Prevent closing
modalHandle.unlock()
```

### Select Component
Advanced select with search and multi-select:

```javascript
// Props
bw.makeSelect({
  // Options
  options: [],          // Array of {value, label} or strings
  value: null,          // Selected value(s)
  
  // Features
  multiple: false,      // Multi-select
  searchable: true,     // Filter options
  clearable: true,      // Clear button
  disabled: false,      // Disable input
  
  // Display
  placeholder: 'Select...',
  displayValue: (option) => option.label,
  groupBy: null,        // Group options
  
  // Behavior
  closeOnSelect: true,  // Close after selection
  createOption: false,  // Allow new options
  loading: false,       // Loading state
  
  // Advanced
  async: false,         // Load options async
  loadOptions: (query) => Promise,
  cacheOptions: true,   // Cache async results
  
  // Callbacks
  onChange: (value) => {},
  onCreate: (value) => {},
  onSearch: (query) => {}
});

// Handle methods
selectHandle.setValue(value)
selectHandle.clearValue()
selectHandle.openDropdown()
selectHandle.closeDropdown()
selectHandle.setOptions(options)
selectHandle.setLoading(bool)
selectHandle.focus()
```

### Toast Component
Non-intrusive notifications:

```javascript
// Props  
bw.makeToast({
  // Content
  title: 'Success',
  message: 'Operation completed',
  
  // Type/Style
  variant: 'success',   // success/error/warning/info
  icon: 'check',        // Icon name or element
  
  // Position
  position: 'top-right', // top/bottom-left/center/right
  
  // Behavior
  duration: 5000,       // Auto-dismiss ms (0 = manual)
  pauseOnHover: true,   // Pause timer on hover
  closeButton: true,    // Show close button
  
  // Actions
  actions: [{
    text: 'Undo',
    onClick: () => {}
  }],
  
  // Callbacks
  onShow: () => {},
  onHide: () => {},
  onClick: () => {}
});

// Global toast methods
bw.toast.show(options)
bw.toast.success(message, options)
bw.toast.error(message, options)
bw.toast.warning(message, options)
bw.toast.info(message, options)
bw.toast.promise(promise, {
  loading: 'Loading...',
  success: 'Success!',
  error: 'Failed!'
})
```

### DataGrid Component
Enterprise-grade data grid:

```javascript
// Props
bw.makeDataGrid({
  // Data
  data: [],
  columns: [{
    field: 'name',
    header: 'Name',
    width: 200,
    resizable: true,
    sortable: true,
    filterable: true,
    editable: true,
    type: 'string',    // string/number/date/boolean
    renderer: (value, row) => {},
    editor: 'text',    // text/select/date/checkbox
    validator: (value) => {}
  }],
  
  // Features
  virtualization: true,  // Virtual scrolling
  columnResize: true,    // Resize columns
  columnReorder: true,   // Drag columns
  rowReorder: true,      // Drag rows
  grouping: true,        // Group by columns
  aggregation: true,     // Sum/avg/count
  
  // Selection
  selection: 'multiple', // single/multiple/checkbox
  selectAll: true,       // Select all checkbox
  
  // Editing
  editMode: 'cell',      // cell/row/popup
  validation: true,      // Validate on edit
  
  // Advanced
  treeData: false,       // Hierarchical data
  masterDetail: false,   // Expandable detail rows
  pinnedColumns: [],     // Freeze columns
  
  // Export
  exportFormats: ['csv', 'excel', 'pdf']
});
```

## Component Patterns

### Compound Components
Some components work together:

```javascript
// Tabs with panels
const tabs = bw.makeTabs({
  tabs: [
    { id: 'tab1', label: 'General', icon: 'cog' },
    { id: 'tab2', label: 'Advanced', icon: 'sliders' }
  ],
  panels: [
    { id: 'tab1', content: generalForm },
    { id: 'tab2', content: advancedForm }
  ],
  activeTab: 'tab1'
});

// Accordion sections
const accordion = bw.makeAccordion({
  sections: [
    { 
      id: 'section1',
      title: 'Basic Information',
      content: basicForm,
      expanded: true
    },
    {
      id: 'section2', 
      title: 'Additional Details',
      content: detailsForm
    }
  ],
  allowMultiple: false  // Only one open at a time
});

// Steps/Wizard
const wizard = bw.makeSteps({
  steps: [
    { id: 'info', label: 'Information', content: infoForm },
    { id: 'payment', label: 'Payment', content: paymentForm },
    { id: 'confirm', label: 'Confirmation', content: summary }
  ],
  currentStep: 'info',
  orientation: 'horizontal',
  linear: true  // Must complete in order
});
```

### Responsive Props
Components adapt based on screen size:

```javascript
// Responsive columns
bw.makeCol({
  size: 12,      // Mobile: full width
  sm: 6,         // Small: half width  
  md: 4,         // Medium: third width
  lg: 3,         // Large: quarter width
  xl: 2          // Extra large: sixth width
});

// Responsive visibility
bw.makeButton({
  text: 'Desktop Only',
  className: 'bw-d-none bw-d-lg-block'
});

// Responsive table
bw.makeTable({
  responsive: true,      // Horizontal scroll on mobile
  stackedMobile: true,   // Stack cells on small screens
  hiddenColumns: {
    sm: ['details'],     // Hide on small
    xs: ['details', 'date'] // Hide more on extra small
  }
});
```

## Summary

The BCCL provides a complete set of components that:
1. Work out-of-the-box with sensible defaults
2. Support deep customization through props
3. Integrate seamlessly with themes
4. Compose naturally into complex UIs
5. Maintain IE8+ compatibility
6. Follow consistent patterns

Every component supports three modes (TACO/HTML/Live), making Bitwrench suitable for any use case from static sites to complex applications.