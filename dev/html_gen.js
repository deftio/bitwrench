bw.isnu  = function(x) {return ((_to(x) == "undefined") || (_to(x) == "null"))} // is x null or undefined? 

bw.keynu = function(x) {
    var i;
    switch (_to(x)) {
        case "null":
        case "undefined":
        case "regex":
            return null;
        case "object":
            for (i in x)
                if (bw.isnu(x[i]))
                    return null;
            break;
        case "array":
            for (i =0; i < x.length; i++)
                if (bw.isnu(x[i])
                    return null;
        default:
            return x; //boolean, number, string
    }
}
//===
/*

number          ==> string_content
Date()          ==> string_content
string          ==> string_content


array [0..5]    ==> node
object          ==> node     

null            ==> null
undefined       ==> undefined
*/
bw.HTMLNorm = function(x) {

    function bw.HTMLNode () {this.t="div"; this.a={}; this.c=""; this.o={}; this.s={};}
    //function bwError  (v,x) {this.value=v; this.msg = (typeof x == "undefined") ? "error" : x;}
    
    var i,n = new bwHTMLNode(); // default html dict format
    var m = "";
    switch (_to(x)) {
        case "null" :
        case "undefined" :
            //n = new bwError(x,"HTML Node error : "+_to(x));
            n="";
            bw.logd("Error: HTMLNorm type null or undefined");
            break;
        case "object":
            [["tag","t"],["attrib","a"],["content","c"],["options","o"]].forEach(function(z){ n[z[1]]= z[0] in x ? x[z[0]] : n[z[1]];});
            for (i in n) {  // we only copy those fields we care about..
                n[i] = (i in x) ? x[i] : n[i]; // need to handle complicated types: t:"", a:{}, c:"" | []
                if (bw.isnu(n[i])) {
                    n = ""; // force entire object to be null or undefined
                    bw.logd("Error HTMLNorm : bad object");
                    break;
                }
            }
            break;
        case "array":
            var idx = [[],["c"], ["t","c"], ["t","a","c"],["t","a","c","o"],["t","a","c","o","s"]];
            var m = (x.length > 5) ? 5 : x.length;
            for (i=0; i< m; i++)   { 
                console.log(idx[m][i] + ":" + x[i]);
                n[idx[m][i]] = x[i];
            }
            for (i in n)
                if (bw.isnu(n[i])) {
                    n = ""
                    bw.logd("Error HTMLNorm : bad array");
                    break;
                }

            break;
        case "function":  
            n = bw.html_fc2(x(),opts); // evaluate and convert...
            n = _to(n)=="function" ? new bwError(n.toString(),"HTML Node error: function returned a function");
            break;
        default: // string, number, Date, bool, Regex  ==> will be come just plain rendered content later
            n =x.toString();
    }
    return n; 
}

//assumes proper node form
bw.htmlNodeRender(x) {
    s = bw.toa(x,"string",x,)
    return s;
}

bw.html_fcNew1= function(x) {
    var i,n = { t: "div", a: {}, c: "", o: {}}; // default html dict format
    var m = "";
    switch (_to(x)) {
        case "null" :
        case "undefined" :
            n = x;
            break;
        case "object":
            [["tag","t"],["attrib","a"],["content","c"],["options","o"]].forEach(function(z){ n[z[1]]= z[0] in x ? x[z[0]] : n[z[1]];});
            for (i in n) {  // we only copy those fields we care about..
                n[i] = (i in x) ? x[i] : n[i]; // need to handle complicated types: t:"", a:{}, c:"" | []
                if (bw.isnu(n[i])) {
                    n = null; // force entire object to be null or undefined
                    m = "HTML gen err: bad object";
                    break;
                }
            }
            break;
        case "array":
            var idx = [[],["c"], ["t","c"], ["t","a","c"],["t","a","c","o"],["t","a","c","o","s"]];
            var m = (x.length > 5) ? 5 : x.length;
            for (i=0; i< m; i++)   { 
                console.log(idx[m][i] + ":" + x[i]);
                n[idx[m][i]] = x[i];
            }
            for (i in n)
                if (bw.isnu(n[i])) {
                    n = null;
                    m = "HTML gen err: bad array"
                    break;
                }
            break;
        case "function":  
            n = bw.html_fc2(x(),opts); // evaluate and convert...
            break;
        default: // string, number, Date, bool, Regex 
            n.c =x.toString();
    }
    return n; 
}

bw.html_fcOld = function(x) {
    var i,n  = { t: "div", a: {}, c: "", o: {}, s: { level: 0, nodes: 0, html:"", isNode: true}}; // default html dict format

    switch (_to(x)) {
        case "null" :
        case "undefined" :

            break;
        case "object":
            [["tag","t"],["attrib","a"],["content","c"],["options","o"],["state","s"]].forEach(function(z){ n[z[1]]= z[0] in x ? x[z[0]] : n[z[1]];});
            for (i in n)  // we only copy those fields we care about..
                n[i] = (i in x) ? x[i] : n[i]; 
            break;
        case "array":
            var idx = [[],["c"], ["t","c"], ["t","a","c"],["t","a","c","o"],["t","a","c","o","s"]];
            var m = (x.length > 5) ? 5 : x.length;
            for (i=0; i< m; i++)   { 
                console.log(idx[m][i] + ":" + x[i]);
                n[idx[m][i]] = x[i];
            }
            break;
        case "function":  
            n = bw.html_fc(x(),opts); // evaluate and convert...
            break;
        default: // string, number, Date  
            n.c = x.toString();
            n.s.isNode = false;
    }
    return n;
}

//====================================


bw.htmlFromDict = function(htmlDict, opts) {
/**
    must be of form 
    t ==> tag
    a ==> attrib
    c ==> content
    o ==> options
    s ==> state

    htmldict
    { 
        tag: "tagValue",
        attrib : {},
        content : [],    // each member must be: string or htmlDict or null.  other values cast to string.
        options : {},
        state : {}   
     }
*/

}

