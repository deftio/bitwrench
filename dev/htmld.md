

dataStack = []


start:

node = bw.HtmlNode(data, {atomic:"raw"})


if (node == "atomic")
	html += indent +  node 
else
	switch (node.t, node.c)

	case node.t isvoidTag():

	case node.c isEmpty

	default
		html += indent + tag



//=================
```html
		<div foo="bar">                             ["<"+n.t, ">", "</"+n.t+">"]          
			content
		</div>

		<meta foo="bar" />							["<"+n.t, "/>", ""]

		<link href="./place/to/get" />				["<"+n.t, "/>", ""]

		<div>										["<"+n.t, ">", "</"+n.t+">"]
			<div id="123">							["<"+n.t, ">", "</"+n.t+">"]
				this is the content
			</div>
			<div id="123">							["<"+n.t, ">", "</"+n.t+">"]
				this is the content2
			</div>
		</div>

		<div>
			<div id="123">this is the content</div>
		</div>

//=============


//if f() ==> resolve to "" | node

var n= bw.HTMLNode(data);

if _to(n.node) == "function" {
	n = bw.htmlNode(n.node());
	n = _toa(n.ntype,["BW_HTMLNode","string"],n,""); // if its still not a content we just need to punt it.
}
	
var h = [];

if n.ntype == "string"
	h.push(n.node.toString())
else
	crend = function(c){ return c!= "array"}

	h = ["<",n.tag, a{}];

	auto:
		if node.isVoidTag
			 // <tag a{} /> # content is not rendered for void tags  # ["<",n.t , a{}, "/>" ]
			 h.push( "/>");
		break;	

	all:
	none:
		//<tag a{}> .... </tag>  # h=["<",n.t , a{}, crend() , "</", n.t, ">"]
		h.push(">"); 
		for (i in c)
			h.push(htmlEmit(c[i]).html)
		if ( opts.tagClose == "all" )
			h.push( "</",n.t,">");


state.nodeCount++
html = h.join("");
```
		
bw.htmlRender = function (data,opts,state)  {
	dopts= {

	}

	dopts = optsCopy(dopts,opts);

}
{
	c: "foo" ==>  
}

bw.htmlNode(data, opts) 
{
	opts {
		convertAtomicToNode : true | false,   // if true, converts atomic to a span element e.g.  "foo" ==> {t:"span",c:["foo"]}
	}

	return {
		node:  HTMLNode | string | function
		isHTMLVoidTag : true | false,   // returns true if tag is "meta" or "br" etc
		isAtomic      : true | false,   // returns true if input data was not a proper node.  
		error         : false | string  

	}	
}

//===========================

// ===================================================================================
bw.htmlEmit = function(htmlData, opts, state) {
/**


    //global options:
    pretty        (true | false) (default: true)  attempts to make HTML pretty (human readable) if false it will be as compact as possible
    pretty_space  (if pretty == true) (default: "  ") this is the stirng used as the indent string but one could make it "\t" or " " etc.
    pretty_indent (if pretty == true) a fixed indent to provide to every line of html



    tagClose : ("auto" | closeempty | all | none) whether to close a tag.  default is "auto"
        "auto"       : will apply smart rules to tag closing. e.g. html void elements such as br are not closed 
        "closeempty" : all void elements are now self closed  (e.g. are self closed ==> <meta /> or <br />)
        "all"        : tags are forced closed with </tagname>  ==>  can be useful for xml type generation
        "none"       : tags are not closed at all

    all options can be overridden via local node

*/
    var html = "",stats={};
    var dopts = {
        pretty : true,
        pretty_space: "  ",
        pretty_indent: "", //fixed indent when pretty pass as "    " etc
        htmlEscContent : false // change spaces, /n /t to html equivalents
    }
    dopts = optsCopy(dopts,opts);


    state = bw.toa(state,"object",state,  {
        levelCount : 0,
        levelMax   : 0,
        nodeCount  : 0
    });

    
    var _s   = function(n){return dopts.pretty_indent+ Array(n+1).join(dopts.pretty_space);} // generate indents for pretty

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

    var _cls = function(n) { // takes BW HTML node 
        var r=["","</"+n.t+">"] // r[0] is whether to include closing slash on start tag, r[1] is whether to include closing tag
        var ce = _to(n.c)!="array" ? true : ((n.c.length ==0) ? true : false);
        // o.tagClose==auto         && _isv(t)==true   ==>  ,
        //                             _isv(t)==false  ==>  , </t>      
        // o.tagClose==closeEmpty   && _isv(t)==true   ==> /,
        //                             _isv(t)==false  ==>  , </t>

        // o.tagClose==none                            ==>  ,                  
        // o.tagClose==all                             ==>  , </t>
        r = bw.choice(n.o.tagClose,
            {
                "auto" :       (function(){return (n.isVoidTag) ? ["",""]  : ["","</"+n.t+">"];}) (),
                "closeEmpty" : (function(){return (n.isVoidTag) ? ["/",""] : ["","</"+n.t+">"];}) (),
                "none" : ["",""]
            },r);
        console.log("cls:",r);
        return r;
    }
    
    var ind_s = dopts.pretty ? _s(state.levelCount) : ""; // not &nbsp; ==> we're not trying to render this space just make it pretty for inspection
    var ind_c = dopts.pretty ? _s(state.levelCount+1) : ""; // not &nbsp; ==> we're not trying to render this space just make it pretty for inspection
    var ind_e = dopts.pretty ? "\n" : "";
    

    try {
        var i,atrk=[],_a=[],k,v, nx = bw.htmlNode(htmlData);
        switch (nx.ntype) {
            case "BW_HTMLNode":
            {
                var node = nx.node;
                for (i in node.a)
                    if (node.a.hasOwnProperty(i)) atrk.push(i);
                atrk = atrk.sort(bw.naturalCompare);
                for (i=0; i<atrk.length; i++) {
                    k=atrk[i]; v=node.a[k];
                    console.log(k,v)
                    _a.push(_atr(k,v,node.o));
                }
                _a = _a.join(" ");
                _a = ((_a.length>0) ? " ": "") + _a;
                console.log( _a, node,nx, ind_s,ind_c,ind_e);
                if ("atomic" == nx[1]) {
                    html += ind_c+node.c[0] + ind_e;            
                }
                else {
                    //console.log(state.levelCount, state.nodeCount,_a)
                    html += ind_s + "<" +node.t + _a+ _cls(node)[0]+">";
                    html += node.c.map(function(x){
                            state.levelCount++;
                            state.levelMax += state.levelMax < state.levelCount ? 1 : 0;
                            var s = bw.htmlEmit(x,dopts,state).html;
                            state.levelCount--;
                            return s;
                        }                
                        ).join((dopts.pretty?"\n":""));
                    html += ind_e + _cls(node)[1] +(dopts.pretty?"\n":"");
                }
            }
            break;
            case "function" :
                var z = bw.htmlEmit(nx.node());
                html += z.html;
            break;
            default :
                html += node.node;
        }
        state.nodeCount ++;
        //console.log(html);
    }
    catch(e) {
        console.log(htmlData,node,e);
        bw.logd(e);
    }

    return {html:html, stats: state}
}