var grammar = require('./grammar');
var gparser = require('../generated/parser');

var Parser = function() {

  var parser = new gparser.Parser();
  return parser;

};

Parser.grammar = grammar;
module.exports = Parser;
