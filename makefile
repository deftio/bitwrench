#bitwrench makefile (c) 2012 M A Chatterjee
#remember makefiles require real tabs not spaces

build:
	./tools/update-bw-package.js package.json package.json
	./tools/export-bw-default-css.js bitwrench.css
	uglifyjs bitwrench.js -o  bitwrench.min.js

test:
	./node_modules/mocha/bin/mocha test/bitwrench_test.js --reporter spec

lint:
	./node_modules/.bin/eslint bitwrench.js

.PHONY: test

