# 1b -- TACOs inside TACOs

1a showed that one object makes one element. This adds the only other rule you
need: the `c` key can hold a string, another TACO, or an array of them.

```
{ t: 'div', c: [                    <div>
  { t: 'h3', c: 'Title' },            <h3>Title</h3>
  { t: 'p',  c: 'Body' }              <p>Body</p>
]}                                  </div>
```

That is enough to build a whole page, because HTML is just elements inside
elements. The example works through six cases, ending with children built from
an array.

That last one is the part that tends to land: because a TACO is an ordinary
object, ordinary code builds one. Four sensor readings become four `<li>`
elements with `.map()` -- no directive, no `{{ handlebars }}`, no `v-for`. If
you have written JSX you already do this; the difference is that here you are
building an array of objects rather than markup a compiler has to translate.
You can `console.log` the result, or `JSON.stringify` it and send it over a
socket -- which is what example 3 does from the board.

**Try it:** add an entry to the `pins` array and reload. The list grows; nothing
else changes.

Next: **2** -- styling, where bitwrench stops being a rendering trick and
starts being a design system.

> None of this is embedded-only. bitwrench is a general-purpose web UI library
> and behaves identically in a normal web app. Running it from a board is just
> the hardest case, and the one where having no build step matters most.

## Run it on your computer first

```
cd 01b-taco-nesting
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

Works unchanged on ProS3, QT Py ESP32-S3 and Pico 2 W.

---

> **TODO(before-release):** this example is temporarily served from the locally
> built bitwrench so a full build and test pass exercises it against the working
> tree. It is meant to load from the CDN -- that is the point of 1a, the device
> holding almost nothing. Restore the CDN tag and drop the `/www` step before
> publishing. See `dev/embedded-tutorial-2.1.x.md`.
