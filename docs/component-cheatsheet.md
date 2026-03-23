# Component Cheat Sheet

> **Before you write custom TACO for a common UI pattern, check this list.**
> Bitwrench ships 47+ ready-made `make*()` factories. Each returns a Level 0 TACO object.

## Full Component Table

| Component | Key Props | Capabilities | Handles / Slots |
|-----------|-----------|-------------|----------------|
| **Tables & Data** | | | |
| makeTable | data, columns, sortable, pageSize, onRowClick | Click-to-sort (on by default), pagination, row selection, custom column renderers | -- |
| makeTableFromArray | data (2D array), headerRow, sortable | Convert CSV/spreadsheet data to sortable table | -- |
| makeDataTable | title, data, columns, responsive | Title heading + responsive scroll wrapper around makeTable | -- |
| makeBarChart | data, labelKey, valueKey, title, color, formatValue | Pure-CSS vertical bar chart, no external library | -- |
| **Interactive** | | | |
| makeCarousel | items, autoPlay, interval, showControls | Auto-play, pause-on-hover, keyboard nav, dot indicators | goToSlide(i), next(), prev(), play(), pause(), getActiveIndex() |
| makeTabs | tabs [{label,content}], activeIndex | Arrow/Home/End keys, full WAI-ARIA, click switching | setActiveTab(i), getActiveTab() |
| makeAccordion | items [{title,content}], multiOpen | Smooth animations, ARIA, multi-open option | toggle(i), openAll(), closeAll() |
| makeModal | title, content, footer, size, onClose | ESC dismiss, backdrop click close, size variants | open(), close() |
| makeToast | title, content, variant, delay, position | Auto-dismiss (5s default), 6 position options | dismiss() |
| makeDropdown | trigger, items, align, variant | Outside-click-to-close, divider support | -- |
| makePopover | trigger, title, content, placement | Click-outside-to-close, 4 placements | -- |
| makeTooltip | content, text, placement | Show on hover/focus, role=tooltip, 4 placements | -- |
| **Content** | | | |
| makeCard | title, content, footer, image, variant, shadow | All props accept TACO (not just strings), image positions, shadow variants, hoverable | slots: setTitle/getTitle, setContent/getContent, setFooter/getFooter |
| makeStatCard | value, label, change, variant, prefix, suffix | Dashboard KPI with change indicator (green/red arrows) | slots: setValue/getValue, setLabel/getLabel |
| makeAlert | title, content, variant, dismissible | Dismissible close button, 8 color variants | -- |
| makeBadge | text, variant, pill, size | Pill shape option, sm/lg sizes | -- |
| makeProgress | value, max, variant, striped, animated | Striped + animated variants, ARIA | setValue(n), getValue() |
| makeHero | title, subtitle, actions, variant, size, backgroundImage | Background image with overlay, centered/left layouts | -- |
| makeSection | title, subtitle, content, variant, spacing | Semantic section wrapper with spacing control | -- |
| makeFeatureGrid | features [{icon,title,desc}], columns, centered | Responsive icon+title+desc grid | -- |
| makeCTA | title, description, actions, variant | Call-to-action block with action buttons | -- |
| makeCodeDemo | title, description, code, result | Code + live output in tabbed view, copy button | -- |
| makeMediaObject | src, alt, title, content, reverse, imageSize | Image + text side-by-side, reversible | -- |
| makeTimeline | items [{title,content,date,variant}] | Vertical timeline with colored markers | -- |
| makeStepper | steps [{label,desc}], currentStep | Step progress indicator with completed/active/pending states | -- |
| makeListGroup | items, flush, interactive | Interactive click items, flush variant for cards | -- |
| makeAvatar | src, alt, initials, size, variant | Initials fallback when no image, 4 sizes | -- |
| makeSkeleton | variant, width, height, count | Pulse animation placeholder (text/circle/rect) | -- |
| makeSpinner | variant, size, type | Border/grow animation types, 3 sizes | -- |
| **Navigation** | | | |
| makeNav | items [{text,href,active}], pills, vertical | Pill/vertical variants, disabled items | -- |
| makeNavbar | brand, brandHref, items, dark | Dark variant, brand link | -- |
| makeBreadcrumb | items [{text,href}] | aria-label, aria-current on active item | -- |
| makePagination | pages, currentPage, onPageChange, size | Page change callbacks, sm/lg sizes | -- |
| **Forms** | | | |
| makeForm | children, onsubmit | Form wrapper with default preventDefault | -- |
| makeFormGroup | label, input, help, validation, feedback, required | Required indicator (*), validation feedback (valid/invalid) | -- |
| makeInput | type, placeholder, value, disabled, oninput | All HTML5 types, bw_form_control styling | -- |
| makeTextarea | placeholder, value, rows, disabled | Multi-line input, bw_form_control styling | -- |
| makeSelect | options [{value,text}], value, disabled | Dropdown select, bw_form_control styling | -- |
| makeCheckbox | label, checked, id, name, disabled | Label-for-id linking, bw_form_check styling | -- |
| makeRadio | label, name, value, checked, id | Label-for-id linking, radio group support | -- |
| makeSwitch | label, checked, id, name, disabled | Toggle switch with label linking | -- |
| makeSearchInput | placeholder, onSearch, onInput | Enter to search, clear button appears on input | -- |
| makeChipInput | chips, placeholder, onAdd, onRemove | Enter to add, click X to remove, backspace last | addChip(v), removeChip(v), getChips(), clear() |
| makeFileUpload | accept, multiple, onFiles, text | Drag-and-drop zone, styled file input | -- |
| makeRange | min, max, step, value, label, showValue | Live value display next to slider | -- |
| **Buttons** | | | |
| makeButton | text, variant, size, disabled, onclick, type | 8 variants + outline-* variants, sm/lg sizes | -- |
| makeButtonGroup | children, size, vertical | Shared border-radius, vertical/horizontal layout | -- |
| **Layout** | | | |
| makeContainer | fluid, children | Centered max-width or full-width fluid | -- |
| makeRow | children, gap | Flexbox row with gap (1-5) | -- |
| makeCol | size, offset, content | Responsive: size as number or {xs,sm,md,lg,xl} | -- |
| makeStack | children, direction, gap | Vertical/horizontal flex stack | -- |

## How to Use Handles

Components with handles expose imperative methods via `el.bw`. Use `bw.mount()` instead of `bw.DOM()` to get the element reference:

```javascript
// Mount and get element reference
var el = bw.mount('#target', bw.makeCarousel({ items: slides, autoPlay: true }));

// Call handle methods directly
el.bw.goToSlide(2);
el.bw.pause();
var idx = el.bw.getActiveIndex();  // => 2

// Works with any component that has handles
var modal = bw.mount('#modal', bw.makeModal({ title: 'Confirm', content: 'Sure?' }));
modal.bw.open();   // show the modal
modal.bw.close();  // hide it
```

When you don't have the element reference, use `bw.message()`:

```javascript
bw.message('#my-carousel', 'goToSlide', 2);
bw.message('.bw_uuid_abc123', 'next');
```

See [State Management -- Level 1.5](state-management.md#level-15-component-handles) for the full handle/slots guide.

## How to Use Slots

Slot-based components auto-generate `el.bw.setName()` / `el.bw.getName()` pairs for content areas:

```javascript
var card = bw.mount('#info', bw.makeCard({ title: 'Stats', content: '0' }));
card.bw.setTitle('Revenue');                  // update just the title
card.bw.setContent({ t: 'b', c: '$42k' });   // accepts TACO objects
card.bw.getTitle();                           // => 'Revenue'
```

Slot setters update only the targeted child -- input focus, scroll, and animation state in siblings are preserved.

Build your own with `o.slots`:

```javascript
{
  t: 'div', c: [
    { t: 'h3', a: { class: 'title' }, c: 'Default' },
    { t: 'div', a: { class: 'body' }, c: 'Content' }
  ],
  o: {
    slots: { title: '.title', body: '.body' }
    // => el.bw.setTitle(), el.bw.getTitle(), el.bw.setBody(), el.bw.getBody()
  }
}
```

## Factory Dispatcher

Use `bw.make(type, props)` for data-driven component creation:

```javascript
bw.make('card', { title: 'Hello' });  // same as bw.makeCard({ title: 'Hello' })

// Data-driven layout
var layout = [
  { type: 'card', props: { title: 'Stats' } },
  { type: 'alert', props: { content: 'Warning!', variant: 'warning' } }
];
bw.DOM('#app', { t: 'div', c: layout.map(function(item) {
  return bw.make(item.type, item.props);
})});
```

---

*See [Component Library](component-library.md) for full signatures and examples. See [LLM Guide](llm-bitwrench-guide.md) for the compact API reference.*
