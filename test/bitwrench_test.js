/**
bitwrench test functions.

this file uses the mocha test framework and chai assert framework

npm install mocha --save-dev mocha
npm install chai  --save-dev chai

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
		{args: [3, {1:2,foo:"bar"},function(x){return "not found: " + String(x)}], expected: "not found: 3" },
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
		{args: [function(){}],    expected: "function"},
		{args: [class{}],		  expected: "function"	}
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

describe("#arrayUniq([]) - return uniq elements of an Array", function() {
/**

*/
	var tests = [

		{args: [[1,2,3,2,1]], expected:[1,2,3] }, 		
		{args: [1], expected: []} // type check
	];

	tests.forEach(function(test) {
		it("bw.arrayUniq  " + test.args.length + "args", function() {
			var res = bw.arrayUniq.apply(null, test.args);
			assert.deepEqual(res, test.expected);
		});
 	});
});
// ================================================================

describe("#arrayBinA(a[],b[]) - return elements of Array B in Array A ", function() {
/**

*/
	var tests = [

		{args: [[1,2,3,2,1],[1,3,5]], expected:[1,3] }, 		
		{args: [1,[]], expected: []}, //type check
		{args: [[],1], expected: []} //type check
	];

	tests.forEach(function(test) {
		it("bw.arrayBinA  " + test.args.length + "args", function() {
			var res = bw.arrayBinA.apply(null, test.args);
			assert.deepEqual(res, test.expected);
		});
 	});
});
// ================================================================

describe("#arrayBNotinA(a,b) - return elements of Array B not in Array A ", function() {
/**

*/
	var tests = [
		{args: [[1,2,3,2,1],[1,3,5]], expected:[5] }, 		
		{args: [1,[]], expected: []}, //type check
		{args: [[],1], expected: []} //type check
	];

	tests.forEach(function(test) {
		it("bw.arrayBNotinA  " + test.args.length + "args", function() {
			var res = bw.arrayBNotInA.apply(null, test.args);
			assert.deepEqual(res, test.expected);
		});
 	});
});

// ================================================================

describe("#colorInterp((x, in0, in1, colors, stretch) - interpolate a value from an array of colors ", function() {
/**

*/
	var tests = [
		{args: [228,100,355,["#000","rgb(255,255,255)"]], expected:[128,128,128,255,"rgb"] }, 		
		{args: [162.5,100,200,["#000","#aaa","#fff","#000","#bbb"]], expected: [127.5, 127.5, 127.5, 255, "rgb"]}
	];

	tests.forEach(function(test) {
		it("bw.colorInterp  " + test.args.length + "args", function() {
			var res = bw.colorInterp.apply(null, test.args);
			assert.deepEqual(res, test.expected);
		});
 	});
});

// ================================================================
/*
 	some useful color values:

	Black	#000000	(0,0,0)			(0°,0%,0%)
 	White	#FFFFFF	(255,255,255)	(0°,0%,100%)
 	Red		#FF0000	(255,0,0)		(0°,100%,50%)
 	Lime	#00FF00	(0,255,0)		(120°,100%,50%)
 	Blue	#0000FF	(0,0,255)		(240°,100%,50%)
 	Yellow	#FFFF00	(255,255,0)		(60°,100%,50%)
 	Cyan	#00FFFF	(0,255,255)		(180°,100%,50%)
 	Magenta	#FF00FF	(255,0,255)		(300°,100%,50%)
 	Silver	#BFBFBF	(191,191,191)	(0°,0%,75%)		
*/

describe("#colorHslToRgb(h, s, l, a - convert HSL color space to RGB ", function() {
/**
	test conversion of HSL colors to RGB
*/
	var tests = [
		{args: [120,100,50,128], expected:[0,255,0,128,"rgb"] } ,
		{args: [[0,0,75,128]], expected:[191,191,191,128,"rgb"] } 
	];

	var crnd = function(a){return [Math.round(a[0]),Math.round(a[1]),Math.round(a[2]),Math.round(a[3]),a[4] ];}
	tests.forEach(function(test) {
		it("bw.colorHslToRgb  " + test.args.length + "args", function() {
			var res = bw.colorHslToRgb.apply(null, test.args);
			//res = crnd(res);
			assert.deepEqual(res, test.expected);
		});
 	});
});


// ================================================================

describe("#colorRgbToHsl(r, g, b, a - convert HSL color space to RGB ", function() {
/**
 test conversion of RGB style colors to HSL
*/
	var tests = [
		{args: [0,255,0,100], expected:[120,100,50,100,"hsl"] },
		{args: [[191,191,191,100]], expected:[0,0,75,100,"hsl"] } 		 		
	];
	
	var hrnd = function(a){return [Math.round(a[0]*360),bw.fixNum(a[1],2),bw.fixNum(a[2],2),Math.round(a[3]),a[4] ];}
	
	tests.forEach(function(test) {
		it("bw.colorRgbToHsl  " + test.args.length + "args", function() {
			var res = bw.colorRgbToHsl.apply(null, test.args);
			//res = hrnd(res);
			assert.deepEqual(res, test.expected);
		});
 	});
});

describe("#colorParse(colorToParseString, defaultAlpha - parse a color object e.g. #abc or HSL(12,3,43,0.3) to a bitwrench color array [,,,] ", function() {
/**

*/
	var tests = [
		{args: ["#abc"], expected:[170, 187, 204, 255, "rgb"] },
		{args: ["#abc",255], expected:[170, 187, 204, 255, "rgb"] },
		{args: ["#abcd"], expected:[170, 187, 204, 221, "rgb"] },
		{args: ["#AABBCC"], expected:[170, 187, 204, 255, "rgb"] },
		{args: ["hsl(12,34,45,100)"], expected:[12,34,45,100,"hsl"] },
		{args: ["	hsl ( 12 ,	34, 45,	100  )"], expected:[12,34,45,100,"hsl"] },
		{args: [[0xaa,0xbb,0xcc]], expected: [0xaa,0xbb,0xcc,0xff,"rgb"]},
		{args: [[10,20,30,40,"rgb"]], expected: [10,20,30,40,"rgb"]},
		{args: [[300,20,30,50,"hsl"]], expected: [300,20,30,50,"hsl"]}	 		 		 		
	];
	
	
	tests.forEach(function(test) {
		it("bw.colorParse  " + test.args.length + "args", function() {
			var res = bw.colorParse.apply(null, test.args);
			//res = hrnd(res);
			assert.deepEqual(res, test.expected);
		});
 	});
});

describe("#colorConvertColorSpace( convert a color from one space to another)", function() {
/**
 test conversion of RGB style colors to HSL
*/
	var tests = [
		{args: [[0,255,0,100,"rgb"],"hsl"], expected:[120,100,50,100,"hsl"] },
		{args: [[0,255,0,100,"rgb"],"rgb"], expected:[0,255,0,100,"rgb"] },
		{args: [[120,100,50,111,"hsl"],"rgb"], expected:[0,255,0,111,"rgb"] }, 		 		
		{args: [[120,100,50,111,"hsl"],"hsl"], expected:[120,100,50,111,"hsl"] } 		 		
	];
	
	var hrnd = function(a){return [Math.round(a[0]*360),bw.fixNum(a[1],2),bw.fixNum(a[2],2),Math.round(a[3]),a[4] ];}
	
	tests.forEach(function(test) {
		it("bw.colorConvertColorSpace  " + test.args.length + "args", function() {
			var res = bw.colorConvertColorSpace.apply(null, test.args);
			//res = hrnd(res);
			assert.deepEqual(res, test.expected);
		});
 	});
});

describe("#URLParamParse(url, optKey, OptDefValue - parse URL query string (must have ? present) to get values", function() {
/**
 test conversion of RGB style colors to HSL
*/
	var tests = [
		{args: ["http://bar.com:80?foo=bar&x=234&y=45"], expected:{foo:"bar",x:"234",y:"45"} },
		{args: ["?a=123&b=234","a"], expected:"123" },
		{args: ["?a=123&b=234","c"], expected: undefined },
		{args: ["?a=123&b=234","c","def"], expected:"def" },
		{args: ["?a=123&b=234&d&e=#123","d","def",true], expected:true }, // case of key with no value
		{args: ["?a=123&b=234&d&e=#123","e","#123",true], expected:"#123" },
		{args: ["https:1bca.com/a/b/c?a=134&b=234#thisisit&d=234","b","no",true], expected: "234#thisisit"},
		{args: ["https:1bca.com/a/b/c?a=134&b=234#thisisit&d=234","b","no",false], expected: "234"},
		{args: ["https:1bca.com/a/b/c?a=134&b=234#thisisit&d=234","b","no"], expected: "234" }
		/*
		bw.URLParamParse("https:1bca.com/a/b/c?a=134&b=234#thisisit&d=234","b","no",true)
"234#thisisit"
bw.URLParamParse("https:1bca.com/a/b/c?a=134&b=234#thisisit&d=234","b","no",false)
"234"
bw.URLParamParse("https:1bca.com/a/b/c?a=134&b=234#thisisit&d=234","b","no")
"234"
*/
	];
	
	
	tests.forEach(function(test) {
		it("bw.URLParamParse  " + test.args.length + "args", function() {
			var res = bw.URLParamParse.apply(null, test.args);
			if (typeof res == "string")
				assert.equal(res, test.expected);
			else
				assert.deepEqual(res, test.expected);
		});
 	});
});

describe("#clearTimer()", function() {
/**
 test conversion of RGB style colors to HSL
*/
	var tests = [
		{args: [], expected:true },
		{args: ["clearTimerMsg"], expected:true },
	];
	
	
	tests.forEach(function(test) {
		it("bw.clearTimer  " + test.args.length + "args", function() {
			var ref = bw.logExport()[1][1];
			var res = bw.clearTimer.apply(null, test.args);
			assert.equal((res-ref) < 100,true);
			if (test.args[0]=="clearTimerMsg")
				assert.equal(test.args[0],bw.logExport()[2][1]);
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
		{args: ["this is not a docstring"], expected: []},
		{args: ["/** this is a test */ /* foo*/  /** another test */"], expected: [" this is a test ", " another test "] }
	
	];

	tests.forEach(function(test) {
		it("bw.docString (docString extractor) " + test.args.length + "args", function() {
			var res = bw.docString.apply(null, test.args);
			assert.deepEqual(res, test.expected);
		});
 	});
});
// ================================================================
describe("#docStringParse", function() {
	var tests = [
		{args: ["/** This is a test \n*/"],           expected: [{source: " This is a test ", field: "", types: "", name: "", description: ""}]}
	];
  
  	tests.forEach(function(test) {
    	it("bw.docStringParse (jsdoc comment parser)  " + test.args.length + " args", function() {
	      	var res = bw.docStringParse.apply(null, test.args);
	      	assert.deepEqual(res, test.expected);
    	});
 	});

});
