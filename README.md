[![License](https://img.shields.io/badge/License-BSD%202--Clause-blue.svg)](https://opensource.org/licenses/BSD-2-Clause)
[![NPM version](https://img.shields.io/npm/v/bitwrench.svg?style=flat-square)](https://www.npmjs.com/package/bitwrench)
[![Build Status](https://travis-ci.org/deftio/bitwrench.svg?branch=master)](https://travis-ci.org/deftio/fifostr)

[![bitwrench](./images/bitwrench-logo-med.png)](http://www.deftio.com/bitwrench)


## Welcome to bitwrench.js (alpha not fully released yet)

bitwrench is a javascript library for for creating quick demos with almost no depedancies.  It also has handyman functions such as loremIpsum generation, ranged random numbers and interpolaters, and color blenders.  Use it for throwing up quick web pages which don't depend on any server side framework but need a little prettyifcation or for visualizing quick data.  For example when debugging C/C++ embedded projects where we don't want to clutter the build dirs with lots of "weird web stuff" - just write a simple HTML page with bitwrench and still load and view raw text files, JSON, arrays and other bits of embedded files with no extra dependancies.


* **HTML quick emits** -- create HTML objects either client or server side from pure JSON.  useful for making quick components or dynamic content w/o any inline HTML
	* html(["div", {class:"class1 class2", onclick:"myFunction(this)","This is the content"}] 
	* DOM selects and applies e.g. 
		* bw.DOM("h3","tada") // set all "h3" tags to have the content "tada"
		* bw.DOM(".myClass",function(x){... do something on each element described by CSS selector .myClass})
	* supports "deep" hieararchical JSON constructs and arrays
	* registerFunction abilities allow functions to be passed statically to HTML elements (see docs)
	* Useful as a "onefile" framework which an interpret rich JSON in to full web pages.  
* **Color conversions and interpolation**
	* RGB, RGBa, HSL, HSLa, and theme generation both as numeric values also as CSS outputs
* **setting/getting cookies**   
* **pretty printing json**
* **Saving/Loading application data files** (works in both browser or node)
	* save / load files as raw or JSON 
* **Getting URL parameters with defaults**
	* simple parsing of URL params, also can be  used for command line scripts, also packs simple dicts back to URLs.  note that this functionality predated modern URL libs so you might want to use those for modern apps.  However bitwrench versions do work on old browers such as IE8 and iPodTouch 4th generation
* **Data manipulation functions** and other "random" things 
	* numeric interpolation & clipping
	* create multi-d arrays
	* random(4,11) ==> put out a random number in the range 4-11, also provides multidim arrays of random numbers useful for testing tables etc
	* prandom() ==> pseudorandom numbers with range settings,   also provides multidim arrays of random numbers useful for testing tables etc
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
var bw = require('./bitwrench.js');  //adds to current scope
var s = bw.html(["div",{"class":"foo"},"This is some  HTML"]); // now... ===> s = "<div class='foo'>This is some HTML</div>

```

### browser
In the browser bitwrench is loaded like any script library.  Note that parameters can be passed to bitwrench to control the loading process.
bitwrench generates its own default css from javascript and loads those.  You can see these statically in the bitwrench.css file (note that bitwrench.css can also be used standalone without the bitwrench.js library).
```html
<!-- example demo in browser - a complete page, see docs or examples for lists, justifiaction, styles, etc -->
<html>
<head>
<script src="https://unpkg.com/bitwrench/bitwrench.min.js"></script> <!-- get latest version from npm cdn -->
</head>
<body class="bw-def-page-setup bw-font-sans-serif">
<div  style="width:100%,height:100%">we</div>
<script>
    var myHTML = bw.htmla(
		[
			["h1" ,{"class":"bw-h1"},"Demo Area"         ],
			["div",{"class":"foo"}  ,"This is some HTML"],
			["span",{},bw.loremIpsum(230)],
			"<br>",
			["h2", {}, "A Title Area with centered text below"],
			["div",{class:"bw-center"},bw.loremIpsum(200)],
			["h2", {}, "A table of numbers"],
			["div",{}, bw.htmlTable(
			    [
			        ["Col1", "Col2", "Col2"], // just an 2D array 
			        [12, 23, 34],
			        [340,293,230],
			        [49,82,12]
			    ],{sortable:true})]
		]);
	console.log(myHTML);
	bw.DOM("div",myHTML);
</script>
</body>
</html>
```
 

## Source code home  
all source is at github:  
[bitwrench on github](http://github.com/deftio/bitwrench)  


## Linting 
bitwrench uses eslint for static code checking and analysis.  Due to bitwrench's age we've kept ";" as a required part of the linting process.  After running lint you should see no errors or warnings.

```bash
npm install eslint --save-dev

./node_modules/.bin/eslint --init

```
Now run the lint test like this:
```bash
npm run lint
```

## Tests  (requires mocha and chai test suites)  
bitwrench is tested with the mocha framework installed locally using npm along with instanbul for code / line coverage

```bash
npm install mocha --save-dev mocha

```

Run the tests as follows:
```bash
npm run test

```

## Release History  
* 1.2x Initial release  
  
## License  
bitwrench is released under the OSI Approved FreeBSD 2-clause license  

see LICENSE.txt file