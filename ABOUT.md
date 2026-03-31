# Why Bitwrench Exists

## The short version

The browser already has everything you need to build UIs: the DOM for structure, CSS for styling, and JavaScript for behavior. What it lacks is a concise way to express all three together. Bitwrench provides that — a single plain-JS object format called TACO that describes structure, attributes, content, and behavior, rendered by a 40KB library with zero dependencies, zero build steps, and zero framework lock-in.

That's it. No virtual DOM, no JSX compiler, no CSS preprocessor, no state management library, no bundler config. Just JavaScript objects and the browser platform.

## How TACO came to be

### 2005 — A tiny web server and a UI problem

Bitwrench started as a side effect of a different project. In 2005, Manu Chatterjee and Greg Simon co-founded Lampdesk and built WebVM — a self-contained web server (~1MB) that could run on any machine and serve a local web UI to the browser. WebVM bundled HTML/CSS/JS applications into packages that could access native device services — cameras, file systems, hardware — through web service calls. It ran on desktops, laptops, and small embedded devices.

The demos needed a UI. Writing raw HTML for every screen was tedious, so a small framework emerged: describe the UI as JavaScript objects, let a function generate the markup. A navbar, a set of mini-apps, a dashboard — all from compact JS descriptions.

Palm acquired Lampdesk in 2007. The WebVM technology and its core patents ([US20080147671A1](https://patents.google.com/patent/US20080147671)) became foundational to what Palm shipped as [webOS](https://www.theverge.com/2012/6/5/3062611/palm-webos-hp-inside-story-pre-postmortem) in 2009 — an operating system built entirely on web technologies, now powering millions of LG smart TVs. The little UI framework from the demos, however, sat dormant.

### 2011 — The verbosity problem gets a name

Building web apps again after leaving HP, the same frustration resurfaced. Bootstrap and YUI were solid libraries, but the markup was painful. A simple Bootstrap card:

```html
<div class="card">
  <div class="card-header"><h5 class="card-title">Users</h5></div>
  <div class="card-body"><p class="card-text">42 online</p></div>
</div>
```

Five nested elements, five class names, just to show a title and a number. Multiply that across a dashboard and you're writing more boilerplate than content.

The fix was the same idea from the WebVM demos, formalized: describe UI as JavaScript objects. A library called UsefulJunk introduced the `{t, a, c}` format — Tag, Attributes, Content. The same card:

```js
{ t: 'div', a: { class: 'card' }, c: [
    { t: 'h5', c: 'Users' },
    { t: 'p', c: '42 online' }
]}
```

One object. The library generated the full Bootstrap markup from the compact description.

The `o:` (options) key followed not long after. Since `{t, a, c}` compiled down to HTML, there needed to be a place for metadata that wouldn't collide with actual HTML attributes — lifecycle hooks, rendering hints, custom behavior. Putting them in `a:` would contaminate the HTML output, and at the time the `data-*` attribute namespace was still being standardized and adopted in conflicting ways. A separate `o:` key kept the library's concerns cleanly separated from the DOM's. The format became `{t, a, c, o}` — TACO.

### 2014 — From side project to daily tool

UsefulJunk got renamed to bitwrench (an early project codename that stuck) and moved to a proper Git repo. It saw regular use for client-facing demos and internal dashboards at Trensant — a live knowledge graph platform that ingested 85,000+ sources to map 10M+ entities and their connections in real-time. The demos combined bitwrench with D3 and charting libraries. Bitwrench was always open source; the demos were proprietary. The core idea stayed the same: describe UI as JavaScript objects, let the library handle the verbose parts.

### 2018 — React validates the model, not the tooling

React proved that declarative UI — describing what the screen should look like as a function of state — was the right direction. The component model was a genuinely good idea. But the implementation raised a question: why put HTML inside JavaScript (JSX) only to compile it back out? This required a transpiler (Babel), a bundler (webpack), a virtual DOM runtime, a state management library, and increasingly complex tooling just to render a button. The dependency trees were enormous. And every few years, the ecosystem churned — class components to hooks, webpack to Vite, Redux to Zustand — requiring rewrites of working code.

TACO objects already did what JSX did. They were already JavaScript. There was nothing to compile. The declarative model React popularized was right — the tooling overhead wasn't necessary to get there.

### 2020s — The same insight, applied everywhere

As Tailwind rose, the same pattern appeared again in CSS. The composition problem — CSS is verbose and hard to reuse — was being solved by inventing new vocabularies (`p-4 md:p-6 bg-blue-500`) and build-time tools. Sass added variables and mixins. CSS Modules added scoping. CSS-in-JS added runtime injection. All of them needed tooling.

But CSS values are just strings. If your UI is already described in JavaScript objects, then CSS values are just string properties on those objects. Store them in variables, compute them with functions, compose them with `Object.assign`, reuse them across components — all with plain JavaScript. No preprocessor, no utility class vocabulary, no purge pass.

The same insight applied to everything the frameworks were solving:
- **Reactivity** — doesn't need a virtual DOM or a compiler. It needs a `.set()` method that knows which DOM nodes depend on which state keys.
- **Server-driven UI** — doesn't need Streamlit's Python runtime or Phoenix LiveView's Elixir channels. It needs JSON objects over SSE.
- **Design systems** — doesn't need CSS custom properties or a token pipeline. It needs functions that derive shade variants from seed colors.

The DOM, CSS, and JavaScript already cover all the bases. What was always missing was a concise way to use them together.

### 2026 — Bitwrench v2

Bitwrench v2 is the full expression of an idea refined across two decades: from WebVM demos in 2005, to Bootstrap wrappers in 2011, to production dashboards, to a complete UI system today.

TACO options (`o.state`, `o.render`, `o.handle`, `o.slots`) provide reactive state management. `bw.css()` generates CSS from JS objects. `bw.makeStyles()` creates complete design systems from two hex colors. `bwserve` streams TACO objects over SSE for server-driven UIs. The whole thing ships as a single 40KB gzipped file with no dependencies.

It's not trying to replace React for teams of fifty building complex SPAs. It's an alternative for the vast majority of web UIs that don't need that complexity: dashboards, internal tools, embedded device interfaces, prototypes, data apps, server-driven UIs, and anything where a build step is a liability rather than an asset.

The thesis hasn't changed since 2005: the browser is the platform, JavaScript is the language, and the right abstraction is the one that gets out of the way.

## Who this is for

- **Embedded engineers** who need a UI for their ESP32/RPi
- **Backend developers** who want to build a web UI without learning a frontend framework
- **Data scientists** who want a Streamlit-like experience in any language, not just Python
- **Rapid prototypers** who want to go from idea to working UI in minutes, not hours of tooling setup
- **LLM applications** where the AI generates UI — TACO objects are an order of magnitude more token-efficient than JSX/HTML
- **Anyone** who looked at `node_modules/` and thought "there has to be a simpler way"

## License

BSD-2-Clause. Free for commercial and personal use.

---

*Bitwrench is maintained by [Manu Chatterjee](https://github.com/deftio) (deftio).*
