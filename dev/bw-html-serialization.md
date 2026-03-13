# bw.html() Function Serialization & bw.htmlPage() Design

## Problem

`bw.html()` silently dropped all `on*` event handlers (they were skipped with
`if (key.startsWith('on')) continue;`). This meant TACO objects with inline
event handlers produced HTML output with no interactivity. The DOM path
(`bw.createDOM()`) worked fine because it used `addEventListener()` directly.

Meanwhile, the library had no public API for generating complete HTML documents.
The CLI's `makePageLayout()` did this internally but wasn't reusable from
library code.

## Solution

### 1. bw.html() Function Serialization

Replace the on* handler stripping with funcRegister-based serialization.
When `bw.html()` encounters an `on*` attribute:

- **Function value**: Register via `bw.funcRegister(fn)`, emit dispatch string
  `bw.funcGetById('bw_fn_N')(event)` as the attribute value.
- **String value**: Emit as-is (HTML-escaped) — supports inline JS strings.
- **null/false/undefined**: Skip (same as other attributes).

This uses the existing `bw.funcRegister()` and `bw.funcGetDispatchStr()`
infrastructure. Zero new mechanisms needed.

### 2. bw._FUNC_REGISTRY_SHIM

A ~500-byte self-contained IIFE that establishes `window.bw._fnRegistry`,
`bw.funcGetById()`, and `bw.funcRegister()`. This is the minimum runtime
needed for event dispatch in static HTML files that don't load the full
bitwrench library.

### 3. bw.htmlPage()

Generates a complete `<!DOCTYPE html>` document with:

- Configurable runtime injection (inline/cdn/shim/none)
- Automatic func registry emission for event handlers
- Theme support (preset names or config objects)
- Extra `<head>` elements, favicon, CSS
- State resolution in body content

#### Runtime Levels

| Level | What's injected | Size | Use case |
|-------|----------------|------|----------|
| `'inline'` | Full UMD bundle in `<script>` | ~120KB | Offline, airgapped, USB |
| `'cdn'` | jsdelivr `<script src>` | ~200B | Normal web hosting |
| `'shim'` | `bw._FUNC_REGISTRY_SHIM` + registry entries | ~1KB | Minimal, events only |
| `'none'` | Nothing | 0 | External bw load |

#### FuncRegistry Emission

1. Snapshot `bw._fnIDCounter` before rendering body
2. Call `bw.html(body)` — functions get registered during render
3. Collect all functions registered during this render (counter delta)
4. Emit each as `bw._fnRegistry['bw_fn_X'] = function(){...};` in body-end script
5. Shim/UMD goes in `<head>`, registry entries go before `</body>`

## Two Rendering Paths, Same TACO Input

```
TACO object ─┬─ bw.createDOM() ──> Live DOM (addEventListener, lifecycle hooks)
             │                      Full interactivity, browser-only
             │
             └─ bw.html() ────────> HTML string (funcRegister dispatch)
                │                   Serializable, works in Node.js
                │
                └─ bw.htmlPage() ─> Complete document
                                    Self-contained, offline-capable
```

Both paths consume the same TACO definition. A TACO with `onclick: fn` works
in both — the DOM path uses addEventListener, the HTML path uses funcRegister.

## BCCL Component Story

BCCL components (tabs, accordion, dropdown, carousel) already use inline
onclick closures in their TACO attributes. With function serialization,
these work automatically in the HTML path:

- **Inline events** (`onclick`, `onchange`): Work in both paths
- **Mounted hooks** (`o.mounted`): DOM-only (graceful no-op in HTML path)
- **State management** (`o.render`): DOM-only (initial state rendered in HTML)

This is intentional graceful degradation: HTML output captures the initial
interactive state. If the full runtime is loaded (inline/cdn), BCCL
components get full lifecycle. If only the shim is loaded, basic click
handlers still work.

## Relationship to Other Systems

- **CLI**: `makePageLayout()` delegates to `bw.htmlPage()` with `runtime:'none'`
  (CLI handles its own injection via inject.js)
- **bwserve**: Server pushes updates via SSE; `bw.htmlPage()` generates the
  initial document that bwserve's client script connects from
- **SSR**: `bw.htmlPage()` is the SSR primitive — generate on server, hydrate
  on client (when inline/cdn runtime loads)

## Airgapped/Embedded First-Class Citizen

With `runtime:'inline'`, `bw.htmlPage()` produces a completely self-contained
HTML file. No network requests, no CDN, no build step. Open from a USB stick,
email as attachment, serve from an ESP32. This is a key differentiator from
framework-dependent approaches.
