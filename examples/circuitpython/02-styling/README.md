# 2 -- making it look good

There is no CSS file in this project. There is no CSS file in *any* of these
projects. That is not an oversight -- it is the point of this rung.

You style a TACO in three ways, smallest to largest:

```js
a: { style: bw.s({ color: 'red' }) }     // 1. an inline style
a: { class: 'bw_text_center' }           // 2. a class that already ships
bw.loadStyles({ primary: '#2563eb' })    // 3. the theme
```

The first two are what you would expect. The third is the one worth
understanding.

Note what is *not* in that list: a `<ul>`, an `<hr>`, a heading and a paragraph
all look right with no class on them at all. You reach for a class when you want
something other than the default -- not to repair one.

## One colour becomes a palette

You hand `loadStyles` a single seed colour. bitwrench derives the rest --
hover and active states, borders, focus rings, light and dark variants, and a
text colour with enough contrast to read against each one -- then generates the
stylesheet at run time and injects it.

```js
var styles = bw.loadStyles({ primary: '#2563eb' });
styles.palette.primary.base     // '#2563eb'   the colour you gave it
styles.palette.primary.hover    // '#134cca'   derived
styles.palette.primary.light    // a tint, for backgrounds
styles.palette.primary.border   // for outlines
styles.palette.primary.textOn   // '#fff' or '#000', whichever you can read
```

`palette` has a dozen keys -- `primary`, `secondary`, `success`, `danger`,
`warning`, `info`, `surface`, `background` and so on. Every one of the styled
elements in the example reads its colours from that object, so changing the
seed re-brands the entire page.

For a device this matters more than it sounds. There is no stylesheet to copy
to flash and no build step to regenerate one. The theme is a few hundred bytes
of configuration; the CSS is computed in the browser.

## Interactivity, while we are here

An event handler is just another attribute:

```js
{ t: 'button', a: { onclick: function () { seed = '#c2410c'; render(); } },
  c: 'Rust' }
```

`render()` is an ordinary function that rebuilds the TACO and calls
`bw.DOM('#app', ...)` again. That is the whole update model -- no reactivity, no
dependency tracking, no diffing. Something changed, so you redraw. On a page
this size you will not see it happen.

**Try it:** click the colour buttons, then the dark-mode button. Then change one
of the entries in the `SEEDS` array at the top of the script and reload.

Next: **3** -- the device stops sending a page and starts sending the UI itself,
as JSON.

> None of this is embedded-only. bitwrench is a general-purpose web UI library
> and behaves identically in a normal web app. Running it from a board is just
> the hardest case, and the one where having no build step matters most.

## Run it on your computer first

```
cd 02-styling
python3 code.py
```

If it says `adafruit_httpserver is not installed`, either
`pip install adafruit-circuitpython-httpserver` or use `../run.sh`, which sets
up a virtualenv for you.

## Put it on a board

1. Copy `bw_board.py` and this `code.py` to the CIRCUITPY drive
2. Copy `settings.toml.example` to the drive as `settings.toml`, fill in your WiFi
3. `circup install adafruit_httpserver`
4. Copy `dist/bitwrench.umd.min.js.gz` to `/www/` on the drive (44.8KB)
5. Open the serial console -- it prints the URL to visit

From this example on, the board serves bitwrench itself rather than pointing at
a CDN, so the page works with no internet at all -- including when the board is
its own access point.

Works unchanged on ProS3, QT Py ESP32-S3 and Pico 2 W.
