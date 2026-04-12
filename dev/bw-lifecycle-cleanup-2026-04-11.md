# Bitwrench Lifecycle Design (v2.0.26)

**Status**: Active design -- DO NOT IMPLEMENT until reviewed
**Target**: Move to `dev/bw-lifecycle-v2.md` after approval
**Prior art**: `dev/bw-lifecycle-design.md` (handle-object prototype),
`dev/bitwrench-component-lifecycle.md` (current v2.0.25 docs)

---

## The 6-Phase Lifecycle

Every bitwrench UI element follows this state machine:

```
define --> create --> hydrate --> mount --> update --> unmount
  |                                          ^         |
  |          (string path)                   |         |
  +------> bw.html() -----> HTML string      +---------+
```

Each phase has exactly ONE function that advances the element one step.
No function spans two phases. Convenience wrappers (bw.DOM, etc.) chain
multiple phases but the clean single-step path is always available.

---

## Phase 1: Define

**What happens**: User writes a TACO object. Pure data, no side effects.

| | |
|---|---|
| **Function** | None required. User writes `{t, a, c, o}` manually or uses `bw.h()` or a `bw.make*()` factory. |
| **Input** | User's intent |
| **Output** | TACO object `{t, a, c, o}` |
| **Side effects** | None |
| **Identity** | None. User MAY pre-assign UUID via `bw.assignUUID(taco)`. |
| **Classes stamped** | None |
| **In document** | No |

**Caveats**:
- TACO is plain data. It can be serialized to JSON (minus function values),
  sent over the wire, stored in a database, cloned, inspected.
- `bw.assignUUID(taco)` appends a `bw_uuid_*` token to `taco.a.class`.
  This is for pre-addressing only -- it does NOT register the UUID anywhere.
- `o` (options) holds lifecycle configuration: state, render, mounted,
  unmount, handle, slots, type. These are consumed by hydrate (phase 3).

---

## Phase 2: Create

**What happens**: TACO becomes an inert DOM node. Attributes set, children
built recursively. No lifecycle wiring, no identity, no side effects.

| | |
|---|---|
| **Function** | `bw.createDOM(taco)` |
| **Input** | TACO object (or primitive, null, bw.raw()) |
| **Output** | Inert DOM node (Element, Text, or DocumentFragment) |
| **Side effects** | None. Pure factory. |
| **Identity** | None stamped. Pre-assigned UUID in class string is preserved as-is but NOT registered. |
| **Classes stamped** | None by createDOM itself |
| **In document** | No |

**What createDOM does**:
- null/undefined -> empty text node
- bw.raw() -> fragment via innerHTML
- Primitives (string, number) -> text node
- TACO with `.t` -> createElement (or createElementNS for SVG)
  - Set attributes (style, class, events, value, booleans)
  - Build children recursively (call createDOM on each child)
  - Build `_bw_refs` map (id/uuid keyed child references)
  - Register in `_nodeMap` if element has `id` attribute

**What createDOM does NOT do (moved to later phases)**:
- ~~Stamp bw_uuid_* class~~
- ~~Add bw_lc class~~
- ~~Add bw_is_component class~~
- ~~Store _bw_state / _bw_render~~
- ~~Wire el.bw handle methods~~
- ~~Wire slot getters/setters~~
- ~~Fire mounted()~~

**Caveats**:
- The output node CAN be thrown away, cloned, or serialized.
  No cleanup needed because no lifecycle was wired.
- Event handlers (onclick etc.) ARE attached via addEventListener
  during create. These are DOM-level, not lifecycle-level.
- `_bw_refs` IS built during create (it's structural, not lifecycle).

---

## Phase 3: Hydrate

**What happens**: Wire lifecycle capabilities onto a created node.
State, render, handles, slots, callbacks stored. Element becomes
"capable but unborn" -- it can respond to handle methods but is not
yet in the document and has no UUID.

| | |
|---|---|
| **Function** | `bw.hydrate(node, taco)` -- NEW |
| **Input** | DOM node (from createDOM) + the TACO it was built from |
| **Output** | Same node reference, now with lifecycle wiring |
| **Side effects** | Stores properties on the DOM node. No registry changes. |
| **Identity** | `bw_uuid_*`: NO. Not stamped. (Deferred to mount.) |
| **Classes stamped** | `bw_lc` (lifecycle marker), `bw_is_component` (if component), `bw_is_component_bccl_{type}` (if o.type set) |
| **In document** | No |

**What hydrate does for each node/taco pair (parallel tree walk)**:
1. Extract `opts = taco.o || {}`
2. Determine if this is a component: has `opts.state`, `opts.handle`,
   `opts.methods`, `opts.mounted`, or `opts.unmount`
3. If component:
   a. Add `bw_lc` class (lifecycle marker)
   b. Add `bw_is_component` class
   c. If `opts.type`: add `bw_is_component_bccl_{type}` class,
      store `el._bw_type = opts.type`
   d. Store `el._bw_state = opts.state` (if present)
   e. Store `el._bw_render = opts.render` (if present)
   f. Store mounted/unmount callbacks on element:
      `el._bw_mounted_fn`, `el._bw_unmount_fn`
   g. Create `el.bw = {}` handle namespace
   h. Bind handle methods: `el.bw[key] = opts.handle[key].bind(null, el)`
   i. Create slot getters/setters via querySelector on the built tree
4. Recurse on children: walk `taco.c` paired with `node.childNodes`

**What hydrate does NOT do (deferred to mount)**:
- ~~Stamp bw_uuid_*~~ (mount stamps UUID when element enters document)
- ~~Register in _nodeMap by UUID~~ (needs UUID first)
- ~~Store in _unmountCallbacks~~ (needs UUID as key)
- ~~Fire mounted()~~ (element not in document yet)

**Why hydrate takes BOTH the node and the taco**:
The TACO holds `o` (options) -- that's where state, render, handle, slots,
mounted, unmount live. The DOM node alone doesn't carry that info. And we
do NOT stash `o` on the DOM node during create (no hidden properties leaking
between phases). The TACO is the source of truth.

Every caller already has the TACO:
- `bw.mount('#app', taco)` -- convenience, has it
- `bw.patch(ref, taco)` -- has the content
- Manual: user calls `bw.hydrate(node, myTaco)` -- passes both

**Caveats**:
- After hydrate, `el.bw.method()` works. State is accessible. But the
  element is NOT in the document.
- `node.cloneNode(true)` after hydrate gives a DOM-level clone (attributes
  and children copied). The clone does NOT have _bw_state, _bw_render, or
  el.bw -- those are JS properties, not DOM attributes. Each clone must be
  hydrated separately if lifecycle is needed.
- querySelector for slots works on detached trees. Handles are just bound
  functions. So hydrate works before mount.

---

## Phase 4: Mount

**What happens**: Element is placed in the document. UUID stamped.
Registered in caches. mounted() fires synchronously. The element is now
alive and addressable.

| | |
|---|---|
| **Function** | The pure mount step (inside convenience wrappers) |
| **Input** | Hydrated node + container element |
| **Output** | Mounted node (same reference) |
| **Side effects** | appendChild, UUID stamp, cache registration, mounted() fires |
| **Identity** | `bw_uuid_*` stamped on EVERY `.bw_lc` element in the tree |
| **Classes stamped** | `bw_uuid_*` (generated or pre-assigned) |
| **In document** | YES |

**What mount does**:
1. `container.appendChild(node)` -- element IS in the document
2. Walk tree for `.bw_lc` elements (lifecycle-managed):
   a. Check for pre-assigned UUID: `bw.getUUID(el)`
   b. If UUID exists AND `_nodeMap[uuid]` exists: **throw Error** (collision)
   c. If UUID exists and no collision: use it
   d. If no UUID: generate new `bw.uuid('uuid')`, add class to element
   e. Register `_nodeMap[uuid] = el`
   f. Move `el._bw_unmount_fn` to `_unmountCallbacks.set(uuid, fn)`
   g. Fire `el._bw_mounted_fn(el, el._bw_state || {})`, delete it
3. Return mounted element

**Caveats**:
- mounted() fires SYNCHRONOUSLY after appendChild. No rAF hack.
  The element IS in the document when mounted() runs.
- UUID collision = Error. This is an invariant. If a user pre-assigned
  a UUID (via assignUUID at define time) and that UUID is already mounted
  somewhere, mount throws. The user must call `bw.assignUUID(taco, true)`
  (forceNew) to get a fresh UUID before mounting a clone.
- User-assigned UUIDs from the define phase are preserved -- mount does
  not overwrite them.

---

## Phase 5: Update

**What happens**: Mounted component changes state or content.
Multiple tiers from lightest to heaviest.

| | |
|---|---|
| **Functions** | See tiers below |
| **Input** | Varies per tier |
| **Output** | Updated element |
| **Side effects** | DOM mutations |
| **Identity** | Unchanged |
| **In document** | Yes |

### Update tiers (lightest to heaviest)

| Tier | Function | What it does | Scope |
|---|---|---|---|
| **Handle method** | `el.bw.methodName(args)` | Component-owned DOM surgery | Single component |
| **Slot setter** | `el.bw.setTitle(value)` | Replace content at cached slot target | Single slot |
| **Slot broadcast** | `bw.updateSlot(ref, name, val)` | Update slot across 1+ components (NEW) | One or many |
| **Patch** | `bw.patch(ref, content)` | Replace content or attribute of any element | Single element |
| **Re-render** | `bw.update(ref)` | Tear down children, call _bw_render, rebuild | Full subtree |

**bw.updateSlot(ref, slotName, valueOrApplyFn) -> value[]** (NEW):
- ref: element, UUID string, or CSS selector
- If valueOrApplyFn is a function: `fn(currentValue) -> newValue`
- Always returns an array (even single match)
- Detection: `_UUID_RE.test(ref)` -> bw.el() (O(1)), else -> bw.$() (querySelectorAll)

**Caveats**:
- Handle methods and slot setters are the PRIMARY update path. They are
  surgical (one DOM node touched), preserve focus/scroll/transitions.
- bw.update() is the HEAVY path. Destroys children's focus, scroll,
  transitions, input state. Use only when DOM structure must change.
- "o.render is the heavy path" should be prominently documented.

---

## Phase 6: Unmount

**What happens**: Element torn down. Hooks fired. Registrations cleared.
State deleted. Element becomes inert.

| | |
|---|---|
| **Function** | `bw.cleanup(el)` |
| **Input** | Mounted element |
| **Output** | void |
| **Side effects** | Fires unmount hooks, deregisters from caches, unsubs pub/sub, deletes state |
| **Identity** | Removed from _nodeMap |
| **In document** | Removed by caller (cleanup does NOT remove from DOM) |

**What cleanup does**:
1. Find all `.bw_lc` elements in subtree
2. For each: get UUID, fire unmount callback, deregister from _nodeMap,
   call each unsub() in _bw_subs, delete _bw_state/_bw_render/_bw_refs
3. Check the element itself (same cleanup)

**Caveats**:
- cleanup() is already clean. No changes needed in v2.0.26.
- cleanup does NOT call `el.remove()`. The caller removes the element
  from the DOM after cleanup. Convenience wrappers (DOM, mount) handle
  both cleanup and removal.

---

## String Path (parallel, independent)

The DOM lifecycle (create -> hydrate -> mount -> update -> unmount) is
one path. The HTML string path is separate:

```
TACO --> bw.html(taco) --> HTML string
TACO --> bw.htmlPage(opts) --> complete HTML document
```

**Review of html()/htmlPage() is deferred** until the 6 DOM lifecycle
functions are clean. The string path does not go through create/hydrate/mount.
It stamps bw_uuid_* + bw_lc in markup if lifecycle hooks are present
(forward compat with future SSR rehydration).

No changes to html()/htmlPage() in v2.0.26.

---

## bw_* Class Namespace Registry

Every CSS class bitwrench uses follows a namespace convention.
The underscore form (`bw_card`) is the canonical form in source code.
CSS selectors also match the hyphenated form (`bw-card`) via dual selectors.

### Why classes (not data-* attributes)

> DOM IS the registry. querySelector on classes = native C++ speed.

All bitwrench addressing uses CSS classes. No `data-*` attributes anywhere
in bitwrench (removed in v2.0.19). Classes are standard, grep-able, and
selectable with CSS selectors. Tools like bw.inspect, bwcli, and browser
DevTools can find bitwrench elements using standard CSS selector queries.

### Namespace table

| Prefix | Owner | Purpose | When stamped | Example |
|---|---|---|---|---|
| `bw_uuid_*` | bitwrench lifecycle | Unique identity per mounted component | Phase 4 (mount) | `bw_uuid_a1b2c3d4e5` |
| `bw_lc` | bitwrench lifecycle | "Needs cleanup" marker. cleanup() finds via `.bw_lc` | Phase 3 (hydrate) | `bw_lc` |
| `bw_is_component` | bitwrench lifecycle | "Has state/methods/hooks". Component discovery via `.bw_is_component` | Phase 3 (hydrate) | `bw_is_component` |
| `bw_is_component_bccl_*` | bitwrench lifecycle | Typed component discovery from `o.type` | Phase 3 (hydrate) | `bw_is_component_bccl_table` |
| `bw_theme_alt` | bitwrench styles | Dark/alternate palette toggle | `toggleStyles()` | `bw_theme_alt` |
| `bw_bccl_*` | BCCL component library | Visual component classes (structural + themed CSS) | User writes in TACO.a.class (via make* factories) | `bw_bccl_card`, `bw_bccl_btn` |
| `bw_bccl_*_*` | BCCL component library | Sub-element classes | User writes in TACO.a.class (via make* factories) | `bw_bccl_card_header`, `bw_bccl_btn_sm` |
| `bw_*` (variant) | BCCL variant system | Palette color classes | variantClass() in BCCL | `bw_primary`, `bw_danger` |
| `bw_text_*`, `bw_py_*`, etc. | BCCL utility classes | Bootstrap-like utilities | User writes in TACO.a.class | `bw_text_muted`, `bw_py_3` |
| `bw_fn_*` | bw.html() string path | Serialized function registry keys | html() output | `bw_fn_42` |
| `bw_style_*` | bitwrench styles | Style element IDs (not CSS classes) | loadStyles/applyStyles | `bw_style_global` |

### Namespace policies

**Policy 1: `bw_uuid_*` is bitwrench-controlled, unique, always present on mounted components.**
- Format: `bw_uuid_<random>` (10+ hex chars)
- Stamped at mount time (phase 4), NEVER at create or hydrate
- Users CAN pre-assign via `bw.assignUUID(taco)` at define time
- Mount enforces uniqueness: collision = throw Error
- Every mounted lifecycle component (`bw_lc`) gets a `bw_uuid_*`. No exceptions.

**Policy 2: `bw_lc` means "this element needs cleanup."**
- Stamped at hydrate time (phase 3) on any element with lifecycle options
- Used by `bw.cleanup()` to find lifecycle-managed elements: `el.querySelectorAll('.bw_lc')`
- This is a PERFORMANCE marker -- without it, cleanup would have to check
  every descendant for _bw_state, _bw_render, etc.
- `bw_lc` is broader than `bw_is_component`. An element with only bw.sub() ties
  gets `bw_lc` (needs cleanup) but NOT `bw_is_component` (no state/methods/hooks).

**Policy 3: `bw_is_component` means "this is a real component with state/methods/hooks."**
- Stamped at hydrate time (phase 3) when `o.state`, `o.handle`, `o.methods`,
  `o.mounted`, or `o.unmount` is present
- Enables `document.querySelectorAll('.bw_is_component')` to find all live components
- Every `bw_is_component` element also has `bw_lc`. Not every `bw_lc` has `bw_is_component`.

**Policy 4: `bw_is_component_bccl_{type}` enables typed component discovery.**
- Stamped at hydrate time when `o.type` is set
- Format: `bw_is_component_bccl_` + type string (e.g., `bw_is_component_bccl_table`)
- Used by tools: `document.querySelectorAll('.bw_is_component_bccl_table')`
  finds all table components in the page
- User-defined components can use any type string

**Policy 5: BCCL component classes use `bw_bccl_` prefix.**
- RENAME from current: `bw_card` -> `bw_bccl_card`, `bw_btn` -> `bw_bccl_btn`
- Sub-elements: `bw_bccl_card_header`, `bw_bccl_card_body`, `bw_bccl_btn_sm`
- Rationale: clear separation from lifecycle classes (`bw_uuid_*`, `bw_lc`,
  `bw_is_component`) and from user classes
- Selecting all BCCL elements: `[class*="bw_bccl_"]`
- Selecting specific component type's styling: `.bw_bccl_accordion`
- This is a breaking change for CSS targeting current class names. Worth it
  for namespace clarity. Deprecation period: emit both old and new classes
  for one release, then drop old.

**Policy 6: Variant classes stay short: `bw_primary`, `bw_danger`, etc.**
- These are palette-level, not component-level. Used across many components.
- Adding `bw_bccl_` would be redundant: `bw_bccl_btn bw_bccl_primary` vs
  `bw_bccl_btn bw_primary`. The variant is not BCCL-specific.

**Policy 7: Utility classes stay as-is: `bw_text_*`, `bw_py_*`, etc.**
- Bootstrap-like utilities. Already namespaced with `bw_`.
- These are not BCCL components -- they're CSS utilities.

**Policy 8: HTML `id` attribute is USER-OWNED. bitwrench never assigns it.**
- bitwrench indexes elements by id in `_nodeMap` for O(1) lookup
- bitwrench NEVER generates or assigns an `id` attribute
- User can do whatever they want with `id`

**Policy 9: No `_bw_*` properties are public API.**
- `_bw_state`, `_bw_render`, `_bw_refs`, `_bw_type`, `_bw_subs` are
  internal implementation details stored on DOM elements
- Users access state via `el.bw.get()` / `el.bw.set()` (handle methods),
  NOT via `el._bw_state.count` directly
- Internal properties can change between releases without notice

---

## DOM Properties on Elements (internal, NOT public API)

| Property | Set by | Purpose | Cleaned by |
|---|---|---|---|
| `_bw_state` | hydrate | Component state object | cleanup |
| `_bw_render` | hydrate | Render function ref (for bw.update()) | cleanup |
| `_bw_refs` | createDOM | Parent->child fast lookup map | cleanup |
| `_bw_type` | hydrate | Component type string from o.type | cleanup |
| `_bw_subs` | bw.sub() | Array of unsub() functions | cleanup (each called) |
| `_bw_mounted_fn` | hydrate | Mounted callback (consumed by mount) | mount (deleted after call) |
| `_bw_unmount_fn` | hydrate | Unmount callback (moved to registry by mount) | cleanup |
| `el.bw` | hydrate | Handle namespace with bound methods | cleanup |

BCCL-specific (per-component, not core):

| Property | Set by | Purpose |
|---|---|---|
| `_bw_carouselIndex` | makeCarousel | Current slide index |
| `_bw_carouselInterval` | makeCarousel | Auto-play interval ID |
| `_bw_chipValue` | makeChipInput | Chip text value |
| `_bw_escHandler` | makeModal | Escape key handler ref |
| `_bw_outsideHandler` | makeDropdown/makePopover | Outside-click handler ref |

---

## Relationship Diagram: bw_lc vs bw_is_component vs bw_uuid_*

```
All DOM elements created by bitwrench
|
+-- Plain elements (no lifecycle)
|   e.g. {t:'p', c:'hello'}
|   Classes: none from bitwrench (user's classes only)
|   Properties: none
|
+-- Elements with pub/sub ties only (via bw.sub(..., el))
|   Classes: bw_lc, bw_uuid_*
|   Properties: _bw_subs
|   NOT bw_is_component (no state/methods/hooks)
|
+-- Components (have o.state, o.handle, o.mounted, etc.)
    Classes: bw_lc, bw_is_component, bw_uuid_*
    Properties: _bw_state, _bw_render, el.bw, etc.
    |
    +-- BCCL components (have o.type)
        Classes: bw_lc, bw_is_component, bw_is_component_bccl_{type}, bw_uuid_*
        Properties: all above + _bw_type
```

---

## Overloaded Functions (to sort out after lifecycle phases are clean)

These functions currently span multiple lifecycle phases. They will be
refactored to become thin wrappers around the clean single-step functions.

| Function | Lines | Currently does | Target: becomes |
|---|---|---|---|
| `bw.createDOM()` | 959-1180 | create + hydrate + partial mount | Pure create only (phase 2) |
| `bw.DOM()` | 1213-1267 | cleanup + create + hydrate + mount, returns container | Wrapper: cleanup + create + hydrate + mount, calls single-step functions |
| `bw.mount()` | 1288-1299 | cleanup + create + append, returns root | Wrapper: cleanup + create + hydrate + mount, returns root element |
| `bw.el()` | 347-384 | 4 resolution modes + optional apply | Keep polymorphic (resolution is its job). Apply is a convenience. |
| `bw.$()` | 2717-2738 | multi-match + optional apply | Same as el(), multi-match version |
| `bw.patch()` | 1438-1463 | branches on content type (attr/text/TACO/array) | Needs create+hydrate when patching TACO content into mounted tree |
| `bw.sub()` | 1634-1660 | stamps UUID on element if missing | Should only work on hydrated elements. Stamps bw_lc + bw_uuid (mini-hydrate). |

NOT overloaded (already clean):
- `bw.cleanup()` -- single responsibility, no changes needed
- `bw.update()` -- calls _bw_render + emits statechange
- `bw.pub()` / `bw.unsub()` -- clean pub/sub
- `bw.html()` / `bw.htmlPage()` -- string path (review later)
- `bw.assignUUID()` / `bw.getUUID()` -- clean identity ops
- `bw.message()` -- clean dispatch

---

## Open Design Questions

### Q1: Handle API shape

Two designs exist:

**A. el.bw pattern (current v2.0.25)**:
- Methods on the DOM element: `el.bw.increment(5)`
- State access: `el._bw_state.count` (raw, uncontrolled)
- Registry: `_nodeMap[uuid] = el`
- Lookup: `bw.el(uuid)` -> element

**B. Handle object (prototype in dev/bw-lifecycle-design.md)**:
- Standalone handle: `handle.increment(5)`
- State access: `handle.get('count')`, `handle.set('count', 5)`, `handle.getState()`
- Registry: `_handles[uuid] = handle`
- Lookup: `bw.getHandle(uuid)` -> handle
- Back-ref: `el._bwHandle = handle`
- Keyword: `o.methods` (instead of `o.handle`)
- Flag: `handle.mounted` (boolean)
- `bw.isComponent(taco)` predicate

**Tradeoffs**: Handle object gives controlled state access and encapsulation.
el.bw is simpler and doesn't need a second registry. Handle object was
prototyped with 150 tests passing.

**DECISION NEEDED before implementation.**

### Q2: o.handle vs o.methods keyword

Current source uses `o.handle`. Prototype uses `o.methods`.
`o.methods` is clearer (avoids overloading "handle" which also means
"the handle object"). `o.handle` could be renamed to `o.methods` regardless
of which API shape we choose.

### Q3: BCCL class rename timeline

Renaming `bw_card` -> `bw_bccl_card` across ~100 classes is a large
mechanical change touching bitwrench-bccl.js, bitwrench-styles.js,
all pages/*.html, all examples/*.html, and tests.

Options:
- Do it in v2.0.26 alongside the lifecycle cleanup
- Do it in a separate release to keep changes focused
- Deprecation period: emit both for one release

### Q4: Event listener tracking (_bw_listeners)

The lifecycle prototype tracks event listeners in `el._bw_listeners` for
cleanup (removeEventListener). Current code does NOT track them. Without
tracking, event listeners leak when elements are removed without cleanup.

Should _bw_listeners tracking be added in v2.0.26?

---

## What This Document Does NOT Cover (deferred)

- bw.html() / bw.htmlPage() string path details (review after DOM lifecycle)
- bw.tree() / bw.inspect() debug tooling improvements
- Composition patterns (documented in dev/bw-lifecycle-design.md)
- bwserve protocol changes
- Full BCCL class rename implementation plan
- Test plan for new lifecycle functions
