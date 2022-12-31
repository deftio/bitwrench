#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

// the above is a 'unversal' shebang regardless of whether node or nodejs is installed.

const fs=require('fs');
var umdlib = require('../bitwrench.js');

console.log ("running UMD converter hack..");

s= fs.readFile('./bitwrench.js','utf8', (err,is)=> 
    {
        src= String(is);
        
        r = /\/\/BEGIN_LIBRARY_CODE([\s\SA-Za-z0-9.]+)\/\/END_LIBRARY_CODE/gm
        let a = src.match(r);
        let lcode = a[0].substring("//BEGIN_LIBRARY_CODE".length,a[0].length-("//END_LIBRARY_CODE".length));
        
        
        let mcode = "export let "+ umdlib.exportName+" = (()=>{\n"+lcode+"\n})();\n";
        mcode += "export default " + umdlib.exportName +";\n";
        
        try {
            fs.writeFileSync("./bitwrench_ESM.js", mcode);
        } 
        catch (err) {
            console.error(err);
        }



    });
