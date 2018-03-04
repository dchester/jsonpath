var JisonParser = require('jison').Parser;
var grammar = require('../include/grammar');

var parser = new JisonParser(grammar);
source = parser.generate()

console.log(source)
