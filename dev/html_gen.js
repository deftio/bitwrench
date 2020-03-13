
var _s = function(n,c){return Array(n+1).join(c);}

//assumes proper node form
bw.htmlNodeRender(x) {
    s = bw.toa(x,"string",x,)
    return s;
}

//====================================


bw.htmlFromDict = function(htmlDict, opts) {
/**
    must be of form 
    t ==> tag     (string)
    a ==> attrib  {}   
    c ==> content []   content can be string | node  (other values converted to string)  
    o ==> options {}
    
    htmldict
    { 
        tag: "tagValue",
        attrib : {},
        content : [],    // each member must be: string or htmlDict or null.  other values cast to string.
        options : {},
    
     }
*/

    var html = "";
    var ddict = {
        t:  "div",
        a:  {},   // if an attribute is null then only key is listed e.g.  {a:"foo", b:null, c:0} ==> a="foo" b  c=0
        c:  [],
        o:  { tagClose : "auto"  // can be "auto", false (e.g. <br>), "inline" (e.g. <tag ... />), true (e.g. <tag ...>...</tag>)

            },
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
    var _s = function(n,c){return Array(n+1).join(c);}
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

bw.htmlExt  = function(data, opts) {
    var dopts = {
        tagClose: "auto",
        contentHTMLSafe : "false",  // convert content node chars to htmlSafe equivalents e.g. " " ==> &nbsp;

        pretty: "true",
        indStr : "  ",  // only used in pretty set to true. can be "\t" etc
        indFixed: "",   // 

        maxdepthAllowed : 50

    };
    dopts = optsCopy(dopts,opts);
    var state = {
        cdepth   : 0, // curdepth
        cbreadth : 0, // curbreadth (e.g. content[3])
        maxdepth : 0,
        ncount   : 0, // num nodes rendered
        errors   : [] // trapped erors
    }
    var ret = ["",state];
    var htmlRenderNode = function(d,o,s) { // assumes
        var h="", n = htmlNorm(d,o,s) // get it in dict form

    }
     {
        var hd = (function(){return {t:"div",a:{},c:[],{o:tagClose:"auto"}}})();

        //emit tagOpen  
        // indFixed + ?pretty|indstr + <tag + atr() + tagselfclose>
        // for i=0.. hd.c.length
        // if c[i] == object | function : 
        //      cbreadth++
        //      convert
        // else 
        // (emit) indFixed + ?pretty|indstr c[i].toString()

    }
    return ret;
}

//=======================================
/*
 state has levels, node, nodecount info
*/
bw.HTMLNorm = function(x,state) {

    function bwHTMLNode () {this.t="div"; this.a={}; this.c=[]; this.o={};}
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
//**********************************************************
//**********************************************************
bw.htmlMod20200215 = function (d,options) {
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
    dopts = optsCopy(dopts,options);
    
    var outFn = function(s,opts) {
        var w  =  Array(opts["indent"]).join(opts["indentStr"]);
        var we =  Array(opts["indent"]-1).join(opts["indentStr"]);
        return opts["pretty"] ? "\n"+w+ s + "\n" +we: s;
    };


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
