/**
bitwrench test functions for npm (nodejs) see bitwrench_test_karam.js for browser version of tests

this file uses the mocha test framework and chai assert framework along with jsdom to test certiain environment params

npm install mocha --save-dev 
npm install chai  --save-dev 
npm install jsdom --save-dev 

*/
"use strict";



var assert = require("assert");

// include bitwrench!
var bw = require("../bitwrench.js"); // this is a live copy of bitwrench for nodejs testing as below
//var bw = require("../instr_tmp/bitwrench.js"); // this is a live copy of bitwrench for nodejs testing as below

//====================

//if (bw.isNodeJS()) {

var jsdom = require('jsdom');
const { JSDOM } = jsdom;

var istanbul = require('nyc')
// console.log(istanbul,istanbul.__coverage__)
const fs = require("fs");
const path = require("path");

const bitwrenchFile = fs.readFileSync(path.resolve(__dirname,"../bitwrench.js"), { encoding: "utf-8" }).toString(); // this is a literal copy of bitwrench for jsdom injection
console.log("bitwrenchFile Loaded..."+bitwrenchFile.length+" chars"); 

const bitwrenchFileInstrumented = fs.readFileSync(path.resolve(__dirname,"../instr_tmp/bitwrench.js"), { encoding: "utf-8" }).toString(); // this is a literal copy of bitwrench for jsdom injection
console.log("bitwrenchFileInstrumented Loaded..."+bitwrenchFileInstrumented.length+" chars"); 

`
var coverageVar = (
    function() {
        var coverageVar = __coverage__;
        / *
        for(var key of Object.keys(global)) {
            if (/\$\$cov\d+\$\$/.test(key)) {
                coverageVar = key;
            }
        }* /
        console.log('Coverage var:', coverageVar);
        return coverageVar;
    }
)();
`
//}
// ================================================================
var setupdom = function(wnd,html) {
	if (bw.isNodeJS() ) {

		const testDoc = `<!DOCTYPE html><html><head></head><body><span id="myTestSpan">starter</span><div class="foo">default</div></body></html>`;
	  	wnd = (new JSDOM( (((typeof html) !== "undefined") ? html : testDoc), 
	  		{ 
	  		runScripts: "dangerously" , 
	  		created: function (errors, wnd) { wnd[coverageVar] = global[coverageVar]; console.log(coverageVar) },
	  		done   : function (errors, wnd) {if (errors) {console.log(errors);  done(true); } else { window = wnd; done(); }
		    }
	  	})).window;

	  	// Execute my library by inserting a <script> tag containing it.
	  	const scriptEl = wnd.document.createElement("script");
	  	scriptEl.textContent = bitwrenchFileInstrumented;
	  	wnd.document.head.appendChild(scriptEl);
	}
	else {

		wnd = (typeof window != "undefined") ? window : wnd; // yes the global window -- we're in the browser
		//if (html)
		//	window.document.documentElement = html;
		console.log("browser context")
	}
	return wnd;
}
//==================================

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
		{args: [new Date()],	  expected: "date"},
		{args: [function(){}],    expected: "function"},
		{args: [class{}],		  expected: "function"	},
		{args: [class{},true],    expected: "function" }
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

describe("#bw.DOMIsElement()", function() {
/**
 

*/
		var wind;
		beforeEach(() => {
		  	wind = setupdom(wind);
		});

		it("DOMIsElement()", () => {
		 	assert.equal(wind.bw.DOMIsElement(wind.bw.DOM("span")[0]), true); // test jsdom is using bw correctly in window context
		});
		it("DOMIsElement()", () => {
		 	assert.equal(wind.bw.DOMIsElement(wind.bw.DOM("not an Element")[0]), false); // test jsdom is using bw correctly in window context
		});
});

describe("#bw.DOMGetElements())", function() {
/**

*/
		var wind;
		beforeEach(() => {
		  	wind = setupdom(wind);
		});

		it("bw.DOM test equivalents...", () => {
		 	assert.equal(wind.document.getElementById("myTestSpan").innerHTML, "starter");
		 	assert.equal(wind.bw.DOMGetElements("myTestSpan","id")[0].innerHTML, "starter");
		});
		it("bw.DOM test equivalents...", () => { 	
		 	var res = wind.bw.DOMGetElements("foo","className")[0].innerHTML;
		 	assert.equal(wind.document.getElementsByClassName("foo")[0].innerHTML, res);
		});


});

describe("#bw.DOM())", function() {
/**
 bw.DOM and bw.DOMSetElements


*/

		var wind;
		beforeEach(() => {
		  	wind = setupdom(wind);
		});


		it("bw.DOM test equivalents...", () => {
		 	assert.equal(wind.document.getElementById("myTestSpan").innerHTML, "starter");
		 	assert.equal(wind.bw.DOM("#myTestSpan")[0].innerHTML, "starter");
		});
		it("bw.DOM test equivalents...", () => { 	
		 	
		 	wind.bw.DOM(".foo","fizbinn");
		 	assert.equal(wind.document.getElementsByClassName("foo")[0].innerHTML, "fizbinn");
		});
		it("bw.DOM test equivalents...", () => { 	
		 	wind.bw.DOM("span","fizbinnagain");
		 	assert.equal(wind.document.getElementsByTagName("span")[0].innerHTML, "fizbinnagain");
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
//====================================================================================
describe("#URLParamParse(url, optKey, OptDefValue - parse URL query string (must have ? present) to get values", function() {
/**
 test extraction or URL params.  note in bitwrench this is used both for URL parsing and "command line" args parsing
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
//====================================================================================
describe("#URLHash (url,defValue) - returns the hash portion of a url encoded string.  If no params supplied attempts to get has from window.location.href", function() {
/**
	see if a URL has a hash string at the end 
*/
	var tests = [
		{args: [], expected: undefined},
		{args: ["http://bar.com:80?foo=bar&x=234&y=45#123"], expected:"123" },
		{args: ["?a=123&b=234","no"], expected:"no" },
	];
	
	
	tests.forEach(function(test) {
		it("bw.URLHash " + test.args.length + "args", function() {
			var res = bw.URLHash.apply(null, test.args);
			if (typeof res == "string")
				assert.equal(res, test.expected);
			else
				assert.deepEqual(res, test.expected);
		});
 	});
});
//====================================================================================
describe("#URLParamPack (dict,addQuestionToFront) -packs a simple (not deep) dict in to URL form", function() {
/**
	pack a simple dict to a URL encoded string. 
*/
	var tests = [
		{args: [{123:"abc",234:456}], expected: "123=abc&234=456"},
		{args: [{123:"abc",234:456},true], expected: "?123=abc&234=456"},
		{args: ["foo"], expected:"" },
	];
	
	
	tests.forEach(function(test) {
		it("bw.URLParamPack " + test.args.length + "args", function() {
			var res = bw.URLParamPack.apply(null, test.args);
			assert.deepEqual(res, test.expected);
		});
 	});
});
//====================================================================================
describe("#htmlSafeStr (string) -encodes chars such as & < > ' etc to HTML safe equiv. also handles spaces, linefeeds and tabs", function() {
/**
	see if a URL has a hash string at the end 
*/
	var tests = [
		{args: ["<>& x\tx\nabc"], expected: "&lt;&gt;&amp; x&nbsp;&nbsp;&nbsp;&nbsp;x<br>abc"},
		{args: ["abcdefghijklmopqurstuvwxyz1234567890-=_+[]{}|;',./?"], expected: "abcdefghijklmopqurstuvwxyz1234567890-=_+[]{}|;&#039;,./?"}
	];
	
	
	tests.forEach(function(test) {
		it("bw.htmlSafeStr " + test.args.length + "args", function() {
			var res = bw.htmlSafeStr.apply(null, test.args);
			assert.deepEqual(res, test.expected);
		});
 	});
});
//====================================================================================
describe("#htmlJSON(any object) -encodes an object to viewable HTML", function() {
/**
	
*/
	var tests = [
		{args: ["123#123"], expected: `<pre style='white-space:pre-wrap;'><span style="color:purple">"123#123"</span></pre>`},
		{args: [{1:2,3:4,5:{a:1,b:3},c:[2,3,4,{5:"abc"},6]}], expected: 
		//yay for template strings!
`<pre style='white-space:pre-wrap;'>{
  <span style="color:red">"1":</span> <span style="color:green">2</span>,
  <span style="color:red">"3":</span> <span style="color:green">4</span>,
  <span style="color:red">"5":</span> {
    <span style="color:red">"a":</span> <span style="color:green">1</span>,
    <span style="color:red">"b":</span> <span style="color:green">3</span>
  },
  <span style="color:red">"c":</span> [
    <span style="color:green">2</span>,
    <span style="color:green">3</span>,
    <span style="color:green">4</span>,
    {
      <span style="color:red">"5":</span> <span style="color:purple">"abc"</span>
    },
    <span style="color:green">6</span>
  ]
}</pre>`}
	];
	
	
	tests.forEach(function(test) {
		it("bw.htmlJSON " + test.args.length + "args", function() {
			var res = bw.htmlJSON.apply(null, test.args);
			assert.deepEqual(res, test.expected);
		});
 	});
});
//====================================================================================

describe("#makeCSS()", function() {
/**
	makeCSS
 */
 `
cssData = "h2 {color:blue;}"      // string as full rule (all correctness is on the caller)
cssData = ["h2 {color:blue;}"]    // array entry but single string
cssData = ["h2 {color:blue}", "div {width:30px}"] // 2 entries, both strings
cssData = [["h2","color:blue"]] // array of rules (here length 1 rule)
cssData = [["h2","color:blue"], ["h3", "font-color:red"]] // array of rules
cssData = [
            [["h2","h4"], "color:blue"],  // array or selectors, string for rule
             ["h3", "color:red"]          // string for selector, string for rule
          ]
cssData = [ 
            [["h1","div p"],["color:blue","display:block"]], ==> h1, div p      {color: blue; diplay:block;}
            "h3 {color:red;}",                               ==> h3             {color: red;}
            [["div",".myClass"],"color : red"],              ==> div,.myClass   {color: red;}
            ["p > .myclass", ["color:red","display:block"]]  ==> p > .myClass   {color: red;  display:block;}
          ]
cssData = [
            [str, {}]
          ]
cssData = [
            [[selectors], { dict }]
          ]
`

	var tests = [
		{args: ["h2 {color:blue;}"], expected:"\nh2 {color:blue;}\n" },
		{args: [["h2 {color:blue;}"]], expected:"\nh2 {color:blue;}\n" },
		{args: [["h2 {color:blue}", "div {width:30px}"]], expected:"\nh2 {color:blue}\ndiv {width:30px}\n" },
		{args: [[["h2","color:blue"]]], expected:"\nh2 {color:blue}\n\n"},
		{args: [[[["h2","h4"], "color:blue"],["h3", "color:red"]]], expected: "\nh2, h4 {color:blue}\n\nh3 {color:red}\n\n"},
		{args: [
			[ 
            [["h1","div p"],["color: blue","display: block"]],
            "h3 {color: red;}",                               
            [["div",".myClass"],"color: red;"],             
            ["p > .myClass", ["color: red","display: block"]]  
          	]
          ], expected: "\nh1, div p {color: blue; display: block;}\n\nh3 {color: red;}\ndiv, .myClass {color: red;}\n\np > .myClass {color: red; display: block;}\n\n"
      	},
      	{args: [
      		[[".myclass", {color:"red", "font-weight":700}]]
      		], expected :"\n.myclass {color: red; font-weight: 700;}\n\n" },
      	{args: [
      		[[[".myclass","div > p"], {color:"red", "font-weight":700}]]
      		], expected :"\n.myclass, div > p {color: red; font-weight: 700;}\n\n" }
          
	];
	
	tests.forEach(function(test) {
		it("bw.makeCSS" + test.args.length + "args", function() {
			var res = bw.makeCSS.apply(null, test.args);
			assert.deepEqual(res,test.expected);
		});
 	});
});
//====================================================================================
describe("#makeCSSRule()",function(){
	var tests = [
		{args: [
      		[".myclass", {color:"red", "font-weight":700}],{pretty:false}
      		], expected :".myclass{color:red;font-weight:700;}" },
      	{args: [
      		[[".myclass","div > p"], {color:"red", "font-weight":700}],{pretty:true}
      		], expected :".myclass, div > p\n{\n  color: red; \n  font-weight: 700; \n}\n" }
      ];

	tests.forEach(function(test) {
		it("bw.makeCSSRule" + test.args.length + "args", function() {
			var res = bw.makeCSSRule.apply(null, test.args);
			assert.deepEqual(res,test.expected);
		});
 	});
});

//====================================================================================
describe("#clearTimer()", function() {
/**
 test conversion of RGB style colors to HSL
*/
	var tests = [
		{args: [], expected:true },
		{args: ["clearTimerMsg"], expected:true },
	];
	bw.logExport({clear:true})
	
	tests.forEach(function(test) {
		it("bw.clearTimer  " + test.args.length + "args", function() {
			var ref = bw.logExport()[1][1];
			var res = bw.clearTimer.apply(null, test.args);
			assert.equal((res-ref) < 3400,true);
			if (test.args[0]=="clearTimerMsg")
				assert(bw.logExport().filter(function(x){return x[1]=="clearTimerMsg"?true:false}).length > 0);//bw.logExport()[2][1]);
		});
 	});
});
// ================================================================
describe("#htmlIsVoidTag()", function() {
/**
 gen HTML table from simple array
*/
	var tests = [
		{args: ["div"], expected: false},
		{args: ["p"],  expected: false},
		{args: ["br"], expected: true},
		{args: ["meta"], expected: true}
	];
	
	tests.forEach(function(test) {
		it("bw.htmlIsVoidTag  " + test.args.length + "args", function() {
			var res = bw.htmlIsVoidTag.apply(null, test.args);
			assert.deepEqual(res, test.expected);
		});
 	});

});
// ================================================================
describe("#htmlEmit()", function() {
/**
 gen HTML from object (or JSON) 
*/
	var tests = [
		{args: ["test content"], expected: "test content" },
		{args: [{c:"test content"}], expected: "<div>test content</div>" },
		{args: [{t:"",c:"test content"}], expected: "test content" },

	];
	
	tests.forEach(function(test) {
		it("bw.htmlEmit  " + test.args.length + "args", function() {
			var res = bw.htmlEmit.apply(null, test.args).html;
			assert.deepEqual(res, test.expected);
		});
 	});

});

// ================================================================
describe("#htmlTable()", function() {
/**
 gen HTML table from simple array
*/
	var tests = [
		{args: [[[1,2,3],[2,3,4]]], expected: "<table class=\"bw-table bw-table-stripe\" ><thead><tr><th>1</th><th>2</th><th>3</th></tr></thead><tbody><tr><td>2</td><td>3</td><td>4</td></tr></tbody></table>" }
	];
	
	tests.forEach(function(test) {
		it("bw.htmlTable  " + test.args.length + "args", function() {
			var res = bw.htmlTable.apply(null, test.args);
			assert.deepEqual(res, test.expected);
		});
 	});

});
// ================================================================
describe("#naturalCompare()", function() {
/**
 sorting function for strings and nums in HTML table other array sorts
*/
	var tests = [
		{args: [-2,2], expected: -1 },
		{args: [2,-2], expected: 1 },
		{args: ["abc",-2], expected: +1 },
		{args: ["abc","def"], expected: -1 },
		{args: ["abc","abc"], expected: 0 }
	];
	
	tests.forEach(function(test) {
		it("bw.naturalCompare " + test.args.length + "args", function() {
			var res = bw.naturalCompare.apply(null, test.args);
			assert.equal(res, test.expected);
		});
 	});

 	var test2 = [
 			{args: [-2,3,"-3","3",0,"1xx","11xx","10xx",9], expected: ["-3", -2, 0, "1xx", 3, "3", 9, "10xx", "11xx"]}
 			];

 	test2.forEach(function(test) {
		it("bw.naturalCompare :: full array " + test.args.length + " args", function() {
			assert.deepEqual(test.args.sort(bw.naturalCompare),test.expected)
			
		});
 	});


});
// ================================================================

describe("#bw.isNodeJS())", function() {
/**
 bw.DOM checks

*/
	
		var wind;
		beforeEach(() => {
		  	wind = setupdom(wind);
		});

		it("isNodeJS() in window (jsdom)", () => {
		 	assert.equal(wind.bw.isNodeJS(), false); // test jsdom is using bw correctly in window context
		});
		it("isNodeJS() in nodejs", () => { 	
		 	assert.equal(bw.isNodeJS(), true);
		});
		
		it("isNodeJS() in nodejs", () => { 	
			bw.__monkey_patch_is_nodejs__.set(false);
			console.log(bw.__monkey_patch_is_nodejs__.get(),bw.isNodeJS())
		 	assert.equal(bw.isNodeJS(), false);
		 	bw.__monkey_patch_is_nodejs__.set("ignore");
		});
		

});


// ================================================================
describe("#loremIpsum", function() {
/**
test docString raw etractor.  Note this function does not parse the doc string it just returns an array of valid doc strings from the supplied string.
This can be used on functions or objects via the toString() operator.

e.g. var myFunction = function( .... ) { ..... function body }

bitwrench.docString(myFunction.toString()) ==> returns any doc strings inside.
*/
	var tests = [
		{args: [25], expected: "Lorem ipsum dolor sit ame"},
		{args: [25,1], expected: "Orem ipsum dolor sit amet"},
		{args: [25,5,1], expected: "Mipsum dolor sit amet, co"},
		{args: [25,5,0], expected: " ipsum dolor sit amet, co"},
		{args: [2000,5,1], expected: "Mipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo."}
	
	];

	tests.forEach(function(test) {
		it("bw.loremIpsum " + test.args.length + "args", function() {
			var res = bw.loremIpsum.apply(null, test.args);
			assert.deepEqual(res, test.expected);
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
// ================================================================
describe("#isHexStr(str) return whether a string is hexadecimal number (returns number of hex digits if true)", function() {
	var tests = [
		{args: ["123abc"],  expected: 6},
		{args: ["123abc-23","#-"],  expected: 8},
		{args: ["123zabc-23","-"],  expected: false}
	];
  
  	tests.forEach(function(test) {
    	it("bw.isHexStr   " + test.args.length + " args", function() {
	      	var res = bw.isHexStr.apply(null, test.args);
	      	assert.deepEqual(res, test.expected);
    	});
 	});

});
// ================================================================
describe("#fixNum(num,sf) trims a number to sf number of digits ", function() {
	var tests = [
		{args: [123.345,2],  expected: 123.34},
		{args: [-345.345,1],  expected: -345.3},
		{args: [345,-1],  expected: 340}
	];
  
  	tests.forEach(function(test) {
    	it("bw.fixNum   " + test.args.length + " args", function() {
	      	var res = bw.fixNum.apply(null, test.args);
	      	assert.deepEqual(res, test.expected);
    	});
 	});

});
// ================================================================
describe("#multiArray() creates a multiDim array ", function() {
	var tests = [
		{args: [2,[2,3]],  expected: [[2,2,2],[2,2,2]]},
		{args: ["test",[3,2]],  expected: [["test","test"],["test","test"],["test","test"]]},
		{args: [function(){return 3;},[3,2]],  expected: [[3,3],[3,3],[3,3]]}
	];
  
  	tests.forEach(function(test) {
    	it("bw.multiArray   " + test.args.length + " args", function() {
	      	var res = bw.multiArray.apply(null, test.args);
	      	assert.deepEqual(res, test.expected);
    	});
 	});

});
// ================================================================
describe("#clip(x,lo,hi) clips a number between 2 values ", function() {
	var tests = [
		{args: [2,-4,5],  expected: 2},
		{args: [-10,-4,5],  expected: -4},
		{args: [10,-4,5],  expected: 5},
		{args: [[1,4,8,35], 2, 20], expected: [2,4,8,20]}
	];
  
  	tests.forEach(function(test) {
    	it("bw.clip   " + test.args.length + " args", function() {
	      	var res = bw.clip.apply(null, test.args);
	      	assert.deepEqual(res, test.expected);
    	});
 	});
});

// ================================================================
describe("#mapScale(x,inLo,inHi,outLo,OutHi,opts) scales a number btw 2 values ", function() {
	var tests = [
		{args: [1,0,10,100,200],  expected: 110},
		{args: [[1,2,3],0,10,100,200],  expected: [110,120,130]},
		{args: [22,20,40,200,400,{expScale: 2.0}], expected: 262.005},
		{args: [-22,20,40,200,400,{expScale: 3.0,clip:true}], expected: 200.081}
	];
  
  	tests.forEach(function(test) {
    	it("bw.mapScale   " + test.args.length + " args", function() {
	      	var res = bw.mapScale.apply(null, test.args);
	      	res = typeof res == "number" ? bw.fixNum(res,3) : res.map(function(x){return bw.fixNum(x,3)});
	      	assert.deepEqual(res, test.expected);
    	});
 	});
});
// ================================================================
describe("#padNum(x,width,padOpts", function() {
	var tests = [
		{args: [123,5],  expected:  "  123"},
		{args: [1234,5],  expected: " 1234"},
		{args: [123,5, {pad:"x"}],  expected: "xx123"},
		{args: ["abc",5, {pad:"x"}],  expected: "xxabc"}				
	];
  
  	tests.forEach(function(test) {
    	it("bw.padNum   " + test.args.length + " args", function() {
	      	var res = bw.padNum.apply(null, test.args);
	      	assert.deepEqual(res, test.expected);
    	});
 	});
});

// ================================================================
describe("#bw.trim(str,dir)", function() {
	var tests = [
		{args: [" abc "],  expected:  "abc"},
		{args: [" abc ","left"],  expected:  "abc "},
		{args: [" abc ","right"],  expected:  " abc"},
		{args: [" abc ","both"],  expected:  "abc"},
		{args: [" abc ","none"],  expected:  " abc "}

	];
  
  	tests.forEach(function(test) {
    	it("bw.trim   " + test.args.length + " args", function() {
	      	var res = bw.trim.apply(null, test.args);
	      	assert.deepEqual(res, test.expected);
    	});
 	});
});
// ================================================================
describe("#padString(x,width,padOpts", function() {
	var tests = [
		{args: ["this is it",20,"left"] ,  expected:  "          this is it"},
		{args: ["this is it",20,"right"],  expected:  "this is it          "},
		{args: ["this is it",20,"center"], expected:  "     this is it     "},
		{args: ["this is it",20,"center",{trimDir:"both",pad:"x"}], expected:  "xxxxxthis is itxxxxx"},
	];
  
  	tests.forEach(function(test) {
    	it("bw.padString   " + test.args.length + " args", function() {
	      	var res = bw.padString.apply(null, test.args);
	      	assert.deepEqual(res, test.expected);
    	});
 	});
});
// ================================================================
describe("#random(x,lo,hi,opts) - generate a random number between lo, hi", function() {

  
	it("bw.random ()  ", function() {
      	var res = bw.random();
      	assert( (res >= 0 && res <=100));
	});
	it("bw.random (20,30)  ", function() {
      	var res = bw.random(20,30);
      	assert( (res >= 20 && res <=30));
	});
	it("bw.random (0,1,{setType:'float'})  ", function() {
      	var res = bw.random(0,1,{setType:"float"});
      	assert( (res >= 0 && res <=1));
	});
	it("bw.random (0,1,{setType:'float'})  ", function() {
      	var res = bw.random(30,40,{setType:"int",dims:[2,2]});
      	res = [res[0][0], res[0][1], res[1][0], res[1][1]];
      	assert( res.filter(x => (x>40) ||(x<  30)).length == 0);
	});
});

// ================================================================

describe("#prandom(x,lo,hi,opts) - generate a random number between lo, hi, using a seed (repeated able random #s)", function() {

  
	it("bw.prandom ()  ", function() {
      	var res = bw.random();
      	assert( res != 73);
	});
	it("bw.prandom (20,30)  ", function() {
      	var res = bw.prandom(20,30);
      	assert( (res >= 20 && res <=30));
	});
	it("bw.prandom (0,1,10,{setType:'float'})  ", function() {
      	var res = bw.prandom(0,1,{setType:"float"});
      	assert( (res >= 0 && res <=1));
	});
	it("bw.random (0,1,{setType:'float'})  ", function() {
      	var res = bw.prandom(30,40,10,{setType:"int",dims:[2,2]});
      	res = [res[0][0], res[0][1], res[1][0], res[1][1]];
      	assert( res.filter(x => (x>40) ||(x<  30)).length == 0);
	});
});

// ================================================================
describe("#hashFnv32a(str, seed, returnAsHexStr) - generate a quick checksum (Fnv32a) of a string", function() {
var tests = [
		{args: ["this is it"] ,  expected:  3562000208},
		{args: ["this is it",32] ,  expected:  2503917409},
		{args: ["this is it",33] ,  expected:  857015836},
		{args: ["this is it",32,true] ,  expected:  "953ebf61"}
		
	];
  
  	tests.forEach(function(test) {
    	it("bw.hashFnv32a   " + test.args.length + " args", function() {
	      	var res = bw.hashFnv32a.apply(null, test.args);
	      	assert.deepEqual(res, test.expected);
    	});
 	});

});
// ================================================================
describe("#CSSSimpleStyles (appendToHead, options) create the default bitwrench CSS styles, classes", function() {
var tests = [
		{args: [] ,  
			expected:  
`
*{box-sizing:border-box;}
.bw-def-page-setup{height:100%;width:90%;margin:0 auto;padding-left:2%;padding-right:2%;left:0;top:1%;box-sizing:border-box;}
.bw-font-serif{font-family:Times New Roman, Times, serif;}
.bw-font-sans-serif{font-family:Arial, Helvetica, sans-serif;}

.bw-left{text-align:left;}
.bw-right{text-align:right;}
.bw-center{text-align:center;margin:0 auto;}
.bw-justify{text-align:justify;}
.bw-code{font-family:monospace;white-space:pre-wrap;}
.bw-pad1{padding-left:1%;padding-right:1%;}

.bw-table{border-collapse:collapse;border-spacing:0;border:1px solid #444;}
.bw-table th{background-color:#bbb;padding:4px;border:1px solid #444;}
.bw-table td{padding:4px;border:1px solid #444;}
.bw-table-stripe tr:nth-child(even){background-color:#f0f0f0;}
.bw-table tr td:first-child{font-weight:700;}
.bw-table-border-round{border-radius:2px;}
.bw-table-sort-upa::after{content:\"\\2191\";}
.bw-table-sort-dna::after{content:\"\\2193\";}
.bw-table-sort-xxa::after{content:\"\\00a0\";}

.bw-tab-item-list{margin:0;padding-inline-start:0;}
.bw-tab-item{display:inline;padding-top:0.75em;padding-left:0.75em;padding-right:0.75em;border-top-right-radius:7px;border-top-left-radius:7px;}
.bw-tab-active{font-weight:700;}
.bw-tab:hover{cursor:pointer;font-weight:700;}
.bw-tab-content-list{margin:0;padding-top:0.0em;}
.bw-tab-content{display:none;border-radius:0;}
.bw-tab-content, .bw-tab-active{background-color:#ddd;padding:0.5em;}

.bw-accordian-container > div{padding:0.5em;}

.bw-container{margin:0 auto;}
.bw-row{width:100%;display:block;}
.bw-row [class^=\"bw-col\"]{float:left;}
.bw-row::after{content:\"\";display:table;clear:both;}
.bw-box-1{padding-top:10px;padding-bottom:10px;border-radius:8px;}

.bw-sign{position:inherit;display:table;height:100%;width:100%;}
.bw-sign > div{display:table-cell;vertical-align:middle;}
.bw-sign > div > div{text-align:center;}

.bw-hide{display:none;}
.bw-show{display:block;}
.bw-h1{font-size:2.312rem;}
.bw-h2{font-size:1.965rem;}
.bw-h3{font-size:1.67rem;}
.bw-h4{font-size:1.419rem;}
.bw-h5{font-size:1.206rem;}
.bw-h6{font-size:1.025rem;}

.bw-col-1{width:8.333%;}
.bw-col-2{width:16.666%;}
.bw-col-3{width:25%;}
.bw-col-4{width:33.333%;}
.bw-col-5{width:41.666%;}
.bw-col-6{width:50%;}
.bw-col-7{width:58.333%;}
.bw-col-8{width:66.666%;}
.bw-col-9{width:75%;}
.bw-col-10{width:83.333%;}
.bw-col-11{width:91.666%;}
.bw-col-12{width:100%;}

.bw-color-color {color:#000}
.bw-color-background-color {background-color:#ddd}
.bw-color-active {active:#222}
.bw-thm-light
{
  color: #020202 !important;; 
  background-color: #e2e2e2 !important;; 
}
.bw-thm-dark
{
  color: #e2e2e2 !important;; 
  background-color: #020202 !important;; 
}
@media only screen and (min-width: 540px) {.bw-def-page-setup {width: 96%;}}
@media only screen and (min-width: 720px) {.bw-def-page-setup {width: 92%;}}
@media only screen and (min-width: 960px) {.bw-def-page-setup {width: 88%;}}
@media only screen and (min-width: 1100px){.bw-def-page-setup {width: 86%;}}
@media only screen and (min-width: 1600px){.bw-def-page-setup {width: 84%;}}
`

		}
		
	];
  
  	tests.forEach(function(test) {
    	it("CSSSimpleStyles   " + test.args.length + " args", function() {
	      	var res = bw.CSSSimpleStyles.apply(null, test.args);
	      	assert.deepEqual(res, test.expected);
    	});
 	});

});

// ================================================================
describe("#CSSSimpleThemes (index, options) simple styles for live use", function() {
var tests = [
		{args: [1,false,{}] ,  
			expected:  
`*{background-color:#f8f8f8;color:#111;font-family:sans-serif;box-sizing:border-box;}
body{margin-top:1%;}
th{background-color:#ddd;}
tbody tr:nth-child(even){background-color:#ddd;}
table,td,th{border-collapse:collapse;border:1px solid #111;}
td,th{padding:4px;}
div,body,button,table,input{border-radius:2px;}`
		}
		
	];
  
  	tests.forEach(function(test) {
    	it("CSSSimpleThemes   " + test.args.length + " args", function() {
	      	var res = bw.CSSSimpleThemes.apply(null, test.args);
	      	assert.deepEqual(res, test.expected);
    	});
 	});

});

// ================================================================
describe("#bw.selectTabContent()", function() {
/**
 

*/
	
		let window;
		beforeEach(() => {
var myTabs = 
`
<div class="bw-tab-container">  <!-- bw-tab-container -- bw-tab-items (array of items), bw-tab-content (array of content to show) -->
    <ul class="bw-tab-item-list"> <!-- container for the tabs -->
        <li class="bw-tab userTab  bw-tab-active" onclick="bw.selectTabContent(this)" >Tab 1</li>
        <li class="bw-tab userTab  " onclick="bw.selectTabContent(this)" >Tab 2</li>
        <li class="bw-tab userTab  " onclick="bw.selectTabContent(this)" >Tab 3</li>
        <li class="bw-tab userTab  " onclick="bw.selectTabContent(this)" >Tab 4</li>
    </ul>
    <div class="bw-tab-content-list"> <!-- container for the tab content -->
        <div class="bw-tab-content bw-show" >coontent area 1 </div>  <!-- bw-show picks which tab to make active at first -->
        <div class="bw-tab-content" >content area 2</div>
        <div class="bw-tab-content" >content 3</div>
        <div class="bw-tab-content" >content 4</div>
    </div> <!-- end of tab content sect -->
</div>
`
			const testDoc = `<!DOCTYPE html><html><head></head><body><span id="myTestSpan">starter</span>{$myTabs}<div class="foo">default</div></body></html>`;
		  	window = (new JSDOM(testDoc, { runScripts: "dangerously" })).window;

		  	// Execute my library by inserting a <script> tag containing it.
		  	const scriptEl = window.document.createElement("script");
		  	scriptEl.textContent = bitwrenchFile;
		  	window.document.head.appendChild(scriptEl);
		});

		it("selectTab()", () => {

		 	//assert.equal(window.bw.isNodeJS(), false); // test jsdom is using bw correctly in window context
		});
});
// ================================================================
describe("#version() returns version info at runtime", function() {
	it("version()   " + 0 + " args", function() {
	      	var res = bw.version();
	      	assert(res.version.split(".").length>=3);
	      	assert((res.hasOwnProperty("about")));
	      	assert((res.hasOwnProperty("copy")));
	      	assert((res.hasOwnProperty("url")));
	      	assert.equal(res.license , "BSD-2-Clause");

    	});
});

