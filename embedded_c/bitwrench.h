/**
 * bitwrench.h — TACO format helpers for C/C++ embedded systems
 *
 * Part of the bitwrench project: https://github.com/nicktackes/bitwrench
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
 * The browser's bw.clientParse() normalizes to strict JSON.
 * ======================================================================== */

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
 *   BW_TACO_ATTR(buf, "button", "'data-bw-action':'increment','class':'bw-btn'", "+1")
 *   → r{'t':'button','a':{'data-bw-action':'increment','class':'bw-btn'},'c':'+1'}
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
        strncat(buf, item, sizeof(buf) - strlen(buf) - 1); \
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
        result += item;
        first = false;
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
