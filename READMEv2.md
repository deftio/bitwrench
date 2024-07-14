# README.md

[![License](https://img.shields.io/badge/License-BSD%202--Clause-blue.svg)](https://opensource.org/licenses/BSD-2-Clause)
[![NPM version](https://img.shields.io/npm/v/bitwrench.svg?style=flat-square)](https://www.npmjs.com/package/bitwrench)
[![Build Status](https://travis-ci.org/deftio/bitwrench.svg?branch=master)](https://travis-ci.org/deftio/bitwrench)

[![bitwrench](./images/bitwrench-logo-med.png)](http://www.deftio.com/bitwrench)

## Welcome to bitwrench.js

bitwrench.js is a JavaScript library for creating quick demos with almost no dependencies. With bitwrench, you can create web pages and components with pure JSON or JavaScript dictionaries, including handlers (e.g., `onclick="...code..."` ==> `onclick:function_ref`), CSS, etc. bitwrench.js also includes utility functions such as loremIpsum generation, ranged random numbers, interpolators, and color blenders. It's perfect for quickly building web pages that don't depend on any server-side framework but need a little beautification or for visualizing data quickly, especially useful in debugging C/C++ embedded projects without cluttering the build directories with extra web stuff.

bitwrench.js is reminiscent of a pre-2011 era, giving it a more jQuery-like feel but with a declarative syntax. See the examples below for more details. bitwrench.js also works in older browsers such as Internet Explorer (v7 and later).

### Features

- **HTML quick emits**: Create HTML objects either client-side or server-side from pure JSON. Useful for making quick components or dynamic content without inline HTML.
  - `html(["div", {class:"class1 class2", onclick:"myFunction(this)"}, "This is the content"])`
  - DOM selection and manipulation, e.g.,
    - `bw.DOM("h3", "tada")` // set all "h3" tags to have the content "tada"
    - `bw.DOM(".myClass", function(x){ ...do something with each element described by CSS selector .myClass })`
  - Supports "deep" hierarchical JSON constructs and arrays.
  - Register functions to be passed statically to HTML elements.
  - Useful as a "one-file" framework that interprets rich JSON into full web pages.
- **Color conversions and interpolation**: Supports RGB, RGBA, HSL, HSLA, and theme generation in both numeric values and CSS outputs.
- **Setting/getting cookies**.
- **Pretty printing JSON**.
- **Saving/Loading application data files**: Works in both browser and Node.js environments. Save/load files as raw or JSON.
- **Getting URL parameters with defaults**: Simple parsing of URL parameters, useful for command-line scripts, and packs simple dictionaries back to URLs. This functionality is compatible with older browsers such as IE8 and iPodTouch 4th generation.
- **Data manipulation functions**: Includes numeric interpolation & clipping, creation of multi-dimensional arrays, random number generation, pseudorandom number generation, and more.
- **Logging**: Features time-stamps, messaging, and pretty printing (raw, HTML, and text). Logging has auto dissolve for logging processes and dumping later or suppressing in 'production'.
- **Built-in docString parsing**: Extracts doc strings from the browser DOM, e.g., `bw.docString("DOM")` gives docString information for that function.
- **Miscellaneous utilities**: Contains many handy functions for quick web development situations, all non-DOM specific calls can be run either server-side or client-side.
- A minified form `bitwrench.min.js` is provided with identical functionality.

## Usage

### Node.js
```bash
# Installation (server-side)
npm install bitwrench --save
```

```javascript
// Usage in Node.js
var bw = require('bitwrench');
var s = bw.html(["div", {"class":"foo"}, "This is some HTML"]);
// s will be "<div class='foo'>This is some HTML</div>"
```

### Browser
In the browser, bitwrench is loaded like any script library. Note that parameters can be passed to bitwrench to control the loading process. bitwrench generates its own default CSS from JavaScript and loads those. You can see these statically in the `bitwrench.css` file (note that `bitwrench.css` can also be used standalone without the `bitwrench.js` library).

Example Page source code:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <script src="bitwrench.js"></script>
</head>
<body class="bw-def-page-setup bw-font-sans-serif">
  <script>
    var htmlData = {
      c: [
        ["h1", {"class":"bw-h1"}, "Bitwrench Test Area"],
        "bitwrench version: " + bw.version().version + "<br><br>",
        ["div", {"class":"foo"}, "This page has HTML content entirely written as JavaScript objects (JSON-like but with support for functions) by content using " + bw.html(["a", {href:"https://github.com/deftio/bitwrench"}, "bitwrench.js"]) + ". Bitwrench has built-in grids, tables, headings, and other quick-and-dirty HTML prototyping tasks. Bitwrench HTML generation runs either client-side or server-side."],
        "<hr>",
        ["h2", "Lorem Ipsum Generator"],
        "Good for testing simple layout ideas.<br><br>",
        ["div", {}, bw.loremIpsum(230)],
        "<hr>",
        ["h2", {}, "Sample Content with 3 Columns"],
        ["div", {"class":"bw-row"}, [
          ["div", {"class":"bw-col-4 bw-left"}, "<h3>Left justified</h3>" + bw.loremIpsum(95)],
          ["div", {"class":"bw-col-4 bw-center bw-pad1"}, "<h3>Centered</h3>" + bw.loremIpsum(95, 3)],
          ["div", {"class":"bw-col-4 bw-right"}, "<h3>Right justified</h3>" + bw.loremIpsum(95, 2)]
        ]],
        "<br><hr>",
        ["h2", {}, "Example Sortable Table"],
        bw.htmlTable([
          ["Name", "Age", "Prof", "Fav Color"],
          ["Sue", 34, "Engineer", {a:{style:"color:red"}, c:"red"}],
          ["Bob", 35, "Teacher", {a:{style:"color:green"}, c:"green"}],
          ["Vito", 23, "Mechanic", {a:{style:"color:blue", onclick:"alert('blue!')"}, c:"blue"}],
          ["Hank", 73, "Retired", {a:{style:"color:purple"}, c:"purple"}]
        ], {sortable:true}),
        "<br><hr>",
        ["h2", {}, "Sample Buttons"],
        "These buttons have function handlers attached.<br><br>",
        ["button", {onclick:"alert('button pressed!')"}, "Alert Button"],
        "&nbsp;&nbsp;",
        ["button", {onclick:myFunc}, "Time Button"],
        "<br><hr>",
        ["h2", "Built in Headings"],
        [1, 2, 3, 4, 5, 6].map(function(x) { return bw.html(["h" + x, "Heading " + x]); }).join(""),
        "<br><hr>",
        ["h2", "Grid System (responsive)"],
        "Grid system (just uses CSS so can use either bitwrench.js loader or just bitwrench.css with no JavaScript). Use -fluid for responsive<br><br>",
        ["style", {}, "\n.boxEv {background-color: #aaa; height: 30px; border-radius:5px; border:1px solid black;}\n.boxOd {background-color: #ddd; height:30px; border-radius:5px; border:1px solid black;}\n"],
        ["div", {class:"bw-row bw-center"}, [
          ["div", {class:"bw-col-1 boxEv"}, "bw-col-1"],
          ["div", {class:"bw-col-1 boxOd"}, "bw-col-1"],
          ["div", {class:"bw-col-1 boxEv"}, "bw-col-1"],
          ["div", {class:"bw-col-1 boxOd"}, "bw-col-1"],
          ["div", {class:"bw-col-1 boxEv"}, "bw-col-1"],
          ["div", {class:"bw-col-1 boxOd"}, "bw-col-1"],
          ["div", {class:"bw-col-1 boxEv"}, "bw-col-1"],
          ["div", {class:"bw-col-1 boxOd"}, "bw-col-1"],
          ["div", {class:"bw-col-1 boxEv"}, "bw-col-1"],
          ["div", {class:"bw-col-1 boxOd"}, "bw-col-1"],
          ["div", {class:"bw-col-1 boxEv"}, "bw-col-1"],
          ["div", {class:"bw-col-1 boxOd"}, "bw-col-1"]
        ]],
        ["div", {class:"bw-row bw-center"}, [
          ["div", {class:"bw-col-2 boxEv"}, "bw-col-2"],
          ["div", {class

:"bw-col-2 boxOd"}, "bw-col-2"],
          ["div", {class:"bw-col-2 boxEv"}, "bw-col-2"],
          ["div", {class:"bw-col-2 boxOd"}, "bw-col-2"],
          ["div", {class:"bw-col-2 boxEv"}, "bw-col-2"],
          ["div", {class:"bw-col-2 boxOd"}, "bw-col-2"]
        ]],
        ["div", {class:"bw-row bw-center"}, [
          ["div", {class:"bw-col-3 boxEv"}, "bw-col-3"],
          ["div", {class:"bw-col-3 boxOd"}, "bw-col-3"],
          ["div", {class:"bw-col-3 boxEv"}, "bw-col-3"],
          ["div", {class:"bw-col-3 boxOd"}, "bw-col-3"]
        ]],
        ["div", {class:"bw-row bw-center"}, [
          ["div", {class:"bw-col-4 boxEv"}, "bw-col-4"],
          ["div", {class:"bw-col-4 boxOd"}, "bw-col-4"],
          ["div", {class:"bw-col-4 boxEv"}, "bw-col-4"]
        ]],
        ["div", {class:"bw-row bw-center"}, [
          ["div", {class:"bw-col-5 boxEv"}, "bw-col-5"],
          ["div", {class:"bw-col-7 boxOd"}, "bw-col-7"]
        ]],
        ["div", {class:"bw-row bw-center"}, [
          ["div", {class:"bw-col-6 boxEv"}, "bw-col-6"],
          ["div", {class:"bw-col-6 boxOd"}, "bw-col-6"]
        ]],
        ["div", {class:"bw-row bw-center"}, [
          ["div", {class:"bw-col-7 boxEv"}, "bw-col-7"],
          ["div", {class:"bw-col-5 boxOd"}, "bw-col-5"]
        ]],
        ["div", {class:"bw-row bw-center"}, [
          ["div", {class:"bw-col-8 boxEv"}, "bw-col-8"],
          ["div", {class:"bw-col-4 boxOd"}, "bw-col-4"]
        ]],
        ["div", {class:"bw-row bw-center"}, [
          ["div", {class:"bw-col-9 boxEv"}, "bw-col-9"],
          ["div", {class:"bw-col-3 boxOd"}, "bw-col-3"]
        ]],
        ["div", {class:"bw-row bw-center"}, [
          ["div", {class:"bw-col-10 boxEv"}, "bw-col-10"],
          ["div", {class:"bw-col-2 boxOd"}, "bw-col-2"]
        ]],
        ["div", {class:"bw-row bw-center"}, [
          ["div", {class:"bw-col-11 boxEv"}, "bw-col-11"],
          ["div", {class:"bw-col-1 boxOd"}, "bw-col-1"]
        ]],
        ["div", {class:"bw-row bw-center"}, [
          ["div", {class:"bw-col-12 boxEv"}, "bw-col-12"]
        ]],
        "<br><hr>",
        ["h2", {}, "Simple Sign"],
        ["div", {style:"padding:10%; border:1px solid black;"}, bw.htmlSign("This is a big sign!")],
        "<br><hr>",
        ["h2", {}, "Tabbed Content"],
        bw.htmlTabs([
          ["Tab1", bw.loremIpsum(300)],
          ["Tab2", bw.loremIpsum(300, 20)],
          ["Tab3", bw.loremIpsum(300, 50)]
        ], {tab_atr:{style:""}}),
        "<br>"
      ]
    };

    bw.DOMInsertElement("body", bw.html(htmlData), true);
    function myFunc(x) {
      return x.innerHTML = (new Date()).toLocaleTimeString();
    }

    bw.DOMInsertElement("head", bw.html(bw.htmlFavicon("\u266C", "teal"))); // Insert a favicon on the top tab of the page, "X" for a single letter
    bw.DOMInsertElement("head", bw.html({t:"title", c:"Bitwrench HTML Gen "})); // Insert a page title on the browser tab
  </script>
</body>
</html>
```

## Source Code Home
All source is available at GitHub:  
[bitwrench on GitHub](http://github.com/deftio/bitwrench)

## Linting
bitwrench uses ESLint for static code checking and analysis. Due to bitwrench's age, ";" is a required part of the linting process. After running lint, you should see no errors or warnings.

```bash
npm install eslint --save-dev
./node_modules/.bin/eslint --init
```

Now run the lint test:
```bash
npm run lint
```

## Tests (requires Mocha and Chai test suites)
bitwrench is tested with the Mocha framework installed locally using npm along with Istanbul for code/line coverage.

```bash
npm install mocha --save-dev mocha
```

Run the tests:
```bash
npm run test
```

## Release History
- 1.2.x: Initial release

## License
bitwrench is released under the OSI Approved FreeBSD 2-clause license.  
See LICENSE.txt file.