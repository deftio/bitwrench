/**
    "universal" js module definition borrowed from 
    https://github.com/umdjs/umd/blob/master/templates/returnExports.js


 */
"use strict";

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        console.log("node...");
        module.exports = factory();
    } else {
     //   console.log("browser..",root, typeof root);
        // Browser globals (root is window)
        var module = factory();
        root[module["exportName"]] = module;
  }

}(typeof self !== 'undefined' ? self : this, function () {

	"use strict";
    
	var _f 	= {};
	
    _f.exportName = "myModuleName"; // visible name of module


    return _f;

}));
