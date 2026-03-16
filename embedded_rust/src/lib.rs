//! # bwserve — Protocol helpers for embedded Rust
//!
//! Composing bwserve protocol messages (replace, patch, append, remove, batch)
//! from Rust embedded systems (ESP32, STM32, etc).
//!
//! Uses the relaxed JSON `r`-prefix format for convenient string composition:
//! ```text
//! r{'type':'patch','target':'temp','content':'23.5'}
//! ```
//!
//! The browser's `bw.parseJSONFlex()` normalizes this to strict JSON.
//!
//! ## Features
//!
//! - `std` (default): Uses `String` and `Vec`. Disable for `no_std` bare-metal.
//! - Without `std`: Uses fixed-size stack buffers via `write!` to `&mut [u8]`.
//!
//! ## Example
//!
//! ```rust
//! use bwserve::{patch, batch, taco};
//!
//! let msg = patch("temperature", "23.5 C");
//! // → r{'type':'patch','target':'temperature','content':'23.5 C'}
//!
//! let page = taco("h1", "Hello from Rust!");
//! // → r{'t':'h1','c':'Hello from Rust!'}
//! ```

#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(not(feature = "std"))]
extern crate core;

use core::fmt::Write;

// =========================================================================
// Fixed-size buffer for no_std
// =========================================================================

/// Stack-allocated string buffer for no_std environments.
pub struct FixedBuf<const N: usize> {
    buf: [u8; N],
    len: usize,
}

impl<const N: usize> FixedBuf<N> {
    pub fn new() -> Self {
        Self {
            buf: [0u8; N],
            len: 0,
        }
    }

    pub fn as_str(&self) -> &str {
        // Safety: we only write valid UTF-8 via core::fmt::Write
        unsafe { core::str::from_utf8_unchecked(&self.buf[..self.len]) }
    }

    pub fn as_bytes(&self) -> &[u8] {
        &self.buf[..self.len]
    }

    pub fn len(&self) -> usize {
        self.len
    }

    pub fn is_empty(&self) -> bool {
        self.len == 0
    }

    pub fn clear(&mut self) {
        self.len = 0;
    }
}

impl<const N: usize> Write for FixedBuf<N> {
    fn write_str(&mut self, s: &str) -> core::fmt::Result {
        let bytes = s.as_bytes();
        let remaining = N - self.len;
        let to_copy = if bytes.len() > remaining {
            remaining
        } else {
            bytes.len()
        };
        self.buf[self.len..self.len + to_copy].copy_from_slice(&bytes[..to_copy]);
        self.len += to_copy;
        if to_copy < bytes.len() {
            Err(core::fmt::Error)
        } else {
            Ok(())
        }
    }
}

/// Default buffer size for protocol messages.
pub const DEFAULT_BUF_SIZE: usize = 512;

// =========================================================================
// TACO builders
// =========================================================================

/// Build a TACO node: `r{'t':'tag','c':'content'}`
pub fn taco_buf<const N: usize>(buf: &mut FixedBuf<N>, tag: &str, content: &str) {
    let _ = write!(buf, "r{{'t':'{}','c':'{}'}}", tag, content);
}

/// Build a TACO node with class: `r{'t':'tag','a':{'class':'cls'},'c':'content'}`
pub fn taco_cls_buf<const N: usize>(
    buf: &mut FixedBuf<N>,
    tag: &str,
    cls: &str,
    content: &str,
) {
    let _ = write!(
        buf,
        "r{{'t':'{}','a':{{'class':'{}'}},'c':'{}'}}",
        tag, cls, content
    );
}

/// Build a TACO node with id: `r{'t':'tag','a':{'id':'id'},'c':'content'}`
pub fn taco_id_buf<const N: usize>(
    buf: &mut FixedBuf<N>,
    tag: &str,
    id: &str,
    content: &str,
) {
    let _ = write!(
        buf,
        "r{{'t':'{}','a':{{'id':'{}'}},'c':'{}'}}",
        tag, id, content
    );
}

// =========================================================================
// Protocol message builders (fixed buffer versions)
// =========================================================================

/// Build a patch message into a fixed buffer.
pub fn patch_buf<const N: usize>(buf: &mut FixedBuf<N>, target: &str, content: &str) {
    let _ = write!(
        buf,
        "r{{'type':'patch','target':'{}','content':'{}'}}",
        target, content
    );
}

/// Build a patch message with numeric content.
pub fn patch_num_buf<const N: usize>(buf: &mut FixedBuf<N>, target: &str, value: f64) {
    let _ = write!(
        buf,
        "r{{'type':'patch','target':'{}','content':'{}'}}",
        target, value
    );
}

/// Build a replace message into a fixed buffer.
/// `taco_str` should be a pre-composed TACO string (from taco_buf etc).
pub fn replace_buf<const N: usize>(buf: &mut FixedBuf<N>, target: &str, taco_str: &str) {
    // Strip r-prefix from inner TACO if present
    let node = if taco_str.starts_with('r') {
        &taco_str[1..]
    } else {
        taco_str
    };
    let _ = write!(
        buf,
        "r{{'type':'replace','target':'{}','node':{}}}",
        target, node
    );
}

/// Build an append message into a fixed buffer.
pub fn append_buf<const N: usize>(buf: &mut FixedBuf<N>, target: &str, taco_str: &str) {
    let node = if taco_str.starts_with('r') {
        &taco_str[1..]
    } else {
        taco_str
    };
    let _ = write!(
        buf,
        "r{{'type':'append','target':'{}','node':{}}}",
        target, node
    );
}

/// Build a remove message into a fixed buffer.
pub fn remove_buf<const N: usize>(buf: &mut FixedBuf<N>, target: &str) {
    let _ = write!(buf, "r{{'type':'remove','target':'{}'}}", target);
}

/// Build a message (notification) into a fixed buffer.
pub fn message_buf<const N: usize>(buf: &mut FixedBuf<N>, level: &str, text: &str) {
    let _ = write!(
        buf,
        "r{{'type':'message','level':'{}','text':'{}'}}",
        level, text
    );
}

// =========================================================================
// SSE frame helper
// =========================================================================

/// Wrap a message as an SSE data frame into a fixed buffer.
pub fn sse_frame_buf<const N: usize>(buf: &mut FixedBuf<N>, data: &str) {
    let _ = write!(buf, "data: {}\n\n", data);
}

/// SSE keep-alive comment.
pub const SSE_KEEPALIVE: &str = ":keepalive\n\n";

/// SSE HTTP response headers.
pub const SSE_HEADERS: &str = "HTTP/1.1 200 OK\r\n\
    Content-Type: text/event-stream\r\n\
    Cache-Control: no-cache\r\n\
    Connection: keep-alive\r\n\
    Access-Control-Allow-Origin: *\r\n\
    \r\n";

// =========================================================================
// std-only convenience functions (return String)
// =========================================================================

#[cfg(feature = "std")]
extern crate alloc;

#[cfg(feature = "std")]
use alloc::string::String;

#[cfg(feature = "std")]
use alloc::vec::Vec;

/// Build a TACO node string.
#[cfg(feature = "std")]
pub fn taco(tag: &str, content: &str) -> String {
    let mut buf = FixedBuf::<DEFAULT_BUF_SIZE>::new();
    taco_buf(&mut buf, tag, content);
    String::from(buf.as_str())
}

/// Build a TACO node with class.
#[cfg(feature = "std")]
pub fn taco_cls(tag: &str, cls: &str, content: &str) -> String {
    let mut buf = FixedBuf::<DEFAULT_BUF_SIZE>::new();
    taco_cls_buf(&mut buf, tag, cls, content);
    String::from(buf.as_str())
}

/// Build a patch protocol message.
#[cfg(feature = "std")]
pub fn patch(target: &str, content: &str) -> String {
    let mut buf = FixedBuf::<DEFAULT_BUF_SIZE>::new();
    patch_buf(&mut buf, target, content);
    String::from(buf.as_str())
}

/// Build a patch message with numeric content.
#[cfg(feature = "std")]
pub fn patch_num(target: &str, value: f64) -> String {
    let mut buf = FixedBuf::<DEFAULT_BUF_SIZE>::new();
    patch_num_buf(&mut buf, target, value);
    String::from(buf.as_str())
}

/// Build a replace protocol message.
#[cfg(feature = "std")]
pub fn replace(target: &str, taco_str: &str) -> String {
    let mut buf = FixedBuf::<{ DEFAULT_BUF_SIZE * 2 }>::new();
    replace_buf(&mut buf, target, taco_str);
    String::from(buf.as_str())
}

/// Build an append protocol message.
#[cfg(feature = "std")]
pub fn append(target: &str, taco_str: &str) -> String {
    let mut buf = FixedBuf::<{ DEFAULT_BUF_SIZE * 2 }>::new();
    append_buf(&mut buf, target, taco_str);
    String::from(buf.as_str())
}

/// Build a remove protocol message.
#[cfg(feature = "std")]
pub fn remove(target: &str) -> String {
    let mut buf = FixedBuf::<DEFAULT_BUF_SIZE>::new();
    remove_buf(&mut buf, target);
    String::from(buf.as_str())
}

/// Build a message/notification protocol message.
#[cfg(feature = "std")]
pub fn message(level: &str, text: &str) -> String {
    let mut buf = FixedBuf::<DEFAULT_BUF_SIZE>::new();
    message_buf(&mut buf, level, text);
    String::from(buf.as_str())
}

/// Build a batch protocol message from a list of message strings.
#[cfg(feature = "std")]
pub fn batch(ops: &[String]) -> String {
    let mut result = String::from("r{'type':'batch','ops':[");
    for (i, op) in ops.iter().enumerate() {
        if i > 0 {
            result.push(',');
        }
        // Strip r-prefix from individual ops
        if op.starts_with('r') {
            result.push_str(&op[1..]);
        } else {
            result.push_str(op);
        }
    }
    result.push_str("]}");
    result
}

/// Wrap a message as an SSE data frame.
#[cfg(feature = "std")]
pub fn sse_frame(data: &str) -> String {
    let mut result = String::from("data: ");
    result.push_str(data);
    result.push_str("\n\n");
    result
}

// =========================================================================
// Tests
// =========================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_taco() {
        let s = taco("h1", "Hello");
        assert_eq!(s, "r{'t':'h1','c':'Hello'}");
    }

    #[test]
    fn test_taco_cls() {
        let s = taco_cls("div", "bw-card", "Body");
        assert_eq!(s, "r{'t':'div','a':{'class':'bw-card'},'c':'Body'}");
    }

    #[test]
    fn test_patch() {
        let s = patch("temp", "23.5 C");
        assert_eq!(s, "r{'type':'patch','target':'temp','content':'23.5 C'}");
    }

    #[test]
    fn test_patch_num() {
        let s = patch_num("temp", 23.5);
        assert_eq!(
            s,
            "r{'type':'patch','target':'temp','content':'23.5'}"
        );
    }

    #[test]
    fn test_replace() {
        let node = taco("h1", "Hi");
        let s = replace("#app", &node);
        assert_eq!(
            s,
            "r{'type':'replace','target':'#app','node':{'t':'h1','c':'Hi'}}"
        );
    }

    #[test]
    fn test_remove() {
        let s = remove("#old");
        assert_eq!(s, "r{'type':'remove','target':'#old'}");
    }

    #[test]
    fn test_batch() {
        let ops = vec![
            patch("a", "1"),
            patch("b", "2"),
        ];
        let s = batch(&ops);
        assert!(s.starts_with("r{'type':'batch','ops':["));
        assert!(s.contains("'target':'a'"));
        assert!(s.contains("'target':'b'"));
        assert!(s.ends_with("]}"));
    }

    #[test]
    fn test_sse_frame() {
        let msg = patch("x", "y");
        let frame = sse_frame(&msg);
        assert!(frame.starts_with("data: r{"));
        assert!(frame.ends_with("\n\n"));
    }

    #[test]
    fn test_fixed_buf() {
        let mut buf = FixedBuf::<256>::new();
        patch_buf(&mut buf, "temp", "23");
        assert_eq!(buf.as_str(), "r{'type':'patch','target':'temp','content':'23'}");
    }

    #[test]
    fn test_message() {
        let s = message("info", "Calibrated");
        assert_eq!(
            s,
            "r{'type':'message','level':'info','text':'Calibrated'}"
        );
    }
}
