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
    t ==> tag     (string)
    a ==> attrib  {}   
    c ==> content []   content can be string | node  (other values converted to string)  
    o ==> options {}
    s ==> state   {}

    htmldict
    { 
        tag: "tagValue",
        attrib : {},
        content : [],    // each member must be: string or htmlDict or null.  other values cast to string.
        options : {},
        state : {}   
     }
*/

    var html = "";
    var ddict = {
        t:  "div",
        a:  {},   // if an attribute is null then only key is listed e.g.  {a:"foo", b:null, c:0} ==> a="foo" b  c=0
        c:  [],
        o:  {
                pretty : true,
                pretty_space: " ",
                pretty_indent: "", //fixed indent when pretty pass as "    " etc
                tagClose : "auto"  // can be "auto", false (e.g. <br>), "inline" (e.g. <tag ... />), true (e.g. <tag ...>...</tag>)

            },
        s:  {
                levelCount : 0,
                nodeCount  : 0
            }
    }
    var _atr = function(k,v,o){  // to do handle "smart" attributes ==> class : ["class1", "class2"]  ==> style : bw.makeCSS()
        var val=v,ok = _to(o.overide)=="undefined" ? k : ok; 
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
    ind_s = ddict.o.pretty ? Array(ddict.s.level * ddict.o.pretty_indent ).join(ddict.o.pretty_space) : ""; // not &nbsp; ==> we're not trying to render this space just make it pretty for inspection
    ind_c = ddict.o.pretty ? Array((ddict.s.level+1) * ddict.o.pretty_indent ).join(ddict.o.pretty_space) : ""; // not &nbsp; ==> we're not trying to render this space just make it pretty for inspection
    ind_e = ddict.o.pretty ? "\n" : "";
    
    var _clsTag = function(t,c) {

    }
    try {
        var i,atrk=[],_a=[],k,v;
        for (i in ddict.a)
            if (ddict.hasOwnProperty(i)) atrk.push(i);
        atrk = atrk.sort(function(x)bw.naturalCompare);
        for (i=0; i<atrk.length; i++) {
            k=artk[i]; v=ddict[k];
            if (v=null) { _a.push(k); continue;}
            _a.push(_fatr(k,v));
        }
        _a = _a.join(" ");
        _a = ((_a.length>0) ? " ": "") + _a;

        html += ind_s + "<" +ddict.t + _a+">";
        html += ddict.c.map((function(x){
                var s = _to(x) == "object" ? bw.htmlFromDict(x) : x.toString();
                return ind_c+s;
            }                
            ).join((ddict.pretty?"\n":""));
        html += ind_e + "</" +ddict.t +">";

    }
    catch(e) {
        logd(e);
    }
}

//=====old=====
//==================================================
/**
    html_fc (html form convert) converts acceptable html contructs into html json dict form: 
    { t: <tag>, a: {attribs}, c: [content], o: {options}, s:{state}}
    
    does not operate on the t a c o s params --> just does the conversion
 */
/*
html gen using {input}
_typeOf(input)

 "object" 
    accepted keys below, other keys ignored
    t: String | Number | Date() ==> tag  function==> f().toString()
    a: {}  ==>  key : value ==>  num | str | Date | [] ==> [].join(dopts.a_join) 
    c: [] || String | Number | Date  ==> each_item : str | {html_dict} 
    o: {} ==> options (note inherit / copy)  => if not supplied uses previous levels options
    
    s: {} ==> state info (used internally) e.g. indent level, stats
    
    also accepts: "tag", "attrib", "content", "options", "state" as keys instead of t,a,c,o,s
    
    if any of t,a,c,o are a function it will be invoked immediatly w no params ==> t:myFunc ===> t:myFunc() <== 

    defaults:
        t ==> "div"
        a ==> {}
        c ==> []
        o ==> {}

        s ==> {level:0, nodes: 0}

"string" | "number" | Date() ==> {}
        t ==> "div"
        a ==> {}
        c ==> .toString()
        o ==> {}

        s ==> {}

"array" 
    [         ]   ==> {} // defaults to empty default object 
    [c        ]   ==> {}
    [t,c      ]   ==> {}
    [t,a,c    ]   ==> {}
    [t,a,c,o  ]   ==> {}
    [t,a,c,o,s]   ==> {}
    [ 6+      ]   ==> {} // uses, first 5 others ignored
    
    // this dict repreesnts the mapping
    {
    0 : { }
    1 : {c : 0},  
    2 : {t : 0, c : 1},
    3 : {t : 0, a : 1, c : 2}
    4 : {t : 0, a : 1, c : 3, o : 4}
    5 : {t : 0, a : 1, c : 3, o : 4, s : 5}
    }

    // this array contruct implements the above dict mapping more compactly
    var i,idx = [[],["c"], ["t","c"], ["t","a","c"],["t","a","c","o"],["t","a","c","o","s"]];
    for (i=0; i< x.length; i++) 
        hd[idx[x.length]][i] = x[i];
    
*/
/*
bw.html_fc = function(x) {
    var i,hd  = { t: "div", a: {}, c: "", o: {t_close: true}, s: { level: 0, nodes: 0, html:""}}; // default html dict format

    switch (_to(x)) {
        case "null" :
        case "undefined" :
            break;
        case "object":
            [["tag","t"],["attrib","a"],["content","c"],["options","o"],["state","s"]].forEach(function(z){ hd[z[1]]= z[0] in x ? x[z[0]] : hd[z[1]];});
            for (i in hd)  // we only copy those fields we care about..
                hd[i] = (i in x) ? x[i] : hd[i];  // need to handle fields differenty.. t : "", a : {}, c:"" | [],o :{} -- this is because we want to have proper defaults
            break;
        case "array":
            var idx = [[],["c"], ["t","c"], ["t","a","c"],["t","a","c","o"],["t","a","c","o","s"]];
            var m = (x.length > 5) ? 5 : x.length;
            for (i=0; i< m; i++)   { 
                console.log(idx[m][i] + ":" + x[i]);
                hd[idx[m][i]] = x[i];
            }
            break;
        case "function":  
            hd = bw.html_fc(x(),opts); // evaluate and convert...
            break;
        default: // string, number, Date  
            hd.c = x.toString();
    }
    return hd;
}
*/

bw.html_fc = function(x) {
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
            m = (x.length > 5) ? 5 : x.length;
            for (i=0; i< m; i++)   { 
                bw.logd(idx[m][i] + ":" + x[i]);
                n[idx[m][i]] = x[i];
            }
            for (i in n)
                if (bw.isnu(n[i])) {
                    n = null;
                    m = "HTML gen err: bad array";
                    break;
                }

            break;
        case "function":  
            var opts = {};
            n = bw.html_fc2(x(),opts); // evaluate and convert...
            break;
        default: // string, number, Date, bool, Regex 
            n.c =x.toString();
    }
    return n; 
};

bw.HTMLNorm = function(x) {

    function bwHTMLNode () {this.t="div"; this.a={}; this.c=""; this.o={};}
    function bwError  (v,x) {this.value=v; this.msg = typeof x == "undefined" ? "error" : x;}
    
    var i,n = new bwHTMLNode(); // default html dict format
    var m = "";
    switch (_to(x)) {
        case "null" :
        case "undefined" :
            n = new bwError(x,"HTML Node error : "+_to(x));
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
            m = (x.length > 5) ? 5 : x.length;
            for (i=0; i< m; i++)   { 
                //console.log(idx[m][i] + ":" + x[i]);
                n[idx[m][i]] = x[i];
            }
            for (i in n)
                if (bw.isnu(n[i])) {
                    n = null;
                    m = "HTML gen err: bad array";
                    break;
                }

            break;
        case "function":  
            var opts = {};
            n = bw.html_fc2(x(),opts); // evaluate and convert...
            n = _to(n)=="function" ? new bwError(n.toString(),"HTML Node error: function returned a function") : n;
            break;
        default: // string, number, Date, bool, Regex  ==> will be come just plain rendered content later
            n.c =x.toString();
    }
    return n; 
};
//==================================================
/**
    htmld -- html generator
    convert _accteptable_types_  ==> htmLJSON_dict


bw.htmld = function(htmlJSON, opts) {
    var dopts = {               // def options note t_ a_ c_ o_ are options applied to the t, a, c, or o local keys directly
        t_close   : "auto",     // "auto" | "false" | "true"  ==> "auto" doesn't close certain tag decl such as !DOCTYPE, <br>
        a_join    : ";",        // default join for attribute arrays 
        o_pretty  : false,      // makes nice html 
        o_indent  : 4,          // default indent when pretty printing
        o_verbose : false,      // returns object instead of html string ==> {html: <htmloutput string>, stats: dict{}, status: "success" | "warnings"}
        c_htmlesc : true        // true | false  ==> escape html safe chars, replace "\n" with <br> etc
    };
    

    dopts = optsCopy(dopts,opts);

    var  i, d, h="", ind_s, ind_e; // ind_s, ind_e control pretty printing

    h="";
    d = bw.html_fc(htmlJSON); // now in dict form with state vector
    for (i in d)
        if (_to(i) == "function")
            d[i] = d[i](d); 

    d.s["level"]++;
    
    d.t = d.t.toString();  
    d.a = (_to(d.a) == "object") ? d.a : {}; // must be dict.  
    d.c = (_to(d.c) == "array" ) ? d.c : (_to(d.c)=="object") ? html_fc(d.c) : d.c.toString(); 
    d.o = optsCopy(dopts,d.o);

    //now gen html...
    ind_s = d.o.o_pretty ? Array(d.s.level * d.o.o_indent ).join(" ") : ""; // not &nbsp; ==> we're not trying to render this space just make it pretty for inspection
    ind_e = d.o.o_pretty ? "\n" : "";
    
    h += ind_s+  "<" + d.t;
    for (i in d.a)
        h+= " "+i+"=\""+d.a[i]+"\"";
    h += ">"+ ind_e; 

    //content gen
    switch (_to(d.c)) {
        case "object":
            h += bw.htmld(d.c,dopts);
            break;
        case "array":
            h += d.c.map(function(x){ return bw.htmld(x,dopts);}).join("");
            break;
        default:
            h+= d.c; 
    }
    
    //closing tag
    h += ind_s + "</" + d.t + ">" + ind_e;
    d.s.html = h;
    return d;
}
*/