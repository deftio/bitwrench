#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

//The above shenbang allows running on systems whether nodejs exec is called 'node'
//or called 'nodejs' which is common on many debian systems such as Ubuntu.

//more traditional shebang would be:
//#!/usr/bin/env node

//begin actual javascript below

"use strict";
var fs = require('fs');
var bw = require('../bitwrench.js')["bw"];

/*

 this is a comment with no @ 
 * this is a comment with no @  (note begins with *)

	@param foo
 * 	@param foo

 	@param {type,type2} description starts here
 	@param {type,type2} name - description starts here

*/
                      
console.log("started ... ")                        
//======
//test docStringParse()
console.log("\n|||||||||||||||||||||||||||||||||||||\n")

//http://usejsdoc.org/tags-param.html
//Test cases
//Name only
function sayHello1(somebody) {
/**
 * @param somebody
 */
    alert('Hello ' + somebody);
}

//Name and type
function sayHello2(somebody) {
/**
 * @param {string} somebody
 */
    alert('Hello ' + somebody);
}

//Name, type, and description
function sayHello3(somebody) {
/**
 * @param {string} somebody Somebody's name.
 */
    alert('Hello ' + somebody);
}

//You can add a hyphen before the description to make it more readable. Be sure to include a space before and after the hyphen.
//Name, type, and description, with a hyphen before the description
function sayHello4(somebody) {
/**
 * @param {string} somebody - Somebody's name.
 */
    alert('Hello ' + somebody);
}

function sayHello5(somebody) {
/**
   This is a simple description which shoud be hanlded by the parser eventhough it doesn;t have an @param type d
   declaration in it.
*/
}
var testCasesParse = [
	sayHello1.toString(),
	sayHello2.toString(),
	sayHello3.toString(),
	sayHello4.toString(),
]

var outp = function(z,opts) {
	var i,s = "\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n";
	for (i=0; i<z.length; i++) { // for each test case
		z.forEach(function(x){return bw.docStringParse(x,opts)}).join ("|");
	}
	s+= "\n<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n";
}
//console.log(outp(bw.parseJsDocString))
var testCaseParse2 = [
 " @param",                                 // {field: "@param", "types" :"", "fieldName" :"", "description" :""}
 " @field d1 d2 d3 d4",    		//
 " @param {type1 } d1 d2 d3 d4",		//
 " @param2 {type1, type2} d1 d2 d3",	// 
 " @param {type} name - d1 d2 d3",	// 
 " this is just a desctription line"  //
]

var fn = function(s) {
	var r={"source":s,  "field" : "", "types":"", "name" :"", "description" : ""};  
	var a = s.replace(/^\s*(\/\*\*?)?|(\*\/)?\s*$/ig,"") // remove the comment markers if still there "/** my comment */"" ==> "my comment"
	a = a.replace(/^\s*\**\s*/,"");  					 // remove any cruft at beginning of line " * @myParam {}....." ==> "@myParam {}....."
	if (a.charAt(0) == "@") { // if we have hit a @fieldname parameter we start parsing.
		//  ([str, regex, fieldStr, result{}]) ==> ([str, regex, fieldStr, result{}])  ::> ([str,result{},fieldStr,regex])
		var _tok = function(x){
			var m = x[0].match(x[1]);
			if (m != null) {x[4][3]=m[1];}
			x[0] = x[0].replace(x[1],"");
			return x;
		}
		//r = [[e,f],[e,f],[e,f],[e,f]].reduce(,_tok);

		var e,x;
		var t = bw.trim;
		e =/^@([A-Za-z0-9_<>[\]]*)/i;
		x = a.match(e);
		if (x != null) {r["field"] = t(x[1])} else return r; // didn't match... opt out here
		a = a.replace(e,"");
		
		e = /^\s*\{([A-Za-z0-9_|\s,.\-+!@#$%^&*()=[\]]*)\}/i;
		x = a.match(e);
		if (x != null) 	{r["types"]=t(x[1]);} // types is optional..
		a = a.replace(e,""); 

		e  = /^\s*([\S]*)/i;
		x = a.match(e);
		if (x != null) 	{r["description"]=t(x[1]);} //
		a = a.replace(e,""); 

		e = /^\s*([\S]*)/i;
		x = a.match(e);
		if (x != null) 	{r["name"]=t(x[1]);} //
		a = a.replace(e,""); 
		
		// descrpition                  ==> name: ""     	description : "description"
		// description  we  we          ==> name: ""  		description : "description we we "
		// name - description  we we    ==> name: "name"	descrpition : "description we we"
		// - description we we 			==> name: ""        description : "description we we"
		if (r["name"].match(/^\s*-+\s*/) != null) {
			r["name"] = r["description"];
			r["description"] = t(a);
		} else {
			r["description"] = r["description"]+" "+r["name"]+" "+t(a);
			r["name"] ="";
		}
	}
	return r;
}

var testFn = function(t) {
	var i;
	for (i in t) {
		console.log("\n     +++++++++++++++++++++++++\n");
		var x = fn(t[i]);
		console.log(x);
		console.log("\n     -------------------------\n");
	}
}
testFn(testCaseParse2);
//outp(testCaseParse2);//any issues here..
bw.log("end-time");
console.log("\n"+bw.logExport({"format":"text"}));

/*

s = getline()
trim()
trim leading * ==> "\*?\s+"


*/