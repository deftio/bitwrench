/**
bitwrench test functions.

this file uses the mocha test framework:

npm install mocha --save-dev mocha

*/

var assert = require("assert");
//var should = require('chai').should();


// include bitwrench!
var bw = require("../bitwrench.js")["bw"];

//tests begin:

// ================================================================
describe("#typeOf()", function() {
  
	//simple way to test
	//it('A usable typeof operator for internal use in bw', function() {
	//  _typeOf("this is a string").should.equal('string');
	//});

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

describe("#parseJsDocString", function() {
  
	//simple way to test
	//it('A usable typeof operator for internal use in bw', function() {
	//  _typeOf("this is a string").should.equal('string');
	//});

	//using meta tests
	var x;
	var tests = [
		{args: ["/** This is a test \n*/"],           expected: []}
	];
  
  	tests.forEach(function(test) {
    	it("bw.parseJsDocString (jsdoc comment parser)  " + test.args.length + " args", function() {
	      	var res = bw.parseJsDocString.apply(null, test.args);
	      	assert.deepEqual(res, test.expected);
    	});
 	});

});
//describe('')