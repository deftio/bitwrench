# bitwrench.js todo list  
(c) 2012-2019 manu chatterjee 
 			  deftio (at) deftio (dot) com

This list is used for internal ideas, housekeeping, checklists and notes

## features
	[x] typeOf
	[o] getURLParam fails test case where URL param contains # character
	[x] bw.html formelry buildHTMLObjecStr (note rename)
		add pretty print option (prettyPrint : true) --> adds tabbed || space beginning, \n in output for readability.
	[x] makeHTMLTable (also add sort, style examples)
		[ ] support adding column headers to makeHTMLTable as option ==> {header_content: [,,,]}
	[x] makeHTMLTabs()
	[x] makeHTMLList()  ==> bulleted or numerical list
 	[x] table HTML sort support (needs alpha num fix)
	[x] get/save cookie
	[x] save/store file 
		make params for JSON, CSV, function(provide parser), raw 
	[x] typeOf
	[ ] prettyPrintJSON with stylizble CSS
		settable tab widths (use padding:<width><units>)
		allow prettyPrint of functions and member-functions
		allow functions to print correctly
	[o] find/set css class name on supplied element (bw.markElement)  clean this up
	[ ] encode/decode var info in to a CSS classname (see spannit.js)
	[ ] find classes by encoded var name (returns array of hits)
		note bw.markElement does some of this
	[x] xformScaleSig   #sigmoidal scale, linear, constrain
	[0] xformScalePow   #power scale ==> remove
	[x] clip 
	[x] setIntervalX // rename repeatN() ?
	[*] repeatUntil   --> needs usability clean up
	[x] randomNum in (x,y, float_or_int)
	[x] pseudoRandom gen (prandom())
	[ ] sha256 (can be used of psuedoRandom gen)
	[x] multidim array quick generator
	[x] loremIpsum quick generator
 	[x] bwSimpleStyles
 	[x] bwSimpleThemes -- note it should work on the examples / docs page w/o problems
 		use args (a.g. bwargs-loadSimpleTheme:themeIndex;
 	[x] docString()
 		support jsdoc style comments, export as JSON or prettyHTML
 		allow man style export e.g. doc string params ==> array of vars [] ==> nice text output 
 	[x] simple logging control to a stream (e.g. bw.log(...) with settable function)
 	[x] isHexStr 
 	[ ] graphMatrixAsImage (use canvas, also allow export as png)
 	[ ] save canvas as data:url (show example with save as button)
 	[ ] color conversions, interpolate colors (used in themes, graphMatrix)
 	[x] command line processing via <script bwargs="arg1:val1;arg2:val2">  # also works from URL param, can be disabled here as well 
 	[ ] simple boolean search of text object.  (TBD: jado and frabjousmix support this)
 	[x] pad strings (used in logExport({exportFormat:"text"}))
 	[ ] bitwrench-server.js / bitwrench-server.php / bitwrench-server.py - simple server for receiving JSON encoded data
 	[ ] in options (bw.html) allow non-closed tags e.g. bw.html(["meta",{keywords:"foo, bar"},null,{tagClose:false}]) // default is tagClose:true
 	[ ] in options (bw.html) allow attribs with no value e.g. bw.html(["special tag", {type:"javascript", specialTag:null},null])
 	[ ] in options (bw.html) null for content means no content e.g.g <tag></tag>
 	[ ] in options (bw.html) tagSingle:true generates this <tag /> instead of <tag></tag> as long as content is null (attributes of course are allowed)


## packaging and todo
	[o] build script # currently using gnu make --> migrated to just using NPM
	[ ] build script should fail building new package if either lint or tests fail (e.g. make script exit conditional)
	[x] README.md
	[ ] index.html should be auto-gen'd from README.md (but include bitwrench.js)
	[x] npm register
	[x] npm install 
	[x] minify (yes, using uglifyjs)
	[ ] tests, coverage -- make sure all functions get tested
	[x] linting - JSHint or ESLint
	[x] "use strict";
	[ ] api ref docs
	[ ] examples 
	[ ] pure JSON page generation
	[ ] example of using YAML instead of JSON
	[x] dir structure
	[x] license
	[x] github
	[x] deftio.com/bitwrench pages  ==> move to deftio/opensource/bitwrench ?
	[x] build notes
	[x] rename to bitwrench
	[ ] npm release (already an npm package)
	[ ] support inline logo for example favicons: <img src="data:image/png;base64,base64encoded images" /> 
	[ ] full UMD support (cjs / require / AMD / import / browser)

## Issues and clean up
 	* bw.bwSimpleThemes has cosmetic issues
	* repeatUntil usabilitiy issues
	* make internal function for commonly used:
		a = bw.typeOf(a) == "type" ? true_value : false_value
		==>
		_toa(a,typeString | [typeString1, typeString2]) ==> {if true ... false}
	* in buildHTMLObjectString() add paramter{"pretty" : false}  // if set to true inserts "\n" and "\t" at appropriate points in output for readability
	* fix attribute values to escape "".  e.g. {style: "background-image: url('/path/to/image') "} <<-- shown single quotes, needs to support double quotes.  
	* converge all makeHTML functions to have simple names (see list below).  could drop "make" so HTML, HTMLList, HTMLCard, HTMLTable, HTMLPage
		** makeHTML   /// currently called buildHTMLObjectStr()
		** makeHTMLTabs
		** makeHTMLList(data_array1d, options)
			* ordered vs unordered
		** makeHTMLCard (see w3 schools)
		** makeHTMLAccordian
		** makeHTMLTable
		** makeHTMLPage
		** makeHTMLFooter
		** makeHTMLHeader
	* converge file operations
		** fileLoadJSON also csv 
		** fileSaveJSON also csv 
		** fileLoad
		** fileSave
	* converge function registration operations
		** funcGetID
		** funcRegister
		** funcUnRegister
		** funcGetDispatchStr
	* converge numeric operations
		** mapScale 	==> numInterp
		** random   	==> random
		** clip     	==> numClip
		** fixNum   	==> numFix
		** multiArray	==> numMultiArray
		** numHash32
	* converge color operations
		** colorInterp
		** colorParse ==> bwformat [c0,c1,c2,alpha,model] // model can be "rgb" | "hsl" 
		** colorToRGBHex
		** colorRBGToHSL
	* add disolving bw.logd on all catch (e) {}
	* add attribute "text/css" to <style></style> export functions
	* arrows on sortTable
		* bw-table-sort-upa  bw-table-sort-dna bw-table-sort-xxa  // arrows mark-element is in cycle xx--> upa --> dna --> xx
		* bw-table-sort-up  bw-table-sort-dn bw-table-sort-xx     // no arrows or display just sorts.  mark-elment is in cycle xx-->up-->dn-->xx 
			* need to add this as option to sortable in sortTable 
	* tree accordian (eg  explorer)
		indented divs with show / hide
	* makeThemes directory (?)
	* add bw.logd(values)  // bw.debug log (adds to regular bw.log) but
		TODO: transpose .logd and .log names --> more readable e.g. bw.log acts like console.log
		* is dissolving via bw.logdControl
			bw.logd joins all args like console.log
			bw.logd can be turned on
				bw.logdControl("on") // on
				bw.logdControl("off") // don't log
				bw.logd()  // return current on/off status
				all messages are writtend with "bw.logd" as message type.  use bw.log() for custom messages
		* takes same style params as console.log (e.g. ...)
		*
	* polyfils needed  ==> consider jado pull in
		array.indexOf
		array.map
		array.filter
		array.reduce
		array.forEach
		atob / btoa (base64)
		string.trim  ==> bw.trim() 


//=============================================
//arrows for table sort (needs js to be fixed)
``` css
.bw-table-sort-upa::after {
     content: "\2191"; 
}

.bw-table-sort-dna::after {
     content: "\2193"; 
}

.bw-table-sort-xxa::after {
     content: "\00a0"; 
}
.bw-table-sort-up::after {
}

.bw-table-sort-dn::after {
}

.bw-table-sort-xx::after {
}
```
## future
	consider merging spannit.js in to bitwrench

```
useful for table code, other stuff	
element.className.replace("name", "new-name");
//e.g. el.className.replace("bw-active", "bw-none");
el.className.replace("bw-col", "bw-none");

```

## doc notes:
document how to "mannually" set up tabs
make sure bw doesn't try to "append to head" any code if in nodejs


## Themes

/*
.w3-theme-light   {color:#000 !important; background-color:#f2f9fe !important}
.w3-theme-dark    {color:#fff !important; background-color:#074b83 !important}
.w3-theme-action  {color:#fff !important; background-color:#074b83 !important}

.w3-theme         {color:#fff !important; background-color:#2196f3 !important}
.w3-text-theme    {color:#2196f3 !important}
.w3-border-theme  {border-color:#2196f3 !important}

.w3-hover-theme:hover {color:#fff !important; background-color:#2196f3 !important}
.w3-hover-text-theme:hover {color:#2196f3 !important}
.w3-hover-border-theme:hover {border-color:#2196f3 !important}
*/
