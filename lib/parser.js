var JisonParser = require('jison').Parser;
var grammar = require('./grammar');

var Parser = function() {
  return new JisonParser(grammar);
};

Parser.grammar = grammar;
module.exports = Parser;
