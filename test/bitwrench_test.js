/**
bitwrench test functions.

this file uses the mocha test framework:

npm install mocha --save-dev mocha

*/
"use strict";
var assert = require("assert");
//var should = require('chai').should();


// include bitwrench!
var bw = require("../bitwrench.js");

//tests begin:
// ================================================================
describe("#choice(x,choiceDict{},defaultVal) - Allows a dictionary to be used as a switch statement, including functions as values. ", function() {
/**

*/
	var tests = [
		{args: [1, {1:2,foo:"bar"},function(){return "defaultUsed"}], expected: 2 },
		{args: ["foo", {1:2, foo:function(x){return x+"bar"}},function(){return "defaultUsed"}], expected: "foobar" },
		{args: [3, {1:2,foo:"bar"},function(x){return "not found: " + String(x)}], expected: "not found: 3" }
	];

	tests.forEach(function(test) {
		it("bw.choice  " + test.args.length + "args", function() {
			var res = bw.choice.apply(null, test.args);
			assert.equal(res, test.expected);
		});
 	});
});

// ================================================================
describe("#jsonClone() - duplicate a (simple) object by converting to JSON and back", function() {
/**

*/
	var tests = [
		{args: [{1:2,foo:"bar"}], expected: {1:2,foo:"bar"} },
		{args: ["foo"], expected: "foo" }
	];

	tests.forEach(function(test) {
		it("bw.jsonClone  " + test.args.length + "args", function() {
			var res = bw.jsonClone.apply(null, test.args);
			assert.deepEqual(res, test.expected);
		});
 	});
});

// ================================================================
describe("#typeOf()", function() {
/** 
test built-in basic bitwrench typeof operator
*/

	//using meta tests
	var x;
	var tests = [
		{args: [[]],              expected: "array"},
		{args: [{}],              expected: "object"},
		{args: [1],               expected: "number"},
		{args: ["test string"],   expected: "string"},
		{args: [x],				  expected: "undefined"},
		{args: [null],			  expected: "null"},
		{args: [function(){}],    expected: "function"}
	];
  
  	tests.forEach(function(test) {
    	it("bw.typeOf (internal type operator)  " + test.args.length + " args", function() {
	      	var res = bw.typeOf.apply(null, test.args);
	      	assert.equal(res, test.expected);
    	});
 	});

});
// ================================================================
describe("#typeAssign(x,type,trueV,FalseV) - see if a variable is a certain type or one of a list of types", function() {
/**

*/
	var tests = [
		{args: [1,0,true,false], expected:false },  // needs typeString to be a number or string
		{args: [1,"number",true,false], expected: true },
		{args: [1,"string",true,false], expected: false },
		{args: [1,["number","string"],true,false], expected: true }
	];

	tests.forEach(function(test) {
		it("bw.typeAssign  " + test.args.length + "args", function() {
			var res = bw.typeAssign.apply(null, test.args);
			assert.equal(res, test.expected);
		});
 	});
});
// ================================================================
describe("#typeConvert(x,type,trueV,FalseV) - see if a variable is a certain type or one of a list of types, allows output to be functional", function() {
/**

*/
	var tests = [
		{args: [1,0,true,false], expected:false },  // needs typeString to be a number or string
		{args: [1,"number",true,false], expected: true },
		{args: [1,"string",true,false], expected: false },
		{args: [1,["number","string"],true,false], expected: true },
		{args: [1,["number","string"],function(){return "true"},function(){return "false"}], expected: "true" },
		{args: [1,["number","string"],function(){return "true"},function(x){return x}], expected: "true" },
		{args: [{},["number","string"],function(){return "true"},function(){return "false"}], expected: "false" }
	];

	tests.forEach(function(test) {
		it("bw.typeConvert  " + test.args.length + "args", function() {
			var res = bw.typeConvert.apply(null, test.args);
			assert.equal(res, test.expected);
		});
 	});
});



// ================================================================
describe("#docString", function() {
/**
test docString raw etractor.  Note this function does not parse the doc string it just returns an array of valid doc strings from the supplied string.
This can be used on functions or objects via the toString() operator.

e.g. var myFunction = function( .... ) { ..... function body }

bitwrench.docString(myFunction.toString()) ==> returns any doc strings inside.
*/
	var tests = [
		{args: ["this.toString()"], expected: "" }
	];

	tests.forEach(function(test) {
		it("bw.docString (docString extractor) " + test.args.length + "args", function() {
			var res = bw.docString.apply(null, test.args);
			//assert.equal(res, test.expected);
		});
 	});
});
// ================================================================
describe("#docStringParse", function() {
	var tests = [
		{args: ["/** This is a test \n*/"],           expected: []}
	];
  
  	tests.forEach(function(test) {
    	it("bw.docStringParse (jsdoc comment parser)  " + test.args.length + " args", function() {
	      	var res = bw.docStringParse.apply(null, test.args);
	      	//assert.deepEqual(res, test.expected);
    	});
 	});

});
