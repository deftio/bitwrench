function useDepcreatedNames(bitwrenchInstance) {
	bitwrenchInstrance.HTMLSafeStr 	= bitwrenchInstrance.htmlSafeStr; // deprecated
	bitwrenchInstrance.makeHTML 	= bitwrenchInstrance.html;              //deprecated name
	bitwrenchInstrance.buildHTMLObjString = bitwrenchInstrance.html;    //deprecated name
	bitwrenchInstrance.makeHTMLList = bitwrenchInstrance.htmlList; //deprecated name
	bitwrenchInstrance.makeHTMLTabs = bitwrenchInstrance.htmlTabs; //deprecated name
	bitwrenchInstrance.makeHTMLTableStr = bitwrenchInstrance.htmlTable; ////deprecated name

	bitwrenchInstrance.markElement = bitwrenchInstrance.DOMClass;
	bitwrenchInstrance.bwSimpleStyles = bitwrenchInstrance.CSSSimpleStyles;



	return bitwrenchInstrance;
}