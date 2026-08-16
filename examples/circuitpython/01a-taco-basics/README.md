# 1a -- intro to bitwrench and the {taco} format

If you know a little HTML, you already know most of this.

An HTML element has three parts -- a tag, some attributes, and whatever is
inside it. bitwrench writes that same element as a plain JavaScript object,
with three keys named after those parts:

```
<p class="note">Hello</p>

{ t: 'p', a: { class: 'note' }, c: 'Hello' }
  tag      attributes            content
```

That object is a **TACO**. Hand it to bitwrench and you get the element. No
template language, nothing to compile, no build step.

### If you have seen React or Vue

This looks like JSX, and the difference is the whole point.

JSX is *syntax*: a build tool rewrites it into JavaScript before a browser sees
it, which is why those projects need npm, a bundler, and a build step.

A TACO is *data*: an ordinary object you can print, store, build in a loop, or
send over a wire. Nothing transforms it ahead of time.

That is why a microcontroller can produce one. Your board cannot run a bundler,
but it can certainly produce JSON -- which is exactly what the later examples
do.

### If you remember jQuery

You will not be reaching into the page to find elements and poke at them. You
describe what the page should contain, and hand the description over.

The page shows five examples side by side: the object you wrote, the HTML
bitwrench produced from it, and the live element. The middle column is
generated in the browser from the object on the left, so it cannot drift.

**Try it:** change a tag, add an attribute, or edit the text in the `examples`
array, then save and reload.

Next: [1b](../01b-taco-nesting/) -- what happens when TACOs contain other TACOs.

## Run it on your computer first

```
cd 01a-taco-basics
python3 code.py
```

If it says `adafruit_httpserver is not installed`, either
`pip install adafruit-circuitpython-httpserver` or use `../run.sh`, which sets
up a virtualenv for you.

## Put it on a board

1. Copy `bw_board.py` and this `code.py` to the CIRCUITPY drive
2. Copy `settings.toml.example` to the drive as `settings.toml`, fill in your WiFi
3. `circup install adafruit_httpserver`
4. Open the serial console -- it prints the URL to visit

Nothing else goes on the drive. bitwrench comes from the CDN, so the device is
holding one HTML page and a web server -- which is the point of this rung. From
1b on, the board serves bitwrench itself and needs no internet at all.

Works unchanged on ProS3, QT Py ESP32-S3 and Pico 2 W.
