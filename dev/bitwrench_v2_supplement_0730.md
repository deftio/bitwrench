## `Bitwrench v2 Core Design`

### `Static Page generation : v1 legacy thinking`

`In bw1 we could assemble {taco} objects into html directly, including nested objects.  This could be used to generate reusable components or full pages.`

`bw.htm({taco} ⇒ valid html`

`The bw.html() renderer did not distinguish between between simple components or full pages it just assembled and built html.`

`Some helper functions also followed this paradigm.`

`bw.htmlTable(....) ⇒ HTML table (but not a {taco} component`

`One could intermix these freely because the target was always html.`

`{ t: “div”, c: [“some text”, {taco}, bw.htmlTable( …) }`

`Since c: [] blocks are either strings, arrays or {taco} blocks the html generators (bw.htmlTable, bw.makeHtmlTabs() etc) could output strings which worked with direct html generation paradigm.`

`Then bw.html( {taco} || string } would always return valid html.`

`In bitwrench v1, {t:”div”,a:{“onclick”: function(){}}, c:[]} inline functions were allowed and bw.html() would emit functions with the automatic registration system (bw.fnRegister(...)) to accommodate this.  In this mode the function body would be come an anonymous function registered by bw and then an id was provided to so that the function would become <div onclick=”bw.fn….()”>`

## `Bitwrench v1 styles and css`

`I think it still makes sense to support html generation.  Its useful for static sites, highly performant and allows js objects or JSON objects to become full blown pages.`

`Also because of how styles are assembled (taking {a:{“style”: “...” }} one can emit custom styles / and themes at generation time for any objects without having to deal with classes.  This is useful if you have static styles of many types across the objects you choose to create.  Also one can generate utility css classes in javascript on the fly.`

`bw.makeCSS( [ …. Css rules ….]) ⇒ generatedStyleString`

`This string can be used across many objects easily when they are generated.`

`Also one can recreate tailwind/bootstrap style utility classes “m4 p5” etc with a simple javascript generator.  This can be used for actual classes (one can generate .class in a {“tag”: “style”,”c” : generatedStyleString}`

`So we don’t need a css library per se - we can generate just as much styles or cssClasses as we need and then when we generate objects use a:{“style”: str, “class” : str} at html object generation time.`

`To put Bitwrench v1 objects in the DOM we could call classic DOM functions like document.getElementById(“myApp).innerHTML = bw.html( {.....}).  For those element that included builtin features like bw.makeHtmlTable( …) the emitted html called built-in bitwrench helper functions for features like sorting.  But this approach varied by component.  So reactivity in v1 was supported but ad hoc.`

## `Bitwrench V2` 

`For generating static html, css styles, or css classes I think bitwrench v1 thinking is solid.  The programmer need not touch any css = that can be generated from js code and effectively replace css variables and helper libraries.    Also the programmer doesn’t need to touch any html objects and can re-use common objects like cards, tables, and tabs because v1 supported the generation of those from raw elements ({taco} ⇒ html) or via the helper functions which made rich html version (bw.makeHtmlTabs(), bw.makeHtmlTable()) etc.`

`But where v1 runs into trouble is dynamic objects that require stateful management in a uniform way.  This is where bitwrench v2 builds on the v1. Model.`

`Rather than generating html from {taco} objects, we will actually need to generate live objects that we can call methods on.  It turns out that this is possible if we switch from generating html and placing html in the DOM to generating true DOM objects to which we keep a handle.`  

`In V1:`  
`Bw.html ({taco}) => html => place in DOM`

`V2:`  
`For now I will prefix v2 fns with t to keep them separate from v1 objects`  
`bw.makeTableT(params) ⇒ {taco}.`  
`bw.makeTabsT(params) ⇒ {taco}`  
`Or hand assemble`  
`bw.validateTemplate (params) ⇒ {taco}`

`Now we can turn any {taco} object in to a true DOM element.`  
`myComponent = bw.renderComponent({taco})`   
`This creates a true DOM element.`  
`We can place that element in the DOM like this:`  
`bw.DOM(parentEl | cssSelector, myComponent, position) // where position defaults to firstChild but could be lastChild or some other specifier (nth) or other`

`But the handle to myComponent has methods.`  
`myComponent.type ⇒ returns what it is (table, card, tab etc)`  
`myComponent.setTitle ( ..) ⇒ (a component specific method call)  to set the title if it has such property`  
`myComponent.getBwId () ⇒ returns the injected bw_uuid (a class string with bw_uuid_xxx) that is added to the DOM component when bw.renderComponent() instantiated it.`

`myComponent.onClick (callback) ⇒ change onclick handler if it exists.`

`We can also pass many {taco} objects to build a page.`

`bw.render({taco}) // this can be recursive because {taco} objects can be recursive {{{}}}`

`We need life cycle methods if a component is deleted from the DOM because someone removes it (removeChild()) or because someone sets the ancestor’s innerHTML the object needs to clean itself up gracefully.` 

`Also for passing events from one object to another we should have a simple message passing system likely with pub / sub.  We can using the object’s handle pass listeners that receive certain events.`

`Generally instantiated (as in rendered to the DOM) {taco} objects have helper methods to set/get state (props such as the setTitle) and ability to pass messages.`

`I think that such objects are likely a class hierarchy with bw.render( {taco}) returning a base class that might be subclassed for specific types.  That way when programmers create new custom types they inherit lifecycle methods, message passing, id system and other boiler plate.`

`This can also help with providing theming and styling support as all common objects will inherit helper functions for setting styles or themes.`

## `Bitwrench Core Components Library (BCCL)`

`The bitwrench core components library (BCCL) has examples of cards, tables, pickers, progress bars etc.`  
`IT should roughly have parity with shadcn / MUI / bootstrap interms of widgets.`

`Core components should be easily themeable both individually and an enmass so our design should reflect this.`

`Because bitwrench components take js dictionaries / strings when components are instantiated the need for css variables may be lessened since the program can store all styling in js strings and pass those strings to objects.`

### `Bitwrench CSS`

`The BCCL should provide a few default themes as well.  These should be js dictionaries which at bitwrench compile time are exported as both JSON format and also as true css files.  The css files should be class based so that when used in apps the changes of collisions is low.  For example rather than have a class like “center” we have ‘bw-center-h’ (horizontal).`

`Bitwrench v1 had a simple css (bitwrench.css) which provided base styles for sizing and responsiveness.  Bitwrench V2 will follow a similar pattern but with a few updates:`

* `No globally applied styles (e.g. body { … } instead the bw-class that you with should be attached to the body class list.  Again this is to avoid collisions with other css libraries`  
* `Updated CSS norm (to get css in a predictable state)`  

`Users should be able to use bitwrench css to make pretty basic pages w/o bitwrench javascript support (a la w3css).`  

## `Compatibility`

`Bitwrench is designed to be built with rollupjs to emit all its libraries in modern ESM syntax. However UMD builds are provided and legacy builds are provided which default to IE8 level compatibility and CSS2.1.  Since bw doesn’t rely on a lot of modern methods it can enjoy wide availability across legacy systems.`

`Testing`

`For bitwrench v2 near 100% coverage is desired using jsdom and modering browser based rendering tools.`

`Bitwrench uses ci via github actions for automatic deployemts.`

## `Examples`

`Bitwrench core which shows how to build and render bw components should have extensive help pages`  
`Bitwrench CSS which show how to use different bitwrench css components (including no js) needs extensive documentation`  
`Bitwrench CCL should have extensive docs and full pages and dashboards to show building up of full UIs and dashboards including multi page demos.` 
