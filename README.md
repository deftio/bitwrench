[![License](https://img.shields.io/badge/License-BSD%202--Clause-blue.svg)](https://opensource.org/licenses/BSD-2-Clause)
[![NPM version](https://img.shields.io/npm/v/bitwrench.svg?style=flat-square)](https://www.npmjs.com/package/bitwrench)

[![bitwrench](./images/bitwrench-logo-med.png)](http://www.deftio.com/bitwrench)

## Welcome to bitwrench.js (alpha not fully released yet)

bitwrench is a javascript library for useful demo hacking and misc kitchen sink operations.  Use it for throwing up quick web pages which don't depend on any server side framework but need a little prettyifcation or for visualizing quick data.  For example when debugging C/C++ embedded projects where we don't want to clutter the build dirs with lots of "weird web stuff" - just write a simple HTML page with bitwrench and still load/debug raw text files, JSON, arrays and other bits of embedded files with no extra dependancies.


* **HTML quick emits** -- create HTML objects either client or server side from pure JSON.  useful for making quick components or dynamic content w/o any inline HTML
	* html(["div", {class:"class1 class2", onclick:"myFunction(this)","This is the content"}] 
	* DOM selects and applies e.g. 
		* bw.DOM("h3","tada") // set all <h3> tags to have the content "tada"
		* bw.DOM(".myClass",function(x){... do something on each element described by CSS selector .myClass})
	* supports "deep" hieararchical JSON constructs and arrays
	* registerFunction abilities allow functions to be passed statically to HTML elements (see docs)
* **Color conversions and interpolation**
	* RGB, RGBa, HSL, HSLa, and theme generation both as numeric values also as CSS outputs
* **setting/getting cookies**   
* **pretty printing json**
* **Saving/Loading application data files** (works in both browser or node)
	* save / load files as raw or JSON 
* **Getting URL parameters with defaults**
	* simple parsing of URL params, also can be  used for command line scripts
* **Data manipulation functions** and other "random" things (interpolation, clipping, multi-d arrays, random())
* **Logging** with time-stamps, messaging, and pretty printing (raw, HTML, and text) 
	* Logging also has auto dissolve so one can log a process and then dump later or suppress in 'production'
* **Built-in docString parsing** with extraction support 
	* bitwrench.js self-documents in that from the browser DOM one can pull out a given function's doc strings such as bw.docString("DOM") ==> gives docString inforfor that function.
	* note that bitwrench.min.js strips comments so built-in help is not available.


There is no great structure here, just a bunch of kitchen sink things that seemed to be handy in alot of quick web dev situations.    All non-dom specific calls can be run either server side or client side.

A minified form bitwrench.min.js is provided with identical functionality

## Usage 
See the quick docs here:
[bitwrench quick docs](./quick-docs.html)

or examples here:
[bitwrench examples](./examples)

### node.js
```bash
#Installation (server side)  
npm install bitwrench --save 
```

```javascript
//usage in nodejs
var bw = require('./bitwrench.js')["bw"];  //adds to current scope

```

### browser
In the browser bitwrench is loaded like any script library.  Note that parameters can be passed to bitwrench to control the loading process.
```html
//usage in browser
<script type="text/javascript" src="./bitwrench.min.js"></script>

<script>
console.log(bw.version());  // print bitwrench.js version installed
</script>
```
 

## Source code home  
all source is at github:  
[bitwrench on github](http://github.com/deftio/bitwrench)  


## Linting 
bitwrench uses eslint for static code checking and analysis.

```bash
npm install eslint --save-dev

./node_modules/.bin/eslint --init

```
Now run the lint test like this:
```bash
./node_modules/.bin/eslint bitwrench.js   
```

## Tests  (requires mocha and chai test suites)  
bitwrench is tested with the mocha framework installed locally using npm

```bash
npm install mocha --save-dev mocha

```

Run the tests as follows:
```bash
./node_modules/mocha/bin/mocha test/bitwrench_test.js --reporter spec

```

## Release History  
* 1.1x Initial release  
  
## License  
bitwrench is released under the OSI Approved FreeBSD 2-clause license  

Copyright (c) 2011-19, M. A. Chatterjee <deftio at deftio dot com>  
All rights reserved.  
  
Redistribution and use in source and binary forms, with or without  
modification, are permitted provided that the following conditions are met:  
  
* Redistributions of source code must retain the above copyright notice, this  
  list of conditions and the following disclaimer.  

* Redistributions in binary form must reproduce the above copyright notice,  
  this list of conditions and the following disclaimer in the documentation  
  and/or other materials provided with the distribution.  

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"  
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE  
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE  
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE  
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL  
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR  
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER  
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,  
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE  
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.  




