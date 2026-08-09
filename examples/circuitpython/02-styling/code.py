# bitwrench on CircuitPython -- 2: making it look good
#
# 1a and 1b covered the format. This one is about making the result look like
# something you would ship, and responding when someone clicks.
#
# Try this: click one of the colour buttons on the page.
#
# Setup:
#   1. Copy bw_board.py and this file (as code.py) to the CIRCUITPY drive
#   2. Copy settings.toml.example to settings.toml and fill in your WiFi
#   3. Install adafruit_httpserver into /lib   (circup install adafruit_httpserver)
#   4. Open the URL printed on the serial console

try:
    import bw_board
except ImportError:
    # On a board, bw_board.py sits next to code.py and the import above works.
    # On a desktop this file lives in a subfolder, so add its parent and retry.
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    import bw_board
try:
    from adafruit_httpserver import Server, Request, Response, FileResponse
except ImportError:
    raise SystemExit(
        "\n  adafruit_httpserver is not installed.\n"
        "\n  Easiest:  ../run.sh 3        (sets up a virtualenv for you)"
        "\n  Or:       pip install adafruit-circuitpython-httpserver"
        "\n  On a board:  circup install adafruit_httpserver\n"
    )

# The page.

page = """<!doctype html><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>Styling</title>
<link rel=icon href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' rx='3' fill='%232563eb'/></svg>">
<script src="/js/bitwrench.js"></script>
<div id=app></div>
<script>
// =========================================================================
// THERE IS NO CSS FILE IN THIS PROJECT
//
// You style a TACO in three ways, smallest to largest:
//
//   1. an inline style        a: { style: bw.s({ color: 'red' }) }
//   2. a class that ships     a: { class: 'bw_text_center' }
//   3. the theme              bw.loadStyles({ primary: '#2563eb' })
//
// The third is the one worth understanding. You give bitwrench one colour and
// it derives an entire palette -- hover states, borders, focus rings, readable
// text colours, light and dark variants -- and generates the stylesheet at run
// time. Change that one value and the whole interface re-brands.
//
// For a device that matters more than it sounds: there is no CSS file to ship
// to flash, and no build step to regenerate one.
//
// Note bw.s() takes JavaScript property names -- backgroundColor, not
// background-color. Same names you would use from JavaScript anywhere else.
// =========================================================================

var SEEDS = [
  ['Blue',   '#2563eb'],
  ['Rust',   '#c2410c'],
  ['Forest', '#15803d'],
  ['Plum',   '#7e22ce']
];

var seed = SEEDS[0][1];
var dark = false;

// ---- The page, rebuilt whenever the theme changes -----------------------

function swatch(label, colour) {
  return {
    t: 'div',
    a: { style: bw.s({ flex: '1 1 110px', minWidth: 0 }) },
    c: [
      { t: 'div', a: { style: bw.s({ height: '2.5rem', borderRadius: '6px',
                                     background: colour,
                                     border: '1px solid rgba(0,0,0,0.12)' }) } },
      { t: 'div', a: { class: 'bw_text_muted',
                       style: bw.s({ fontSize: '0.72rem', marginTop: '0.3rem' }) },
        c: label },
      { t: 'code', a: { class: 'bw_code' }, c: colour }
    ]
  };
}

function themeButton(name, hex, p) {
  var active = (hex === seed);
  return {
    t: 'button',
    a: {
      // Every colour here comes from the palette -- nothing is hard-coded.
      style: bw.s({
        padding: '0.5rem 0.9rem',
        borderRadius: '6px',
        cursor: 'pointer',
        border: '1px solid ' + (active ? p.primary.base : p.light.border),
        background: active ? p.primary.base : p.surface,
        color: active ? p.primary.textOn : p.dark.base,
        fontWeight: active ? '600' : '400'
      }),
      onclick: function () { seed = hex; render(); }     // <- interactivity
    },
    c: name
  };
}

function section(title, children) {
  return {
    t: 'section',
    a: { style: bw.s({ display: 'flex', flexDirection: 'column', gap: '0.75rem' }) },
    c: [{ t: 'h2', a: { style: bw.s({ margin: 0, fontSize: '1.15rem' }) }, c: title }]
         .concat(children)
  };
}

function build(p) {
  return {
    t: 'div',
    a: { class: 'bw_bccl_container bw_vstack bw_gap_4',
         style: bw.s({ paddingTop: '1.5rem', paddingBottom: '2rem' }) },
    c: [
      { t: 'header', c: [
        { t: 'h1', c: 'Making it look good' },
        { t: 'p', c: 'Everything on this page is styled from one colour. '
                   + 'Pick a different one below and watch the whole page follow.' }
      ]},

      // -- 1. inline styles ------------------------------------------------
      section('1. An inline style', [
        { t: 'p', a: { class: 'bw_text_muted' },
          c: 'bw.s() takes a plain object of CSS properties. Nearest thing to '
           + 'writing style="..." by hand, and useful for one-offs.' },
        { t: 'p',
          a: { style: bw.s({ padding: '0.75rem 1rem', borderRadius: '8px',
                             background: p.primary.light,
                             color: p.primary.darkText,
                             borderLeft: '3px solid ' + p.primary.base }) },
          c: 'Styled with bw.s({ background: palette.primary.light, ... })' }
      ]),

      // -- 2. classes that ship --------------------------------------------
      section('2. A class that ships with bitwrench', [
        { t: 'p', a: { class: 'bw_text_muted' },
          c: 'These are ordinary CSS classes, already inside the file the page '
           + 'loaded. Your own class names work exactly the same way.' },
        { t: 'p', a: { class: 'bw_text_center' }, c: 'bw_text_center' },
        { t: 'ul', c: [
          { t: 'li', c: [ 'bw_code -- ', { t: 'code', a: { class: 'bw_code' },
                                           c: 'inline code' } ] },
          { t: 'li', c: 'bw_text_muted -- for secondary text' }
        ]},
        { t: 'hr' },
        { t: 'blockquote', a: { class: 'bw_quote' },
          c: 'bw_quote -- for a pull quote or a callout.' },
        { t: 'p', a: { class: 'bw_text_muted' },
          c: 'Notice the list above and the rule between it and this quote wear '
           + 'no class at all. Plain HTML is expected to look right on its own; '
           + 'you reach for a class when you want something other than the '
           + 'default, not to repair one.' }
      ]),

      // -- 3. the theme ----------------------------------------------------
      section('3. The theme: one colour becomes a palette', [
        { t: 'p', a: { class: 'bw_text_muted' },
          c: 'bitwrench derived every colour below from the single seed value. '
           + 'You never wrote any of them.' },
        { t: 'div', a: { style: bw.s({ display: 'flex', flexWrap: 'wrap',
                                       gap: '0.75rem' }) },
          c: [
            swatch('primary.base',   p.primary.base),
            swatch('primary.hover',  p.primary.hover),
            swatch('primary.light',  p.primary.light),
            swatch('primary.border', p.primary.border),
            swatch('surface',        p.surface),
            swatch('surfaceAlt',     p.surfaceAlt)
          ]},
        { t: 'div', a: { style: bw.s({ display: 'flex', flexWrap: 'wrap',
                                       gap: '0.5rem', marginTop: '0.25rem' }) },
          c: SEEDS.map(function (s) { return themeButton(s[0], s[1], p); })
             .concat([{
               t: 'button',
               a: { style: bw.s({ padding: '0.5rem 0.9rem', borderRadius: '6px',
                                  cursor: 'pointer', marginLeft: 'auto',
                                  border: '1px solid ' + p.light.border,
                                  background: p.surface, color: p.dark.base }),
                    onclick: function () { dark = !dark; render(); } },
               c: dark ? 'Light mode' : 'Dark mode'
             }])},
        { t: 'p', a: { class: 'bw_text_muted',
                       style: bw.s({ fontSize: '0.85rem' }) },
          c: 'Those buttons call bw.loadStyles() with a different seed and '
           + 'redraw. No stylesheet is swapped, because there is not one.' }
      ]),

      { t: 'p',
        a: { style: bw.s({ margin: 0, padding: '0.85rem 1rem',
                           borderRadius: '6px',
                           background: p.primary.light,
                           color: p.primary.darkText,
                           borderLeft: '3px solid ' + p.primary.base }) },
        c: 'Next (3): the device starts composing this in Python, and the '
         + 'browser stops being the one who decides what the page says.' }
    ]
  };
}

// ---- Re-render on every theme change ------------------------------------
// No framework, no reactivity: an ordinary function you call when something
// changed. That is the whole update model.

function render() {
  // loadStyles generates the stylesheet and injects it, replacing the previous
  // one rather than stacking a new <style> tag on top. It hands back both
  // palettes: the one you asked for, and a dark counterpart derived from it.
  var styles = bw.loadStyles({ primary: seed });
  var p = dark ? styles.alternatePalette : styles.palette;

  // Switching mode is a class on <html>; the dark rules were already generated.
  bw.setThemeMode(dark ? 'alternate' : 'primary');

  bw.DOM('#app', build(p));
}

render();
</script>
"""


pool, host, port = bw_board.start(
    "2 - making it look good",
    serving="bitwrench from %s (gzipped, straight off the filesystem)" % bw_board.WWW,
)
server = Server(pool, "/static", debug=True)


@server.route("/")
def index(request: Request):
    return Response(request, page, content_type="text/html")


@server.route("/js/bitwrench.js")
def bitwrench_js(request: Request):
    return FileResponse(
        request,
        "bitwrench.umd.min.js.gz",
        bw_board.WWW,
        headers={"Content-Encoding": "gzip"},
        content_type="text/javascript",
    )


print("  page size: %d bytes" % len(page))
server.serve_forever(host, port)
