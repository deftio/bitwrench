#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

//The above shenbang allows running on systems whether nodejs exec is called 'node'
//or called 'nodejs' which is common on many debian systems such as Ubuntu.

//more traditional shebang would be:
//#!/usr/bin/env node

//begin actual javascript below

var bw = require('../bitwrench.js');

console.log ("Create simple web page\n using bw version:"+bw.version()["version"]+"\n ");

/* process cmd line notes

process.argv[0] --> nodejs executable
process.argv[1] --> /full/path/to/this/file/createSimpleHTMLPage.js 
process.argv[2] --> export_filename

*/

if (bw.typeOf(process.argv[2]) == "string") {
	var pageHTML = bw.makeHTMLPage(
			"\n"+
			bw.buildHTMLObjString(["title",{},"Simple HTML Page"])+
			'\n'+
			bw.bwSimpleStyles(true,{"basics":"load","exportCSS":true})
		,
			[
				["h2",{},"Simple Page"],
				["p" ,{},bw.loremIpsum(800)],
				["h3",{},"another heading"],
				["p" ,{},bw.loremIpsum(800)]
			].map(function(x){return bw.buildHTMLObjString(x) }).join("\n")
		)
	 

	bw.saveClientFile(process.argv[2],pageHTML);  // if running on node this internally uses ==> var fs = require('fs');
}
