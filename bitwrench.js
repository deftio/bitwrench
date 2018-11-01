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
//var bw = require('./bitwrench.js')["bw"];  //adds to current scope

 // optional polyfill for IE8 and earlier
(function(fn){
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
})(Array.prototype);
// * /

(function(bw){

"use strict";

// ===================================================================================
bw.choice    = function (x,choices,def) { 
/** 
bw.choice(x,choices-dictionary, default) 
Allows a dictionary to be used as a switch statement, including functions.

colors = {"red": 1, "blue": 2};
bw.choice("red",colors,"0")   ==> "1"
bw.choice("shiny",colors,"0") ==> "0"

 */
    return (x in choices) ? choices[x] : def;
};   


// ===================================================================================
bw.jsonClone = function (x)       {
/** 
bw.jsonClone(object)
crude deep copy by value of an object as long as no js dates or functions
 */
    return JSON.decode(JSON.encode(x));
};


// ===================================================================================
bw.typeOf    = function (x)       {
/** 
bw.typeOf(obj)

A useable typeof operator.  See this fantastic reference: 
https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
 */
    if (x === null)
        return "null";

    return (typeof x == "undefined") ? "undefined" : (({}).toString.call(x).match(/\s([a-zA-Z]+)/)[1].toLowerCase());
};

var _to  = bw.typeOf;
//===============================================
// internally used type check and assign function
bw.typeAssign = function (a, typeString, trueValue, falseValue) {
/** 
bw.typeAssign(variable, typeString, trueValue, falseValue) 
typeAssign is used to see if the argument a is of type typeString as defined by bw.typeOf().
if it is then trueValue is returned else falseValue.

bw.typeAssign("23","number","is a number!", "not a number!") ==> "is a number!"
bw.typeAssign([23],"number","is a number!", "not a number!") ==> "not a number!" // is an array of length 1

can also supply list of types
bw.typeAssign(23,["string","number"], "string or num", "something else") ==> "string or num"
bw.typeAssign(true,["string","number"], "string or num", "something else") ==> "something else"

 */
    if (_to(typeString) == "string")
        typeString = [typeString];
    return (typeString.indexOf(bw.typeOf(a)) >= 0) ? trueValue : falseValue;
};

var _toa = bw.typeAssign;  // eslint-disable-line no-unused-vars

//===============================================
// internally used function for options copy
var optsCopy = function(dopts,opts) {
    if ((_to(opts) == "object") && (_to(dopts)=="object")) {
        var i;
        for (i in opts)
            dopts[i] = opts[i];
    }
    return dopts;
};

//===============================================

bw.DOMIsElement = function(el) {
/**
    @method bw.DOMIsElement() return whether a supplied element is a HTML DOM element. only useful in browser,

 */    var r = false;
    try {
        if(_to(el)== "undefined")
            return r;
        if (bw.isNodeJS() == false)
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
bw.DOMGetElements = function (el, type) {
/**
    @method bw.getDOMElements() returns an array of DOM elements (if running in browser)
    
*/
    var r=[],a=[],i;

    if (bw.isNodeJS() == false) {  // we're running in a browser
        if (_isEl(el))
            return [el];  
        if (_to(el) == "string") { // now its a string so we have choices.. 
            type = _toa(type,"string",type,"auto"); // auto means detect whether has a # or . in front of it
            el.trim();
            if (type == "auto")
                type = bw.choice(el[0],{".":"className", "#":"id"},"tagName");
            switch (type) {
                case "id" : //get Element by ID
                    el = (el[0]=="#") ? el.substring(1,el.length) : el;
                    a = document.getElementById(el);
                    a = _toa(a,"null",[],[a]);
                    break;
                case "className": // get Elements by class name
                    el = (el[0]==".") ? el.substring(1,el.length) : el;
                    a = document.getElementsByClassName(el);
                    break;
                case "tagName" : // get Elements by tag name
                    a = document.getElementsByTagName(el);
                    break;
                case "name":
                    a = document.getElementsByName(el);
                    break;
                default:  // auto 
            }
            for (i in a)
                r.push(a[i]);
        }
    }

    return r;
};
var _els = bw.DOMGetElements;

// =============================================================================================
/** 
    bitwrench: color functions (used for theming and interpolations)

    bitwrench functons operate using this internal color representation model:
    [c0, c1, c2, alpha, model]  
    where c0, c1, c2 are model dependant
    alpha represents the transperancy
    model is a color model string (lowercase) rgb, or hsl (compatible with HTML/CSS colors)

    colorParse() ==> take an input color of anymodel and output a bw [c0,c1,c2,a,m] array 

*/
bw.colorInterp = function(x, in0, in1, colors, stretch) {
/**
bw.colorInterp() interpolate between and array of colors.  
 x is a value between in0, in1
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
bw.colorHslToRgb = function (h, s, l, a){
/**
Converts an HSL color value to RGB. Conversion formula
adapted from http://en.wikipedia.org/wiki/HSL_color_space.
Assumes h, s, and l are contained in the set [0, 1].  Note to convert h from degrees use (h_degrees/360)
returns r, g, and b in the set [0, 255].

@param   {number}  h       The hue [0..1]
@param   {number}  s       The saturation [0..1]
@param   {number}  l       The lightness [0..1]
@return  {Array}           The RGB representation

https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
 */    
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function (p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    var _fn = function(x){return bw.clip(Math.round(x),0,255);};
    return [_fn(r), _fn(g), _fn(b), a, "rgb"];
};

// =============================================================================================
bw.colorRgbToHsl = function (r, g, b, a) {
/**
Converts an RGB color value to HSL. Conversion formula
adapted from http://en.wikipedia.org/wiki/HSL_color_space.
Assumes r, g, and b are contained in the set [0, 255] and
returns h, s, and l in the set [0, 1].

@param   {number}  r       The red color value
@param   {number}  g       The green color value
@param   {number}  b       The blue color value
@return  {Array}           The HSL representation
*/
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
    return [h, s, l, a, "hsl"];
};    

// =============================================================================================

bw.colorParse = function(s,defAlpha) {
/**
    @method bw.colorParse(s)
    @description take a valid CSS style color string: #rgb | #rgba | #rrggbb | #rrggbbaa | rgb(r,g,b) | rgb(r,g,b,a) | hsl(h,s,l) | hsla(h,s,l,a )  ... and return array [c0,c1,c2,a,model] where model is one of rgb, hsl
*/
    defAlpha = _toa(defAlpha,"number",defAlpha,255);
    var r = [0,0,0,defAlpha,"rgb"]; // always return a valid type 
    if ((_to(s)=="array")&&(s.length==5)){ // it could be a bwcolor type [c0,c1,c2,a,model]
        s= String(s[4])+"("+String(s[0])+","+String(s[1])+","+String(s[2])+","+String(s[3])+")"; //could use slice..join(",")
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
            r[4] = x[1].toLowerCase();
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
    @description take a color of the form [c0,c1,c2,alpha,model] ==> convert to #rrggbbaa format
    format (optional) can be set to auto in which case alpha is ommitted if set to 255
 */
    var r = "#00000000";
    var ph = function(x){var y=(bw.clip(Math.round(x),0,255)).toString(16); return (y.length==1)?"0"+y:y;}; // pad hex
    if ((_to(c) == "array") && (c.length == 5)) {
        switch(c[4]) {
            case "rgb":
                r = "#"+ph(c[0])+ph(c[1])+ph(c[2]);
                if (!((format == "auto") && (c[3]==255)))
                    r += ph(c[3]);
                break;
            case "hsl":
                //bw.colorRgbToHsl
                var z = bw.colorHslToRgb(c[0],c[1],c[2]);  // convert to rgb components
                r = bw.colorToRGBHex([z[0],z[1],z[2],c[3],"rgb"]); // packout rgb
                break;
            default:
                bw.logd("colorToRGBHex : unsupported format" + c[4]);
        }
    }
    return r; // default
};
/* simple version rgb2hex
function rgbToHex(r, g, b, a) {
    var c2r = function (c){c = bw.clip(c,0,255).toString(16); return ((c.length==1 ) ?"0":"")+c;};
    if (typeof a == "undefined") { a = "";} else {a = c2r(a)};
    return "#" + c2r(r) + c2r(g) + c2r(b) + a;
}
*/

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
        _logdata.push ([0,(new Date()).getTime()," log started (absolute timestamp)"]);
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
    @description: bw.logd is a log funciton which behaves similar to console.log() however instread of outputting to console, it writes to bw.log() function with the following differences: 1. all a

todo: comma seperated items;
console     ==> also (attempt) to output to console.log
bwdbg       ==> log bw catches / errors (else silent)
none        ==> no output (of any kind)
stringigy   ==> takes bw.logd args and strinigyfies before writing to bw.log
example:
logd=console,bwlogd

*/
    var logdargs =  ("bwlogd" in bw.bwargs) ? bw.bwargs["bwlogd"].split(",") : [];

    if (logdargs.indexOf("none") < 0) {
        var i=0;
        var _a = [];
        for (i=0; i< arguments.length; i++)
            _a.push(arguments[i]); //arguments, a reserved javascript keyword is not a true array
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
bw.logExport({"exportFormat":"HTML"})

or as a simple text file:
bw.logExport("exportFormat" : "text"})

see bw.saveClientFile(fname) for saving the log as a file

 */
    var dopts = {
        exportFormat : "raw"  // can also be HTML table if set to "HTML"
    };
    dopts = optsCopy(dopts,opts);

    var _ld = _logdata;  

    if (dopts["exportFormat"] == "raw")
        return _ld;

    if (dopts["exportFormat"] == "HTML") {
        return bw.makeHTMLTableStr(_ld,{sortable:true});
    }

    if (dopts["exportFormat"] == "text") {
        return bw.logExport().map(function(x){return x.map(function(y){return y.toString();}).join("\t");}).join("\n");
    }
};


// ===================================================================================
bw.setCookie = function (cname, cvalue, exdays) {
/** 
bw.setCookie(cookieName, value, expireDays)
set a client side cookie.  Adapted from W3 Schools
  */
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
};
 
// ===================================================================================
bw.getCookie = function (cname, defaultValue) {
/** 
bw.getCookie(cookieName, defaultValueIfNotFound)
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
bw.getURLParam = function (key,defaultValue) {
/** 
bw.getURLParam(key,defaultValueIfNotFound)
read the URL (e.g. http://example.com/my/page?this=that&foo=123) and parse the URL paraemeters

x = bw.getURLParam("foo","whatever") ==> returns 123
x = bw.getURLParam("bar","whatever") ==> returns "whatever" since bar isn't set 
*/
    var params = {};
    if (location.search) {
        var parts = location.search.substring(1).split("&");
        for (var i = 0; i < parts.length; i++) {
            var nv = parts[i].split("=");
            if (!nv[0]) continue;
            params[nv[0]] = nv[1] || true;
        }
    }     
    if (params.hasOwnProperty(key) == false)
        return defaultValue; // note if defaultValue is undefined then result is still undefined. :)
    return params[key];
};

// crude performance measurements
var gBWTime = (new Date()).getTime(); //global closure for time.  'cause we always want a gbw gbw time :)
 
// ===================================================================================
bw.clearTimer = function (message) {
/** 
bw.clearTimer("message")
When bitwrench loads its starts a page timer which can be checked for how long the page as been running (see bw.readTimer()).  bw.clearTimer() clears the timer with optional message.
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
bw.prettyPrintJSON=function (json) {
/** 
bw.prettyPrintJSON(object, styles) 
pretty print any javascript object as displayable HTML. 
e.g.
document.getElementById("myPlaceToDisplay").innerHTML = bw.prettyPrintJSON(...any object ....)
//TODO make style dict
   */
	function f(json) { 
		json = JSON.stringify(json, undefined, 2);
		if (typeof json != "string") { json = JSON.stringify(json, undefined, 2);}
		json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
bw.setIntervalX = function (callback, delay, number_of_repetitions) {
/** 
bw.setIntervalX(callbackFn, delayBtwCalls, repetitions)
set a javascript timer to only run a max of N repetions.

NoteS: 
    Only works in browser not server side as it requires access to window object.
    callback function is called with the interval number to be used for whatever purposes the callback likes
 */


    var x = 0;
    var intervalID = window.setInterval(function () {
        callback(x);

        if (++x >= number_of_repetitions) {
                window.clearInterval(intervalID);
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
// ===================================================================================
bw.htmlSafeStr = function (str) {
/** 
bw.htmlSageString(str) 
Replace non valid HTML characters with HTML escaped equivalents.   
 */
       return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\n/g,"<br>");
};

// ===================================================================================
bw.makeHTMLPage = function (head, body, options) {
/** 
bw.makeHTMLDoc(head,body,options)
make a simple HTML document.  Note this can also be usd win bw.makeHTML()

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
    s += bw.buildHTMLObjString(["html",dopts["htmlParams"],[
            "\n",
            ["head", {}, [ "\n",dopts["headDefaultContent"].map(function(x){return bw.buildHTMLObjString(x);}).join("\n"),head,"\n"]],
            "\n",
            ["body", {}, [ "\n",body,"\n"]],
            "\n"
        ]]);
    return s;
};
// ===================================================================================
bw.makeCSS = function (cssData, options) {
/** 
bw.makeCSS(cssData, options)

cssData = "h2 {color:blue;}"    // string
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

dicts not used because css can have multiple redundant selectors with different rules

 */
    var dopts = {
        emitStyleTag: false,
        atr: {}
    };
    dopts = optsCopy(dopts,options);

    var s="\n";
    var tb = function (a) {a =(String(a)).trim(); a=(a[0]=="{"?" ":" {")+a; a+=(a[a.length]=="}"?"":"}")+"\n"; return a;};
    try {
        switch (bw.typeOf(cssData)) {
            case "string":
                s += cssData +"\n";
                break;
            case "array":
                var i; 
                for (i=0; i<cssData.length; i++) {
                    var j = cssData[i];
                    switch (bw.typeOf(j)) {
                        case "string": 
                            s+= j+"\n"; 
                            break;
                        case "array" : //expects length 2 array, ==>[str, str], [[str,str,str],str]  //these are the 2 valid types
                            if ((j.length == 1) && (bw.typeOf(j[0])=="string")) {
                                s+= j[0]+"\n";
                                break;
                            }
                            if (j.length == 2) {
                                if (bw.typeOf(j[0])=="string") {
                                    s+= j[0]+ tb(j[1]);
                                    break;
                                }
                                if (bw.typeOf(j[0])=="array")
                                    s+= j[0].join(",") + tb(j[1]);
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
    catch (e) {}  //  eslint-disable-line no-empty
    if (dopts["emitStyleTag"]) {
        s = bw.buildHTMLObjString(["style",dopts["atr"],s]);
    }
    return s;
};

// ===================================================================================
bw.buildHTMLObjString = function (d,options) {
/**  
bw.buildHTMLObjString(data)  

takes data of one of these forms:

   string
   array: ["div",{attribute dict},content]
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
        var w  = Array(opts["indent"]).join(opts["indentStr"]);
        var we =  Array(opts["indent"]-1).join(opts["indentStr"]);
        return opts["pretty"] ? "\n"+w+ s + "\n" +we: s;
    };

    dopts = optsCopy(dopts,options);

    dopts["indent"]++;

    var s="", t="",a={},c=[],i;

    switch (bw.typeOf(d)) {
        case "date":
        case "number":
            s=String(d); // eslint-disable-line no-fallthrough
        case "string":    
            s=d;
            return outFn(s,dopts); // Note return statement here... 
            break;                 // eslint-disable-line no-unreachable
        case "function" :
            s = bw.buildHTMLObjString(d(),dopts);
            break;
        case "array":

            if ((bw.typeOf(d[0]) == "undefined") || d.length != 3)
                return "";
            t = bw.typeOf(d[0]) != "undefined" ? d[0] :t;
            a = bw.typeOf(d[1]) != "undefined" ? d[1] :a;
            c = bw.typeOf(d[2]) != "undefined" ? d[2] :c;
            t = bw.typeOf(t)    == "function"  ? t()  :t;
            a = bw.typeOf(a)    == "function"  ? a()  :a;
            c = bw.typeOf(c)    == "function"  ? c()  :c;
            c = bw.typeOf(c)    != "array"     ? [c]  :c;
            break;
        case "object":
            t = bw.typeOf(d["t"])         == "function" ? d["t"]()       : t;
            t = bw.typeOf(d["tag"])       == "function" ? d["tag"]()     : t;
            t = bw.typeOf(d["t"])         == "string"   ? d["t"]         : t;  
            t = bw.typeOf(d["tag"])       == "string"   ? d["tag"]       : t;  

            a = bw.typeOf(d["a"])         == "function" ? d["a"]()       : a;
            a = bw.typeOf(d["atr"])       == "function" ? d["atr"]()     : a;
            a = bw.typeOf(d["a"])         == "object"   ? d["a"]         : a;
            a = bw.typeOf(d["atr"])       == "object"   ? d["atr"]       : a;
            switch (bw.typeOf(d["c"])) {
                case "function" : 
                    c = d["content"](); break;
                case "array" : 
                    c = d["content"]; break;
                default:
                    c = [d["content"]];
            }
            switch (bw.typeOf(d["c"])) {
                case "function" : 
                    c = d["c"](); break;
                case "array" : 
                    c = d["c"]; break;
                default:
                    c = [d["c"]];
            }
            break;
        default:
            bw.log("bw.buildHTMLObjString:: error in type");
    }
    
    s+= "<" + t ;
    for (i in a) { 
        s+=" "+ String(i)+"=\"" + String(a[i]) +"\"";
    }
    s+= ">";
    //console.log(t,a,c);
    for (i=0; i<c.length; i++) {
        var _c = "";

        switch(bw.typeOf(c[i])) {
            case "function":
                _c = c[i]();  // eslint-disable-line no-fallthrough
            case "object":    // eslint-disable-line no-fallthrough
            case "array" :
            _c = bw.buildHTMLObjString(c[i],dopts);
            break;
            default:
            _c = String (c[i]);
        }
        s+= _c;
    }
    s+= "</" + t + ">";

    return outFn(s,dopts);
};
bw.makeHTML = bw.buildHTMLObjString;

// ===================================================================================
bw.makeHTMLList = function (listData, listType, atr, atri) {
/**
bw.makeHTMLList (listData, str)

listType = "ul" | "ol"
listHtml = [ item1, item2, item3, .. ]

 */
    if (bw.typeOf(listData) != "array")
        return "";

    if (listData.length < 1)
        return "";

    atr  = _toa(atr,"object",atr,{});
    atri = _toa(atr,"object",atr,{});

    var lc = listData.map(function(x){return bw.buildHTMLObjString(["li",atri,x]);});

    return bw.buildHTMLObjString ([listType,atr,lc]);
};
// ===================================================================================
bw.makeHTMLTabs = function(tabData, atr) {
/** 
bw.makeHTMLTabs(tabData, atr)
tabData = [[tab1,tab1-content],[tab2,tab2-content],[tab2,tab2-content]]
 */
    if (bw.typeOf(tabData) != "array")
        return "";
    if (tabData.length < 1)
        return "";
    atr = (bw.typeOf(atr) == "object") ? atr :{};
    var ti = tabData.map(function(x){return ["li",{"class":"bw-tab", "onclick":"bw.selectTabContent(this)"},x[0]];});
    var tc = tabData.map(function(x){return ["div",{"class":"bw-tab-content"},x[1]];});
    
    ti[0][1]["class"] = ti[0][1]["class"] + " bw-tab-active";
    tc[0][1]["class"] = tc[0][1]["class"] + " bw-show";
    
    if ("class" in atr)
        atr["class"] += atr["class"].split(/\s+/ig).indexOf("bw-tab-container") < 0 ? " bw-tab-container": "" ;
    else
        atr["class"] = "bw-tab-container";

    return bw.buildHTMLObjString(["div", atr,[["ul",{"class":"bw-tab-item-list"},ti],["div",{"class":"bw-tab-content-list"},tc]]]);
};

// ===================================================================================

bw.makeHTMLTableStr = function(data,opts) {    
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
document.getElementById("myTableDiv") = bw.makeHTMLTableStr(table1, options);  

Options:
        useFirstRowAsHeaders : true;   // 
 */
    if ((bw.typeOf(data) != "array") || (data.length < 1))
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

    var i=0,head="",body="",r,_hs=bw.buildHTMLObjString;
    dopts = optsCopy(dopts,opts);
    /*
    for (i in opts)
        dopts[i] = opts[i];  // overide defaults
    */

    if (bw.typeOf(dopts.th_atr["onclick"]) == "function") {
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
        if (bw.typeOf(dopts.sortable) == "function") {
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
    head = bw.buildHTMLObjString(["thead",dopts.thead_atr,head]);

    for (; i<data.length; i++) {
        r = data[i].map(function(x){return _hs(["td",dopts.td_atr,x]);}).join(""); 
        body+= _hs(["tr",dopts.tr_atr,r]);
    }
    body = bw.buildHTMLObjString(["tbody",dopts.tbody_atr,body]);
    //console.log(head,'\n',body);
    dopts.caption = dopts.caption == "" ? "" :  _hs(["caption",{},dopts.caption]);
    return _hs(["table",dopts.atr,[dopts.caption,head,body]]);
};

// =============================================================================================
bw.naturalSort = function (as, bs){
/** 
bw.naturalSort(a,b) {
bw.naturalSort() is a function which can be passed to an array sort to provide natural sorting of mixed array elements.

[3,4,2,1,"10","111","foo","bar","01","this123","This123", "848"].sort()
vs
[3,4,2,1,"10","111","foo","bar","01","this123","This123", "848"].sort(bw.naturalSort)

it is the default sort for bw.sortHTMLTable()

 */
//https://www.webdeveloper.com/forum/d/254726-sorting-alphanumeric-array (taken from here) see also
//using .localCompare() in newer versions of JS

    var a, b, a1, b1, i= 0, L, rx=  /(\d+)|(\D+)/g, rd=  /\d/;
    if(isFinite(as) && isFinite(bs)) return as - bs;
    a= String(as).toLowerCase();
    b= String(bs).toLowerCase();
    if(a=== b) return 0;
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
    table must be a valid DOM table element or be string represent a valid DOM Id.

    default uses string compare. but can pass in a function
    sortFunc(a,b,col) // a and b are the cells to compare, col is optional info on what column this is   
  */
    
    var  rows, switching, i, x, y, shouldSwitch;
    var sortF = bw.typeOf(sortFunction) == "function" ? sortFunction : bw.naturalSort;
    table = _isEl(table) ? table : _els(table);
    //table = bw.typeOf(table)=="string" ? document.getElementById(table) : table;  // if its a string try to get it by id else assume DOM element
    dir = (dir==true) || (dir=="up") ? true : false;

    switching = true;
    col = bw.typeOf(col) == "number" ? col : 0;  //default sort on left most column

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
bw.sortTableDispatch(el) is used to bind sorting functions to tables generated by  bw.makeHTMLTableStr(....)
item must be a valid DOM element or id.

 */
    var i;
    if (bw.typeOf(item)=="string")
        item = document.getElementById(item);

    if (bw.typeOf(item).substr(0,4) != "html")
       return false;  //something not right about this table element

    var index=0,dir;
    var cols = item.parentElement.getElementsByTagName("th");
    //update which tab selected
    for (i=0; i< cols.length; i++) {
        if (cols[i] == item) { // selected tab logic
            index = i;
            dir = bw.markElement(cols[i],"bw-table-sort-upa") ; // ifthe current col is already up..
            if (dir) { 
                bw.markElement(cols[i],"bw-table-sort-upa", "bw-table-sort-dna" ); 
            }
            else { //dna or xxa
                if (bw.markElement(cols[i],"bw-table-sort-dna")) {
                    bw.markElement(cols[i],"bw-table-sort-dna", "bw-table-sort-upa" ); 
                } else
                    bw.markElement(cols[i],"bw-table-sort-xxa", "bw-table-sort-upa" );
            }
        }
        else{ // its not the selected column so we clear the up / down arrow
            bw.markElement(cols[i],"bw-table-sort-upa",""); 
            bw.markElement(cols[i],"bw-table-sort-dna","");
            bw.markElement(cols[i],"bw-table-sort-xxa","bw-table-sort-xxa");
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
bw.funcRegister(superDuperFunctionCode,"myFnName");  

...

 */
    var fnID = "class_bwfn_" + _fnIDCounter; 
    _fnIDCounter++;
    fnID = bw.typeOf(forceName) == "string" ? forceName : fnID;
    fnID.trim();
    _fnRegistry[fnID] = fn;
    return fnID;
};

bw.funcUnregister = function (fnID) {
/** 
bw.funcUnregister(fnID)
remove a function from the bw dispatch registry

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
        return (bw.typeOf(errFn) == "function") ? errFn : function(){bw.log(_id,"bw.funcGetById(): unregistered fn error");} ;
    }
};

bw.funcGetDispatchStr = function (fnID, argstring) {
/** 
bw.funcGetDispatchStr(fnID, argString) 
create a string suitble for use in DOM element dispatch.  note argstring is a literal so variables must be reduce to their values.
see bw.funcRegister() for getting valid IDs for user supplied functions.

example: bw.funcGetDispatchStr("myFuncID","param1,param2")

 */
    
    switch (bw.typeOf(argstring)) {
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
    default is false;

Default is a paragraph of lorem ipsum (446 chars)

 */

    startSpot  = _to(startSpot) != "number" ? 0 : Math.round(startSpot);

    var l = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ";
    startSpot = startSpot % l.length;
    l= l.substring(startSpot, l.length) + l.substring(0,startSpot);

    if (bw.typeOf(numChars) != "number")
        numChars = l.length;

    var i=numChars, s="";

    
    while (i>0) {
        s+= (i < l.length) ? l.substring(0,i) : l;
        i-= l.length;
    }
    if (s[s.length-1] == " ")
        s= s.substring(0,s.length-1) + "."; // always end on non-whitespace.  "." was chosen arbitrarily.
    if ((startWithCapitalLetter == true) && (s[0].match(/[A-Z]/) == null))
        s = "M"+s.substring(1,s.length); // arbitrary capital letter chosen whichc sorta goes will if next letter is a consonant or vowel

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
        dropLeadingWS : false // removes leading whitespace on each line, tabs, and floating single * e.g.  " * @mycomment" ==> "@mycomment"
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
    //console.log(_to(r), ":::" , r);

    if (_to(r)=="array") {
        r = r.map(function(x){return x.substring(dopts["delims"][0].length, x.length-dopts["delims"][1].length);});
        r = (dopts["dropLeadingWS"]==true) ? r.map(function(x){return x.replace(/^\s*\**\s*/,"");}) : r;
    }
    else
        r=[];
    
    return r;
};

// =============================================================================================
bw.parseJsDocString = function(s) {
/**
    @method bw.parseJsDocString() - parse and extract info from a jsdoc style comment.
    @param{string} s - a valid js docstring
    @return an array of triplets [@param, {types}, comment info]
 */
    var r = s.split(/[\n\r]+/).map(function(x){return x.match(/\s*\*?\s*@([A-Za-z0-9_]*)\s*(\{[A-Za-z0-9_|\s,.\-+!@#$%^&*()=[\]]*\})?([\S\s]*)/i);});
    if (bw.typeOf(r) != "array")
        return [];
    if (r[0] == null)
        return []; // bad string
    
    r = r.map(function(x){ try {var z = _toa(x,"array",[x[1] || "",x[2] || "",x[3] || ""],[]);} catch (e){bw.log(e);} return z;});
    r = r.filter(function(x){if (_to(x)!="array") return false; return (x.length==3);});

    var  _tws = function(x) { return x.replace(/^[\s\r\n]+|[\s\r\n]+$/gm,"");};  //local function to trim whitespace
    var  _tb  = function(x) {return x.replace(/^\{?|\}?$/g,"");};
    r= r.map (function(x){return [_tws(x[0]),_tb(_tws(x[1])),_tws(x[2])];}); // trim white space 
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
bw.isNodeJS = function () {
/** 
bw.isNodeJS() ==> returns true if running in node environment (else browser)
 */
    return (typeof module !== "undefined" && module.exports) !== false;  //a hack will fix later
};

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

    digits = bw.typeOf(digits) == "number" ? digits : 3;
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
bw.clip(data, min, max)  clips data in between min and max. 
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
bw.mapScale()

Map an input value x in its natural range in0...in1 to the output space out0...out1 with optional clipping
expScale allows sigmoidal warping to stretch input values contrained to a small range. (floating point scale factor)
x can be either a number or array of numbers.

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
    @description bw.padnum() takes a number and pads left pads (default is '0')
    @param x {number} 

*/
    var dopts = {
        padChar : " "
    };
    dopts = optsCopy(dopts, options);
    x = String(x);
    return (x.length >= width) ? x : new Array(width - x.length+1).join(dopts["padChar"]) + x;
};
// =============================================================================================
bw.trim = function (s, dir) {
/**
    @description bw.trim() trims a string on either left, right, or both.  (cross browser works before IE8)
    @param s {string} : a string to trim white space on
    @param dir {"left" | "right" | "both" | "none"} : trim white space on left only, right only or both sides, or no trim (default is both)
*/
    var t = bw.choice(
        dir, 
        {
            "left"  : /^[\s\uFEFF\xA0]+/g,
            "right" : /[\s\uFEFF\xA0]+$/g,
            "none"  : /(?!)/ // useful for programmatic scenarios (eg. [....].map ) where not all of the entries should be trimmed.
        },
        /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g
    );
    return String(s).replace(t,"");
};

// =============================================================================================
bw.padString = function (s, width, dir, options) {
/**
    @description bw.padString() takes a string and pads it to the specified number of chars either left or right or centered.

*/
    var dopts = {
        padChar    : " ",
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
            "center"    : [Math.round(p/2),p-Math.round(p/2)]
        },
            [0,0]
        );
    return  (new Array(q[0]).join(dopts["padChar"]))+x+(new Array(q[1]).join(dopts["padChar"]));
};

// =============================================================================================
bw.random = function(rangeBegin, rangeEnd, options) {
/** 
bw.random(rangeBegin, RangeEnd, {options} 

Return a random number between rangeBegin and RangeEnd (inclusive)
    default is 0,100

options 
    {
        setType : "int"
        dims    : false | number | [ , , ]  // selector for dimensions
    }

options
    seType: 
    "int"               ==> return an integer
    "float" or "number" ==> return floating point number

    dims
        false or ommitted ==> return a single number
        5                 ==> return a 5x1 array of random numbers
        [3,5,2]           ==> return a 3x5x2 array of random numbers

example:
bw.random() ==> returns a number btw 0,100
bw.random(-4,4,{setType: "float", dims[4,5]}) ==> returns a 3x5 array of floating pt numbers btw -4,4
    
 */
    rangeBegin = bw.typeOf(rangeBegin)  == "number" ? rangeBegin : 0;
    rangeEnd   = bw.typeOf(rangeEnd)    == "number" ? rangeEnd   : 100;

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


bw.hashFnv32a= function (str, seed, returnHexStr) {
/**
  @moethod Calculate a 32 bit FNV-1a hash
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
bw.prandom = function (rangeBegin,rangeEnd,seed, options) {
/**
    prandom - generate a psuedo random number from internal hash function in a given range

*/
    rangeBegin = bw.typeOf(rangeBegin)  == "number" ? rangeBegin : 0;
    rangeEnd   = bw.typeOf(rangeEnd)    == "number" ? rangeEnd   : 100;

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
        n = (((bw.hashFnv32a("start string",seed) & 0xffff)/(65536)) * (rangeEnd-rangeBegin)) + rangeBegin;
    
        return (dopts.setType == "int") ? Math.round(n) : n;
    };

    if ((_to(dopts["dims"]) == "array") || (_to(dopts["dims"])== "number"))
        return bw.multiArray( _rnd, dopts["dims"]);

    return _rnd();

};
// =============================================================================================
bw.bwMakeThemeCSS   = function(color) {
/**
    makeThemeCSS (color) 

    makes a color palettte based on the supplied color which is exported as a css style

 */
    var c =  bw.colorRgbToHsl( bw.colorParse(color));

    var p = "bw-theme-";
    var thm = ["l5","l4","l3","l2","l1","d1","d2","d3","d4","d5"].map(function(x){return p+x;});
    var im = " !important";
    thm = thm.map(function(x,i){return [x,[["color", ((i<5)?"#000" : "#fff")+im ],["background-color",c + im] ]]; });

    /*
.w3-theme-light   {color:#000 !important; background-color:#f2f9fe !important}
.w3-theme-dark    {color:#fff !important; background-color:#074b83 !important}
.w3-theme-action  {color:#fff !important; background-color:#074b83 !important}

.w3-theme         {color:#fff !important; background-color:#2196f3 !important}
.w3-text-theme    {color:#2196f3 !important}
.w3-border-theme  {border-color:#2196f3 !important}

.w3-hover-theme:hover {color:#fff !important; background-color:#2196f3 !important}
.w3-hover-text-theme:hover {color:#2196f3 !important}
.w3-hover-border-theme:hover {border-color:#2196f3 !important}
*/
    return thm;

};
// =============================================================================================
bw.bwSimpleStyles = function(appendToHead, options) {
/** 
bw.bwSimpleStyles(appendToHead,options)

bitwrench simpleStyles is the function which writes loads 
write a quick grid style sheet for quick n dirty layout.  See docs for examples.

<h1 class='bw-h1'>Title for my section</h1>
<p>This section contains some interesting data and topics</p>
<div class="bw-row">  <!-- defines a row using bw css classes -->
<div class="bw-col3">column 1 content</div><div class="bw-col3">column 2 content</div><div class="bw-col3">column 3 content</div><div class="bw-col3">column 4 content</div>
</div>
<div>

    appendToHead  ==> if true, attempts to append to HTML <head> (only writes if not already present)
    options: {
        "basics" : "load"  // if set to "load will load some global constants for html, body, font-family", set to false to leave these unchanged.
        "exportCSS": false // if true will wrap the output css in "script" tags.  
        "id" : "bw-default-styles" // id assigned to the script tag, used for preventing multiple loading
    }

 */
    var s ="\n", m="";//padding-left:1%; padding-right:1%;";
    var _r = bw.fixNum;
    var dopts = {
        "globals"       : false,
        "id"           : "bw-default-styles",
        "exportCSS"    : false

    };

    dopts = optsCopy(dopts,options);

    var defContainer     = "{height: 100%;  width: 94%;  margin: 0 auto;  padding-left: 2%; padding-right:2%; left: 0;  top: 1%;}\n";
    var defFontSerif     = "{font-family: Times New Roman, Times, serif;}\n";
    var defFontSansSerif = "{font-family: Arial, Helvetica, sans-serif }\n";
    

    if (dopts["globals"] == "load") {
        s+= "\nhtml,body "+ defContainer;
        s+= "*"+defFontSansSerif;
    }

    s+= ".bw-def-page-setup" + defContainer;
    s+= ".bw-font-serif"     + defFontSerif;
    s+= ".bw-font-sans-serif"+ defFontSansSerif;

    s+= ([1,2,3,4,5,6].map(function(x){return ".bw-h"+x+"{ font-size: "+_r(3.2*Math.pow(.85,x+1))+"rem;}";}).join("\n"))+"\n";

    //text handling
    s+= ".bw-left       { text-align: left;                            }\n";
    s+= ".bw-right      { text-align: right;                           }\n";
    s+= ".bw-center     { text-align: center; margin: 0 auto;          }\n";
    s+= ".bw-justify    { text-align: justify;                         }\n";
    s+= ".bw-code       { font-family:monospace; white-space:pre-wrap; }\n";
    s+= ".bw-pad1       { padding-left: 1%; padding-right: 1%;         }\n";
    
    //tables
    s+= ".bw-table-stripe    tr:nth-child(even){  background-color: #f0f0f0}\n";  // striped rows
    s+= ".bw-table-col0-bold tr td:first-child {   font-weight: 700;}\n";         // make first col bold
    s+= ".bw-table-compact   { border-collapse: collapse; border-spacing: 0;}\n";
    s+= ".bw-table-sort-upa::after { content: \"\\2191\"; }\n";  // table sort arrow up (when visible arrows chosen)
    s+= ".bw-table-sort-dna::after { content: \"\\2193\"; }\n";  // table sort arrow dn (when visible arrows chosen)
    s+= ".bw-table-sort-xxa::after { content: \"\\00a0\"; }\n";  // table sort space  (when visible arrows chosen)

    //tabs
    s+= ".bw-tab-item-list { padding:0;}\n";
    s+= ".bw-tab           { padding-top:1%; padding-left: 1%; padding-right: 1%; padding-bottom: 20px;  margin-bottom: 2%; display:inline; position:relative; border-top-right-radius: 7px; border-top-left-radius: 7px;}\n";
    s+= ".bw-tab-active    { background-color : #eee; font-weight:700;}\n";
    s+= ".bw-tab:hover     { cursor: pointer;  font-weight: 700;/* font-weight: 700; border: 1px  solid #bbb; */}\n";
    s+= ".bw-tab-content   { background-color : #eee;  display: none; }\n";
    s+= ".bw-tab-content, .bw-tab-active       {background-color: #ddd}\n";

    //grid
    s+= ".bw-container  { margin: 0 auto;  }\n";
    s+= ".bw-row        { width: 100%; display: block;  }\n";
    s+= ".bw-row [class^=\"bw-col\"] {  float: left;}\n";
    s+= [1,2,3,4,5,6,7,8,9,10,11,12].map(function(x){return ".bw-col-"+x+" {width:"+ (_r(x*100/12))+"%;"+m+" }";}).join("\n");
    s+= "\n";
    s+= ".bw-row::after { content: \"\";   display: table; clear: both;}\n";
    s+= ".bw-box-1 {padding-top: 10px; padding-bottom: 10px; border-radius: 8px;}\n";
    
    //misc element controls
    s+= ".bw-hide   { display: none;}\n";
    s+= ".bw-show   { display: block;}\n";

    //responsive screen
    s+= "@media only screen and (min-width: 540px) {  .bw-container {    width: 94%;  }}\n";
    s+= "@media only screen and (min-width: 720px) {  .bw-container {    width: 90%;  }}\n";
    s+= "@media only screen and (min-width: 960px) {  .bw-container {    width: 86%;  }}\n";
    s+= "\n";
    
    if (bw.isNodeJS() == false) {
        var h  = document.getElementsByTagName("head")[0];
        var el = document.createElement("style");
        el.id = dopts["id"];
        el.textContent = s;

        if (appendToHead && (document.getElementById(dopts["id"]) == null))  // only append once
            h.appendChild(el);
    }
    if (dopts["exportCSS"])
        s = bw.buildHTMLObjString(["style",{"id":dopts["id"]},"\n/**\n bitwrench basic css styles\n version: "+bw.version()["version"]+"\n */"+s]);
    return s;
};


bw.bwSimpleThemes = function (d,appendToHead) {
/** 
bw.bwSimpleThemes() selects simple (and I do mean simple) HTML themes for some basic elements.
if d is an number it selects the built-in theme by index (see docs) else if d is a dictionary the elements
in d will be converted to a CSS style.

output is a CSS style.  if appendToHead is true or omitted then the theme is appended to the head element.
 */
    var s ="",xs={}, i;
    var def = [  // default styles
    { // dark theme
        "*"  : "background-color: #333; color: #ddd; font-family: sans-serif; box-sizing:border-box;",
        "body" : "margin-top:1%;",
        "th"                       : "background-color: #555",
        "tbody tr:nth-child(even)" : "background-color: #f0f0f0",
        "table, td, th"            : "border-collapse: collapse; border:1px solid #ddd; ",
        "td,th"                    : "padding:4px; ",
        "div,body,button,table,input" : "border-radius: 5px"
        //"div" : "padding-left:2%; padding-right:2%; padding-top:1%;padding-bottom:1%;"   
    },
    {// light theme
        "*": "background-color: #f8f8f8; color: #111; font-family: sans-serif; box-sizing:border-box;",
        "body" : "margin-top:1%;",
        "th"                       : "background-color: #ddd",
        "tbody  tr:nth-child(even)": "background-color: #ddd",
        "table, td, th"            : "border-collapse: collapse; border:1px solid #111; ",
        "td,th"                    : "padding:4px; ",
        "div,body,button,table,input" : "border-radius: 7px;"
        //"div" : "padding-left:2%; padding-right:2%; padding-top:1%;padding-bottom:1%;"   

    }
    ];

    xs = bw.choice(_to(d),{
            "object" : d,
            "number" : ((d>=0) && (d<def.length))?def[d]:def[0] 
        },def[0]);


    for (i in xs) {
        s+= i + " " +"{"+xs[i]+"}\n";
    }
    if (appendToHead != false) {
        var hs = document.getElementById("bw-simple-theme-styles");
        if (hs == null) {// first time
            var h  = document.getElementsByTagName("head")[0];
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
    if (bw.typeOf(item)=="string")
        item = document.getElementById(item);

    if (bw.typeOf(item).substr(0,4) != "html")
       return false;  //unable to set tab content

    var index=0;
    var cols = item.parentElement.getElementsByTagName("li");
    //update which tab selected
    for (i=0; i< cols.length; i++) {
        if (cols[i] == item) { // selected tab logic
            index = i;
            bw.markElement(cols[i],"bw-tab-active","bw-tab-active");
        }
        else { // unselected tab logic
            bw.markElement(cols[i],"bw-tab-active","");
        }
    }
    //console.log(item);
    var tcols = item.parentNode.parentNode.getElementsByClassName("bw-tab-content-list")[0].getElementsByClassName("bw-tab-content");
    if (tcols.length <= 0)
        return false;

    target = (bw.typeOf(target) == "undefined") ? tcols[index] : target;  //we will infer it by the tab index
    target = (bw.typeOf(target) == "string"   ) ? document.getElementById(target) : target;  // we hav an ID so we'll use that
    var i;
    for (i=0; i < tcols.length; i++) {
        if (tcols[i] == target) 
            bw.markElement(tcols[i],"bw-show","bw-show"); //tcols[i].style.display = "block";
        else
            bw.markElement(tcols[i],"bw-show","");//tcols[i].style.display = "none";  
    }
    return true;  
};

// =============================================================================================

bw.markElement = function(el, key, replace) {
/** 
bw.markElement(el,value) 
returns whether a specific DOM element class name (key) is set on the supplied element.  

If replace is supplied then the class name (key) is replaced or added if it doesn't exist.
    note that if key is not found but a replace is supplied the return-value is still false as the supplied key was not found even though a replace value is not present

el must be a valid dom ID string (e.g. "myID") or valid DOM element (e.g. document.getElementById("myId"))

markElement is used by bw UI toggles
 */
    var r = false;
    if (bw.typeOf(el) == "string")
        el=document.getElementById(el);

    try {
        var c = el.className.split(/[ ]+/);
        var i = c.indexOf(key);

        if (i >= 0) // found key
            r = true;
        
        
        if ((bw.typeOf(replace) == "string") && (c.indexOf(replace)== -1)){
            if (i == -1) //key not found
                c.push(replace);
            else {
                if (replace.length > 0)
                   c[i]=replace;
                else
                   c.splice(i,1);
            }
            el.className  = c.join(" ").trim();
            r = true;
            // element.className = element.className.replace(/\bmystyle\b/g, "");
        }
    }
    catch(e) { bw.log(e);}

    return r;
};

// =============================================================================================
bw.version  = function() {
/** 
bw.version()
bitwrench runtime version & license info.
debateable how useful this is.. :)
 */
    var v = {
        "version"   : "1.1.39", 
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
        var els = document.getElementsByTagName("script"); // array of script elements
        var i,a,b;
        for (i in els) {
            try {
               // bw.log(_args[i]);
                var el = els[i]; //
                if (el.hasOwnProperty("src") != false)
                    break; 

                var s = String(el.getAttribute("src"));
                var f = "bitwrench.js";

                if (s.toLowerCase().substring(s.length-f.length,s.length) == f.toLowerCase()) {
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
var loadStyleBasics =  bw.typeAssign(bw.bwargs["bw-load-style-basics"],"string",bw.bwargs["bw-load-style-basics"],"load");
bw.bwSimpleStyles(loadStyles,{"basics":loadStyleBasics}); // append to head the bitwrench css styles by default

bw.funcRegister(bw.log,"bw_log");  // this is globally registered for debugging purposes, it will never get called though unless programmer does this explicitly.

})( ((typeof bw) == "undefined") ? this["bw"]={} : bw);
