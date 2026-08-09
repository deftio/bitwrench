# bitwrench on CircuitPython -- 1a: one object, one element
#
# The device serves one HTML page. bitwrench comes from a CDN, so the device
# holds almost nothing: a shell and a UI description.
#
# Try this: edit the TACO objects near the bottom, save, and reload the page.
# You are editing the UI, not HTML.
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
        "\n  Easiest:  ../run.sh 1        (sets up a virtualenv for you)"
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

# The page below is one long string. `page` holds it; Python convention names
# module-level constants in capitals, which is why you often see PAGE in
# CircuitPython code -- either is fine.
#
# bitwrench is loaded from a CDN, pinned to the v2 line so this keeps working
# as new releases ship.

page = """<!doctype html><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>TACO basics</title>
<link rel=icon href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' rx='3' fill='%232563eb'/></svg>">
<script src="/js/bitwrench.js"></script>
<div id=app></div>
<script>
bw.loadStyles({ primary: '#2563eb' });

// =========================================================================
// START WITH SOMETHING YOU ALREADY KNOW
//
// This is HTML:
//
//     <p class="note">Hello</p>
//      ^   ^            ^
//      |   |            +--  what is inside it   (content)
//      |   +---------------  its attributes
//      +-------------------  its tag
//
// bitwrench writes the same element as a plain JavaScript object, with three
// keys named after those three parts:
//
//     { t: 'p', a: { class: 'note' }, c: 'Hello' }
//       tag      attributes            content
//
// That object is a TACO. Hand it to bitwrench and you get the element.
// There is no template language and nothing to compile.
//
// -------------------------------------------------------------------------
// IF YOU HAVE SEEN REACT OR VUE
//
// This may look like JSX. It is not, and the difference is the whole point.
//
// JSX is *syntax*. A build tool reads it and rewrites it into JavaScript
// before a browser ever sees it, which is why those projects need npm, a
// bundler, and a build step.
//
// A TACO is *data*. It is an ordinary object -- you can print it, store it,
// build it in a loop, save it to a file, or send it over a wire. Nothing
// transforms it ahead of time.
//
// That difference is why a microcontroller can produce one. A device cannot
// run a bundler, but it can absolutely produce JSON. Later examples do exactly
// that: your board builds a Python dict and the browser renders it.
//
// -------------------------------------------------------------------------
// IF YOU REMEMBER JQUERY
//
// You will not be reaching into the page to find an element and poke at it.
// You describe what the page should contain and hand the description over.
// =========================================================================


// Each entry below is one TACO. The page shows you three things for each:
// the object you wrote, the HTML bitwrench produced from it, and the live
// element itself. Nothing is precomputed -- the middle column is generated
// from the object on the left, in your browser, as the page loads.

var examples = [
  {
    note: 'A tag and some text.',
    taco: { t: 'h3', c: 'Hello' }
  },
  {
    note: 'Any tag works -- this is the same object with a different t.',
    taco: { t: 'button', c: 'Click me' }
  },
  {
    note: 'The a key holds attributes, exactly as you would write them in HTML.',
    taco: { t: 'a', a: { href: 'https://example.com' }, c: 'A link' }
  },
  {
    note: 'class is just another attribute. These class names ship with bitwrench.',
    taco: { t: 'p', a: { class: 'bw_text_muted' }, c: 'Muted text' }
  },
  {
    note: 'Leave out c and you get an empty element, like an input.',
    taco: { t: 'input', a: { placeholder: 'Type here' } }
  }
];

// ---- Everything below just draws the table. Come back to it later. -------

function codeCell(text) {
  return { t: 'td',
           a: { style: bw.s({ padding: '0.6rem 0.75rem', verticalAlign: 'top',
                              fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
                              fontSize: '0.8rem', whiteSpace: 'pre-wrap',
                              borderBottom: '1px solid rgba(0,0,0,0.10)' }) },
           c: text };
}

function headCell(text) {
  return { t: 'th',
           a: { style: bw.s({ padding: '0.6rem 0.75rem', textAlign: 'left',
                              fontSize: '0.75rem', letterSpacing: '0.04em',
                              textTransform: 'uppercase', color: '#5b6472',
                              borderBottom: '2px solid rgba(0,0,0,0.15)' }) },
           c: text };
}

var rows = examples.map(function (ex) {
  return {
    t: 'tr',
    c: [
      // 1. the object, printed as text
      codeCell(JSON.stringify(ex.taco, null, 1)),
      // 2. the HTML bitwrench made from it. bw.html() returns a string, and
      //    bitwrench escapes text content by default -- so the markup shows up
      //    as characters instead of turning into elements. That default is why
      //    user text can never accidentally become HTML.
      codeCell(bw.html(ex.taco)),
      // 3. the real element
      { t: 'td',
        a: { style: bw.s({ padding: '0.6rem 0.75rem', verticalAlign: 'top',
                           borderBottom: '1px solid rgba(0,0,0,0.10)' }) },
        c: ex.taco }
    ]
  };
});

var notes = examples.map(function (ex, i) {
  return { t: 'li', a: { style: bw.s({ marginBottom: '0.35rem' }) },
           c: (i + 1) + '. ' + ex.note };
});

// These are plain CSS classes that ship inside the bitwrench file loaded
// above -- no hand-tuned pixel values needed:
//
//   bw_bccl_container  centres the page and caps its width (1140px on a
//                      wide screen, full width on a phone)
//   bw_vstack          stacks the children in a column
//   bw_gap_4           puts even spacing between them
bw.DOM('#app', {
  t: 'div',
  a: { class: 'bw_bccl_container bw_vstack bw_gap_4',
       style: bw.s({ paddingTop: '1.5rem', paddingBottom: '2rem' }) },
  c: [
    { t: 'header', c: [
      { t: 'h1', c: 'One object, one element' },
      { t: 'p', c: 'Every row below started as a JavaScript object in code.py. '
                 + 'The middle column is what bitwrench built from it, and the '
                 + 'right column is that element, live on this page.' }
    ]},
    { t: 'table',
      a: { style: bw.s({ width: '100%', borderCollapse: 'collapse',
                         background: '#fff', borderRadius: '10px',
                         overflow: 'hidden',
                         border: '1px solid rgba(0,0,0,0.12)' }) },
      c: [
        { t: 'thead', c: { t: 'tr', c: [
            headCell('the object you wrote'),
            headCell('the HTML it produced'),
            headCell('the element itself') ] } },
        { t: 'tbody', c: rows }
      ]},
    { t: 'div', c: [
      { t: 'h2', c: 'What to notice' },
      { t: 'ul', c: notes }
    ]},
    { t: 'p',
      a: { style: bw.s({ margin: 0, padding: '0.85rem 1rem',
                         borderLeft: '3px solid #2563eb', borderRadius: '6px',
                         background: 'rgba(37,99,235,0.07)' }) },
      c: 'Try it: change a tag, add an attribute, or edit the text in the '
       + 'examples array, then save and reload. Next (1b): what happens when '
       + 'you put TACOs inside other TACOs.' },

    { t: 'p',
      a: { class: 'bw_text_muted',
           style: bw.s({ fontSize: '0.85rem', margin: 0 }) },
      c: 'Nothing here is embedded-specific -- bitwrench is an ordinary web '
       + 'UI library and works the same in a normal web app. This series just '
       + 'happens to run it from a microcontroller, because that is where a '
       + 'no-build-step library earns its keep.' }
  ]
});
</script>
"""


pool, host, port = bw_board.start(
    "1a - one object, one element",
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
