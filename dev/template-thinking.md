# Bitwrench Raw Template Introspection and a Tiny Reactive Template Engine

If Bitwrench receives a **raw template string before evaluation**, then yes — it can extract templated slots, map them for compiler logic, defer evaluation, and even build a tiny direct-DOM reactive layer without needing JSX, a virtual DOM, or a heavyweight compiler.

This document shows:

1. How to extract `${...}` slots from a raw template string
2. How to compile a template into text/slot segments
3. How to render it later with data
4. A small reactive DOM engine in roughly 40 lines that updates only affected bindings

## 1. Extract slots from a raw template

This works when the input is a **string containing template syntax**, not an already-evaluated JavaScript template literal.

```javascript
function getTemplateSlots(template) {
  const slots = {};
  const regex = /\$\{([^}]+)\}/g;

  for (const match of template.matchAll(regex)) {
    const expr = match[1].trim();
    slots[expr] = {
      expr,
      position: match.index
    };
  }

  return slots;
}

const tpl = "my super cool ${thing} with ${color} wheels";
console.log(getTemplateSlots(tpl));
```

Example result:

```javascript
{
  thing: { expr: "thing", position: 14 },
  color: { expr: "color", position: 27 }
}
```

That gives Bitwrench enough information to:

* detect which bindings exist
* note where they appear
* hand them off to later compiler or runtime stages

## 2. Compile the template into segments

Instead of re-parsing the string every time, you can compile it once into text and slot parts.

```javascript
function compileTemplate(template) {
  const parts = [];
  const regex = /\$\{([^}]+)\}/g;
  let last = 0;

  for (const m of template.matchAll(regex)) {
    if (m.index > last) {
      parts.push({ type: "text", value: template.slice(last, m.index) });
    }

    parts.push({ type: "slot", value: m[1].trim() });
    last = m.index + m[0].length;
  }

  if (last < template.length) {
    parts.push({ type: "text", value: template.slice(last) });
  }

  return parts;
}

console.log(compileTemplate("my super cool ${thing} with ${color} wheels"));
```

Example compiled output:

```javascript
[
  { type: "text", value: "my super cool " },
  { type: "slot", value: "thing" },
  { type: "text", value: " with " },
  { type: "slot", value: "color" },
  { type: "text", value: " wheels" }
]
```

## 3. Render the compiled form later

Once compiled, rendering is simple and cheap.

```javascript
function renderTemplate(compiled, data) {
  let out = "";

  for (const part of compiled) {
    if (part.type === "text") out += part.value;
    else out += data[part.value] ?? "";
  }

  return out;
}

const compiled = compileTemplate("my super cool ${thing} with ${color} wheels");
console.log(renderTemplate(compiled, { thing: "bike", color: "red" }));
```

Output:

```javascript
"my super cool bike with red wheels"
```

## 4. Track slot usage as a dictionary

Sometimes you want a binding map instead of a full compiled structure.

```javascript
function slotMap(template) {
  const map = {};
  const regex = /\$\{([^}]+)\}/g;

  for (const m of template.matchAll(regex)) {
    const name = m[1].trim();
    (map[name] ??= []).push(m.index);
  }

  return map;
}

console.log(slotMap("${thing} and ${color} and ${thing}"));
```

Output:

```javascript
{
  thing: [0, 29],
  color: [13]
}
```

That is useful for:

* compiler passes
* dependency tracking
* partial updates
* dev tooling / diagnostics

## 5. Tiny reactive template engine (~40 lines)

This is a small Bitwrench-style direct-DOM approach. It parses `${name}` placeholders in a text template, builds DOM text nodes, and updates only the bound text nodes when state changes.

```javascript
function tinyReactiveTemplate(template, initialState = {}) {
  const bindings = {};
  const state = { ...initialState };
  const frag = document.createDocumentFragment();
  const regex = /\$\{([^}]+)\}/g;
  let last = 0;

  for (const m of template.matchAll(regex)) {
    if (m.index > last) {
      frag.appendChild(document.createTextNode(template.slice(last, m.index)));
    }

    const key = m[1].trim();
    const node = document.createTextNode(state[key] ?? "");
    (bindings[key] ??= []).push(node);
    frag.appendChild(node);
    last = m.index + m[0].length;
  }

  if (last < template.length) {
    frag.appendChild(document.createTextNode(template.slice(last)));
  }

  return {
    fragment: frag,
    state,
    bindings,
    set(key, value) {
      state[key] = value;
      for (const node of bindings[key] ?? []) {
        node.nodeValue = value ?? "";
      }
    },
    setMany(obj) {
      for (const [k, v] of Object.entries(obj)) this.set(k, v);
    }
  };
}
```

## 6. Example usage in the browser

```javascript
const view = tinyReactiveTemplate(
  "my super cool ${thing} with ${color} wheels",
  { thing: "bike", color: "red" }
);

document.body.appendChild(view.fragment);

setTimeout(() => {
  view.set("thing", "scooter");
  view.set("color", "blue");
}, 1000);
```

Behavior:

* initial DOM shows `my super cool bike with red wheels`
* after one second, only the bound text nodes update
* no full rerender
* no diff pass
* no virtual DOM

## 7. Why this fits Bitwrench well

This style matches Bitwrench’s strengths:

* templates are already JavaScript-friendly
* direct DOM access is natural
* components can expose their own methods
* updates can be local instead of whole-tree rerenders
* a raw template can feed compiler logic before execution

In other words, Bitwrench can treat `${...}` not as magic syntax but as a lightweight binding language layered on top of ordinary JavaScript and DOM primitives.

## 8. Important limitation

The tiny engine above assumes slots are simple keys such as:

```javascript
${thing}
${color}
${userName}
```

It does **not** safely evaluate arbitrary expressions like:

```javascript
${user.firstName.toUpperCase()}
${price * qty}
```

You can support expressions later, but then you need to decide whether Bitwrench wants:

* trusted-expression evaluation
* a safer parser
* a compile step that rewrites expressions into accessors

For many UI cases, plain key binding is the cleaner starting point.

## 9. A practical next step for Bitwrench

A very plausible Bitwrench pipeline could be:

```javascript
raw template string
-> slot extraction
-> compiled parts / dependency map
-> direct DOM node creation
-> keyed updates only where data changed
```

That gets you a lot of the ergonomic benefits people associate with JSX frameworks, but with much less machinery and much smaller conceptual overhead.

## 10. Takeaway

If Bitwrench gets the raw template before evaluation, then yes — it can absolutely build a dictionary of slots and use that for compiler logic, deferred rendering, dependency tracking, or tiny reactive updates.

That is one of the nice advantages of your approach: since the template layer is already close to JavaScript and the DOM, you can add just enough structure to get useful binding behavior without dragging in a full framework model.
