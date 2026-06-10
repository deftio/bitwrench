# Bitwrench North Star

Read this before every implementation task. If your code violates these
principles, stop and rethink.

---

## The core idea

A JS object can describe a UI component: its tag, attributes, content,
state, behavior, and lifecycle. That object is called a TACO:

```javascript
{
  t: 'div',                          // HTML tag
  a: { class: 'card', onclick: fn }, // attributes (including event handlers)
  c: [ /* child TACOs or strings */ ],  // content
  o: {                                // options: state, lifecycle, methods
    state: { count: 0 },
    handle: { increment: function(el) { /* ... */ } }
  }
}
```

This is the entire premise. Everything else follows from it.

---

## The chain of consequences

Each decision below follows from the one above it. If a reviewer
disagrees with a consequence, trace back to the root -- the argument
is only as strong as the chain.

### 1. TACO is a JS object, not a template

A TACO is a plain JavaScript object literal. No special syntax (JSX),
no string interpolation (template literals), no domain-specific language
(.vue, .svelte). Just `{t, a, c, o}`.

**Why this matters:** JS objects are built into the language. Every JS
runtime, every browser, every server, every LLM can produce them without
any tooling. TypeScript can type-check them (bitwrench ships .d.ts).
JSON Schema can validate them structurally. They serialize to JSON
(minus functions in `o`). They can be generated, inspected, validated,
and transmitted by any tool that understands JavaScript or JSON.

We don't use TypeScript or JSX as a prerequisite because they require
external compilers. TypeScript is supported and valuable (bitwrench
ships .d.ts files for full type checking), but it is never required.
The architecture works without a build step. Period.

### 2. UI can be created at compile time or runtime

Because TACO is a JS object, it can be constructed at any point:
- At write time: a developer hand-writes `{t: 'div', ...}`
- At build time: a tool generates optimized TACO factories
- At runtime: a function constructs TACOs from data, user input, or API responses
- At serve time: a server in any language (Python, Go, Rust) generates
  TACO-shaped JSON and pushes it to the client

No compilation step sits between "component defined" and "component
rendered." A TACO written in a `<script>` tag works identically to one
produced by a bundler.

### 3. CSS can be generated at compile time or runtime

The same logic applies to CSS. Because bitwrench generates CSS from JS
objects (palette values, spacing tokens, component configuration), CSS
is just another output of JS functions. This means:

- No CSS preprocessors (Less, Sass) -- JS functions are the preprocessor
- No CSS custom properties required -- values come from palette objects
  in JS (though CSS vars are fine to use; see github.com/deftio/quikchat
  for that style of thinking -- we just don't depend on them)
- No utility-class framework (Tailwind) -- bitwrench generates equivalent
  CSS from design tokens at runtime. You get Tailwind's result without
  Tailwind's build step or class proliferation
- Dark mode is palette inversion, not a parallel set of CSS overrides
- Theme switching = swap the palette object, regenerate. One function call.

### 4. TACO definitions carry everything a component needs

A TACO is not just layout. It includes:
- **Structure**: tag, attributes, children (`t`, `a`, `c`)
- **Styling**: class names, inline styles, or references to design tokens
- **Behavior**: event handlers directly in attributes (`onclick`, `onchange`, etc.)
- **State**: initial state object (`o.state`)
- **Lifecycle**: mount/unmount hooks (`o.mounted`, `o.unmount`)
- **Public API**: handle methods and slots (`o.handle`, `o.slots`)
- **Identity**: component type tag for discovery (`o.type`)

This is the MFC/Swing/Delphi model: the component is a self-contained
object with an API. The rendering substrate (DOM, GDI, AWT) is an
implementation detail. You call the component's methods; it manages its
own display.

```
WRONG:  el.querySelector('.title').textContent = 'New';  // reach into the DOM
RIGHT:  el.bw.setTitle('New');                            // call the component
```

### 5. TACO is consumed, not retained

After bitwrench creates a DOM element from a TACO, the TACO is gone.
All information from `o` is decomposed onto the DOM element (state,
methods, hooks, slots). bitwrench does not keep a shadow tree, a virtual
DOM, or a reference to the original specification.

This is fundamentally different from React (which retains element
descriptors for diffing) and Vue (which wraps state in reactive proxies).
There is no virtual intermediary. The DOM IS the component. querySelector
IS the component registry. Browser DevTools IS the inspector.

If you need another instance of the same component, call the factory
function again. Clone TACOs (data), not DOM nodes (live objects).

### 6. The pure path from TACO to mounted component has distinct phases

define -> create -> hydrate -> mount -> update -> unmount

In practice, create+hydrate are fused for efficiency (one recursive pass
holds both TACO and node), and convenience verbs (mount, append, replace,
remove, refresh) chain phases — but contain no logic except calls to the
phase verbs. Each phase has exactly one verb; compounds compose, never
reimplement. Spec of record: `dev/bitwrench-lifecycle-cleanup-2026-06-09.md`
(lifecycle) and `dev/bitwrench-css-cleanup-2026-06-09.md` (styling, which
follows the same grammar: makeStyles=create, applyStyles=mount,
loadStyles=compound).

### 7. Updates are explicit, not reactive

Once a component is mounted, there are several clean ways to update it,
all using pure JS:

- **Component methods**: call `el.bw.methodName(args)` -- the component
  updates itself. This is the MFC/Swing model: you tell the component
  what to do, it handles its own DOM. This is the primary and cheapest
  update path.
- **Slot setters**: auto-generated from `o.slots` -- `el.bw.setTitle('x')`
  replaces content at a cached DOM target. Surgical, O(1).
- **DOM helpers**: bitwrench provides element finders that resolve by
  reference, CSS selector, or UUID -- with internal caching so repeated
  lookups on known components are cheap.
- **Pub/sub**: decoupled messaging between components. A component
  subscribes to a topic; when data arrives, its handle method fires.
  Subscriptions auto-clean when the component is removed.

bitwrench does NOT do automatic reactivity. There is no dependency
tracking, no signal subscription graph, no dirty-checking change
detection. You call a method, it runs, it updates the DOM. Explicitly.

**Why not reactive?** Reactive systems solve a real problem: keeping
UI in sync with state when the developer doesn't know (or doesn't want
to think about) what changed. The cost is a subscription/proxy/diffing
layer that must exist between state and DOM.

bitwrench's position: for the component scales we target (dozens to low
hundreds of live components per page), explicit method calls are clearer,
debuggable, and have zero framework overhead. The component knows exactly
what changed because the developer told it. No diffing needed.

For complex interdependent forms (show B when A is "yes", validate C
based on B+D), explicit wiring is more code than reactive bindings.
This is a real cost. The payoff: all the wiring logic is in one place
(the handle method), visible, debuggable, and produces zero surprise
re-renders.

### 8. Server-driven UI is a first-class capability

bwserve lets a server push TACOs to the browser via SSE. The server can
create, update, replace, and remove UI elements in real time. The client
renders whatever arrives.

Because TACOs are data, any backend language can generate them. A Python
script, a Go service, or an LLM can produce the JSON; the browser renders
it. This is closest to Phoenix LiveView, not any JS framework.

bwcli extends this to debugging and development. It connects to any
running web page -- bitwrench-authored or not -- by injecting the
bitwrench helper library. From there, it can:
- Inspect the component tree
- Call component methods
- Push new UI
- Listen to events
- Take screenshots at the page, component, or element level

This enables streamlit-style use cases (server-generated data
visualization), LLM-driven UI (an agent inspects, mutates, screenshots,
iterates), and remote debugging of production pages.

### 9. Tooling follows from the architecture

bitwrench does not need custom browser extensions for inspection (the
DOM IS the component tree -- querySelector finds everything). It does
not need a custom profiler (browser DevTools profiles the real DOM,
not a virtual shadow). It does not need a build step for HMR (there
is no compiled output to hot-swap -- just re-evaluate the JS).

What bitwrench DOES have that other frameworks cannot easily replicate:
- **Remote inspect + mutate**: connect to a running page over the wire,
  find components, call their methods, change the UI -- no browser
  extension, no local development environment
- **Remote screenshot**: capture what the page looks like from server
  code, CI, or an LLM -- verify UI state without eyes
- **LLM-native composition**: an LLM generates JSON, validates against
  a schema, sends it via bwserve, the client renders it. No compiler
  in the loop. No framework-specific AST to generate.
- **Schema validation across boundaries**: CI validates TACOs without
  running the app. A server validates its output. An LLM validates its
  generation. Teams publish schemas alongside their bwserve endpoints.

**On tooling maturity**: Every new stack enters the scene less mature
than incumbents. That is definitional, not architectural. The question
for reviewers is not "which framework has better tooling today?" but
"does this architecture enable or prevent the tooling you want?"

React's human developer tools (DevTools, profiler, time-travel
debugging) are excellent and took years to build. Nothing in
bitwrench's architecture prevents building equivalent tools -- the
DOM IS the component tree, so standard browser DevTools already cover
most of the ground. What bitwrench's architecture does is make
machine-driven tooling (remote inspect, LLM composition, cross-
boundary schema validation) structurally trivial. Virtual-DOM
architectures make those same capabilities structurally hard to
retrofit, because the real component state lives in a framework-
internal shadow tree, not in the DOM.

Tooling maturity is a function of time and adoption. Architecture is
permanent. Evaluate the architecture.

### 10. Names carry cost

The update operations are ordered by expense and the names are honest:
`el.bw.method()` and slot setters are surgical; `patch` is the element
escape hatch; `replace` kills the element; `refresh` kills its children.
A cheap-sounding verb is never secretly expensive, and no operation
silently escalates (bw.update dispatches or warns — it never falls back
to a rebuild). If you can't tell what an operation costs from its name,
that's a bug in the API.

### 11. The registry watches the DOM

"The DOM is the registry" cuts both ways: bitwrench must notice when the
DOM changes underneath it. A document-level MutationObserver (the
janitor) runs full teardown on any component removed outside bitwrench's
verbs — hooks fire, registrations clear, subscriptions release. Liveness
checks at every dispatch mean a dead component never receives a message.
Nothing bitwrench retains can pin a removed subtree. Rude removal by
third-party code is an expected event, not an error.

### 12. Dependencies declared, never tracked

bitwrench has no reactive proxies and no auto-tracked dependency graphs
-- but it does have declared dataflow: `bw.derive(inputTopics, fn,
outTopic)` recomputes a derived value when its inputs publish. The
difference from signals is that the graph is written in source where you
can read it, not assembled by getter traps at runtime. Derive, the word
bitwrench already uses for palettes, not useMemo.

### 13. Code never crosses the wire

Servers, CLIs, and LLMs send data: TACOs (structure), verb messages,
method names, action names (`bw_act_*` classes). Executable code travels
exactly once -- when the page itself is served. There is no eval verb,
no server-registered function bodies, and string `on*` attributes are
stripped from wire TACOs. Interactivity for server-sent UI is the
`bw_act_*` class namespace plus a client-side delegated dispatcher.

### Validation: industry protocol adapters

The claims above are not theoretical. The bitwrench-ag-ui adapter
(agui) implements the AG-UI protocol -- a standard for AI agent-to-UI
communication -- and Google's A2UI specification. AG-UI defines how an
AI agent streams events (text deltas, tool calls, state updates) to a
frontend. A2UI is Google's equivalent spec for agent-to-UI rendering.

agui translates these standard agent events into bitwrench rendering
operations: TACO creation, slot updates, component replacement. The
adapter is a thin translation layer, not a framework. It works because
TACOs are data (consequence 1), servers can generate them (consequence
2), and the client renders whatever arrives (consequence 8).

This is the concrete proof: an industry-standard AI agent protocol,
rendering through TACO, with zero build step. If the architecture were
wrong -- if TACO required a compiler, if the DOM weren't the registry,
if updates required a diffing layer -- agui would not be a thin adapter.
It would be a framework.

---

## What this means in practice

### BCCL: reference component library, not destination

bitwrench ships 30+ reference components (BCCL): cards, tables, tabs,
modals, etc. These provide a batteries-included prototyping experience.

BCCL is a reference implementation, not a destination. Large teams build
their own component libraries on top of bitwrench core (TACO, lifecycle,
pub/sub, DOM helpers, bwserve). BCCL shows how to write components
correctly. A company's component library extends the base TACO schema,
not BCCL's schemas.

### Design system from seed colors

bitwrench can regenerate an entire design system (colors, spacing,
typography, elevation, motion) from a handful of seed values. All BCCL
components consume shared design tokens. A theme that changes colors but
leaves spacing, shadows, and motion untouched is only half a design
system.

No ad-hoc values. Every component draws from the shared token scales:

- **Spacing**: 4, 8, 12, 16, 24, 32, 48 (derived from base unit)
- **Type ramp**: 12, 14, 16, 18, 20, 24, 30
- **Color roles**: primary, secondary, surface, muted, error, warning, success, info
- **Elevation**: sm, md, lg, xl
- **Motion**: 150ms ease-out (hover), 250ms ease (expand)
- **Radius**: none, sm, md, lg, pill

### Avoid direct DOM manipulation

bitwrench provides APIs for every DOM operation a component or example
should need. If you find yourself writing `document.createElement()`,
`document.querySelector()`, `innerHTML`, or raw HTML strings -- that is
drift. The whole point of TACO is that you work with component objects,
not the DOM directly.

**If bitwrench can't do what you need, that's a gap in the API -- fix
the API, don't work around it.** Ask the maintainer before reaching for
`document.*`.

### Compilation is optimization, not a prerequisite

TACO works without a build step. Reactivity comes from the component
model, not from a compiler. A component's handle method triggers an
update because the component was built that way, not because a compiler
wired signal subscriptions. The component model works the same in a
`<script>` tag and in a bundled production build.

A future compile step would add performance optimizations (template
extraction, dead CSS elimination, pre-rendering). These are performance
features, not correctness features. A TACO component must work identically
interpreted and compiled.

---

## For reviewers: what to challenge

The north star exists so reviewers can test bitwrench's thinking. Here
are the questions worth pushing on -- and the ones that are already
answered.

### Worth challenging (bitwrench should have good answers)

| Challenge | Expected answer |
|-----------|----------------|
| "Explicit updates are more code than reactive bindings for complex forms" | Yes. Handle methods colocate the logic (easier to debug). For truly complex cases, build a form component that handles wiring internally. More code, less magic. |
| "No ecosystem -- where are the 10,000 components?" | Wrap any existing library in a TACO factory. Self-contained JS objects make wrapping trivial. But wrapping still requires effort. |
| "TACO syntax is ugly compared to JSX" | TACO optimizes for a different developer profile: backend devs, embedded devs, LLM-native devs who think in data structures. JSX optimizes for designers who think in markup. Different tools, different audiences. |
| "No time-travel debugging, no profiler, no HMR" | Tooling maturity is a function of time, not architecture. Nothing in bitwrench prevents these tools -- the DOM IS the component tree. Meanwhile, machine-driven tooling (remote inspect, LLM composition, schema validation) is structurally trivial here and structurally hard to retrofit onto virtual-DOM frameworks. |
| "How does this scale to 500+ components on a page?" | Handle methods and slot setters are O(1). Pub/sub dispatch is O(subscribers). Need a benchmark page to verify. Expect it's fine -- the bottleneck is browser layout/paint, not JS dispatch. |

### Questions with established answers

These have been thought through. Reviewers are welcome to push back,
but the answers below reflect deliberate design choices, not oversights.

| Challenge | Why it's settled |
|-----------|-----------------|
| "But React has virtual DOM diffing" | bitwrench doesn't need it. Components update their own DOM directly. No guessing what changed. O(1) per update vs O(tree) diff. |
| "You need a compiler for reactivity" | No. Reactivity comes from the component model. `el.bw.method()` works because the component was built that way, not because a compiler wired it. |
| "You need CSS-in-JS libraries" | bitwrench IS CSS-in-JS. Palette objects -> JS functions -> CSS strings. No library needed. |
| "TypeScript is required for large projects" | bitwrench ships .d.ts. TS is supported, not required. The architecture works without a build step AND with full TS checking. |
| "How do you handle server rendering?" | bwserve pushes TACOs via SSE. Any backend language generates JSON. The client renders it. This is a first-class capability, not an afterthought. |

---

## Quick drift checks

Before writing code:

| Question | If yes | If no |
|----------|--------|-------|
| Am I using `document.*` directly? | Drift. Use bitwrench APIs or TACO. | Good. |
| Am I hardcoding px/rem/hex values? | Drift. Use design tokens. | Good. |
| Would this code break in Node (no DOM)? | Drift. TACO should be universal. | Good. |
| Am I writing `<style>` or raw HTML? | Drift. Generate CSS and TACO from JS. | Good. |
| Am I treating TACO as "nicer innerHTML"? | Drift. It's a component spec. | Good. |
| Am I reaching for a heavy rebuild when a handle method would do? | Drift. Prefer surgical updates. | Good. |
| Am I sending code (or function source) over a wire? | Drift. Send data; use bw_act_* + verbs. | Good. |
| Am I hand-rolling teardown a verb already does? | Drift. unmount/remove/janitor cover it. | Good. |
| Am I using `data-*` attributes or hand-minting `bw_uuid_*`? | Drift. Classes are bw-owned; use id or your own classes. | Good. |
| Does this component look/feel different from others? | Drift. Check design tokens. | Good. |
| Would an MFC/Swing developer recognize this pattern? | Good. | Rethink. |
