# bitwrench.js

![License](https://img.shields.io/badge/License-BSD%202--Clause-blue.svg) ![NPM version](https://img.shields.io/npm/v/bitwrench.svg?style=flat-square) ![Build Status](https://travis-ci.org/deftio/bitwrench.svg?branch=master)

[![bitwrench](./images/bitwrench-logo-med.png)](http://www.deftio.com/bitwrench)

Welcome to **bitwrench.js** — a lightweight JavaScript library designed for rapid prototyping of web components with minimal dependencies. It allows developers to create HTML structures, style elements, and add event handlers using plain JavaScript objects or JSON, without relying on complex frameworks. bitwrench.js includes handy functions for generating placeholder content, manipulating colors, and handling random data generation, making it ideal for quick web demos or visualizing data, especially in constrained environments like embedded system projects.

Whether you're debugging embedded C/C++ projects or building lightweight web apps, bitwrench.js offers powerful, no-frills tools to help you work efficiently.

### Key Features

- **Dynamic HTML Generation**: Create complex HTML elements and structures directly from JSON objects, making it easy to dynamically generate web content.
  - Example: 
    ```javascript
    bw.html(["div", { class: "container", onclick: "myFunction(this)" }, "This is the content"]);
    ```
  - Support for deep hierarchical structures and arrays.
  - Select and modify DOM elements via CSS selectors:
    ```javascript
    bw.DOM("h3", "Updated content");
    bw.DOM(".myClass", function(el) { /* apply actions */ });
    ```
  - Function registration to bind JavaScript functions to HTML elements.

- **Color Manipulation**: Convert between RGB, RGBA, HSL, and HSLA formats, and interpolate colors. Generate themed colors as both numerical values and CSS-compatible strings.

- **Cookie Handling**: Easily set and retrieve browser cookies.

- **JSON Pretty Printing**: Format and display JSON data for better readability.

- **File Handling (Node and Browser)**: Save and load files as raw data or JSON objects. Useful for quick local storage of application data.

- **URL Parameter Handling**: Parse URL query parameters with defaults. This also works for command-line scripts, and you can pack dictionaries back into URLs.

- **Random Data Functions**: Generate random numbers within a range, including multidimensional arrays of random values for use in data visualization or testing.
  - Example:
    ```javascript
    bw.random(4, 11); // returns a random number between 4 and 11
    ```

- **Logging Utility**: A simple logging system with timestamping, message formatting, and pretty-printing options for raw, HTML, or text-based output. Includes auto-dissolve functionality to streamline logs in production environments.

- **Self-Documenting Code**: Extract function documentation at runtime using `bw.docString("functionName")` to get docstrings for specific functions.

- **Browser Compatibility**: Designed to work in older browsers (e.g., Internet Explorer 7 and later). The generated content is fully compatible with legacy environments where modern frameworks may not be usable.

### Installation

#### Node.js

You can install bitwrench via npm:

```bash
npm install bitwrench --save
```

Use bitwrench in your Node.js applications as follows:

```javascript
const bw = require('bitwrench');
const htmlContent = bw.html(["div", { "class": "example" }, "Hello, bitwrench!"]);
// htmlContent will contain: <div class='example'>Hello, bitwrench!</div>
```

#### Browser

In the browser, include bitwrench.js like any standard script library:

```html
<script src="path/to/bitwrench.js"></script>
```

Bitwrench generates default CSS from JavaScript, though you can also include `bitwrench.css` separately if needed. Here’s a simple example:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <script src="bitwrench.js"></script>
</head>
<body class="bw-def-page-setup bw-font-sans-serif">
    <script>
        const htmlData = [
            ["h1", { class: "bw-h1" }, "Welcome to Bitwrench"],
            ["div", { class: "content" }, "This content is generated using bitwrench.js."]
        ];
        bw.DOMInsertElement("body", bw.html(htmlData), true);
    </script>
</body>
</html>
```

### Example Features

- **HTML Components**: Create and manipulate HTML components entirely from JSON-like objects.
- **Lorem Ipsum Generator**: Generate placeholder text for layouts and prototypes.
- **Color Interpolation**: Dynamically generate gradients or theme-based color schemes.
- **Sortable Tables**: Quickly generate sortable tables from JSON data.
  ```javascript
  bw.htmlTable([
    ["Name", "Age", "Profession", "Favorite Color"],
    ["Alice", 30, "Engineer", { a: { style: "color: red" }, c: "red" }],
    ["Bob", 35, "Teacher", { a: { style: "color: green" }, c: "green" }]
  ], { sortable: true });
  ```

### Running Tests

To ensure the library works as expected, bitwrench uses the Mocha framework with Chai for assertions. Install the test dependencies:

```bash
npm install mocha --save-dev
npm install chai --save-dev
```

Run the tests:

```bash
npm run test
```

### Linting

Bitwrench uses ESLint for static code analysis. Install the linting dependencies and initialize ESLint:

```bash
npm install eslint --save-dev
./node_modules/.bin/eslint --init
```

Then, run the lint tests:

```bash
npm run lint
```

### Release History

- **1.2.x**: Initial release

### License

bitwrench is licensed under the OSI-approved BSD 2-Clause License. For more details, refer to the `LICENSE.txt` file in the repository.

## Further Documentation

- [Quick Docs](./quick-docs.html)
- [Examples](./examples)

### GitHub Repository

Explore the full source code on GitHub: [bitwrench on GitHub](http://github.com/deftio/bitwrench)
