[![License](https://img.shields.io/badge/License-BSD%202--Clause-blue.svg)](https://opensource.org/licenses/BSD-2-Clause)
[![NPM version](https://img.shields.io/npm/v/bitwrench.svg?style=flat-square)](https://www.npmjs.com/package/bitwrench)
[![Build Status](https://travis-ci.org/deftio/bitwrench.svg?branch=master)](https://travis-ci.org/deftio/fifostr)

[![bitwrench](./images/bitwrench-logo-med.png)](http://www.deftio.com/bitwrench)


## Welcome to bitwrench.js 

bitwrench.js is a javascript library for for creating quick demos with almost no depedancies.  With bitwrench one can create web pages and components with pure json or javascript dictionaries including handlers (e.g. onclick="...code.." ==> onclick:function_ref, css , etc. )
bitwrench.js also has handyman functions such as loremIpsum generation, ranged random numbers and interpolaters, and color blenders.  Use it for throwing up quick web pages which don't depend on any server side framework but need a little prettyifcation or for visualizing quick data.  For example when debugging C/C++ embedded projects where we don't want to clutter the build dirs with lots of "weird web stuff" - just write a simple HTML page with bitwrench and still load and view raw text files, JSON, arrays and other bits of embedded files with no extra dependancies.

For those used to modern frameworks such as react / vue / svelte etc.  bitwrench.js comes from a pre 2011 time period - so it has more of a jquery like feel, but with a declaritve syntax.  See example code and page below for more.  bitwrench.js does work in older browsers such Internet Explorer (v7 and later).


### Features

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

other examples here:
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
[Example Page](./examples/example5.html) source code here:

```html

<!DOCTYPE html>
<html lang="en">
<head>
<script src="../bitwrench.js" ></script>
</head>
<body class="bw-def-page-setup bw-font-sans-serif">
<script>
var htmlData = {c: //for more on the format, see docs github.com/deftio/bitwrench
 [
   ["h1" ,{"class":"bw-h1"},"Bitwrench Test Area"  ],
   "bitwrench version: "+bw.version().version +"<br><br>",
   ["div",{"class":"foo"}  ,"This page has HTML content which is entirely written as Javascript objects (JSON-like but with support for functions) by content using "+bw.html(["a",{href:"https://github.com/deftio/bitwrench"},"bitwrench.js"])+". Bitwrench has built-in grids, tables,headings, and other quick-n-dirty html prototyping tasks.  Bitwrench html generation runs either client or server side."],
   "<hr>",
  ["h2","Lorem Ipsum Generator"],
  "Good for testing simple layout ideas.<br><br>",
  ["div",{},bw.loremIpsum(230)],
  "<hr>",
  ["h2",{},"Sample Content with 3 Columns"],
    ["div",{"class":"bw-row"}, 
      [ 
      ["div",{"class":"bw-col-4 bw-left "},"<h3>Left justified</h3>"+bw.loremIpsum(95)], //mix text and html freely
      ["div",{"class":"bw-col-4 bw-center bw-pad1"},"<h3>Centered</h3>"+bw.loremIpsum(95,3)], 
      ["div",{"class":"bw-col-4 bw-right "},"<h3>Right justified</h3>"+bw.loremIpsum(95,2)],
      ],
    ], 
  "<br><hr>",
  ["h2", {}, "Example Sortable Table"],
  bw.htmlTable( // json to table (note table data can be  functions as well)
    [
      ["Name","Age", "Prof", "Fav Color"], // just an 2D array 
      ["Sue", 34, "Engineer", {a:{style:"color:red"},c:"red"}], // inline json-html objects
      ["Bob" ,35, "Teacher",  {a:{style:"color:green"},c:"green"}],
      ["Vito",23, "Mechanic", {a:{style:"color:blue",onclick:"alert('blue!')"},c:"blue"}],
      ["Hank",73, "Retired",  {a:{style:"color:purple"},c:"purple"}]
    ],{sortable:true}),
   "<br><hr>",
   ["h2",{},"Sample Buttons"],
   "These buttons have function handlers attached.<br><br>",
   ["button",{onclick:"alert('button pressed!')"},"Alert Button"], // staight js
   "&nbsp;&nbsp;",
   ["button",{onclick:myFunc},"Time Button"], // bitwrench maps and registers event functions
   "<br><hr>",
   ["h2","Built in Headings"],
   [1,2,3,4,5,6].map( function(x){return bw.html(["h"+x,"Heading "+x])}).join(""), // Headings
   "<br><hr>",
   ["h2","Grid System (responsive)"],
   "Grid system (just uses css so can use either bitwrench.js loader or just bitwrench.css with no javascript.  Use -fluid for responsive<br><br>",
   ["style",{},"\n.boxEv {background-color: #aaa; height: 30px; border-radius:5px; border:1px solid black;}\n.boxOd {background-color: #ddd; height:30px; border-radius:5px;border:1px solid black;;}\n"], // some styles (note bw has CSS generation shown in another example)
   ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-1 boxEv"},c:"bw-col-1"},{a:{class:"bw-col-1 boxOd"},c:"bw-col-1"},{a:{class:"bw-col-1 boxEv"},c:"bw-col-1"},{a:{class:"bw-col-1 boxOd"},c:"bw-col-1"},{a:{class:"bw-col-1 boxEv"},c:"bw-col-1"},{a:{class:"bw-col-1 boxOd"},c:"bw-col-1"},{a:{class:"bw-col-1 boxEv"},c:"bw-col-1"},{a:{class:"bw-col-1 boxOd"},c:"bw-col-1"},{a:{class:"bw-col-1 boxEv"},c:"bw-col-1"},{a:{class:"bw-col-1 boxOd"},c:"bw-col-1"},{a:{class:"bw-col-1 boxEv"},c:"bw-col-1"},{a:{class:"bw-col-1 boxOd"},c:"bw-col-1"}]],
   ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-2 boxEv"},c:"bw-col-2"},{a:{class:"bw-col-2 boxOd"},c:"bw-col-2"},{a:{class:"bw-col-2 boxEv"},c:"bw-col-2"},{a:{class:"bw-col-2 boxOd"},c:"bw-col-2"},{a:{class:"bw-col-2 boxEv"},c:"bw-col-2"},{a:{class:"bw-col-2 boxOd"},c:"bw-col-2"}]],
   ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-3 boxEv"},c:"bw-col-3"},{a:{class:"bw-col-3 boxOd"},c:"bw-col-3"},{a:{class:"bw-col-3 boxEv"},c:"bw-col-3"},{a:{class:"bw-col-3 boxOd"},c:"bw-col-3"}]],
   ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-4 boxEv"},c:"bw-col-4"},{a:{class:"bw-col-4 boxOd"},c:"bw-col-4"},{a:{class:"bw-col-4 boxEv"},c:"bw-col-4"}]],
   ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-5 boxEv"},c:"bw-col-5"},{a:{class:"bw-col-7 boxOd"},c:"bw-col-7"}]],
   ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-6 boxEv"},c:"bw-col-6"},{a:{class:"bw-col-6 boxOd"},c:"bw-col-6"}]],
   ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-7 boxEv"},c:"bw-col-7"},{a:{class:"bw-col-5 boxOd"},c:"bw-col-5"}]],
   ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-8 boxEv"},c:"bw-col-8"},{a:{class:"bw-col-4 boxOd"},c:"bw-col-4"}]],
   ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-9 boxEv"},c:"bw-col-9"},{a:{class:"bw-col-3 boxOd"},c:"bw-col-3"}]],
   ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-10 boxEv"},c:"bw-col-10"},{a:{class:"bw-col-2 boxOd"},c:"bw-col-2"}]],
   ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-11 boxEv"},c:"bw-col-11"},{a:{class:"bw-col-1 boxOd"},c:"bw-col-1"}]],
   ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-12 boxEv"},c:"bw-col-12"}]],

   "<br><hr>",
   ["h2",{},"Simple Sign"],
   ["div",{style:"padding:10%; border:1px solid black;"},bw.htmlSign("This is a big sign!")],
   "<br><hr>",
   ["h2",{},"Tabbed Content"],
     bw.htmlTabs([
        ["Tab1",bw.loremIpsum(300)],
      ["Tab2",bw.loremIpsum(300,20)],
      ["Tab3",bw.loremIpsum(300,50)]],{tab_atr:{style:""}}) ,
   "<br>",
 ]};
 
bw.DOMInsertElement("body",bw.html(htmlData),true);
function myFunc(x){return x.innerHTML = (new Date()).toLocaleTimeString();} // button function


bw.DOMInsertElement("head",bw.html(bw.htmlFavicon("\u266C","teal"))); //  insert a favicon on the top tab of the page, "X" for a single letter
bw.DOMInsertElement("head",bw.html({t:"title",c:"Bitwrench HTML Gen "})); // insert a page title on the browser tab
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