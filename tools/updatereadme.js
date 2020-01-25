#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"
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
	console.log("update-bw-package: no arguments supplied (no operations performed).  \nThis tool updates index.html to have highlighths support.  \nNote that in the future docbat.js will handle this.\n\n");
	console.log("usage:\n ./udpatereadme index.html index.html\n\n");
}
else {
	if ((bw.typeOf(process.argv[2]) == "string") && (bw.typeOf(process.argv[3]) == "string")) {
		var update = function (data) {
			var hl = 
`
<link rel="stylesheet" href="//cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.0/build/styles/default.min.css">
<script src="//cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.0/build/highlight.min.js"></script>
<script>hljs.initHighlightingOnLoad();</script>`;
			
			bw.saveClientFile(process.argv[3],data.replace("<head>","\n<head>\n"+hl+"\n")); // use bitwrench internal file ops to write json file back
		}
		bw.getFile(process.argv[2], update); // use bitwrench internal ops to fetch original json file
	}
}