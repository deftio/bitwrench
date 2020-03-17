# bitwrench.js todo list  
(c) 2012-2019 manu chatterjee 
 			  deftio (at) deftio (dot) com

This list is used for internal ideas, housekeeping, checklists and notes

## features
	[x] typeOf
	[x] getURLParam fails test case where URL param contains # character
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
	[x] xformScaleSig   #sigmoidal scale, linear, constrain (mapScale can do this)
	[0] xformScalePow   #power scale ==> remove
	[ ] interp [NN,Lin, Cos] for arrays (e.g. simple resample, any # of dims)
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
 	[x] color conversions, interpolate colors (used in themes, graphMatrix)
 	[x] command line processing via <script bwargs="arg1:val1;arg2:val2">  # also works from URL param, can be disabled here as well 
 	[ ] simple boolean search of text object.  (TBD: jado and frabjousmix support this)
 	[x] pad strings (used in logExport({exportFormat:"text"}))
 	[ ] bitwrench-server.js / bitwrench-server.php / bitwrench-server.py - simple server for receiving JSON encoded data
 	[x] in options (bw.html) allow non-closed tags e.g. bw.html(["meta",{keywords:"foo, bar"},null,{tagClose:false}]) // default is tagClose:true
 	[x] in options (bw.html) allow attribs with no value e.g. bw.html(["special tag", {type:"javascript", specialTag:null},null])
 	[x] in options (bw.html) null for content means no content e.g.g <tag></tag>
 	[ ] in makeCSS (pretty:false) remove "\n"
 	[ ] makeCSS, makeCSSRule ==> CSS CSSRuleEmit

## packaging and todo
	[x] build script # currently using gnu make --> migrated to just using NPM
	[ ] build script should fail building new package if either lint or tests fail (e.g. make script exit conditional)
	[x] README.md
	[o] index.html should be auto-gen'd from README.md (but include bitwrench.js)
	[x] npm register
	[x] npm install 
	[x] minify (yes, using uglifyjs)
	[ ] tests, coverage -- make sure all functions get tested
	[x] linting - JSHint or ESLint
	[x] "use strict";
	[ ] api ref docs
	[ ] examples 
	[ ] pure JSON page generation
	[ ] example of using YAML instead of JSON (use yamljs in example but not in bw)
	[x] dir structure
	[x] license
	[x] github
	[x] deftio.com/bitwrench pages  ==> move to deftio/opensource/bitwrench ?
	[x] build notes
	[x] rename to bitwrench
	[x] npm release (already an npm package)
	[ ] support inline logo for example favicons: <img src="data:image/png;base64,base64encoded images" /> 
	[x] full UMD support (cjs / require / AMD / import / browser)

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



## future
	consider merging spannit.js in to bitwrench

```javascript
//useful for table code, other stuff	
element.className.replace("name", "new-name");
//e.g. el.className.replace("bw-active", "bw-none");
el.className.replace("bw-col", "bw-none");

```

## doc notes:
document how to "mannually" set up tabs
make sure bw doesn't try to "append to head" any code if in nodejs


## Themes
```javascript

makeBasicTheme(colors{}) {
color.light.primary
color.light.background

color.dark.primary
color.dark.background

color.border
color.

color.hover.primary
color.hover.background
color.hover.border


var bthem = 
`
.w3-theme-light   {color:#000 !important; background-color:#f2f9fe !important}
.bw-theme-dark    {color:#fff !important; background-color:#074b83 !important}
.bw-theme-action  {color:#fff !important; background-color:#074b83 !important}

.bw-theme         {color:#fff !important; background-color:#2196f3 !important}
.bw-text-theme    {color:#2196f3 !important}
.bw-border-theme  {border-color:#2196f3 !important}

.bw-hover-theme:hover {color:#fff !important; background-color:#2196f3 !important}
.bw-hover-text-theme:hover {color:#2196f3 !important}
.bw-hover-border-theme:hover {border-color:#2196f3 !important}
`	
}

```

# html
```
htmlExt (dict, global_opts) // extended parameters for html generation.  note that html() just calls htmlExt with some fixed defaults

def_global_opts:
     pretty : true,
     pretty_space: "  ",
     pretty_indent: "", //fixed indent when pretty pass as "    " etc makes all the html indented by this string. useful if 'stringing' html snippets together
     tagClose : "auto" // default behavior spec'd here, can be overidden @ node level 
     			""
     			"none"
     			"all"

     	// o.tagClose==auto         && _isv(t)==true   ==>  ,
        //                             _isv(t)==false  ==>  , </t>      
        // o.tagClose==closeEmpty   && _isv(t)==true   ==> /,
        //                             _isv(t)==false  ==>  , </t>

        // o.tagClose==none                            ==>  ,                  
        // o.tagClose==all                             ==>  , </t>


def_global_opts = optsCopy(def_global_opts,global_opts)

state_init = {
	levelCnt : 0
	nodeCnt  : 0
	errors   : []   // errors are presented as: { level, seq, node, error}
}
var indent = ddict.o.pretty ? Array(ddict.s.level * ddict.o.pretty_indent ).join(ddict.o.pretty_space) : "";

_render(data, state) // uses global_opts
	ddict {t, a, c, o}  <== data
	
	emit tag 
	sate.nodeCnt++
	emit atr
	emit *self-close
	if content.length > 0 (note if content not array treat as no content.  )
		emit content
			state.levelCnt++
			for (0 .. content.length) 
				_render(c[i],{stateupadted})
	emit *close

return {html: html, info: {stats}}

not_pretty:
<tag atr1="sds" atr2="weow" atr3 atr4="e3">cntonetn</content>
pretty:



html(data,opts) {  // old apis won't use opts so defaults used instead
	return htmlFromDict(data,opts).html;  // drops stats uses global defaults
}
```

htmlNorm (data,state) ==> {t,a,c,o,state}  (not recursive) 
	if function() for any of t,a,c,o
	then f(state)
	functions allowed for data or data.c  
		data(state)
		data.c(t,state)


