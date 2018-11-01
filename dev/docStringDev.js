#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

//The above shenbang allows running on systems whether nodejs exec is called 'node'
//or called 'nodejs' which is common on many debian systems such as Ubuntu.

//more traditional shebang would be:
//#!/usr/bin/env node

//begin actual javascript below

var fs = require('fs');
var bw = require('../bitwrench.js')["bw"];

var tests = [
function() {
/** 
	s1
	abc
	def
	ghi
	@wejo
*/
	var x;
/* s1  not a docstring
 */

 /**  s1 another docsting 
 */
	return true;
},

function() {

/*
 s2
 not a docstring
 */
 	var y=1; // var y=1, not a valid docstring
/**
 	s2
	abc
	def
	ghi
	@wejo
*/
	var x =2;
	x = (3>4) ? x : 2;

 /**  s2 another docsting  */
	return x+y;
},
"/** this is a simple string */",
"/* not a valid doc string*/",
"not a valid doc string",
"// not a valid docstring"

];


var outs = function(x,o) {
		var y = typeof(x) != "string" ? x.toString() : x;
		return "\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n"+bw.docString(y,o).join("\n..................\n")+"\n<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n";
}
                      
console.log("started ... ")                        
tests.forEach(function(x){console.log(outs(x))})

tests.forEach(function(x){console.log(outs(x,{}))})
//===
//test docStringParse()
console.log("\n|||||||||||||||||||||||||||||||||||||\n")
var outp = function(x,o) {
	var y = typeof(x) != "string" ? x.toString() : x;
		return "\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n"+(bw.docString(y,o).forEach(function(z){return bw.parseJsDocString(z)}).join ("|")).join("\n..................\n")+"\n<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n";
}
console.log(outp(bw.parseJsDocString))

//any issues here..
console.log("\n"+bw.logExport({"exportFormat":"text"}));

