# Bitwrench Client-Server Protocol Design
2026-03-06

## Status
Discussion document. Not yet implemented. See also `dev/bitwrench-serve-and-protocol.md` for the original design exploration.

## Overview

This document captures design decisions for bitwrench's client-server protocol, covering three scenarios:
1. Embedded device UI (ESP32/Arduino polling)
2. Server-driven "Streamlit-style" UI (bwserve with SSE)
3. Bidirectional chat/editing interfaces

The core idea: **bitwrench acts as a thin browser runtime that renders structured UI data from any source** — embedded devices, Node.js servers, or AI agents.



## Naming Convention

All client-side protocol functions use the `client*` prefix so they group together in API listings and are immediately identifiable as client-server protocol functions.

```javascript
// Client-side (bitwrench.js, runs in browser)
bw.clientConnect(url, opts)   // establish SSE/poll/manual connection, returns conn
bw.clientApply(msg)           // apply a received protocol message to DOM
bw.clientParse(str)           // parse relaxed-format string -> JS object

// Connection object (returned by bw.clientConnect)
conn.sendAction(action)       // POST action to server
conn.close()                  // disconnect
conn.on(event, handler)       // listen: 'open', 'message', 'error', 'close'

// Server-side (separate import from src/serve/, NOT on bw object)
import { createApp } from 'bitwrench/serve';
client.send(msg)              // push raw message via SSE
client.render(target, taco)   // sugar: sends {type:'replace'}
client.patch(id, content)     // sugar: sends {type:'patch'}
client.append(target, taco)   // sugar: sends {type:'append'}
client.remove(target)         // sugar: sends {type:'remove'}
```

Design rationale:
- `bw.clientParse()` instead of `bw.parseJSON()` — avoids confusion with real JSON since it accepts non-standard relaxed format (single quotes, trailing commas)
- `conn.sendAction()` instead of `bw.clientSend()` — the connection object IS the channel, no need to pass it separately
- Server functions live on a separate import, not on `bw` — clean separation between browser runtime and server tooling



## Message Protocol

Five message types. Intentionally minimal.

| Type      | Fields                       | Client maps to                                      |
|-----------|------------------------------|-----------------------------------------------------|
| `replace` | `target`, `node`             | `bw.DOM(target, node)` — replace subtree            |
| `append`  | `target`, `node`             | `target.appendChild(bw.createDOM(node))` — add child|
| `remove`  | `target`                     | `bw.cleanup(target); target.remove()` — delete      |
| `patch`   | `target`, `content`, `attr?` | `bw.patch(target, content)` or `setAttribute()`     |
| `batch`   | `operations[]`               | sequential `bw.clientApply()` per operation          |

All targets are CSS selectors. Server-side sugar (e.g. `client.patch(id, val)`) auto-prepends `#` to bare IDs.

Operations NOT included (use replace/append instead):
- `prepend`, `insertBefore`, `move`, `reorder` — keep vocabulary small, add later only if real use cases demand them



## Scenario 1: Embedded Device (Polling)

For ESP32, Arduino, and other constrained devices. The device serves compact JSON; the browser does all rendering.

### Flow

```
1. Device boots, starts HTTP server on local WiFi
2. Browser navigates to device IP (e.g. 192.168.1.42)

3. Device serves static shell page from flash memory (PROGMEM)
   - Shell is ~20 lines of HTML
   - Loads bitwrench from CDN (or inlined)
   - Has <div id="content">Loading...</div> mount point
   - Calls bw.clientConnect('/bw/ui', {
       transport: 'poll',
       interval: 1000,         // 1 second default
       target: '#content',
       relaxedJson: true
     })

4. bw.clientConnect starts polling loop:
   a. fetch('/bw/ui') every 1 second
   b. Device responds with relaxed TACO JSON (single quotes for C++ ergonomics):
      {'type':'replace','target':'#content','node':{'t':'div','c':'24.5 C'}}
   c. bw.clientParse() converts single quotes -> strict JSON -> JS object
   d. bw.clientApply() dispatches: type:'replace' -> bw.DOM('#content', node)
   e. DOM updated. Repeat from (a).

5. User clicks a button (data-bw-action="toggle-led")
   a. conn.sendAction({ action: 'toggle-led' })
   b. POST /bw/action with JSON body
   c. Device handles POST, toggles LED
   d. Device responds with IMMEDIATE update payload (not just {"ok":true})
      - This gives instant feedback without waiting for next poll cycle
   e. bw.clientApply() processes the response
   f. Next poll cycle picks up any other changes
```

### Immediate POST Response

Key optimization: when the client POSTs an action, the server responds with the update payload directly. This gives sub-100ms feedback on button presses while keeping the 1s poll for background changes.

```
Passive updates:  poll every 1s -> server returns current state
Active feedback:  POST action -> server returns immediate update in POST response
```

### Relaxed JSON Format

For firmware ergonomics. C++ string building with strict JSON is painful:
```cpp
// Strict JSON in C++ -- escape hell
"{\"t\":\"div\",\"c\":\"hello\"}"

// Relaxed format -- single quotes, no escaping
"{'t':'div','c':'hello'}"
```

`bw.clientParse()` converts relaxed format to strict JSON via a character-by-character state machine. Handles:
- Single-quoted keys and values
- Escaped quotes inside strings
- Apostrophes in values (e.g. `'it\'s warm'`)
- Trailing commas
- Fast-path: tries JSON.parse() first, only relaxes on failure

Does NOT handle (by design): unquoted keys, comments, multiline strings.

### Example Arduino/ESP32 Sketch

```cpp
#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";

WebServer server(80);

// Shell page stored in flash memory.
// Loads bitwrench from CDN and starts polling /bw/ui every 1 second.
// The entire shell is static -- all dynamic content comes from /bw/ui.
const char SHELL_PAGE[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ESP32 Sensor</title>
  <script src="https://cdn.jsdelivr.net/npm/bitwrench@2/dist/bitwrench.umd.min.js"></script>
</head>
<body>
  <div id="content">Loading...</div>
  <script>
    // Initialize bitwrench default styles (Bootstrap-like CSS)
    bw.loadDefaultStyles();

    // Connect to device using polling transport.
    // relaxedJson:true tells bw.clientParse() to accept single-quoted JSON
    // from the firmware, which is much easier to build in C/C++.
    var conn = bw.clientConnect('/bw/ui', {
      transport: 'poll',
      interval: 1000,
      target: '#content',
      relaxedJson: true
    });
  </script>
</body>
</html>
)rawliteral";

// Serve the static shell page.
// This page is cached by the browser and rarely changes.
void handleRoot() {
  server.send(200, "text/html", SHELL_PAGE);
}

// Return current sensor data as a TACO UI tree.
// The browser polls this endpoint every 1 second and renders the result.
// Note: single quotes throughout -- no C++ escaping needed!
void handleUI() {
  float temp = temperatureRead();     // ESP32 internal temp sensor
  int freeHeap = ESP.getFreeHeap();
  unsigned long uptime = millis() / 1000;

  // Build relaxed TACO JSON using single quotes.
  // bw.clientParse() on the browser side converts this to strict JSON.
  String json = "{'type':'replace','target':'#content','node':"
    "{'t':'div','a':{'class':'bw-container'},'c':["
      "{'t':'h2','c':'ESP32 Dashboard'},"

      // Temperature card
      "{'t':'div','a':{'class':'bw-card'},'c':["
        "{'t':'div','a':{'class':'bw-card-body'},'c':["
          "{'t':'h3','c':'Temperature'},"
          "{'t':'p','a':{'id':'temp'},'c':'" + String(temp, 1) + " C'}"
        "]}"
      "]},"

      // System info card
      "{'t':'div','a':{'class':'bw-card'},'c':["
        "{'t':'div','a':{'class':'bw-card-body'},'c':["
          "{'t':'h3','c':'System'},"
          "{'t':'p','c':'Heap: " + String(freeHeap) + " bytes'},"
          "{'t':'p','c':'Uptime: " + String(uptime) + " sec'}"
        "]}"
      "]},"

      // LED toggle button.
      // data-bw-action tells the client to POST to /bw/action when clicked.
      "{'t':'button','a':{'class':'bw-btn bw-btn-primary',"
        "'data-bw-action':'toggle-led'},'c':'Toggle LED'}"

    "]}}"
  ;

  server.send(200, "application/json", json);
}

// Handle button presses from the browser.
// Receives JSON: { "action": "toggle-led", "data": {} }
// Returns an immediate update payload so the UI responds instantly.
void handleAction() {
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    // In a real app: parse body, perform action, build response
    // For now: just toggle the built-in LED
    digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));

    // Respond with immediate UI update -- don't make the user wait for next poll
    String state = digitalRead(LED_BUILTIN) ? "ON" : "OFF";
    String response = "{'type':'patch','target':'#led-status','content':'" + state + "'}";
    server.send(200, "application/json", response);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
  Serial.println(WiFi.localIP());

  server.on("/", handleRoot);
  server.on("/bw/ui", handleUI);
  server.on("/bw/action", HTTP_POST, handleAction);
  server.begin();
}

void loop() {
  server.handleClient();
}
```



## Scenario 2: bwserve "Streamlit Style" (SSE)

For Node.js developers who want to build interactive UIs without a frontend framework. The server generates the UI; the browser is just a renderer.

### Flow

```
1. Developer writes a Node.js script (e.g. demo-dashboard.js):
   - import { createApp } from 'bitwrench/serve'
   - app.onConnect(client => { client.render('#content', tacoTree) })
   - app.onAction('refresh', (client, data) => { client.patch('temp', '25 C') })
   - app.onInterval(2000, clients => { clients.patch('clock', timeString) })
   - app.start()

2. Developer runs: node demo-dashboard.js

3. Server starts on port 3000, generates shell page:
   - bitwrench UMD inlined (no CDN dependency, works offline)
   - bw.loadDefaultStyles() + optional bw.generateTheme()
   - <div id="content">Connecting...</div>
   - bw.clientConnect('/bw/events', { transport:'sse', actionUrl:'/bw/action' })

4. Browser navigates to localhost:3000
   a. GET / -> server returns shell page
   b. Browser loads bitwrench, calls bw.clientConnect()
   c. bw.clientConnect opens EventSource to /bw/events (SSE)
   d. Server fires onConnect handler for this client
   e. Handler calls client.render('#content', tacoTree)
   f. Server writes to SSE stream:
      data: {"type":"replace","target":"#content","node":{...}}
   g. Browser receives SSE event -> JSON.parse -> bw.clientApply() -> bw.DOM()
   h. Page renders

5. Every 2 seconds, server's onInterval fires:
   a. clients.patch('clock', '3:42:15 PM')
   b. Broadcasts SSE message to ALL connected browsers
   c. Each browser: bw.clientApply() -> bw.patch('clock', '3:42:15 PM')
   d. Just the clock text node updates -- no full re-render

6. User clicks button (data-bw-action="refresh"):
   a. conn.sendAction({ action:'refresh' })
   b. POST /bw/action -> server routes to onAction('refresh') handler
   c. Handler calls client.patch('temp', '25 C')
   d. Patch sent via SSE stream (NOT in POST response)
   e. Browser receives SSE event -> bw.clientApply() -> DOM updated

7. If server dies and restarts:
   a. EventSource auto-reconnects (built into browser spec)
   b. onConnect fires again -> full fresh render
   c. User sees clean state, no stale data. Correct by design.
```

### Example bwserve App

```javascript
// examples/serve/demo-dashboard.js
//
// A sensor dashboard that pushes live updates to the browser.
// Run with: node examples/serve/demo-dashboard.js
// Open: http://localhost:3000

import { createApp } from '../../src/serve/bwserve.js';

// Create the app. Theme is optional -- generates palette-driven CSS.
const app = createApp({
  port: 3000,
  title: 'Sensor Dashboard',
  theme: 'ocean'
});

// Simulated sensor readings.
// In a real app this would read from hardware, a database, or an API.
function readSensors() {
  return {
    temperature: (20 + Math.random() * 10).toFixed(1) + ' C',
    humidity: (40 + Math.random() * 20).toFixed(0) + '%',
    pressure: (1010 + Math.random() * 20).toFixed(0) + ' hPa'
  };
}

// onConnect fires once per new browser connection.
// This is where you build the initial page UI as a TACO tree.
// The client object wraps one SSE stream -- calling client.render()
// sends a {type:'replace'} message through that stream.
app.onConnect(function(client) {
  var sensors = readSensors();

  // Send the full page structure.
  // Every element that will be updated later gets an id attribute.
  client.render('#content', {
    t: 'div', a: { class: 'bw-container' }, c: [
      { t: 'h1', c: 'Sensor Dashboard' },

      // Sensor cards -- each value element has an id for patching
      { t: 'div', a: { class: 'bw-row' }, c: [
        { t: 'div', a: { class: 'bw-col' }, c: [
          { t: 'div', a: { class: 'bw-card' }, c: [
            { t: 'div', a: { class: 'bw-card-body' }, c: [
              { t: 'h3', c: 'Temperature' },
              { t: 'p', a: { id: 'temp' }, c: sensors.temperature }
            ]}
          ]}
        ]},
        { t: 'div', a: { class: 'bw-col' }, c: [
          { t: 'div', a: { class: 'bw-card' }, c: [
            { t: 'div', a: { class: 'bw-card-body' }, c: [
              { t: 'h3', c: 'Humidity' },
              { t: 'p', a: { id: 'humid' }, c: sensors.humidity }
            ]}
          ]}
        ]},
        { t: 'div', a: { class: 'bw-col' }, c: [
          { t: 'div', a: { class: 'bw-card' }, c: [
            { t: 'div', a: { class: 'bw-card-body' }, c: [
              { t: 'h3', c: 'Pressure' },
              { t: 'p', a: { id: 'pressure' }, c: sensors.pressure }
            ]}
          ]}
        ]}
      ]},

      // Manual refresh button.
      // data-bw-action tells the shell to POST { action:'refresh' }
      // when clicked. The server handles it in onAction below.
      { t: 'button', a: {
        class: 'bw-btn bw-btn-primary',
        'data-bw-action': 'refresh'
      }, c: 'Refresh Now' },

      // Clock -- updated every second by onInterval
      { t: 'p', a: { id: 'clock' }, c: new Date().toLocaleTimeString() }
    ]
  });
});

// onAction handles button clicks from the browser.
// The action name matches the data-bw-action attribute value.
// client is the specific SSE connection that sent the action.
app.onAction('refresh', function(client, data) {
  var sensors = readSensors();

  // Patch all three values at once.
  // patchAll sends a {type:'batch'} message with individual patches.
  client.patchAll({
    'temp': sensors.temperature,
    'humid': sensors.humidity,
    'pressure': sensors.pressure
  });
});

// onInterval broadcasts to ALL connected browsers.
// Use this for data that changes independently of user action.
// The 'clients' parameter (plural) is a broadcast handle.
app.onInterval(1000, function(clients) {
  clients.patch('clock', new Date().toLocaleTimeString());
});

// Start listening. Shell page is auto-generated and served at GET /.
app.start();
```



## Scenario 3: Chat Interface (Bidirectional, Editable)

Tests append, replace, and remove message types. Users can send, edit, and delete messages.

### Flow

```
1. Server creates chat UI:
   - Chat container: <div id="chat"></div>
   - Input form with data-bw-action="send-message"
   - Each message gets a bw_uuid so it's individually addressable

2. User sends a message:
   a. conn.sendAction({ action:'send-message', data:{ text:'hello' } })
   b. Server handler:
      - Generates uuid for the message
      - client.append('#chat', { t:'div', a:{id:uuid, class:'msg user'}, c:'hello' })
      - Generates bot response
      - client.append('#chat', { t:'div', a:{id:uuid2, class:'msg bot'}, c:'Hi!' })
   c. Two SSE append events -> two new children in #chat
   d. Scroll position preserved (append doesn't replace existing content)

3. User edits a message:
   a. conn.sendAction({ action:'edit-message', data:{ id:uuid, text:'hello world' } })
   b. Server handler:
      - client.render('#' + uuid, { t:'div', a:{id:uuid, class:'msg user edited'}, c:'hello world' })
   c. SSE replace event -> just that one message node is replaced
   d. All other messages untouched

4. User deletes a message:
   a. conn.sendAction({ action:'delete-message', data:{ id:uuid } })
   b. Server handler:
      - client.remove('#' + uuid)
   c. SSE remove event -> bw.cleanup() fires, element removed

5. Server pushes notifications unprompted:
   a. onInterval(30000, clients => { clients.append('#chat', notification) })
```

### Message Types Exercised

| Action         | Message type | Description                          |
|----------------|-------------|--------------------------------------|
| Send message   | `append`    | New msg node appended to #chat       |
| Edit message   | `replace`   | Swap msg node by uuid                |
| Delete message | `remove`    | Remove msg node by uuid              |
| Status update  | `patch`     | Update timestamp, read receipt, etc. |
| Bot typing     | `append`    | Add typing indicator, then `replace` |

### Example Chat Server

```javascript
// examples/serve/demo-chat.js
//
// A chat interface demonstrating bidirectional communication.
// Messages can be sent, edited, and deleted.
// Run with: node examples/serve/demo-chat.js
// Open: http://localhost:3000

import { createApp } from '../../src/serve/bwserve.js';

const app = createApp({ port: 3000, title: 'Chat Demo' });

// In-memory message store.
// In a real app this would be a database.
var messages = [];
var nextId = 1;

// Build the initial chat UI.
// The chat container is empty -- messages are appended dynamically.
app.onConnect(function(client) {
  client.render('#content', {
    t: 'div', a: { class: 'bw-container' }, c: [
      { t: 'h2', c: 'Chat' },

      // Message container -- messages will be appended here.
      // Starts empty; each message gets its own uuid for addressing.
      { t: 'div', a: { id: 'chat', style: 'max-height:400px;overflow-y:auto' }, c: '' },

      // Input area.
      // data-bw-action on the button triggers a POST to /bw/action.
      // The shell page collects sibling input values into action.data.
      { t: 'div', a: { style: 'display:flex;gap:8px;margin-top:8px' }, c: [
        { t: 'input', a: {
          id: 'msg-input',
          type: 'text',
          class: 'bw-form-control',
          placeholder: 'Type a message...',
          style: 'flex:1'
        }},
        { t: 'button', a: {
          class: 'bw-btn bw-btn-primary',
          'data-bw-action': 'send-message',
          'data-input': 'msg-input'
        }, c: 'Send' }
      ]}
    ]
  });

  // Send any existing messages to the newly connected client
  messages.forEach(function(m) {
    client.append('#chat', makeMsgNode(m));
  });
});

// Helper: create a TACO node for a message.
// Each message gets a unique id so it can be individually edited or deleted.
function makeMsgNode(msg) {
  return {
    t: 'div',
    a: {
      id: msg.id,
      class: 'msg ' + msg.role + (msg.edited ? ' edited' : ''),
      style: 'padding:8px;margin:4px 0;border-radius:4px;background:' +
        (msg.role === 'user' ? '#e3f2fd' : '#f5f5f5')
    },
    c: [
      { t: 'span', c: msg.text },
      { t: 'small', a: { style: 'float:right;opacity:0.5' },
        c: msg.time + (msg.edited ? ' (edited)' : '') }
    ]
  };
}

// Handle new messages from the user.
app.onAction('send-message', function(client, data) {
  if (!data.text || !data.text.trim()) return;

  // Store and broadcast user message
  var userMsg = {
    id: 'msg-' + (nextId++),
    role: 'user',
    text: data.text.trim(),
    time: new Date().toLocaleTimeString(),
    edited: false
  };
  messages.push(userMsg);
  client.append('#chat', makeMsgNode(userMsg));

  // Simulate bot response after a short delay
  setTimeout(function() {
    var botMsg = {
      id: 'msg-' + (nextId++),
      role: 'bot',
      text: 'You said: "' + userMsg.text + '"',
      time: new Date().toLocaleTimeString(),
      edited: false
    };
    messages.push(botMsg);
    client.append('#chat', makeMsgNode(botMsg));
  }, 500);
});

// Handle message edits.
// The client sends the message id and new text.
// Server replaces just that one message node.
app.onAction('edit-message', function(client, data) {
  var msg = messages.find(function(m) { return m.id === data.id; });
  if (!msg) return;

  msg.text = data.text;
  msg.edited = true;

  // Replace the single message node by its id.
  // All other messages in #chat are untouched.
  client.render('#' + msg.id, makeMsgNode(msg));
});

// Handle message deletion.
// Server removes the node and cleans up.
app.onAction('delete-message', function(client, data) {
  messages = messages.filter(function(m) { return m.id !== data.id; });

  // Remove the single message node.
  // bw.cleanup() fires on the client side before removal.
  client.remove('#' + data.id);
});

app.start();
```



## Event Handlers Over the Wire

### The Problem

JSON cannot carry JavaScript functions. A TACO like `{ t:'button', o:{ mounted: function(el){...} } }` can't be serialized. But server-driven UI needs interactivity beyond simple button clicks.

### Solution: Two Layers

**Layer 1: JSON messages for data (SSE/polling)**

Simple actions use `data-bw-action` attributes. The client auto-wires click handlers:

```javascript
// Server sends this TACO (JSON-safe, no functions):
{ t: 'button',
  a: { 'data-bw-action': 'refresh', class: 'bw-btn' },
  c: 'Refresh' }

// Client shell auto-wires: on click -> conn.sendAction({ action:'refresh' })
```

For richer interactivity, a declarative events map describes what to do without sending functions:

```javascript
// Server sends TACO with declarative event bindings:
{ t: 'input',
  a: { id: 'search', class: 'bw-form-control' },
  o: { events: {
    input: { action: 'search', debounce: 300, sendValue: true },
    keydown: { action: 'search-key', sendKey: true, filter: 'Enter' }
  }}}

// Client interprets the events map and auto-wires real DOM listeners:
// - On input: debounce 300ms, then conn.sendAction({ action:'search', data:{ value: el.value } })
// - On keydown Enter: conn.sendAction({ action:'search-key', data:{ key:'Enter' } })
```

No functions over the wire. The client knows how to wire common event patterns from a declarative spec.

**Layer 2: JS module import for full behavior (initial page load / structural changes)**

When you need real JavaScript — closures, complex event handlers, custom logic — the server serves a `.js` module instead of JSON:

```javascript
// Server endpoint: GET /bw/page.js (actual JavaScript, not JSON)
// This is a real TACO with real functions -- full generality.
export default {
  t: 'div', c: [
    { t: 'input',
      a: { id: 'search', class: 'bw-form-control', placeholder: 'Search...' },
      o: {
        // Real mounted handler with closures, timers, fetch calls.
        // This is actual JavaScript, not a serialized string.
        mounted: function(el) {
          var timer = null;
          el.addEventListener('input', function(e) {
            clearTimeout(timer);
            timer = setTimeout(function() {
              fetch('/api/search?q=' + encodeURIComponent(e.target.value))
                .then(function(r) { return r.json(); })
                .then(function(data) {
                  // Full bitwrench rendering from within the handler
                  bw.DOM('#results', {
                    t: 'ul', c: data.map(function(item) {
                      return { t: 'li', c: item.name };
                    })
                  });
                });
            }, 300);
          });
        }
      }
    },
    { t: 'div', a: { id: 'results' }, c: 'Type to search...' }
  ]
};
```

Client loads it via dynamic import:

```javascript
// Shell page or bw.clientApply handler for 'module' message type:
var mod = await import('/bw/page.js');
bw.DOM('#content', mod.default);
```

### When to Use Each Layer

| Need                          | Use               | Transport      |
|-------------------------------|-------------------|----------------|
| Button clicks                 | `data-bw-action`  | JSON over SSE  |
| Input/change/keydown          | `o.events` map    | JSON over SSE  |
| Complex handlers, closures    | JS module import  | HTTP GET .js   |
| Value updates (temp, clock)   | `patch` message   | JSON over SSE  |
| Structural UI changes         | `replace` message | JSON over SSE  |
| Structural + new behavior     | `module` reference| HTTP GET .js   |

### Module Message Type (Extension)

For structural UI changes that also need new behavior:

```javascript
// Server sends via SSE:
{ type: 'module', target: '#panel', src: '/bw/panel-v2.js' }

// Client handles:
// 1. Fetches and imports /bw/panel-v2.js
// 2. Gets the default export (a TACO with real functions)
// 3. Calls bw.DOM('#panel', module.default)
```

This keeps the initial page load fast (one module import), enables live updates via JSON patches, and allows the server to swap in entirely new UI sections with full JS behavior when needed.

### Embedded Devices and JS Modules

Embedded devices (ESP32, Arduino) cannot serve JS modules — they stick with JSON + `data-bw-action` + declarative events. This is fine because embedded UI is typically simple (sensor values, toggle switches, status indicators).



## Performance: UUID Node Map

All client-side protocol dispatch (`bw.clientApply`) resolves targets via CSS selectors. For uuid-addressed elements (the common case in server-driven UI), bitwrench maintains a live hash map for O(1) lookup instead of DOM traversal.

This optimization is being implemented as a standalone improvement to core bitwrench (benefits all code, not just client-server). See the uuid → node ref discussion in separate work.



## Relationship to bw-stream Protocol

The `dev/bw-stream-agent-protocol-draft-2026-03-06.md` document proposes a higher-level protocol layered on top of this implementation. Key additions from bw-stream:

- **Surfaces**: Named UI regions (`main`, `sidebar`, `chat`) as controlled entry points for rendering. In bw-client-server these map to DOM elements (`#main`, `#sidebar`, `#chat`). Surfaces add a safety boundary — agents can only render into declared regions.
- **`o` metadata channel**: The TACO `o` field can carry non-rendering metadata like `{ intent: 'display_sensor', component: 'Card', confidence: 0.87 }`. This flows through the system without affecting rendering but enables AI reasoning, policy filtering, and component catalog hints.
- **Policy layer**: An optional filter between message receipt and rendering that can restrict allowed tags, attributes, surfaces, and components. Important for agent-generated UI where you want to sandbox what the AI can produce.
- **`op` vs `type`**: bw-stream uses `op` (render/replace/append/patch/remove) while bw-client-server uses `type`. These should be reconciled when the protocols merge — likely standardize on `op`.
- **`render` operation**: bw-stream adds a `render` op distinct from `replace` — it targets a surface by name rather than a CSS selector. Maps to `bw.DOM('#' + surfaceId, node)`.

The bw-client-server protocol (this document) is the implementation layer. bw-stream is the conceptual protocol spec that can work across renderers. When we build bwserve, the implementation will follow bw-client-server's API while being compatible with bw-stream's message format.



## Transport Summary

| Transport | Direction       | Use Case        | Format         |
|-----------|-----------------|-----------------|----------------|
| SSE       | Server -> Client| bwserve push    | Strict JSON    |
| POST      | Client -> Server| User actions    | Strict JSON    |
| Polling   | Client <- Server| Embedded device | Relaxed JSON   |
| POST      | Client -> Device| Device actions  | Strict JSON    |
| import()  | Client <- Server| JS modules      | JavaScript     |

All server-to-client messages (SSE, poll, module) converge on `bw.clientApply()`.
All client-to-server messages go through `conn.sendAction()`.



## Deferred (Future Work)

- WebSocket transport (`transport: 'ws'`)
- `bitwrench serve` CLI subcommand
- Client session identification (multi-client action routing)
- Form value auto-collection from `data-bw-action` buttons
- Component vocabulary expansion (`{ component:'card', title:'...' }`)
- Agent protocol adapters (AG-UI compatibility)
- Production hardening (rate limiting, CORS, auth, keep-alive)
