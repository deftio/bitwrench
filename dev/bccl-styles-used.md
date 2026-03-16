# BCCL CSS Property Audit

Comprehensive audit of all CSS properties used in `src/bitwrench-styles.js`.
Two categories: **Structural** (layout/positioning in `structuralRules` + `generateUtilityRules()`)
and **Appearance** (look-and-feel in themed generators: `generate*Themed()` + `generatePaletteClasses()`).

---

## 1. Structural CSS Properties

Properties found in `structuralRules` categories (base, typography, grid, buttons, cards, forms, formChecks, navigation, tables, alerts, badges, progress, tabs, listGroups, pagination, breadcrumb, hero, features, sections, cta, spinner, closeButton, stacks, offsets, codeDemo, buttonGroup, accordion, carousel, modal, toast, dropdown, formSwitch, skeleton, avatar, statCard, tooltip, popover, searchInput, range, mediaObject, fileUpload, timeline, stepper, chipInput, barChart, responsive) plus `generateUtilityRules()`.

| Property | Count | Notes |
|---|---|---|
| display | 56 | flex, block, inline-block, none, inline-flex, list-item |
| padding | 29 | Component internal spacing, utility classes |
| font-size | 44 | Type ramp, component sizing, utility classes |
| flex | 30 | Grid columns, flex shorthand for grow/shrink/basis |
| max-width | 29 | Grid columns, container breakpoints, modal sizing |
| margin | 18 | Utility spacing, resets, composite margins |
| border-radius | 24 | Badges, pills, circles, rounded utilities, avatars |
| font-weight | 21 | Headings, labels, buttons, badge, stat values |
| position | 18 | Fixed, absolute, relative, sticky, utility classes |
| width | 19 | 100%, fixed px, utility width classes, avatars |
| height | 16 | Fixed sizes, utility classes, sliders, avatars |
| margin-bottom | 14 | Typography, form groups, tables, breadcrumb |
| border | 14 | Resets, transparent borders, dashed borders |
| cursor | 13 | Pointer, text, not-allowed on interactive elements |
| line-height | 14 | Typography, buttons, cards, table cells |
| padding-left | 12 | Lists, grid gutters, offsets, timeline |
| margin-left | 16 | Grid offsets (11), button groups, navbar brand |
| align-items | 14 | Flex alignment: center, flex-start, stretch |
| justify-content | 12 | Flex justification: center, space-between, flex-end |
| text-decoration | 9 | None on links/buttons, underline utilities |
| flex-direction | 8 | Column, row, row-reverse |
| overflow | 8 | Hidden, visible, auto, utility classes |
| gap | 10 | Stacks, nav, carousel indicators, chip input |
| flex-wrap | 7 | Wrap, nowrap on nav, rows, modals |
| text-align | 7 | Center, left, right, inherit |
| opacity | 9 | Disabled states, opacity utilities, tooltip/popover |
| transform | 12 | translateY, translateX, rotate, scale, translate utilities |
| border-bottom | 7 | Tabs, tables, card header, nav, accordion |
| z-index | 8 | Modals, dropdowns, tooltips, popovers, hero |
| vertical-align | 6 | Middle, top, baseline, -0.125em for spinners |
| white-space | 7 | Nowrap, normal, text-wrap/nowrap utilities |
| padding-right | 6 | Grid gutters, select arrows, alert dismissible |
| padding-top | 5 | Navbar brand, padding utility |
| padding-bottom | 5 | Timeline, padding utility |
| border-bottom-width | 3 | Table cells, table head, list group |
| overflow-x | 3 | Auto for tables, responsive, code |
| visibility | 4 | Hidden/visible for modals, tooltips, utilities |
| pointer-events | 5 | None/auto on modals, tooltips, disabled |
| border-top | 4 | Accordion, list groups, dropdown divider, utilities |
| min-width | 4 | Cards, dropdown menu, popover, media body |
| left | 7 | Toast positions, carousel, tooltip, popover |
| right | 6 | Toast positions, carousel, code buttons, search clear |
| top | 7 | Toast positions, carousel, tooltip, popover, timeline |
| bottom | 5 | Toast positions, tooltip, popover, hero overlay |
| list-style | 5 | None for nav, pagination, breadcrumb |
| user-select | 4 | None on buttons, check labels, utility classes |
| margin-top | 7 | Headings, typography, card subtitle, stat label |
| font-family | 6 | Inherit on buttons/forms, monospace on code, body |
| animation | 4 | Spinner border/grow, skeleton shimmer, progress |
| border-width | 3 | Table bordered, list group flush, spinner |
| appearance | 4 | None on form controls, range, switch |
| background-clip | 4 | Border-box on cards, padding-box on forms, toasts |
| word-wrap | 1 | Break-word on cards |
| min-height | 2 | Page 100vh, textarea 5rem, chip input |
| object-fit | 3 | Cover on card images, avatar, media image |
| flex-shrink | 3 | Accordion chevron, card image, chip remove |
| flex-grow | 1 | Grid col grow |
| flex-basis | 1 | Grid col basis |
| margin-right | 4 | Navbar brand, grid row, list inline, container |
| background-image | 3 | Select chevron, switch toggle, progress stripes |
| background-repeat | 3 | No-repeat for select, switch, accordion |
| background-size | 3 | Select, switch, skeleton |
| background-position | 2 | Select arrow, switch toggle |
| resize | 1 | Vertical on textareas |
| caption-side | 1 | Bottom on table captions |
| text-transform | 3 | Uppercase on table head, utility classes |
| letter-spacing | 2 | Headings, table head |
| counter-reset | 1 | Stepper step counter |
| overflow-anchor | 1 | None on accordion button |
| content | 4 | Empty string for pseudo-elements (accordion, breadcrumb, dropdown, timeline) |
| float | 1 | Breadcrumb separator |
| box-sizing | 2 | Border-box reset, content-box on hr |
| -webkit-text-size-adjust | 1 | 100% on html |
| -webkit-font-smoothing | 2 | Antialiased on html and body |
| -moz-osx-font-smoothing | 2 | Grayscale on html and body |
| -webkit-overflow-scrolling | 3 | Touch for scrollable containers |
| clip | 2 | rect(0,0,0,0) for visually hidden, file upload input |
| overflow-y | 1 | Auto on modal |
| scrollbar-width | 1 | None for scrollable nav |
| border-top-width | 1 | List group border override |
| border-top-left-radius | 2 | Pagination, list group |
| border-top-right-radius | 2 | Pagination, list group, accordion |
| border-bottom-left-radius | 2 | Pagination, list group, accordion |
| border-bottom-right-radius | 2 | Pagination, list group |
| border-style | 2 | Solid on table bordered, range thumb |
| margin-bottom | 14 | (already counted above) |
| border-left | 3 | Stat card, utilities |
| border-right | 2 | Dropdown toggle, utilities |
| background-position-x | 1 | Progress bar stripes animation |
| background | 3 | Transparent on nav links, close btn, none on search |
| animation-duration | 1 | Reduced-motion override |
| animation-iteration-count | 1 | Reduced-motion override |
| transition-duration | 1 | Reduced-motion override |
| scroll-behavior | 1 | Auto in reduced-motion |
| color | 4 | Inherit on alert heading, hero title/subtitle |
| font-style | 2 | Italic/normal utility |
| border-right-color | 1 | Transparent on spinner |
| --bw_font_sans_serif | 1 | CSS custom property |
| --bw_font_monospace | 1 | CSS custom property |
| --bw_body_font_family | 1 | CSS custom property |
| --bw_body_font_size | 1 | CSS custom property |
| --bw_body_font_weight | 1 | CSS custom property |
| --bw_body_line_height | 1 | CSS custom property |
| --bw_gutter_x | 1 | CSS custom property for grid gutter |
| --bw_gutter_y | 1 | CSS custom property for grid gutter |
| grid-template-columns | 1 | Responsive feature grid fallback |
| border-collapse | 1 | Collapse on tables |

---

## 2. Appearance CSS Properties

Properties found in themed generator functions: `generateTypographyThemed`, `generateButtons`, `generateAlerts`, `generateCards`, `generateForms`, `generateNavigation`, `generateTables`, `generateTabs`, `generateListGroups`, `generatePagination`, `generateProgress`, `generateResetThemed`, `generateBreadcrumbThemed`, `generateCloseButtonThemed`, `generateSectionsThemed`, `generateAccordionThemed`, `generateCarouselThemed`, `generateModalThemed`, `generateToastThemed`, `generateDropdownThemed`, `generateSwitchThemed`, `generateSkeletonThemed`, `generateStatCardThemed`, `generateTimelineThemed`, `generateStepperThemed`, `generateChipInputThemed`, `generateFileUploadThemed`, `generateRangeThemed`, `generateTooltipThemed`, `generatePopoverThemed`, `generateSearchThemed`, `generateCodeDemoThemed`, `generateNavPillsThemed`, `generatePaletteClasses`.

| Property | Count | Notes |
|---|---|---|
| background-color | 68 | Dominant property: palette base, surface, surfaceAlt, light, hover, active, focus, inherit, transparent |
| color | 54 | Text colors: dark.base, secondary.base, primary.base/textOn, success, danger, inherit |
| border-color | 24 | Border theming: light.border, primary.base, secondary, success/danger |
| box-shadow | 16 | Focus rings (0 0 0 Xrem), elevation presets (sm/md/lg), inset shadows |
| transition | 11 | Color, background-color, border-color, box-shadow, transform, opacity with motion presets |
| border-bottom | 5 | Tab active underline, card header/footer, accordion body, popover header |
| border | 5 | Card border, form focus, stepper indicator, popover, file upload active |
| border-left | 3 | Toast accent (4px solid), card accent (4px solid), stat card accent |
| outline | 5 | Focus-visible: 2px solid currentColor/primary.base, none |
| padding | 6 | Button, alert, form, table cell, tooltip, popover (from layout.spacing) |
| border-radius | 5 | Button, alert, card, form, tooltip, popover, nav pills (from layout.radius) |
| opacity | 2 | Close button 0.5 |
| text-decoration | 2 | Underline on link/breadcrumb hover |
| font-weight | 2 | Dark navbar active 600, stepper active label 600 |
| border-bottom-color | 6 | Navbar, tabs, table cells/head, modal header, toast header |
| outline-offset | 3 | Form focus -1px, button/pagination focus 2px/-2px |
| background | 3 | Carousel caption gradient, skeleton shimmer gradient, hero gradient, code copy hover, code demo copied |
| border-top-color | 2 | Modal footer, dropdown divider |
| border-left-color | 1 | Stat card variant accent |
| border-style | 1 | File upload active solid |
| font-size | 2 | Button lg/sm sizes |
| border-bottom-width | 0 | (not used in themed -- only structural) |
| cursor | 1 | Table selectable pointer |

---

## Observations

### Core primitives (most-used properties)

The most heavily used CSS properties reveal the "primitive vocabulary" of the BCCL design system:

1. **`background-color` (68 in themed)** -- The single most common property. Nearly every themed generator sets background colors for base, hover, active, disabled, and surface states. This is the primary vehicle for palette expression.

2. **`color` (54 in themed)** -- Text color is the second most used, tightly coupled with background-color for contrast (palette.dark.base, palette.secondary.base, palette.primary.textOn).

3. **`display` (56 in structural)** -- Layout primitives (flex, block, inline-flex, none) dominate structural rules. Flex is the layout workhorse.

4. **`font-size` (44 in structural)** -- A large count driven by the type ramp (headings, body, utility classes), though most are systematically generated.

5. **`border-color` (24 in themed)** -- Border theming is consistent: uses `palette.light.border` for neutral borders, `palette.primary.base` for active/focus states.

6. **`flex` / `max-width` (30/29 in structural)** -- Grid system columns account for the bulk, highly systematic.

7. **`border-radius` (24 in structural, 5 in themed)** -- Structural rules set fixed radii; themed generators use `layout.radius` presets for consistency.

8. **`box-shadow` (16 in themed)** -- Focus rings and elevation levels. Uses elevation presets (sm/md/lg) consistently.

9. **`transition` (11 in themed)** -- All transitions use `layout.motion` presets for duration and easing.

### One-off / exotic properties that may warrant consolidation

- **`overflow-anchor: none`** (1) -- Only on accordion button. Niche browser hint.
- **`counter-reset: step`** (1) -- Only on stepper. CSS counter usage is isolated.
- **`caption-side: bottom`** (1) -- Only on table caption.
- **`word-wrap: break-word`** (1) -- Only on cards. Could be a shared utility.
- **`float: left`** (1) -- Only on breadcrumb separator `::before`. Legacy layout technique.
- **`scrollbar-width: none`** (1) -- Only on scrollable nav. Firefox-specific.
- **`resize: vertical`** (1) -- Only on textarea. Standard but isolated.
- **`border-style: solid`** (1 themed, 2 structural) -- Used for file upload active state and range thumb. The rest use shorthand `border`.
- **`grid-template-columns`** (1) -- Only in the mobile responsive breakpoint for feature grid. The grid system is otherwise entirely flexbox-based.
- **`-webkit-text-size-adjust`**, **`-webkit-font-smoothing`**, **`-moz-osx-font-smoothing`** -- Vendor prefixes only in reset. Standard for cross-browser consistency but not design-system primitives.
- **`-webkit-overflow-scrolling: touch`** (3) -- iOS momentum scrolling. Used on tables, tabs, and responsive wrappers.

### Unique property counts

- **Structural**: ~75 unique CSS properties (including vendor-prefixed and CSS custom properties)
- **Appearance/Themed**: ~22 unique CSS properties

The structural side is far more diverse because it handles layout mechanics, typography, animation keyframes, accessibility, vendor prefixes, and responsive overrides. The themed side is deliberately narrow -- focused almost entirely on the color/shadow/transition triad -- which is correct for a design token system where appearance should be reducible to palette + spacing + radius + elevation + motion.
