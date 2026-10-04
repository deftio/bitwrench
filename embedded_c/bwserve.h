/**
 * bwserve.h — bwserve protocol helpers for C/C++ embedded systems
 *
 * Part of the bitwrench project: https://github.com/deftio/bitwrench
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
 * Its leading `r` is dropped when nested (BW_SKIP_R): the prefix is only valid
 * at the start of a message, and `'taco':r{...}` does not parse.
 * The r-prefix is on the outer message; the inner TACO doesn't need one.
 */
/* BW_SKIP_R lives in bitwrench.h: nesting is a TACO concern, and the
 * composition macros there need it for the same reason these do. */

#define BW_MOUNT(buf, ref, taco_str) \
    snprintf(buf, sizeof(buf), \
        "r{'v':1,'type':'mount','ref':'%s','taco':%s}", ref, BW_SKIP_R(taco_str))

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
        "r{'v':1,'type':'append','ref':'%s','taco':%s}", ref, BW_SKIP_R(taco_str))

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
 * BW_MESSAGE — Send a notification to the browser.
 *   BW_MESSAGE(msg, "info", "Sensor calibrated")
 *   -> r{'v':1,'type':'message','level':'info','text':'Sensor calibrated'}
 *
 * bitwrench publishes this on the `bw:message` topic rather than rendering it:
 * where a notification belongs and how long it lives is the page's decision.
 * The page opts in with one line --
 *
 *   bw.sub('bw:message', function(m) { bw.patch('status', m.text); });
 *
 * -- or routes it to bw.makeToast() for a toast. Before 2.1.11 the client
 * rejected this message type outright, so a device's notifications went
 * nowhere.
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
 * A minimal page for a board that serves bitwrench and its CSS as files from a
 * filesystem (SPIFFS/LittleFS). It predates bitwrench_embedded.h and is kept
 * for projects already built that way.
 * ======================================================================== */

/**
 * BW_BOOTSTRAP_HTML — a script tag, a stylesheet link and bw.loadStyles().
 *
 * It does NOT connect to anything: no bw.connect(), no bw.actions.enable(), no
 * EventSource. A page built from this renders nothing on its own and cannot
 * send a bw_act_* click back.
 *
 * It also expects /bitwrench.umd.min.js and /bitwrench.css to exist as files,
 * which means a filesystem partition. If you want the flash-array route
 * instead (no filesystem), serve bitwrench_embedded.h at /bitwrench.js and
 * write the four-line page yourself -- see "Write Your First Program" in
 * embedded_c/README.md. That is the shape the examples use, and a per-stack
 * replacement for this macro is planned for 2.1.12.
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

/* These build with std::string, not a fixed buffer.
 *
 * The C macros take a caller-supplied buffer, so the caller sizes it. These
 * took BW_BUF_SIZE (512 bytes by default) internally, which meant a UI
 * composed with the unbounded bw::nest() helpers was silently truncated on its
 * way into the message -- producing a frame that could not be parsed, with no
 * error anywhere. A target running C++ has a heap; use it. */

/**
 * mount() — Build a mount protocol message (v2.1).
 *   auto msg = bwserve::mount("#app", bw::taco("h1", "Hello"));
 */
inline std::string mount(const char* ref, const std::string& taco) {
    return std::string("r{'v':1,'type':'mount','ref':'") + ref +
           "','taco':" + bw::inner(taco) + "}";
}

/** Deprecated v2.0 alias for mount(). */
inline std::string replace(const char* ref, const std::string& taco) {
    return mount(ref, taco);
}

inline std::string patch(const char* ref, const char* text) {
    return std::string("r{'v':1,'type':'patch','ref':'") + ref +
           "','text':'" + text + "'}";
}

inline std::string patch_num(const char* ref, double value) {
    char num[32];                      /* bounded: it is one %g */
    snprintf(num, sizeof(num), "%g", value);
    return std::string("r{'v':1,'type':'patch','ref':'") + ref +
           "','text':'" + num + "'}";
}

/**
 * patch_attr() — text and attributes in one op, for when a value and its
 * styling change together (a reading going out of range, a state badge).
 * Still cheaper than replacing the node: nothing unmounts.
 *
 *   bwserve::patch_attr("temp", "41.2 C", "'class':'bw_text_danger'")
 */
inline std::string patch_attr(const char* ref, const char* text, const std::string& attrs) {
    return std::string("r{'v':1,'type':'patch','ref':'") + ref +
           "','text':'" + text + "','attrs':{" + attrs + "}}";
}

inline std::string append(const char* ref, const std::string& taco) {
    return std::string("r{'v':1,'type':'append','ref':'") + ref +
           "','taco':" + bw::inner(taco) + "}";
}

inline std::string remove(const char* ref) {
    return std::string("r{'v':1,'type':'remove','ref':'") + ref + "'}";
}

/**
 * message() — a notification for the browser.
 *
 * The page receives it on the `bw:message` topic and decides what to do with
 * it (a toast, a status line, a log); bitwrench does not render it for you:
 *
 *   bw.sub('bw:message', function(m) { bw.patch('status', m.text); });
 */
inline std::string message(const char* level, const char* text) {
    return std::string("r{'v':1,'type':'message','level':'") + level +
           "','text':'" + text + "'}";
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
 * batch() over a vector — when the number of changed values is not known
 * until the device has read them. One frame, one reflow, however many ops.
 */
inline std::string batch(const std::vector<std::string>& ops) {
    std::string result = "r{'v':1,'type':'batch','ops':[";
    for (size_t i = 0; i < ops.size(); i++) {
        if (i) result += ",";
        const char* s = ops[i].c_str();
        if (s[0] == 'r') s++;
        result += s;
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

/* =========================================================================
 * Inbound: actions from the browser
 *
 * Everything above pushes UI out. These two helpers cover what comes back,
 * which every firmware project was otherwise writing by hand.
 *
 * A button rendered with class "bw_act_save" posts back to the device. There
 * are two client implementations and they use different URLs and bodies.
 * bw_parse_action() reads either, without a JSON parser: it scans for the keys,
 * accepts both "double" and 'single' quotes (the relaxed form bitwrench sends),
 * and never allocates.
 *
 * 1. bitwrench core -- the page calls bw.actions.enable() and
 *    bw.connect('/bw/events'). This is what the examples in this repo use.
 *      POST /bw/events                 (the same URL as the SSE stream)
 *      {"v":1,"type":"event","action":"save","value":"7","name":"qty"}
 *    Fields are top-level.
 *
 * 2. the bwserve thin client (bwclient.js, served by the bwserve shell):
 *      POST /bw/return/action/<clientId>
 *      {"requestId":null,"route":"action","result":{"action":"save","data":{...}}}
 *    Fields sit inside `data`.
 *
 * bw_action_field() looks inside `data` when there is one and falls back to the
 * whole body when there is not, so firmware needs one code path.
 *
 * Note: bw.actions is off until the page calls bw.actions.enable().
 * bw.connect() does not enable it.
 * ========================================================================= */

#define BW_ACTION_NAME_MAX 32

typedef struct {
    char action[BW_ACTION_NAME_MAX]; /* "save"  (empty when not found)      */
    const char *data;                /* points into body at the data object */
    int data_len;                    /* 0 when the message carried no data  */
    const char *body;                /* the whole post-back, for top-level  */
    int body_len;                    /*   fields (bw.actions event shape)   */
} bw_action_t;

/* Find "key" or 'key' followed by ':' and return the first char after it. */
static inline const char *bw_find_value(const char *body, const char *key) {
    size_t klen = strlen(key);
    const char *p = body;
    if (!body || !*body) return 0;
    while (*p) {
        if ((*p == '"' || *p == '\'') && strncmp(p + 1, key, klen) == 0) {
            const char *q = p + 1 + klen;
            if (*q != '"' && *q != '\'') { p++; continue; }
            q++;
            while (*q == ' ') q++;
            if (*q != ':') { p++; continue; }
            q++;
            while (*q == ' ') q++;
            return q;
        }
        p++;
    }
    return 0;
}

/**
 * bw_parse_action() — pull the action name and data object out of a post-back.
 *
 * Returns 1 when an action name was found, 0 otherwise. `out->data` points
 * into `body` (no copy), so it is valid as long as the body buffer is.
 *
 *   bw_action_t act;
 *   if (bw_parse_action(body, &act)) {
 *       if (strcmp(act.action, "gpio-toggle") == 0) toggle_pin(act.data);
 *   }
 */
static inline int bw_parse_action(const char *body, bw_action_t *out) {
    const char *v;
    int i = 0;
    char quote;
    if (!out) return 0;
    out->action[0] = '\0';
    out->data = 0;
    out->data_len = 0;
    out->body = body;
    out->body_len = body ? (int)strlen(body) : 0;
    if (!body) return 0;

    v = bw_find_value(body, "action");
    if (v && (*v == '"' || *v == '\'')) {
        quote = *v++;
        while (*v && *v != quote && i < BW_ACTION_NAME_MAX - 1) out->action[i++] = *v++;
    }
    out->action[i] = '\0';

    v = bw_find_value(body, "data");
    if (v && *v == '{') {
        int depth = 0;
        const char *start = v;
        while (*v) {
            if (*v == '{') depth++;
            else if (*v == '}') { depth--; if (!depth) { v++; break; } }
            v++;
        }
        out->data = start;
        out->data_len = (int)(v - start);
    }
    return out->action[0] ? 1 : 0;
}

/**
 * bw_action_field() — read one string or number field out of act.data, or out
 * of the whole post-back when the message carried no data object.
 *
 * Copies into `buf` and returns 1 on success. Keeps firmware free of a JSON
 * dependency for the common case of one value per action.
 *
 *   char pin[8];
 *   bw_action_field(&act, "pin", pin, sizeof pin);
 */
static inline int bw_action_field(const bw_action_t *act, const char *key,
                                  char *buf, int buf_size) {
    char scratch[256];
    const char *v;
    int n, i = 0;
    if (!act || !buf || buf_size < 2) return 0;
    if (act->data) {
        /* `data` points into the body, so it has to be cut out and terminated.
         * A data object larger than scratch is truncated; one field per action
         * is the case this exists for. */
        n = act->data_len < (int)sizeof(scratch) - 1 ? act->data_len : (int)sizeof(scratch) - 1;
        memcpy(scratch, act->data, (size_t)n);
        scratch[n] = '\0';
        v = bw_find_value(scratch, key);
    } else if (act->body) {
        /* No data object: the bw.actions event shape, fields at top level.
         * The body is already terminated, so scan it in place -- no limit. */
        v = bw_find_value(act->body, key);
    } else {
        buf[0] = '\0';
        return 0;
    }
    if (!v) { buf[0] = '\0'; return 0; }
    if (*v == '"' || *v == '\'') {
        char quote = *v++;
        while (*v && *v != quote && i < buf_size - 1) buf[i++] = *v++;
    } else {
        while (*v && *v != ',' && *v != '}' && *v != ' ' && i < buf_size - 1) buf[i++] = *v++;
    }
    buf[i] = '\0';
    return i > 0;
}

/* =========================================================================
 * Connected clients
 *
 * Two browsers watching one board is normal (a phone and a laptop), and every
 * project was keeping its own array of connections. This is that array: fixed
 * size, no allocation, holds whatever handle the HTTP stack uses (an int fd,
 * a socket id, an index).
 * ========================================================================= */

#ifndef BW_MAX_CLIENTS
#define BW_MAX_CLIENTS 4
#endif

typedef struct {
    int handles[BW_MAX_CLIENTS];
    int count;
} bw_clients_t;

/** Reset the registry (call once at startup). */
static inline void bw_clients_init(bw_clients_t *c) {
    int i;
    if (!c) return;
    for (i = 0; i < BW_MAX_CLIENTS; i++) c->handles[i] = -1;
    c->count = 0;
}

/** Remember a connected SSE client. Returns 1 on success, 0 when full. */
static inline int bw_clients_add(bw_clients_t *c, int handle) {
    int i;
    if (!c) return 0;
    for (i = 0; i < BW_MAX_CLIENTS; i++) {
        if (c->handles[i] == handle) return 1;      /* already known */
    }
    for (i = 0; i < BW_MAX_CLIENTS; i++) {
        if (c->handles[i] == -1) { c->handles[i] = handle; c->count++; return 1; }
    }
    return 0;
}

/** Forget a client that disconnected. Returns 1 when it was present. */
static inline int bw_clients_remove(bw_clients_t *c, int handle) {
    int i;
    if (!c) return 0;
    for (i = 0; i < BW_MAX_CLIENTS; i++) {
        if (c->handles[i] == handle) { c->handles[i] = -1; c->count--; return 1; }
    }
    return 0;
}

/**
 * bw_clients_each() — call `send(handle, frame, user)` for every client.
 *
 * `send` returns 0 to signal a dead connection, which is then dropped, so a
 * closed browser tab cleans itself up on the next push.
 *
 *   bw_clients_each(&clients, bw_write_sse, frame, NULL);
 */
static inline int bw_clients_each(bw_clients_t *c,
                                   int (*send)(int handle, const char *frame, void *user),
                                   const char *frame, void *user) {
    int i, sent = 0;
    if (!c || !send) return 0;
    for (i = 0; i < BW_MAX_CLIENTS; i++) {
        if (c->handles[i] == -1) continue;
        if (send(c->handles[i], frame, user)) sent++;
        else { c->handles[i] = -1; c->count--; }
    }
    return sent;
}

#endif /* BWSERVE_H */
