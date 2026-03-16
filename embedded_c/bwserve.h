/**
 * bwserve.h — bwserve protocol helpers for C/C++ embedded systems
 *
 * Part of the bitwrench project: https://github.com/nicktackes/bitwrench
 *
 * Provides macros for composing bwserve protocol messages (replace, patch,
 * append, remove, batch) as r-prefix relaxed JSON strings. These are sent
 * to browsers via SSE (Server-Sent Events).
 *
 * Typical usage on ESP32:
 *   char msg[512];
 *   BW_REPLACE(msg, "#app", taco_buf);
 *   events.send(msg, NULL, millis());  // SSE push
 *
 * All macros produce r-prefixed relaxed JSON:
 *   r{'type':'replace','target':'#app','node':{'t':'h1','c':'Hello'}}
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
 * Protocol message macros — the 5 bwserve message types
 * ======================================================================== */

/**
 * BW_REPLACE — Replace target element's content with a TACO node.
 *   char taco[256], msg[512];
 *   BW_TACO(taco, "h1", "Hello");
 *   BW_REPLACE(msg, "#app", taco);
 *   → r{'type':'replace','target':'#app','node':r{'t':'h1','c':'Hello'}}
 *
 * Note: `taco_str` should be a pre-composed TACO string (from BW_TACO etc).
 * The r-prefix is on the outer message; the inner TACO doesn't need one.
 */
#define BW_REPLACE(buf, target, taco_str) \
    snprintf(buf, sizeof(buf), \
        "r{'type':'replace','target':'%s','node':%s}", target, taco_str)

/**
 * BW_PATCH — Update text content and/or attributes of target element.
 *   BW_PATCH(msg, "counter", "42")
 *   → r{'type':'patch','target':'counter','content':'42'}
 */
#define BW_PATCH(buf, target, content) \
    snprintf(buf, sizeof(buf), \
        "r{'type':'patch','target':'%s','content':'%s'}", target, content)

/**
 * BW_PATCH_NUM — Patch with a numeric value (no quotes, formatted as %g).
 *   BW_PATCH_NUM(msg, "temperature", 23.5)
 *   → r{'type':'patch','target':'temperature','content':'23.5'}
 */
#define BW_PATCH_NUM(buf, target, value) \
    snprintf(buf, sizeof(buf), \
        "r{'type':'patch','target':'%s','content':'%g'}", target, (double)(value))

/**
 * BW_PATCH_SAFE — Patch with user-provided content that may contain apostrophes.
 * Uses bw_escape_string() to auto-escape single quotes and backslashes.
 *   char name[] = "Barry's Room";
 *   BW_PATCH_SAFE(msg, sizeof(msg), "room-name", name)
 *   → r{'type':'patch','target':'room-name','content':'Barry\'s Room'}
 */
#define BW_PATCH_SAFE(buf, buf_size, target, content) \
    do { \
        char _esc[BW_BUF_SIZE]; \
        bw_escape_string(_esc, sizeof(_esc), content); \
        snprintf(buf, buf_size, \
            "r{'type':'patch','target':'%s','content':'%s'}", target, _esc); \
    } while(0)

/**
 * BW_PATCH_ATTR — Patch with content AND attributes.
 *   BW_PATCH_ATTR(msg, "status", "Online", "'class':'text-success'")
 *   → r{'type':'patch','target':'status','content':'Online','attr':{'class':'text-success'}}
 */
#define BW_PATCH_ATTR(buf, target, content, attr_str) \
    snprintf(buf, sizeof(buf), \
        "r{'type':'patch','target':'%s','content':'%s','attr':{%s}}", \
        target, content, attr_str)

/**
 * BW_APPEND — Append a TACO node as child of target element.
 *   BW_APPEND(msg, "#log", taco_str)
 *   → r{'type':'append','target':'#log','node':{...}}
 */
#define BW_APPEND(buf, target, taco_str) \
    snprintf(buf, sizeof(buf), \
        "r{'type':'append','target':'%s','node':%s}", target, taco_str)

/**
 * BW_REMOVE — Remove target element from the DOM.
 *   BW_REMOVE(msg, "#old-item")
 *   → r{'type':'remove','target':'#old-item'}
 */
#define BW_REMOVE(buf, target) \
    snprintf(buf, sizeof(buf), \
        "r{'type':'remove','target':'%s'}", target)

/**
 * BW_BATCH — Wrap multiple messages in a batch.
 *   Build the ops array yourself, then:
 *   BW_BATCH(msg, ops_array_str)
 *   → r{'type':'batch','ops':[...]}
 *
 * Helper: use bw_batch_* functions below for easier composition.
 */
#define BW_BATCH(buf, ops_array) \
    snprintf(buf, sizeof(buf), \
        "r{'type':'batch','ops':[%s]}", ops_array)

/**
 * BW_MESSAGE — Send a notification/toast to the browser.
 *   BW_MESSAGE(msg, "info", "Sensor calibrated")
 *   → r{'type':'message','level':'info','text':'Sensor calibrated'}
 */
#define BW_MESSAGE(buf, level, text) \
    snprintf(buf, sizeof(buf), \
        "r{'type':'message','level':'%s','text':'%s'}", level, text)

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
 * 1. SELF-CONTAINED: bitwrench.js is inlined (bigger, ~95KB, no extra files)
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
    "bw.loadDefaultStyles();" \
    /* SSE connection setup omitted — managed by bwclient.js or inline polling */ \
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
    return snprintf(buf, buf_size, "r{'type':'batch','ops':[%s]}", b->ops);
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
 * replace() — Build a replace protocol message.
 *   auto msg = bwserve::replace("#app", bw::taco("h1", "Hello"));
 */
inline std::string replace(const char* target, const std::string& taco) {
    char buf[BW_BUF_SIZE];
    /* Strip r-prefix from taco if present (will be in outer message) */
    const char* node = taco.c_str();
    if (node[0] == 'r') node++;
    snprintf(buf, sizeof(buf),
        "r{'type':'replace','target':'%s','node':%s}", target, node);
    return std::string(buf);
}

inline std::string patch(const char* target, const char* content) {
    char buf[BW_BUF_SIZE];
    BW_PATCH(buf, target, content);
    return std::string(buf);
}

inline std::string patch_num(const char* target, double value) {
    char buf[BW_BUF_SIZE];
    BW_PATCH_NUM(buf, target, value);
    return std::string(buf);
}

inline std::string append(const char* target, const std::string& taco) {
    char buf[BW_BUF_SIZE];
    const char* node = taco.c_str();
    if (node[0] == 'r') node++;
    snprintf(buf, sizeof(buf),
        "r{'type':'append','target':'%s','node':%s}", target, node);
    return std::string(buf);
}

inline std::string remove(const char* target) {
    char buf[BW_BUF_SIZE];
    BW_REMOVE(buf, target);
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
    std::string result = "r{'type':'batch','ops':[";
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
