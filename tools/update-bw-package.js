#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

//The above shenbang allows running on systems whether nodejs exec is called 'node'
//or called 'nodejs' which is common on many debian systems such as Ubuntu.

//more traditional shebang would be:
//#!/usr/bin/env node

//begin actual javascript below

var bw = require('../bitwrench.js');

//console.log ("bitwrench version:"+bw.version()["version"]+" package version updater loaded.\n ");

/* process cmd line
process.argv[0] --> nodejs executable
process.argv[1] --> /full/path/to/this/file/update-bw-package.js 
process.argv[2] --> input_filename
process.argv[3] --> output_filename

*/

if (process.argv.length <=2) {
	console.log("update-bw-package: no arguments supplied (no operations performed).  \nThis tool updates the version number in package.json\n\n");
	console.log("usage:\n ./udpate-bw-package original-package.json updated.json\n\n");
}
else {
	if ((bw.typeOf(process.argv[2]) == "string") && (bw.typeOf(process.argv[3]) == "string")) {
		var savePackage = function (data) {
			data["version"] = bw.version()["version"];  // get bitwrench version from itself... 
			bw.saveClientFile(process.argv[3],JSON.stringify(data, null, "\t")); // use bitwrench internal file ops to write json file back
		}
		bw.getJSONFile(process.argv[2], savePackage); // use bitwrench internal ops to fetch original json file
	}
}