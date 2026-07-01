/**
 * bwserve.h — bwserve protocol helpers for C/C++ embedded systems
 *
 * Part of the bitwrench project: https://github.com/nicktackes/bitwrench
 *
 * Provides macros for composing bwserve protocol messages (mount, patch,
 * append, remove, batch) as r-prefix relaxed JSON strings. These are sent
 * to browsers via SSE (Server-Sent Events).
 *
 * v2.1 protocol fields:
 *   type   — message type (mount, patch, append, remove, batch, message)
 *   ref    — CSS selector for target element
 *   taco   — TACO node object (for mount/append)
 *   text   — text content update (for patch)
 *   attrs  — attribute updates (for patch)
 *   v      — protocol version (always 1)
 *
 * Typical usage on ESP32:
 *   char msg[512];
 *   BW_MOUNT(msg, "#app", taco_buf);
 *   events.send(msg, NULL, millis());  // SSE push
 *
 * All macros produce r-prefixed relaxed JSON:
 *   r{'v':1,'type':'mount','ref':'#app','taco':{'t':'h1','c':'Hello'}}
 *
 * The browser's bw.parseJSONFlex() normalizes this to strict JSON before
 * passing to bw.apply().
 *
 * License: BSD-2-Clause
 * Copyright (c) 2026 Manu Chatterjee / deftio
 */

#ifndef BWSERVE_H
#define BWSERVE_H

#include "bitwrench.h"  /* BW_BUF_SIZE, bw_escape_string */

#ifdef __cplusplus
extern "C" {
#endif

/* ========================================================================
 * Protocol message macros — the 5 bwserve message types (v2.1)
 * ======================================================================== */

/**
 * BW_MOUNT — Mount a TACO node into the target element (replaces children).
 *   char taco[256], msg[512];
 *   BW_TACO(taco, "h1", "Hello");
 *   BW_MOUNT(msg, "#app", taco);
 *   -> r{'v':1,'type':'mount','ref':'#app','taco':r{'t':'h1','c':'Hello'}}
 *
 * Note: `taco_str` should be a pre-composed TACO string (from BW_TACO etc).
 * The r-prefix is on the outer message; the inner TACO doesn't need one.
 */
#define BW_MOUNT(buf, ref, taco_str) \
    snprintf(buf, sizeof(buf), \
        "r{'v':1,'type':'mount','ref':'%s','taco':%s}", ref, taco_str)

/**
 * BW_PATCH — Update text content and/or attributes of target element.
 *   BW_PATCH(msg, "counter", "42")
 *   -> r{'v':1,'type':'patch','ref':'counter','text':'42'}
 */
#define BW_PATCH(buf, ref, text) \
    snprintf(buf, sizeof(buf), \
        "r{'v':1,'type':'patch','ref':'%s','text':'%s'}", ref, text)

/**
 * BW_PATCH_NUM — Patch with a numeric value (no quotes, formatted as %g).
 *   BW_PATCH_NUM(msg, "temperature", 23.5)
 *   -> r{'v':1,'type':'patch','ref':'temperature','text':'23.5'}
 */
#define BW_PATCH_NUM(buf, ref, value) \
    snprintf(buf, sizeof(buf), \
        "r{'v':1,'type':'patch','ref':'%s','text':'%g'}", ref, (double)(value))

/**
 * BW_PATCH_SAFE — Patch with user-provided text that may contain apostrophes.
 * Uses bw_escape_string() to auto-escape single quotes and backslashes.
 *   char name[] = "Barry's Room";
 *   BW_PATCH_SAFE(msg, sizeof(msg), "room-name", name)
 *   -> r{'v':1,'type':'patch','ref':'room-name','text':'Barry\'s Room'}
 */
#define BW_PATCH_SAFE(buf, buf_size, ref, text) \
    do { \
        char _esc[BW_BUF_SIZE]; \
        bw_escape_string(_esc, sizeof(_esc), text); \
        snprintf(buf, buf_size, \
            "r{'v':1,'type':'patch','ref':'%s','text':'%s'}", ref, _esc); \
    } while(0)

/**
 * BW_PATCH_ATTR — Patch with text AND attributes.
 *   BW_PATCH_ATTR(msg, "status", "Online", "'class':'text-success'")
 *   -> r{'v':1,'type':'patch','ref':'status','text':'Online','attrs':{'class':'text-success'}}
 */
#define BW_PATCH_ATTR(buf, ref, text, attr_str) \
    snprintf(buf, sizeof(buf), \
        "r{'v':1,'type':'patch','ref':'%s','text':'%s','attrs':{%s}}", \
        ref, text, attr_str)

/**
 * BW_APPEND — Append a TACO node as child of target element.
 *   BW_APPEND(msg, "#log", taco_str)
 *   -> r{'v':1,'type':'append','ref':'#log','taco':{...}}
 */
#define BW_APPEND(buf, ref, taco_str) \
    snprintf(buf, sizeof(buf), \
        "r{'v':1,'type':'append','ref':'%s','taco':%s}", ref, taco_str)

/**
 * BW_REMOVE — Remove target element from the DOM.
 *   BW_REMOVE(msg, "#old-item")
 *   -> r{'v':1,'type':'remove','ref':'#old-item'}
 */
#define BW_REMOVE(buf, ref) \
    snprintf(buf, sizeof(buf), \
        "r{'v':1,'type':'remove','ref':'%s'}", ref)

/**
 * BW_BATCH — Wrap multiple messages in a batch.
 *   Build the ops array yourself, then:
 *   BW_BATCH(msg, ops_array_str)
 *   -> r{'v':1,'type':'batch','ops':[...]}
 *
 * Helper: use bw_batch_* functions below for easier composition.
 */
#define BW_BATCH(buf, ops_array) \
    snprintf(buf, sizeof(buf), \
        "r{'v':1,'type':'batch','ops':[%s]}", ops_array)

/**
 * BW_MESSAGE — Send a notification/toast to the browser.
 *   BW_MESSAGE(msg, "info", "Sensor calibrated")
 *   -> r{'v':1,'type':'message','level':'info','text':'Sensor calibrated'}
 */
#define BW_MESSAGE(buf, level, text) \
    snprintf(buf, sizeof(buf), \
        "r{'v':1,'type':'message','level':'%s','text':'%s'}", level, text)

/* ── Deprecated v2.0 aliases (remove in v3) ──────────────────────────── */
#define BW_REPLACE(buf, ref, taco_str) BW_MOUNT(buf, ref, taco_str)

/* ========================================================================
 * SSE frame helpers
 *
 * Server-Sent Events require a specific text format:
 *   data: <payload>\n\n
 *
 * These helpers compose complete SSE frames ready to write to a socket.
 * ======================================================================== */

/**
 * BW_SSE_FRAME — Wrap a message as an SSE data frame.
 *   char frame[600];
 *   BW_SSE_FRAME(frame, msg);
 *   write(client_fd, frame, strlen(frame));
 */
#define BW_SSE_FRAME(buf, data) \
    snprintf(buf, sizeof(buf), "data: %s\n\n", data)

/**
 * BW_SSE_KEEPALIVE — SSE keep-alive comment (prevents timeout).
 */
#define BW_SSE_KEEPALIVE ":keepalive\n\n"

/**
 * BW_SSE_HEADERS — HTTP response headers for an SSE endpoint.
 */
#define BW_SSE_HEADERS \
    "HTTP/1.1 200 OK\r\n" \
    "Content-Type: text/event-stream\r\n" \
    "Cache-Control: no-cache\r\n" \
    "Connection: keep-alive\r\n" \
    "Access-Control-Allow-Origin: *\r\n" \
    "\r\n"

/* ========================================================================
 * Bootstrap HTML shell
 *
 * A minimal HTML page that loads bitwrench and connects to the SSE stream.
 * The ESP32 serves this as the homepage. Two options:
 *
 * 1. SELF-CONTAINED: bitwrench.js is inlined (bigger, ~150KB, no extra files)
 * 2. SEPARATE FILES: tiny bootstrap, bitwrench served from /bitwrench.umd.min.js
 * ======================================================================== */

/**
 * BW_BOOTSTRAP_HTML — Minimal bootstrap page (separate file mode).
 * The ESP32 must also serve bitwrench.umd.min.js and bitwrench.css
 * from its flash filesystem.
 */
#define BW_BOOTSTRAP_HTML \
    "<!DOCTYPE html>" \
    "<html><head>" \
    "<meta charset=\"UTF-8\">" \
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" \
    "<title>bwserve</title>" \
    "<script src=\"/bitwrench.umd.min.js\"></script>" \
    "<link rel=\"stylesheet\" href=\"/bitwrench.css\">" \
    "</head><body>" \
    "<div id=\"app\">Connecting...</div>" \
    "<script>" \
    "bw.loadStyles();" \
    "</script>" \
    "</body></html>"

/* ========================================================================
 * Batch builder helpers (C functions, not macros)
 * ======================================================================== */

/**
 * bw_batch_begin — Start building a batch ops string.
 * Call bw_batch_add() for each operation, then bw_batch_end().
 */
typedef struct {
    char ops[BW_BUF_SIZE * 4];  /* accumulated ops */
    int count;
} bw_batch_t;

static inline void bw_batch_begin(bw_batch_t* b) {
    b->ops[0] = '\0';
    b->count = 0;
}

static inline void bw_batch_add(bw_batch_t* b, const char* msg) {
    /* Strip the r prefix from individual messages when batching */
    const char* json = msg;
    if (json[0] == 'r') json++;

    if (b->count > 0) {
        strncat(b->ops, ",", sizeof(b->ops) - strlen(b->ops) - 1);
    }
    strncat(b->ops, json, sizeof(b->ops) - strlen(b->ops) - 1);
    b->count++;
}

static inline int bw_batch_end(char* buf, size_t buf_size, const bw_batch_t* b) {
    return snprintf(buf, buf_size, "r{'v':1,'type':'batch','ops':[%s]}", b->ops);
}

/* ========================================================================
 * HTTP helpers for raw socket servers
 * ======================================================================== */

/**
 * BW_HTTP_RESPONSE — Build a simple HTTP response.
 */
#define BW_HTTP_RESPONSE(buf, status, content_type, body) \
    snprintf(buf, sizeof(buf), \
        "HTTP/1.1 %s\r\n" \
        "Content-Type: %s\r\n" \
        "Content-Length: %d\r\n" \
        "Connection: close\r\n" \
        "\r\n" \
        "%s", \
        status, content_type, (int)strlen(body), body)

#define BW_HTTP_OK_JSON(buf, body) \
    BW_HTTP_RESPONSE(buf, "200 OK", "application/json", body)

#define BW_HTTP_OK_HTML(buf, body) \
    BW_HTTP_RESPONSE(buf, "200 OK", "text/html; charset=UTF-8", body)

#define BW_HTTP_404(buf) \
    BW_HTTP_RESPONSE(buf, "404 Not Found", "text/plain", "Not Found")

#ifdef __cplusplus
}
#endif

/* ========================================================================
 * C++ wrappers
 * ======================================================================== */

#ifdef __cplusplus

#include <string>
#include <vector>

namespace bwserve {

/**
 * mount() — Build a mount protocol message (v2.1).
 *   auto msg = bwserve::mount("#app", bw::taco("h1", "Hello"));
 */
inline std::string mount(const char* ref, const std::string& taco) {
    char buf[BW_BUF_SIZE];
    /* Strip r-prefix from taco if present (will be in outer message) */
    const char* node = taco.c_str();
    if (node[0] == 'r') node++;
    snprintf(buf, sizeof(buf),
        "r{'v':1,'type':'mount','ref':'%s','taco':%s}", ref, node);
    return std::string(buf);
}

/** Deprecated v2.0 alias for mount(). */
inline std::string replace(const char* ref, const std::string& taco) {
    return mount(ref, taco);
}

inline std::string patch(const char* ref, const char* text) {
    char buf[BW_BUF_SIZE];
    BW_PATCH(buf, ref, text);
    return std::string(buf);
}

inline std::string patch_num(const char* ref, double value) {
    char buf[BW_BUF_SIZE];
    BW_PATCH_NUM(buf, ref, value);
    return std::string(buf);
}

inline std::string append(const char* ref, const std::string& taco) {
    char buf[BW_BUF_SIZE];
    const char* node = taco.c_str();
    if (node[0] == 'r') node++;
    snprintf(buf, sizeof(buf),
        "r{'v':1,'type':'append','ref':'%s','taco':%s}", ref, node);
    return std::string(buf);
}

inline std::string remove(const char* ref) {
    char buf[BW_BUF_SIZE];
    BW_REMOVE(buf, ref);
    return std::string(buf);
}

inline std::string message(const char* level, const char* text) {
    char buf[BW_BUF_SIZE];
    BW_MESSAGE(buf, level, text);
    return std::string(buf);
}

/**
 * batch() — Compose multiple messages into a batch.
 *   auto msg = bwserve::batch({
 *     bwserve::patch("temp", "23.5"),
 *     bwserve::patch("humidity", "67%")
 *   });
 */
inline std::string batch(const std::initializer_list<std::string>& ops) {
    std::string result = "r{'v':1,'type':'batch','ops':[";
    bool first = true;
    for (const auto& op : ops) {
        if (!first) result += ",";
        /* Strip r-prefix from individual ops */
        const char* s = op.c_str();
        if (s[0] == 'r') s++;
        result += s;
        first = false;
    }
    result += "]}";
    return result;
}

/**
 * sse_frame() — Wrap a message as an SSE data frame.
 */
inline std::string sse_frame(const std::string& data) {
    return "data: " + data + "\n\n";
}

} /* namespace bwserve */

#endif /* __cplusplus */

#endif /* BWSERVE_H */
