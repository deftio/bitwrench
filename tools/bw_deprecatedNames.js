//now that bitwrench as emerged from alpha status some old names were dropped use this functions to map old names to current functions.
function useDepcreatedNames(bitwrenchInstance) {

	var names = {
		"HTMLSafeStr" 		: "htmlSafeStr", 
		"makeHTML" 			: "html",       
		"buildHTMLObjString": "html",  
		"makeHTMLList" 		: "htmlList", 
		"makeHTMLTabs" 		: "htmlTabs", 
		"makeHTMLTableStr" 	: "htmlTable", 
		"markElement"	 	: "DOMClass",
		"bwSimpleStyles" 	: "CSSSimpleStyles",
		"naturalSort" 		: "naturalCompare"
	}
	for (i in names)
		bitwrenchInstance[i] = bitwrenchInstance[names[i]];
	return bitwrenchInstance;
}