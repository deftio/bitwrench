# Bitwrench for WebAssembly

## Table of Contents

0. [The Thesis](#0-the-thesis)
1. [The WASM/JS Boundary Problem](#1-the-wasmjs-boundary-problem)
2. [TACO as a Rendering IDL](#2-taco-as-a-rendering-idl)
3. [bwserve: The Browser as a Display Server](#3-bwserve-the-browser-as-a-display-server)
4. [Architecture Patterns](#4-architecture-patterns)
5. [Rust Integration](#5-rust-integration)
6. [C/C++ Integration](#6-cc-integration)
7. [AI and Agent-Driven UI](#7-ai-and-agent-driven-ui)
8. [Why Not DOM Diffing?](#8-why-not-dom-diffing)
9. [Comparison to Other Approaches](#9-comparison-to-other-approaches)
10. [What You Get and What You Don't](#10-what-you-get-and-what-you-dont)

**Related docs:** [Thinking in Bitwrench](thinking-in-bitwrench.md) | [bwserve](bwserve.md) | [App Patterns](app-patterns.md) | [Embedded Tutorial](tutorial-embedded.md)

---

## 0. The Thesis

Systems programmers who need a web UI have several options: per-DOM-call bindings (`web-sys`/`wasm-bindgen`), shipping a full language runtime to the browser (Blazor), learning a WASM-native component framework (Yew, Leptos, Dioxus), or wrapping a browser in a desktop shell (Tauri, Electron). Each makes a different set of tradeoffs around payload size, boundary crossing cost, and how much of the browser platform is accessible.

This document describes a different tradeoff: **the WASM module produces UI as JSON data, and a JS-side library handles rendering.**

The WASM module produces TACO objects -- `{t, a, c, o}`, bitwrench's plain-object component format. It sends them across the WASM/JS boundary as structured data. Bitwrench on the JS side materializes them into DOM elements with CSS, accessibility, text selection, forms, and browser-native layout. Events flow back. Screenshots flow back. The WASM module does not interact with the DOM directly.

With bwserve, the protocol extends to a full display-server model -- analogous to X11/Wayland for web UIs. The WASM module (running in-page, in a Worker, or as a network server) sends rendering commands and receives user events through a message protocol.

This architecture also applies to **AI-driven interfaces**. A local WASM model (or an agent connected to one) can generate TACO specs, push them to the browser, observe the result via screenshots, and iterate.

> **The core idea: a WASM module that computes a state change already knows what changed. It can say so directly with a targeted patch, rather than re-describing the entire UI for a differ to reconcile.**

---

## 1. The WASM/JS Boundary Problem

WebAssembly runs in a sandboxed linear memory space. It cannot touch the DOM directly. Every interaction with the browser requires crossing a boundary -- calling a JS function from WASM or vice versa. This boundary is the central architectural constraint of any WASM-based web application.

### The cost of crossing

Each boundary crossing has overhead: type marshaling, memory copying, function dispatch. The cost per crossing is small (~50-200ns), but it accumulates. A framework that crosses the boundary once per DOM operation -- one `createElement`, one `setAttribute`, one `appendChild` -- pays this cost hundreds or thousands of times per render.

### How existing frameworks handle it

**Yew / Leptos / Dioxus (Rust):** These frameworks run a virtual DOM or reactive graph inside WASM and call `web-sys` bindings (which wrap `wasm-bindgen`) for each DOM mutation. A render of 100 elements means hundreds of boundary crossings: create element, set attribute, set text, append child, for each node. The frameworks optimize by batching and diffing, but the fundamental cost is per-DOM-operation.

**Blazor (.NET):** Ships the entire .NET runtime as WASM (~2-5MB download). Every DOM mutation crosses the boundary through a JS interop layer. The runtime overhead is substantial both in payload and per-operation cost.

**Raw `web-sys`:** The most direct approach. You call `document.create_element("div")` from Rust, which becomes a `wasm-bindgen` call, which becomes a JS function call, which calls the DOM API. This works and gives full control, but each DOM operation is a separate boundary crossing.

### An alternative: batch the boundary

A different approach is to cross the boundary **once per render, not once per DOM operation.** The WASM module builds a TACO object (a JSON-serializable data structure) and sends it across the boundary as a single message. The JS-side library materializes the entire tree in one shot using `bw.createDOM()` or `bw.DOM()`.

```
WASM side                           JS side (bitwrench)
---------                           -------------------
Build TACO tree in linear memory    |
Serialize to JSON string            |
                                    |
   --- one boundary crossing --->   |
                                    JSON.parse()
                                    bw.DOM('#app', taco)
                                      createElement('div')
                                      setAttribute('class', 'card')
                                      createTextNode('Hello')
                                      appendChild(...)
                                      ... (all native JS, zero crossings)
```

100 elements = 1 crossing, not 300+. The DOM operations happen inside JS where they're native function calls with zero marshaling overhead.

For incremental updates, the same principle applies. Instead of diffing an entire virtual tree across the boundary, the WASM module sends a targeted patch message: `{type: 'patch', target: '#counter', content: '42'}`. One crossing, one DOM mutation.

---

## 2. TACO as a Rendering IDL

An IDL (Interface Definition Language) defines a contract between two systems that may use different languages and memory models. Protocol Buffers are an IDL for RPC. OpenAPI is an IDL for REST APIs. TACO is effectively an **IDL for UI rendering.**

### The format

```javascript
{
  t: 'div',                          // tag name
  a: { class: 'card', id: 'main' }, // HTML attributes
  c: [                                // content: string, TACO, or array
    { t: 'h1', c: 'Dashboard' },
    { t: 'p', c: 'Status: online' }
  ]
}
```

Four keys. `t` is the tag. `a` is attributes. `c` is content. `o` is options (lifecycle hooks, state -- JS-side only). The first three are pure data. Any language that can produce JSON can produce a TACO.

### Why this matters for WASM

A Rust struct, a C string buffer, a Python dict -- all can represent `{t, a, c}`. There is no special type system, no framework-specific abstractions, no closures or proxies to marshal. The TACO is data that describes UI. The renderer is a separate system that consumes that data.

Compare this to what you'd need to cross the boundary for other frameworks:

| Framework | What crosses the boundary | Serializable? |
|-----------|--------------------------|---------------|
| React | Virtual DOM tree with closures, refs, fiber nodes | No |
| Vue | Reactive proxy objects with dependency tracking | No |
| Svelte | Compiler-generated update functions | No (they're code) |
| Solid | Signal graph with closure-based subscriptions | No |
| **Bitwrench** | **JSON object: `{t, a, c}`** | **Yes** |

The other frameworks in this table were designed for same-runtime use -- the component model and the renderer share a JS heap. TACO was designed for cases where the producer and renderer are separated by a boundary (server-driven UI via bwserve, embedded devices like ESP32). That same property makes it usable across the WASM/JS boundary without adaptation.

### The `o` split

The fourth key, `o:`, contains JavaScript-specific concerns: lifecycle hooks (`mounted`, `unmount`), component state (`state`, `render`), and handle methods (`handle`, `slots`). These are functions that can only live in JS.

For WASM, this split is a natural fit: the **specification** (what to render) crosses the boundary as data, while the **behavior** (DOM event handling, lifecycle management) stays in JS where DOM access is native.

For cases where the WASM module needs to define behavior, bwserve provides `register` and `call` -- send a function string once, invoke it by name later. This keeps the boundary thin while allowing the WASM side to install client-side logic when needed.

---

## 3. bwserve: The Browser as a Display Server

bwserve is bitwrench's server-driven UI protocol. It was originally designed for Node.js servers pushing UI to browsers. But the protocol is transport-agnostic -- any process that can send JSON messages can drive a bitwrench UI. Including a WASM module.

### The protocol

Nine message types. Five for DOM operations, three for code execution, one for component dispatch:

| Type | What it does | Example |
|------|-------------|---------|
| `replace` | Replace element subtree | `{type:'replace', target:'#app', node:{t:'div', c:'Hello'}}` |
| `patch` | Update text or attributes | `{type:'patch', target:'counter', content:'42'}` |
| `append` | Add child element | `{type:'append', target:'#list', node:{t:'li', c:'New'}}` |
| `remove` | Delete element | `{type:'remove', target:'#old'}` |
| `batch` | Multiple operations | `{type:'batch', ops:[...]}` |
| `register` | Send named function | `{type:'register', name:'scroll', body:'function(s){...}'}` |
| `call` | Invoke function by name | `{type:'call', name:'scroll', args:['#chat']}` |
| `exec` | Run arbitrary JS | `{type:'exec', code:'document.title="Hi"'}` |
| `message` | Component dispatch | `{type:'message', target:'#card', action:'setTitle', data:'New'}` |

### The full loop

```
WASM Module (application)           Browser (display server)
-------------------------           -----------------------
State + logic                       bitwrench + bwserve client
  |                                   |
  |-- replace: full render -------->  bw.apply() -> bw.DOM()
  |-- patch: targeted update ------>  bw.apply() -> bw.patch()
  |-- call: scroll, focus, etc. --->  bw.apply() -> invoke function
  |-- batch: multiple ops --------->  bw.apply() -> sequential
  |                                   |
  <-- event: {target, type, data} --  subscribed listener fires
  <-- screenshot: PNG buffer -------  html2canvas -> POST-back
```

The browser renders what it's told, forwards user events back through the protocol, and can capture screenshots. The WASM module owns state, makes decisions, and pushes UI updates.

### Where the WASM module runs

The bwserve protocol works regardless of where the WASM module lives:

**Same page (in-browser WASM):** The WASM module runs in the main thread or a Web Worker. Messages pass through `postMessage` or direct function calls. Lowest latency, simplest deployment -- one HTML file.

**Web Worker:** The WASM module runs in a dedicated Worker thread. Messages pass through `postMessage`. The UI thread stays responsive even during heavy computation. Good for CPU-intensive applications (simulation, ML inference, data processing).

**Service Worker:** The WASM module intercepts fetch requests and serves bwserve protocol responses. The page opens an EventSource to the Service Worker. Works offline once the Service Worker is installed.

**Network server:** The WASM module compiles to WASI and runs as an actual HTTP server (or compiles to native). The browser connects via SSE over the network. This is the standard bwserve architecture -- the transport just happens to be HTTP instead of in-process messaging.

All four deployments use the same protocol messages. The WASM module's code doesn't change -- only the transport layer differs.

---

## 4. Architecture Patterns

### Pattern A: In-Page WASM with Direct Calls

The simplest pattern. The WASM module exposes functions that return TACO JSON strings. JavaScript calls them and renders the result.

```
index.html
  loads bitwrench.umd.js
  loads app.wasm (via wasm-bindgen, emscripten, etc.)
  calls wasm.render() -> returns TACO JSON -> bw.DOM('#app', JSON.parse(result))
  on user event -> calls wasm.handle_event(event_data) -> returns patch JSON
```

JavaScript glue (minimal):

```javascript
// Glue code -- the only JS you write
import init, { render, handle_event } from './app.js'; // wasm-bindgen output

async function start() {
  await init();

  // Initial render -- WASM produces TACO, JS renders it
  var taco = JSON.parse(render());
  bw.DOM('#app', taco);

  // Forward events to WASM by element ID.
  // The WASM module produces elements with IDs; the glue
  // routes events on those elements back to WASM.
  bw.$('#app')[0].addEventListener('click', function(e) {
    var id = e.target.id;
    if (!id) return;

    var event = JSON.stringify({
      target: id,
      type: 'click',
      value: e.target.value || ''
    });

    var messages = JSON.parse(handle_event(event));
    messages.forEach(function(msg) { bw.apply(msg); });
  });
}

start();
```

The Rust side (see Section 5 for full detail) builds JSON strings. The glue handles rendering and event forwarding.

### Pattern B: Worker-Based WASM with Message Passing

For CPU-intensive applications. The WASM module runs in a Worker. The main thread handles rendering and event dispatch.

```
main thread                          Worker thread
-----------                          -------------
bitwrench.js                         app.wasm
bw.DOM(), bw.apply()                 state + logic
  |                                    |
  |<-- postMessage: bwserve msg ------|
  |--- postMessage: user action ----->|
```

Main thread (glue):

```javascript
var worker = new Worker('worker.js');

worker.onmessage = function(e) {
  // Worker sends bwserve protocol messages
  var messages = e.data;
  messages.forEach(function(msg) { bw.apply(msg); });
};

// Forward user events to Worker by element ID
document.addEventListener('click', function(e) {
  if (e.target.id) {
    worker.postMessage({ target: e.target.id, type: 'click' });
  }
});
```

Worker:

```javascript
// worker.js
importScripts('app_wasm_glue.js');

// WASM module sends rendering commands back to main thread
function send(messages) {
  postMessage(messages);
}

onmessage = function(e) {
  var result = wasm_handle_event(JSON.stringify(e.data));
  send(JSON.parse(result));
};

// Initial render
wasm_init().then(function() {
  send(JSON.parse(wasm_render()));
});
```

The WASM module in the Worker has the same interface as Pattern A -- it produces JSON, the glue forwards it. The Worker boundary is invisible to both sides.

### Pattern C: WASM Server via bwserve (Network)

The WASM module compiles to a server binary (native or WASI). It speaks HTTP and serves the bwserve protocol. The browser connects via SSE -- standard bwserve, no special WASM integration needed.

```
WASM server binary                  Browser
(compiled to native)                (any browser)
  |                                   |
  |-- GET / -> HTML shell ---------->|
  |-- GET /bw/events -> SSE -------->|
  |-- SSE: replace/patch/etc ------->| bw.apply() -> DOM
  |<-- POST /bw/return/action -------|
  |<-- POST /bw/return/screenshot ---|
```

This pattern has the broadest capabilities. The WASM module:
- Runs as a real server process (can access filesystem, databases, hardware)
- Gets auto-reconnect for free (SSE spec)
- Supports multiple browser clients simultaneously
- Can capture screenshots via `client.screenshot()`
- Works behind a reverse proxy, in Docker, on a Raspberry Pi

The same Rust/C++ code that runs as an in-page WASM module can compile to a native server binary with a different transport layer. The application logic is identical.

---

## 5. Rust Integration

### Producing TACO from Rust

TACO is JSON. Rust's `serde_json` produces JSON. The integration is straightforward.

```rust
use serde_json::json;

fn render_dashboard(state: &AppState) -> String {
    json!({
        "t": "div", "a": {"class": "bw-container"}, "c": [
            {"t": "h1", "c": &state.title},
            {"t": "div", "a": {"class": "bw-row"}, "c": [
                stat_card("Users", &state.users.to_string(), "primary"),
                stat_card("Revenue", &format!("${}", state.revenue), "success"),
                stat_card("Orders", &state.orders.to_string(), "info")
            ]},
            {"t": "button", "a": {
                "id": "refresh-btn",
                "class": "bw-btn bw-btn-primary"
            }, "c": "Refresh"}
        ]
    }).to_string()
}

fn stat_card(label: &str, value: &str, variant: &str) -> serde_json::Value {
    json!({
        "t": "div", "a": {"class": format!("bw-stat-card bw-stat-card-{}", variant)}, "c": [
            {"t": "div", "a": {"class": "bw-stat-card-value"}, "c": value},
            {"t": "div", "a": {"class": "bw-stat-card-label"}, "c": label}
        ]
    })
}
```

### A helper crate (optional)

For ergonomics, a thin wrapper around `serde_json::Value`:

```rust
// taco.rs -- ~50 lines, not a framework

use serde_json::{json, Value};

pub fn tag(t: &str) -> Value {
    json!({"t": t})
}

pub fn el(t: &str, attrs: Value, children: Vec<Value>) -> Value {
    json!({"t": t, "a": attrs, "c": children})
}

pub fn text(t: &str, content: &str) -> Value {
    json!({"t": t, "c": content})
}

pub fn div(attrs: Value, children: Vec<Value>) -> Value {
    el("div", attrs, children)
}

pub fn button(label: &str, id: &str) -> Value {
    json!({
        "t": "button",
        "a": {"id": id, "class": "bw-btn bw-btn-primary"},
        "c": label
    })
}

// bwserve protocol messages
pub fn msg_replace(target: &str, node: Value) -> Value {
    json!({"type": "replace", "target": target, "node": node})
}

pub fn msg_patch(target: &str, content: &str) -> Value {
    json!({"type": "patch", "target": target, "content": content})
}

pub fn msg_batch(ops: Vec<Value>) -> Value {
    json!({"type": "batch", "ops": ops})
}
```

With this helper:

```rust
use taco::*;

fn render(state: &AppState) -> String {
    msg_replace("#app", div(
        json!({"class": "container"}),
        vec![
            text("h1", &state.title),
            text("p", &format!("Count: {}", state.count)),
            button("+1", "inc-btn"),
            button("Reset", "reset-btn"),
        ]
    )).to_string()
}

fn handle_event(state: &mut AppState, target_id: &str) -> String {
    match target_id {
        "inc-btn" => {
            state.count += 1;
            msg_patch("count", &state.count.to_string()).to_string()
        }
        "reset-btn" => {
            state.count = 0;
            msg_patch("count", "0").to_string()
        }
        _ => "[]".to_string()
    }
}
```

The WASM module produces JSON and receives JSON. DOM bindings (`web-sys`) are not needed.

### wasm-bindgen export (in-page pattern)

```rust
use wasm_bindgen::prelude::*;
use std::sync::Mutex;

static STATE: Mutex<AppState> = Mutex::new(AppState::new());

#[wasm_bindgen]
pub fn render() -> String {
    let state = STATE.lock().unwrap();
    render_dashboard(&state)
}

#[wasm_bindgen]
pub fn handle_event(event_json: &str) -> String {
    let event: serde_json::Value = serde_json::from_str(event_json).unwrap();
    let target = event["target"].as_str().unwrap_or("");
    let mut state = STATE.lock().unwrap();
    handle_event_inner(&mut state, target)
}
```

### Axum/Actix server (network pattern)

The same rendering code compiles to a native server:

```rust
use axum::{routing::get, Router};
use axum::response::sse::{Event, Sse};
use futures::stream::Stream;

async fn sse_handler() -> Sse<impl Stream<Item = Result<Event, std::io::Error>>> {
    let state = AppState::new();
    let initial = render_dashboard(&state);
    let event = Event::default().data(initial);
    // ... SSE stream setup
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/bw/events", get(sse_handler))
        .route("/", get(serve_shell));
    // ...
}
```

Same `render_dashboard()`, same `handle_event()`. Different transport. The rendering logic is independent of deployment target.

---

## 6. C/C++ Integration

C and C++ developers face the same boundary problem, often with tighter constraints -- embedded targets, no allocator, fixed-size buffers. Bitwrench includes a relaxed JSON format (`r-prefix`) that addresses C/C++ string-building ergonomics.

### Relaxed JSON for C strings

Standard JSON in C requires escaping every double quote:

```c
// Standard JSON -- escape nightmare
char msg[] = "{\"type\":\"patch\",\"target\":\"temp\",\"content\":\"23.5 C\"}";
```

Bitwrench's r-prefix format uses single quotes:

```c
// r-prefix relaxed JSON -- natural C strings
char msg[] = "r{'type':'patch','target':'temp','content':'23.5 C'}";
```

`bw.parseJSONFlex()` on the browser side converts single quotes to double quotes before parsing. The `r` prefix signals the format.

### C helper macros

```c
#include <stdio.h>
#include <string.h>

// Simple TACO builder macros for fixed-size buffers
#define BW_PATCH(buf, target, content) \
    snprintf(buf, sizeof(buf), \
        "r{'type':'patch','target':'%s','content':'%s'}", \
        target, content)

#define BW_REPLACE(buf, target, taco) \
    snprintf(buf, sizeof(buf), \
        "r{'type':'replace','target':'%s','node':%s}", \
        target, taco)

// TACO builders
#define TACO_TEXT(buf, tag, text) \
    snprintf(buf, sizeof(buf), "{'t':'%s','c':'%s'}", tag, text)

#define TACO_DIV(buf, cls, children) \
    snprintf(buf, sizeof(buf), \
        "{'t':'div','a':{'class':'%s'},'c':[%s]}", cls, children)

// Usage
void update_display(float temp, int humidity) {
    char temp_str[16], humid_str[16];
    char card1[128], card2[128], row[512], msg[1024];

    snprintf(temp_str, sizeof(temp_str), "%.1f C", temp);
    snprintf(humid_str, sizeof(humid_str), "%d%%", humidity);

    TACO_TEXT(card1, "p", temp_str);
    TACO_TEXT(card2, "p", humid_str);

    snprintf(row, sizeof(row), "%s,%s", card1, card2);
    TACO_DIV(msg, "readings", row);

    // Send via whatever transport (HTTP response, WebSocket, serial)
    send_to_browser(msg);
}
```

### Emscripten WASM

For C/C++ compiled to WASM via Emscripten:

```c
#include <emscripten.h>

// Called from JS glue
EMSCRIPTEN_KEEPALIVE
const char* render() {
    static char buf[4096];
    float temp = read_sensor();

    snprintf(buf, sizeof(buf),
        "r{'type':'replace','target':'#app','node':"
        "{'t':'div','c':["
            "{'t':'h1','c':'Sensor Dashboard'},"
            "{'t':'p','a':{'id':'temp'},'c':'%.1f C'},"
            "{'t':'button','a':{'id':'toggle-btn','class':'bw-btn'},"
                "'c':'Toggle LED'}"
        "]}}", temp);

    return buf;
}

EMSCRIPTEN_KEEPALIVE
const char* handle_event(const char* target_id) {
    static char buf[256];

    if (strcmp(target_id, "toggle-btn") == 0) {
        toggle_led();
        BW_PATCH(buf, "led-status", led_state() ? "ON" : "OFF");
    }

    return buf;
}
```

The JS glue calls `render()` and `handle_event()`, gets back JSON strings, and passes them to `bw.apply()`. The C code does not interact with the DOM.

---

## 7. AI and Agent-Driven UI

### The premise

A local WASM module (or a native process compiled from the same source) runs an AI model or hosts an agent. It needs to present a UI to the user. The UI is not a fixed layout with dynamic data -- it's a **dynamically generated interface** that the AI constructs based on context, user history, task state, and its own reasoning.

This is different from traditional web apps where the UI is designed at development time and data fills in at runtime. Here, the UI itself is generated at runtime.

### TACO as AI output format

AI models typically output structured data -- JSON, function calls, tool use. TACO is structured data that maps directly to UI. The model needs to produce objects with four keys: `t`, `a`, `c`, `o`. No HTML syntax, JSX conventions, or framework-specific component APIs.

```json
{"t": "div", "c": [
  {"t": "h2", "c": "Analysis Results"},
  {"t": "p", "c": "Found 3 anomalies in the dataset."},
  {"t": "div", "a": {"class": "bw-card"}, "c": [
    {"t": "h3", "c": "Anomaly #1"},
    {"t": "p", "c": "Temperature spike at 14:32 UTC"}
  ]},
  {"t": "button", "a": {"id": "investigate-btn"}, "c": "Investigate"}
]}
```

This is a straightforward structured output for an LLM. The BCCL component vocabulary (makeCard, makeTable, makeAlert, makeStatCard) provides higher-level building blocks that a model can reference by name. The token count is lower than equivalent HTML or JSX because there is less syntactic overhead.

### The visual feedback loop

bwserve's screenshot capability closes the loop. The AI generates UI, the browser renders it, the AI captures a screenshot, evaluates the result visually (via a vision model or heuristics), and refines:

```
AI Model (WASM)                     Browser
-----------                         -------
Generate TACO spec                  |
  |-- replace: render UI -------->  bw.DOM() -> visible page
  |                                 |
  |-- screenshot request -------->  html2canvas -> capture
  <-- PNG image data -------------|
  |                                 |
Evaluate screenshot                 |
  (too cramped? colors wrong?       |
   text overflow? wrong layout?)    |
  |                                 |
Generate refined TACO spec          |
  |-- replace: updated UI ------->  bw.DOM() -> improved page
```

bwserve implements `client.screenshot()` for this purpose -- it sends a `call` message that triggers `html2canvas` on the client, which captures the DOM to a canvas, converts to PNG, and POSTs the image data back to the server. The server resolves a Promise with the image buffer.

### Agent architecture

A more complete agent pattern:

```
                    +-----------------+
                    |  AI Agent (WASM)|
                    |                 |
                    |  Reasoning loop:|
                    |  1. Observe     |  <-- screenshot, user actions
                    |  2. Plan        |  <-- internal state, goals
                    |  3. Act         |  --> TACO specs, patches
                    |  4. Evaluate    |  <-- screenshot feedback
                    +-----------------+
                           |
                    bwserve protocol
                           |
                    +-----------------+
                    |  Browser        |
                    |  (display)      |
                    |                 |
                    |  bw.apply()     |
                    |  event dispatch |
                    |  screenshot     |
                    +-----------------+
```

The agent observes the UI state (via screenshots or DOM queries), plans updates based on its goals, acts by sending bwserve messages, and evaluates the result.

### Multi-surface agent UI

bwserve targets are CSS selectors. An agent can manage multiple independent UI regions:

```rust
// Agent manages three surfaces simultaneously
fn agent_step(state: &AgentState) -> Vec<Value> {
    let mut messages = vec![];

    // Main content area -- task-specific UI
    messages.push(msg_replace("#main", render_task_ui(&state.current_task)));

    // Sidebar -- agent's reasoning visible to user
    messages.push(msg_replace("#sidebar", render_reasoning_log(&state.log)));

    // Status bar -- progress and controls
    messages.push(msg_patch("status", &format!(
        "Step {}/{} -- {}", state.step, state.total, state.phase
    )));

    messages
}
```

Each surface is independently addressable. The agent can update the reasoning sidebar without touching the main content. Targeted patches mean only the changed region re-renders.

### Local-first AI

A WASM-based AI agent running locally (in the browser or on localhost) has properties that cloud-based agents don't:

- **Privacy**: Data never leaves the device. The model runs in WASM, the UI runs in the browser, the communication is localhost or in-process.
- **Latency**: No network round-trip for UI updates. The WASM module and the browser are on the same machine. Sub-millisecond message delivery.
- **Offline**: Once the page is loaded and the WASM module is cached, everything works without a network connection.
- **Inspectable**: The bwserve protocol is JSON. You can log every message, replay sessions, debug with browser DevTools. The bwcli attach REPL can inspect the DOM in real time.

These properties are relevant for local AI assistants, on-device ML tools, privacy-sensitive applications, and developer tools where the data should not leave the machine.

---

## 8. Why Not DOM Diffing?

The virtual DOM was React's central contribution to UI architecture. The idea: the application describes the entire UI on every state change, and the framework diffs the new description against the previous one to determine the minimum set of DOM mutations. This relieves the developer from tracking what changed.

This is a reasonable tradeoff for a JavaScript-only application where closures and mutable state make dependency tracking hard. But the tradeoff looks different when the state authority and the renderer are separated by a WASM/JS boundary.

### Diffing across the WASM boundary

A WASM module that manages application state in linear memory typically knows what changed -- it just ran the computation that caused the change. Re-describing the entire UI tree so a JS-side differ can identify the delta has several costs:

1. **Wasteful**: Serialize the full tree across the WASM/JS boundary (O(n) data transfer) so the differ can do O(n) comparison to find the one thing that changed
2. **Redundant**: The WASM module already knows the answer. It computed `state.count += 1`. It knows `#counter` needs to update to `"43"`.
3. **Architecturally wrong**: The diff requires maintaining two copies of the virtual tree on the JS side -- the previous and the current. For a WASM app, that's state duplication across the boundary.

With bitwrench:

```rust
// The WASM module knows exactly what changed
state.count += 1;
msg_patch("counter", &state.count.to_string())  // one message, one DOM update
```

One patch message, one DOM mutation. The WASM module communicates what it already knows.

### Historical context

Desktop UI toolkits (MFC, Swing, Qt, Cocoa) used targeted updates rather than tree diffing. In MFC, `SetWindowText("New Title")` repainted the control's title. In Swing, `label.setText("43")` updated one label. In Qt, signal-slot connections trigger specific updates. The application tracked what changed and told the framework directly.

bitwrench follows the same pattern: `el.bw.setTitle('New')` updates one component, `bw.patch('#counter', '43')` updates one element, `client.patch('counter', '43')` sends one message. The application (or the WASM module) is the source of truth about what changed.

React's diffing approach solved a real problem -- in large JS applications with shared mutable state, manually tracking dependencies is error-prone. Whether that tradeoff applies to a given WASM application depends on the application's complexity and state management approach.

### When diffing would be needed

If your WASM module genuinely doesn't know what changed -- for example, if it receives an opaque data blob from an external source and re-derives the entire UI from scratch -- then a diff-based approach would be useful. bitwrench doesn't provide this. Some alternatives:

1. Diff the **data** in WASM (compare old state to new state)
2. Emit targeted patches for what changed
3. Or, for small enough UIs, just re-render with `replace` -- `bw.DOM()` is fast enough for most subtrees

Diffing data in WASM (where you have typed structs and linear memory) is cheaper than diffing virtual DOM trees in JS (where everything is heap-allocated objects with GC pressure).

---

## 9. Comparison to Other Approaches

### Yew / Leptos / Dioxus (Rust WASM frameworks)

These are the most direct alternatives. They run a component framework inside WASM and call `web-sys` for DOM operations.

| Concern | Yew/Leptos/Dioxus | bitwrench + WASM |
|---------|-------------------|------------------|
| Component model | Rust macros + framework | JSON objects (TACO) |
| DOM access | Per-operation via web-sys | Batched via bw.apply() |
| Boundary crossings | 100s per render | 1 per render |
| Virtual DOM / signals | In WASM (Rust) | None (explicit patches) |
| CSS | Framework-specific | bw.css() / bw.loadStyles() |
| Accessibility | Manual | Browser-native (real HTML) |
| Server rendering | Framework-specific SSR | bw.html() or bwserve |
| Learning curve | Rust + framework | Rust + TACO (4 keys) |
| Bundle size | ~200KB+ (framework + app) | ~40KB (bitwrench) + app WASM |

The fundamental difference is where the component model lives. Yew/Leptos/Dioxus place it in WASM (Rust macros, reactive primitives, virtual DOM). The bitwrench approach places it in JS (TACO rendering, CSS generation, component handles) and uses JSON as the interface between the application language and the renderer.

### Blazor (.NET WASM)

| Concern | Blazor | bitwrench + WASM |
|---------|--------|------------------|
| Runtime payload | 2-5MB (.NET in WASM) | ~40KB (bitwrench) |
| Component model | Razor templates (.NET) | TACO JSON |
| DOM access | JS interop bridge | Batched via bw.apply() |
| Language | C# only | Any (Rust, C, C++, Go, ...) |
| Server mode | Blazor Server (SignalR) | bwserve (SSE) |

Blazor bundles a language runtime in WASM. The bitwrench approach does not require a language-specific runtime on the client -- the client library renders JSON regardless of what produced it.

### Tauri / Electron

| Concern | Tauri/Electron | bitwrench + WASM |
|---------|---------------|------------------|
| Deployment | Desktop app installer | URL (web page) |
| Backend | Native process (Rust/Node) | WASM (in-browser or server) |
| Frontend | You write JS/React/Vue | TACO from any language |
| Distribution | App store / download | Link sharing |
| Bundle size | 10-100MB+ | Page weight (~40KB + WASM) |

Tauri and Electron are designed for desktop application distribution. If the UI can be served as a web page, the packaging and distribution step is not needed -- the tradeoff is losing native OS integration (system tray, menus, file system access without permissions).

### Canvas-based (SDL + Emscripten, egui)

| Concern | Canvas/SDL/egui | bitwrench + WASM |
|---------|----------------|------------------|
| Rendering | Canvas pixels | Native HTML/CSS |
| Text selection | Not available | Browser-native |
| Accessibility | Not available | Browser-native (semantic HTML) |
| Forms/inputs | Custom reimplementation | Browser-native |
| CSS | Not applicable | Full CSS support |
| Right-click, find-in-page | Not available | Browser-native |

Canvas-based approaches bypass the browser's built-in UI capabilities. Generating real HTML elements preserves them, at the cost of not having pixel-level rendering control (which matters for games, CAD, and other graphics-intensive applications).

---

## 10. What You Get and What You Don't

### What you get

- Browser-native UI (real HTML/CSS) from any language that produces JSON
- Batched boundary crossing -- one message per render, not one per DOM op
- 9-verb protocol (bwserve) for remote UI control including screenshots
- ~40KB client library with 30+ components, CSS generation, theming
- No build step on the JS side
- Same application code can target in-page WASM, Worker, or native server
- Browser capabilities preserved: accessibility, text selection, CSS layout, forms
- Relaxed JSON (r-prefix) for C/C++ string-building ergonomics
- Debug tools: bwcli attach REPL, protocol logging, DOM inspection

### What you don't get

- **No automatic change detection.** You must know what changed and say so. (This is usually trivial in WASM where you just ran the mutation.)
- **No type-safe TACO builder in Rust/C** -- you're building JSON. A helper crate/header can add convenience, but there's no compile-time guarantee that your TACO is valid. (bitwrench is lenient -- invalid fields are silently ignored.)
- **No client-side routing from WASM.** The browser-side `bw.router()` exists for JS, but a WASM server would manage navigation via bwserve's `replace` messages.
- **No two-way data binding.** User events come back as structured messages (element ID, event type, value). You update your state and send a patch. This is the expected pattern for a boundary architecture.
- **No animation primitives from WASM.** CSS animations and transitions work (they're in the browser), but you'd define them via `bw.css()` on the JS side or in a stylesheet, not from WASM.

### The mental model

Think of it this way:

- **Your WASM module** is the **application**. It owns state, runs logic, makes decisions.
- **Bitwrench** is the **display server**. It takes rendering commands and presents them to the user.
- **The bwserve protocol** is the **wire format** between them.
- **The browser** is the **display hardware**. It provides pixels, layout, input devices, accessibility.

This separation -- application, window manager, display -- is common in GUI architectures (X11, Wayland, Windows GDI). The adaptation for the web platform is that the wire format is JSON and the display server is a browser tab.

---

**Related:**
- [Thinking in Bitwrench](thinking-in-bitwrench.md) -- core philosophy and TACO patterns
- [bwserve](bwserve.md) -- full protocol reference and server API
- [App Patterns](app-patterns.md) -- five canonical app architectures
- [Embedded Tutorial](tutorial-embedded.md) -- ESP32/Arduino integration (same patterns, C focus)
- [Component Library](component-library.md) -- all BCCL `make*()` factories
- [State Management](state-management.md) -- levels 0-2, pub/sub, handles

*Bitwrench is maintained by [Manu Chatterjee](https://github.com/deftio) (deftio). BSD-2-Clause license.*
