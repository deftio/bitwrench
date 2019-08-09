#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

//The above shenbang allows running on systems whether nodejs exec is called 'node'
//or called 'nodejs' which is common on many debian systems such as Ubuntu.

//more traditional shebang would be:
//#!/usr/bin/env node

//begin actual javascript below

var bw = require('../bitwrench.js');

console.log ("Export bitwrench css: using bw version:"+bw.version()["version"]+"\n ");

/* process cmd line notes

process.argv[0] --> nodejs executable
process.argv[1] --> /full/path/to/this/file/update-bw-package.js 
process.argv[2] --> export_filename

*/

if (process.argv.length <=1 ) {//no parameters specified
	console.log("bitwrench in-built css exporter\n\n");
	console.log("arguments:\n");
	console.log("export-bw-default-css.js  filename-to-export ==> exports in-built css classes to specified filename");
	console.log("export-bw-default.css.js  filename-to-export false|load  ==> exports in-built css turning on/off global container defs");
}

if (bw.typeOf(process.argv[2]) == "string") {
	var bwCSSExport = "";
	bwCSSExport += "/*\"\"\"\n";
	bwCSSExport += "bitwrench.css version " + bw.version()["version"]+ "\n";
	bwCSSExport += "bitwrench.js exported css classes (auto generated)\nThis file contains the same css classes (styles used by bitwrench.js) and can be used stand-alone.\n\nIt is not required to load this file when using bitwrench.js since its built in to the bitwrench.js library and autoloaded.\n\n";
	bwCSSExport += "This file can be generated at runtime via bw.bwSimpleStyles(false,{\"basics\":\"load\"}) and saving the data.  Also note that this version includes global css (* {}) rules which aren't required but useful for quick-n-dirty development";
	bwCSSExport += "\n\n\"\"\"*/";
	bwCSSExport += bw.bwSimpleStyles(false,{"globals":process.argv[3]});

	bw.saveClientFile(process.argv[2],bwCSSExport);  // if running on node this internally uses ==> var fs = require('fs');
}
