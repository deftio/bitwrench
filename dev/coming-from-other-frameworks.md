# Coming From Other Frameworks — Dev Strategy Doc

> **Internal document.** This is not published documentation. It maps out what developers from each major framework would think when they first encounter bitwrench, what concerns they'd raise, and how our existing docs address (or fail to address) those concerns. This guides documentation quality without becoming framework-bashing or religious wars.

**Tone throughout:** "bitwrench took a different approach — here's how it works" — never "bitwrench is better."

**Goal:** Ensure a developer from any background can't dismiss bitwrench in the first 30 seconds because we failed to address an obvious concern.

---

## Table of Contents

1. [React](#react)
2. [Vue](#vue)
3. [Svelte](#svelte)
4. [Solid.js](#solidjs)
5. [Angular](#angular)
6. [Bootstrap](#bootstrap)
7. [Tailwind CSS](#tailwind-css)
8. [Qwik](#qwik)
9. [Cross-Cutting Concerns Table](#cross-cutting-concerns-table)
10. [How Bitwrench Handles Common Concerns](#how-bitwrench-handles-common-concerns)
11. [Doc Improvement Checklist](#doc-improvement-checklist)

---

## React

### Who they are
The largest single pool of frontend developers. Comfortable with JSX, hooks, component trees, and the React mental model of "UI = f(state)". Many have never built a web app without a build step. They think in terms of `useState`, `useEffect`, re-render cycles, and the React devtools component tree.

### First reaction to bitwrench
"Where's the virtual DOM? How does it know what changed? This looks like jQuery with extra steps."

### Key concerns

1. **No virtual DOM / no diffing** — "How do you avoid unnecessary DOM mutations?"
2. **No hooks / no automatic re-renders** — "I have to manually call update?"
3. **No JSX** — "Writing objects instead of markup feels backwards."
4. **No devtools** — "How do I inspect component state?"
5. **No ecosystem** — "Where's the router, the form library, the data-fetching layer?"
6. **No component model** — "How do I compose and reuse UI?"

### How bitwrench answers each

| Concern | Answer | Where documented |
|---------|--------|-----------------|
| No virtual DOM | bitwrench doesn't need one. `bw.patch(uuid, content)` does targeted DOM updates by UUID — no tree walk, no diffing. For structural changes, `bw.update(el)` replaces the subtree via `el._bw_render(el)`. The DOM *is* the source of truth. | `pages/05-state.html` §5-6 |
| No automatic re-renders | `bw.component()` with template bindings (`${count}`) re-renders on `.set()`. For lower-level control, `bw.update(el)` re-renders explicitly. Either way, update flow is visible and debuggable — no stale closure bugs, no dependency arrays. | `pages/05-state.html` §2-4 |
| No JSX | TACO objects are plain JS — no transpiler, no build step, no source maps to debug through. `{t: 'div', a: {class: 'card'}, c: 'Hello'}` is the same mental model as `<div className="card">Hello</div>`, just native syntax. You get `.map()`, ternaries, and variables for free. | `pages/00-quick-start.html`, `pages/06-tic-tac-toe-tutorial.html` |
| No devtools | Select any bitwrench element in browser inspector, then `$0._bw_state` in the console shows its state. `$0._bw_render` shows its render function. No extension needed — the browser *is* the devtool. | `pages/00-quick-start.html` (callout), `pages/05-state.html` (callout) |
| No ecosystem | By design. bitwrench targets environments where pulling in 50 npm packages is impossible or undesirable. For routing, use the History API directly. For data fetching, use `fetch()`. For forms, use DOM events. The lack of an ecosystem *is* the feature for constrained environments. | `pages/07-framework-comparison.html` (use-cases section) |
| No component model | `bw.component(taco)` returns a reactive handle with `.get()/.set()/.mount()/.destroy()`. Factory functions returning TACO compose via nesting in the `c` field. `bw.makeCard()`, `bw.makeButton()`, etc. demonstrate this. | `pages/01-components.html`, `pages/05-state.html` §2 (ComponentHandle) |

### Gaps
- No migration guide showing "here's your React component, here's the bitwrench equivalent line-by-line"
- No TypeScript type definitions for TACO objects (React devs expect `.d.ts` files)
- No equivalent to React's `key` prop for list reconciliation (bitwrench uses UUID instead, but this isn't explicitly compared)
- Testing story not documented — React devs expect a Testing Library equivalent

### Bridge concepts
| React | bitwrench | Notes |
|-------|-----------|-------|
| `useState` | `bw.component()` with `o.state` | `handle.get('key')` / `handle.set('key', val)` — auto re-renders |
| `useEffect` | `o.mounted` / `o.unmount` | No dependency array — you control when effects run |
| `setState` → re-render | `handle.set(key, val)` | `.set()` triggers re-render via template bindings (`${key}`) |
| `useContext` | `bw.pub()` / `bw.sub()` | App-scoped pub/sub replaces context provider trees |
| `key` prop | `bw.uuid()` | Stable identity for list items |
| JSX `<Comp />` | `makeComp()` returning TACO | Factory function call instead of JSX element |
| Virtual DOM diff | `bw.patch(uuid, val)` | Skip the diff — update exactly what you know changed |
| Component instance | `bw.component(taco)` → handle | Handle has `.get()/.set()/.mount()/.destroy()` |

---

## Vue

### Who they are
Developers who value progressive adoption, clear separation of template/script/style, and the Options API or Composition API. Many came from jQuery and appreciate Vue's gentle learning curve. They expect reactivity to "just work" when you mutate state.

### First reaction to bitwrench
"There's no reactivity system? I have to manually track what changed and update the DOM myself?"

### Key concerns

1. **No reactivity system** — "No `ref()`, no `reactive()`, no automatic dependency tracking."
2. **No Single-File Components (SFCs)** — "Where's the `.vue` file with template/script/style?"
3. **No template syntax** — "No `v-if`, `v-for`, `v-model`."
4. **No Pinia/Vuex equivalent** — "How do I share state across components?"
5. **No transitions/animations system** — "Vue's `<Transition>` is really nice."

### How bitwrench answers each

| Concern | Answer | Where documented |
|---------|--------|-----------------|
| No reactivity | `bw.component()` provides `.get()/.set()` with template bindings that auto-render. No proxy magic means no reactivity gotchas (deep vs shallow, array mutation caveats). You always know *when* and *why* the DOM changed. | `pages/05-state.html` §2-6 |
| No SFCs | A bitwrench "component" is a factory function that returns TACO. Structure (tag), style (attributes/bw.css), and logic (closure) live in one function. No file-format lock-in — it's just JS. | `pages/05-state.html` §4, `pages/01-components.html` |
| No template directives | `v-if` → ternary operator. `v-for` → `.map()`. `v-model` → event handler + state update. These are native JS — no new syntax to learn or forget. | `pages/00-quick-start.html` (data-driven UI section) |
| No state store | `bw.pub(topic, detail)` / `bw.sub(topic, handler)` provides app-scoped communication. For shared state, a plain JS object + pub/sub achieves the same pattern as Pinia without the library. | `pages/05-state.html` §7 |
| No transition system | CSS transitions and `@keyframes` via `bw.css()`. bitwrench generates the CSS; the browser handles the animation. No JS animation runtime. | `pages/03-styling.html` (generated classes section) |

### Gaps
- No `v-model` equivalent (two-way binding is manual)
- No transition examples in the docs (CSS animations via `bw.css()` are possible but not demonstrated)
- No comparison with Vue's Composition API `setup()` pattern vs bitwrench factory functions

### Bridge concepts
| Vue | bitwrench | Notes |
|-----|-----------|-------|
| `ref()` / `reactive()` | `bw.component()` with `o.state` | `handle.set(key, val)` triggers re-render — no `.value` unwrapping |
| `watch()` / `computed()` | Derive in render function or `o.methods` | Computed values are expressions in TACO or method calls on handle |
| `v-if` / `v-for` | Ternary / `.map()` | Native JS, no template compiler |
| `<Transition>` | CSS transitions via `bw.css()` | Browser-native animations |
| Pinia store | `bw.pub()` / `bw.sub()` | Decoupled pub/sub, no store boilerplate |
| `<template>` | TACO object | Data structure instead of markup language |
| Component instance | `bw.component(taco)` → handle | `.get()/.set()/.getState()/.setState()` |

---

## Svelte

### Who they are
Developers who prioritize minimal runtime, compiler-driven optimization, and "write less code." They're used to Svelte's magic — reactive declarations (`$:`), auto-subscriptions, and the runes system (`$state`, `$derived`). They value small bundle sizes and fast performance.

### First reaction to bitwrench
"You ship a runtime? Svelte compiles away. And your reactivity is manual — `$state` just works."

### Key concerns

1. **Ships a runtime** — "Svelte compiles to vanilla JS with no framework overhead."
2. **No compiler optimizations** — "No dead code elimination, no static analysis."
3. **No `$state` runes / reactive declarations** — "More boilerplate for state updates."
4. **No `.svelte` file format** — "Svelte's single-file format is really clean."
5. **Bundle size comparison** — "Is bitwrench actually smaller?"

### How bitwrench answers each

| Concern | Answer | Where documented |
|---------|--------|-----------------|
| Ships a runtime | Yes, ~26KB gzipped. That's smaller than most Svelte apps after compilation. The runtime *is* the value — it works without a build step, in a `<script>` tag, in an ESP32, in a Node.js server. | `pages/09-builds.html` |
| No compiler | Correct. bitwrench trades compiler optimization for zero-toolchain deployment. No `vite`, no `svelte.config.js`, no preprocessing. The tradeoff is explicit updates vs automatic ones. | `pages/00-quick-start.html` |
| No runes | `bw.update(el)` is one function call. The "boilerplate" is one line: `bw.update(this)`. The benefit is that every state change is traceable — grep for `bw.update` to find every re-render in your app. | `pages/05-state.html` §3-4 |
| No file format | A factory function returning TACO keeps everything together without inventing a file format. No Svelte-specific IDE plugins needed. | `pages/05-state.html` §4 |
| Bundle size | ~26KB gzipped UMD min with all features (HTML generation, CSS generation, color utils, pub/sub, file I/O, etc.). Svelte apps start smaller but grow with each component. bitwrench is fixed-cost. | `pages/09-builds.html` (size tables) |

### Gaps
- No performance benchmark comparing bitwrench DOM updates vs Svelte compiled output
- No example showing how bitwrench's explicit model can be *easier* to debug than Svelte's compiler magic (e.g., when `$:` reactivity fires unexpectedly)

### Bridge concepts
| Svelte | bitwrench | Notes |
|--------|-----------|-------|
| `$state` rune | `bw.component()` with `o.state` | `handle.set(key, val)` re-renders template bindings `${key}` |
| `$derived` | Compute in render function or `o.methods` | No memoization — recomputes on update |
| `{#each}` / `{#if}` | `.map()` / ternary | Native JS control flow |
| `on:click` | `a: { onclick: fn }` | DOM attribute, no special syntax |
| Stores | `bw.pub()` / `bw.sub()` | Simpler API, no auto-subscription |
| `<style>` block | `bw.css()` or external CSS | Runtime CSS generation or static file |

---

## Solid.js

### Who they are
Performance-focused developers who chose Solid specifically for its fine-grained reactivity *without* a virtual DOM. They understand signals, effects, and memos. They're the closest philosophical cousins to bitwrench's "no VDOM" stance but take a very different approach to achieving it.

### First reaction to bitwrench
"We both skip the virtual DOM — but Solid tracks dependencies automatically. Why would I give that up for manual updates?"

### Key concerns

1. **No signals / no automatic fine-grained updates** — "Solid's `createSignal` is more ergonomic."
2. **No dependency tracking** — "How do you know what to update?"
3. **Still needs a build step comparison** — "Solid requires JSX transform; does bitwrench actually save setup time?"
4. **No `createEffect` / `createMemo`** — "How do you handle derived state and side effects?"

### How bitwrench answers each

| Concern | Answer | Where documented |
|---------|--------|-----------------|
| No signals | bitwrench uses UUID-addressed DOM patching (`bw.patch(uuid, val)`) for fine-grained updates. You decide what to update — no subscription graph, no over-firing, no debugging phantom dependencies. | `pages/05-state.html` §6 |
| No dependency tracking | You track dependencies by... knowing your code. In a 200-line dashboard, you know which data feeds which widget. bitwrench doesn't add abstraction on top of that knowledge. | `pages/05-state.html` §5-6 |
| Build step comparison | Solid requires `vite` + `babel-plugin-jsx-dom-expressions` minimum. bitwrench requires a `<script>` tag. For prototypes, internal tools, and embedded UIs, this is a real difference. | `pages/00-quick-start.html` |
| No effects/memos | Side effects go in `o.mounted`. Derived values are computed inline in the render function. No memoization framework — use a closure variable if you need to cache. | `pages/05-state.html` §3-4 |

### Gaps
- No direct Solid.js comparison in the framework comparison page
- No benchmark showing that manual `bw.patch()` can match Solid's signal-driven updates in practice
- Would benefit from a "Solid developer's guide" showing the mental model translation

### Bridge concepts
| Solid | bitwrench | Notes |
|-------|-----------|-------|
| `createSignal()` | `bw.component()` with `o.state` | `handle.get(key)` / `handle.set(key, val)` — template bindings auto-update |
| `createEffect()` | `o.mounted` callback | Runs once at mount, not on every dependency change |
| `createMemo()` | Inline computation in render or `o.methods` | No automatic caching |
| `<For>` / `<Show>` | `.map()` / ternary | Native JS, no special components |
| Fine-grained DOM updates | `bw.patch(uuid, val)` | Same goal (skip VDOM), different mechanism |
| JSX | TACO objects | Both produce DOM — different syntax |

---

## Angular

### Who they are
Enterprise developers working in large teams with strict architecture requirements. They value TypeScript, dependency injection, strong opinions about project structure, and comprehensive tooling (Angular CLI, Angular DevTools, Schematics). Many work on long-lived codebases where consistency matters more than conciseness.

### First reaction to bitwrench
"No TypeScript? No dependency injection? No CLI? This isn't a serious framework."

### Key concerns

1. **No dependency injection** — "How do you manage service dependencies?"
2. **No RxJS / no observables** — "How do you handle async data streams?"
3. **Not TypeScript-first** — "No type safety for templates or components."
4. **No CLI scaffolding** — "How do you structure a project?"
5. **No enforced architecture** — "Large teams need guardrails."
6. **No form handling** — "Angular's reactive forms are powerful."

### How bitwrench answers each

| Concern | Answer | Where documented |
|---------|--------|-----------------|
| No DI | Plain JS imports and closures. In bitwrench's target environments (prototypes, small tools, embedded UIs), DI adds complexity without proportional benefit. | N/A — honest mismatch |
| No RxJS | `bw.pub(topic, detail)` / `bw.sub(topic, handler)` for event streams. For async data, use `fetch()` + `async/await`. RxJS solves problems bitwrench apps rarely have. | `pages/05-state.html` §7 |
| Not TypeScript-first | bitwrench works in TypeScript — TACO objects can be typed with a simple interface. But it's not designed around TypeScript's type system. | Gap — no `.d.ts` provided |
| No CLI | `<script src="bitwrench.umd.min.js">` — no CLI needed. For Node.js, `npm install bitwrench`. The project structure is whatever you want. | `pages/00-quick-start.html`, `pages/09-builds.html` |
| No enforced architecture | Correct. bitwrench is a library, not a framework. It doesn't tell you how to organize code. For large teams needing architecture enforcement, Angular is the right choice. | `pages/07-framework-comparison.html` (honest assessment) |
| No form handling | DOM form events + TACO objects. `bw.makeForm()` and `bw.makeInput()` generate form elements. Validation is your code, not a framework concept. | `pages/02-tables-forms.html` |

### Gaps
- No TypeScript type definitions
- No example of a "large" bitwrench app showing how to organize code
- The framework comparison page doesn't include Angular (only React, Vue, Svelte)
- No documented pattern for service-like shared logic

### Bridge concepts
| Angular | bitwrench | Notes |
|---------|-----------|-------|
| Components + decorators | `bw.component(taco)` → handle | Handle has `.get()/.set()/.mount()/.destroy()` |
| Services + DI | Imported modules / closures | No injection container |
| `@Input()` / `@Output()` | `o.state` props + `o.methods` | Props → state keys, methods callable on handle |
| RxJS Observables | `bw.pub()` / `bw.sub()` | Simpler API, no operators |
| Reactive Forms | DOM events + `handle.set()` | `.set()` auto-renders template bindings |
| Angular CLI | `<script>` tag | Zero tooling |
| NgModules | None needed | No module declaration system |

---

## Bootstrap

### Who they are
Developers (often backend-focused or full-stack) who use Bootstrap for pre-built CSS components. They write HTML directly, add Bootstrap classes, and use jQuery or vanilla JS for interactivity. They're comfortable with HTML as a first-class authoring format and may find the idea of generating HTML from JS unusual.

### First reaction to bitwrench
"Why would I write `{t: 'div', a: {class: 'card'}}` when I can just write `<div class="card">`?"

### Key concerns

1. **Why generate HTML from JS?** — "HTML is already easy to write."
2. **Learning TACO syntax** — "Another abstraction over HTML I already know."
3. **Can I use Bootstrap CSS with bitwrench?** — "I don't want to lose my existing styles."
4. **jQuery compatibility** — "I already have jQuery plugins."

### How bitwrench answers each

| Concern | Answer | Where documented |
|---------|--------|-----------------|
| Why generate from JS? | Because you can `.map()` over data, conditionally include elements with ternaries, compose components as functions, and do it all without a template engine. When your UI is data-driven (dashboards, admin panels, tables from API data), generating HTML from JS is transformative. | `pages/07-framework-comparison.html` §1 (Server-Driven UI) |
| Learning TACO | TACO is 4 keys: `t` (tag), `a` (attributes), `c` (content), `o` (options). If you know HTML, you know TACO — it's the same elements, just in JS object syntax. 5 minutes to learn. | `pages/00-quick-start.html` (callout box) |
| Bootstrap CSS compatibility | Yes — bitwrench is CSS-agnostic. Use Bootstrap classes in the `a: {class: '...'}` field. bitwrench doesn't care where your CSS comes from. You can use `bitwrench.css`, Bootstrap, Tailwind, or nothing. | `pages/03-styling.html` (three strategies section) |
| jQuery compatibility | bitwrench and jQuery can coexist. bitwrench generates DOM elements; jQuery can manipulate them. But bitwrench's `bw.DOM()` and `bw.$()` replace most jQuery use cases without the dependency. | Not explicitly documented |

### Gaps
- No example showing bitwrench + Bootstrap CSS together
- No migration path from jQuery → bitwrench patterns
- Could use a "for Bootstrap developers" section in quick-start

### Bridge concepts
| Bootstrap | bitwrench | Notes |
|-----------|-----------|-------|
| HTML + class names | TACO `a: {class: '...'}` | Same classes, different syntax |
| jQuery `$(el).html()` | `bw.DOM(sel, taco)` | Mount content to selector |
| Bootstrap JS plugins | `o.mounted` + DOM events | No plugin system, but full control |
| Grid system | `bw.makeGrid()` / TACO nesting | CSS grid/flexbox via `bw.css()` or classes |
| Pre-built components | `bw.makeCard()`, `bw.makeButton()`, etc. | Returns TACO objects, not HTML strings |

**This is actually the easiest transition.** Bootstrap developers already think in terms of "HTML + CSS classes." TACO is that same mental model expressed as JS objects, which unlocks data-driven composition.

---

## Tailwind CSS

### Who they are
Utility-first CSS developers who compose styles directly in markup. They value co-located styles (no separate CSS files), design tokens via config, and rapid iteration. Many use Tailwind with React/Vue/Svelte and may evaluate bitwrench purely on its CSS story.

### First reaction to bitwrench
"Can I use my Tailwind classes with this? And why does bitwrench have its own CSS generation when I already have Tailwind?"

### Key concerns

1. **Different CSS philosophy** — "bitwrench generates class-based CSS; Tailwind is utility-first."
2. **Can I use Tailwind WITH bitwrench?** — "I don't want to give up `flex gap-4 p-6`."
3. **No design tokens / config file** — "Tailwind's `tailwind.config.js` is powerful."
4. **No JIT / purging** — "Won't bitwrench CSS be bloated?"

### How bitwrench answers each

| Concern | Answer | Where documented |
|---------|--------|-----------------|
| Different philosophy | bitwrench is CSS-agnostic. It offers three styling strategies: inline via `bw.s()`, generated via `bw.css()`, or external CSS (including Tailwind). Use whichever fits. | `pages/03-styling.html` |
| Tailwind compatibility | Absolutely. Put Tailwind classes in `a: {class: 'flex gap-4 p-6'}`. bitwrench generates HTML; Tailwind styles it. They're complementary, not competing. | `pages/03-styling.html` (third strategy: "any CSS file") |
| No design tokens | `bw.generateTheme(name, config)` derives an entire theme from 3 seed colors. It's a different approach — algorithmic derivation instead of manual token definition. For simpler projects, it's faster. | `pages/10-themes.html` |
| No JIT/purging | bitwrench's built-in CSS is ~5KB. `bw.generateTheme()` generates scoped CSS on demand. There's nothing to purge because you only generate what you use. | `pages/09-builds.html` (CSS file size) |

### Gaps
- No example showing bitwrench + Tailwind together (would be very compelling)
- No `bw.s()` comparison with Tailwind utility classes
- `bw.u` utility object isn't well documented

### Bridge concepts
| Tailwind | bitwrench | Notes |
|----------|-----------|-------|
| `class="flex gap-4"` | `a: {class: 'flex gap-4'}` | Identical — just use Tailwind classes |
| `@apply` | `bw.css()` rule generation | Different mechanism, same goal |
| `tailwind.config.js` | `bw.generateTheme(name, config)` | 3 colors vs many tokens |
| JIT compilation | Runtime `bw.injectCSS()` | No build step at all |
| Responsive `md:flex` | `bw.responsive()` or Tailwind classes | Can use either |

---

## Qwik

### Who they are
Cutting-edge developers interested in resumability, progressive hydration, and O(1) startup time. They come from a React background but are frustrated by hydration cost. They think about time-to-interactive and partial page loading.

### First reaction to bitwrench
"No resumability? No progressive hydration? This is the old model — ship all JS upfront."

### Key concerns

1. **No resumability** — "Qwik serializes state into HTML; no re-execution on load."
2. **No progressive hydration** — "Qwik loads JS only when components become interactive."
3. **No lazy loading of component code** — "All bitwrench code loads at once."
4. **Different SSR model** — "Qwik's SSR is resumable; bitwrench's is string-based."

### How bitwrench answers each

| Concern | Answer | Where documented |
|---------|--------|-----------------|
| No resumability | Correct — bitwrench doesn't serialize state into HTML for client pickup. But at ~26KB, bitwrench's total JS payload is often smaller than Qwik's serialized state + loader. For small-to-medium apps, the resumability overhead doesn't pay off. | `pages/09-builds.html` |
| No progressive hydration | bitwrench loads once (26KB) and everything works. No loading waterfall, no component-boundary splitting, no `$` function complexity. Simpler mental model at the cost of Qwik's lazy-loading advantage for very large apps. | `pages/00-quick-start.html` |
| No lazy loading | Correct. bitwrench is a single file. For its target apps (dashboards, prototypes, embedded UIs), this is fine — 26KB is less than a hero image. For apps with 500+ components, Qwik's approach is genuinely better. | `pages/09-builds.html` |
| Different SSR model | `bw.html(taco)` in Node.js produces HTML strings. No special server runtime, no edge functions, no framework-specific deployment. Any server that can run JS (or even non-JS servers that output JSON) can use bitwrench. | `pages/07-framework-comparison.html` §1 (Server-Driven UI) |

### Gaps
- No performance comparison for initial load time
- No discussion of Qwik in the framework comparison page
- Could document `bw.html()` SSR as "instant hydration" — there's nothing to hydrate because bitwrench doesn't have a hydration step

### Bridge concepts
| Qwik | bitwrench | Notes |
|------|-----------|-------|
| `component$()` | `bw.component(taco)` → handle | Handle has `.get()/.set()`, no lazy boundary |
| `useSignal()` | `o.state` + `handle.set()` | No serialization, template bindings auto-update |
| `$` (lazy marker) | Not needed | Everything loads with the script tag |
| Resumability | Full execution | Trade larger initial load for simpler model |
| `server$()` | `bw.html()` in Node.js | String output, not resumable HTML |
| Progressive hydration | No hydration step | Nothing to hydrate — DOM is built directly |

---

## Cross-Cutting Concerns Table

Every framework developer will ask some version of these questions. This table maps each concern to bitwrench's actual answer and where it's documented.

| Concern | bitwrench answer | Where documented | Status |
|---------|-----------------|-----------------|--------|
| Fine-grained DOM updates | `bw.patch(uuid, content)` targets elements by UUID class | `pages/05-state.html` §6 | Documented |
| Component composition | Factory functions returning TACO; nest via `c` field | `pages/01-components.html`, `pages/05-state.html` §4 | Documented |
| Cross-component communication | `bw.pub(topic, detail)` / `bw.sub(topic, handler)` for app-scoped; `bw.emit()` / `bw.on()` for DOM-scoped | `pages/05-state.html` §7 | Documented |
| Lifecycle management | `o.mounted(el)` on mount, `o.unmount(el)` on cleanup | `pages/05-state.html` §3-4 | Documented |
| Memory / listener cleanup | DOM replacement = automatic GC. `o.unmount` for external resources. `bw.cleanup(el)` for manual teardown | `pages/05-state.html` | Documented |
| Debugging component state | `bw.inspect(handle)` in console, or `$0._bw_state` in browser inspector | `pages/00-quick-start.html`, `pages/05-state.html` | Documented |
| Server-side rendering | `bw.html(taco)` from Node.js — string output, any server | `pages/07-framework-comparison.html` §1 | Documented |
| Server-driven UI (JSON→DOM) | bitwrench's unique capability — backend sends JSON, bitwrench renders it | `pages/07-framework-comparison.html` §1 | Documented |
| CSS strategy | Three strategies: `bw.s()` inline, `bw.css()` generated, or any external CSS | `pages/03-styling.html` | Documented |
| Theming | `bw.generateTheme(name, config)` — 3 seed colors → full theme | `pages/10-themes.html` | Documented |
| Bundle size | ~26KB gzipped UMD min, zero dependencies | `pages/09-builds.html` | Documented |
| Build step | None required. Single `<script>` tag | `pages/00-quick-start.html` | Documented |
| TypeScript support | TACO objects are easily typed, but no `.d.ts` shipped | — | **Gap** |
| Testing strategy | Standard DOM testing — `bw.html()` returns strings, test with any assertion library | — | **Gap** |
| Routing | Not built-in. Use History API, hash routing, or any router library | — | **Gap** |
| Animation | CSS transitions via `bw.css()`, `@keyframes` support | `pages/03-styling.html` | Partially covered |
| Accessibility (a11y) | Standard HTML attributes in `a: {role, aria-label, ...}` | — | **Gap** |
| Internationalization (i18n) | No built-in i18n — use any i18n library, pass translated strings to TACO | — | **Gap** |
| Error boundaries | No built-in error boundary — use try/catch in render functions | — | **Gap** |

---

## How Bitwrench Handles Common Concerns

Developers coming from other frameworks often raise these topics. Here's how bitwrench addresses each one.

### Architecture enforcement
TACO objects are plain data — they can be validated with functions, lint rules, or JSON schemas. A `validatePage(taco)` function can restrict allowed tags, require specific attributes, or enforce nesting rules. Since TACO is just JS objects, any validation approach that works on objects works on TACO.

### Component ecosystem
bitwrench ships with a growing set of component helpers (`makeTable`, `makeCard`, `makeButton`, `makeTabs`, etc.) in the BCCL (Bitwrench Component Composition Library). Community components are welcome. Because bitwrench generates standard HTML, any HTML/CSS component (Bootstrap, Tailwind UI, etc.) can be used via TACO attributes.

### TypeScript
TACO objects are plain interfaces — TypeScript works natively. Define a `Taco` interface with `t`, `a`, `c`, `o` fields and your factory functions are fully typed. A `.d.ts` file is planned. No special compiler plugin is needed because TACO is already a JS data structure.

### Reactivity
`bw.component(taco)` wraps a TACO in a reactive handle with `.get()/.set()` and template bindings (`${key}`). Calling `handle.set('count', 42)` automatically re-renders bindings. For lower-level control, `bw.update(el)` re-renders a component, `bw.patch(uuid, val)` does targeted DOM updates by UUID, and `bw.pub()`/`bw.sub()` handle cross-component communication.

### Performance at scale
`bw.patch(uuid, content)` updates specific DOM elements without walking or diffing a tree. There's no virtual DOM overhead — updates go directly to the real DOM, which the browser handles at native speed. For structural changes, `bw.update(el)` replaces the subtree via the element's render function.

### Code splitting
bitwrench is a single file by design (~26KB gzipped). For applications that need code splitting, standard dynamic `import()` works — load bitwrench once, then lazy-load your own application modules as needed.

## Example Use Cases

Bitwrench is used in a range of contexts. Here are some examples.

- **Prototyping and proof-of-concepts** — Zero setup, instant iteration. Write a TACO, see it render. No `create-react-app`, no `npm install`, no config files.
- **Internal tools and admin panels** — Data tables, dashboards, forms. bitwrench's `makeTable()`, `makeCard()`, and data-driven rendering are purpose-built for this.
- **Embedded / IoT dashboards** — ESP32, Raspberry Pi, constrained devices. 26KB total, no build step, works offline.
- **Polyglot backends** — Python, Go, Rust, C servers that emit JSON. bitwrench renders the JSON directly — no Node.js SSR layer needed.
- **Single-file tools** — One HTML file with a `<script>` tag. Email it, drop it on a USB drive, host it on any static server.
- **Learning and teaching** — No framework abstractions between the developer and the DOM. Understand what `document.createElement` does, then use bitwrench to do it faster.
- **Server-rendered UIs** — `bw.html()` in Node.js produces complete HTML strings. No hydration, no client runtime required.
- **Constrained environments** — Air-gapped networks, legacy browsers, environments where npm is unavailable.

---

## Doc Improvement Checklist

Prioritized by impact and number of framework audiences served.

### High Priority

| Improvement | Serves | Notes |
|-------------|--------|-------|
| **TypeScript type definitions** — Ship a `bitwrench.d.ts` with TACO interface, all public methods | React, Vue, Angular, Solid | Every modern framework community expects types. This is our biggest credibility gap. |
| **Testing guide** — Document how to test bitwrench components (unit test TACO output, DOM test with jsdom) | React, Vue, Angular, Svelte | React developers especially expect a testing story. Show that standard tools (Mocha, Jest, Vitest) work without special adapters. |
| **bitwrench + Tailwind example** — Show Tailwind utility classes in TACO attributes, working side by side | Tailwind, React, Vue | Tailwind is used by ~30% of frontend devs. Proving compatibility removes a major adoption barrier. |
| **Add Angular to framework comparison page** — Angular has a massive enterprise user base that the comparison page currently ignores | Angular | The comparison page covers React, Vue, Svelte but skips Angular entirely. |

### Medium Priority

| Improvement | Serves | Notes |
|-------------|--------|-------|
| **Routing patterns doc** — Show hash routing, History API, and integration with a lightweight router | React, Vue, Angular, Svelte | "How do I handle routing?" is asked by every SPA developer. Show that you don't need a framework-specific router. |
| **Animation / transition examples** — CSS transitions via `bw.css()`, `@keyframes` examples | Vue, Svelte | Vue and Svelte developers are used to declarative transitions. Show the CSS-native approach. |
| **bitwrench + Bootstrap example** — Use Bootstrap classes in TACO attributes | Bootstrap | Proves the CSS-agnostic claim with the most widely-used CSS framework. |
| **Migration mini-guides** — "Your React component → bitwrench equivalent" line-by-line | React, Vue | Side-by-side code comparison is the fastest way to learn a new tool. |

### Lower Priority

| Improvement | Serves | Notes |
|-------------|--------|-------|
| **Accessibility (a11y) guide** — Document ARIA attribute patterns in TACO | All | Show that `a: {role: 'button', 'aria-label': '...'}` works naturally. |
| **Error handling patterns** — Document try/catch in render functions, error display components | React, Angular | React's error boundaries set an expectation. Show the plain JS equivalent. |
| **"Why no virtual DOM" explainer** — A concise technical explanation of the tradeoff | React, Solid | This is the single most common question from React developers. A clear, respectful explanation would defuse the objection. |
| **Server-side generation tutorial** — Step-by-step guide to generating full HTML pages with `bw.html()` from Node.js | All (especially backend devs) | This is bitwrench's unique capability. Currently shown in framework comparison but deserves its own tutorial. |
| **Add Solid.js to framework comparison** — Solid is bitwrench's closest philosophical cousin | Solid | Highlighting the shared "no VDOM" philosophy while explaining different tradeoffs would be compelling. |
