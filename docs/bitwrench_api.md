# Bitwrench API Reference

## Summary

| Field | Value |
|-------|-------|
| Version | 2.1.11 |
| Generated | 2026-10-04 |
| Total APIs | 169 |
| Categories | 23 |
| bitwrench.js | 5506 lines |
| bitwrench-bccl.js | 3968 lines |

## Table of Contents

- [Core](#core) (8)
- [DOM Generation](#dom-generation) (19)
- [DOM Selection](#dom-selection) (6)
- [Identifiers](#identifiers) (4)
- [State Management](#state-management) (3)
- [Events (DOM)](#events-dom-) (2)
- [Pub/Sub](#pub-sub) (5)
- [CSS & Styling](#css-styling) (14)
- [Component Builders](#component-builders) (52)
- [Routing](#routing) (3)
- [Color](#color) (4)
- [Color Utilities](#color-utilities) (12)
- [Math](#math) (2)
- [Array Utilities](#array-utilities) (6)
- [Text Generation](#text-generation) (1)
- [Timing](#timing) (2)
- [Browser Utilities](#browser-utilities) (4)
- [File I/O](#file-i-o) (6)
- [Utilities](#utilities) (2)
- [Function Registry](#function-registry) (5)
- [Component](#component) (4)
- [Data Utilities](#data-utilities) (1)
- [Server (bwserve)](#server-bwserve-) (4)

## Index

Every public API, with how it is called. Click a signature for the
full entry: parameters, return value and an example.

| API | Category | What it does |
|-----|----------|--------------|
| [`bw.getVersion()`](#bwgetversion) | Core | Get version metadata object (v1-compatible callable API) |
| [`bw.isNodeJS()`](#bwisnodejs) | Core | Detect if running in Node.js environment |
| [`bw.debug`](#bwdebug) | Core | Debug flag |
| [`bw.typeOf(x, baseTypeOnly)`](#bwtypeofxbasetypeonly) | Core | Enhanced type detection that distinguishes arrays, dates, regexps, and more |
| [`bw.janitor`](#bwjanitor) | Core | Janitor: document-level cleanup for ungraceful teardown |
| [`bw.parseJSONFlex(str)`](#bwparsejsonflexstr) | Core | Parse a bwserve protocol message string, supporting both strict JSON and r-prefixed relaxed JSON (single-quoted strings, trailing commas) |
| [`bw.makeDataTable(config)`](#bwmakedatatableconfig) | Core | Create a ready-to-use data table with title and responsive wrapper |
| [`bw.warnUnknownProps`](#bwwarnunknownprops) | Core | Warn when a component factory is handed an option it does not read |
| [`bw.raw(str)`](#bwrawstr) | DOM Generation | Mark a string as raw HTML so it will not be escaped by bw.html() or bw.create() |
| [`bw.html(taco, options = {})`](#bwhtmltacooptions) | DOM Generation | Convert a TACO object (or array of TACOs) to an HTML string |
| [`bw.htmlPage(opts)`](#bwhtmlpageopts) | DOM Generation | Generate a complete, self-contained HTML document from TACO content |
| [`bw.create(taco, options)`](#bwcreatetacooptions) | DOM Generation | Create a hydrated, detached DOM element from a TACO object (browser only) |
| [`bw.hydrate(el, taco)`](#bwhydrateeltaco) | DOM Generation | Wire lifecycle from taco.o onto an existing DOM node |
| [`bw.mountTree(el)`](#bwmounttreeel) | DOM Generation | Walk a subtree, register every addressable node, fire mounted() hooks |
| [`bw.unmount(el)`](#bwunmountel) | DOM Generation | Unmount an element and its entire subtree |
| [`bw.unmountChildren(el)`](#bwunmountchildrenel) | DOM Generation | Unmount descendants only; the element's own state/subs/registration are untouched |
| [`bw.clear(ref)`](#bwclearref) | DOM Generation | Empty a container: run unmount hooks on its children, then remove them |
| [`bw.remove(ref)`](#bwremoveref) | DOM Generation | Remove an element from the DOM and clean it up |
| [`bw.detach(el)`](#bwdetachel) | DOM Generation | Detach an element from the DOM but keep it registered (keep-alive) |
| [`bw.mount(target, taco, options)`](#bwmounttargettacooptions) | DOM Generation | Mount a TACO into a target element |
| [`bw.DOM(target, taco, options)`](#bwdomtargettacooptions) | DOM Generation | Mount a TACO into a target element |
| [`bw.append(target, content, opts)`](#bwappendtargetcontentopts) | DOM Generation | Append content to a target |
| [`bw.replace(ref, taco)`](#bwreplacereftaco) | DOM Generation | Replace an existing element with new content |
| [`bw.refresh(ref)`](#bwrefreshref) | DOM Generation | Refresh a component: unmountChildren → re-render → mountTree |
| [`bw.updateSlot(ref, name, value)`](#bwupdateslotrefnamevalue) | DOM Generation | Update a specific slot on a component by reference |
| [`bw.syncChildren(parentEl, items, opts)`](#bwsyncchildrenparentelitemsopts) | DOM Generation | Keyed reconciliation: match existing children by `el._bw_key`, move/add/remove to match `items` order |
| [`bw.render(target, position, taco)`](#bwrendertargetpositiontaco) | DOM Generation | Render a TACO into the DOM at a specific position relative to a target |
| [`bw.el(target, apply)`](#bweltargetapply) | DOM Selection | Look up a single DOM element by ID, CSS selector, UUID, or element ref |
| [`bw.addClass(ref, names)`](#bwaddclassrefnames) | DOM Selection | Add one or more classes to every matched element |
| [`bw.removeClass(ref, names)`](#bwremoveclassrefnames) | DOM Selection | Remove one or more classes from every matched element |
| [`bw.toggleClass(ref, names, force)`](#bwtoggleclassrefnamesforce) | DOM Selection | Toggle one or more classes on every matched element, or force them on/off |
| [`bw.hasClass(ref, name)`](#bwhasclassrefname) | DOM Selection | Does the first matched element carry this class? |
| [`bw.$(selector, apply)`](#bwselectorapply) | DOM Selection | DOM selection helper that always returns an array (browser only) |
| [`bw.uuid(prefix)`](#bwuuidprefix) | Identifiers | Generate a unique identifier string for DOM elements or application use |
| [`bw.assignUUID(taco, forceNew)`](#bwassignuuidtacoforcenew) | Identifiers | Assign a UUID to a TACO object by appending a `bw_uuid_*` token to `taco.a.class` |
| [`bw.getUUID(tacoOrElement)`](#bwgetuuidtacoorelement) | Identifiers | Read the UUID from a TACO object or DOM element |
| [`bw.escapeHTML(str)`](#bwescapehtmlstr) | Identifiers | Escape HTML special characters to prevent XSS |
| [`bw.update(ref, data)`](#bwupdaterefdata) | State Management | Update a component by dispatching to el.bw.update(data) if defined |
| [`bw.patch(id, content, attr)`](#bwpatchidcontentattr) | State Management | Targeted DOM update by element ID — change one element's content or attribute without rebuilding the entire component tree |
| [`bw.patchAll(patches)`](#bwpatchallpatches) | State Management | Batch version of `bw.patch()` — update multiple elements in one call |
| [`bw.emit(target, eventName, detail)`](#bwemittargeteventnamedetail) | Events (DOM) | Emit a custom DOM event on an element |
| [`bw.on(target, eventName, handler)`](#bwontargeteventnamehandler) | Events (DOM) | Listen for a custom bitwrench event on a DOM element |
| [`bw.pub(topic, detail)`](#bwpubtopicdetail) | Pub/Sub | Publish to a topic, calling all subscribers in registration order |
| [`bw.sub(topic, handler, el)`](#bwsubtopichandlerel) | Pub/Sub | Subscribe to a topic |
| [`bw.unsub(topic, handler)`](#bwunsubtopichandler) | Pub/Sub | Unsubscribe a handler by reference from a topic |
| [`bw.once(topic, handler, el)`](#bwoncetopichandlerel) | Pub/Sub | Subscribe to a topic for a single event only |
| [`bw.derive(inputs, fn, outTopic, opts)`](#bwderiveinputsfnouttopicopts) | Pub/Sub | Declared dataflow: recompute fn(inputs...) on any input publish |
| [`bw.css(rules, options = {})`](#bwcssrulesoptions) | CSS & Styling | Generate CSS from JavaScript objects |
| [`bw.injectCSS(css, options = {})`](#bwinjectcsscssoptions) | CSS & Styling | Inject CSS into the document head (browser only) |
| [`bw.s()`](#bws) | CSS & Styling | Merge multiple style objects into one (left-to-right) |
| [`bw.responsive(selector, breakpoints)`](#bwresponsiveselectorbreakpoints) | CSS & Styling | Generate responsive CSS with media query breakpoints |
| [`bw.makeStyles(config)`](#bwmakestylesconfig) | CSS & Styling | Generate a complete styles object from seed colors and layout config |
| [`bw.applyStyles(styles, scope)`](#bwapplystylesstylesscope) | CSS & Styling | Inject styles into the DOM with optional scoping |
| [`bw.loadStyles(config, scope)`](#bwloadstylesconfigscope) | CSS & Styling | Generate and apply styles in one call |
| [`bw.loadStructural()`](#bwloadstructural) | CSS & Styling | Inject structural (theme-independent) CSS only |
| [`bw.scopeRulesUnder(rules, prefix)`](#bwscoperulesunderrulesprefix) | CSS & Styling | Prefix every selector in a rules object with a scope selector |
| [`bw.loadReset()`](#bwloadreset) | CSS & Styling | Inject the CSS reset (box-sizing, html/body font, reduced-motion) |
| [`bw.setThemeMode(mode, scope)`](#bwsetthememodemodescope) | CSS & Styling | Set the theme mode on all matching elements |
| [`bw.toggleThemeMode(scope)`](#bwtogglethememodescope) | CSS & Styling | Toggle between primary and alternate theme palettes |
| [`bw.clearStyles(scope)`](#bwclearstylesscope) | CSS & Styling | Remove injected styles for a given scope |
| [`bw.generateTypeScale(base, ratio)`](#bwgeneratetypescalebaseratio) | CSS & Styling | Generate a modular type scale from a base size and ratio |
| [`bw.makeTable(config)`](#bwmaketableconfig) | Component Builders | Create a sortable TACO table from an array of row objects |
| [`bw.makeTableFromArray(config)`](#bwmaketablefromarrayconfig) | Component Builders | Create a table from a 2D array |
| [`bw.makeBarChart(config)`](#bwmakebarchartconfig) | Component Builders | Create a vertical bar chart from data |
| [`bw.variantClass(v)`](#bwvariantclassv) | Component Builders | Convert a variant name to a single palette class |
| [`bw.makeCard(props = {})`](#bwmakecardprops) | Component Builders | Create a card component with optional header, body, footer, and image support Supports images (top, bottom, left, right), shadow levels, subtitle, hover animation, and custom section class overrides |
| [`bw.makeButton(props = {})`](#bwmakebuttonprops) | Component Builders | Create a button component |
| [`bw.makeContainer(props = {})`](#bwmakecontainerprops) | Component Builders | Create a container component for centering and constraining content width |
| [`bw.makeRow(props = {})`](#bwmakerowprops) | Component Builders | Create a flexbox row for the grid system |
| [`bw.makeCol(props = {})`](#bwmakecolprops) | Component Builders | Create a grid column with responsive sizing Supports both fixed and responsive column sizes |
| [`bw.makeNav(props = {})`](#bwmakenavprops) | Component Builders | Create a navigation component with tabs or pills styling |
| [`bw.makeNavbar(props = {})`](#bwmakenavbarprops) | Component Builders | Create a navbar component with brand and navigation links |
| [`bw.makeTabs(props = {})`](#bwmaketabsprops) | Component Builders | Create a tabbed interface with accessible tab navigation Each tab is rendered as a button with ARIA attributes for accessibility |
| [`bw.makeAlert(props = {})`](#bwmakealertprops) | Component Builders | Create an alert/notification component |
| [`bw.makeBadge(props = {})`](#bwmakebadgeprops) | Component Builders | Create an inline badge/label component |
| [`bw.makeProgress(props = {})`](#bwmakeprogressprops) | Component Builders | Create a progress bar component with ARIA accessibility |
| [`bw.makeListGroup(props = {})`](#bwmakelistgroupprops) | Component Builders | Create a list group component for displaying lists of items Items can be simple strings or objects with text, active, disabled, href, and onclick properties |
| [`bw.makeBreadcrumb(props = {})`](#bwmakebreadcrumbprops) | Component Builders | Create a breadcrumb navigation component The last item with active:true is rendered as plain text (no link) |
| [`bw.makeForm(props = {})`](#bwmakeformprops) | Component Builders | Create a form wrapper with default submit prevention |
| [`bw.makeFormGroup(props = {})`](#bwmakeformgroupprops) | Component Builders | Create a form group with label, input, optional help text and validation feedback |
| [`bw.makeInput(props = {})`](#bwmakeinputprops) | Component Builders | Create an input element with form control styling Additional event handlers (oninput, onchange, etc.) can be passed as extra properties and are spread onto the element attributes |
| [`bw.makeTextarea(props = {})`](#bwmaketextareaprops) | Component Builders | Create a textarea element with form control styling |
| [`bw.makeSelect(props = {})`](#bwmakeselectprops) | Component Builders | Create a select dropdown with options |
| [`bw.makeCheckbox(props = {})`](#bwmakecheckboxprops) | Component Builders | Create a checkbox input with label |
| [`bw.makeStack(props = {})`](#bwmakestackprops) | Component Builders | Create a flexbox stack layout (vertical or horizontal) |
| [`bw.makeSpinner(props = {})`](#bwmakespinnerprops) | Component Builders | Create a loading spinner indicator |
| [`bw.makeHero(props = {})`](#bwmakeheroprops) | Component Builders | Create a hero section for landing pages and headers Supports gradient backgrounds, background images with overlays, and action buttons |
| [`bw.makeFeatureGrid(props = {})`](#bwmakefeaturegridprops) | Component Builders | Create a responsive feature grid for showcasing capabilities Renders features in an equal-width column grid with optional icons, titles, and descriptions |
| [`bw.makeCTA(props = {})`](#bwmakectaprops) | Component Builders | Create a call-to-action section with title, description, and action buttons |
| [`bw.makeSection(props = {})`](#bwmakesectionprops) | Component Builders | Create a page section with optional centered header and background |
| [`bw.makeCodeDemo(props = {})`](#bwmakecodedemoprops) | Component Builders | Create a code demo component for documentation pages Displays a live result alongside source code in a tabbed interface |
| [`bw.makePagination(props = {})`](#bwmakepaginationprops) | Component Builders | Create a pagination navigation component |
| [`bw.makeRadio(props = {})`](#bwmakeradioprops) | Component Builders | Create a radio button input with label |
| [`bw.makeButtonGroup(props = {})`](#bwmakebuttongroupprops) | Component Builders | Create a button group wrapper |
| [`bw.makeAccordion(props = {})`](#bwmakeaccordionprops) | Component Builders | Create an accordion component with collapsible items |
| [`bw.makeModal(props = {})`](#bwmakemodalprops) | Component Builders | Create a modal dialog overlay |
| [`bw.makeToast(props = {})`](#bwmaketoastprops) | Component Builders | Create a toast notification popup |
| [`bw.makeDropdown(props = {})`](#bwmakedropdownprops) | Component Builders | Create a dropdown menu triggered by a button |
| [`bw.makeSwitch(props = {})`](#bwmakeswitchprops) | Component Builders | Create a toggle switch (styled checkbox) |
| [`bw.makeSkeleton(props = {})`](#bwmakeskeletonprops) | Component Builders | Create a skeleton loading placeholder |
| [`bw.makeAvatar(props = {})`](#bwmakeavatarprops) | Component Builders | Create a user avatar with image or initials fallback |
| [`bw.makeCarousel(props = {})`](#bwmakecarouselprops) | Component Builders | Create a carousel/slideshow component with slide transitions Supports image slides, TACO content slides, captions, prev/next controls, dot indicators, and optional auto-play |
| [`bw.makeStatCard(props = {})`](#bwmakestatcardprops) | Component Builders | Create a stat card for dashboard metrics display Shows a large value with a label and optional change indicator |
| [`bw.makeTooltip(props = {})`](#bwmaketooltipprops) | Component Builders | Create a tooltip wrapper around trigger content Wraps the trigger element in a container that shows tooltip text on hover and focus |
| [`bw.makePopover(props = {})`](#bwmakepopoverprops) | Component Builders | Create a popover wrapper around trigger content Like a tooltip but richer — supports title + body content and is triggered by click rather than hover |
| [`bw.makeSearchInput(props = {})`](#bwmakesearchinputprops) | Component Builders | Create a search input with clear button Wraps a text input with a clear (×) button that appears when the field has content |
| [`bw.makeRange(props = {})`](#bwmakerangeprops) | Component Builders | Create a styled range slider input |
| [`bw.makeMediaObject(props = {})`](#bwmakemediaobjectprops) | Component Builders | Create a media object layout (image + text side-by-side) Classic media object pattern: image/icon on one side, text content on the other, using flexbox |
| [`bw.makeFileUpload(props = {})`](#bwmakefileuploadprops) | Component Builders | Create a file upload zone with drag-and-drop support Styled drop zone with file input |
| [`bw.makeTimeline(props = {})`](#bwmaketimelineprops) | Component Builders | Create a vertical timeline for chronological event display Renders events as a vertical line with markers and content cards |
| [`bw.makeStepper(props = {})`](#bwmakestepperprops) | Component Builders | Create a multi-step wizard/progress indicator Displays numbered steps with active and completed states |
| [`bw.makeChipInput(props = {})`](#bwmakechipinputprops) | Component Builders | Create a chip/tag input for managing a list of items Displays existing chips with remove buttons and an input field for adding new ones |
| [`bw.make(type, props)`](#bwmaketypeprops) | Component Builders | Factory function — create any BCCL component by type name |
| [`bw.router(config)`](#bwrouterconfig) | Routing | Create a client-side router: URLs in, TACOs out |
| [`bw.navigate(path, opts)`](#bwnavigatepathopts) | Routing | Navigate the active router to a path |
| [`bw.link(path, content, attrs)`](#bwlinkpathcontentattrs) | Routing | A TACO anchor that navigates through the router instead of reloading |
| [`bw.colorHslToRgb(h, s, l, a, rnd)`](#bwcolorhsltorgbhslarnd) | Color | HSL to RGB, in the v1 array format |
| [`bw.colorRgbToHsl(r, g, b, a, rnd)`](#bwcolorrgbtohslrgbarnd) | Color | RGB to HSL, in the v1 array format |
| [`bw.colorParse(s, defAlpha)`](#bwcolorparsesdefalpha) | Color | Parse any CSS colour string into the v1 array format |
| [`bw.colorInterp(x, in0, in1, colors, stretch, colorParseFn)`](#bwcolorinterpxin0in1colorsstretchcolorparsefn) | Color | Interpolate between an array of colors based on a value in a range |
| [`bw.hexToHsl(hex)`](#bwhextohslhex) | Color Utilities | Convert hex color to HSL array [h, s, l] |
| [`bw.hslToHex(hsl)`](#bwhsltohexhsl) | Color Utilities | Convert HSL array to hex color string |
| [`bw.adjustLightness(hex, amount)`](#bwadjustlightnesshexamount) | Color Utilities | Adjust lightness of a hex color by a percentage amount |
| [`bw.mixColor(hex1, hex2, ratio)`](#bwmixcolorhex1hex2ratio) | Color Utilities | Mix two hex colors via RGB linear interpolation |
| [`bw.relativeLuminance(hex)`](#bwrelativeluminancehex) | Color Utilities | Compute WCAG 2.0 relative luminance of a hex color |
| [`bw.textOnColor(hex)`](#bwtextoncolorhex) | Color Utilities | Return '#fff' or '#000' for readable text on a given background color |
| [`bw.harmonize(sourceHex, targetHex, amount)`](#bwharmonizesourcehextargethexamount) | Color Utilities | Shift a color's hue toward a target hue by a given amount |
| [`bw.deriveShades(hex)`](#bwderiveshadeshex) | Color Utilities | Derive a full shade palette for a single semantic color |
| [`bw.deriveAlternateSeed(hex)`](#bwderivealternateseedhex) | Color Utilities | Derive the alternate (luminance-inverted) version of a single seed color |
| [`bw.isLightPalette(config)`](#bwislightpaletteconfig) | Color Utilities | Determine whether a palette config is "light-flavored" based on the average luminance of its seed colors |
| [`bw.deriveAlternateConfig(config)`](#bwderivealternateconfigconfig) | Color Utilities | Derive a complete alternate config from a primary theme config |
| [`bw.derivePalette(config)`](#bwderivepaletteconfig) | Color Utilities | Derive complete palette from a theme config object |
| [`bw.mapScale(x, in0, in1, out0, out1, options, options.clip, options.expScale)`](#bwmapscalexin0in1out0out1optionsoptionsclipoptionsexpscale) | Math | Map/scale a value from one range to another (linear interpolation) |
| [`bw.clip(value, min, max)`](#bwclipvalueminmax) | Math | Clamp a value between min and max bounds |
| [`bw.choice(x, choices, def)`](#bwchoicexchoicesdef) | Array Utilities | Use a dictionary as a switch statement, with support for function values |
| [`bw.arrayUniq(x)`](#bwarrayuniqx) | Array Utilities | Return unique elements of an array (preserves first occurrence order) |
| [`bw.arrayBinA(a, b)`](#bwarraybinaab) | Array Utilities | Return the intersection of two arrays (elements present in both) |
| [`bw.arrayBNotInA(a, b)`](#bwarraybnotinaab) | Array Utilities | Return elements of b that are not present in a (set difference) |
| [`bw.multiArray(value, dims)`](#bwmultiarrayvaluedims) | Array Utilities | Create a multidimensional array filled with a value or function result |
| [`bw.naturalCompare(as, bs)`](#bwnaturalcompareasbs) | Array Utilities | Natural sort comparison function for use with `Array.sort()` |
| [`bw.loremIpsum(numChars, startSpot, startWithCapitalLetter = true)`](#bwloremipsumnumcharsstartspotstartwithcapitallettertrue) | Text Generation | Generate Lorem Ipsum placeholder text |
| [`bw.setIntervalX(callback, delay, repetitions)`](#bwsetintervalxcallbackdelayrepetitions) | Timing | Run `setInterval` with a maximum number of repetitions |
| [`bw.repeatUntil(testFn, successFn, failFn, delay = 250, maxReps = 10, lastFn)`](#bwrepeatuntiltestfnsuccessfnfailfndelay250maxreps10lastfn) | Timing | Repeat a test function until it returns truthy, or give up after max attempts |
| [`bw.setCookie(cname, cvalue, exdays, options = {})`](#bwsetcookiecnamecvalueexdaysoptions) | Browser Utilities | Set a browser cookie with expiration and options |
| [`bw.getCookie(cname, defaultValue)`](#bwgetcookiecnamedefaultvalue) | Browser Utilities | Get a browser cookie value by name |
| [`bw.getURLParam(key, defaultValue)`](#bwgeturlparamkeydefaultvalue) | Browser Utilities | Get a URL query parameter value from the current page URL |
| [`bw.copyToClipboard(text)`](#bwcopytoclipboardtext) | Browser Utilities | Copy text to the system clipboard (browser only) |
| [`bw.saveClientFile(fname, data)`](#bwsaveclientfilefnamedata) | File I/O | Save data to a file |
| [`bw.saveClientJSON(fname, data)`](#bwsaveclientjsonfnamedata) | File I/O | Save data as a JSON file with pretty formatting |
| [`bw.loadClientFile(fname, callback, options)`](#bwloadclientfilefnamecallbackoptions) | File I/O | Load a file by path (Node.js) or URL (browser via XHR) |
| [`bw.loadClientJSON(fname, callback)`](#bwloadclientjsonfnamecallback) | File I/O | Load a JSON file by path (Node.js) or URL (browser) |
| [`bw.loadLocalFile(callback, options)`](#bwloadlocalfilecallbackoptions) | File I/O | Prompt user to pick a local file via file dialog (browser only) |
| [`bw.loadLocalJSON(callback)`](#bwloadlocaljsoncallback) | File I/O | Prompt user to pick a local JSON file via file dialog (browser only) |
| [`bw.to(x, baseTypeOnly)`](#bwtoxbasetypeonly) | Utilities | Short alias of `bw.typeOf()` |
| [`bw.h(tag, attrs, content, options)`](#bwhtagattrscontentoptions) | Utilities | Hyperscript-style TACO constructor |
| [`bw.funcRegister(fn, name)`](#bwfuncregisterfnname) | Function Registry | Register a function in the global function registry |
| [`bw.funcGetById(name, errFn)`](#bwfuncgetbyidnameerrfn) | Function Registry | Retrieve a registered function by name |
| [`bw.funcGetDispatchStr(name, argStr)`](#bwfuncgetdispatchstrnameargstr) | Function Registry | Generate a dispatch string suitable for inline HTML event attributes |
| [`bw.funcUnregister(name)`](#bwfuncunregistername) | Function Registry | Remove a function from the registry |
| [`bw.funcGetRegistry()`](#bwfuncgetregistry) | Function Registry | Get a shallow copy of the function registry for inspection |
| [`bw.message(target, action, data)`](#bwmessagetargetactiondata) | Component | Dispatch a message to a component by UUID, CSS class, or selector |
| [`bw.formData(target)`](#bwformdatatarget) | Component | Collect form data from all input, select, and textarea elements within a container |
| [`bw.inspect(target, depth)`](#bwinspecttargetdepth) | Component | Inspect a DOM element and its subtree, returning a plain-object representation with bitwrench metadata at each node |
| [`bw.catalog(type)`](#bwcatalogtype) | Component | Query the BCCL component registry |
| [`bw.jsonPatch(obj, ops)`](#bwjsonpatchobjops) | Data Utilities | Apply RFC 6902 JSON Patch operations to a plain object |
| [`bw.actions`](#bwactions) | Server (bwserve) | Delegated dispatcher for `bw_act_*` class tokens: `{ enable, disable }` |
| [`bw.registerRemote(name, fn)`](#bwregisterremotenamefn) | Server (bwserve) | Register a function the server may invoke by name over bwserve |
| [`bw.connect(url)`](#bwconnecturl) | Server (bwserve) | Connect this page to a bwserve endpoint over Server-Sent Events |
| [`bw.apply(msg)`](#bwapplymsg) | Server (bwserve) | Apply one bwserve protocol message to the DOM |

---

## Core

### `bw.getVersion()`

Get version metadata object (v1-compatible callable API). Returns a copy of the build-time version info including version string, name, build date, and git hash.

**Returns:** `Object` — of VERSION_INFO with version, name, buildDate, etc.

---

### `bw.isNodeJS()`

Detect if running in Node.js environment. Useful for writing isomorphic code that behaves differently in Node.js vs browser. Uses `process.versions.node` for reliable detection that works in both CJS and ESM.

**Returns:** `boolean` — if Node.js, false if browser

**Example:**
```javascript
if (bw.isNodeJS()) { console.log('Running in Node.js'); } else { console.log('Running in browser'); }
```

---

### `bw.debug`

Debug flag. When true, emits console.warn for silent binding failures (missing paths, null refs, auto-created intermediate objects).

---

### `bw.typeOf(x, baseTypeOnly)`

Enhanced type detection that distinguishes arrays, dates, regexps, and more. Goes beyond `typeof` by using `Object.prototype.toString` to identify specific object types. Returns lowercase strings for primitives and arrays, PascalCase for built-in classes (Date, RegExp, Map, Set, etc.).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `x` | `*` | - Value to examine |
| `baseTypeOnly` | `boolean` | - If true, return only the base type ("object" for all objects) |

**Returns:** `string` — name as shown in table below

**Example:**
```javascript
// Primitives (lowercase): bw.typeOf("hello")         // => "string" bw.typeOf(42)              // => "number" bw.typeOf(true)            // => "boolean" bw.typeOf(undefined)       // => "undefined" bw.typeOf(null)            // => "null" bw.typeOf(Symbol('x'))     // => "symbol" bw.typeOf(42n)             // => "bigint" bw.typeOf(() => {})        // => "function" // Arrays (lowercase): bw.typeOf([1, 2, 3])       // => "array" // Built-in classes (PascalCase): bw.typeOf(new Date())      // => "Date" bw.typeOf(/abc/)           // => "RegExp" bw.typeOf(new Error())     // => "Error" bw.typeOf(new Map())       // => "Map" bw.typeOf(new Set())       // => "Set" bw.typeOf(new WeakMap())   // => "WeakMap" bw.typeOf(new WeakSet())   // => "WeakSet" bw.typeOf(Promise.resolve()) // => "Promise" // Typed arrays (PascalCase): bw.typeOf(new Uint8Array())   // => "Uint8Array" bw.typeOf(new Float64Array()) // => "Float64Array" bw.typeOf(new ArrayBuffer(8)) // => "ArrayBuffer" // Plain objects and custom classes: bw.typeOf({a: 1})          // => "Object" bw.typeOf(new MyClass())   // => "MyClass" (constructor.name) // baseTypeOnly mode: bw.typeOf([1,2], true)     // => "object"
```

---

### `bw.janitor`

Janitor: document-level cleanup for ungraceful teardown. Detects rude el.remove() / innerHTML='' and fires full unmount. flush() = synchronous process all pending disconnected nodes. enable()/disable() toggle monitoring. ON by default.

---

### `bw.parseJSONFlex(str)`

Parse a bwserve protocol message string, supporting both strict JSON and r-prefixed relaxed JSON (single-quoted strings, trailing commas). The r-prefix format is designed for C/C++ string literals where double-quote escaping is painful. The parser is a state machine that walks character by character — not a regex replace. Escaping: apostrophes inside single-quoted values must be escaped with backslash: r{'name':'Barry\'s room'}

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `str` | `string` | - JSON or r-prefixed relaxed JSON string |

**Returns:** `Object` — message object

---

### `bw.makeDataTable(config)`

Create a ready-to-use data table with title and responsive wrapper. Convenience wrapper around `bw.makeTable()` that adds a title heading, responsive horizontal scroll container, and defaults to striped + hover. Use this for the common case; use `bw.makeTable()` when you need a bare table element with no wrapper.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `config` | `Object` | - Table configuration |
| `config.title` | `string` | - Table title heading |
| `config.data` | `Array<Object>` | - Array of row objects |
| `config.columns` | `Array<Object>` | - Column definitions |
| `config.className` | `string` | - Additional CSS classes for the table |
| `config.striped` | `boolean` | - Add striped row styling |
| `config.hover` | `boolean` | - Add hover row highlighting |
| `config.responsive` | `boolean` | - Wrap table in responsive overflow div |

**Returns:** `Object` — object for table with wrapper

**Example:**
```javascript
const table = bw.makeDataTable({ title: "Users", data: [{ name: "Alice", role: "Admin" }], responsive: true });
```

---

### `bw.warnUnknownProps`

Warn when a component factory is handed an option it does not read. Why this exists: a wrong option name used to fail silently -- `makeButton({ href })` rendered a button that styled correctly and did not navigate; `makeTable({ headers, rows })` rendered an empty table. Both reviewed clean and shipped. See issue #92. The accepted keys come from each factory's own destructuring pattern, read from its source at call time, so there is no per-factory list to keep in sync. Property names survive minification. A factory that collects the rest of its props (`...eventHandlers`) accepts anything, so it is skipped, and so is any factory whose pattern cannot be parsed (older transpiled builds). Set `bw.warnUnknownProps = false` to silence it.

---

## DOM Generation

### `bw.raw(str)`

Mark a string as raw HTML so it will not be escaped by bw.html() or bw.create(). By default, bitwrench escapes all text content to prevent XSS. Use bw.raw() when you need to embed pre-sanitized HTML, entities, or inline markup.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `str` | `string` | - HTML string to mark as raw |

**Returns:** `Object` — object recognized by bw.html() and bw.create()

**Example:**
```javascript
bw.raw('Hello &mdash; World') // Used in TACO content: { t: 'p', c: bw.raw('Price: <strong>$9.99</strong>') }
```

---

### `bw.html(taco, options = {})`

Convert a TACO object (or array of TACOs) to an HTML string. This is the core rendering function — it works in both Node.js and browsers. Use it for server-side rendering, static site generation, or generating HTML snippets. Content is HTML-escaped by default; pass `{ raw: true }` to insert raw HTML. **Event handlers.** Give an `on*` attribute a function and it is registered with `bw.funcRegister` automatically; the attribute becomes a `bw.funcGetById('bw_fn_N')(event)` dispatch call. The string therefore carries a working handler with no binding step — it fires as soon as the HTML is in the document, however it got there, and still works after a clone or re-insert. The registry holds a live reference, so closures and bound functions are fine. Pass `options.fns` when the output must satisfy a strict CSP: handlers go into that per-render object and the element gets a `bw_fn_N` class instead of an inline attribute, leaving nothing executable in the markup. You bind them yourself; `bw.htmlPage` takes this path and emits the binder. Note that auto-registered handlers persist in the global registry for the life of the process — see `bw.funcUnregister`. This is not a concern for live UI, which uses `bw.create` and attaches real listeners without touching the registry.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `taco` | `Object|Array|string` | - TACO object, array of TACOs, or string |
| `options` | `Object` | - Rendering options |
| `options.raw` | `boolean` | - If true, skip HTML escaping on content |
| `options.fns` | `Object` | - Per-render handler registry. When supplied, `on*` functions are collected here as `{id: {fn, event}}` and emitted as a `bw_fn_N` class rather than an inline attribute (CSP-safe). Omit it for the auto-registered dispatch-string form. |

**Returns:** `string` — string

**Example:**
```javascript
bw.html({ t: 'h1', c: 'Hello' }) // => '<h1>Hello</h1>' bw.html({ t: 'div', a: { class: 'card' }, c: [ { t: 'p', c: 'Content here' } ]}) // => '<div class="card"><p>Content here</p></div>' // Handlers just work — nothing to wire up afterwards bw.html({ t: 'button', a: { onclick: function() { alert('hi'); } }, c: 'Go' }) // => '<button onclick="bw.funcGetById(\'bw_fn_0\')(event)">Go</button>' // CSP-safe variant: no inline handler, you bind the class yourself var fns = {}; bw.html({ t: 'button', a: { onclick: function() {} }, c: 'Go' }, { fns: fns }) // => '<button class="bw_fn_0">Go</button>'   fns = { bw_fn_0: {fn, event:'click'} }
```

---

### `bw.htmlPage(opts)`

Generate a complete, self-contained HTML document from TACO content. Produces a full `<!DOCTYPE html>` page with configurable runtime injection, func registry emission (so serialized event handlers work), optional theme, and extra head elements. Designed for static site generation, offline/airgapped use, and the "static site that isn't static" workflow.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `opts` | `Object` | - Page options |
| `opts.body` | `Object|string|Array` | - Body content: TACO, string, or array |
| `opts.title` | `string` | - Page title |
| `opts.state` | `Object` | - State for ${expr} resolution in bw.html() |
| `opts.runtime` | `string` | - Runtime level: 'inline'|'cdn'|'shim'|'none' |
| `opts.css` | `string` | - Additional CSS for <style> block |
| `opts.theme` | `string|Object` | - Theme preset name or config object |
| `opts.head` | `Array` | - Extra TACO elements rendered into <head> |
| `opts.favicon` | `string` | - Favicon URL |
| `opts.lang` | `string` | - HTML lang attribute |

**Returns:** `string` — HTML document string

**Example:**
```javascript
bw.htmlPage({ title: 'My App', body: { t: 'h1', c: 'Hello World' }, runtime: 'shim' })
```

---

### `bw.create(taco, options)`

Create a hydrated, detached DOM element from a TACO object (browser only). v2.1 Phase verb: the element is fully wired (state, handles, slots, events, unmount closure) but NOT registered and mounted() is NOT fired. Registration happens in mountTree(); mounted fires there too.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `taco` | `Object` | - TACO object with {t, a, c, o} |
| `options` | `Object` | - Creation options |

**Returns:** `Element|Text|DocumentFragment` — element, text node, or fragment

---

### `bw.hydrate(el, taco)`

Wire lifecycle from taco.o onto an existing DOM node. Idempotent. Used for Path S adoption: html() output → mountTree → hydrate adds behavior.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `el` | `Element` | - Existing DOM element |
| `taco` | `Object` | - TACO object whose o.* to wire |

---

### `bw.mountTree(el)`

Walk a subtree, register every addressable node, fire mounted() hooks. Idempotent: already-registered nodes (same element) are skipped silently. Mounted fires synchronously, parent before children.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `el` | `Element` | - Root of subtree to mount |

---

### `bw.unmount(el)`

Unmount an element and its entire subtree. Fire unmount hooks self-first, then descendants in document order. Strip ALL bitwrench properties. Deregister from _nodeMap.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `el` | `Element` | - Element to unmount |

---

### `bw.unmountChildren(el)`

Unmount descendants only; the element's own state/subs/registration are untouched.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `el` | `Element` | - Parent element whose children to unmount |

---

### `bw.clear(ref)`

Empty a container: run unmount hooks on its children, then remove them. This is the verb to reach for instead of `el.innerHTML = ''`, which drops the children without firing `o.unmount`, leaking whatever they held (subscriptions, timers, observers).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `ref` | `string|Element` | - Element ID, bw_uuid_* class, CSS selector, or element |

**Returns:** `Element|null` — emptied element, or null if not found

**Example:**
```javascript
bw.clear('#list');                  // empties #list, hooks fire bw.mount('#list', rows.map(row));   // refill it
```

---

### `bw.remove(ref)`

Remove an element from the DOM and clean it up. Convenience compound: unmount(el) + el.remove().

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `ref` | `string|Element` | - Element reference |

---

### `bw.detach(el)`

Detach an element from the DOM but keep it registered (keep-alive). The element stays addressable and its subscriptions keep delivering. Janitor will not reap detach-exempt elements.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `el` | `Element` | - Element to detach |

---

### `bw.mount(target, taco, options)`

Mount a TACO into a target element. Returns the root element (single root), first node (array), or null. This is the primary compound verb for putting UI on the page. Composes atomics: unmountChildren(target) → clear → create(content) → insert → mountTree(target).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `target` | `string|Element` | - CSS selector or DOM element to mount into |
| `taco` | `Object|Array` | - TACO object or array to render |
| `options` | `Object` | - Creation options |

**Returns:** `Element|null` — root element, or null

---

### `bw.DOM(target, taco, options)`

Mount a TACO into a target element. Exact alias of `bw.mount()` (v2.1 §2): same function, same return value -- keep it to call `el.bw.*`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `target` | `string|Element` | - Element ID, CSS selector, bw_uuid_* class, or element |
| `taco` | `Object|Array|string` | - TACO (or array of TACOs) to mount |
| `options` | `Object` | - Passed through to bw.create() |

**Returns:** `Element|null` — mounted root element

**Example:**
```javascript
var el = bw.DOM('#app', { t: 'h1', c: 'Hello' });
```

---

### `bw.append(target, content, opts)`

Append content to a target. create → insert (respecting opts.before) → mountTree. Returns the new child element.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `target` | `string|Element` | - Container |
| `content` | `Object` | - TACO to append |
| `opts` | `Object` | - {before: Element|number} for positioning |

**Returns:** `Element|null` — appended element

---

### `bw.replace(ref, taco)`

Replace an existing element with new content. unmount(old) → create(taco) → insert at position → mountTree. Returns new element. null taco = remove.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `ref` | `Element` | - Element to replace |
| `taco` | `Object|null` | - Replacement TACO, or null to just remove |

**Returns:** `Element|null` — new element, or null

---

### `bw.refresh(ref)`

Refresh a component: unmountChildren → re-render → mountTree. Render throw propagates. Emits bw:refresh.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `ref` | `string|Element` | - Component to refresh |

**Returns:** `Element|null` — element

---

### `bw.updateSlot(ref, name, value)`

Update a specific slot on a component by reference.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `ref` | `string|Element` | - Component reference |
| `name` | `string` | - Slot name |
| `value` | `*` | - Value to set |

**Returns:** `boolean` — if slot was updated

---

### `bw.syncChildren(parentEl, items, opts)`

Keyed reconciliation: match existing children by `el._bw_key`, move/add/remove to match `items` order. Moved nodes are the SAME DOM nodes (state/focus survives).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `parentEl` | `Element` | - Container element |
| `items` | `Array` | - Data array for desired children |
| `opts` | `Object` | - {key: fn(item)→string, create: fn(item)→TACO, update: fn(el, item)} |

---

### `bw.render(target, position, taco)`

Render a TACO into the DOM at a specific position relative to a target. Thin convenience factory over `bw.append()` / `bw.replace()`. Every code path goes through the v2.1 lifecycle pipeline (create → insert → mountTree), so mounted/unmount hooks, state, handles, and the janitor all work automatically.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `target` | `Element|string` | - Target element or CSS selector |
| `position` | `string` | - 'append', 'prepend', 'replace', 'before', 'after' |
| `taco` | `Object` | - TACO object to render |

**Returns:** `{ el: Element|null, ok: boolean, error: string|null }`

**Example:**
```javascript
var r = bw.render('#log', 'append', { t: 'li', c: 'Saving...' }); if (r.ok) bw.patch(r.el, 'Saved');   // r.el is the new element else console.warn(r.error);
```

---

## DOM Selection

### `bw.el(target, apply)`

Look up a single DOM element by ID, CSS selector, UUID, or element ref. Optionally apply content or a function to the resolved element. Resolution order for string targets: 1. Check `bw._nodeMap[id]` cache (O(1), stale entries auto-pruned) 2. `document.getElementById(id)` 3. `document.querySelector(id)` for selectors starting with # or . 4. Class-based lookup for `bw_uuid_*` tokens With one argument, returns the element (or null). With two arguments, applies the second argument to the element and returns the element: - string/number: sets `el.textContent` - function: calls `apply(el)`, returns el - TACO object: clears children, mounts TACO via `bw.create()` - array: clears children, appends each item (string -> text node, TACO -> element)

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `target` | `string|Element` | - Element ref, ID, CSS selector, or bw_uuid_* class |
| `apply` | `string|number|Function|Object|Array` | - Content or function to apply |

**Returns:** `Element|null` — DOM element, or null if not found

**Example:**
```javascript
bw.el('#title')                         // lookup bw.el('#title', 'Hello')                // set text content bw.el('#app', { t: 'h1', c: 'Hi' })    // mount TACO bw.el('.card', function(el) {           // apply function el.style.opacity = '0.5'; })
```

---

### `bw.addClass(ref, names)`

Add one or more classes to every matched element. Changing a class is the cheapest update a component can make: no node is created, nothing is unmounted, focus and scroll are untouched.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `ref` | `string|Element|Array` | - Element id, CSS selector, element, or list of elements |
| `names` | `string|Array<string>` | - Class name, space-separated names, or array |

**Returns:** `Array<Element>` — elements that were changed

**Example:**
```javascript
bw.addClass('save-btn', 'is_busy'); bw.addClass('.row', ['zebra', 'tight']);
```

---

### `bw.removeClass(ref, names)`

Remove one or more classes from every matched element.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `ref` | `string|Element|Array` | - Element id, CSS selector, element, or list of elements |
| `names` | `string|Array<string>` | - Class name, space-separated names, or array |

**Returns:** `Array<Element>` — elements that were changed

**Example:**
```javascript
bw.removeClass('save-btn', 'is_busy');
```

---

### `bw.toggleClass(ref, names, force)`

Toggle one or more classes on every matched element, or force them on/off. With a third argument the class is set rather than flipped, which is what you want when driving a class from state: `bw.toggleClass(keys, 'down', isDown)`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `ref` | `string|Element|Array` | - Element id, CSS selector, element, or list of elements |
| `names` | `string|Array<string>` | - Class name, space-separated names, or array |
| `force` | `boolean` | - true adds, false removes, omitted flips |

**Returns:** `Array<Element>` — elements that were changed

**Example:**
```javascript
bw.toggleClass('#panel', 'open');                         // flip bw.toggleClass('#onscreen rect', 'down', false);          // force off, every match bw.toggleClass(el, 'wrong', result !== 'ok');             // drive it from state
```

---

### `bw.hasClass(ref, name)`

Does the first matched element carry this class?

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `ref` | `string|Element|Array` | - Element id, CSS selector, element, or list of elements |
| `name` | `string` | - Class name |

**Returns:** `boolean` — when the first match has it

**Example:**
```javascript
if (bw.hasClass('#panel', 'open')) bw.removeClass('#panel', 'open');
```

---

### `bw.$(selector, apply)`

DOM selection helper that always returns an array (browser only). Wraps `querySelectorAll` and normalizes the result to a plain Array so you can use `.map()`, `.filter()`, etc. directly. Accepts CSS selectors, single elements, NodeLists, or arrays. With an optional second argument, applies content or a function to every matched element (same apply rules as `bw.el()`): - string/number: sets `el.textContent` - function: calls `apply(el)` for each element - TACO object: clears children, mounts TACO via `bw.create()` - array: clears children, appends each item

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `selector` | `string|Element|Array` | - CSS selector, element, or array |
| `apply` | `string|number|Function|Object|Array` | - Content or function to apply |

**Returns:** `Array` — of DOM elements

**Example:**
```javascript
bw.$('.card')                           // => [div.card, div.card, ...] bw.$('.status', 'Online')               // set text on all .status elements bw.$('.card', function(el) {            // apply function to each el.style.opacity = '0.5'; })
```

---

## Identifiers

### `bw.uuid(prefix)`

Generate a unique identifier string for DOM elements or application use. Uses `crypto.randomUUID()` when available (modern browsers), otherwise falls back to a timestamp + counter + random combination. Optional prefix creates namespaced IDs like `bw_card_<hex>` for easier debugging.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `prefix` | `string` | - Optional namespace prefix (e.g. "card", "todo") |

**Returns:** `string` — identifier (e.g. "bw_card_a1b2c3d4")

**Example:**
```javascript
bw.uuid()          // => "bw_m3x9k_1_7f2h4j6a8" bw.uuid('card')    // => "bw_card_a1b2c3d4e5f6"
```

---

### `bw.assignUUID(taco, forceNew)`

Assign a UUID to a TACO object by appending a `bw_uuid_*` token to `taco.a.class`. Idempotent by default — calling twice returns the same UUID. Pass `forceNew=true` to replace an existing UUID (useful in loops where each TACO needs a unique ID).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `taco` | `Object` | - A TACO object `{t, a, c, o}` |
| `forceNew` | `boolean` | - If true, replaces any existing UUID with a new one |

**Returns:** `string` — UUID string (e.g. 'bw_uuid_a1b2c3d4e5')

**Example:**
```javascript
var card = bw.makeStatCard({ value: '0', label: 'Scans' }); var uuid = bw.assignUUID(card);        // 'bw_uuid_a1b2c3d4e5' var same = bw.assignUUID(card);        // same UUID (idempotent) var diff = bw.assignUUID(card, true);  // new UUID (forced)
```

---

### `bw.getUUID(tacoOrElement)`

Read the UUID from a TACO object or DOM element. Pure getter, no side effects.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `tacoOrElement` | `Object|Element` | - A TACO object or DOM element |

**Returns:** `string|null` — UUID string, or null if none assigned

**Example:**
```javascript
bw.getUUID(card)       // 'bw_uuid_a1b2c3d4e5' (from TACO) bw.getUUID(domEl)      // 'bw_uuid_a1b2c3d4e5' (from DOM element) bw.getUUID({t:'div'})  // null (no UUID)
```

---

### `bw.escapeHTML(str)`

Escape HTML special characters to prevent XSS. Converts &, <, >, ", ', and / to their HTML entity equivalents. Used automatically by `bw.html()` unless raw mode is enabled.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `str` | `string` | - String to escape |

**Returns:** `string` — string safe for HTML insertion

**Example:**
```javascript
bw.escapeHTML('<b>Hello</b> & "world"') // => '&lt;b&gt;Hello&lt;&#x2F;b&gt; &amp; &quot;world&quot;'
```

---

## State Management

### `bw.update(ref, data)`

Update a component by dispatching to el.bw.update(data) if defined. Emits bw:statechange. If no update handle, emits specific diag warning. NEVER falls back to refresh.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `ref` | `string|Element` | - Component to update |
| `data` | `*` | - Data to pass to el.bw.update |

**Returns:** `Element|null` — element

---

### `bw.patch(id, content, attr)`

Targeted DOM update by element ID — change one element's content or attribute without rebuilding the entire component tree. Use `bw.patch()` for lightweight value updates (scores, labels, counters) and `bw.refresh()` for full structural re-renders.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `id` | `string|Element` | - Element ID, bw_uuid_* class, CSS selector, or DOM element. Uses node cache for O(1) lookup; falls back to DOM query on cache miss. |
| `content` | `string|Object` | - New text content, or TACO object to replace children |
| `attr` | `string` | - If provided, sets this attribute instead of content |

**Returns:** `Element|null` — patched element, or null if not found

**Example:**
```javascript
bw.patch('score-display', '42');          // update text content bw.patch('status', 'active', 'class');    // update an attribute bw.patch('info', { t: 'em', c: 'new' }); // replace children with TACO
```

---

### `bw.patchAll(patches)`

Batch version of `bw.patch()` — update multiple elements in one call. Useful for updating several independent values simultaneously, such as a dashboard with multiple counters.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `patches` | `Object` | - Map of { elementId: newContent, ... } |

**Returns:** `Object` — of { elementId: patchedElement|null, ... }

**Example:**
```javascript
bw.patchAll({ 'cpu-display': '78%', 'mem-display': '4.2 GB', 'disk-display': '120 GB free' });
```

---

## Events (DOM)

### `bw.emit(target, eventName, detail)`

Emit a custom DOM event on an element. Events are prefixed with `bw:` to avoid collision with native events and bubble by default so ancestor elements can listen. Use with `bw.on()` for DOM-scoped communication between components.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `target` | `string|Element` | - Element ID, bw_uuid_* class, CSS selector, or DOM element. Uses node cache for O(1) lookup; falls back to DOM query on cache miss. |
| `eventName` | `string` | - Event name (will be prefixed with 'bw:') |
| `detail` | `*` | - Data to pass with the event |

**Example:**
```javascript
bw.emit('#my-widget', 'statechange', { count: 42 }); // Dispatches CustomEvent 'bw:statechange' on the element
```

---

### `bw.on(target, eventName, handler)`

Listen for a custom bitwrench event on a DOM element. Handler receives `(detail, event)` for convenience — the detail object is the first argument so you don't need to destructure `e.detail`. Events bubble, so you can listen on an ancestor element.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `target` | `string|Element` | - Element ID, bw_uuid_* class, CSS selector, or DOM element. Uses node cache for O(1) lookup; falls back to DOM query on cache miss. |
| `eventName` | `string` | - Event name (will be prefixed with 'bw:') |
| `handler` | `Function` | - Called with (detail, event) |

**Returns:** `Element|null` — element (for chaining), or null if not found

**Example:**
```javascript
bw.on(document.body, 'statechange', function(detail) { console.log('State changed:', detail); });
```

---

## Pub/Sub

### `bw.pub(topic, detail)`

Publish to a topic, calling all subscribers in registration order. Application-scoped pub/sub decoupled from the DOM tree. Each subscriber is wrapped in try/catch so one bad handler can't break others. Use `bw.pub()`/`bw.sub()` for app-wide communication; use `bw.emit()`/`bw.on()` for DOM-scoped events.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `topic` | `string` | - Topic name (plain string, no prefix) |
| `detail` | `*` | - Data to pass to subscribers |

**Returns:** `number` — of successfully called subscribers (including wildcard matches)

**Example:**
```javascript
bw.pub('score:updated', { player: 'X', score: 10 }); // Wildcard subscribers matching 'score:*' will also fire
```

---

### `bw.sub(topic, handler, el)`

Subscribe to a topic. Returns an unsub() function. Supports wildcard patterns: a topic ending in `*` matches any published topic that starts with the prefix before the `*`. For example, `'agui:*'` matches `'agui:ready'`, `'agui:error'`, etc. The handler receives `(detail, topic)` so it can distinguish which topic fired. Optional third argument ties the subscription to a DOM element's lifecycle -- when `bw.unmount()` is called on that element, the subscription is automatically removed, preventing memory leaks.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `topic` | `string` | - Topic name, or wildcard pattern ending in '*' |
| `handler` | `Function` | - Called with (detail, topic) on each publish |
| `el` | `Element` | - Optional DOM element to tie lifecycle to |

**Returns:** `Function` — to unsubscribe

**Example:**
```javascript
var unsub = bw.sub('score:updated', function(detail) { console.log(detail.player, 'scored', detail.score); }); // Later: unsub() to stop listening // Wildcard: listen to all 'agui:' topics bw.sub('agui:*', function(detail, topic) { console.log('Got', topic, detail); });
```

---

### `bw.unsub(topic, handler)`

Unsubscribe a handler by reference from a topic. Removes ALL instances of the given handler on the topic. Alternative to calling the unsub function returned by `bw.sub()`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `topic` | `string` | - Topic name |
| `handler` | `Function` | - The handler to remove (by reference equality) |

**Returns:** `number` — of removed subscriptions

---

### `bw.once(topic, handler, el)`

Subscribe to a topic for a single event only. The subscription is automatically removed after the first publish. Equivalent to manually calling unsub() inside a bw.sub() handler, but avoids the common bug of forgetting to unsubscribe.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `topic` | `string` | - Topic name |
| `handler` | `Function` | - Called once with (detail) on the next publish |
| `el` | `Element` | - Optional DOM element to tie lifecycle to |

**Returns:** `Function` — to cancel the subscription before it fires

**Example:**
```javascript
bw.once('data:loaded', function(detail) { console.log('Received:', detail); // No need to unsubscribe -- already done automatically }); // Cancel before it fires: var cancel = bw.once('timeout', handler); cancel(); // handler will never be called
```

---

### `bw.derive(inputs, fn, outTopic, opts)`

Declared dataflow: recompute fn(inputs...) on any input publish. Returns a disposer function. Optionally ties to an element lifecycle.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `inputs` | `Array<string>` | - Topic names to subscribe to |
| `fn` | `Function` | - Combiner: fn(...latestValues) → result |
| `outTopic` | `string` | - Topic to publish result on |
| `opts` | `Object` | - {seed: [], immediate: bool, el: Element} |

**Returns:** `Function`

---

## CSS & Styling

### `bw.css(rules, options = {})`

Generate CSS from JavaScript objects. Converts an object of `{ selector: { prop: value } }` rules into a CSS string. CamelCase property names are auto-converted to kebab-case (e.g. `fontSize` → `font-size`). Accepts nested arrays of rule objects.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `rules` | `Object|Array|string` | - CSS rules as JS objects, array of rule objects, or raw CSS string |
| `options` | `Object` | - Generation options |
| `options.minify` | `boolean` | - Minify output (no whitespace) |

**Returns:** `string` — string

**Example:**
```javascript
bw.css({ '.card': { padding: '1rem', fontSize: '14px', borderRadius: '8px' } }) // => '.card {\n  padding: 1rem;\n  font-size: 14px;\n  border-radius: 8px;\n}'
```

---

### `bw.injectCSS(css, options = {})`

Inject CSS into the document head (browser only). Creates or reuses a `<style>` element (identified by `id`). Can accept raw CSS strings or JS rule objects (which are converted via `bw.css()`). By default appends to existing content; set `append: false` to replace.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `css` | `string|Object|Array` | - CSS string, or JS rule objects to convert |
| `options` | `Object` | - Injection options |
| `options.id` | `string` | - ID for the style element |
| `options.append` | `boolean` | - Append to existing CSS (false to replace) |
| `options.minify` | `boolean` | - Minify CSS generated from rule objects. Output is readable by default; strings are inserted exactly as written. |

**Returns:** `Element` — style element

**Example:**
```javascript
bw.injectCSS('.my-class { color: red; }'); bw.injectCSS({ '.card': { padding: '1rem' } }, { id: 'card-styles' }); bw.injectCSS({ '.card': { padding: '1rem' } }, { id: 'card-styles', minify: true });
```

---

### `bw.s()`

Merge multiple style objects into one (left-to-right). Like `Object.assign()` for styles, but filters out null/undefined arguments. Compose inline styles or CSS rule objects without mutation.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `styles` | `...Object` | - Style objects to merge (left-to-right) |

**Returns:** `Object` — style object

**Example:**
```javascript
var style = bw.s({ display: 'flex' }, { gap: '1rem' }, { color: 'red' }); // => { display: 'flex', gap: '1rem', color: 'red' }
```

---

### `bw.responsive(selector, breakpoints)`

Generate responsive CSS with media query breakpoints. Produces a CSS string with `@media (min-width)` rules for standard breakpoints. These match the grid system and theme.breakpoints: sm: 576px, md: 768px, lg: 992px, xl: 1200px Pass the result to `bw.injectCSS()`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `selector` | `string` | - CSS selector |
| `breakpoints` | `Object` | - Object with keys: base, sm, md, lg, xl |

**Returns:** `string` — CSS string (pass to bw.injectCSS)

**Example:**
```javascript
var css = bw.responsive('.grid', { base: { gridTemplateColumns: '1fr' }, md:   { gridTemplateColumns: '1fr 1fr' }, lg:   { gridTemplateColumns: '1fr 1fr 1fr' } }); bw.injectCSS(css);
```

---

### `bw.makeStyles(config)`

Generate a complete styles object from seed colors and layout config. Pure function — no DOM, no state, no side effects. All parameters are optional. Defaults to the bitwrench default palette.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `config` | `Object` | - Style configuration |
| `config.primary` | `string` | - Primary brand color hex |
| `config.secondary` | `string` | - Secondary color hex |
| `config.tertiary` | `string` | - Tertiary color hex (defaults to primary) |
| `config.spacing` | `string` | - 'compact' | 'normal' | 'spacious' |
| `config.radius` | `string` | - 'none' | 'sm' | 'md' | 'lg' | 'pill' |

**Returns:** `Object` — css, alternateCss, rules, alternateRules, palette, alternatePalette, isLightPrimary }

**Example:**
```javascript
var styles = bw.makeStyles({ primary: '#4f46e5', secondary: '#d97706' }); console.log(styles.palette.primary.base); // '#4f46e5' // styles.css contains all themed CSS — nothing injected
```

---

### `bw.applyStyles(styles, scope)`

Inject styles into the DOM with optional scoping. Takes a styles object from `makeStyles()` and creates a single `<style>` element in `<head>`. If a scope selector is provided, all CSS rules are wrapped under that selector. Alternate CSS is wrapped under `.bw_theme_alt`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `styles` | `Object` | - Result of `bw.makeStyles()` |
| `scope` | `string` | - Scope selector (e.g. '#my-dashboard', '.preview'). Omit for global. |

**Returns:** `Element|null` — `<style>` element, or null in Node.js

**Example:**
```javascript
var styles = bw.makeStyles({ primary: '#4f46e5' }); bw.applyStyles(styles);                     // global bw.applyStyles(styles, '#my-dashboard');     // scoped
```

---

### `bw.loadStyles(config, scope)`

Generate and apply styles in one call. Convenience wrapper. Equivalent to: `bw.applyStyles(bw.makeStyles(config), scope)`

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `config` | `Object` | - Style configuration (same as `makeStyles`) |
| `scope` | `string` | - Scope selector (same as `applyStyles`) |

**Returns:** `Object` — styles object (same as `makeStyles` return value: `{css, alternateCss, palette, alternatePalette, rules, alternateRules, isLightPrimary}`)

**Example:**
```javascript
bw.loadStyles();                                          // defaults, global bw.loadStyles({ primary: '#4f46e5' });                    // custom, global bw.loadStyles({ primary: '#4f46e5' }, '#my-dashboard');   // custom, scoped
```

---

### `bw.loadStructural()`

Inject structural (theme-independent) CSS only. Idempotent.

**Returns:** `Element|null` — `<style>` element, or null in Node.js

---

### `bw.scopeRulesUnder(rules, prefix)`

Prefix every selector in a rules object with a scope selector. Useful for wrapping site-level CSS under `.bw_theme_alt` for dark mode.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `rules` | `Object` | - CSS rules object (selector -> declarations) |
| `prefix` | `string` | - Scope prefix (e.g. '.bw_theme_alt') |

**Returns:** `Object` — rules object with scoped selectors

**Example:**
```javascript
var altRules = bw.scopeRulesUnder(myRules, '.bw_theme_alt'); bw.injectCSS(bw.css(altRules));
```

---

### `bw.loadReset()`

Inject the CSS reset (box-sizing, html/body font, reduced-motion). Idempotent — if already injected, returns the existing `<style>` element.

**Returns:** `Element|null` — `<style>` element, or null in Node.js

**Example:**
```javascript
bw.loadReset();  // inject once, safe to call multiple times
```

---

### `bw.setThemeMode(mode, scope)`

Set the theme mode on all matching elements.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `mode` | `string` | - 'primary' or 'alternate' |
| `scope` | `string` | - Selector. Omit for global (<html>). |

**Returns:** `Object` — mode, count } — the mode set and number of elements affected

---

### `bw.toggleThemeMode(scope)`

Toggle between primary and alternate theme palettes. Determines current mode from first matched element, then sets inverse on all.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `scope` | `string|Element` | - Selector or element. Omit for global. |

**Returns:** `string` — mode after toggle: 'primary' or 'alternate' (based on first element)

---

### `bw.clearStyles(scope)`

Remove injected styles for a given scope. Finds the `<style>` element by id and removes it. Also removes the `bw_theme_alt` class from the relevant element.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `scope` | `string` | - Scope selector. Omit to remove global styles. |

**Example:**
```javascript
bw.clearStyles();                    // remove global styles bw.clearStyles('#my-dashboard');     // remove scoped styles bw.clearStyles('reset');             // remove the CSS reset
```

---

### `bw.generateTypeScale(base, ratio)`

Generate a modular type scale from a base size and ratio.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `base` | `number` | - Base font size in px (default 16) |
| `ratio` | `number` | - Scale ratio (default 1.200) |

**Returns:** `Object` — xs, sm, base, lg, xl, '2xl', '3xl', '4xl' } in px

---

## Component Builders

### `bw.makeTable(config)`

Create a sortable TACO table from an array of row objects. Returns a bare `<table>` TACO — no wrapper, title, or responsive scroll. Use this when you need full control over table placement, or when embedding the table inside your own layout. For a ready-to-use table with title, responsive wrapper, and defaults (striped + hover), use `bw.makeDataTable()`. Auto-detects columns from data keys if not specified. Supports click-to-sort headers with ascending/descending indicators.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `config` | `Object` | - Table configuration |
| `config.data` | `Array<Object>` | - Array of row objects to display |
| `config.columns` | `Array<Object>` | - Column definitions with key, label, render |
| `config.className` | `string` | - Additional CSS classes for table element |
| `config.sortable` | `boolean` | - Enable click-to-sort headers |
| `config.onSort` | `Function` | - Sort callback (column, direction) |
| `config.selectable` | `boolean` | - Enable row selection on click |
| `config.onRowClick` | `Function` | - Row click callback (row, index, event) |
| `config.pageSize` | `number` | - Rows per page (enables pagination when set) |
| `config.currentPage` | `number` | - Current page number (1-based) |
| `config.onPageChange` | `Function` | - Page change callback (newPage) |

**Returns:** `Object` — object for table (with optional pagination controls)

**Example:**
```javascript
bw.makeTable({ data: [ { name: 'Alice', age: 30 }, { name: 'Bob', age: 25 } ], columns: [ { key: 'name', label: 'Name' }, { key: 'age', label: 'Age' } ], selectable: true, onRowClick: function(row, i) { console.log('clicked', row.name); }, pageSize: 10, currentPage: 1, onPageChange: function(page) { console.log('page', page); } });
```

---

### `bw.makeTableFromArray(config)`

Create a table from a 2D array. Converts a 2D array into the object-array format that `bw.makeTable()` expects, then delegates. By default, the first row is used as column headers. All standard `makeTable` props (striped, hover, sortable, columns, onSort, etc.) are passed through.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `config` | `Object` | - Configuration object |
| `config.data` | `Array<Array>` | - 2D array of values |
| `config.headerRow` | `boolean` | - Treat first row as column headers |
| `config.striped` | `boolean` | - Striped rows |
| `config.hover` | `boolean` | - Hover highlight |
| `config.sortable` | `boolean` | - Enable sort |
| `config.columns` | `Array<Object>` | - Override auto-generated column defs |
| `config.className` | `string` | - Additional CSS classes |
| `config.onSort` | `Function` | - Sort callback |
| `config.sortColumn` | `string` | - Currently sorted column key |
| `config.sortDirection` | `string` | - Sort direction |

**Returns:** `Object` — object for table

**Example:**
```javascript
bw.makeTableFromArray({ data: [ ['Name', 'Role', 'Status'], ['Alice', 'Engineer', 'Active'], ['Bob', 'Designer', 'Away'] ], striped: true, hover: true });
```

---

### `bw.makeBarChart(config)`

Create a vertical bar chart from data. Renders a pure-CSS bar chart using flexbox and percentage heights. No canvas, SVG, or external charting library required.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `config` | `Object` | - Chart configuration |
| `config.data` | `Array<Object>` | - Array of data objects |
| `config.labelKey` | `string` | - Key for bar labels |
| `config.valueKey` | `string` | - Key for bar values |
| `config.title` | `string` | - Chart title |
| `config.color` | `string` | - Bar color (hex or CSS color) |
| `config.height` | `string` | - Height of the chart area |
| `config.formatValue` | `Function` | - Value label formatter: (value) => string |
| `config.showValues` | `boolean` | - Show value labels above bars |
| `config.showLabels` | `boolean` | - Show labels below bars |
| `config.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object

**Example:**
```javascript
bw.makeBarChart({ data: [ { label: 'Jan', value: 12400 }, { label: 'Feb', value: 15800 }, { label: 'Mar', value: 9200 } ], title: 'Monthly Revenue', color: '#0077b6', formatValue: (v) => '$' + (v / 1000).toFixed(1) + 'k' });
```

---

### `bw.variantClass(v)`

Convert a variant name to a single palette class. All BCCL components use this: variant='primary' → class includes 'bw_primary'. The CSS palette class (.bw-primary) sets bg/color/border; component-specific overrides in generatePaletteClasses() adjust per component type.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `v` | `string` | - Variant name (e.g. 'primary', 'danger', 'outline_primary') |

**Returns:** `string` — class string

---

### `bw.makeCard(props = {})`

Create a card component with optional header, body, footer, and image support Supports images (top, bottom, left, right), shadow levels, subtitle, hover animation, and custom section class overrides. For horizontal image layouts (left/right), content is wrapped in a row grid.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Card configuration |
| `props.title` | `string` | - Card title displayed in the body |
| `props.subtitle` | `string` | - Card subtitle (muted text below title) |
| `props.content` | `string|Object|Array` | - Card body content (string, TACO, or array) |
| `props.footer` | `string|Object` | - Card footer content |
| `props.header` | `string|Object` | - Card header content |
| `props.image` | `Object` | - Card image configuration |
| `props.image.src` | `string` | - Image source URL |
| `props.image.alt` | `string` | - Image alt text |
| `props.imagePosition` | `string` | - Image position ("top", "bottom", "left", "right") |
| `props.variant` | `string` | - Color variant (e.g. "primary", "danger") |
| `props.bordered` | `boolean` | - Show card border |
| `props.shadow` | `string` | - Shadow level ("none", "sm", "md", "lg") |
| `props.hoverable` | `boolean` | - Enable hover lift animation |
| `props.className` | `string` | - Additional CSS classes |
| `props.style` | `Object` | - Inline style object |
| `props.headerClass` | `string` | - Additional header CSS classes |
| `props.bodyClass` | `string` | - Additional body CSS classes |
| `props.footerClass` | `string` | - Additional footer CSS classes |
| `props.state` | `Object` | - Component state object |

**Returns:** `Object` — object representing a card component

**Example:**
```javascript
const card = makeCard({ title: "Status", content: "All systems operational", variant: "success" }); bw.DOM("#app", card);
```

---

### `bw.makeButton(props = {})`

Create a button component

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Button configuration |
| `props.text` | `string` | - Button label text |
| `props.variant` | `string` | - Color variant (e.g. "primary", "secondary", "danger") |
| `props.size` | `string` | - Size variant ("sm" or "lg") |
| `props.disabled` | `boolean` | - Whether the button is disabled |
| `props.onclick` | `Function` | - Click event handler |
| `props.type` | `string` | - HTML button type ("button", "submit", "reset") |
| `props.className` | `string` | - Additional CSS classes |
| `props.style` | `Object` | - Inline style object |

**Returns:** `Object` — object representing a button element

**Example:**
```javascript
const btn = makeButton({ text: "Save", variant: "success", onclick: () => console.log("saved") }); // String shorthand: const ok = makeButton("OK");
```

---

### `bw.makeContainer(props = {})`

Create a container component for centering and constraining content width

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Container configuration |
| `props.fluid` | `boolean` | - Use full-width fluid container |
| `props.children` | `Array|Object|string` | - Child content |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a container div

**Example:**
```javascript
const container = makeContainer({ fluid: true, children: [makeRow({ children: [...] })] });
```

---

### `bw.makeRow(props = {})`

Create a flexbox row for the grid system

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Row configuration |
| `props.children` | `Array|Object|string` | - Child columns |
| `props.className` | `string` | - Additional CSS classes |
| `props.gap` | `number` | - Gutter size 0-5 applied via bw_g_{gap} (0 = no gutter; omit for the default) |

**Returns:** `Object` — object representing a grid row

**Example:**
```javascript
const row = makeRow({ gap: 4, children: [makeCol({ size: 6, content: "Left" }), makeCol({ size: 6, content: "Right" })] });
```

---

### `bw.makeCol(props = {})`

Create a grid column with responsive sizing Supports both fixed and responsive column sizes. Pass an object for responsive breakpoints (e.g. {xs: 12, md: 6, lg: 4}).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Column configuration |
| `props.size` | `number|Object` | - Column size (1-12) or responsive object {xs, sm, md, lg, xl} |
| `props.offset` | `number` | - Column offset (1-12) |
| `props.push` | `number` | - Column push (1-12) |
| `props.pull` | `number` | - Column pull (1-12) |
| `props.content` | `Array|Object|string` | - Column content (alias for children) |
| `props.children` | `Array|Object|string` | - Column content |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a grid column

**Example:**
```javascript
const col = makeCol({ size: { xs: 12, md: 6 }, content: "Responsive column" });
```

---

### `bw.makeNav(props = {})`

Create a navigation component with tabs or pills styling

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Nav configuration |
| `props.items` | `Array<Object>` | - Navigation items |
| `props.items[].text` | `string` | - Item display text |
| `props.items[].href` | `string` | - Item link URL |
| `props.items[].active` | `boolean` | - Whether this item is active |
| `props.items[].disabled` | `boolean` | - Whether this item is disabled |
| `props.pills` | `boolean` | - Use pill styling instead of tabs |
| `props.vertical` | `boolean` | - Stack items vertically |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a nav element

**Example:**
```javascript
const nav = makeNav({ pills: true, items: [ { text: "Home", href: "/", active: true }, { text: "About", href: "/about" } ] });
```

---

### `bw.makeNavbar(props = {})`

Create a navbar component with brand and navigation links

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Navbar configuration |
| `props.brand` | `string` | - Brand name or logo text |
| `props.brandHref` | `string` | - Brand link URL |
| `props.items` | `Array<Object>` | - Navigation items |
| `props.items[].text` | `string` | - Item display text |
| `props.items[].href` | `string` | - Item link URL |
| `props.items[].active` | `boolean` | - Whether this item is active |
| `props.dark` | `boolean` | - Use dark theme styling |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a navbar element

**Example:**
```javascript
const navbar = makeNavbar({ brand: "MyApp", dark: true, items: [ { text: "Home", href: "/", active: true }, { text: "Docs", href: "/docs" } ] });
```

---

### `bw.makeTabs(props = {})`

Create a tabbed interface with accessible tab navigation Each tab is rendered as a button with ARIA attributes for accessibility. Clicking a tab shows its content pane and hides others. The active tab can be set via activeIndex or by setting active:true on a tab item.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Tabs configuration |
| `props.tabs` | `Array<Object>` | - Tab definitions |
| `props.tabs[].label` | `string` | - Tab button label |
| `props.tabs[].content` | `string|Object|Array` | - Tab pane content |
| `props.tabs[].active` | `boolean` | - Whether this tab is initially active |
| `props.activeIndex` | `number` | - Default active tab index (overridden by tab.active) |
| `props.onTabChange` | `Function` | - Called as (index, tab, el) when the active tab changes (click, keyboard, or el.bw.setActiveTab). `tab` is the tabs[index] config object. |

**Returns:** `Object` — object representing a tabbed interface

**Example:**
```javascript
const tabs = makeTabs({ tabs: [ { label: "Overview", content: "Tab 1 content", active: true }, { label: "Details", content: "Tab 2 content" } ] }); bw.DOM("#app", tabs);
```

---

### `bw.makeAlert(props = {})`

Create an alert/notification component

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Alert configuration |
| `props.content` | `string|Object|Array` | - Alert message content |
| `props.variant` | `string` | - Color variant ("primary", "secondary", "success", "danger", "warning", "info", "light", "dark") |
| `props.dismissible` | `boolean` | - Show a close button to dismiss the alert |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing an alert element

**Example:**
```javascript
const alert = makeAlert({ content: "Operation completed successfully!", variant: "success", dismissible: true }); // String shorthand: const msg = makeAlert("Something happened");
```

---

### `bw.makeBadge(props = {})`

Create an inline badge/label component

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Badge configuration |
| `props.text` | `string` | - Badge display text |
| `props.variant` | `string` | - Color variant |
| `props.size` | `string` | - Size variant: 'sm' or 'lg' (default is medium) |
| `props.pill` | `boolean` | - Use pill (rounded) shape |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a badge span

**Example:**
```javascript
const badge = makeBadge({ text: "New", variant: "danger", pill: true }); const small = makeBadge({ text: "3", variant: "info", size: "sm" }); // String shorthand: const tag = makeBadge("New");
```

---

### `bw.makeProgress(props = {})`

Create a progress bar component with ARIA accessibility

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Progress bar configuration |
| `props.value` | `number` | - Current progress value |
| `props.max` | `number` | - Maximum value |
| `props.variant` | `string` | - Color variant |
| `props.striped` | `boolean` | - Use striped pattern |
| `props.animated` | `boolean` | - Animate the stripes |
| `props.label` | `string` | - Custom label text (defaults to percentage) |
| `props.height` | `number` | - Custom height in pixels |

**Returns:** `Object` — object representing a progress bar

**Example:**
```javascript
const progress = makeProgress({ value: 75, variant: "success", striped: true, animated: true });
```

---

### `bw.makeListGroup(props = {})`

Create a list group component for displaying lists of items Items can be simple strings or objects with text, active, disabled, href, and onclick properties. When interactive is true or items have href/onclick, items render as anchor tags.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - List group configuration |
| `props.items` | `Array<string|Object>` | - List items (strings or objects) |
| `props.items[].text` | `string` | - Item display text |
| `props.items[].active` | `boolean` | - Whether this item is active |
| `props.items[].disabled` | `boolean` | - Whether this item is disabled |
| `props.items[].href` | `string` | - Item link URL |
| `props.items[].onclick` | `Function` | - Item click handler |
| `props.flush` | `boolean` | - Remove borders for use inside cards |
| `props.interactive` | `boolean` | - Make all items interactive (anchor tags) |

**Returns:** `Object` — object representing a list group

**Example:**
```javascript
const list = makeListGroup({ interactive: true, items: [ { text: "Active item", active: true }, { text: "Regular item" }, { text: "Disabled item", disabled: true } ] });
```

---

### `bw.makeBreadcrumb(props = {})`

Create a breadcrumb navigation component The last item with active:true is rendered as plain text (no link). All other items render as anchor tags.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Breadcrumb configuration |
| `props.items` | `Array<Object>` | - Breadcrumb items |
| `props.items[].text` | `string` | - Item display text |
| `props.items[].href` | `string` | - Item link URL |
| `props.items[].active` | `boolean` | - Whether this is the current page |

**Returns:** `Object` — object representing a breadcrumb nav

**Example:**
```javascript
const crumbs = makeBreadcrumb({ items: [ { text: "Home", href: "/" }, { text: "Products", href: "/products" }, { text: "Widget", active: true } ] });
```

---

### `bw.makeForm(props = {})`

Create a form wrapper with default submit prevention

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Form configuration |
| `props.children` | `Array|Object|string` | - Form contents (form groups, inputs, buttons) |
| `props.onsubmit` | `Function` | - Submit handler (defaults to preventDefault) |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a form element

**Example:**
```javascript
const form = makeForm({ onsubmit: (e) => { e.preventDefault(); handleSubmit(); }, children: [ makeFormGroup({ label: "Name", input: makeInput({ placeholder: "Enter name" }) }), makeButton({ text: "Submit", type: "submit" }) ] });
```

---

### `bw.makeFormGroup(props = {})`

Create a form group with label, input, optional help text and validation feedback

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Form group configuration |
| `props.label` | `string` | - Label text |
| `props.input` | `Object` | - Input TACO object (from makeInput, makeSelect, etc.) |
| `props.help` | `string` | - Help text displayed below the input |
| `props.id` | `string` | - Input ID (links label to input via for/id) |
| `props.validation` | `string` | - Validation state ("valid" or "invalid") |
| `props.feedback` | `string` | - Validation feedback text shown below input |
| `props.required` | `boolean` | - Show required indicator (*) on label |

**Returns:** `Object` — object representing a form group

**Example:**
```javascript
const group = makeFormGroup({ label: "Email", id: "email", input: makeInput({ type: "email", id: "email", placeholder: "you@example.com" }), validation: "invalid", feedback: "Please enter a valid email address." });
```

---

### `bw.makeInput(props = {})`

Create an input element with form control styling Additional event handlers (oninput, onchange, etc.) can be passed as extra properties and are spread onto the element attributes.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Input configuration |
| `props.type` | `string` | - Input type ("text", "email", "password", "number", etc.) |
| `props.placeholder` | `string` | - Placeholder text |
| `props.value` | `string` | - Input value |
| `props.id` | `string` | - Element ID |
| `props.name` | `string` | - Input name attribute |
| `props.disabled` | `boolean` | - Whether the input is disabled |
| `props.readonly` | `boolean` | - Whether the input is read-only |
| `props.required` | `boolean` | - Whether the input is required |
| `props.className` | `string` | - Additional CSS classes |
| `props.style` | `Object` | - Inline style object |

**Returns:** `Object` — object representing an input element

**Example:**
```javascript
const input = makeInput({ type: "email", placeholder: "you@example.com", required: true, oninput: (e) => validate(e.target.value) });
```

---

### `bw.makeTextarea(props = {})`

Create a textarea element with form control styling

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Textarea configuration |
| `props.placeholder` | `string` | - Placeholder text |
| `props.value` | `string` | - Textarea content |
| `props.rows` | `number` | - Number of visible text rows |
| `props.id` | `string` | - Element ID |
| `props.name` | `string` | - Textarea name attribute |
| `props.disabled` | `boolean` | - Whether the textarea is disabled |
| `props.readonly` | `boolean` | - Whether the textarea is read-only |
| `props.required` | `boolean` | - Whether the textarea is required |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a textarea element

**Example:**
```javascript
const textarea = makeTextarea({ rows: 5, placeholder: "Enter your message...", required: true });
```

---

### `bw.makeSelect(props = {})`

Create a select dropdown with options

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Select configuration |
| `props.options` | `Array<Object>` | - Dropdown options |
| `props.options[].value` | `string` | - Option value |
| `props.options[].text` | `string` | - Option display text (`label` also accepted; defaults to value) |
| `props.value` | `string` | - Currently selected value |
| `props.id` | `string` | - Element ID |
| `props.name` | `string` | - Select name attribute |
| `props.disabled` | `boolean` | - Whether the select is disabled |
| `props.required` | `boolean` | - Whether the select is required |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a select element

**Example:**
```javascript
const select = makeSelect({ value: "b", options: [ { value: "a", text: "Option A" }, { value: "b", text: "Option B" }, { value: "c", text: "Option C" } ] });
```

---

### `bw.makeCheckbox(props = {})`

Create a checkbox input with label

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Checkbox configuration |
| `props.label` | `string` | - Checkbox label text |
| `props.checked` | `boolean` | - Whether the checkbox is checked |
| `props.id` | `string` | - Element ID (links label to checkbox) |
| `props.name` | `string` | - Input name attribute |
| `props.disabled` | `boolean` | - Whether the checkbox is disabled |
| `props.value` | `string` | - Checkbox value attribute |

**Returns:** `Object` — object representing a checkbox form group

**Example:**
```javascript
const checkbox = makeCheckbox({ label: "I agree to the terms", id: "agree", checked: false });
```

---

### `bw.makeStack(props = {})`

Create a flexbox stack layout (vertical or horizontal)

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Stack configuration |
| `props.children` | `Array|Object|string` | - Stack children |
| `props.direction` | `string` | - Stack direction ("vertical" or "horizontal") |
| `props.gap` | `number` | - Gap size (0-5) |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a stack layout

**Example:**
```javascript
const stack = makeStack({ direction: "horizontal", gap: 2, children: [ makeButton({ text: "Cancel", variant: "secondary" }), makeButton({ text: "Save", variant: "primary" }) ] });
```

---

### `bw.makeSpinner(props = {})`

Create a loading spinner indicator

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Spinner configuration |
| `props.variant` | `string` | - Color variant |
| `props.size` | `string` | - Spinner size ("sm", "md", "lg") |
| `props.type` | `string` | - Spinner type ("border" or "grow") |

**Returns:** `Object` — object representing a spinner with screen-reader text

**Example:**
```javascript
const spinner = makeSpinner({ variant: "info", size: "sm" });
```

---

### `bw.makeHero(props = {})`

Create a hero section for landing pages and headers Supports gradient backgrounds, background images with overlays, and action buttons. Commonly used as the first visible section.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Hero configuration |
| `props.title` | `string` | - Main headline text |
| `props.subtitle` | `string` | - Supporting description text |
| `props.content` | `string|Object|Array` | - Additional body content |
| `props.variant` | `string` | - Background variant ("primary", "secondary", "light", "dark") |
| `props.size` | `string` | - Vertical padding size ("sm", "md", "lg", "xl") |
| `props.centered` | `boolean` | - Center-align text |
| `props.overlay` | `boolean` | - Add dark overlay (for background images) |
| `props.backgroundImage` | `string` | - Background image URL |
| `props.actions` | `Array|Object` | - Call-to-action buttons |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a hero section

**Example:**
```javascript
const hero = makeHero({ title: "Welcome to Bitwrench", subtitle: "Build UIs with pure JavaScript", variant: "dark", actions: [ makeButton({ text: "Get Started", variant: "primary", size: "lg" }), makeButton({ text: "Learn More", variant: "outline_light", size: "lg" }) ] });
```

---

### `bw.makeFeatureGrid(props = {})`

Create a responsive feature grid for showcasing capabilities Renders features in an equal-width column grid with optional icons, titles, and descriptions.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Feature grid configuration |
| `props.features` | `Array<Object>` | - Feature items |
| `props.features[].icon` | `string` | - Icon content (emoji, HTML entity, or text) |
| `props.features[].title` | `string` | - Feature title |
| `props.features[].description` | `string` | - Feature description text |
| `props.columns` | `number` | - Items per row at md+ widths. Uses the 12-column grid, so use a divisor of 12 (1, 2, 3, 4, 6, 12); other counts round to the nearest span (5 -> 6 per row, 8 -> 6 per row). Stacks to one column below md. |
| `props.centered` | `boolean` | - Center-align feature text |
| `props.iconSize` | `string` | - Icon font size |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a feature grid

**Example:**
```javascript
const features = makeFeatureGrid({ columns: 3, features: [ { icon: "⚡", title: "Fast", description: "Zero build step" }, { icon: "📦", title: "Small", description: "Under 45KB gzipped" }, { icon: "🔧", title: "Flexible", description: "Pure JS objects" } ] });
```

---

### `bw.makeCTA(props = {})`

Create a call-to-action section with title, description, and action buttons

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - CTA configuration |
| `props.title` | `string` | - CTA headline |
| `props.description` | `string` | - CTA description text |
| `props.actions` | `Array|Object` | - CTA buttons or content |
| `props.variant` | `string` | - Background variant |
| `props.centered` | `boolean` | - Center-align content |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a CTA section

**Example:**
```javascript
const cta = makeCTA({ title: "Ready to get started?", description: "Join thousands of developers using Bitwrench.", actions: [ makeButton({ text: "Sign Up Free", variant: "primary", size: "lg" }) ] });
```

---

### `bw.makeSection(props = {})`

Create a page section with optional centered header and background

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Section configuration |
| `props.title` | `string` | - Section title |
| `props.subtitle` | `string` | - Section subtitle (muted) |
| `props.content` | `string|Object|Array` | - Section body content |
| `props.variant` | `string` | - Background variant ("default" for none, or a color name) |
| `props.spacing` | `string` | - Vertical padding ("sm", "md", "lg", "xl") |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a content section

**Example:**
```javascript
const section = makeSection({ title: "Features", subtitle: "Everything you need to build great UIs", spacing: "lg", content: makeFeatureGrid({ features: [...] }) });
```

---

### `bw.makeCodeDemo(props = {})`

Create a code demo component for documentation pages Displays a live result alongside source code in a tabbed interface. Includes a copy-to-clipboard button on the code tab.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Code demo configuration |
| `props.title` | `string` | - Demo title heading |
| `props.description` | `string` | - Demo description text |
| `props.code` | `string` | - Source code to display (adds a "Code" tab when present) |
| `props.result` | `string|Object|Array` | - Live result content for the "Result" tab |
| `props.language` | `string` | - Code language for syntax class |

**Returns:** `Object` — object representing a code demo with tabbed Result/Code views

**Example:**
```javascript
const demo = makeCodeDemo({ title: "Button Example", description: "A simple primary button", code: 'makeButton({ text: "Click me" })', result: makeButton({ text: "Click me" }) });
```

---

### `bw.makePagination(props = {})`

Create a pagination navigation component

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Pagination configuration |
| `props.pages` | `number` | - Total number of pages |
| `props.currentPage` | `number` | - Currently active page (1-based) |
| `props.onPageChange` | `Function` | - Callback when page changes, receives page number |
| `props.size` | `string` | - Size variant ("sm" or "lg") |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a pagination nav

**Example:**
```javascript
const pager = makePagination({ pages: 10, currentPage: 3, onPageChange: (page) => loadPage(page) });
```

---

### `bw.makeRadio(props = {})`

Create a radio button input with label

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Radio configuration |
| `props.label` | `string` | - Radio label text |
| `props.name` | `string` | - Radio group name |
| `props.value` | `string` | - Radio value attribute |
| `props.checked` | `boolean` | - Whether the radio is selected |
| `props.id` | `string` | - Element ID (links label to radio) |
| `props.disabled` | `boolean` | - Whether the radio is disabled |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a radio form group

**Example:**
```javascript
const radio = makeRadio({ label: "Option A", name: "choice", value: "a", checked: true });
```

---

### `bw.makeButtonGroup(props = {})`

Create a button group wrapper

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Button group configuration |
| `props.children` | `Array` | - Button TACO objects to group |
| `props.size` | `string` | - Size variant ("sm" or "lg") |
| `props.vertical` | `boolean` | - Stack buttons vertically |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a button group

**Example:**
```javascript
const group = makeButtonGroup({ children: [ makeButton({ text: "Left", variant: "primary" }), makeButton({ text: "Middle", variant: "primary" }), makeButton({ text: "Right", variant: "primary" }) ] });
```

---

### `bw.makeAccordion(props = {})`

Create an accordion component with collapsible items

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Accordion configuration |
| `props.items` | `Array<Object>` | - Accordion items |
| `props.items[].title` | `string` | - Header text for the accordion item |
| `props.items[].content` | `string|Object|Array` | - Collapsible content |
| `props.items[].open` | `boolean` | - Whether the item is initially open |
| `props.multiOpen` | `boolean` | - Allow multiple items open simultaneously |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing an accordion

**Example:**
```javascript
const accordion = makeAccordion({ items: [ { title: "Section 1", content: "Content 1", open: true }, { title: "Section 2", content: "Content 2" } ] });
```

---

### `bw.makeModal(props = {})`

Create a modal dialog overlay

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Modal configuration |
| `props.title` | `string` | - Modal title in header |
| `props.content` | `string|Object|Array` | - Modal body content |
| `props.footer` | `string|Object|Array` | - Modal footer content |
| `props.size` | `string` | - Modal size ("sm", "lg", "xl") |
| `props.closeButton` | `boolean` | - Show X close button in header |
| `props.onClose` | `Function` | - Callback when modal is closed |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a modal

**Example:**
```javascript
const modal = makeModal({ title: "Confirm", content: "Are you sure?", footer: makeButton({ text: "OK", variant: "primary" }) });
```

---

### `bw.makeToast(props = {})`

Create a toast notification popup

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Toast configuration |
| `props.title` | `string` | - Toast title |
| `props.content` | `string|Object|Array` | - Toast body content |
| `props.variant` | `string` | - Color variant ("primary", "success", "danger", "warning", "info") |
| `props.autoDismiss` | `boolean` | - Auto-dismiss after delay |
| `props.delay` | `number` | - Auto-dismiss delay in ms |
| `props.position` | `string` | - Container position |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a toast

**Example:**
```javascript
const toast = makeToast({ title: "Success", content: "File saved!", variant: "success" });
```

---

### `bw.makeDropdown(props = {})`

Create a dropdown menu triggered by a button

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Dropdown configuration |
| `props.trigger` | `string|Object` | - Button text or TACO for the trigger |
| `props.items` | `Array<Object>` | - Menu items |
| `props.items[].text` | `string` | - Item display text |
| `props.items[].href` | `string` | - Item link URL |
| `props.items[].onclick` | `Function` | - Item click handler |
| `props.items[].divider` | `boolean` | - Render as a divider line |
| `props.items[].disabled` | `boolean` | - Whether the item is disabled |
| `props.align` | `string` | - Menu alignment ("start" or "end") |
| `props.variant` | `string` | - Trigger button variant |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a dropdown

**Example:**
```javascript
const dropdown = makeDropdown({ trigger: "Actions", items: [ { text: "Edit", onclick: () => edit() }, { divider: true }, { text: "Delete", onclick: () => del() } ] });
```

---

### `bw.makeSwitch(props = {})`

Create a toggle switch (styled checkbox)

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Switch configuration |
| `props.label` | `string` | - Switch label text |
| `props.checked` | `boolean` | - Whether the switch is on |
| `props.id` | `string` | - Element ID (links label to switch) |
| `props.name` | `string` | - Input name attribute |
| `props.disabled` | `boolean` | - Whether the switch is disabled |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a toggle switch

**Example:**
```javascript
const toggle = makeSwitch({ label: "Dark mode", checked: false, onchange: (e) => toggleDark(e.target.checked) });
```

---

### `bw.makeSkeleton(props = {})`

Create a skeleton loading placeholder

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Skeleton configuration |
| `props.variant` | `string` | - Shape variant ("text", "circle", "rect") |
| `props.width` | `string` | - Custom width (e.g. "200px", "100%") |
| `props.height` | `string` | - Custom height (e.g. "20px") |
| `props.count` | `number` | - Number of skeleton lines (for text variant) |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a skeleton placeholder

**Example:**
```javascript
const skeleton = makeSkeleton({ variant: "text", count: 3, width: "100%" });
```

---

### `bw.makeAvatar(props = {})`

Create a user avatar with image or initials fallback

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Avatar configuration |
| `props.src` | `string` | - Image source URL |
| `props.alt` | `string` | - Image alt text |
| `props.initials` | `string` | - Fallback initials (e.g. "JD") |
| `props.size` | `string` | - Size ("sm", "md", "lg", "xl") |
| `props.variant` | `string` | - Background color variant for initials |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing an avatar

**Example:**
```javascript
const avatar = makeAvatar({ src: "/photo.jpg", alt: "Jane Doe", size: "lg" }); const avatarInitials = makeAvatar({ initials: "JD", variant: "success" });
```

---

### `bw.makeCarousel(props = {})`

Create a carousel/slideshow component with slide transitions Supports image slides, TACO content slides, captions, prev/next controls, dot indicators, and optional auto-play. Uses CSS translateX transitions.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Carousel configuration |
| `props.items` | `Array<Object>` | - Slide items |
| `props.items[].content` | `string|Object` | - Slide content (TACO, string, or img element) |
| `props.items[].caption` | `string` | - Caption text shown at bottom of slide |
| `props.showControls` | `boolean` | - Show prev/next arrow buttons |
| `props.showIndicators` | `boolean` | - Show dot navigation |
| `props.autoPlay` | `boolean` | - Auto-advance slides |
| `props.interval` | `number` | - Auto-advance interval in ms |
| `props.height` | `string` | - Carousel height |
| `props.startIndex` | `number` | - Initial slide index |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a carousel

**Example:**
```javascript
const carousel = makeCarousel({ items: [ { content: { t: 'img', a: { src: 'photo.jpg' } }, caption: 'Photo 1' }, { content: { t: 'div', c: 'Text slide' } } ], autoPlay: true, interval: 3000 });
```

---

### `bw.makeStatCard(props = {})`

Create a stat card for dashboard metrics display Shows a large value with a label and optional change indicator. Designed for dashboard grid layouts with left-border accent.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object|string` | - Stat card configuration (string shorthand sets label) |
| `props.value` | `string|number` | - The main stat value to display |
| `props.label` | `string` | - Descriptive label below the value |
| `props.change` | `number` | - Percentage change indicator (positive = green arrow, negative = red) |
| `props.format` | `string` | - Value format ("number", "currency", "percent") |
| `props.prefix` | `string` | - Custom prefix (e.g. "$") |
| `props.suffix` | `string` | - Custom suffix (e.g. "%") |
| `props.icon` | `string` | - Icon content (emoji or text) shown above value |
| `props.variant` | `string` | - Left-border color variant ("primary", "success", "danger", etc.) |
| `props.className` | `string` | - Additional CSS classes |
| `props.style` | `Object` | - Inline style object |

**Returns:** `Object` — object representing a stat card

**Example:**
```javascript
const stat = makeStatCard({ value: 2345, label: 'Active Users', change: 5.3, format: 'number', variant: 'primary' });
```

---

### `bw.makeTooltip(props = {})`

Create a tooltip wrapper around trigger content Wraps the trigger element in a container that shows tooltip text on hover and focus. Pure CSS-driven show/hide with JS lifecycle for event binding.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Tooltip configuration |
| `props.content` | `string|Object|Array` | - Trigger content (what the user hovers/focuses) |
| `props.text` | `string` | - Tooltip text to display |
| `props.placement` | `string` | - Tooltip placement ("top", "bottom", "left", "right") |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a tooltip wrapper

**Example:**
```javascript
const tip = makeTooltip({ content: makeButton({ text: 'Hover me' }), text: 'This is a tooltip!', placement: 'top' });
```

---

### `bw.makePopover(props = {})`

Create a popover wrapper around trigger content Like a tooltip but richer — supports title + body content and is triggered by click rather than hover. Dismisses on click outside.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Popover configuration |
| `props.trigger` | `string|Object|Array` | - Trigger content (what the user clicks) |
| `props.title` | `string` | - Popover header title |
| `props.content` | `string|Object|Array` | - Popover body content |
| `props.placement` | `string` | - Placement ("top", "bottom", "left", "right") |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a popover wrapper

**Example:**
```javascript
const pop = makePopover({ trigger: makeButton({ text: 'Click me' }), title: 'Popover Title', content: 'Some helpful information here.', placement: 'bottom' });
```

---

### `bw.makeSearchInput(props = {})`

Create a search input with clear button Wraps a text input with a clear (×) button that appears when the field has content. Calls onSearch on Enter key.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Search input configuration |
| `props.placeholder` | `string` | - Placeholder text |
| `props.value` | `string` | - Initial value |
| `props.onSearch` | `Function` | - Callback when Enter is pressed, receives value |
| `props.onInput` | `Function` | - Callback on each keystroke, receives value |
| `props.id` | `string` | - Element ID |
| `props.name` | `string` | - Input name attribute |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a search input

**Example:**
```javascript
const search = makeSearchInput({ placeholder: 'Search users...', onSearch: (val) => filterUsers(val) });
```

---

### `bw.makeRange(props = {})`

Create a styled range slider input

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Range configuration |
| `props.min` | `number` | - Minimum value |
| `props.max` | `number` | - Maximum value |
| `props.step` | `number` | - Step increment |
| `props.value` | `number` | - Current value |
| `props.label` | `string` | - Label text |
| `props.showValue` | `boolean` | - Show current value display |
| `props.id` | `string` | - Element ID |
| `props.name` | `string` | - Input name attribute |
| `props.disabled` | `boolean` | - Whether the slider is disabled |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a range input

**Example:**
```javascript
const slider = makeRange({ min: 0, max: 100, value: 50, label: 'Volume', showValue: true, oninput: (e) => setVolume(e.target.value) });
```

---

### `bw.makeMediaObject(props = {})`

Create a media object layout (image + text side-by-side) Classic media object pattern: image/icon on one side, text content on the other, using flexbox. Supports reversed layout.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Media object configuration |
| `props.src` | `string` | - Image source URL |
| `props.alt` | `string` | - Image alt text |
| `props.title` | `string` | - Title text |
| `props.content` | `string|Object|Array` | - Body content |
| `props.reverse` | `boolean` | - Put image on the right |
| `props.imageSize` | `string` | - Image width/height |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a media object

**Example:**
```javascript
const media = makeMediaObject({ src: '/avatar.jpg', title: 'Jane Doe', content: 'Posted a comment 5 minutes ago.' });
```

---

### `bw.makeFileUpload(props = {})`

Create a file upload zone with drag-and-drop support Styled drop zone with file input. Supports drag-and-drop visuals and multiple file selection.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - File upload configuration |
| `props.accept` | `string` | - Accepted file types (e.g. "image/*", ".pdf,.doc") |
| `props.multiple` | `boolean` | - Allow multiple file selection |
| `props.onFiles` | `Function` | - Callback when files are selected, receives FileList |
| `props.text` | `string` | - Zone label text |
| `props.id` | `string` | - Element ID |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a file upload zone

**Example:**
```javascript
const upload = makeFileUpload({ accept: 'image/*', multiple: true, onFiles: (files) => uploadFiles(files) });
```

---

### `bw.makeTimeline(props = {})`

Create a vertical timeline for chronological event display Renders events as a vertical line with markers and content cards. Each item can have a colored variant marker.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Timeline configuration |
| `props.items` | `Array<Object>` | - Timeline events |
| `props.items[].title` | `string` | - Event title |
| `props.items[].content` | `string|Object|Array` | - Event description content |
| `props.items[].date` | `string` | - Date or time label |
| `props.items[].variant` | `string` | - Marker color variant |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a timeline

**Example:**
```javascript
const timeline = makeTimeline({ items: [ { title: 'Project Started', date: 'Jan 2026', variant: 'primary' }, { title: 'Beta Release', date: 'Mar 2026', content: 'v2.0 beta shipped' }, { title: 'Stable Release', date: 'Jun 2026', variant: 'success' } ] });
```

---

### `bw.makeStepper(props = {})`

Create a multi-step wizard/progress indicator Displays numbered steps with active and completed states. Steps before currentStep are marked completed, the currentStep is active, and subsequent steps are pending.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Stepper configuration |
| `props.steps` | `Array<Object>` | - Step definitions |
| `props.steps[].label` | `string` | - Step label text |
| `props.steps[].description` | `string` | - Optional step description |
| `props.currentStep` | `number` | - Zero-based index of the active step |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a stepper

**Example:**
```javascript
const stepper = makeStepper({ currentStep: 1, steps: [ { label: 'Account', description: 'Create account' }, { label: 'Profile', description: 'Set up profile' }, { label: 'Confirm', description: 'Review & submit' } ] });
```

---

### `bw.makeChipInput(props = {})`

Create a chip/tag input for managing a list of items Displays existing chips with remove buttons and an input field for adding new ones. Chips are added on Enter and removed on clicking the × button.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Chip input configuration |
| `props.chips` | `Array<string>` | - Initial chip values |
| `props.placeholder` | `string` | - Input placeholder text |
| `props.onAdd` | `Function` | - Callback when a chip is added, receives value |
| `props.onRemove` | `Function` | - Callback when a chip is removed, receives value |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a chip input

**Example:**
```javascript
const tags = makeChipInput({ chips: ['JavaScript', 'CSS'], placeholder: 'Add tag...', onAdd: (val) => addTag(val), onRemove: (val) => removeTag(val) });
```

---

### `bw.make(type, props)`

Factory function — create any BCCL component by type name.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `type` | `string` | - Component type (e.g. 'card', 'button', 'alert') |
| `props` | `Object` | - Component properties |

**Returns:** `Object` — object

**Example:**
```javascript
var card = make('card', { title: 'Hello', variant: 'primary' }); var btn = make('button', { text: 'Click', variant: 'success' }); var types = Object.keys(BCCL); // list all available types
```

---

## Routing

### `bw.router(config)`

Create a client-side router: URLs in, TACOs out. Route handlers return TACO; the router mounts the result into `target`. Hash mode needs no server config; history mode needs the server to serve the app for unknown paths. Returns a router object with `navigate`, `stop` and the compiled route table.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `config` | `Object` | - Router configuration |
| `config.routes` | `Object` | - Map of path pattern to handler, e.g. `{ '/': fn, '/users/:id': fn, '*': fn }`. Handlers get (params, query) and return a TACO. |
| `config.target` | `string|Element` | - Where to mount each view |
| `config.mode` | `string` | - 'hash' or 'history' |
| `config.base` | `string` | - Base path for history mode |
| `config.before` | `Function` | - Guard: return false to block navigation |
| `config.after` | `Function` | - Called after each successful navigation |

**Returns:** `Object` — object

**Example:**
```javascript
bw.router({ target: '#app', routes: { '/':          function() { return { t: 'h1', c: 'Home' }; }, '/users/:id': function(params) { return { t: 'h1', c: 'User ' + params.id }; }, '*':          function() { return { t: 'h1', c: 'Not found' }; } } });
```

---

### `bw.navigate(path, opts)`

Navigate the active router to a path. Warns and does nothing when no router is running, so a stray call cannot leave the page half-navigated.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `path` | `string` | - Target path, e.g. '/users/123' |
| `opts` | `Object` | - { replace: true } to replace the history entry instead of pushing one |

**Example:**
```javascript
bw.navigate('/users/123'); bw.navigate('/login', { replace: true });
```

---

### `bw.link(path, content, attrs)`

A TACO anchor that navigates through the router instead of reloading.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `path` | `string` | - Target path |
| `content` | `string|Object|Array` | - Link content (text or TACO) |
| `attrs` | `Object` | - Extra attributes, e.g. `{ class: 'nav_item' }` |

**Returns:** `Object` — for an `<a>` wired to the router

**Example:**
```javascript
bw.link('/about', 'About', { class: 'bw_bccl_btn' })
```

---

## Color

### `bw.colorHslToRgb(h, s, l, a, rnd)`

HSL to RGB, in the v1 array format.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `h` | `number|Array` | - Hue 0-360, or the whole `[h, s, l, a]` array |
| `s` | `number` | - Saturation 0-100 |
| `l` | `number` | - Lightness 0-100 |
| `a` | `number` | - Alpha 0-255 |
| `rnd` | `boolean` | - Round the result |

**Returns:** `Array`

**Example:**
```javascript
bw.colorHslToRgb(180, 50, 50)     // => [64, 191, 191, 255, 'rgb']
```

---

### `bw.colorRgbToHsl(r, g, b, a, rnd)`

RGB to HSL, in the v1 array format.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `r` | `number|Array` | - Red 0-255, or the whole `[r, g, b, a]` array |
| `g` | `number` | - Green 0-255 |
| `b` | `number` | - Blue 0-255 |
| `a` | `number` | - Alpha 0-255 |
| `rnd` | `boolean` | - Round the result |

**Returns:** `Array`

**Example:**
```javascript
bw.colorRgbToHsl(64, 191, 191)    // => [180, 50, 50, 255, 'hsl']
```

---

### `bw.colorParse(s, defAlpha)`

Parse any CSS colour string into the v1 array format. Accepts `#rgb`, `#rrggbb`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, named colours and an existing array. The fifth element records which space the value is in, so `colorInterp` and friends can round-trip it.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `s` | `string|Array` | - Colour string, or an array to normalise |
| `defAlpha` | `number` | - Alpha to use when the input has none |

**Returns:** `Array` — or `[h, s, l, a, 'hsl']`

**Example:**
```javascript
bw.colorParse('#006666')          // => [0, 102, 102, 255, 'rgb'] bw.colorParse('hsl(180 50% 50%)') // => [180, 50, 50, 255, 'hsl']
```

---

### `bw.colorInterp(x, in0, in1, colors, stretch, colorParseFn)`

Interpolate between an array of colors based on a value in a range.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `x` | `number` | - Value to interpolate |
| `in0` | `number` | - Input range start |
| `in1` | `number` | - Input range end |
| `colors` | `Array` | - Array of CSS color strings to interpolate between |
| `stretch` | `number` | - Exponential scaling factor (1 = linear) |
| `colorParseFn` | `Function` | - Color parse function (injected to avoid circular dep) |

**Returns:** `Array` — color as [r, g, b, a, "rgb"]

**Example:**
```javascript
colorInterp(50, 0, 100, ['#ff0000', '#00ff00'], undefined, bw.colorParse)
```

---

## Color Utilities

### `bw.hexToHsl(hex)`

Convert hex color to HSL array [h, s, l].

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `hex` | `string` | - Hex color e.g. '#006666' |

**Returns:** `Array` — where h=0-360, s=0-100, l=0-100

---

### `bw.hslToHex(hsl)`

Convert HSL array to hex color string.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `hsl` | `Array` | - [h, s, l] where h=0-360, s=0-100, l=0-100 |

**Returns:** `string` — color e.g. '#006666'

---

### `bw.adjustLightness(hex, amount)`

Adjust lightness of a hex color by a percentage amount. Positive = lighten, negative = darken.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `hex` | `string` | - Hex color |
| `amount` | `number` | - Lightness change in percentage points (-100 to 100) |

**Returns:** `string` — hex color

---

### `bw.mixColor(hex1, hex2, ratio)`

Mix two hex colors via RGB linear interpolation.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `hex1` | `string` | - First hex color |
| `hex2` | `string` | - Second hex color (e.g. '#ffffff' for tinting) |
| `ratio` | `number` | - 0 = all hex1, 1 = all hex2 |

**Returns:** `string` — hex color

---

### `bw.relativeLuminance(hex)`

Compute WCAG 2.0 relative luminance of a hex color.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `hex` | `string` | - Hex color |

**Returns:** `number` — luminance 0-1

---

### `bw.textOnColor(hex)`

Return '#fff' or '#000' for readable text on a given background color. Uses WCAG luminance threshold.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `hex` | `string` | - Background hex color |

**Returns:** `string` — or '#000'

---

### `bw.harmonize(sourceHex, targetHex, amount)`

Shift a color's hue toward a target hue by a given amount. Uses shortest-arc interpolation on the hue wheel.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `sourceHex` | `string` | - Color to shift |
| `targetHex` | `string` | - Color whose hue to shift toward |
| `amount` | `number` | - 0 = no shift, 1 = full shift to target hue |

**Returns:** `string` — hex color

---

### `bw.deriveShades(hex)`

Derive a full shade palette for a single semantic color.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `hex` | `string` | - Base color hex |

**Returns:** `Object` — base, hover, active, light, darkText, border, focus, textOn }

---

### `bw.deriveAlternateSeed(hex)`

Derive the alternate (luminance-inverted) version of a single seed color. Preserves hue, mirrors lightness, adjusts saturation for readability.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `hex` | `string` | - Seed hex color |

**Returns:** `string` — hex color

---

### `bw.isLightPalette(config)`

Determine whether a palette config is "light-flavored" based on the average luminance of its seed colors.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `config` | `Object` | - Theme config with primary, secondary hex colors |

**Returns:** `boolean` — if the seeds are predominantly light

---

### `bw.deriveAlternateConfig(config)`

Derive a complete alternate config from a primary theme config. Each seed color is luminance-inverted; semantic colors are adjusted for the new luminance context.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `config` | `Object` | - Primary theme config |

**Returns:** `Object` — theme config (same shape, inverted lightness)

---

### `bw.derivePalette(config)`

Derive complete palette from a theme config object.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `config` | `Object` | - Theme config with primary, secondary, tertiary, etc. |
| `config.harmonize` | `number` | - Hue shift amount for semantic colors (0-1) |

**Returns:** `Object` — palette with shades for all 9 semantic colors

---

## Math

### `bw.mapScale(x, in0, in1, out0, out1, options, options.clip, options.expScale)`

Map/scale a value from one range to another (linear interpolation). Useful for converting sensor data, normalizing values, or creating visual scales. Supports optional clamping and exponential scaling.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `x` | `number` | - Input value |
| `in0` | `number` | - Input range start |
| `in1` | `number` | - Input range end |
| `out0` | `number` | - Output range start |
| `out1` | `number` | - Output range end |
| `options` | `Object` | - Mapping options |
| `options.clip` | `boolean` | - Clamp result to output range |
| `options.expScale` | `number` | - Exponential scaling factor |

**Returns:** `number` — value

**Example:**
```javascript
bw.mapScale(50, 0, 100, 0, 1)  // => 0.5 bw.mapScale(75, 0, 100, 0, 255) // => 191.25
```

---

### `bw.clip(value, min, max)`

Clamp a value between min and max bounds.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `value` | `number` | - Value to clamp |
| `min` | `number` | - Minimum allowed value |
| `max` | `number` | - Maximum allowed value |

**Returns:** `number` — value

**Example:**
```javascript
bw.clip(150, 0, 100)  // => 100 bw.clip(-5, 0, 100)   // => 0 bw.clip(50, 0, 100)   // => 50
```

---

## Array Utilities

### `bw.choice(x, choices, def)`

Use a dictionary as a switch statement, with support for function values.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `x` | `*` | - Key to look up |
| `choices` | `Object` | - Dictionary of choices (values can be functions) |
| `def` | `*` | - Default value if key not found |

**Returns:** `*` — or function result

**Example:**
```javascript
var colors = { red: 1, blue: 2, aqua: function(z) { return z + 'marine'; } }; choice('red', colors, '0')   // => 1 choice('aqua', colors)       // => 'aquamarine'
```

---

### `bw.arrayUniq(x)`

Return unique elements of an array (preserves first occurrence order).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `x` | `Array` | - Input array |

**Returns:** `Array` — with unique elements

**Example:**
```javascript
arrayUniq([1, 2, 2, 3, 1])  // => [1, 2, 3]
```

---

### `bw.arrayBinA(a, b)`

Return the intersection of two arrays (elements present in both).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `a` | `Array` | - First array |
| `b` | `Array` | - Second array |

**Returns:** `Array` — elements found in both a and b

**Example:**
```javascript
arrayBinA([1, 2, 3], [2, 3, 4])  // => [2, 3]
```

---

### `bw.arrayBNotInA(a, b)`

Return elements of b that are not present in a (set difference).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `a` | `Array` | - First array (the "exclude" set) |
| `b` | `Array` | - Second array (source of results) |

**Returns:** `Array` — elements in b but not in a

**Example:**
```javascript
arrayBNotInA([1, 2, 3], [2, 3, 4, 5])  // => [4, 5]
```

---

### `bw.multiArray(value, dims)`

Create a multidimensional array filled with a value or function result.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `value` | `*` | - Value or function to fill array with |
| `dims` | `number|Array` | - Dimensions (number for 1D, array for multi-D) |

**Returns:** `Array` — array

**Example:**
```javascript
multiArray(0, [4, 5])            // 4x5 array of 0s multiArray(Math.random, [3, 4])  // 3x4 array of random numbers
```

---

### `bw.naturalCompare(as, bs)`

Natural sort comparison function for use with `Array.sort()`. Sorts strings with embedded numbers in human-expected order (e.g. "file2" before "file10") instead of lexicographic order.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `as` | `*` | - First value |
| `bs` | `*` | - Second value |

**Returns:** `number` — order (-1, 0, 1)

**Example:**
```javascript
['item10', 'item2', 'item1'].sort(naturalCompare) // => ['item1', 'item2', 'item10']
```

---

## Text Generation

### `bw.loremIpsum(numChars, startSpot, startWithCapitalLetter = true)`

Generate Lorem Ipsum placeholder text.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `numChars` | `number` | - Number of characters (random 25-150 if not provided) |
| `startSpot` | `number` | - Starting index in Lorem text (random if undefined) |
| `startWithCapitalLetter` | `boolean` | - Start with a capital letter |

**Returns:** `string` — ipsum text

**Example:**
```javascript
loremIpsum(50) // => "Lorem ipsum dolor sit amet, consectetur adipiscin"
```

---

## Timing

### `bw.setIntervalX(callback, delay, repetitions)`

Run `setInterval` with a maximum number of repetitions.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `callback` | `Function` | - Function to call (receives iteration index) |
| `delay` | `number` | - Delay between calls in ms |
| `repetitions` | `number` | - Maximum number of times to call |

**Returns:** `number` — ID (can be passed to clearInterval)

**Example:**
```javascript
setIntervalX(function(i) { console.log('Iteration', i); }, 1000, 5); // Runs 5 times, 1 second apart
```

---

### `bw.repeatUntil(testFn, successFn, failFn, delay = 250, maxReps = 10, lastFn)`

Repeat a test function until it returns truthy, or give up after max attempts.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `testFn` | `Function` | - Test function that returns truthy when done |
| `successFn` | `Function` | - Called with test result when test passes |
| `failFn` | `Function` | - Called on each failed test attempt |
| `delay` | `number` | - Delay between attempts in ms |
| `maxReps` | `number` | - Maximum number of attempts |
| `lastFn` | `Function` | - Called when done with (success, count) |

**Returns:** `string|number` — if invalid params, otherwise interval ID

---

## Browser Utilities

### `bw.setCookie(cname, cvalue, exdays, options = {})`

Set a browser cookie with expiration and options.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `cname` | `string` | - Cookie name |
| `cvalue` | `string` | - Cookie value |
| `exdays` | `number` | - Expiration in days from now |
| `options` | `Object` | - Additional cookie options |
| `options.path` | `string` | - Cookie path |
| `options.domain` | `string` | - Cookie domain |
| `options.secure` | `boolean` | - Secure flag |
| `options.sameSite` | `string` | - SameSite attribute |

---

### `bw.getCookie(cname, defaultValue)`

Get a browser cookie value by name.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `cname` | `string` | - Cookie name |
| `defaultValue` | `*` | - Default value if cookie not found |

**Returns:** `*` — value or default

---

### `bw.getURLParam(key, defaultValue)`

Get a URL query parameter value from the current page URL. Pass no key to get all parameters as an object. Returns `true` for present-but-empty parameters.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `key` | `string` | - Parameter name (omit to get all params) |
| `defaultValue` | `*` | - Default if not found |

**Returns:** `*` — value, true (present but empty), or default

---

### `bw.copyToClipboard(text)`

Copy text to the system clipboard (browser only). Uses the modern Clipboard API when available, falls back to `document.execCommand('copy')`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `text` | `string` | - Text to copy |

**Returns:** `Promise` — that resolves when copy is complete

---

## File I/O

### `bw.saveClientFile(fname, data)`

Save data to a file. Works in both Node.js (fs.writeFile) and browser (download link).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `fname` | `string` | - Filename to save as |
| `data` | `*` | - Data to save (string or buffer) |

---

### `bw.saveClientJSON(fname, data)`

Save data as a JSON file with pretty formatting.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `fname` | `string` | - Filename to save as |
| `data` | `*` | - Data to serialize as JSON |

---

### `bw.loadClientFile(fname, callback, options)`

Load a file by path (Node.js) or URL (browser via XHR).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `fname` | `string` | - File path (Node) or URL (browser) |
| `callback` | `Function` | - Called with (data, error). data is null on error. |
| `options` | `Object` | - Options |
| `options.parser` | `string` | - "raw" for string, "JSON" to auto-parse |

**Returns:** `string`

---

### `bw.loadClientJSON(fname, callback)`

Load a JSON file by path (Node.js) or URL (browser).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `fname` | `string` | - File path (Node) or URL (browser) |
| `callback` | `Function` | - Called with (parsedData, error) |

**Returns:** `string`

---

### `bw.loadLocalFile(callback, options)`

Prompt user to pick a local file via file dialog (browser only).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `callback` | `Function` | - Called with (data, filename, error) |
| `options` | `Object` | - Options |
| `options.accept` | `string` | - File type filter (e.g. ".json,.txt") |
| `options.parser` | `string` | - "raw" for string, "JSON" to auto-parse |

---

### `bw.loadLocalJSON(callback)`

Prompt user to pick a local JSON file via file dialog (browser only).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `callback` | `Function` | - Called with (parsedData, filename, error) |

---

## Utilities

### `bw.to(x, baseTypeOnly)`

Short alias of `bw.typeOf()`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `x` | `*` | - Value to inspect |
| `baseTypeOnly` | `boolean` | - Collapse subtypes to the base type |

**Returns:** `string` — type name ('array', 'date', 'null', 'nan', ...)

**Example:**
```javascript
bw.to([1, 2])        // => 'array'
```

---

### `bw.h(tag, attrs, content, options)`

Hyperscript-style TACO constructor. A convenience helper that returns a canonical TACO object from positional arguments. The return value is a plain object — serializable, works with bwserve, and accepted everywhere TACO is accepted.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `tag` | `string` | - HTML tag name (e.g. 'div', 'p', 'section') |
| `attrs` | `Object|null` | - HTML attributes object. Pass null or omit to skip. |
| `content` | `*` | - Content: string, number, TACO object, or array of children. |
| `options` | `Object` | - TACO options (state, lifecycle hooks, render fn). |

**Returns:** `Object` — TACO object {t, a?, c?, o?}

**Example:**
```javascript
bw.h('div') // => { t: 'div' } bw.h('p', { class: 'bw_text_muted' }, 'Hello') // => { t: 'p', a: { class: 'bw_text_muted' }, c: 'Hello' } bw.h('ul', null, [ bw.h('li', null, 'one'), bw.h('li', null, 'two') ]) // => { t: 'ul', c: [{ t: 'li', c: 'one' }, { t: 'li', c: 'two' }] }
```

---

## Function Registry

### `bw.funcRegister(fn, name)`

Register a function in the global function registry. Registered functions can be invoked by name in HTML string contexts (e.g., onclick attributes) via `bw.funcGetById()`. Useful for serializable event handlers, LLM wire format, and SSR.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `fn` | `Function` | - Function to register |
| `name` | `string` | - Optional name. Auto-generated if omitted. |

**Returns:** `string` — registered name (use for dispatch)

---

### `bw.funcGetById(name, errFn)`

Retrieve a registered function by name. Returns the function if found, or `errFn` (or a no-op logger) if not.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | - Registered function name |
| `errFn` | `Function` | - Fallback if not found |

**Returns:** `Function` — registered function or fallback

---

### `bw.funcGetDispatchStr(name, argStr)`

Generate a dispatch string suitable for inline HTML event attributes.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | - Registered function name |
| `argStr` | `string` | - Arguments string (literal, not variable names) |

**Returns:** `string` — string like `"bw.funcGetById('name')(args)"`

---

### `bw.funcUnregister(name)`

Remove a function from the registry.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | - Registered function name |

**Returns:** `boolean` — if removed, false if not found

---

### `bw.funcGetRegistry()`

Get a shallow copy of the function registry for inspection.

**Returns:** `Object` — of registry (name → function)

---

## Component

### `bw.message(target, action, data)`

Dispatch a message to a component by UUID, CSS class, or selector. Finds the element, looks up el.bw, and calls the named method. This is the bitwrench equivalent of Win32 SendMessage(hwnd, msg, wParam, lParam).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `target` | `string` | - Component UUID (bw_uuid_*), CSS class, or selector |
| `action` | `string` | - Method name to call on el.bw |
| `data` | `*` | - Data to pass to the method |

**Returns:** `boolean` — if message was dispatched successfully

**Example:**
```javascript
bw.message('my_carousel', 'goToSlide', 2); // Or from SSE handler: es.onmessage = function(e) { var msg = JSON.parse(e.data); bw.message(msg.target, msg.action, msg.data); };
```

---

### `bw.formData(target)`

Collect form data from all input, select, and textarea elements within a container. Each element's `name` attribute (or `id` if no name) becomes a key in the returned object. This provides a lightweight alternative to the browser FormData API that returns a plain object suitable for JSON serialization or bw.pub(). Handles all standard HTML form controls: - text/number/email/etc inputs: string value - checkboxes: boolean (true/false) - radio buttons: string value of the checked radio (unchecked groups omitted) - multi-select: array of selected option values - textarea: string value Elements without both `name` and `id` attributes are silently skipped.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `target` | `string|Element` | - CSS selector, UUID string, or DOM element |

**Returns:** `Object` — object mapping field names to values

**Example:**
```javascript
// Given a form with name="email" input and name="agree" checkbox: var data = bw.formData('#signup-form'); // => { email: 'user@example.com', agree: true } // Collect and publish in one step: bw.pub('form:submit', bw.formData('#my-form')); // Works with any container, not just <form>: bw.pub('settings:changed', bw.formData('.settings-panel'));
```

---

### `bw.inspect(target, depth)`

Inspect a DOM element and its subtree, returning a plain-object representation with bitwrench metadata at each node. Useful for debugging, devtools, MCP/AG-UI tool discovery, and automated testing. Each node in the returned tree includes: - `tag` -- lowercase tag name (or '#text' for text nodes) - `id` -- element id (if set) - `uuid` -- bitwrench UUID class (if lifecycle-managed) - `type` -- component type from o.type (if set, e.g. 'card', 'tabs') - `classes` -- first 5 CSS classes (string, space-separated) - `handles` -- array of el.bw method names (if any) - `state` -- copy of _bw_state (if any) - `hasRender` -- true if _bw_render is set - `hasSubs` -- true if element has pub/sub subscriptions - `refs` -- copy of _bw_refs keys (if any) - `children` -- array of child node trees (up to depth limit, max 50 per level)

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `target` | `string|Element` | - CSS selector, UUID, or DOM element |
| `depth` | `number` | - Maximum recursion depth (0 = target only, no children) |

**Returns:** `Object|null` — object tree, or null if element not found

**Example:**
```javascript
// Get full tree from #app, 3 levels deep (default): var info = bw.inspect('#app'); // Shallow inspection (just the element, no children): var info = bw.inspect('#my-carousel', 0); console.log(info.handles); // ['next', 'prev', 'goToSlide'] console.log(info.type);    // 'carousel' // Deep inspection for debugging: console.log(JSON.stringify(bw.inspect('#app', 5), null, 2));
```

---

### `bw.catalog(type)`

Query the BCCL component registry. Returns metadata about registered component types -- their names and factory function names. Useful for tooling, introspection, documentation generators, and auto-complete systems (including MCP/AG-UI tool discovery). With no arguments, returns an array of all registered component types. With a type name, returns metadata for that single type (or null if the type is not registered).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `type` | `string` | - Optional component type name to look up |

**Returns:** `Array<Object>|Object|null` — of {type, factory} objects, a single {type, factory} object, or null if the type is not found

**Example:**
```javascript
// List all available component types: bw.catalog(); // => [{ type: 'card', factory: 'makeCard' }, //     { type: 'button', factory: 'makeButton' }, ...] // Look up a specific type: bw.catalog('accordion'); // => { type: 'accordion', factory: 'makeAccordion' } // Check if a type exists: if (bw.catalog('chart')) { ... } // Get just the type names: bw.catalog().map(function(c) { return c.type; }); // => ['card', 'button', 'container', 'row', ...]
```

---

## Data Utilities

### `bw.jsonPatch(obj, ops)`

Apply RFC 6902 JSON Patch operations to a plain object. Supported operations: add, remove, replace, move, copy, test. Paths use JSON Pointer (RFC 6901) notation: `/foo/bar/0`. Mutates the target object in place and returns it.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `obj` | `Object` | - Target object to patch |
| `ops` | `Array<Object>` | - Array of patch operations |
| `ops[].op` | `string` | - Operation: 'add', 'remove', 'replace', 'move', 'copy', 'test' |
| `ops[].path` | `string` | - JSON Pointer path (e.g. '/a/b/0') |
| `ops[].value` | `*` | - Value for add/replace/test |
| `ops[].from` | `string` | - Source path for move/copy |

**Returns:** `Object` — patched object (same reference)

**Example:**
```javascript
var obj = { a: 1, b: { c: 2 } }; bw.jsonPatch(obj, [ { op: 'replace', path: '/a', value: 10 }, { op: 'add', path: '/b/d', value: 3 }, { op: 'remove', path: '/b/c' } ]); // obj => { a: 10, b: { d: 3 } }
```

---

## Server (bwserve)

### `bw.actions`

Delegated dispatcher for `bw_act_*` class tokens: `{ enable, disable }`. Server-driven pages carry interactivity as classes, not code: a button with `class: 'bw_act_save'` fires the `save` action, which the client posts back to the server. One document-level listener handles every such element, so elements mounted later need no wiring. Off by default, and nothing turns it on for you: call `bw.actions.enable()` yourself. In particular `bw.connect()` does **not** enable it, so a page that only connects gets a live stream and dead clicks. Where the action goes depends on which client the page uses. With `bw.connect(url)` it posts to that same `url` as `{v:1, type:'event', action, value, name, ref, owner}`. With the bwserve thin client it posts to `/bw/return/action/<clientId>` as `{result:{action, data}}`. The C helper `bw_parse_action()` reads either.

**Example:**
```javascript
bw.actions.enable(); bw.mount('#app', { t: 'button', a: { class: 'bw_act_save' }, c: 'Save' });
```

---

### `bw.registerRemote(name, fn)`

Register a function the server may invoke by name over bwserve. The wire protocol carries data, never code: a `call` message names a remote registered here, and anything not registered is ignored. This is how a server-driven page exposes capabilities (`_bw_screenshot`, `_bw_query`) without the server sending executable code.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | - Name the server will call |
| `fn` | `Function` | - Handler, called with the message's argument object |

**Example:**
```javascript
bw.registerRemote('refreshChart', function(opts) { drawChart(opts.data); });
```

---

### `bw.connect(url)`

Connect this page to a bwserve endpoint over Server-Sent Events. Once connected, the server can mount, patch, append, remove and call registered remotes; the client posts actions and responses back. Publishes `bw:diag` with `code: 'remote_status'` as the connection state changes.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `url` | `string` | - SSE endpoint, e.g. '/bw/events' |

**Returns:** `Object|null` — client object, or null outside a browser

**Example:**
```javascript
bw.connect('/bw/events');
```

---

### `bw.apply(msg)`

Apply one bwserve protocol message to the DOM. This is the client half of server-driven UI. Dispatches one of the v:1 message types: mount    -- bw.mount(ref, taco) patch    -- bw.patch(ref, text/attrs/content) append   -- bw.append(ref, taco) replace  -- bw.replace(ref, taco) remove   -- bw.remove(ref) refresh  -- bw.refresh(ref) update   -- bw.update(ref, data) message  -- bw.message(ref, action, data) batch    -- iterate ops, calling bw.apply for each listen   -- subscribe to a pub/sub topic unlisten -- unsubscribe from a topic call     -- invoke a function registered with bw.registerRemote Target resolution: a ref starting with '#' or '.' is a CSS selector, otherwise it is an element id, then a bw.el() lookup. String `on*` attributes are stripped from wire TACOs, so a message can carry structure but never code.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `msg` | `Object` | - Protocol message, e.g. { type: 'mount', ref: '#app', taco: {...} } |

**Returns:** `boolean` — when the message was understood and applied

**Example:**
```javascript
bw.apply({ type: 'patch', ref: 'score', text: '42' });
```

---
