/*
 *  bitwrench.js  --- Misc Helper Functions .. 
 *	
 *  bitwrench is just a named space set of javascript helper functions useful for common web tasks and 
 *  some server side js.   No rhyme or reason I just needed these items over and overgain and didn't feel
 *  like cobbling together different common libs
 *
 *  M. A. Chatterjee 2013
 *
 *	@copy Copyright (C) <2013>  <M. A. Chatterjee>
 *  	
 *  @author M A Chatterjee <deftio [at] deftio [dot] com>
 *
 *	This software is provided 'as-is', without any express or implied
 *	warranty. In no event will the authors be held liable for any damages
 *	arising from the use of this software.
 *
 *	Permission is granted to anyone to use this software for any purpose,
 *	including commercial applications, and to alter it and redistribute it
 *	freely, subject to the following restrictions:
 *
 *	1. The origin of this software must not be misrepresented; you must not
 *	claim that you wrote the original software. If you use this software
 *	in a product, an acknowledgment in the product documentation is required.
 *
 *	2. Altered source versions must be plainly marked as such, and must not be
 *	misrepresented as being the original software.
 *
 *	3. This notice may not be removed or altered from any source
 *	distribution.
 *
 */	
//JS Hint linter directives
/*jshint -W069 */ //suppresses warning about using x.var_name vs x["var_name"]

 //usage in browser
//<script type="text/javascript" src="./bitwrench.js"></script>

//usage in nodejs
//var bw = require('./bitwrench.js');  //adds to current scope in nodejs

 // optional polyfill for IE8 and earlier
 "use strict";
 /* istanbul ignore next */ 
(function(fn){ // this is a polyfill for IE7/IE8
    /*
    //node.textContent
    // Source: Eli Grey @ https://eligrey.com/blog/post/textcontent-in-ie8
    if (Object.defineProperty 
      && Object.getOwnPropertyDescriptor 
      && Object.getOwnPropertyDescriptor(Element.prototype, "textContent") 
      && !Object.getOwnPropertyDescriptor(Element.prototype, "textContent").get) {
      (function() {
        var innerText = Object.getOwnPropertyDescriptor(Element.prototype, "innerText");
        Object.defineProperty(Element.prototype, "textContent",
         // Passing innerText or innerText.get directly does not work,
         // wrapper function is required.
         {
           get: function() {
             return innerText.get.call(this);
           },
           set: function(s) {
             return innerText.set.call(this, s);
           }
         }
       );
      })();
    }
    */
    //Array stuff
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement  )    {
            "use strict";
            if (this == null) {
                throw new TypeError();
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 0) {
                n = Number(arguments[1]);
                if (n != n) { // shortcut for verifying if it's NaN
                    n = 0;
                } else if (n != 0 && n != Infinity && n != -Infinity) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        };
    }
    if (!fn.map) fn.map=function(f){var r=[];for(var i=0;i<this.length;i++)r.push(f(this[i]));return r;};
    if (!fn.filter) fn.filter=function(f){var r=[];for(var i=0;i<this.length;i++)if(f(this[i]))r.push(this[i]);return r;};
    if (!String.prototype.trim) {String.prototype.trim = function () {  return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ""); };}

})(Array.prototype); // end polyfills
// * /

(function (root, factory) {
    if (typeof define === "function" && define.amd) { // eslint-disable-line no-undef
        // AMD. Register as an anonymous module.
        //define(['myRequiredDependancyModule'], factory); // use this if other modules required
        define([], factory); // eslint-disable-line no-undef
    } else if (typeof module === "object") {
                
        if ((typeof module !== "object" ) || (typeof module !== "function") ) // this hack required for older versions of node
            // var m =require("module");
            // Node. Does not work with strict CommonJS, but
            // only CommonJS-like environments that support module.exports,
            // like Node.
            //console.log("node...");
            var libm= factory();
            libm.exportModuleType = "module.exports";
            module.exports=libm;

    } else {
        //console.log("browser..",root, typeof root);
        // Browser globals (root is window)
        var libg = factory();
        libg.exportModuleType="global"; 
        root[libg["exportName"]] = libg;

    }
}(typeof self !== "undefined" ? self : this, function () { // note if needing requirements use ... (typeof self !== "undefined" ? self : this, function (myRequiredDependancyModule) 
"use strict";
    // Use b in some fashion.

    // Just return a value to define the module export.
    // This example returns an object, but the module
    // can return a function as the exported value.
    var bw = {};
    bw.exportName = "bw"; // 
    bw.exportModuleType = "AMD"; //default export see UMD wrapper above for more info this.  it allows the consumer to know how this was loaded.


// ===================================================================================
bw.choice    = function (x,choices,def) { 
/** 
bw.choice(x,choices-dictionary, default) 


Allows a dictionary to be used as a switch statement, including functions.

example:
    colors = {"red": 1, "blue": 2, "aqua" : function(z){return z+"marine"}};
    bw.choice("red",colors,"0")   ==> "1"
    bw.choice("shiny",colors,"0") ==> "0"
    bw.choice("aqua",colors)      ==> "aquamarine"
 */
    var z = (x in choices) ? choices[x] : def;
    return _to(z) == "function" ? z(x) : z;  
};   


// ===================================================================================
bw.jsonClone = function (x)       {
/** 
bw.jsonClone(object)

crude deep copy by value of an object as long as no js dates or functions
 */
    return JSON.parse(JSON.stringify(x));
};


// ===================================================================================
bw.typeOf    = function (x, baseTypeOnly)       {
/** 
_to(x, baseTypeOnly) returns a useful typeOf the object.

_to(2) // "number"
bw.typeof( function(){}) // "function"

function Car(make, model, year) {
    this.make = make;
    this.model = model;
    this.year = year;
}

x = new Car("Ford", "Escape", 2009);

_to(Car)      // "function"
_to(x)        // "Car"        ---> returns correct object type
_to(x,true)   // "object"     ---> returns base object type 

 */

//A useable typeof operator.  See this fantastic reference for a starter 
//https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/

    if (x === null)
        return "null";

    var y = (typeof x == "undefined") ? "undefined" : (({ /*empty*/}).toString.call(x).match(/\s([a-zA-Z]+)/)[1].toLocaleLowerCase());

    if ((y != "object") && (y != "function"))
        return y;
    if (baseTypeOnly == true) // so if undefind or anything but true
       return y; 

    var r = y;
    try {
        r =  (x.constructor.name.toLocaleLowerCase() == y.toLocaleLowerCase()) ?  y : x.constructor.name;  // return object's name e.g.
    }
    catch (e) {/*empty*/}
    return r;
};

var _to = bw.typeOf;
bw.to   = _to;
//===============================================
// internally used type check and assign function
bw.typeAssign = function (a, typeString, trueValue, falseValue) {
/** 
bw.typeAssign(variable, typeString, trueValue, falseValue) 
typeAssign is used to see if the argument a is of type typeString as defined by _to().
if it is then trueValue is returned else falseValue.

bw.typeAssign("23","number","is a number!", "not a number!") ==> "is a number!"
bw.typeAssign([23],"number","is a number!", "not a number!") ==> "not a number!" // is an array of length 1

can also supply list of types
bw.typeAssign(23,["string","number"], "string or num", "something else") ==> "string or num"
bw.typeAssign(true,["string","number"], "string or num", "something else") ==> "something else"
 */
    if (["string","array"].indexOf(_to(typeString)) == -1) // typeString must be a string or an arrag or strings
        typeString = "notValidType";

    if (_to(typeString) == "string")
        typeString = [typeString];

    return (typeString.indexOf(_to(a)) >= 0) ? trueValue : falseValue;
};

var _toa = bw.typeAssign;
bw.toa   = bw.typeAssign;  // eslint-disable-line no-unused-vars


//===============================================
// internally used type check and assign function with functional support (trueValue or falseValue can be functions which are passed the param a)

bw.typeConvert = function (a, typeString, trueValue, falseValue) {
/**
bw.typeConvert(variable, typeString, trueValue, falseValue) 
typeConvert is used to see if the argument a is of type typeString as defined by _to().
if it is then trueValue is returned else falseValue.

bw.typeConvert("23","number","is a number!", "not a number!") ==> "is a number!"
bw.typeConvert([23],"number","is a number!", "not a number!") ==> "not a number!" // is an array of length 1

can also supply list of types
bw.typeConvert(23,["string","number"], "string or num", "something else") ==> "string or num"
bw.typeConvert(true,["string","number"], "string or num", "something else") ==> "something else"

bw.typeConvert(23,["string","number"],function(x){return x+1},function(){return function(x){return x+2}})}) ==> 24

bw.typeConvert(23,["string"],function(x){return x+1},function(){return function(x){return x+2;}})}) ==> function(x){return x+2;}

however typeConvert also allows functions (as apposed to typeAssign)
*/
    if (["string","array"].indexOf(_to(typeString)) == -1) // typeString must be a string or an arrag or strings
        typeString = "notValidType";

    if (_to(typeString) == "string")
        typeString = [typeString];
      
    return (typeString.indexOf(_to(a)) >= 0) ? (_to(trueValue)  == "function") ? trueValue(a) : trueValue : ( _to(falseValue) == "function") ? falseValue(a): falseValue;
};
//var   _tc = bw.typeConvert;
bw.tc = bw.typeConvert;
//===============================================
// internally used function for options copy
// keys in opts are copied to dopts (or overwrite options in dopts)
/* istanbul ignore next */ 
var optsCopy =  function(dopts,opts) {
     /* istanbul ignore next */ 
    if ((_to(opts) == "object") && (_to(dopts)=="object")) {
        var i;
        for (i in opts)
            dopts[i] = opts[i];
    }
    return dopts;
};
// ===================================================================================
bw.arrayUniq =  function (x){
/** 
    arrayUniq(x)
    returns uniq elements of simple array x.
*/    
    if (_to(x) != "array")
        return [];
    return x.filter (function (v, i, arr) {return (arr.indexOf(v)==i);});
};
// ===================================================================================
bw.arrayBinA = function (a,b) {
/** 
    arrayBinA(x)
    returns intersection elements of to simple arrays a and b
*/      
    if ((_to(a)!="array") || (_to(b)!== "array"))
        return [];
    return bw.arrayUniq(a.filter(function(n) { return b.indexOf(n) !== -1;}));
};

bw.arrayBNotInA = function (a,b) {
/** 
    arrayBNotinA(x)
    returns  elements of b not present in a
*/      
    if ((_to(a)!="array") || (_to(b)!== "array"))
        return [];
    return bw.arrayUniq(b.filter(function(n) { return a.indexOf(n) < 0;}));
};

//===============================================
 /* istanbul ignore next */ 
bw.DOMIsElement = function(el) {
/**
@method bw.DOMIsElement() - returns whether a supplied element is a HTML DOM element. only useful in browser,
 */    
    var r = false;
    try {
        if(_to(el)== "undefined")
            return r;
        if ((bw.isNodeJS() == false) || (typeof Element == "function"))
            r = el instanceof Element;  

    } 
    catch(e) {
        r = (typeof HTMLElement === "object" ? el instanceof HTMLElement : //DOM2
            el && (typeof el === "object") && (el !== null) && (el.nodeType === 1) && (typeof el.nodeName==="string")
        );
        bw.logd(e.toString());
    }
    return r;
};

var _isEl = bw.DOMIsElement;

//===============================================
 /* istanbul ignore next */ 
bw.DOMGetElements = function (el, type) {
/**
@method DOMGetElements(el, type) returns an array of DOM elements (if running in browser)   

@param {string | DOM_node} el - if string uses CSS selector other wise if already a DOM element returns itself
@return an js array of zero or more matching DOM nodes

DOMGetElements always looks in the root.

*/

/*
TODO: 
 var container = document.querySelector("#test");
 var matches = container.querySelectorAll("div.highlighted > p");

*/
    var r=[],a=[],i;
    
    if (bw.isNodeJS() == false) 
    {  // we're running in a browser
        if (_isEl(el))
            return [el];  
        if (_to(el) == "string") { // now its a string so we have choices.. 
            type = _toa(type,"string",type,"auto"); // auto means detect whether has a # or . in front of it
            el.trim();
            if (type == "auto")
                type = bw.choice(el[0],{".":"className", "#":"id"},"tagName");
            type=type.toLowerCase();
            switch (type) {
                case "id" : //get Element by ID
                    el = (el[0]=="#") ? el.substring(1,el.length) : el;
                    a = document.getElementById(el);
                    a = _toa(a,"null",[],[a]);
                    break;
                case "classname": // get Elements by class name
                    el = (el[0]==".") ? el.substring(1,el.length) : el;
                    a = document.getElementsByClassName(el);
                    break;
                case "tagname" : // get Elements by tag name
                    a = document.getElementsByTagName(el);
                    break;
                case "name":
                    a = document.getElementsByName(el);
                    break;
                case "css" :
                    a = document.querySelectorAll(el);
                    break;
                default:  
                    a = document.querySelectorAll(el);

            }
            for (i in a)
                r.push(a[i]);
        }
    }

    return r.filter(function(x){return _isEl(x);});
};
//var _els = bw.DOMGetElements;

// =============================================================================================
 /* istanbul ignore next */ 
bw.DOMSetElements = function(domElement,param) {
/**
@method DOMSetElements(domElement, param) sets DOM elements with the supplied (optional) params 

@param {string | array | dict |function} - params to set on DOMElements
@return an js array of zero or more matching DOM nodes
*/

    var els = bw.DOMGetElements(domElement);
    if (els==[])
        bw.log("dom element not found");

    var i,l,e, ef = function(x,p){bw.log(x,p);};
    for (l=0; l<els.length; l++) {
        e = els[l];
        switch(_to(param)) {
            case "array":
                try{
                    for (i=0; i<param.length; i++) e[param[i][0]] = param[i][1];
                }
                catch(d) {ef(d,param);}
                break;
            case "object":
                try {
                    for (i in param)  e[i] = param[i];
                }
                catch(d) {ef(d,param);}
                break;
            case "string":
                try {
                    e.innerHTML = param;
                }
                catch(d) {ef(d,param);}
                break;
            case "function":
                try {
                    param(e); // apply a function to e
                }
                catch(d) {ef(d,param);}
                break;
            default: break;
        }
    }

    return els;
};

bw.DOM = bw.DOMSetElements; //short hand

// =============================================================================================
/** 
bitwrench: color functions (used for theming and interpolations)

bitwrench color functons operate using this internal color representation model:
[c0, c1, c2, alpha, model]  
where c0, c1, c2 are model dependant
alpha represents the transperancy
model is a color model string (lowercase) "rgb", or "hsl" (compatible with HTML/CSS colors)

colorParse() ==> take an input color of anymodel and output a bw [c0,c1,c2,a,m] array
*/
bw.colorInterp = function(x, in0, in1, colors, stretch) {
/**
@method colorInterp (x, lo, hi, colors[], stretch) - interpolate between and array of colors.  
    x is a number between the numbers in0 <= x <=  in1
    colors is an array of colors supplied in rgb format e.g. ["#123", "#234"]
    colors can be anylength 
*/
    var c = _toa(colors,"array",colors,["#000","#fff"]); // make sure we have an array of colors
    c = c.length == 0 ? ["#000","#fff"] : c; // no colors provide .. interp grayscale is default
    if (c.length == 1)
        return c[0];
    //ok now we we have an array of atleast length 2 which hopefully contains colors.
    c = c.map(function(x){return bw.colorParse(x);}); // all colors will now be converted to bw RGB format
    var a = bw.mapScale(x,in0,in1,0,c.length-1,{clip: true, expScale: stretch});
    var i = bw.clip(Math.floor(a),0,c.length-2);
    var r = a-i;
    var _f = function(x)  {return bw.mapScale(r,0,1, c[i][x],c[i+1][x],{clip:true});};
    return [_f(0), _f(1), _f(2),_f(3),"rgb"];

};


// =============================================================================================
bw.colorHslToRgb = function (h, s, l, a, rnd){
/**
@method colorHslToRgb
Converts an HSL color value to RGB. Conversion formula

Assumes h is [0..360] ,  s, and l are contained in the set [0 .. 100].
returns r, g, and b in the set [0, 255].

@param   {number}  h       The hue [0..360]
@param   {number}  s       The saturation [0..100]
@param   {number}  l       The lightness [0..100]

OR...

pass the colors as a bitwrench color array as a single parameter:

colorHslToRgb([h,s,l,a,"hsl"])

@return  {Array}           The RGB representation as [r, g, b, alpha, "rgb"]

last parameter rnd rounds the results to 0..255.  set to false to eliminate rounding.  This can be useful for chained calcs

see : adapted from  http://hsl2rgb.nichabi.com/javascript-function.php 

 */    
    if (_to(h)=="array") { // handles colors of [h,s,l,a,"hsl"]
        s=h[1];
        l=h[2];
        a=h[3];
        h=h[0]; //do this last so it doesn't overwrite iself
    }
    var _fn = rnd == false ? function(x){return x;} : function(x){return bw.clip(Math.round(x),0,255);} ;
   
    var r,g,b,c,x,m;
    h = (h+360)%360;
    h /= 60;
    if (h < 0) h = 6 - (-h % 6);
    h %= 6;

    s = Math.max(0, Math.min(1, s / 100));
    l = Math.max(0, Math.min(1, l / 100));

    c = (1 - Math.abs((2 * l) - 1)) * s;
    x = c * (1 - Math.abs((h % 2) - 1));

    if (h < 1) {
        r = c;     g = x;     b = 0;
    } else if (h < 2) {
        r = x;   g = c;  b = 0;
    } else if (h < 3) {
        r = 0; g = c;    b = x;
    } else if (h < 4) {
        r = 0;   g = x;  b = c;
    } else if (h < 5) {
        r = x;   g = 0;  b = c;
    } else {
        r = c;   g = 0;  b = x;
    }

    m = l - c / 2;
    r = (r + m) * 255;
    g = (g + m) * 255;
    b = (b + m) * 255;
    return [_fn(r),_fn(g),_fn(b),a,"rgb"];
};

// =============================================================================================
bw.colorRgbToHsl = function (r, g, b, a, rnd) {
/**
Converts an RGB color value to HSL. Conversion formula
adapted from http://en.wikipedia.org/wiki/HSL_color_space.
Assumes r, g, and b are contained in the set [0, 255] and
returns h as [0..360] s, and l in the set [0 .. 100].

@param   {number}  r       The red color value
@param   {number}  g       The green color value
@param   {number}  b       The blue color value

pass the colors as a bitwrench color array as a single parameter:
colorRgbToHsl([h,s,l,a,"rgb"])

last parameter rnd rounds the results to 0..255.  set to false to eliminate rounding.  This can be useful for chained calcs
@return  {Array}           The HSL representation
*/
    if (_to(r)=="array") { // handles colors of [h,s,l,a,"hsl"]
        g=r[1];
        b=r[2];
        a=r[3];
        r=r[0]; //do this last so it doesn't overwrite iself
    }

    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    var _fn = rnd == false ? function (x){return x;} : function(x){return Math.round(x);} ;
    return [_fn(h*360), _fn(s*100), _fn(l*100), a, "hsl"];
};    

// =============================================================================================

bw.colorParse = function(s,defAlpha) {
/**
@method bw.colorParse(s)

@description take a valid CSS style color string: #rgb | #rgba | #rrggbb | #rrggbbaa | rgb(r,g,b) | rgb(r,g,b,a) | hsl(h,s,l) | hsla(h,s,l,a )  
... and return array [c0,c1,c2,a,model] where model is one of "rgb", "hsl"
*/
    defAlpha = _toa(defAlpha,"number",defAlpha,255);
    var r = [0,0,0,defAlpha,"rgb"]; // always return a valid type 
    if (_to(s)=="array"){ // it could be a bwcolor type [c0,c1,c2,a,model]
        var p,df = [0,0,0,255,"rgb"];
        for (p=0; p< s.length; p++)
            df[p]=s[p];
        s= String(df[4])+"("+String(df[0])+","+String(df[1])+","+String(df[2])+","+String(df[3])+")"; //could use slice..join(",")   
    }

    s = String(s).replace(/\s/g,"");
    var reT = /\s*(#|hsl|rgb|yuv|hsv){1}([a-f|A-F|0-9|,().\t ]*)/img;
    var i,j=0,x = reT.exec(s);
    if (_to(x)=="array" && (x.length >= 3)) {
        r[4]= x[1] == "#" ? "rgb" : x;
        if (x[1] ==  "#") {  //parse one of these #rgb #rgba #rrggbb #rrggbbaa
            switch (x[2].length) {
                case 3: //#rgb
                case 4: //#rgba
                    for (i=0; i< x[2].length; i++)
                        r[i] = parseInt(x[2][i]+x[2][i],16);
                    break;
                case 6: //#rrggbb
                case 8: //#rrggbbaa
                    for (i=0; i< x[2].length; i+=2)
                        r[j++] = parseInt(x[2][i]+x[2][i+1],16);
                    break;
                default:
                    bw.logd("bw.parseColor bad input "+ s);
            }
        }
        else { // its should be of form (c0,c1,c2) or (c0,c1,c2,alpha)
            r[4] = x[1].toLocaleLowerCase();
            if ((x[2][0] == "(") && (x[2][x[2].length-1] == ")")) { // parans are present
                var v = x[2].substring(1,x[2].length-1);
                v = v.split(",");
                switch(v.length){ // valid entries are 3 or 4 components
                    case 3:
                    case 4:
                        for (i=0; i< v.length; i++)
                            r[i] = Number(v[i]);
                        break;
                    default:
                        bw.logd("bw.parseColor bad input : " + s);    
                }
            } else {
                bw.logd("bw.parseColor bad input : " + s);
            }
        }
    }
    return r;
};

// =============================================================================================
bw.colorToRGBHex = function(c, format) {
/**
@method bw.colorToRGBHex(color) 
@description take a color of the form a string or  [c0,c1,c2,alpha,model] ==> convert to #rrggbbaa format
format (optional) can be set to auto in which case alpha is ommitted if set to 255
 */
    var r = "#00000000";
    var ph = function(x){var y=(bw.clip(Math.round(x),0,255)).toString(16); return (y.length==1)?"0"+y:y;}; // pad hex
    c = bw.colorParse(c); // converts color to bw color vector format
    switch(c[4]) {
        case "rgb":
            r = "#"+ph(c[0])+ph(c[1])+ph(c[2]);
            if (!((format == "auto") && (c[3]==255)))
                r += ph(c[3]);
            break;
        case "hsl":
            r= bw.colorToRGBHex(bw.colorHslToRgb(c)); 
            break;
        default:
            bw.logd("colorToRGBHex : unsupported format" + c[4]);
    }
    return r; // default
};
// =============================================================================================
bw.colorConvertColorSpace = function(c, space, rnd) {
/**
@method bw.colorConvertColorSpace(color, spaceToConvertTo) 
@description take a color and convert it to the destination color space ("rgb" | "hsl")
color can be any valid color type ("#abc" | "hs(...)" or [r,g,b,a,"rgb"] etc)

optional 3rd param rnd if set to false will suppress rounding in calcs to allow chained color conversion w/o loss of precision

*/
    c = bw.colorParse(c); 
    if (space == c[4])
        return c;

    switch(c[4]) {
        case "rgb":
            break;
        case "hsl":
            c = bw.colorHslToRgb(c[0],c[1],c[2],c[3],rnd); // turns off rounding
            break;
        default:
            bw.logd("colorConvertColorSpace: unsupported color format");
    }
    //now c is in the rgb space

    switch(space) {
        case "rgb":
            break;
        case "hsl":
            c = bw.colorRgbToHsl(c[0],c[1],c[2],c[3],rnd); // turns off rounding
            break;
        default:
            bw.logd("colorConvertColorSpace: unsupported color format");
    }
    return c;  
};

// =============================================================================================
var _logdata=[];

bw.log = function (value,msg,opts) {
/** 
bw.log(value, message, options)
write a value to the in-memory log
options {
    clear:  false | true | "clear-only"  
        false : normal write 
        true : clear log and add 1st entry
        clear-only - only clear don't write, value, msg 
    saveMethod: "raw" | "JSON"  // raw is default, save object as passed, JSON saves stringified version (useful for exporting or saving state)
}
 */
    var dopts = {
        clear     : false,  // values fales, true, "clear-only"
        saveMethod: "raw" // else "JSON" 
    };
    
    dopts = optsCopy(dopts,opts);
    if ((dopts["clear"] == true) || (dopts["clear"] == "clear-only")) {
        _logdata = [["Time-stamp (ms)"," Value "," Message "]];
        var ct = (new Date());
        _logdata.push ([0, ct.getTime()," log started at " + ct.toString()]);
    }

    msg     = _toa(msg,"undefined","",String(msg));
    value   = (dopts["saveMethod"]=="raw") ? value : JSON.stringify(value);

    if ((_to(value) != "undefined") && (dopts["clear"] != "clear-only"))
        _logdata.push([(new Date()).getTime()-_logdata[1][1], value, msg]);

    return _logdata.length -1;
};
bw.log("","",{clear:"clear-only"}); // initialize 

// =============================================================================================
bw.logd = function() {
/**
@method bw.logd() 
@description: bw.logd is a log funciton which behaves similar to console.log() however instread of outputting to console, 
it writes to bw.log() function with the following differences: 


*/
/*
todo: comma seperated items;  ? done
console     ==> also (attempt) to output to console.log ? would need to set a bw.state variable..
bwdbg       ==> log bw catches / errors (else silent) 
none        ==> no output (of any kind)
stringify   ==> takes bw.logd args and strinigyfies before writing to bw.log
example:
logd=console,bwlogd

*/
    var logdargs =  ("bwlogd" in bw.bwargs) ? bw.bwargs["bwlogd"].split(",") : [];

    if (logdargs.indexOf("none") < 0) {
        var i=0;
        var _a = [];
        for (i=0; i< arguments.length; i++)
            _a.push(arguments[i]); //arguments, a reserved javascript keyword, is not a true array
        bw.log(_a,"bw.logd: "+bw.bwargs["bwlogd"]); // message
    }
};
// =============================================================================================
bw.logExport = function(opts) {
/** 
bw.logExport(options) 
export the built in log.
default is "raw" which is an array of values:
[timestamp, <value logged>, <optional message from the event>]
[ .. , .. , .. ]

also can be exported as an HTML table.
bw.logExport({"format":"HTML"})

or as a simple text file:
bw.logExport("format" : "text"})

see bw.saveClientFile(fname) for saving the log as a file
 */
    var dopts = {
        "format" : "raw"  // can also be HTML table if set to "HTML"
    };
    dopts = optsCopy(dopts,opts);

    var _ld = _logdata;  

    if (dopts["format"] == "HTML") {
        return bw.makeHTMLTableStr(_ld,{sortable:true});
    }

    if (dopts["format"] == "text") {
        return _ld.map(function(x){return x.map(function(y){return bw.padString(y.toString(),16,"left");}).join("\t");}).join("\n");
    }

    return _ld;
};


// ===================================================================================
bw.setCookie = function (cname, cvalue, exdays) {
/** 
@method bw.setCookie(cookieName, value, expireDays)  set a client side cookie.  (browser only)
@param cname  : a string for the name of the cookie
@param cvalue : a string for the value of the cookie
@param expdays : cookie expiration date in days
  */
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
};
 
// ===================================================================================
bw.getCookie = function (cname, defaultValue) {
/** 
@method bw.getCookie: bw.getCookie(cookieName, defaultValueIfNotFound) (browser only)
get a client side cookie, if it is set.  returns defaultValue if cookie could not be found
 */
    var name = cname + "=";
    var ca = document.cookie.split(";");
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==" ") c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return defaultValue;
};


// ===================================================================================
bw.getURLParam = function (key, defaultValue) {
/** 
@method bw.getURLParam(key,defaultValueIfNotFound)
read the URL (e.g. http://example.com/my/page?this=that&foo=123&bub&x=123) and parse the URL paraemeters

x = bw.getURLParam() ==> returns entire dict of url params ==? {this:"that",foo:"123",bub:true,x:"123"}
x = bw.getURLParam("foo","whatever") ==> returns "123"
x = bw.getURLParam("bar","whatever") ==> returns "whatever" since bar isn't set 
x = bw.getURLParam("bub","whatever") ==> returns true  since bub doesn't have a value (note boolean true not "true")

*/
    if ((bw.isNodeJS()== true) || (typeof window != "object"))
        return defaultValue;
    try {
        if (window.location.href) {
            return bw.URLParamParse(window.location.href,key,defaultValue);
        }
    }
    catch (e) {
        bw.log(e);
    }
    return defaultValue;
    
};
bw.URLHash = function (url,defValue) {
/**
@method bw.URLHash(url,defValue) - returns the hash portion of a URL (if present) else return defValue
*/
    if (_to(url)=="undefined")
        url = typeof window == "object" ? window.location.href : "";

    var r = url.split(/#+/);
    return url.includes("#") ? r[r.length-1] : defValue;
};
//=================================================
bw.URLParamParse = function (url,key,defValue,allowHash) {
/**

@method bw.URLParamParse(urlString, key, defaultValue) 

decode a URL encoded string in to a javascript dictionary.  Other params (http, port, path) are not handled

if key is present than only that value is returned (as a string ) else defValue is returned.

examples:
x = URLParamParse("http://example.com?a=123&b=345") ==> {a:"123", b:"456"}
x = URLParamParse("http://example.com?a=123&b=345","a") ==> "123"
x = URLParamParse("http://example.com?a=123&b=345","c","otherValue") ==> {a:"123", b:"456"} ==> "otherValue"
 */
    
    try {
        var hs=function(u){var x = u.split(/^.*\?+/); return x.length==2 ? x[1] : "";};
        var sh=function(u,b){return (b==true) ? u : u.split(/#+/)[0];};
        var params={}, parts = sh(hs(url),allowHash).split("&");
        for (var i = 0; i < parts.length; i++) {
            var e = parts[i].split("=");
            if (!e[0]) 
                continue;
            params[decodeURIComponent(e[0])] = _to(e[1])=="string" ? decodeURIComponent(e[1].replace("#","%23")) : true;
        }
        if (_to(key)=="undefined")
            return params;
        return params.hasOwnProperty(key) ? params[key] : defValue;
    }
    catch (e) {
        bw.log(e);
        return defValue;
    }
};
//=================================================
bw.URLParamPack = function (simpleDict,inclQuestion) {
/**
    @method bw.URLParamPack(simpleDict, inclQuestion) : packs a simple dict in to URL encoded format
    @param simpleDict(object) - dictionary of simple key value pairs (not nested) if "deep" JSON needs to be packed then stringify that first 
    @param InclQuestion(boolean) - if true adds "?" to string otherwise ommitted.

    see also URLParamParse.  
    note if using bw.URLParamParse besure to include "?"" ==> bw.URLParamParse(bw.URLParamPack({a:1,b;2},"true"))
*/
    var k,s=[];
    if (_to(simpleDict) == "object") {
        for (k in simpleDict) {
            s.push([encodeURIComponent(k)+"="+encodeURIComponent(simpleDict[k].toString())]);
        }
        s = s.join("&");
    }
    else
        s="";

    return (inclQuestion ? "?" : "") + s;
};



// ===================================================================================
bw.htmlSafeStr = function (str) {
/** 
bw.htmlSageString(str) 
Replace non valid HTML characters with HTML escaped equivalents.   
 */
    //generic way..
    //var x = function(x){return "&#"+x.toString().charCodeAt(0)+";";}
    //return (str.toString()).replace(/[<>&\\#]/gm,x).replace(/[\n]/gm,"<br>");
    
    //old way is "pretty", tabs are issued 4 spaces..
    var c = {"<":"&lt;", ">":"&gt;", "&":"&amp;", "\"":"&quot;", "'":"&#039;","#":"&#035;","\\\\":"","\n":"<br>","\t":"&nbsp;&nbsp;&nbsp;&nbsp;"};
    return (str.toString()).replace(new RegExp("["+Object.keys(c).join("")+"]","gm"),function(s){return c[s];});
};



// ===================================================================================
bw.htmlJSON=function (json) {
/** 
@method bw.htmlJSON(object, styles) 
pretty print any javascript object as displayable HTML. 
e.g.
document.getElementById("myPlaceToDisplay").innerHTML = bw.prettyPrintJSON(...any object ....)
*/
//TODO make style dict as a param
    function f(json) { 
        json = JSON.stringify(json, undefined, 2);
        if (typeof json != "string") { json = JSON.stringify(json, undefined, 2);}
        
        json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); //html safe chars
        //json = bw.htmlSafeStr(json);
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
            var sty = "color: darkorange;";
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    sty = "color:red";
                } else {
                    sty = "color:purple";
                }
            } else if (/true|false/.test(match)) {
                sty = "color:grey";
            } else if (/null/.test(match)) {
                sty = "color:black";
            } else
                sty = "color:green";
            return "<span style=\"" + sty + "\">" + match + "</span>";
        });
    }
    return "<pre style=''>"+f(json)+"</pre>";
};

// ===================================================================================
bw.makeCSS = function (cssData, options) {
/** 
bw.makeCSS(cssData, options)

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

dicts not used at root because css can have multiple redundant selectors with different rules

 */
    var dopts = {
        emitStyleTag: false,
        atr: {},
        pretty : false
    };
    dopts = optsCopy(dopts,options);

    var s="\n";
    var tb = function (a) {a =(String(a)).trim(); a=(a[0]=="{"?" ":" {")+a; a+=(a[a.length]=="}"?"":"}")+"\n"; return a;};
    //var rl = "";
    try {
        switch (_to(cssData)) {
            case "string":
                s += cssData +"\n";
                break;
            case "array":
                var i; 
                for (i=0; i<cssData.length; i++) {
                    var j = cssData[i];
                    switch (_to(j)) {
                        case "string":  // this means we assume correcly formatted style is being passed in and we're just letting it through e.g. ".myclass {color:red}"
                            s+= j+"\n"; 
                            break;
                        case "array" : //expects length 2 array for each entry, though 2nd member can be dict or array
                                    //  ==>[str, str], [[str,str,str],str] , [str, {}], [[str,str,str],{}]
                            if ((j.length == 1) && (_to(j[0])=="string")) {
                                s+= j[0]+"\n";
                                break;
                            }
                            
                            if (j.length == 2) {
                                var _name = j[0], _rule = j[1], _ruleOutput="";
                                if (_to(_name)=="array") {
                                    s+= _name.join(", ");
                                }
                                else {
                                    s+= String(_name);
                                }
                                // now we have the names e.g. ("h2" or "h2,.myClass") done we need to emit the rules
                                switch( _to(_rule)) {
                                    case "array" :  // ["h2", ["color: black","left:20%"]] or [["h2",".myClass"], ["color: black","left:20%"]]
                                        _ruleOutput = _rule.join("; ")+";";
                                        break;
                                    case "object" : //  ["h2", {color: "black", left:"20%"}] or [["h2",".myClass"], {color:black, left:"20%"}]
                                        {
                                            var x;
                                            for (x in _rule) { _ruleOutput += (x + ": " + _rule[x]+"; ");}
                                            //_ruleOutput = bw.makeCSSRule([_name,_rule],{pretty:opts.pretty});
                                        }
                                        break;
                                    case "string": // ["h2", "color: black"] or [["h2",".myClass"], "color:black"]
                                    default:
                                        _ruleOutput=_rule;
                                }
                                s+= tb(_ruleOutput)+"\n";
                                
                            }

                            break;
                        default:
                    }
                }

                break;
            default:
                s="";
        }
    }
    catch (e) {bw.logd(e);}  //  eslint-disable-line no-empty
    if (dopts["emitStyleTag"]) {
        s = bw.html(["style",dopts["atr"],s]);
    }
    s.replace(/\n+/g,"\n").replace(/s+/g," ");
    return s;
};

// ===================================================================================
bw.makeCSSRule = function (cssData, options) {
/** 
@method bw.makeCSSRule(cssData, options)

expects this form:
 [str, {k,v}] 
 or
 [[array of rules str], {k,v}]

 e,g, [".myClass", {"color": "red", "font-weight" : "700 !important!"}]
 or
 [[".myClass","div > p"], {"color": "red", "font-weight" : "700 !important!"}]

 */
    var dopts = {
        emitStyleTag: false,
        atr: {},
        pretty: true // make it pretty otherwise compact form generated
    };
    dopts = optsCopy(dopts,options);

    var k,d,v=[],s="",sp=dopts.pretty?" ":"", cr=dopts.pretty?"\n":"";
    
    try {
        if (_to(cssData)== "array") {
            k=cssData[0], d=cssData[1];
            s +=_toa(k,"array",k,[k.toString()]).join(","+sp)+cr;
            for (k in d) {
                v.push([sp+sp+k+":"+sp+cssData[1][k]+";"+sp+cr]);
            }
            s+= "{"+cr+v.join("")+"}"+cr;
        }
    } catch(e) {
        bw.logd(e);
    }
    return s;

};

// ===================================================================================
bw.htmlPage = function (head, body, options) {
/** 
TBD finish (include bw params, handling meta w/o close tags)
bw.makeHTMLDoc(head,body,options)
make a simple HTML document.  

inline-bw-css --> emit bw default styles as inline css (include globals option)
 */
    var dopts = {
        docType : "<!DOCTYPE html>",
        htmlParams  : {lang: "en"},
        headDefaultContent : [
                ["meta", {"http-equiv":"Content-Type", "content":"text/html", "charset":"utf-8"}, ""]
                //["title", {}, "bw doc"]
            ],
        headIncludeBitWrenchJS : false, // false : don't include, "embed" or "path-string"
        headIncludeBitWrenchCSS : false, // exports bitwrench css classes in <style> section in head
        headFavicon : "" //<link rel="icon" type="image/x-icon" href="../images/favicon-32x32.png" />
    };
    dopts = optsCopy(dopts,options);

    var s = dopts["docType"]+"\n";
    s += bw.html(["html",dopts["htmlParams"],[
            "\n",
            ["head", {}, [ "\n",dopts["headDefaultContent"].map(function(x){return bw.html(x);}).join("\n"),head,"\n"]],
            "\n",
            ["body", {}, [ "\n",body,"\n"]],
            "\n"
        ]]);
    return s;
};
// ===================================================================================
/*
bw.htmlRender(hdict, opts) {
    var dgopts = {
        pretty : true,
        pretty_space: "  ",
        pretty_indent: "", //fixed indent when pretty pass as "    " etc
        tagClose : "auto" // default behavior 
    }
    var state = {
        levelCnt : 0,
        nodeCnt  : 0,
        errors   : []
    }
    dgopts = optsCopy(dgopts,opts);
    
    var _isv = function(x){return "area base br col command embed hr img input keygen link meta param source track wbr".search(x.toLowerCase()) >=0;}

    var _atr = function(k,v,o){  // to do handle "smart" attributes ==> class : ["class1", "class2"]  ==> style : bw.makeCSS()
        var val=v,ok = "atr_def"in o ? "none" : k; 
        if (v==null)
            return k;
        switch(ok) {
            case "style" :
                val = bw.makeCSS(val,{pretty:false});
                break;
            default :
                if (bw.to(v)=="array")
                    val = val.join(" ");
                val = val.toString();
        }
        return k+"="+"\""+val.replace("\"","\\\"")+"\"";
    }

    var _cls = function(t,o,c) {
      
        var ce = _to(c)!="array" ? true : ((c.length ==0) ? true : false);
        // o.tagClose==auto         && _isv(t)==true   ==>  ,
        //                             _isv(t)==false  ==>  , </t>      
        // o.tagClose==closeEmpty   && _isv(t)==true   ==> /,
        //                             _isv(t)==false  ==>  , </t>

        // o.tagClose==none                            ==>  ,                  
        // o.tagClose==all                             ==>  , </t>
        var r = bw.choice(o.tagClose,
            {
                "auto" :       function(){return _isv(t) ? ["" ,""] : ["","</"+t+">"];}) (),
                "closeEmpty" : function(){return _isv(t) ? ["/",""] : ["","</"+t+">"];}) (),
                "none" : ["",""]
            },["","</"+t+">"]);
        return r;
    }

    _emitHTML = function(data) { // uses state from outr fn

    }

}
*/
bw.htmlFromDict = function(htmlDict) {
/**
    must be of form 
    t ==> tag     (string)
    a ==> attrib  {}   
    c ==> content []   content can be string | node  (other values converted to string)  
    o ==> options {}
    

    htmldict
    { 
        tag     : "tagName",
        attrib  : {},
        content : [],    // each member must be: string or htmlDict or null.  other values cast to string.
        options : {},
        state : {}   
     }

    //options:
    pretty        (true | false) (default: true)  attempts to make HTML pretty (human readable) if false it will be as compact as possible
    pretty_space  (if pretty == true) (default: "  ") this is the stirng used as the indent string but one could make it "\t" or " " etc.
    pretty_indent (if pretty == true) a fixed indent to provide to every line of html

    tagClose : ("auto" | closeempty | all | none) whether to close a tag.  default is "auto"
        "auto"       : will apply smart rules to tag closing. e.g. html void elements such as br are not closed 
        "closeempty" : all void elements are now self closed  (e.g. are self closed ==> <meta /> or <br />)
        "all"        : tags are forced closed with </tagname>  ==>  can be useful for xml type generation
        "none"       : tags are not closed at all


*/
    var html = "",stats={};
    //var voidTags = ["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"]; 
    //var _isv = function(s){return (voidTags.indexOf(s) >= 0)};
    var _isvoid= function(s){return "area base br col command embed hr img input keygen link meta param source track wbr".search(s.toLowerCase()) >=0;}
    var ddict = {
        t:  "div",
        a:  {},   // if an attribute is null then only key is listed e.g.  {a:"foo", b:null, c:0} ==> a="foo" b  c="0"
        c:  [],
        o:  {
                pretty : true,
                pretty_space: "  ",
                pretty_indent: "", //fixed indent when pretty pass as "    " etc
                tagClose : "auto",
            },
    }
    var state = {
        level : 0,
        node : 0
    }
    var _atr = function(k,v,o){  // to do handle "smart" attributes ==> class : ["class1", "class2"]  ==> style : bw.makeCSS()
        var val=v,ok = "atr_def"in o ? "none" : k; 
        if (v==null)
            return k;
        switch(ok) {
            case "style" :
                val = bw.makeCSS(val,{pretty:false});
                break;
            default :
                if (bw.to(v)=="array")
                    val = val.join(" ");
                val = val.toString();
        }
        return k+"="+"\""+val.replace("\"","\\\"")+"\"";
    }

    var _cls = function(t,o,c) {
        var r=["","</"+t+">"] // r[0] is whether to include closing slash on start tag, r[1] is whether to include closing tag
        var ce = _to(c)!="array" ? true : ((c.length ==0) ? true : false);
        // o.tagClose==auto         && _isv(t)==true   ==>  ,
        //                             _isv(t)==false  ==>  , </t>      
        // o.tagClose==closeEmpty   && _isv(t)==true   ==> /,
        //                             _isv(t)==false  ==>  , </t>

        // o.tagClose==none                            ==>  ,                  
        // o.tagClose==all                             ==>  , </t>
        r = bw.choice(o.tagClose,
            {
                "auto" :       (function(){return _isv(t) ? ["",""]  : ["","</"+t+">"];}) (),
                "closeEmpty" : (function(){return _isv(t) ? ["/",""] : ["","</"+t+">"];}) (),
                "none" : ["",""]
            },r);
        return r;
    }
    ddict = optsCopy(ddict,htmlDict);
    var ind_s = ddict.o.pretty ? Array(ddict.s.levelCnt * ddict.o.pretty_indent ).join(ddict.o.pretty_space) : ""; // not &nbsp; ==> we're not trying to render this space just make it pretty for inspection
    var ind_c = ddict.o.pretty ? Array((ddict.s.levelCnt+1) * ddict.o.pretty_indent ).join(ddict.o.pretty_space) : ""; // not &nbsp; ==> we're not trying to render this space just make it pretty for inspection
    var ind_e = ddict.o.pretty ? "\n" : "";
    
    try {
        var i,atrk=[],_a=[],k,v;
        for (i in ddict.a)
            if (ddict.a.hasOwnProperty(i)) atrk.push(i);
        atrk = atrk.sort(bw.naturalCompare);
        for (i=0; i<atrk.length; i++) {
            k=atrk[i]; v=ddict.a[k];
            console.log(k,v)
            _a.push(_atr(k,v,ddict.o));
        }
        _a = _a.join(" ");
        _a = ((_a.length>0) ? " ": "") + _a;

        html += ind_s + "<" +ddict.t + _a+ _cls(ddict.t,ddict.o.tagClose,ddict.c)[0]+">";
        html += ddict.c.map(function(x){
                var s = _to(x) == "object" ? bw.htmlFromDict(x) : x.toString();
                return ind_c+s;
            }                
            ).join((ddict.pretty?"\n":""));
        html += ind_e + _cls(ddict.t,ddict.o.tagClose,c)[1] +(ddict.o.pretty?"\n":"");
    }
    catch(e) {
        console.log(e);
        bw.logd(e);
    }

    return {html:html, stats: stats}
}

// ===================================================================================
bw.html = function (d,options) {
/**  
bw.html(data)  

takes data of one of these exact forms:

   string
   array: ["div", content]
   array: ["div",{attribute dict},content]
   array: ["div",{attribute dict},content, options]
   dict:  {tag:"div", atr: {attribute dict}, "content": content}
        content can be string or array

and creates an HTML string wich can be used to generate DOM elements such as
document.getELementById("theID").innerHTML = buildHTMLObjString(data).

content can be nested 

d is string or an array ["tag".{attributs dict},content] or dict of this form
   tag, atr, content  (also allow short hand t,a,c)
   tag or t = string --> "div"
   atr or a = dict  --> {"style" : "width=40;height=50", "class" : "foo bar"}
    content or c = [] or string.  if array each element must be either string or dict of this form.
    if any element is a function it will be evaluated in place with no params. 

*/
    var dopts = {
        pretty     : false,
        indent     : 0,
        indentStr  : "  "
    };
    
    var outFn = function(s,opts) {
        var w  =  Array(opts["indent"]).join(opts["indentStr"]);
        var we =  Array(opts["indent"]-1).join(opts["indentStr"]);
        return opts["pretty"] ? "\n"+w+ s + "\n" +we: s;
    };

    dopts = optsCopy(dopts,options);

    dopts["indent"]++;

    var s="", t="div",a={},c=[],i;

    switch (_to(d)) {
        case "date":
        case "number":
            s=String(d); // eslint-disable-line no-fallthrough
        case "string":    
            s=d;
            return outFn(s,dopts); // Note return statement here... 
            break;                 // eslint-disable-line no-unreachable
        case "function" :
            s = bw.html(d(),dopts);
            break;
        case "array":

            if ((_to(d[0]) == "undefined") || d.length != 3)
                return "";
            t = _to(d[0]) != "undefined" ? d[0] :t;
            a = _to(d[1]) != "undefined" ? d[1] :a;
            c = _to(d[2]) != "undefined" ? d[2] :c;
            t = _to(t)    == "function"  ? t()  :t;
            a = _to(a)    == "function"  ? a()  :a;
            c = _to(c)    == "function"  ? c()  :c;
            c = _to(c)    != "array"     ? [c]  :c;
            break;
        case "object":
            t = _to(d["t"])         == "function" ? d["t"]()       : t;
            t = _to(d["tag"])       == "function" ? d["tag"]()     : t;
            t = _to(d["t"])         == "string"   ? d["t"]         : t;  
            t = _to(d["tag"])       == "string"   ? d["tag"]       : t;  

            a = _to(d["a"])         == "function" ? d["a"]()       : a;
            a = _to(d["atr"])       == "function" ? d["atr"]()     : a;
            a = _to(d["a"])         == "object"   ? d["a"]         : a;
            a = _to(d["atr"])       == "object"   ? d["atr"]       : a;
            switch (_to(d["c"])) {
                case "function" : 
                    c = d["content"](); break;
                case "array" : 
                    c = d["content"]; break;
                default:
                    c = [d["content"]];
            }
            switch (_to(d["c"])) {
                case "function" : 
                    c = d["c"](); break;
                case "array" : 
                    c = d["c"]; break;
                default:
                    c = [d["c"]];
            }
            break;
        default:
            bw.log("bw.html:: error in type");
    }
    
    s+= "<" + t ;
    for (i in a) { 
        s+=" "+ String(i)+"=\"" + String(a[i]) +"\"";
    }
    s+= ">";
    //console.log(t,a,c);
    for (i=0; i<c.length; i++) {
        var _c = "";

        switch(_to(c[i])) {
            case "function":
                _c = c[i]();  // eslint-disable-line no-fallthrough
            case "object":    // eslint-disable-line no-fallthrough
            case "array" :
            _c = bw.html(c[i],dopts);
            break;
            default:
            _c = String (c[i]);
        }
        s+= _c;
    }
    s+= "</" + t + ">";

    return outFn(s,dopts);
};


// ===================================================================================
bw.htmla = function (listData,options) {
/**  
bw.htmla(listData,options)  

listData is a single dim array of bw.html() compatible cnostructs

*/
    if (_to(listData) != "array")
        return bw.html(listData,options);

    return listData.map( function(x) {return bw.html(x,options);}).join(""); 
};

// ===================================================================================
bw.htmlList = function (listData, listType, atr, atri) {
/**
bw.makeHTMLList (listData, listType, attribute{}, attribute_for_each_items {})

listType = "ul" | "ol"
listData = [ item1, item2, item3, .. ]

 */
    if (_to(listData) != "array")
        return "";

    if (listData.length < 1)
        return "";

    atr  = _toa(atr,"object",atr,{});
    atri = _toa(atr,"object",atr,{});

    var lc = listData.map(function(x){return bw.html(["li",atri,x]);});
    listType = ["ul","ol"].indexOf(listType)== -1 ? "ol" : listType;
    return bw.html ([listType,atr,lc]);
};


// ===================================================================================
bw.classStrAddDel = function (classData,classesToAdd,classesToDel) {
/** 
classStrAddDel (classData, classesToAdd, classesToDel)
for CSS classes

takes a valid classData string e.g. "myclass1 myclass2" etc

and adds/del classes from classesToAdd string if they are not already present in classData

classStrAddDel("class1 class2", "class3") ==> "class1 class2 class3"
classStrAddDel("class1 class2", "class3 class4") ==> "class1 class2 class3 class4"
classStrAddDel("class1 class2", "class2 class3") ==> "class1 class2 class3" // doesn't add class2 again

classStrAddDel("class1 class2", "class 2 class3",class1) ==> "class2 class3" // doesn't add class2 again. removes class1
classStrAddDel("class1 class2", "",class1) ==> "class2" //  removes class1

classData, classesToAdd, classesToDel may be strings (space delimited) or arrays of strings (["c1", "c2"], ["c3", "c4"], ["c1"])
 */
 
    var tnorm    = function(x){x=bw.toa(x,"undefined",[],x); return (bw.to(x)=="array")? x : x.toString().trim().split(/\s+/ig);};
    var c  = tnorm(classData);
    var ca = tnorm(classesToAdd);
    var cd = tnorm(classesToDel);
    return bw.arrayBNotInA(cd,c.concat(ca)).join(" ").trim().replace(/\s+/ig," ");

};
// ===================================================================================
bw.classStrToggle = function (classData, classesToToggle) {
/** 
    classStrToggle (classData, classesToToggle)

    toggles classes listed in classesToToggle

    takes a valid classData string e.g. "myclass1 myclass2" etc
*/
    var tnorma    = function(x){x=bw.toa(x,"undefined",[],x); return (bw.to(x)=="array")? x : x.toString().trim().split(/\s+/ig);};
    var c   = tnorma(classData);
    var t   = tnorma(classesToToggle);
    return bw.classStrAddDel(classData,bw.arrayBNotInA(c,t),bw.arrayBinA(c,t));
};

// ===================================================================================
bw.htmlTabs = function(tabData, opts) {
/** 
bw.makeHTMLTabs(tabData, atr)
tabData = [[tab1Title,tab1-content], [tab2Title,tab2-content], [tab3Title,tab3-content]]
 */
    if (_to(tabData) != "array")
        return "";
    if (tabData.length < 1)
        return "";

    var dopts = {
        atr     : {"class":""},    //container {}
        tab_atr : {"class":""},    //attributs for each tab container
        tabc_atr: {"class":""},    //attributes for each tab-content area container
        indent  : "",            //indent string for pretty printing
        pretty  : false
    };
    dopts = optsCopy(dopts,opts);

    var ti = tabData.map(function(x){return ["li",{"class":"bw-tab-item", "onclick":"bw.selectTabContent(this)"},x[0]];});
    var tc = tabData.map(function(x){return ["div",{"class":"bw-tab-content"},x[1]];});
    
    ti[0][1]["class"] = bw.classStrAddDel(ti[0][1]["class"], "bw-tab-active");
    tc[0][1]["class"] = bw.classStrAddDel(tc[0][1]["class"], "bw-show");

    dopts["atr"     ]["class"] = bw.classStrAddDel (dopts["atr"     ]["class"],"bw-tab-container");
    dopts["tab_atr" ]["class"] = bw.classStrAddDel (dopts["tab_atr" ]["class"],"bw-tab-item-list");
    dopts["tabc_atr"]["class"] = bw.classStrAddDel (dopts["tabc_atr"]["class"],"bw-tab-content-list");

    return bw.html(["div", dopts["atr"],[["ul",dopts["tab_atr"],ti],["div",dopts["tabc_atr"],tc]]]);
};


// ===================================================================================

bw.htmlTable = function(data,opts) {    
/** 
bw.makeHTMLTableStr (data, options)

Creates an HTML table element (as a string) from raw array data.

var table1 = 
    [["this", "that", "the", "other"],[,6,4,0,4],[3,5,1,4],[1,2,4,5],["2u30","23",function(){return 834},23]];
document.getElementById("myTableDiv") = bw.makeHTMLTableStr(table1);  // displays simple table.

var options = {
    useFirstRowAsHeaders:false,   // first row is data
    caption:"Important Table"     // caption
    sortable: false | true | function  // make table sortable (false is default, if true uses bw built-in sort, else supply function)
}
document.getElementById("myTableDiv") = bw.htmlTable(table1, options);  

Options:
        useFirstRowAsHeaders : true;   // 
 */
    if ((_to(data) != "array") || (data.length < 1))
        return "";

    //default options
    var dopts = {
        useFirstRowAsHeaders : true,
        atr         : {},  // attributes for table object can use function() for dynamic
        thead_atr   : {},  // attributes for table head section
        th_atr      : {},  // attributes for header cells, 
        tbody_atr   : {},  // atttributs for table body section
        tr_atr      : {},  // attributes for rows
        td_atr      : {},  // attributes for cells
        caption     : "",  // optional table caption (can be HTML, or function, bw.buildHTMLObjString compatible data)
        sortable    : false// make table sortable.  if true, uses default sort, otherwise pass function to sort table. f(a,b,optionalColumnNumber)
    };

    var i=0,head="",body="",r,_hs=bw.html;
    dopts = optsCopy(dopts,opts);
    /*
    for (i in opts)
        dopts[i] = opts[i];  // overide defaults
    */

    if (_to(dopts.th_atr["onclick"]) == "function") {
        bw.log("todo buildHTMLtable function dispatch");      
    }
    
    if (dopts.sortable == true) {
        dopts.th_atr["onclick"] = "bw.sortTableDispatch(this)";
        if ("class" in dopts.th_atr)
            dopts.th_atr["class"] +=  dopts.th_atr["class"].split(/[ ]+/).indexOf("bw-table-sort-xxa") <0 ? " bw-table-sort-xxa" : "";
        else
            dopts.th_atr["class"] = "bw-table-sort-xxa";
    }
    else {
        if (_to(dopts.sortable) == "function") {
            var sfid = bw.funcRegister(dopts.sortable);
            dopts.th_atr["onclick"] = bw.funcGetDispatchStr(sfid,"this");       
            bw.log("todo function makeHTML sort function dispatch");
        }
    }

    if (dopts["useFirstRowAsHeaders"]) {
        head=data[0].map(function(x){return _hs(["th",dopts.th_atr,x]);}).join("");
        head= _hs(["tr",dopts.tr_atr,head]);
        i=1;
    }
    else
        i=0;
    head = bw.html(["thead",dopts.thead_atr,head]);

    for (; i<data.length; i++) {
        r = data[i].map(function(x){return _hs(["td",dopts.td_atr,x]);}).join(""); 
        body+= _hs(["tr",dopts.tr_atr,r]);
    }
    body = bw.html(["tbody",dopts.tbody_atr,body]);
    //console.log(head,'\n',body);
    dopts.caption = dopts.caption == "" ? "" :  _hs(["caption",{},dopts.caption]);
    return _hs(["table",dopts.atr,[dopts.caption,head,body]]);
};


bw.htmlAccordian   = function (data, opts) {
/** 
    htmlAccordian 
    
    [[data-title, data-to-show, {show: true|false, clickShow: true|fa;se}], // TODO: optional 3rd element
     [...]]

    data-title and data-to-show can be strings or any valid bw.html() constructs
 */
    var s = "";
    if (_to(data) !== "array")
        return s;

    var dopts = {
        atr   : { "class":"bw-accordian-container"}, // div for overall accordian
        atr_h : { "onclick":"bw.DOMClassToggle(this.nextSibling,'bw-hide')"}, // div wrapping each header
        atr_c : {/*"onclick":"bw.DOMClassToggle(this,'bw-hide')",*/ "class":"bw-hide"} // div wrapping each content
    };
    dopts = optsCopy(dopts,opts);
    dopts["atr_h"]["onclick"]="bw.DOMClassToggle(this.nextSibling, 'bw-hide')";

    s = data.map(function(x){return bw.html(["div",dopts["atr_h"],x[0]])+bw.html(["div",dopts["atr_c"],x[1]]);}).join("");
    s = bw.html(["div",dopts["atr"],s]);
    return s;
};
// ===================================================================================
bw.getFile  = function (fname,callback_fn, options) {
/** 
bw.getFile(filename,callback) 
Attempt to load a file.
Works both client side and i nodejs.
 */
    var dops = {
        parser : "raw"  // valid types are "raw", "JSON", future "CSV", "TSV" or parserFunction
    };

    dops = optsCopy(dops,options);

    if (_to(fname) != "string") {
        return "invalid filename";
    }

    var prs = (dops["parser"]=="JSON") ? JSON.parse : function(s){return s;};


    if (bw.isNodeJS() ==true) {
        var fs = require("fs");
        fs.readFile(fname, "utf8", function (err, data) { if (err) throw err; callback_fn(prs(data)); });
    }
    else // running in a browser 
    {         
        var x = new XMLHttpRequest();
        x.overrideMimeType("application/json");
        x.open("GET", fname, true); 
        x.onreadystatechange = 
            function () {if (x.readyState == 4 && x.status == "200") {callback_fn(prs(x.responseText));}};
        x.send(null);
    }
    return "BW_OK";
};

bw.getJSONFile = function (fname,callback_fn) { return bw.getFile(fname,callback_fn,{"parser":"JSON"});};

bw.copyToClipboard = function(data) {
/** 
bw.copyToClipboard
simple copy content to clipboard.  (browser only)
*/

/*
var temp = document.createElement("input");
var b = document.getElementsByTagName("body")[0];
b.appendChild(temp);

temp.innerText = data;
temp.select();
document.execCommand("copy");
temp.remove();


    
    var temp = document.createElement("input");
    document.getElementsByTagName("body")[0].append(temp);
    temp.innerHTML = data;
    //temp.val(data).select();
    
    //var temp = document.createElement("input");
    //var b = document.getElementsByTagName("body")[0];
    //b.appendChild(temp);
    //temp.innerText = data;
    temp.select();
    document.execCommand("copy");
    temp.remove();
*/
    if (bw.isNodeJS())
        return;
    var  listener = function (e) {
        e.clipboardData.setData("text/html", data);
        e.clipboardData.setData("text/plain", data);
        e.preventDefault();
    };
    document.addEventListener("copy", listener);
    document.execCommand("copy");
    document.removeEventListener("copy", listener);
};
    
// ===================================================================================
bw.saveClientFile   = function(fname,data) {
/** 
bw.saveClientFile(fname,data) saves data the program the client environtmnet
    fname is filename to save as
    data is data to save.

    works both in node and browser.    
*/
    if (bw.isNodeJS()) {
        var fs = require("fs");
        fs.writeFile(fname, data, function (err) {
                if (err) return bw.log(err);
                bw.log("error saving ",fname,data);
            });
    }
    else { // we're in a browser
            
        var saveData = (function () {
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            return function (data, fname) {
                var json = JSON.stringify(data),
                    blob = new Blob([json], {type: "octet/stream"}),
                    url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = fname;
                a.click();
                window.URL.revokeObjectURL(url);
            };
        }());
        saveData(data,fname);
    }
};

// ===================================================================================
//Timers ... clear / read / fixed number of events

// ===================================================================================
// crude performance measurements
var gBWTime = (new Date()).getTime(); //global closure for time.  'cause we always want a gbw gbw time :)
 
// ===================================================================================
bw.clearTimer = function (message) {
/** 
bw.clearTimer("message")
When bitwrench loads its starts a  timer which can be checked at any time as a ref running (see bw.readTimer()).  
bw.clearTimer() clears the timer with optional message.
 */
    gBWTime = (new Date()).getTime();
    if (_to(message) != "undefined")
       bw.logd(String(message));
    return gBWTime;
};
 
// ===================================================================================
bw.readTimer = function (message) {
/** 
bw.readTimer("message")
When bitwrench loads its starts a page timer which can be checked for how long the page as been running.
 */
    var ct = (new Date()).getTime();
    if (_to(message) != "undefined")
       bw.logd(String(message));
    return ct-gBWTime; 
};
bw.clearTimer(); //when bw is loaded, we start the timer.

// ===================================================================================
bw.setIntervalX = function (callback, delay, number_of_repetitions) {
/** 
bw.setIntervalX(callbackFn, delayBtwCalls, repetitions)
set a javascript timer to only run a max of N repetions.

Example:
    bw.setIntervalX(function(x){console.log(x)},100,5) 
    this will the function 5 times 100ms apart
 */
    var x = 0;
    var intervalID = setInterval(function () {
        callback(x);

        if (++x >= number_of_repetitions) {
                clearInterval(intervalID);
        }
    }, delay);
};

// ===================================================================================
bw.repeatUntil = function (testFn, successFn, failFn, delay, maxReps, lastFn) {
/**  
bw.repeatUntil()
repeatUntil runs the supplied testFn every delay milliseconds up until a maxReps number of times.
if the test function returns true it runs the successFn and stops the iterations.
    then the lastFn is called with the params (true, number_of_attempts).
    lastFn is optional.

for each time the testFn is called and fails, the failFn() is called.

After the last rep has been completed the lastFn is called with (with the last testFn result and
with the current iteration).  


lastFn is optional.  
failFn is optional

Example:
bw.repeatUntil( myLibsAndDataAreLoaded_fn, renderMyChart, null, 250, 10, null); // attempts to wait until mylib is loaded 10 times before giving up

*/   
    var _count = 0;
    if (typeof testFn != "function")
      return "err";
    if (typeof delay != "number")
      delay = 250;  // 250ms
    if (typeof maxReps != "number")
      maxReps = 1; // run 1 time.

    var _testFn = testFn;
    var _successFn = (typeof successFn == "function") ? successFn : function () {};
    var _failFn = (typeof failFn == "function") ? failFn : function () {};
    var _lastFn = (typeof lastFn == "function") ? lastFn : function () {};

    var _f = function () {
    var success = _testFn();
        if (true == success) {
            _successFn();
            _lastFn(true, _count);
        }
        else {
            _failFn();
        
            if (_count >= maxReps) {
              _lastFn(success, _count);
            }
            else {
                _count++;
                window.setTimeout(_f, delay);
            }
        }
    };
    _f();
};
// =============================================================================================
/*
bw.htmlDataToImg = function(data, opts) {
/**
    htmlDataToImg(data, opts) // takes a 2D array of numbers and render as an image
    each data point must evaluate to a Number or be a function which will be called with its positional arguments and must return a number.

    OR

    function can be a string as long as it returns a valud HTML color prefixed with "#"

    e.g. 
    "#123"
    "#112233"

    e.g.:
        function (return 23)
        function(x,y) { return x+y;}

 * /
    var dopts = {
        outputType  : "canvas" ,  // "table" | "divs" | "svg"
        colorMode   : "auto",     // use greyscale map
        colorStretch: 1.0
    }

    dopts = optsCopy(dopts,opts);
//    if (_to(dopts["colorMapFn"]) != "function")
//        dopts["colorMapFn"] = function(x){var c= mapScale(x,0,255,0,255,true).}



}
*/
// =============================================================================================
bw.naturalCompare = function (as, bs){
/** 
bw.naturalCompare(a,b) {
bw.naturalCompare() is a function which can be passed to an array sort to provide natural sorting of mixed array elements.

[3,4,2,1,"10","111","foo","bar","01","this123","This123", "848"].sort()
vs
[3,4,2,1,"10","111","foo","bar","01","this123","This123", "848"].sort(bw.naturalCompare)

it is the default sort for bw.sortHTMLTable()

 */
//https://www.webdeveloper.com/forum/d/254726-sorting-alphanumeric-array (taken from here) see also
//using .localCompare() in newer versions of JS

    var a, b, a1, b1, i= 0, L, rx=  /(\d+)|(\D+)/g, rd=  /\d/;
    if(isFinite(as) && isFinite(bs)) return Math.sign(as - bs);
    a= String(as).toLocaleLowerCase();
    b= String(bs).toLocaleLowerCase();
    if(a=== b) return (as > bs) ? 1 : 0;
    if(!(rd.test(a) && rd.test(b))) return a> b? 1:-1;
    a= a.match(rx);
    b= b.match(rx);
    L= a.length> b.length? b.length:a.length;
    while(i<L){
        a1= a[i];
        b1= b[i++];
        if(a1!== b1){
            if(isFinite(a1) && isFinite(b1)){
                if(a1.charAt(0)=== "0") a1= "." + a1;
                if(b1.charAt(0)=== "0") b1= "." + b1;
                return a1 - b1;
            }
            else return a1> b1? 1:-1;
        }
    }
    return Math.sign(a.length - b.length);
};

// =============================================================================================
bw.sortHTMLTable = function (table, col, dir, sortFunction) {
/** 
bw.sortHTMLTable(table, column, optionalSortFunction).

sort any HTML table active in the DOM
table must be a valid DOM table element or CSS selector (first element is used)

default uses string compare. but can pass in a function
sortFunc(a,b,col) // a and b are the cells to compare, col is optional info on what column this is   
*/
    
    var  rows, switching, i, x, y, shouldSwitch;
    var sortF = _to(sortFunction) == "function" ? sortFunction : bw.naturalCompare;
    
    table = bw.DOM(table)[0];
    
    dir = (dir==true) || (dir=="up") ? true : false;

    switching = true;
    col = _to(col) == "number" ? col : 0;  //default sort on left most column

    //Make a loop that will continue until  no switching has been done
    while (switching) {
        //start by saying: no switching is done:
        switching = 0;
        rows = table.getElementsByTagName("TR");
        /*Loop through all table rows (except the first, which contains table headers):*/
        for (i = 1; i < (rows.length - 1); i++) {
            //start by saying there should be no switching:
            shouldSwitch = 0;
            /*Get the two elements you want to compare,
            one from current row and one from the next:*/
            x = rows[i].getElementsByTagName("TD")[col].innerHTML;
            y = rows[i + 1].getElementsByTagName("TD")[col].innerHTML;

            //check if the two rows should switch place:

            shouldSwitch = (dir) ? sortF(x,y,col) > 0 : sortF(x,y,col) < 0;            
            if (shouldSwitch)
                break;
        }

        if (shouldSwitch) {
          //If a switch has been marked, make the switch and mark that a switch has been done:
          rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
          switching = true;
        }
    }
};

// =============================================================================================
bw.sortTableDispatch = function (item,fn) {
/** 
bw.sortTableDispatch(el) is used to bind sorting functions to tables generated by  bw.htmlTable(....)
item must be a valid DOM element or id.
 */
    var i;
    
    item = bw.DOM(item)[0];

    if (_to(item).substr(0,4) != "html")
       return false;  //something not right about this table element

    var index=0,dir;
    var cols = item.parentElement.getElementsByTagName("th");
    //update which tab selected
    for (i=0; i< cols.length; i++) {
        if (cols[i] == item) { // selected tab logic
            index = i;
            dir = bw.DOMClass(cols[i],"bw-table-sort-upa") ; // ifthe current col is already up..
            if (dir) { 
                bw.DOMClass(cols[i],"bw-table-sort-upa", "bw-table-sort-dna" ); 
            }
            else { //dna or xxa
                if (bw.DOMClass(cols[i],"bw-table-sort-dna")) {
                    bw.DOMClass(cols[i],"bw-table-sort-dna", "bw-table-sort-upa" ); 
                } else
                    bw.DOMClass(cols[i],"bw-table-sort-xxa", "bw-table-sort-upa" );
            }
        }
        else{ // its not the selected column so we clear the up / down arrow
            bw.DOMClass(cols[i],"bw-table-sort-upa",""); 
            bw.DOMClass(cols[i],"bw-table-sort-dna","");
            bw.DOMClass(cols[i],"bw-table-sort-xxa","bw-table-sort-xxa");
        }

    }
    //console.log(item.parentElement.parentElement.parentElement);
    bw.sortHTMLTable(item.parentElement.parentElement.parentElement,index,dir,fn);
};
// ===================================================================================
/** 
bw.function dispatch for DOM elements..

the bw.fnRegistry{} is a dict of user supplied functions are assigned IDs by bitwrench.  Using these IDs one can call the functions which is useful in DOM string contexts such as makeHTMLTable() or buildHTMLObjStr().
 */
var _fnRegistry = {};
var _fnIDCounter = 0;


bw.funcRegister = function (fn, forceName) {
/** 
bw.funcRegister()
register a function to be called by iD.
fn is any function or can be anonymous function.  
(optional) forceName forces the returned ID used to be forceName.  forceName must be only alpha and numeric chars.
forceName is useful when declaring static HTML content and one wants to use the bwFunctionDispatch but before bitwrench has been loaded or run.

In this case in the static code call like this:

<div class="..." onclick="bw.funcGetById('myFnName')(this)"> regular html content goes here  </div>
<script ..>
function superDuperFunctionCode (a) { .... code for my function ... };
bw.funcRegister(superDuperFunctionCode,"myFnName");  //now when the element is clicked on superDuperFunctionCode() will be called.
</script>

 */
    var fnID = "class_bwfn_" + _fnIDCounter; 
    _fnIDCounter++;
    fnID = _to(forceName) == "string" ? forceName : fnID;
    fnID.trim();
    _fnRegistry[fnID] = fn;
    return fnID;
};

bw.funcUnregister = function (fnID) {
/** 
bw.funcUnregister(fnID)
remove a function from the bitwrench dispatch registry
 */
    if (fnID in _fnRegistry)
        delete _fnRegistry[fnID];
};

bw.funcGetById = function(fnID,errFn) {
/** 
bw.funcGetById(fnId, errFn)
allows a function to be exectued by its bw function ID.
bw.funcGetById(myId)(... args ...)

errFn is optional function to call if fnID is not found.

example:
    var myFunc = bw.getFuncById("myFuncID");  // function must already be registered.
 */
    fnID = String(fnID);
    if (fnID in _fnRegistry)
        return _fnRegistry[fnID];
    else {
        var _id = fnID;
        return (_to(errFn) == "function") ? errFn : function(){bw.log(_id,"bw.funcGetById(): unregistered fn error");} ;
    }
};

bw.funcGetDispatchStr = function (fnID, argstring) {
/** 
bw.funcGetDispatchStr(fnID, argString) 
create a string suitble for use in DOM element dispatch.  note argstring is a literal so variables must be reduce to their values.
see bw.funcRegister() for getting valid IDs for user supplied functions.

example: bw.funcGetDispatchStr("myFuncID","param1,param2")
 */
    
    switch (_to(argstring)) {
        case "string" : 
        case "number" : 
            argstring = String(argstring);
            break;
        case "array"  : 
            argstring = argstring.join(",");
            break;
        case "function": 
            argstring = argstring();
            break;
        default:
            argstring = "";
    }

    return "bw.funcGetById('"+fnID+"')("+argstring+")";
};

// =============================================================================================
bw.loremIpsum = function (numChars, startSpot, startWithCapitalLetter) {
/** 
bw.loremIpsum(numChars, startSpot)

generate a simple string of Lorem Ipsum text (sample typographer's text) of numChars in length.  

if startSpot is supplied, it starts the string at the supplied index e.g. bw.loremIpsum(200, 50) 
will supply 200 chars of loremIpsum starting at index 50 of the Lorem Ipsum sample text.

if startWithCapitalLetter == true then the function will capitlize the first character or inject a capital letter if ihe first character isn't a capital letter.
    default is true;

Default is a paragraph of lorem ipsum (446 chars)
 */

    startSpot  = _to(startSpot) != "number" ? 0 : Math.round(startSpot);

    var l = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ";
    startSpot = startSpot % l.length;
    l= l.substring(startSpot, l.length) + l.substring(0,startSpot);

    if (_to(numChars) != "number")
        numChars = l.length;

    var i=numChars, s="";

    
    while (i>0) {
        s+= (i < l.length) ? l.substring(0,i) : l;
        i-= l.length;
    }
    if (s[s.length-1] == " ")
        s= s.substring(0,s.length-1) + "."; // always end on non-whitespace.  "." was chosen arbitrarily.
    if (startWithCapitalLetter != false)  {
        var c = s[0].toUpperCase();
        c = c.match(/[A-Z]/) ? c:"M";
        s = c+s.substring(1,s.length);
    }

    return s;

};

bw.docString = function (s, options) {
/** 
bw.docString(functionAsString, options)
returns array of valid docStrings embedded in a string 

@param docType{string} : "jsdoc" | "python" | "custom"  (python means triplequote (") 3 times), "custom" means supply delims
@param options {delims:[string,string]} : start, stop delimiters (only used if docType set to "custom")

@return array{strings} : array of captured params
    
 */
    
    var dopts = {
        docType : "jsdoc",  // "js doc", "python", "other" (jsdoc is default)
        delims  : ["/**","*/"],
        parseJSDocParams : false,
        dropLeadin : false // removes lead-in whitespace or floating single * on each line e.g.  " * @mycomment" ==> "@mycomment"
    };
    dopts = optsCopy(dopts,options);

    var _es = function (str) {return str.replace(/(?=[\\^$*+?.()|{}[\]])/g, "\\");}; // do escape of regex chars

    dopts["delims"] = bw.choice(dopts["docType"],{
        "jsdoc" : ["/**","*/"], 
        "python": ["\"\"\"","\"\"\""],       // old regex: /["]{3}([\s\S]*?)["]{3}/ig 
        "jspy"  : ["/**\"\"\"","\"\"\"*/"]   // js && python
    },dopts["delims"]);

    var c = (_to(s)=="function") ? s.toString() : String(s);
    var r = [];
    
    try  {
        var re = (new RegExp( _es(dopts["delims"][0])+ "\\s*\\n*([^\\*]|(\\*(?!\\/)))*" +_es(dopts["delims"][1]),"ig"));  // "([\\s\\S]*?)"                                                 
        r = c.match(re);
    }
    catch (e)   {bw.log(String(e));}

    if (_to(r)=="array") {
        r = r.map(function(x){return x.substring(dopts["delims"][0].length, x.length-dopts["delims"][1].length);}); // this is an array of the contents of docStrings which can still be multiline in thier own right
        r = (dopts["dropLeadin"]==true) ? r.map(function(x){return x.split(/[\n\r]/).map(function(y){return bw.trim(y,"left")+"\n";});}) : r; // need to hanlde multiline stuff here
    }
    else
        r=[];
    
    return r;
};
// =============================================================================================
bw.docStringParseLine = function(s) {
/** 
Parse a single line of a jsdoc string.
    @param {string} s - line of docstring to parse
    @return - dict of line contents {source: s, field:string, name:string, description: string, types: type1,type2 } 
    if not a valid doc string line then returns source string only
*/
    var r={"source":s,  "field" : "", "types":"", "name" :"", "description" : ""};  
    var a = s.replace(/^\s*(\/\*\*?)?|(\*\/)?\s*$/ig,""); // remove the comment markers if still there "/** my comment */"" ==> "my comment"
    a = a.replace(/^\s*\**\s*/,"");                      // remove any cruft at beginning of line " * @myParam {}....." ==> "@myParam {}....."
    if (a.charAt(0) == "@") { // if we have hit a @fieldname parameter we start parsing.
        //  ([str, regex, fieldStr, result{}]) ==> ([str, regex, fieldStr, result{}])  ::> ([str,result{},fieldStr,regex])
        /*
        var _tok = function(x){
            var m = x[0].match(x[1]);
            if (m != null) {x[4][3]=m[1];}
            x[0] = x[0].replace(x[1],"");
            return x;
        }
        */
        //r = [[e,f],[e,f],[e,f],[e,f]].reduce(,_tok);

        var e,x;
        var t = bw.trim;
        e =/^@([A-Za-z0-9_<>[\]]*)/i;
        x = a.match(e);
        if (x != null) {r["field"] = t(x[1]);} else return r; // didn't match... opt out here
        a = a.replace(e,"");
        
        e = /^\s*\{([A-Za-z0-9_|\s,.\-+!@#$%^&*()=[\]]*)\}/i;
        x = a.match(e);
        if (x != null)  {r["types"]=t(x[1]);} // types is optional..
        a = a.replace(e,""); 

        e  = /^\s*([\S]*)/i;
        x = a.match(e);
        if (x != null)  {r["description"]=t(x[1]);} //
        a = a.replace(e,""); 

        e = /^\s*([\S]*)/i;
        x = a.match(e);
        if (x != null)  {r["name"]=t(x[1]);} //
        a = a.replace(e,""); 
        
        // descrpition                  ==> name: ""        description : "description"
        // description  we  we          ==> name: ""        description : "description we we "
        // name - description  we we    ==> name: "name"    descrpition : "description we we"
        // - description we we          ==> name: ""        description : "description we we"
        if (r["name"].match(/^\s*-+\s*/) != null) {
            r["name"] = r["description"];
            r["description"] = t(a);
        } else {
            r["description"] = r["description"]+" "+r["name"]+" "+t(a);
            r["name"] ="";
        }
    }
    return r;
};
// =============================================================================================
bw.docStringParse = function(s) {
/** 
    @method  bw.parseJsDocString()  parse and extract info from a jsdoc style comment.  expects there to be only a single docString comment
    @description  docStringParse parses a jsdoc string 
    and returns the paramters as an array which can be formatted for display or interrogtion.
    @param{string} - a valid js docstring

    @returns An array of triplets [@param, {types}, comment info]
 */

 /*
    implementation notes:
    the parser splits the candidate doc string in to lines.

Examples:

 * Assign the project to an employee.
 * @param {Object} - The employee who is responsible for the project. ==> ["@param","object","", "The employee who is resposnsible for the project"]
 * @param {string} employee.name - The name of the employee.
 * @param {string} employee.department - The employee's department.


 */
    
    
    s=bw.docString(s)[0];
    var a = s.split("\n");
    //console.log(a);
    var i,r=[bw.docStringParseLine(a[0])];
    for (i=1;i<a.length;i++) {
        var l = bw.docStringParseLine(a[i]);
        if (l["field"]=="") { // nothing parseable...
            if (r[r.length-1]["field"]=="") {
                r[r.length-1]["source"] += l["source"];
            } else
            r[r.length-1]["description"] += l["source"];
        } else r.push(l);
    }
    return r;
};
// =============================================================================================
bw.isHexStr = function (str, allowChars) {
/** 
isHexStr() returns a number of hex digits found or false if non-hex string.
allow is an optional string of characters "-+."etc to permit in the string.
the allow characters are not counted in the result

examples:
    bw.isHEXStr("123a")      ===> 4
    bw.isHEXStr("12-3a")     ===> false
    bw.isHEXStr("12-3a","-") ===> 4
 */
    if ( _to(str) == "string") {
        str = str.replace(new RegExp("["+allowChars+"]","g"),"");      
        var isHexReg = new RegExp("^[0-9A-Fa-f]{"+str.length+"}$");
        return (isHexReg.test(str) == true) ? str.length : false;
    }
    return false;
};

// =============================================================================================
//bw.__monkey_patch_is_nodejs__ = "ignore";  //used in test suites.  use carefully. only acceptable values are true, false, "ignore"
bw.__monkey_patch_is_nodejs__ = new (function() { var _t="ignore"; this.set=function(x){_t = _toa(x,"boolean",x,"ignore");}; this.get=function(){return _t;}; return this;});

bw.isNodeJS = function () {
/** 
bw.isNodeJS() ==> returns true if running in node environment (else browser)
 */
    if (bw.__monkey_patch_is_nodejs__.get() != "ignore") 
        return bw.__monkey_patch_is_nodejs__.get();
    return (typeof module !== "undefined" && module.exports) !== false;  //a hack will fix later
};
//console.log("=====",bw.isNodeJS())

// =============================================================================================
bw.fixNum = function(num,digits) {
/** 
bw.fixedNum(num,digits)

Truncate a number at digits number of places.  
    bw.fixNum(1.2345,2)  ===> 1.23
    bw.fixNum(234.32,-2) ===> 200
 */
    num = Number(num); 

    if (isNaN(num))
        return NaN;

    digits = _to(digits) == "number" ? digits : 3;
    num *= Math.pow(10,digits);
    
    //num =  Math.trunc(num);
    num = (num > 0) ? Math.floor(num) : Math.ceil(num); // some browsers don't support Math.trunc()

    num /= Math.pow(10,digits);
    return num;
};

// =============================================================================================
bw.multiArray = function (value, dims) {
/** 
bw.multiArray(value,  dims) 

return a multidimensional array where all cells are initialized to value.

bw.multiArray(0,[4,5]) // returns 4x5 array of 0s 
bw.multiArray("test",[4,5]) // returns 4x5 array of "test" 

this shorthand is available for single dim arrays
bw.multiArray(0,5) ===> returns 5x1 array of 0s 

bw.multiArray also accepts functions 

bw.multiArray(bw.random, [3,4]) ===> creates 3x5 array of random #s btw 0..100

bw.multiArray(function(){return (new Date()).getTime();},[4,6] ) ==> returns values based on the Javascript date
 */

    var v = function() { return (_to(value) == "function") ? value(): value;};
    dims = _to(dims) == "number" ? [dims] : dims;

    var  _array = function(a,dim)   {
        if(dim < dims.length)  {
            for(var i=0; i<dims[dim]; i++)   {
                a[i]= (dim== dims.length -1) ? v() : _array([],dim+1);
            }
            return a;
        }
    };
    return _array([],0);
};

// =============================================================================================
bw.clip = function (data, min, max) {
/** 
@method: bw.clip(data, min, max)  clips data in between min and max. 

Examples:
    bw.clip(5,2,20)            ==>  5   // already in range
    bw.clip(1,2,20)            ==>  2   // less than the min value so clips to min value
    bw.clip([1,4,8,35], 2, 20) ==>  [2,4,5,20]
 */
    var l = min < max ? min : max;
    var h = max > min ? max : min;

    if (_to(data) == "array") {
        return data.map(function(x){ return (x < l) ? l : ((x > h) ? h : x);});
    }
    else
        return (data < l) ? l : ((data > h) ? h : data);
};

// =============================================================================================
bw.mapScale = function (x, in0, in1, out0, out1, options) {
/** 
@method: bw.mapScale()

Map an input value x in its natural range in0...in1 to the output space out0...out1 with optional clipping
expScale allows sigmoidal warping to stretch input values contrained to a small range. (floating point scale factor)
x can be either a number or array of numbers.

if options["clip"] = false, then mapScale will extrapolate outside of out0,out1

//this is the function that oficially started bitwrench..
 */
    var dopts = {
        clip : true,
        expScale  : false
    };

    dopts = optsCopy ( dopts, options);

    if (in0==in1) 
        return x;
    out0 = _toa(out0, "number", out0, 0);
    out1 = _toa(out1, "number", out1, 1);
    
    var ms= function (z) {
        if (dopts["expScale"]) {
            var y = ((z-((in1+in0) / 2.0)) / (in1 - in0) ) * dopts["expScale"];
            z = ((out1-out0)*(1/(1+Math.exp(-y)))) + out0;
        }
        else
            z = (((z-in0)/(in1-in0))*(out1-out0))+out0;

        if (dopts["clip"]) 
            z= bw.clip(z,out0,out1);
        return z;
    };

    if (_to(x) == "number")
        return ms(x);
    return x.map(ms);
};

// =============================================================================================
//https://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
bw.padNum = function(x, width, options) {
/**
@description bw.padnum() takes a number and pads left pads (default is '0').  padNum also accepts strings so

bw.padNum(123,5)  ==> "  123"
bw.padNum(1234,5) ==> " 1234"
bw.padNum("foo",5)==> "  foo"
@param x {number} 
@return {string} padded number
*/
    var dopts = {
        pad : " "
    };
    dopts = optsCopy(dopts, options);
    x = String(x);
    return (x.length >= width) ? x : new Array(width - x.length+1).join(dopts["pad"]) + x;
};
// =============================================================================================
bw.trim = function (s, dir) {
/**
@description bw.trim() trims whitespace from  string on either left, right, or both.  (cross browser works before IE8)
@param s {string} : a string to trim white space on
@param dir {"left" | "right" | "both" | "none"} : trim white space on left only, right only or both sides, or no trim (default is both)
*/
    var t = bw.choice(
        dir, 
        {
            "left"  : /^[\s\uFEFF\xA0\n]+/g,
            "right" : /[\s\uFEFF\xA0\n]+$/g,
            "none"  : /(?!)/ // useful for programmatic scenarios (eg. [....].map ) where not all of the entries should be trimmed.
        },
        /^[\s\uFEFF\xA0\n]+|[\s\uFEFF\xA0\n]+$/g
    );
    return String(_toa(s,"undefined","",s)).replace(t,"");
};

// =============================================================================================
bw.padString = function (s, width, dir, options) {
/**
@description bw.padString() takes a string and pads it to the specified number of chars either left or right or centered.
*/
    var dopts = {
        pad        : " ",
        trimDir    : "both"   // pre-trim the input string:  "left", "right", "both", "none"
    };
    dopts = optsCopy(dopts, options);

    s = String(s);
    var x = bw.trim(s,dopts["trimDir"]); 
    var p = (width > x.length ) ? (width - x.length+1) : 0 ; // total padding
    var q = bw.choice(dir,
        {
            "left"      : [p,0],
            "right"     : [0,p],
            "center"    : [Math.round(p/2), (p-Math.round(p/2)+1)]
        },
            [0,0]
        );
    return  ((new Array(q[0])).join(dopts["pad"]))+x+(new Array(q[1])).join(dopts["pad"]);
};

// =============================================================================================
bw.random = function(rangeBegin, rangeEnd, options) {
/** 
@method: random

Return a random number between rangeBegin and RangeEnd (inclusive)
    default is 0,100

options 
    {
        setType : "int"
        dims    : false | number | [ , , ]  // selector for dimensions
    }

options
    setType: 
    "int"               ==> return an integer (default)
    "float" or "number" ==> return floating point number

    dims
        false or ommitted ==> return a single number
        5                 ==> return a 5x1 array of random numbers
        [3,5,2]           ==> return a 3x5x2 array of random numbers

example:
bw.random() ==> returns a number btw 0,100
bw.random(-4,4,{setType: "float", dims[4,5]}) ==> returns a 3x5 array of floating pt numbers btw -4,4

see also prandom for psuedorandom numbers

 */
    rangeBegin = _to(rangeBegin)  == "number" ? rangeBegin : 0;
    rangeEnd   = _to(rangeEnd)    == "number" ? rangeEnd   : 100;

    var dopts = {
        setType : "int",
        dims    : false // if dims is array e.g. [3,4,5] returns random elements array
    };
    
    dopts = optsCopy(dopts,options);
    
    var _rnd = function () {
        var n = 0;
    
        dopts.setType    = ["int","float","number"].indexOf(dopts.setType) == -1 ? "int" : dopts.setType;   

        if (rangeEnd < rangeBegin ) {
            rangeBegin ^= rangeEnd; rangeEnd ^= rangeBegin; rangeBegin ^= rangeEnd;
        }
        n = ((Math.random() * (rangeEnd-rangeBegin)) + rangeBegin);
    
        return (dopts.setType == "int") ? Math.round(n) : n;
    };

    if ((_to(dopts["dims"]) == "array") || (_to(dopts["dims"])== "number"))
        return bw.multiArray( _rnd, dopts["dims"]);

    return _rnd();
};

// =============================================================================================
bw.prandom = function (rangeBegin,rangeEnd,seed, options) {
/**
prandom - generate a psuedo random number from internal hash function in a given range
*/
    rangeBegin = _to(rangeBegin)  == "number" ? rangeBegin : 0;
    rangeEnd   = _to(rangeEnd)    == "number" ? rangeEnd   : 100;

    var dopts = {
        setType : "int",
        dims    : false // if dims is array e.g. [3,4,5] returns random elements array
    };
    
    dopts = optsCopy(dopts,options);
    var _cseed = seed;
    var _rnd = function () {
        var n = 0;
    
        dopts.setType    = ["int","float","number"].indexOf(dopts.setType) == -1 ? "int" : dopts.setType;   

        if (rangeEnd < rangeBegin ) {
            rangeBegin ^= rangeEnd; rangeEnd ^= rangeBegin; rangeBegin ^= rangeEnd;
        }
        n = (((bw.hashFnv32a("start string",_cseed) & 0xffff)/(65536)) * (rangeEnd-rangeBegin)) + rangeBegin;

        _cseed = (dopts.setType == "int") ? Math.round(n) : n;
        return (dopts.setType == "int") ? Math.round(n) : n;
    };

    if ((_to(dopts["dims"]) == "array") || (_to(dopts["dims"])== "number"))
        return bw.multiArray( _rnd, dopts["dims"]);

    return _rnd();

};
// =============================================================================================


bw.hashFnv32a= function (str, seed, returnHexStr) {
/**
@method Calculate a 32 bit FNV-1a hash
Found here: https://gist.github.com/vaiorabbit/5657561
Ref.: http://isthe.com/chongo/tech/comp/fnv/

@param {string} str the input value

@param {integer} [seed] optionally pass the hash of the previous chunk

@param {boolean} [asString=false] set to true to return the hash value as 
  8-digit hex string instead of an integer

@returns {integer | string}
*/
    /*jshint bitwise:false */
    var i, l,
        hval = (typeof seed == "undefined") ? 0x811c9dc5 : seed;

    for (i = 0, l = str.length; i < l; i++) {
        hval ^= str.charCodeAt(i);
        hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    if( returnHexStr ){
        // Convert to 8 digit hex string
        return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
    }
    return hval >>> 0;
};

// =============================================================================================
bw.CSSMakeTheme   = function(color) {
/**
makeThemeCSS (color) 

makes a CSS theme color palettte based on the supplied color which is exported as a css style

TODO
 */
    var c =  bw.colorRgbToHsl( bw.colorParse(color));

    var p = "bw-theme-";
    var thm = ["l5","l4","l3","l2","l1","d1","d2","d3","d4","d5"].map(function(x){return p+x;});
    var im = " !important";
    thm = thm.map(function(x,i){return [x,[["color", ((i<5)?"#000" : "#fff")+im ],["background-color",c + im] ]]; });

    return thm;

};
// =============================================================================================
bw.CSSSimpleStyles = function(appendToHead, options) {
/* 
bw.CSSimpleStyles(appendToHead,options)

Generate simple styles for bitwrench.  
write a quick grid style sheet for quick n dirty layout.  See docs for examples.

appendToHead  ==> if true, attempts to append to HTML <head> (only writes if not already present)
options: {
    "basics" : "load"  // if set to "load will load some global constants for html, body, font-family", set to false to leave these unchanged.
    "exportCSS": false // if true will wrap the output css in "script" tags.  
    "id" : "bw-default-styles" // id assigned to the script tag, used for preventing multiple loading in a browser page
}

 */

    var dopts = {
        "globals"       : false,
        "id"           : "bw-default-styles",
        "exportCSS"    : false,
        "colorset"     : {"color" : "#000", "background-color" :"#ddd", "active" : "#222"}, 
        "pretty"       : false, //make easy to read
        "themes"       :  // built-in primitive themes
            [ // must be valid CSS keys / values
                [".bw-thm-light"  , {"color": "#020202 !important;", "background-color": "#e2e2e2 !important;"}],
                [".bw-thm-dark"   , {"color": "#e2e2e2 !important;", "background-color": "#020202 !important;"}],
            ]
    };

    var s ="\n", i;
    //var i,j,k,l;
    var _r = bw.fixNum;
    var rl = bw.makeCSSRule;
    dopts = optsCopy(dopts,options);

    var defs = { // defaults
        defGlobals:         {"box-sizing": "border-box"},
        defContainer:       {"height": "100%", "width":"86%", "margin": "0 auto", "padding-left": "2%","padding-right":"2%","left":"0","top":"1%","box-sizing":"border-box"},
        defFontSerif:       {"font-family": "Times New Roman, Times, serif"},
        defFontSansSerif:   {"font-family": "Arial, Helvetica, sans-serif" }
    };

    if (dopts["globals"] == "load") {
        s+= rl([["html","body"],defs.defContainer]);
        s+= rl(["*"+defs.defFontSansSerif]);
    }
    
    
        
    var d = [ 
        //globals
        ["*", defs.defGlobals],
        [".bw-def-page-setup" , defs.defContainer],
        [".bw-font-serif"     , defs.defFontSerif],
        [".bw-font-sans-serif", defs.defFontSansSerif],

        //text handling
        [".bw-left",    {"text-align": "left"}],
        [".bw-right",   {"text-align": "right"}],
        [".bw-center",  {"text-align": "center", "margin": "0 auto"}],
        [".bw-justify", {"text-align": "justify"}],
        [".bw-code",    {"font-family":"monospace", "white-space":"pre-wrap"}],
        [".bw-pad1",    {"padding-left": "1%", "padding-right":"1%"}],
    
        //tables
        [".bw-table-stripe tr:nth-child(even)" , {"background-color":"#f0f0f0"}],  // striped rows
        [".bw-table-col0-bold tr td:first-child", {"font-weight": "700"}],         // make first col bold
        [".bw-table-compact",  {"border-collapse":"collapse", "border-spacing": "0"}],
        [".bw-table-sort-upa::after", {"content": "\"\\2191\""}],  // table sort arrow up (when visible arrows chosen)
        [".bw-table-sort-dna::after", {"content": "\"\\2193\""}],  // table sort arrow dn (when visible arrows chosen)
        [".bw-table-sort-xxa::after", {"content": "\"\\00a0\""}],  // table sort space  (when visible arrows chosen)

        //tabs
        [".bw-tab-item-list",  { "margin": 0, "padding-inline-start":0}],
        [".bw-tab-item",{"display":"inline", "padding-top":"5px", "padding-left":"10px", "padding-right":"10px", "border-top-right-radius":"7px", "border-top-left-radius": "7px"}],
        [".bw-tab-active", {/* padding-top:4px; padding-left:6px; padding-right:6px; padding-bottom:0;  */ "font-weight":"700"}],
        [".bw-tab:hover",{"cursor": "pointer", "font-weight": 700/* border: 1px  solid #bbb; */}],
        [".bw-tab-content-list", { margin: 0 }],
        [".bw-tab-content",{ display:"none","margin-top":"-1px", "border-radius":0}],
        [".bw-tab-content, .bw-tab-active", {"background-color": "#ddd"}],

        //grid setup
        [".bw-container",{ margin: "0 auto"}],
        [".bw-row",      { width: "100%", display: "block"}],
        [".bw-row [class^=\"bw-col\"]", { float: "left"}],
        [".bw-row::after", { content: "\"\"",   display: "table", clear:"both"}],
        [".bw-box-1", {"padding-top":"10px","padding-bottom": "10px", "border-radius": "8px"}],
    
        //misc element controls
        [".bw-hide",   { display: "none"}],
        [".bw-show",   { display: "block"}]
    ];

    //heading generator
    [1,2,3,4,5,6].map(function(x){d.push([".bw-h"+x, {"font-size":_r(3.2*Math.pow(.85,x+1))+"rem"}]);});

    // grid system (generated)
    for (var k=1; k<=12; k++)
        d.push([".bw-col-"+k, {width:(_r(k*100/12)+"%")}]);

    // generate CSS from above rules    
    s+= d.map(function(x){return rl(x,{pretty:dopts.pretty});}).join("\n")+"\n";

    //primtive in-built color themeing  see opts to overide
    for (i in dopts["colorset"]){
        s+= ".bw-color-"+i+" {"+i+":" +dopts["colorset"][i]+"}\n";
    }

    bw.makeCSS( dopts["themes"]);
    for (i=0; i< dopts["themes"].length; i++) {
        s+= rl( dopts["themes"][i]);
        //s+= bw.makeCSS( dopts["themes"][i])
    }
    
    //responsive screen
    s+= "@media only screen and (min-width: 540px) {  .bw-def-page-setup {    width: 96%;  }}\n";
    s+= "@media only screen and (min-width: 720px) {  .bw-def-page-setup {    width: 92%;  }}\n";
    s+= "@media only screen and (min-width: 960px) {  .bw-def-page-setup {    width: 88%;  }}\n";
    s+= "@media only screen and (min-width: 1100px){  .bw-def-page-setup {    width: 86%;  }}\n";
    s+= "@media only screen and (min-width: 1600px){  .bw-def-page-setup {    width: 84%;  }}\n";
    
    
    if (bw.isNodeJS() == false) {
        var h  = bw.DOM("head")[0];
        var el = document.createElement("style");
        el.id = dopts["id"];
        el.textContent = s;

        if (appendToHead && (document.getElementById(dopts["id"]) == null))  // only append once
            h.appendChild(el);
    }
    if (dopts["exportCSS"])
        s = bw.html(["style",{"id":dopts["id"]},"\n/**\n bitwrench basic css styles\n version: "+bw.version()["version"]+"\n */"+s]);
    return s;
};


bw.CSSSimpleThemes = function (d,appendToHead) {
/** 
bw.bwSimpleThemes() selects simple (we do mean simple) HTML themes for some basic elements.
if d is an number it selects the built-in theme by index (see docs) else if d is a dictionary the elements
in d will be converted to a CSS style.

output is a CSS style.  if appendToHead is true or omitted then the theme is appended to the head element.
 */
    var s ="",xs={};
    /*
    var thm = {
        defBkgCol : "#333",
        defCol    : "#ddd",
        col1      : "#555",
        col2      : "#f0f0f0",
        brd       : "#ddd"
    };

    var thmCSS =  
            [ 
                ["*"                        , {"background-color": thm.defBkgCol, "color":thm.defCol, "font-family": "sans-serif", "box-sizing":"border-box"}],
                ["body"                     , {"margin-top":"1%"}],
                ["th"                       , {"background-color":thm.col1}],
                ["tbody tr:nth-child(even)" , {"background-color": thm.col2}],
                [["table", "td", "th"]      , {"border-collapse":"collapse", "border":"1px solid "+thm.brd}],
                [["td","th"]                , {"padding":"4px"}],
                [["div","body","button","table","input"] , {"border-radius": "2px"}]
                // ["div", {"padding-left":"2%", "padding-right":"2%","padding-top":"1%","padding-bottom":"1%"}]   
            ];
        */
    var def =  [ // default styles
    {
        
        css: 
            [ 
                ["*"                        , {"background-color": "#333", "color":"#ddd", "font-family": "sans-serif", "box-sizing":"border-box"}],
                ["body"                     , {"margin-top":"1%"}],
                ["th"                       , {"background-color":"#555"}],
                ["tbody tr:nth-child(even)" , {"background-color": "#f0f0f0"}],
                [["table", "td", "th"]      , {"border-collapse":"collapse", "border":"1px solid #ddd"}],
                [["td","th"]                , {"padding":"4px"}],
                [["div","body","button","table","input"] , {"border-radius": "2px"}]
                // ["div", {"padding-left":"2%", "padding-right":"2%","padding-top":"1%","padding-bottom":"1%"}]   
            ],
    },
    {
        css: 
            [ 
                ["*"                        , {"background-color": "#f8f8f8", "color":"#111", "font-family": "sans-serif", "box-sizing":"border-box"}],
                ["body"                     , {"margin-top":"1%"}],
                ["th"                       , {"background-color":"#ddd"}],
                ["tbody tr:nth-child(even)" , {"background-color":"#ddd"}],
                [["table", "td", "th"]      , {"border-collapse":"collapse", "border":"1px solid #111"}],
                [["td","th"]                , {"padding":"4px"}],
                [["div","body","button","table","input"] , {"border-radius": "2px"}]
                // ["div", {"padding-left":"2%", "padding-right":"2%","padding-top":"1%","padding-bottom":"1%"}]   
            ],
    }
    ];
    xs = bw.choice(_to(d),{
            "object" : d,
//            "string" : function(){}
            "number" : ((d>=0) && (d<def.length))?def[d].css:def[0].css 
        },def[0].css);

    s= xs.map(function(y){return bw.makeCSSRule(y,{pretty:false});}).join("\n");
    if (appendToHead != false) {
        //var hs = document.getElementById("bw-simple-theme-styles");
        var hs = bw.DOM("bw-simple-theme-styles");
        if (hs.length == 0) {// first time
            //var h  = document.getElementsByTagName("head")[0];
            var h = bw.DOM("head")[0];
            var el = document.createElement("style");
            el.id = "bw-simple-theme-styles";
            el.textContent = s;  //note IE8 requires .text=
            h.appendChild(el);
        }
        else { // replace it
            hs.textContent = s; //note IE8 requires .text=
        }

    }

    return s;
};

// =============================================================================================
bw.selectTabContent = function (item, target) { 
/** 
This function is used inside a tab block to show the appropriate content.  Note that this is
designed to work even if code is emitted as document.getElementById("myTabs").innerHTML = <<generated code..>>
or statically written by the programmer.

note that DOM IDs are not required as selectTabContent() uses DOM path relative logic internally

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
 */
    //if (_to(item)=="string")
    //    item = document.getElementById(item);
    item = bw.DOM(item)[0];

    if (_to(item).substr(0,4) != "html")
       return false;  //unable to set tab content

    var index=0;
    var cols = item.parentElement.getElementsByTagName("li");
    //update which tab selected
    for (i=0; i< cols.length; i++) {
        if (cols[i] == item) { // selected tab logic
            index = i;
            bw.DOMClass(cols[i],"bw-tab-active","bw-tab-active");
        }
        else { // unselected tab logic
            bw.DOMClass(cols[i],"bw-tab-active","");
        }
    }
    //console.log(item);
    var tcols = item.parentNode.parentNode.getElementsByClassName("bw-tab-content-list")[0].getElementsByClassName("bw-tab-content");
    if (tcols.length <= 0)
        return false;

    target = (_to(target) == "undefined") ? tcols[index] : target;  //we will infer it by the tab index
    target = (_to(target) == "string"   ) ? document.getElementById(target) : target;  // we hav an ID so we'll use that
    var i;
    for (i=0; i < tcols.length; i++) {
        if (tcols[i] == target) 
            bw.DOMClass(tcols[i],"bw-show","bw-show"); //tcols[i].style.display = "block";
        else
            bw.DOMClass(tcols[i],"bw-show","");//tcols[i].style.display = "none";  
    }
    return true;  
};

// =============================================================================================

bw.DOMClass = function(el, key, replace) {
/** 
bw.DOMClass(el,value) 

returns whether a specific DOM element class name (key) is set on atleast one the supplied element(s).  

If replace is supplied then the class name (key) is replaced or added if it doesn't exist.
    note that if key is not found but a replace is supplied the return-value is still false as the supplied key was not found 

el must be valid element or CSS selector

markElement is used by bw UI toggles
 */
    var r = false, elems, x,j;
    //if (_to(el) == "string")
    //    el=document.getElementById(el);
    elems = bw.DOM(el);
    if (elems.length <=0 )
        return r;

    for (j=0; j< elems.length; j++) {
        x = elems[j];
        try {
            var c = x.className.split(/[ ]+/);
            var i = c.indexOf(key);

            if (i >= 0) // found key
                r = true;
            
            
            if ((_to(replace) == "string") && (c.indexOf(replace)== -1)){
                if (i == -1) //key not found
                    c.push(replace);
                else {
                    if (replace.length > 0)
                       c[i]=replace;
                    else
                       c.splice(i,1);
                }
                x.className  = c.join(" ").trim();
                r = true;
                // element.className = element.className.replace(/\bmystyle\b/g, "");
            }
        }
        catch(e) { bw.log(e);}
    }
    return r;
};

// =============================================================================================
bw.DOMClassToggle  = function(el,className) {
/**
bw.DOMClassToggle(el,classname) 
for each element specified in el (eg "#id", ".myClass", "h2", <DOM OBJECT>) toggle className.

If className is present on the object then it is removed. if it is not present it is added.


classNames with spaces or tabs are not valid and result in undefined behavior.

returns last element current toggle state.
*/    
    var x,i,elems = bw.DOM(el), r=false;
    for (i=0; i< elems.length; i++) {
        x=elems[i];
        try {
            r = bw.DOMClass(x,className);
            if (r)
                bw.DOMClass(x,className,"");
            else
                bw.DOMClass(x,className,className);

        } catch(e) { bw.log(e);    }
    }
    return !r;
};
// =============================================================================================
bw.version  = function() {
/** 
@method version() - bitwrench runtime version & license info.

 */
    var v = {
        "version"   : "1.2.5", 
        "about"     : "bitwrench is a simple library of miscellaneous Javascript helper functions for common web design tasks.", 
        "copy"      : "(c) M A Chatterjee deftio (at) deftio (dot) com",    
        "url"       : "http://github.com/deftio/bitwrench",
        "license"   : "BSD-2-Clause"
    };
    return v;
};

// ==============================================================================================
/** 
command line handling

this can be done via URL e.g. myPage.com?bw-load-styles=true

or via script tag
<script type="text/javascript" src="./path/to/bitwrenchjs" bwargs="bw-load-styles=true"></script>

 */
bw.bwargs = {enableUJURLArgs : "true"}; // the arguments are exported so one can see them as a simple dict

var parseArgs = function(s) {
    var args = {};
    if ((typeof s == "string") && (s!= "")) {
        s=s.split(";");
        var j;
        for (j in s) {
            var k = s[j].split(":");
            args[k[0]]=k[1];
        }
    }
    return args;
};

var getArgs =  function () {
    if(bw.isNodeJS()==false) { // in browser
        //var els = document.getElementsByTagName("script"); // array of script elements
        var els = bw.DOM("script");
        var i,a,b;
        for (i in els) {
            try {
               // bw.log(_args[i]);
                var el = els[i]; //
                if (el.hasOwnProperty("src") != false)
                    break; 

                var s = String(el.getAttribute("src"));
                var f = "bitwrench.js";

                if (s.toLocaleLowerCase().substring(s.length-f.length,s.length) == f.toLocaleLowerCase()) {
                    s = _to(s) == "string" ? el.getAttribute("bwargs") : [""];
                    s = _to(s) == "string" ? el.getAttribute("data-bwargs") : s; //the html4/5 standard way
                    a = parseArgs(s);
                    for (b in a)
                        bw.bwargs[b]=a[b];
                }
                
            } catch (e) { 
                //bw.log(String(["err 1418",i,e]));
            }  
        }

        //pick up from URL
        if(bw.bwargs["enableUJURLArgs"] == "true") { //note string literal "true" 
        //note in the script tag you can disable ?bwload=foo:bar; params with this
        //<script type="text/javascript" src="./path/to/bitwrench.js" bwargs="enableURLConfig:false"></script>
            a = parseArgs(bw.getURLParam("bwargs",""));        
            for (b in a)
                bw.bwargs[b]=a[b];
        }
    }
};


// ==============================================================================================
// ==============================================================================================
// ==============================================================================================
//internally used function declarations:


getArgs();  

// do command line stuff
var loadStyles      =  bw.bwargs["bw-load-styles"]!="false";
var loadStyleBasics =  bw.typeAssign(bw.bwargs["bw-load-style-basics"],"string", bw.bwargs["bw-load-style-basics"], "load");
bw.CSSSimpleStyles(loadStyles,{"globals":loadStyleBasics}); // append to head the bitwrench css styles by default

bw.funcRegister(bw.log,"bw_log");  // this is globally registered for debugging purposes, it will never get called though unless programmer does this explicitly.

    return bw;
}));

