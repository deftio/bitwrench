# bitwrench on CircuitPython -- 1b: TACOs inside TACOs
#
# 1a showed that one object makes one element. This one shows what happens
# when you put objects inside other objects -- which is all a page really is.
#
# Try this: add an entry to the `parts` array near the bottom and reload.
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
        "\n  Easiest:  ../run.sh 2        (sets up a virtualenv for you)"
        "\n  Or:       pip install adafruit-circuitpython-httpserver"
        "\n  On a board:  circup install adafruit_httpserver\n"
    )

# ---------------------------------------------------------------------------
# TODO(before-release): RESTORE THE CDN TAG IN THIS FILE
#
# These first two examples are meant to load bitwrench from a CDN -- that is
# the point of example 1a: the device holds almost nothing. They are pointed at
# the locally built copy *during development* so that `npm run build` plus a
# test pass exercises the tutorials against the working tree instead of against
# the last published release.
#
# Two real bugs hid behind the CDN version while developing 2.1.6: the
# bw_container alias and the bw_list / bw_code prose classes both silently did
# nothing here, because the CDN serves 2.1.5.
#
# To restore, in this file and in 01b-taco-nesting/code.py:
#   1. put the CDN <script> tag back (see BITWRENCH_CDN below)
#   2. delete the /js/bitwrench.js route
#   3. drop the /www copy step from this example's README
#
# Grep for TODO(before-release) to find every site.
# ---------------------------------------------------------------------------

BITWRENCH_CDN = (
    '<script src="https://cdn.jsdelivr.net/npm/bitwrench@2'
    '/dist/bitwrench.umd.min.js"></script>'
)

# The page. Same shell as 1a; only the script changed.

page = """<!doctype html><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>TACOs inside TACOs</title>
<link rel=icon href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' rx='3' fill='%232563eb'/></svg>">
<script src="/js/bitwrench.js"></script>
<div id=app></div>
<script>
bw.loadStyles({ primary: '#2563eb' });

// =========================================================================
// ONE MORE RULE, AND THAT IS THE WHOLE FORMAT
//
// In 1a, c was always a piece of text:
//
//     { t: 'h3', c: 'Hello' }        ->  <h3>Hello</h3>
//
// c can also hold another TACO, or an array of them. Three things go in c:
//
//     a string        text
//     a TACO          one child element
//     an array        several children, in order
//
// That is enough to build an entire page, because HTML is just elements
// inside elements:
//
//     { t: 'div', c: [                    <div>
//       { t: 'h3', c: 'Title' },            <h3>Title</h3>
//       { t: 'p',  c: 'Body' }              <p>Body</p>
//     ]}                                  </div>
//
// -------------------------------------------------------------------------
// THE PART THAT SURPRISES PEOPLE
//
// Because a TACO is an ordinary object, ordinary code builds one. A list of
// four readings becomes four <li> elements with .map() -- no special syntax,
// no directive, no {{ handlebars }}, no v-for.
//
// If you have used JSX you already write .map() inside braces. Same idea,
// except here you are building an array of objects rather than writing
// markup a compiler has to translate. You can console.log the result. You
// can JSON.stringify it and send it over a socket. Example 3 does that:
// the board builds the structure in Python and posts it to the browser.
// =========================================================================


// -- 1. A string, as before -----------------------------------------------
var justText = { t: 'p', c: 'A paragraph.' };

// -- 2. One TACO inside another -------------------------------------------
var oneChild = { t: 'blockquote', c: { t: 'em', c: 'Emphasised, inside a quote.' } };

// -- 3. An array of children ----------------------------------------------
var several = {
  t: 'div',
  c: [
    { t: 'h4', c: 'A small section' },
    { t: 'p',  c: 'Two elements, in the order you wrote them.' }
  ]
};

// -- 4. Mixed: text and elements together ---------------------------------
//    Useful for a sentence with a link in the middle of it.
var mixed = {
  t: 'p',
  c: [
    'This sentence contains ',
    { t: 'strong', c: 'a bold word' },
    ' without breaking the line.'
  ]
};

// -- 5. Children built from data ------------------------------------------
//    Because a TACO is an ordinary object, ordinary code can make one. Here
//    an array of strings becomes an array of <li> elements. Change the list
//    and the page changes -- nothing else to update.
var pins = ['D0', 'D1', 'A0', 'A1'];

var fromData = {
  t: 'ul',
  c: pins.map(function (name) {
    return { t: 'li', c: name + ' is available' };
  })
};

// -- 6. Nesting a few levels deep -----------------------------------------
//    Same rule applied repeatedly. No new syntax appears at any depth.
var nested = {
  t: 'div',
  c: [
    { t: 'h4', c: 'Board' },
    { t: 'ul', c: [
      { t: 'li', c: [ 'Name: ', { t: 'code', a: { class: 'bw_code' }, c: 'ProS3' } ] },
      { t: 'li', c: [ 'Pins: ', { t: 'code', a: { class: 'bw_code' }, c: String(pins.length) } ] }
    ]}
  ]
};

// ---- Show each one, with the HTML it produced ---------------------------

var parts = [
  ['a string',                  justText],
  ['one TACO inside another',   oneChild],
  ['an array of children',      several],
  ['text and elements mixed',   mixed],
  ['children built from data',  fromData],
  ['a few levels deep',         nested]
];

function caption(text) {
  return { t: 'div',
           a: { style: bw.s({ fontSize: '0.72rem', letterSpacing: '0.04em',
                              textTransform: 'uppercase', color: '#6b7280' }) },
           c: text };
}

function codeBlock(text) {
  return { t: 'pre',
           a: { style: bw.s({ margin: 0, padding: '0.6rem 0.75rem',
                              borderRadius: '6px', background: 'rgba(0,0,0,0.045)',
                              fontSize: '0.78rem', whiteSpace: 'pre-wrap',
                              overflowX: 'auto' }) },
           c: text };
}

// Each panel shows the same thing three ways: the object you wrote, the
// element it became, and the HTML behind that element.
function panel(label, taco) {
  return {
    t: 'section',
    a: { style: bw.s({ background: '#fff', border: '1px solid rgba(0,0,0,0.12)',
                       borderRadius: '10px', padding: '1rem',
                       display: 'flex', flexDirection: 'column', gap: '0.5rem' }) },
    c: [
      { t: 'h3', a: { style: bw.s({ margin: '0 0 0.25rem', fontSize: '1rem' }) },
        c: label },

      caption('1. the object in code.py'),
      codeBlock(JSON.stringify(taco, null, 1)),

      caption('2. what it renders as'),
      { t: 'div',
        a: { style: bw.s({ padding: '0.6rem 0.75rem', borderRadius: '6px',
                           border: '1px dashed rgba(0,0,0,0.18)' }) },
        c: taco },

      caption('3. the HTML behind it'),
      codeBlock(bw.html(taco))
    ]
  };
}

bw.DOM('#app', {
  t: 'div',
  a: { class: 'bw_bccl_container bw_vstack bw_gap_4',
       style: bw.s({ paddingTop: '1.5rem', paddingBottom: '2rem' }) },
  c: [
    { t: 'header', c: [
      { t: 'h1', c: 'TACOs inside TACOs' },
      { t: 'p', c: 'One rule, applied over and over: the c key can hold a '
                 + 'string, another object, or an array of them. Everything '
                 + 'below uses only that.' }
    ]},
    ...parts.map(function (p) { return panel(p[0], p[1]); }),
    { t: 'p',
      a: { style: bw.s({ margin: 0, padding: '0.85rem 1rem',
                         borderLeft: '3px solid #2563eb', borderRadius: '6px',
                         background: 'rgba(37,99,235,0.07)' }) },
      c: 'That is the whole format: tags, attributes, and content that nests. '
       + 'You now know enough to build any page. Next (2): making it look '
       + 'good, which is where bitwrench stops being a rendering trick and '
       + 'starts being a design system.' },

    { t: 'p',
      a: { class: 'bw_text_muted',
           style: bw.s({ fontSize: '0.85rem', margin: 0 }) },
      c: 'Worth saying again: none of this is embedded-only. bitwrench is a '
       + 'general web UI library and behaves identically in a normal web app. '
       + 'Running it from a board is simply the hardest case, and it happens '
       + 'to be the one where having no build step matters most.' }
  ]
});
</script>
"""


pool, host, port = bw_board.start(
    "1b - TACOs inside TACOs",
    serving="bitwrench from %s (LOCAL BUILD -- see TODO)" % bw_board.WWW,
)
server = Server(pool, "/static", debug=True)


@server.route("/")
def index(request: Request):
    return Response(request, page, content_type="text/html")


@server.route("/js/bitwrench.js")
def bitwrench_js(request: Request):
    # TODO(before-release): delete this route; example 1 should use the CDN.
    return FileResponse(
        request,
        "bitwrench.umd.min.js.gz",
        bw_board.WWW,
        headers={"Content-Encoding": "gzip"},
        content_type="text/javascript",
    )


print("  page size: %d bytes" % len(page))
server.serve_forever(host, port)
