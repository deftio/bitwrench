/**
 * bitwrench.h — TACO format helpers for C/C++ embedded systems
 *
 * Part of the bitwrench project: https://github.com/deftio/bitwrench
 *
 * Provides macros for composing TACO ({t,a,c,o}) JSON strings from C code.
 * These strings are sent to a browser running bitwrench.js, which renders
 * them as DOM elements.
 *
 * Uses the relaxed JSON r-prefix format so you don't need to escape
 * double quotes in C string literals:
 *   r{'t':'div','c':'Hello'}   (sent on wire)
 *   {"t":"div","c":"Hello"}    (browser normalizes before JSON.parse)
 *
 * ESCAPING RULE: Since single quotes delimit strings, apostrophes in
 * values must be escaped with backslash:
 *   r{'content':'Barry\'s room'}  →  {"content":"Barry's room"}
 *
 * This is still a huge win over standard JSON in C, where EVERY quote
 * needs escaping:
 *   "{\"content\":\"Barry's room\"}"   ← standard JSON (painful)
 *   "r{'content':'Barry\\'s room'}"    ← relaxed JSON (only escape apostrophes)
 *
 * For dynamic user text, use bw_escape_string() before inserting into
 * a message macro. See examples below.
 *
 * License: BSD-2-Clause
 * Copyright (c) 2026 Manu Chatterjee / deftio
 */

#ifndef BITWRENCH_H
#define BITWRENCH_H

#include <stdio.h>
#include <string.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ========================================================================
 * Buffer size defaults
 * ======================================================================== */

#ifndef BW_BUF_SIZE
#define BW_BUF_SIZE 512
#endif

#ifndef BW_TACO_BUF_SIZE
#define BW_TACO_BUF_SIZE 256
#endif

/* ========================================================================
 * TACO builders — compose r-prefix relaxed JSON TACO nodes
 *
 * All output is r-prefixed:  r{'t':'tag','c':'content'}
 * The browser's bw.parseJSONFlex() normalizes to strict JSON.
 * ======================================================================== */

/**
 * BW_SKIP_R — Drop the leading `r` of a TACO that is about to be nested.
 *
 * The r-prefix marks the start of a relaxed-JSON *message*. Inside one it is
 * not valid: `'c':[r{...}]` fails to parse, and bw.connect() swallows the
 * error, so the symptom is a frame that silently does nothing. Every macro
 * that embeds a TACO inside something else runs it through this.
 */
#define BW_SKIP_R(taco_str) ((taco_str)[0] == 'r' ? (taco_str) + 1 : (taco_str))

/**
 * BW_TACO — Simple element: tag + text content
 *   BW_TACO(buf, "h1", "Hello World")
 *   → r{'t':'h1','c':'Hello World'}
 */
#define BW_TACO(buf, tag, text) \
    snprintf(buf, sizeof(buf), "r{'t':'%s','c':'%s'}", tag, text)

/**
 * BW_TACO_CLS — Element with class attribute
 *   BW_TACO_CLS(buf, "div", "bw-card", "Card body")
 *   → r{'t':'div','a':{'class':'bw-card'},'c':'Card body'}
 */
#define BW_TACO_CLS(buf, tag, cls, text) \
    snprintf(buf, sizeof(buf), \
        "r{'t':'%s','a':{'class':'%s'},'c':'%s'}", tag, cls, text)

/**
 * BW_TACO_ID — Element with id attribute
 *   BW_TACO_ID(buf, "span", "counter", "0")
 *   → r{'t':'span','a':{'id':'counter'},'c':'0'}
 */
#define BW_TACO_ID(buf, tag, id, text) \
    snprintf(buf, sizeof(buf), \
        "r{'t':'%s','a':{'id':'%s'},'c':'%s'}", tag, id, text)

/**
 * BW_TACO_ATTR — Element with arbitrary attribute string (pre-composed)
 *   BW_TACO_ATTR(buf, "button", "'class':'bw_btn bw_primary bw_act_increment'", "+1")
 *   → r{'t':'button','a':{'class':'bw_btn bw_primary bw_act_increment'},'c':'+1'}
 */
#define BW_TACO_ATTR(buf, tag, attr_str, text) \
    snprintf(buf, sizeof(buf), \
        "r{'t':'%s','a':{%s},'c':'%s'}", tag, attr_str, text)

/**
 * BW_TACO_NUM — Element with numeric content (no quotes around value)
 *   BW_TACO_NUM(buf, "span", 23.5)
 *   → r{'t':'span','c':'23.5'}
 */
#define BW_TACO_NUM(buf, tag, value) \
    snprintf(buf, sizeof(buf), "r{'t':'%s','c':'%g'}", tag, (double)(value))

/**
 * BW_NEST — Element whose content is other TACOs, not text.
 *
 * Every macro above quotes its content, which makes it a leaf: good for a
 * reading or a label, no use for a card that holds two of them. BW_NEST puts
 * `children` in unquoted, so a device can send a tree in one message instead
 * of one message per node (or, worse, a string of HTML).
 *
 * `children` is one TACO or a BW_ARRAY_* list, already built:
 *
 *   char row[256];
 *   char col[512];           -- each level needs MORE room than the last
 *   char page[1024];
 *   BW_TACO_ID(row, "span", "temp", "22.4 C");
 *   BW_NEST_CLS(col, "div", "bw_bccl_card", row);
 *   BW_NEST(page, "div", col);
 *   → r{'t':'div','c':{'t':'div','a':{'class':'bw_bccl_card'},...}}
 *
 * Children are run through BW_SKIP_R, so a tree of any depth stays one
 * parseable message -- one bw.mount() on the browser side.
 *
 * Two buffer rules, and a compiler building with -Wall -Werror enforces both:
 *
 *   1. Each level needs its OWN buffer. `BW_NEST(x, "div", x)` is snprintf()
 *      into the buffer it is reading from: undefined behaviour.
 *   2. Each level must be LARGER than its source. Nesting grows the string, so
 *      a same-sized destination can silently truncate -- gcc refuses it with
 *      -Wformat-truncation, and is right to. Escalate the sizes as you go up.
 *
 * The C++ half (bw::nest) has neither trap: it builds with std::string, so
 * there is no buffer to size and nothing to truncate.
 */
#define BW_NEST(buf, tag, children) \
    snprintf(buf, sizeof(buf), "r{'t':'%s','c':%s}", tag, BW_SKIP_R(children))

/**
 * BW_NEST_CLS — BW_NEST with a class attribute (the common case).
 *   BW_NEST_CLS(buf, "div", "bw_row bw_g_3", cards)
 */
#define BW_NEST_CLS(buf, tag, cls, children) \
    snprintf(buf, sizeof(buf), \
        "r{'t':'%s','a':{'class':'%s'},'c':%s}", tag, cls, BW_SKIP_R(children))

/**
 * BW_NEST_ATTR — BW_NEST with a pre-composed attribute string.
 *   BW_NEST_ATTR(buf, "section", "'id':'readings'", cards)
 */
#define BW_NEST_ATTR(buf, tag, attr_str, children) \
    snprintf(buf, sizeof(buf), \
        "r{'t':'%s','a':{%s},'c':%s}", tag, attr_str, BW_SKIP_R(children))

/**
 * BW_TACO_ARRAY — Begin an array content wrapper
 *   Use with BW_ARRAY_ITEM and BW_ARRAY_END to build arrays:
 *   char items[512] = "[";
 *   BW_ARRAY_ITEM(items, taco1);
 *   BW_ARRAY_ITEM(items, taco2);
 *   BW_ARRAY_END(items);
 *   // items = "[{...},{...}]"
 */
#define BW_ARRAY_START(buf) \
    do { buf[0] = '['; buf[1] = '\0'; } while(0)

#define BW_ARRAY_ITEM(buf, item) \
    do { \
        size_t _len = strlen(buf); \
        if (_len > 1) strncat(buf, ",", sizeof(buf) - _len - 1); \
        strncat(buf, BW_SKIP_R(item), sizeof(buf) - strlen(buf) - 1); \
    } while(0)

#define BW_ARRAY_END(buf) \
    strncat(buf, "]", sizeof(buf) - strlen(buf) - 1)

/* ========================================================================
 * Utility helpers
 * ======================================================================== */

/**
 * bw_escape_string — Escape special chars for relaxed JSON string values.
 * Handles: backslash, single quotes (in r-prefix context).
 * Does NOT add surrounding quotes.
 *
 * Returns: number of chars written (excluding NUL).
 */
static inline int bw_escape_string(char* dst, size_t dst_size, const char* src) {
    size_t di = 0;
    for (size_t si = 0; src[si] != '\0' && di < dst_size - 1; si++) {
        char ch = src[si];
        if (ch == '\'' || ch == '\\') {
            if (di + 1 >= dst_size - 1) break;
            dst[di++] = '\\';
            dst[di++] = ch;
        } else if (ch == '\n') {
            if (di + 1 >= dst_size - 1) break;
            dst[di++] = '\\';
            dst[di++] = 'n';
        } else if (ch == '\r') {
            if (di + 1 >= dst_size - 1) break;
            dst[di++] = '\\';
            dst[di++] = 'r';
        } else if (ch == '\t') {
            if (di + 1 >= dst_size - 1) break;
            dst[di++] = '\\';
            dst[di++] = 't';
        } else {
            dst[di++] = ch;
        }
    }
    dst[di] = '\0';
    return (int)di;
}

/**
 * bw_format_bytes — Human-readable byte size (e.g. "1.2 KB", "340 B")
 */
static inline void bw_format_bytes(char* buf, size_t buf_size, unsigned long bytes) {
    if (bytes < 1024) {
        snprintf(buf, buf_size, "%lu B", bytes);
    } else if (bytes < 1024 * 1024) {
        snprintf(buf, buf_size, "%.1f KB", (double)bytes / 1024.0);
    } else {
        snprintf(buf, buf_size, "%.1f MB", (double)bytes / (1024.0 * 1024.0));
    }
}

#ifdef __cplusplus
}
#endif

/* ========================================================================
 * C++ wrappers (optional, only compiled in C++ mode)
 * ======================================================================== */

#ifdef __cplusplus

#include <string>
#include <vector>

namespace bw {

/**
 * taco() — Build a TACO JSON string (r-prefix relaxed format).
 *
 *   auto node = bw::taco("h1", "Hello");
 *   // → "r{'t':'h1','c':'Hello'}"
 */
inline std::string taco(const char* tag, const char* content) {
    char buf[BW_TACO_BUF_SIZE];
    BW_TACO(buf, tag, content);
    return std::string(buf);
}

inline std::string taco(const char* tag, const char* cls, const char* content) {
    char buf[BW_TACO_BUF_SIZE];
    BW_TACO_CLS(buf, tag, cls, content);
    return std::string(buf);
}

inline std::string taco_id(const char* tag, const char* id, const char* content) {
    char buf[BW_TACO_BUF_SIZE];
    BW_TACO_ID(buf, tag, id, content);
    return std::string(buf);
}

inline std::string taco_num(const char* tag, double value) {
    char buf[BW_TACO_BUF_SIZE];
    BW_TACO_NUM(buf, tag, value);
    return std::string(buf);
}

/** A child TACO, with the message-level r-prefix removed (see BW_SKIP_R). */
inline std::string inner(const std::string& taco) {
    return (!taco.empty() && taco[0] == 'r') ? taco.substr(1) : taco;
}

/**
 * taco_attr() — Element with a pre-composed attribute string.
 *
 *   bw::taco_attr("button", "'class':'bw_bccl_btn bw_act_save','id':'save'", "Save")
 */
inline std::string taco_attr(const char* tag, const std::string& attrs, const char* content) {
    return std::string("r{'t':'") + tag + "','a':{" + attrs + "},'c':'" + content + "'}";
}

/**
 * nest() — Element whose content is other TACOs rather than text.
 *
 * The buffered C macros cap a node at BW_TACO_BUF_SIZE; these build with
 * std::string, so a page-sized tree is fine on a target with a heap.
 *
 *   bw::nest("div", "bw_row", bw::array({ card_a, card_b }))
 */
inline std::string nest(const char* tag, const std::string& children) {
    return std::string("r{'t':'") + tag + "','c':" + inner(children) + "}";
}

/** nest() with a class attribute. */
inline std::string nest(const char* tag, const char* cls, const std::string& children) {
    return std::string("r{'t':'") + tag + "','a':{'class':'" + cls + "'},'c':" + inner(children) + "}";
}

/** nest() with a pre-composed attribute string. */
inline std::string nest_attr(const char* tag, const std::string& attrs, const std::string& children) {
    return std::string("r{'t':'") + tag + "','a':{" + attrs + "},'c':" + inner(children) + "}";
}

/**
 * array() — Compose a TACO array from a vector of TACO strings.
 *
 *   auto items = bw::array({
 *     bw::taco("li", "Item 1"),
 *     bw::taco("li", "Item 2")
 *   });
 */
inline std::string array(const std::initializer_list<std::string>& items) {
    std::string result = "[";
    bool first = true;
    for (const auto& item : items) {
        if (!first) result += ",";
        result += inner(item);
        first = false;
    }
    result += "]";
    return result;
}

/**
 * array() over a vector — the data-driven case, where the count is not known
 * until the device has read its sensors.
 *
 *   std::vector<std::string> rows;
 *   for (int i = 0; i < n; i++) rows.push_back(bw::taco("li", name[i]));
 *   return bw::nest("ul", bw::array(rows));
 */
inline std::string array(const std::vector<std::string>& items) {
    std::string result = "[";
    for (size_t i = 0; i < items.size(); i++) {
        if (i) result += ",";
        result += inner(items[i]);
    }
    result += "]";
    return result;
}

/**
 * escape() — Escape a string for use inside r-prefix JSON values.
 */
inline std::string escape(const char* src) {
    char buf[BW_BUF_SIZE];
    bw_escape_string(buf, sizeof(buf), src);
    return std::string(buf);
}

} /* namespace bw */

#endif /* __cplusplus */

#endif /* BITWRENCH_H */
