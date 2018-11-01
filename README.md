[![License](https://img.shields.io/badge/License-BSD%202--Clause-blue.svg)](https://opensource.org/licenses/BSD-2-Clause)
![NPM version](http://img.shields.io/npm/v/bitwrench.svg?style=flat-square)

[![bitwrench](./images/bitwrench-logo-med.png)](http://www.deftio.com/bitwrench)

## Welcome to bitwrench.js (alpha not fully released yet)

(c) 2012- manu chatterjee 


bitwrench is a javascript library for useful functions such as:


* HTML quick emits -- create a sortable table from a 2d array, create tabs, create HTML documents declaratively
* color conversions and interpolation
* setting/getting cookies   
* a better typeof operator  
* pretty printing json
* saving/loading application data files (works in both browser or node)
* getting URL parameters with defaults
* some data manipulation functions and other "random" things (interpolation, clipping, multi-d arrays, random())
* logging with dissolve (bw.log, bw.logd, bw.logExport)
* built-in docString support


There is no great structure here, just a bunch of kitchen sink things that seemed to be handy in alot of quick web dev situations.    All non-dom specific calls can be run either server side or client side.

Of course your mileage may very..

A minified form bitwrench.min.js is provided with identical functionality

## Usage 

### node.js
```
#Installation (server side)  
npm install bitwrench --save 

//usage in nodejs
var bw = require('./bitwrench.js')["bw"];  //adds to current scope

```

### browser

```
//usage in browser
<script type="text/javascript" src="./bitwrench.min.js"></script>

<script>
console.log(bw.version());  // print bitwrench.js version installed
</script>
```
 
    
## Examples
See [Examples](./examples) folder  
Docs (auto generated) are here: [quick-docs](./quick-docs.html)
## Source code home  
all source is at github:  
http://github.com/deftio/bitwrench  


## Linting 
bitwrench uses eslint for static code checking and analysis.

```
npm install eslint --save-dev

./node_modules/.bin/eslint --init

```
Now run the lint test like this:
```
./node_modules/.bin/eslint bitwrench.js   
```

## Tests  (requires mocha and chai test suites)  
bitwrench is tested with the mocha framework installed locally using npm

```
npm install mocha --save-dev mocha

```

Run the tests as follows:
```
./node_modules/mocha/bin/mocha test/bitwrench_test.js --reporter spec

```

## Release History  
* 1.1 Initial release  
  
## License  
bitwrench is released under the OSI Approved FreeBSD 2-clause license  

Copyright (c) 2011-18, M. A. Chatterjee <deftio at deftio dot com>  
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




