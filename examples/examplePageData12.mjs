import bw from '../bitwrench_ESM.js'; //only because we are referencing some bitwrench fns in our page data

export const  htmlData = {
c: //for more on the format, see docs github.com/deftio/bitwrench
 [

   ["h1" ,"Bitwrench Test Area with ESM modules & ESM content"  ],
   ["div" ,"styling with pico.css"  ],
   "bitwrench version: "+bw.version().version +"<br><br>",
   ["div" ,"This page has HTML content which is entirely written as Javascript objects (with support for functions) by content using "+bw.html(["a",{href:"https://github.com/deftio/bitwrench"},"bitwrench.js"])+". Bitwrench has built-in grids, tables,headings, and other quick-n-dirty html prototyping tasks.  "],
   "<hr>",
  ["h2","Lorem Ipsum Generator"],
  "Good for testing simple layout ideas.<br><br>",
  ["div",{},bw.loremIpsum(230)],
  "<hr>",
  ["h2",{},"Sample Content with 3 Columns"],
    ["div",{"class":"bw-row"}, 
      [ 
      ["div",{"class":"bw-col-4 bw-left "},"<h3>Left justified</h3>"+bw.loremIpsum(95)], //mix text and html freely
      ["div",{"class":"bw-col-4 bw-center bw-pad1"},"<h3>Centered</h3>"+bw.loremIpsum(95,3)], 
      ["div",{"class":"bw-col-4 bw-right "},"<h3>Right justified</h3>"+bw.loremIpsum(95,2)],
      ],
    ], 
  "<br><hr>",
  ["h2", {}, "Example Sortable Table"],
  bw.htmlTable( // json to table (note table data can be  functions as well)
    [
      ["Name","Age", "Prof", "Fav Color"], // just an 2D array 
      ["Sue", 34, "Engineer", {a:{style:"color:red"},c:"red"}], // inline json-html objects
      ["Bob" ,35, "Teacher",  {a:{style:"color:green"},c:"green"}],
      ["Vito",23, "Mechanic", {a:{style:"color:blue",onclick:"alert('blue!')"},c:"blue"}],
      ["Hank",73, "Retired",  {a:{style:"color:purple"},c:"purple"}]
    ],{sortable:true}),
   "<br><hr>",
   ["h2",{},"Sample Buttons"],
   "These buttons have function handlers attached.<br><br>",
   ["div",{"class":"grid"},[
      ["button",{onclick:"alert('button pressed!')"},"Alert Button"], // staight js
      ["button",{onclick:(e)=>{e.innerHTML=(new Date()).toLocaleTimeString()}},"Time Button"], // bitwrench maps and registers event functions
      ]
    ],
    "<hr>",
    ["h2","Built in Headings"],
    [1,2,3,4,5,6].map( function(x){return bw.html(["h"+x,"Heading "+x])}).join(""), // Headings
    "<br><hr>",
    ["h2","Grid System (responsive)"],
    "Grid system (just uses css so can use either bitwrench.js loader or just bitwrench.css with no javascript.  Use -fluid for responsive<br><br>",
    ["style",{},"\n.boxEv {background-color: #aaa; height: 30px; border-radius:5px; border:1px solid black;}\n.boxOd {background-color: #ddd; height:30px; border-radius:5px;border:1px solid black;;}\n"], // some styles (note bw has CSS generation shown in another example)
    ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-1 boxEv"},c:"bw-col-1"},{a:{class:"bw-col-1 boxOd"},c:"bw-col-1"},{a:{class:"bw-col-1 boxEv"},c:"bw-col-1"},{a:{class:"bw-col-1 boxOd"},c:"bw-col-1"},{a:{class:"bw-col-1 boxEv"},c:"bw-col-1"},{a:{class:"bw-col-1 boxOd"},c:"bw-col-1"},{a:{class:"bw-col-1 boxEv"},c:"bw-col-1"},{a:{class:"bw-col-1 boxOd"},c:"bw-col-1"},{a:{class:"bw-col-1 boxEv"},c:"bw-col-1"},{a:{class:"bw-col-1 boxOd"},c:"bw-col-1"},{a:{class:"bw-col-1 boxEv"},c:"bw-col-1"},{a:{class:"bw-col-1 boxOd"},c:"bw-col-1"}]],
    ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-2 boxEv"},c:"bw-col-2"},{a:{class:"bw-col-2 boxOd"},c:"bw-col-2"},{a:{class:"bw-col-2 boxEv"},c:"bw-col-2"},{a:{class:"bw-col-2 boxOd"},c:"bw-col-2"},{a:{class:"bw-col-2 boxEv"},c:"bw-col-2"},{a:{class:"bw-col-2 boxOd"},c:"bw-col-2"}]],
    ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-3 boxEv"},c:"bw-col-3"},{a:{class:"bw-col-3 boxOd"},c:"bw-col-3"},{a:{class:"bw-col-3 boxEv"},c:"bw-col-3"},{a:{class:"bw-col-3 boxOd"},c:"bw-col-3"}]],
    ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-4 boxEv"},c:"bw-col-4"},{a:{class:"bw-col-4 boxOd"},c:"bw-col-4"},{a:{class:"bw-col-4 boxEv"},c:"bw-col-4"}]],
    ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-5 boxEv"},c:"bw-col-5"},{a:{class:"bw-col-7 boxOd"},c:"bw-col-7"}]],
    ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-6 boxEv"},c:"bw-col-6"},{a:{class:"bw-col-6 boxOd"},c:"bw-col-6"}]],
    ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-7 boxEv"},c:"bw-col-7"},{a:{class:"bw-col-5 boxOd"},c:"bw-col-5"}]],
    ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-8 boxEv"},c:"bw-col-8"},{a:{class:"bw-col-4 boxOd"},c:"bw-col-4"}]],
    ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-9 boxEv"},c:"bw-col-9"},{a:{class:"bw-col-3 boxOd"},c:"bw-col-3"}]],
    ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-10 boxEv"},c:"bw-col-10"},{a:{class:"bw-col-2 boxOd"},c:"bw-col-2"}]],
    ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-11 boxEv"},c:"bw-col-11"},{a:{class:"bw-col-1 boxOd"},c:"bw-col-1"}]],
    ["div",{class:"bw-row bw-center"},[{a:{class:"bw-col-12 boxEv"},c:"bw-col-12"}]],

    "<br><hr>",
    ["h2",{},"Simple Sign"],
    ["div",{style:"padding:10%; border:1px solid black;"},bw.htmlSign("This is a big sign!")],
    "<br><hr>",
["h2",{},"Tabbed Content"],
     bw.htmlTabs([
      [bw.html({t:"span",a:{"style" : "margin:12px"},c:"Tab1"}),bw.loremIpsum(900)],
      [bw.html({t:"span",a:{"style" : "margin:12px"},c:"Tab2"}),bw.loremIpsum(900,20)],
      [bw.html({t:"span",a:{"style" : "margin:12px"},c:"Tab3"}),bw.loremIpsum(900,50)]],{tab_atr:{style:""}}) ,
   "<br>",
 ]
}
