#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

//The above shenbang allows running on systems whether nodejs exec is called 'node'
//or called 'nodejs' which is common on many debian systems such as Ubuntu.

//more traditional shebang would be:
//#!/usr/bin/env node

//===============================================
// bitwrench console apps starter
//begin actual javascript below

var fs = require('fs');
var bw = require('../bitwrench.js')["bw"]

console.log ("bitwrench version:"+bw.version()["version"]);

// do stuff with bitwrench.js at command line

