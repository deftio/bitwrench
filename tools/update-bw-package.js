#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

//The above shenbang allows running on systems whether nodejs exec is called 'node'
//or called 'nodejs' which is common on many debian systems such as Ubuntu.

//more traditional shebang would be:
//#!/usr/bin/env node

//begin actual javascript below

var bw = require('../bitwrench.js')["bw"];

//console.log ("bitwrench version:"+bw.version()["version"]+" package version updater loaded.\n ");

/* process cmd line
process.argv[0] --> nodejs executable
process.argv[1] --> /full/path/to/this/file/update-bw-package.js 
process.argv[2] --> input_filename
process.argv[3] --> output_filename

*/


if ((bw.typeOf(process.argv[2]) == "string") && (bw.typeOf(process.argv[3]) == "string")) {
	function savePackage(data) {
		data["version"] = bw.version()["version"]
		bw.saveClientFile(process.argv[3],JSON.stringify(data, null, "\t"));
	}
	bw.getJSONFile(process.argv[2], savePackage);

}