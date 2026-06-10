# Bitwrench Lifecycle Design (v2.0.26) -- v1.0 (SUPERSEDED)

**Status**: SUPERSEDED by `bw-lifecycle-cleanup-2026-04-11-v1.1.md`
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

## Framework Lifecycle Comparison

How other frameworks and paradigms handle each of the 6 lifecycle phases.
bitwrench does not need to copy any of these -- but we need to verify we
have answers for the same problems they solve, even if our answers are
structurally different.

### Phase-by-phase comparison

#### Phase 1: Define (declaring what the component IS)

| Framework | Mechanism | Data shape | Serializable? |
|---|---|---|---|
| **Vanilla JS** | No formal spec. Write HTML strings, template literals, or createElement calls. | Strings or imperative code | N/A |
| **Bootstrap 5** | Static HTML markup in the page. JS config via `data-bs-*` attributes or object literal. | HTML + config object | Config yes, markup yes |
| **React** | JSX (compiles to `React.createElement()`) returns element descriptor. Pure data. | `{type, props, children}` | Yes (minus functions) |
| **Vue 3** | SFC `.vue` file (template + script + style) or render function. `reactive()`/`ref()` for state. | Compiler output + reactive proxies | No (compiler required) |
| **SolidJS** | JSX compiles to real DOM creation code at build time. Component is a function that runs once. | Compiled functions | No (compiler required) |
| **Angular** | `@Component` decorator + template string/file + TypeScript class. | Class + metadata | No (compiler required) |
| **MFC/Qt** | C++ class declaration. Message maps (MFC) or signals/slots (Qt) declared in header. | C++ class definition | No |
| **bitwrench** | TACO object `{t, a, c, o}`. Written by hand, `bw.h()`, or `bw.make*()` factory. | Plain JS object | Yes (minus functions in `o`) |

**Key insight**: bitwrench and React are the only two where the component
definition is a plain serializable data structure (not compiler output or
a class). TACO is closer to React elements than to anything else here --
but without the VDOM reconciliation layer that React elements feed into.

#### Phase 2: Create (definition becomes something real)

| Framework | Mechanism | Output | Side effects |
|---|---|---|---|
| **Vanilla JS** | `document.createElement()` + manual setAttribute/appendChild | DOM node | None (node is detached) |
| **Bootstrap 5** | N/A (HTML is pre-authored in markup, not created by BS) | N/A | N/A |
| **React** | Reconciler diffs VDOM. On initial render, creates real DOM nodes via fiber tree. | Fiber nodes -> DOM nodes | Managed by React runtime |
| **Vue 3** | Render function produces VNodes. Patch algorithm creates real DOM. | VNodes -> DOM nodes | Managed by Vue runtime |
| **SolidJS** | Compiled JSX IS the create step. `document.createElement()` calls emitted by compiler. | DOM nodes directly | None (reactive bindings deferred) |
| **Angular** | Component factory + DI container instantiate component. Template compiled to creation instructions. | Component instance + DOM | DI resolution |
| **MFC/Qt** | Constructor allocates object, sets member defaults. No window/widget yet. | C++ object (no visual) | Memory allocation |
| **bitwrench** | `bw.createDOM(taco)` recursively builds DOM tree. Sets attrs, children, events. | Inert DOM node | Event listeners attached |

**Key insight**: bitwrench's create is most similar to SolidJS (direct DOM
creation, no virtual intermediary) and vanilla JS. The difference is TACO
as input rather than imperative calls or compiler output.

#### Phase 3: Hydrate (wire behavior onto structure)

| Framework | Mechanism | What gets wired | Separate from create? |
|---|---|---|---|
| **Vanilla JS** | Manual. User attaches event listeners, stores references. | Whatever the user writes | No formal phase |
| **Bootstrap 5** | Constructor: `new bootstrap.Modal(el, config)`. Parses config, stores on internal map, wires event listeners. | Config, event listeners, internal state (`_isShown` etc.) | YES -- element exists first, then constructor wires it |
| **React** | Part of commit phase. `useEffect`, `useRef`, `useCallback` attach after DOM creation. | Effects, refs, callbacks | Partially (effects run after paint) |
| **Vue 3** | Reactivity system wraps component data in Proxy. Watcher/computed setup. Template bindings resolved. | Reactive deps, watchers, computed, template bindings | No (interleaved with create) |
| **SolidJS** | Reactive bindings (`createEffect`, `createMemo`) execute, subscribe to signals, attach DOM updaters. | Signal subscriptions, effect cleanup fns, ownership tree | YES -- component fn runs once, bindings are separate from DOM creation |
| **Angular** | Change detection wires bindings between template expressions and component properties. DI injects services. | Bindings, DI refs, lifecycle hooks | Partially (ngOnInit after construction) |
| **MFC/Qt** | `Create()`/`show()` creates the OS window, attaches message handlers, lays out children. | OS handles, message routing, layout | YES -- construction != creation |
| **bitwrench** | `bw.hydrate(node, taco)` -- NEW. Stores state, render, handles, slots, mounted/unmount fns. Adds bw_lc class. | _bw_state, _bw_render, el.bw, slot getters/setters, callback fns | YES (proposed split) |

**Key insight**: Bootstrap 5 is the closest analogue to bitwrench's hydrate.
Both take an existing DOM element and wire behavior onto it from a config
object. Bootstrap's `new Modal(el, config)` is structurally similar to
`bw.hydrate(el, taco)`. MFC/Qt also have this pattern (construct object,
then Create() to make it live). React/Vue/Solid interleave hydration with
creation and don't expose it as a separate step.

#### Phase 4: Mount (enter the document, become alive)

| Framework | Mechanism | When hooks fire | Identity assigned |
|---|---|---|---|
| **Vanilla JS** | `parent.appendChild(el)`. No hooks. | N/A | N/A |
| **Bootstrap 5** | Element already in document (server-rendered). Constructor fires on already-mounted DOM. | show.bs.modal event on visibility, not mount | getInstance() registry key = element reference |
| **React** | ReactDOM `createRoot(container).render(element)`. Commit phase inserts into DOM. | componentDidMount / useEffect (after paint) | React internal fiber ID (not exposed) |
| **Vue 3** | `app.mount('#el')`. Patch algorithm inserts created nodes. | onMounted() (after insertion, sync in same tick) | Component internal uid |
| **SolidJS** | `render(Component, container)`. Already-created DOM nodes appended. | onMount() (after DOM insertion, before paint) | Ownership tree node (internal) |
| **Angular** | ViewContainerRef inserts component view. Router outlet or structural directive. | ngAfterViewInit (after view creation) | Component reference via ViewRef |
| **MFC/Qt** | `ShowWindow()` / `widget->show()`. Window becomes visible and receives messages. | WM_CREATE (MFC), showEvent (Qt) | HWND (MFC), QObject pointer (Qt) |
| **bitwrench** | appendChild + walk .bw_lc tree: stamp UUID, register _nodeMap, fire mounted(). | mounted() fires synchronously after appendChild | bw_uuid_* class (auto-generated or pre-assigned) |

**Key insight**: bitwrench's mount is closest to Vue (synchronous hook after
insertion) and MFC/Qt (explicit show + system registration). React's
useEffect-after-paint model is intentionally different -- bitwrench's
synchronous mounted() is a deliberate choice (element IS measurable when
hook runs). SolidJS onMount is also before paint, like ours.

#### Phase 5: Update (change something while mounted)

| Framework | Granularity levels | Automatic? | Preserves focus/scroll? |
|---|---|---|---|
| **Vanilla JS** | Manual DOM mutation. Any granularity. | No | Developer's responsibility |
| **Bootstrap 5** | Instance methods: `show()`, `hide()`, `setContent()`. No partial update. | No (must call methods) | Yes (methods are surgical) |
| **React** | setState -> full component re-render -> VDOM diff -> minimal DOM patches. | Yes (on state change) | VDOM diff preserves unchanged nodes. Inputs lose focus on key change. |
| **Vue 3** | Reactive proxy mutation -> dep tracking -> targeted re-render -> VDOM patch. | Yes (reactive tracking) | Patch preserves unchanged nodes. Finer than React. |
| **SolidJS** | Signal change -> subscribed effects re-run -> direct DOM node update. No re-render. | Yes (signal subscription) | YES -- updates target exact DOM node, no diffing |
| **Angular** | Change detection cycle -> template re-evaluation -> DOM update. Signals (v17+) for fine-grained. | Yes (zone.js or signal) | Template bindings update in-place |
| **MFC/Qt** | Method calls: `setText()`, `setValue()`, `update()/repaint()`. Explicit. | No (must call methods) | Yes (methods are surgical) |
| **bitwrench** | 5 tiers: handle method > slot setter > updateSlot > patch > update(re-render). | No (must call explicitly) | Handle/slot/patch: YES. update(): NO (full rebuild) |

**Key insight**: bitwrench's update model is MFC/Qt-style (explicit method
calls), not React/Vue/Solid-style (automatic on state change). This is a
deliberate design choice -- no magic, no dependency tracking, no surprise
re-renders. The tradeoff: more manual work for the developer, but completely
predictable behavior. SolidJS is interesting because its signals give
automatic updates WITHOUT full re-renders -- the update targets the exact
DOM node, same as a bitwrench handle method, but triggered automatically.

#### Phase 6: Unmount (tear down, clean up)

| Framework | Mechanism | What gets cleaned | Caller removes from DOM? |
|---|---|---|---|
| **Vanilla JS** | `el.remove()`. Manual cleanup of listeners, timers, refs. | Whatever developer remembers | Yes |
| **Bootstrap 5** | `instance.dispose()`. Removes listeners, nullifies refs, deletes from registry. | Event listeners, internal state, registry entry | No (element stays in DOM) |
| **React** | Component removed from VDOM -> commit phase removes DOM. useEffect cleanup runs. | Effects, refs, subscriptions (if coded in cleanup) | React removes |
| **Vue 3** | `app.unmount()` or reactive conditional removes component. onUnmounted() hook fires. | Watchers, computed, event listeners, child components (recursive) | Vue removes |
| **SolidJS** | Owner disposal traverses ownership tree. onCleanup() callbacks fire leaf-to-root. | Effects, signal subscriptions, child owners (recursive) | Solid removes |
| **Angular** | ViewRef.destroy() or router navigation. ngOnDestroy() hook fires. | Subscriptions, DI refs, child components | Angular removes |
| **MFC/Qt** | `DestroyWindow()` (MFC) / `deleteLater()` (Qt). Destructor chain fires. | OS handles, child widgets (recursive), signal connections | Framework removes |
| **bitwrench** | `bw.cleanup(el)` walks .bw_lc subtree: fire unmount, deregister, unsub, delete state. | _bw_state, _bw_render, _bw_refs, _bw_subs, _unmountCallbacks, _nodeMap entry | NO -- caller removes after cleanup |

**Key insight**: bitwrench's cleanup is most like Bootstrap's dispose() --
the caller is responsible for DOM removal, cleanup handles the JS side.
React/Vue/Solid/Angular all handle DOM removal themselves as part of their
reconciliation. The bitwrench choice is intentional: cleanup and removal
are separate concerns. This lets you clean up without removing (e.g.,
prepare for re-hydration) or remove without cleanup (rare, but possible
for throwaway elements).

---

### Cross-Cutting Concerns Comparison

These concerns span multiple phases and are often where framework designs
diverge most. bitwrench needs a clear answer for each, even if lighter.

#### State Management

| Framework | Local state | Shared state | Derived state | State access control |
|---|---|---|---|---|
| **Vanilla JS** | Variables in closure | Global variables, custom event bus | Manual computation | None |
| **Bootstrap 5** | Internal `_config`, `_isShown` etc. (private) | None built-in | None | No public state API. Methods only. |
| **React** | `useState`, `useReducer` | Context, Redux, Zustand, Jotai | `useMemo`, selector fns | Immutable -- must use setter |
| **Vue 3** | `ref()`, `reactive()` | `provide`/`inject`, Pinia stores | `computed()` | Proxy-mediated, deep tracking |
| **SolidJS** | `createSignal` | Context + signals, `createStore` | `createMemo` | Getter/setter pair (read/write separated) |
| **Angular** | Component properties | Services (DI), NgRx, `signal()` (v17+) | `computed()` (v17+), RxJS `pipe` | Signals: getter fn. Services: public API. |
| **MFC/Qt** | Member variables | Singleton services, signals across objects | Manual computation | Public/private/protected (C++ access control) |
| **bitwrench** | `el._bw_state` (internal), accessed via `el.bw.*` methods | pub/sub store pattern (plain object + topic-scoped pub/sub) | Just a function: `fn(state) -> derived` | Currently raw (_bw_state is accessible). Handle methods are the intended gate. |

**Gap for bitwrench**: State access is uncontrolled. `el._bw_state.count`
works directly, bypassing handle methods. Every other framework either
enforces immutability (React), uses proxies (Vue), separates getter/setter
(Solid), or uses C++ access control (MFC/Qt). bitwrench should either:
(a) add `el.bw.getState()` / `el.bw.setState(patch)` as built-in handle
methods auto-created during hydrate, or (b) accept raw access as a feature
("you're an adult, we trust you"). Bootstrap 5 is the model for (a) --
it has NO public state access, methods only.

#### Intra-Component Messaging

| Framework | Parent -> Child | Child -> Parent | Sibling | Decoupled (any -> any) |
|---|---|---|---|---|
| **Vanilla JS** | Direct method call or property set | Callback functions, custom events | Via shared parent or global | Custom event bus, CustomEvent on DOM |
| **Bootstrap 5** | Instance methods: `modal.show()` | DOM events: `show.bs.modal` bubbles up | Not supported | Not supported |
| **React** | Props (one-way data flow) | Callback props, `forwardRef` + `useImperativeHandle` | Lift state to common parent | Context, external stores |
| **Vue 3** | Props, `provide`/`inject` | `$emit`, custom events | Via parent or shared store | Event bus (mitt), Pinia stores |
| **SolidJS** | Props (signals passed by ref) | Callback props | Via parent or shared signal | Context + signals, module-level stores |
| **Angular** | `@Input` bindings | `@Output` + EventEmitter | Via shared service | Services with Observables, signals |
| **MFC/Qt** | Direct method call, `SendMessage` | Signals/slots (Qt), `WM_NOTIFY` (MFC) | Via parent or mediator | Signals/slots (Qt), message routing (MFC) |
| **bitwrench** | `el.bw.method()`, `bw.message(target, action, data)`, `bw.patch()` | `bw.emit()` (DOM event, bubbles), pub/sub | pub/sub on shared topic | pub/sub (`bw.pub`/`bw.sub`), DOM events via `bw.emit`/`bw.on` |

**Assessment for bitwrench**: Coverage is solid. Parent->child via direct
method call (MFC/Qt-like). Child->parent via bubbling DOM events (Bootstrap-like).
Decoupled via pub/sub (similar to Qt signals/slots but topic-based).
`bw.message()` adds named dispatch. No gaps here -- just needs documentation
clarity on which pattern to use when.

#### Scale (1000+ Live Components)

| Framework | Update cost model | Registry overhead | Known scaling limits |
|---|---|---|---|
| **Vanilla JS** | O(1) per manual update | None | None (all manual) |
| **Bootstrap 5** | O(1) per method call | One Map entry per instance | Tooltip/Popover: must manually init, perf warning in docs |
| **React** | O(tree) per re-render, fiber scheduler prioritizes | Fiber tree per component | Large lists need virtualization. Frequent setState on many components = scheduler pressure. |
| **Vue 3** | O(affected watchers) per reactive change | Proxy per reactive object, watcher per dep | Deep reactive objects create many proxies. Compiler mitigates with static hoisting. |
| **SolidJS** | O(1) per signal change (direct DOM update) | Signal subscription list per binding | Ownership tree growth. 10K+ signals = measurable subscription overhead. |
| **Angular** | O(component tree) per CD cycle (default), O(1) with OnPush/signals | DI container per component | Default CD checks entire tree. OnPush + signals fix this. |
| **MFC/Qt** | O(1) per method call, repaint only dirty region | OS window handle per widget | Windows: ~10K HWND limit per process. Qt: no hard limit. |
| **bitwrench** | O(1) for handle/slot/patch, O(subtree) for update() | _nodeMap entry per UUID, _unmountCallbacks entry per lifecycle component | **Not tested at 1000+ scale.** querySelectorAll('.bw_lc') on large trees could be slow in cleanup. _nodeMap is plain object (no Map), GC characteristics unknown at scale. |

**Practical framing**: How many live components does a real (non-game) app
actually have? A complex dashboard: 50-100. A form-heavy SPA: 20-50 per
view. A chat app: 1 per visible message, maybe 100 with virtualization.
The "1000 component" benchmark is synthetic. At realistic counts (dozens
to low hundreds), all frameworks are fast -- the bottleneck is browser
layout/paint, not JS dispatch.

The frameworks that struggle at scale are the ones without a live component
model -- React and Vue must diff VDOM trees proportional to the re-rendered
subtree to figure out what changed. bitwrench, Solid, and MFC/Qt know
exactly what changed (the developer or signal told them) and touch exactly
those DOM nodes. No diffing, no guessing.

That said, bitwrench should still verify with a simple benchmark (1000
counters: create, update, destroy) just to confirm there are no surprises
in _nodeMap, querySelectorAll('.bw_lc'), or pub/sub linear scan. This is
a 1-hour testing task, not a design issue.

#### Live Updates (Server Push)

| Framework | Built-in mechanism | Protocol | Granularity |
|---|---|---|---|
| **Vanilla JS** | None. WebSocket/SSE + manual DOM manipulation. | Whatever you build | Whatever you code |
| **Bootstrap 5** | None | N/A | N/A |
| **React** | None built-in. React Server Components (RSC) stream from server. Third-party: socket.io, SWR, React Query. | RSC: streaming HTTP. Others: WebSocket/HTTP. | RSC: component-level. Others: data-level (triggers re-render). |
| **Vue 3** | None built-in. Nuxt server components. Third-party: socket.io, VueUse. | HTTP streaming, WebSocket | Data-level (reactive state update triggers re-render) |
| **SolidJS** | SolidStart server functions, resources with Suspense. | HTTP streaming | Data-level (signal update -> direct DOM update) |
| **Angular** | HttpClient + RxJS Observables. Real-time via WebSocket or SSE wrapped in Observable. | HTTP, WebSocket, SSE | Data-level (observable emission triggers change detection) |
| **MFC/Qt** | `PostMessage()` across threads (MFC). Signals/slots across threads (Qt). QWebSocket. | OS message queue, TCP | Message-level (handler does the DOM work) |
| **bitwrench** | **bwserve** -- SSE-based server-driven UI. 9 protocol message types. Server pushes TACO. | SSE (HTTP/1.1 streaming). WebSocket deferred. | replace (full swap), patch (surgical text/attr), update (trigger client render), append, remove, redirect, eval, event, screenshot |

**Assessment for bitwrench**: bwserve is a genuine differentiator. Most
frameworks require the developer to wire up WebSocket -> state update ->
re-render. bwserve pushes TACO directly -- server controls the UI without
client-side state management. Closest analogue is Phoenix LiveView (Elixir)
or Laravel Livewire (PHP), not any JS framework.

**Gap**: After the lifecycle refactor, bwserve's `replace` message type calls
`bw.DOM(target, taco)` which internally chains all phases. Server-sent TACOs
can't contain functions, so hydrate is a no-op for server-sent content. This
is clean and correct. BUT: if a client wants to attach lifecycle to
server-sent structure (e.g., server sends a form, client adds validation
handles), there's no clean path today. This is a future pattern ("re-hydrate"),
not a v2.0.26 blocker.

#### Inspectability / Dev Tools

| Framework | Built-in inspection | External tooling | LLM/automation story |
|---|---|---|---|
| **Vanilla JS** | None | Browser DevTools (Elements, Console) | Playwright, Puppeteer |
| **Bootstrap 5** | `getInstance(el)` returns instance | Browser DevTools. No dedicated extension. | Playwright (no special support) |
| **React** | None built-in | React DevTools browser extension: component tree, state, profiler, highlights | Playwright. React Testing Library. No direct LLM integration. |
| **Vue 3** | None built-in | Vue DevTools extension: component tree, state, timeline, Pinia, performance | Playwright. Vue Test Utils. No direct LLM integration. |
| **SolidJS** | None built-in | solid-devtools extension (early): component tree, signal state | Playwright. solid-testing-library. |
| **Angular** | None built-in | Angular DevTools extension: component tree, change detection profiler, router | Playwright. TestBed. |
| **MFC/Qt** | Qt Creator Inspector | Spy++ (MFC), GammaRay (Qt). Deep runtime introspection. | Not designed for automation |
| **bitwrench** | `bw.inspect(el)` returns plain object tree. `bw.catalog()` lists component types. querySelector('.bw_is_component') finds all. | bwcli (dev server), bwserve remote screenshot, bwattach for remote LLM-driven debug | **LLM can direct-drive via bwattach**: inspect -> reason -> patch -> screenshot -> iterate. Order of magnitude simpler than Playwright for closed-loop debug. |

**Assessment for bitwrench**: bitwrench's inspectability is genuinely
superior for LLM-driven workflows. Key advantages:
- `bw.inspect()` returns structured data (not a browser extension panel)
- CSS class-based identity means querySelector works in any context
- bwserve remote screenshot + inspect = no browser extension needed
- bwattach gives an LLM a direct control loop (inspect, mutate, verify)

React/Vue DevTools are richer for HUMAN developers (visual component tree,
time-travel debugging, profiler). bitwrench is richer for MACHINE consumers
(structured output, direct API access, no extension dependency).

No gaps here -- this is a strength. Document it prominently.

#### Reactivity / Signals

| Framework | Reactive primitive | Tracking mechanism | Update granularity | Opt-in or default? |
|---|---|---|---|---|
| **Vanilla JS** | None | None | Manual | N/A |
| **Bootstrap 5** | None | None | Method calls | N/A |
| **React** | useState/useReducer (not signals) | Re-render on setState. No dep tracking. | Full component re-render, diffed via VDOM | Default (setState = re-render) |
| **Vue 3** | ref()/reactive() (Proxy-based signals) | Proxy get/set traps track deps automatically | Watcher-level (finer than component) | Default (all state is reactive) |
| **SolidJS** | createSignal, createStore | Getter execution during effect registers subscription | DOM-node-level (finest possible) | Default (signals are the core model) |
| **Angular** | signal() (v17+), zone.js (legacy) | Signal: explicit getter. Zone.js: async op interception. | Signal: fine-grained. Zone.js: component tree. | Signals opt-in (v17+). Zone.js default (legacy). |
| **MFC/Qt** | None (Qt signals are events, not reactive signals) | None | Method calls | N/A |
| **bitwrench** | None. pub/sub + method calls IS the reactivity model. | None (explicit dispatch) | Handle/slot: DOM-node-level. update(): full subtree. | N/A |

**Why pub/sub + method calls, not signals:**

SolidJS signals are the most interesting comparison point because they
achieve the same end result as bitwrench handle methods -- a direct update
to a specific DOM node, no VDOM diff. The difference is automatic (signal
subscription) vs explicit (pub/sub -> method call). Here's why bitwrench
uses the explicit path:

**Component "melting" vs component persistence.** In SolidJS, the component
function runs once and dissolves. After execution, there is no component --
just a bag of signal->DOM-node bindings. The component ceases to exist as
an entity. In bitwrench, the component persists for its entire lifecycle.
`el.bw` is there from mount to unmount. You talk to the component, the
component talks to its DOM. Nobody reaches through the component boundary.

This matters because:
1. **Side effects are colocated.** When `el.bw.setCount(5)` runs,
   validation, animation, sibling updates, logging, and the actual DOM
   mutation all live in one handle method. In Solid, the signal->DOM binding
   is in JSX, the side effects are in `createEffect()`, and the validation
   is somewhere else. Three pieces that must be understood together but
   live apart.
2. **The component is the gate.** pub/sub calls the component's method.
   The component decides how to update its DOM -- it can validate, reject,
   batch, or transform. SolidJS signals let anyone with a setter reference
   mutate state that directly touches the DOM. No gate.
3. **Inspectability.** Once a Solid component melts, you can't
   `querySelectorAll('.component')` to find it. solid-devtools reconstructs
   the component tree from the internal ownership graph. In bitwrench,
   `querySelector('.bw_is_component')` finds every live component because
   they're still components.

**Where signals genuinely shine (and bitwrench doesn't):** Derived state
with complex dependency graphs. If 5 data sources combine into 3 computed
values feeding 10 DOM nodes, Solid's `createMemo` auto-tracks deps and
only recomputes what changed. In bitwrench, you write the pub/sub wiring
manually. More code, more chances for a missed dependency. But for
bitwrench's target use cases (embedded, prototyping, server-driven, IoT
dashboards), dependency graphs are shallow. Explicit pub/sub is clearer
than automatic tracking when the graph has <20 nodes.

**Practical performance reality:** The dispatch mechanism (signal vs pub/sub
vs direct method call) is irrelevant at real-world scale. The bottleneck
is ALWAYS the browser's layout/paint pass after DOM mutation, not the JS
that decided to make the mutation. `el.textContent = 'new'` costs
microseconds; the reflow it triggers costs milliseconds. Whether you got
to that line via a signal subscription, a pub/sub handler, or a direct
method call makes no measurable difference.

The frameworks that DO have a performance problem at scale are the ones
that must **guess what changed** by diffing large VDOM trees (React, Vue
without compiler optimizations). They pay O(tree) cost on every state
change to figure out which DOM nodes to touch. Frameworks with a live
component model (bitwrench, Solid, MFC/Qt, Bootstrap) know exactly what
changed and go directly to the DOM node -- O(1) per update regardless
of tree size.

For any non-game application, a few dozen component updates per user
action is typical. At that scale, ALL frameworks are fast. The "1000s of
updates per frame" benchmark is synthetic marketing, not a real use case.
The practical question isn't "can it handle 10K updates?" but "is the
update mental model clear enough that a developer (or LLM) can wire it
correctly on the first try?" That's a documentation and examples problem,
not a runtime problem.

**TODO**: bitwrench needs more pub/sub examples and possibly helpers
showing the common patterns:
- pub -> many subscribers (each component updates itself)
- pub -> single subscriber (coordinator fn updates multiple elements)
- bw.update() as the heavy path (when structure changes, not just values)
These should be in docs and in example pages so the mental model is clear.

### Alternative Update Paths: Direct DOM vs Method Dispatch

Someone will ask: "why not skip the handle method and write directly to
the DOM via bw.el()? It's faster." This section documents the tradeoffs
so the question has a clear answer -- and if someone sees something we
missed, they can file a PR.

**Path A: Method dispatch (recommended)**
```
bw.pub('data:update', newData)
--> subscriber calls bw.message(uuid, 'setValue', newData.count)
    --> el.bw.setValue(val) runs
        --> validation, side effects, DOM mutation, all in one place
```
Or equivalently: each component subscribes directly and calls its own
handle method in the handler.

**Path B: Direct DOM via bw.el() (escape hatch)**
```
bw.pub('data:update', newData)
--> single mega-function subscriber:
    bw.el(uuid1).textContent = newData.count
    bw.el(uuid2).textContent = newData.label
    bw.el(uuid3).style.width = newData.pct + '%'
```
bw.el() and bw.$() have O(1) cached lookups by UUID or id. This is
functionally identical to Solid's signal->DOM binding but explicit.

**Path C: Page-as-component (the big TACO)**
```
var dashboard = {
  t: 'div', a: { class: 'dashboard' },
  c: [ header, statsRow, chartPanel, activityFeed ],
  o: {
    state: { ... },
    handle: {
      updateStats: function(el, data) { el.bw.setRevenue(data.rev); ... },
      refreshChart: function(el, data) { ... },
      ...
    },
    slots: {
      revenue: '.stat-revenue',
      users:   '.stat-users',
      chart:   '.chart-area'
    }
  }
};
var el = bw.mount('#app', dashboard);
// Now: bw.sub('data:update', (d) => { el.bw.updateStats(d); }, el);
```
The entire page is one TACO with as many slots and handle methods as
needed. Pub/sub calls handle methods on the page component, which do
surgical DOM updates via slots or cached refs. This is as fast as any
framework -- the component owns its DOM, updates are O(1) per slot,
and the full pipeline (pub/sub -> handle -> DOM) is intact.

**Why Path A is the default recommendation:**

1. **Inspectability.** Path B reaches into components' DOM directly.
   The components don't know they were updated -- their handle methods
   didn't run, so `bw.inspect()` shows stale _bw_state, side effects
   don't fire, and any future `bw.update()` call overwrites the direct
   mutation. Path A goes through the component, so state stays consistent.

2. **The performance difference is negligible.** Path B saves one function
   call (the handle method) per update. That's nanoseconds. The browser
   reflow after ALL the DOM mutations costs milliseconds. The method
   dispatch overhead is unmeasurable.

3. **Correctness compounds.** Path A means every update goes through the
   component's gate. If you later add validation to a handle method, all
   callers (pub/sub, bwserve, direct method call) get it for free. Path B
   callers would need to be found and updated individually.

**When Path B is appropriate:** A custom component that owns a large
number of simple DOM nodes where there's no meaningful "component" per
node -- e.g., a sparkline with 200 rect elements, a heatmap grid, a
custom canvas-like visualization. In these cases, the parent component's
handle method IS the mega-function, and bw.el() lookups within its own
subtree are a natural optimization.

**When Path C is appropriate:** Always, really. This is the intended
bitwrench pattern at full scale. Build your page as one TACO, tag
slots for every updatable region, add handle methods for every action.
Pub/sub wires data flow. The component model gives you inspectability,
encapsulation, and O(1) updates via slots -- same performance profile as
Solid's signal->DOM bindings, but the component boundary is preserved.
Path A and Path B are for cases where the page isn't a single component
(multiple independent widgets, third-party elements mixed in, etc.).

**Reflow reality:** Multiple individual DOM writes in one synchronous JS
task do NOT cause multiple reflows. The browser batches all mutations and
does one layout pass when JS yields. So Path A (100 subscribers each
writing one node) and Path B (1 mega-function writing 100 nodes) cause
the exact same number of reflows: one.

The exception is **layout thrashing**: if code reads a layout property
(`offsetHeight`, `getBoundingClientRect`) between DOM writes, the browser
is forced to reflow immediately to answer the read. Then the next write
triggers another reflow. This is a coding mistake (don't interleave reads
and writes), not a framework issue. All frameworks -- bitwrench, Solid,
React, vanilla -- have this problem if the developer reads layout between
writes. bitwrench should document the pattern: "batch all writes, then
read if needed."

**React's "replace a chunk" approach** does not avoid reflow differently.
React batches at the decision level (VDOM diff computes minimal mutations),
but the actual DOM mutations are still individual setAttribute/textContent/
appendChild calls. The browser batches the reflow the same way. Where
React wins is computing WHAT to change for large structural differences.
Where bitwrench wins is not needing to compute at all -- the developer
already knows what changed and calls the right method.

**CSS transitions note:** Individual updates (Path A/B) on elements with
CSS transitions trigger per-element transitions, which is usually desired
(counter animates to new value). A full DOM replacement (Path C) destroys
old elements (transitions don't complete) and creates new ones (transitions
restart from initial state). This is a UX choice, not a performance choice.
Handle methods preserve the element, so transitions work naturally. Full
re-render via bw.update() destroys and rebuilds, so transitions restart.
Both are useful; the developer picks based on UX needs.

**The building blocks are there.** bitwrench provides the primitives for
all three paths: pub/sub for dispatch, el/$ for fast lookup, message for
named dispatch, update for full re-render, inspect for debugging. A
developer who disagrees with our recommendation can build their preferred
update pattern from these primitives. If they find something that works
better, we want to hear about it.

#### Cloning / Reuse

| Framework | Clone mechanism | Identity handling | Lifecycle on clones |
|---|---|---|---|
| **Vanilla JS** | `el.cloneNode(true)` | No identity system | Listeners NOT cloned (only inline `onclick=` survives) |
| **Bootstrap 5** | Not supported. Clone DOM -> must `new Modal(clone)` manually. | Instance registry keyed by element ref. Clone = new identity. | Must re-instantiate |
| **React** | Clone element: `React.cloneElement(el, newProps)`. Clones descriptor, not DOM. | key prop for reconciliation | React manages (re-renders clone like any element) |
| **Vue 3** | Clone VNode or re-render component. Not DOM-level. | Internal UID per component instance | Vue manages |
| **SolidJS** | Not applicable (component fn runs once, produces DOM directly). Re-call component fn for new instance. | Ownership tree node per call | New ownership scope per call |
| **Angular** | `ViewContainerRef.createComponent()` creates new instance. No DOM cloning. | New component ref per creation | New lifecycle per instance |
| **MFC/Qt** | Not supported. Create new object with same parameters. | New handle/pointer per object | New lifecycle per object |
| **bitwrench** | **Clone the TACO, not the DOM node.** TACO is plain data -- JSON.parse/stringify for deep clone. `bw.assignUUID(clone)` for fresh identity. Functions shared by reference (intentional). | UUID is per-mounted-instance. Collision = throw Error. | Must create+hydrate+mount the cloned TACO |

**Assessment for bitwrench**: The TACO-as-data design makes cloning natural.
Every framework that uses classes/constructors (Bootstrap, Angular, MFC/Qt)
requires re-instantiation. Every framework with VDOM (React, Vue) clones
at the virtual level. bitwrench clones at the data level -- simpler.

The rule is: **clone TACOs, not DOM nodes.** Document this prominently.
DOM cloneNode after hydrate/mount produces a broken half-alive element
(classes present, JS properties missing, UUID collision on mount).

---

## Gaps and Open Questions (Consolidated)

These are all the issues identified from the lifecycle design review and
the framework comparison. Each needs a resolution before implementation.

### GAP-1: _bw_refs breaks when UUID assignment moves to mount

**Problem**: Today, createDOM auto-assigns UUIDs to lifecycle elements,
and those UUIDs become keys in `_bw_refs`. After the refactor, createDOM
(phase 2) builds _bw_refs but auto-assigned UUIDs don't exist until mount
(phase 4). A child with `o.state` but no `id` and no pre-assigned UUID
has no key in _bw_refs. The render function can't find it.

**Options**:
- (a) BCCL factories call `bw.assignUUID()` before returning TACO. Users
  who write hand-crafted TACOs with lifecycle children must also pre-assign.
  Clean separation but friction for hand-authored code.
- (b) hydrate updates the parent's _bw_refs after wiring lifecycle. Requires
  parent reference during hydrate. Messier API.
- (c) createDOM peeks at `o` just for UUID assignment (not lifecycle wiring).
  Treats UUID as structural identity, not lifecycle. This is what it does
  today minus the lifecycle wiring. Pragmatic but muddies the phase split.

**Recommendation**: (a) for BCCL factories, (c) as fallback for hand-written
TACOs. A user who writes `{t:'div', o:{state:{count:0}}}` shouldn't be
forced to call assignUUID. createDOM can auto-assign UUID to elements whose
`o` has lifecycle keys -- treating it as "structural identity."

### GAP-2: Parallel tree walk in hydrate is underspecified

**Problem**: hydrate walks `taco.c` paired with `node.childNodes`, but
these trees aren't isomorphic:
- `null` in taco.c -> empty text node (one node, no taco with `o` to pair)
- `bw.raw('<b>hi</b><i>there</i>')` -> 2+ child nodes from one taco entry
- `"hello"` -> text node (no lifecycle needed)
- Nested TACO `{t:'div', ...}` -> single element (clean 1:1 case)

**Options**:
- (a) Specify a cursor-based walk with rules for each taco entry type.
  Precise but fiddly; off-by-one errors cause subtle bugs.
- (b) hydrate only processes the root; children get hydrated inline during
  createDOM, where each child's taco and node are paired at creation time.
  createDOM internally calls hydrate per-child. External API: createDOM
  returns a hydrated-but-not-mounted node.
- (c) hydrate only processes TACO entries with `.t` property and their
  corresponding element children. Skip text nodes, skip raw fragments.
  Walk uses index tracking with type-based advancement.

**Recommendation**: (b) is the pragmatic path. Strict phase separation at
the API level, but internally createDOM chains create+hydrate because it
has both the taco and node in hand. `bw.hydrate()` is public for the case
where you have an existing DOM node (e.g., server-rendered HTML) and want
to wire lifecycle onto it.

### GAP-3: bw.patch() doesn't clean up old children (BUG -- exists today)

**Problem**: `bw.patch()` does `el.innerHTML = ''` then
`appendChild(bw.createDOM(content))` when patching TACO/array content.
No `bw.cleanup()` on old children. If old children had lifecycle hooks,
unmount doesn't fire, _nodeMap entries leak, pub/sub subs leak.

**Fix**: Add `bw.cleanup(el)` before `el.innerHTML = ''` in the TACO/array
branches of patch(). This is a bug fix independent of the lifecycle refactor.

### GAP-4: Slot setters need the full pipeline

**Problem**: Slot setters (auto-generated by `o.slots`) do
`target.innerHTML = ''; target.appendChild(bw.createDOM(value))`.
Same problems as GAP-3: no cleanup of old content, and after refactor,
new TACO content is created but not hydrated or mounted.

**Fix**: Slot setters should cleanup old content, then create+hydrate+(mount
registration) for new TACO content. In practice, slots usually hold text
or simple markup (no lifecycle), so this is defensive but correct.

### GAP-5: Cloning guidance missing from design

**Problem**: Design mentions cloning briefly but doesn't give clear rules.
DOM cloneNode after hydrate/mount produces broken elements (bw_lc and
bw_is_component classes present, but _bw_state/el.bw missing; UUID collision
on mount).

**Rule to document**: "Clone TACOs, not DOM nodes." TACO is plain data.
`JSON.parse(JSON.stringify(taco))` for deep clone (strips functions).
`bw.assignUUID(clone)` for fresh identity. Functions in TACO (handle methods,
mounted, render) are shared by reference across clones -- intentional and
correct. If you need multiple instances, clone the TACO, give each a fresh
UUID, then run each through the full pipeline.

### GAP-6: bwserve "re-hydrate" pattern (future, not v2.0.26)

**Problem**: Server sends structure (no functions). Client renders via
`bw.DOM()` -- element exists but has no lifecycle. If client wants to
attach lifecycle to server-sent content, there's no clean path.

**Not a v2.0.26 blocker**. For now: server sends structure, client sends
actions. If client needs lifecycle, it creates the component client-side
and the server feeds data via pub/sub or patch. Document this pattern.

### GAP-7: State access is uncontrolled

**Problem**: `el._bw_state.count` works directly, bypassing any gate.
Every other framework with component state either enforces immutability
(React), uses proxies (Vue/Solid), or hides state behind methods
(Bootstrap, MFC/Qt).

**Options**:
- (a) Auto-create `el.bw.getState()` and `el.bw.setState(patch)` during
  hydrate. setState could auto-trigger re-render + statechange emit.
  Bootstrap-like model.
- (b) Accept raw access. "You're an adult." Document that _bw_state is
  internal and handle methods are the intended gate, but don't enforce.
- (c) Proxy-wrap _bw_state for change tracking. Vue-like. Heavy.

**Recommendation**: (a). It's lightweight (two auto-generated handle methods),
gives controlled access, and enables setState -> auto-update in the future.
(c) is too heavy for bitwrench's philosophy.

### GAP-8: Scale not verified (low risk, but should confirm)

**Problem**: No benchmarks exist. Real apps rarely have 1000+ live
components (a complex dashboard has 50-100), so this is unlikely to
surface in practice. But "should be fine" is not the same as "verified."

**Testing needed** (1-hour task, not a design issue):
- 1000 _nodeMap entries: plain object lookup performance
- bw.cleanup() on tree with 1000 .bw_lc descendants
- bw.pub() with 100 subscribers on one topic (realistic ceiling)
- Memory profile: 500 components x (state + el.bw + refs + subs)
- A benchmark page with 500-1000 counters (create, update, destroy cycle)

Expectation: all of this is fast. The bottleneck will be browser
layout/paint, not bitwrench JS. But verify before claiming it.

### GAP-9: Error handling across phases

**Problem**: What happens when a phase fails partway?
- hydrate fails on child 50 of 100 (e.g., slot selector doesn't match):
  first 49 are hydrated, rest are not. Inconsistent state.
- mount fails after some children registered (UUID collision on child 50):
  first 49 are in _nodeMap, rest are not. Partial registration.
- unmount callback throws: currently caught (try/catch). Good.

**Recommendation**: Each phase should be atomic where possible. For mount,
if UUID collision occurs, roll back all registrations from this mount walk
(deregister the first 49) and throw. For hydrate, failure on a child
should not prevent sibling hydration (log warning, continue).

### GAP-10: Event listener tracking

**Problem**: addEventListener calls in createDOM are not tracked. When
elements are removed without cleanup, listeners leak.

**Assessment**: Low priority. innerHTML = '' (used by DOM, mount, patch)
causes the browser to GC listeners on removed elements as long as there
are no external references. The leak only happens when elements are removed
outside bitwrench APIs (raw el.remove() without cleanup). Adding
_bw_listeners means wrapping every addEventListener -- overhead for a
problem bitwrench's own APIs already prevent.

**Recommendation**: Not for v2.0.26. Revisit if measured as a real issue.

---

## Original Design Questions (Q1-Q4)

### Q1: Handle API shape -- el.bw vs Handle object

**Recommendation**: Keep el.bw. Simpler, already shipped, matches "DOM IS
the registry." Fix the real problem (uncontrolled state access) by adding
auto-generated getState/setState methods (see GAP-7). No second registry.

### Q2: o.handle vs o.methods keyword

**Recommendation**: Keep `o.handle`. Already shipped and documented.
"methods" is overloaded in JS. "handle" is bitwrench-specific vocabulary.

### Q3: BCCL class rename timeline

**Recommendation**: Separate release. The lifecycle refactor is already
high-risk. Mixing a 100-class mechanical rename would make bisecting bugs
impossible. Ship lifecycle first, stabilize, then rename.

### Q4: Event listener tracking (_bw_listeners)

**Recommendation**: Not for v2.0.26 (see GAP-10).

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
| `bw.createDOM()` | 959-1180 | create + hydrate + partial mount | Pure create only (phase 2). Internally chains create+hydrate (see GAP-2 option b). |
| `bw.DOM()` | 1213-1267 | cleanup + create + hydrate + mount, returns container | Wrapper: cleanup + create + hydrate + mount, calls single-step functions |
| `bw.mount()` | 1288-1299 | cleanup + create + append, returns root | Wrapper: cleanup + create + hydrate + mount, returns root element |
| `bw.el()` | 347-384 | 4 resolution modes + optional apply | Keep polymorphic (resolution is its job). Apply is a convenience. |
| `bw.$()` | 2717-2738 | multi-match + optional apply | Same as el(), multi-match version |
| `bw.patch()` | 1438-1463 | branches on content type (attr/text/TACO/array) | Fix GAP-3 (cleanup before replace). Needs create+hydrate when patching TACO content into mounted tree |
| `bw.sub()` | 1634-1660 | stamps UUID on element if missing | Should only work on hydrated elements. Stamps bw_lc + bw_uuid (mini-hydrate). |

NOT overloaded (already clean):
- `bw.cleanup()` -- single responsibility, no changes needed
- `bw.update()` -- calls _bw_render + emits statechange
- `bw.pub()` / `bw.unsub()` -- clean pub/sub
- `bw.html()` / `bw.htmlPage()` -- string path (review later)
- `bw.assignUUID()` / `bw.getUUID()` -- clean identity ops
- `bw.message()` -- clean dispatch

---

## What This Document Does NOT Cover (deferred)

- bw.html() / bw.htmlPage() string path details (review after DOM lifecycle)
- bw.tree() / bw.inspect() debug tooling improvements
- Composition patterns (documented in dev/bw-lifecycle-design.md)
- bwserve protocol changes
- Full BCCL class rename implementation plan
- Test plan for new lifecycle functions
- Opt-in reactivity / signals (v2.1+ consideration at earliest)
