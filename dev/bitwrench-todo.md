# bitwrench.js todo list  
(c) 2012-2018 manu chatterjee 
 			  deftio (at) deftio (dot) com

This list is used for internal ideas, housekeeping, checklists and notes

## features
	[x] typeOf
	[x] getURLParam
	[x] buildHTMLObjecStr (note rename)
		add pretty print option (prettyPrint : true) --> adds tabbed beginning, \n in output for readability.
	[x] makeHTMLTable (also add sort, style examples)
		[ ] support adding column headers to makeHTMLTable as option ==> {header_content: [,,,]}
	[x] makeHTMLTabs()
	[x] makeHTMLList()  ==> bulleted or numerical list
 	[x] table HTML sort support (needs alpha num fix)
	[x] get/save cookie
	[x] save/store file 
	[x] typeOf
	[ ] prettyPrintJSON with stylizble CSS
		settable tab widths
	[x] find/set css class name on supplied element (bw.markElement)
	[ ] encode/decode var info in to a CSS classname (see spannit.js)
	[ ] find classes by encoded var name (returns array of hits)
		note bw.markElement does some of this
	[x] xformScaleSig   #sigmoidal scale, linear, constrain
	[ ] xformScalePow   #power scale 
	[x] clip 
	[x] setIntervalX // rename repeatN() ?
	[*] repeatUntil   --> needs usability clean up
	[x] randomNum in (x,y, float_or_int)
	[x] multidim array quick generator
	[x] loremIpsum quick generator
 	[x] bwSimpleStyles
 	[x] bwSimpleThemes -- note it should work on the examples / docs page w/o problems
 		use args (a.g. bwargs-loadSimpleTheme:themeIndex;
 	[x] docString()
 		support jsdoc style comments, export as JSON or prettyHTML
 	[x] simple logging control to a stream (e.g. bw.log(...) with settable function)
 	[x] isHexStr 
 	[ ] graphMatrixAsImage (use canvas, also allow export as png)
 	[ ] save canvas as data:url (show example with save as button)
 	[ ] color conversions, interpolate colors (used in themes, graphMatrix)
 	[x] command line processing via <script bwargs="arg1:val1;arg2:val2">  # also works from URL param, can be disabled here as well 
 	[ ] simple boolean search of text object.  (TBD: jado and frabjous mix support this)



## packaging and todo
	[ ] build script # currently using gnu make
	[ ] README.md
	[ ] npm register
	[ ] npm install 
	[x] minify (yes, using uglifyjs)
	[ ] tests, coverage -- make sure all functions get tested
	[x] linting - JSHint or ESLint
	[x] "use strict";
	[ ] api ref docs
	[ ] examples
	[x] dir structure
	[x] license
	[ ] github
	[ ] deftio.com/bitwrench page
	[x] build notes
	[x] rename to bitwrench
	[ ] support inline logo for example favicons: <img src="data:image/png;base64,base64encoded images" /> 


## Issues and clean up
	* bw.bwSimpleThemes has cosmetic issues
	* repeatUntil usabilitiy issues
	* make internal function for commonly used:
		a = bw.typeOf(a) == "type" ? true_value : false_value
		==>
		_toa(a,typeString | [typeString1, typeString2]) ==> {if true ... false}
	* in buildHTMLObjectString() add paramter{"pretty" : false}  // if set to true inserts "\n" and "\t" at appropriate points in output for readability
	* fix attribute values to escape "".  e.g. {style: "background-image: url('/path/to/image') "} <<-- shown single quotes, needs to support double quotes.  
	* converge all makeHTML functions to have simple names e.g.
		** makeHTML   /// currently called buildHTMLObjectStr()
		** makeHTMLTabs
		** makeHTMLList
		** amkeHTMLCard
		** makeHTMLTable
		** makeHTMLPage
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
		* bw-table-sort-up  bw-table-sort-dn bw-table-sort-xx  // no arrows or display just sorts.  mark-elment is in cycle xx-->up-->dn-->xx 
			* need to add this as option to sortable in sortTable 
	* accordian (tree explorer)
		indented divs with show / hide
	* makeHTMLList (data_array1d, options)
		* ordered vs unordered
	* makeHTMLCard (see w3 schools)
	* makeThemes directory (?)
	* add bw.logd(values)  // bw.debug log (adds to regular bw.log) but
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
		atob / btoa (base64)
		.trim 


//=============================================
//arrows for table sort (needs js to be fixed)
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
makesure bw doesn't try to "append to head" any code if in nodejs





