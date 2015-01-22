var Parser = require('./parser');
var Handlers = require('./handlers');

var JSONPath = function() {

  this.parser = new Parser();
  this.handlers = new Handlers();
};

JSONPath.prototype.parse = function(string) {
  return this.parser.parse(string);
}

JSONPath.prototype.query = function(obj, string) {

  var results = this.paths(obj, string)
    .map(function(r) { return r.value });

  return results;
}

JSONPath.prototype.paths = function(obj, string) {

  var results = this.paths(obj, string)
    .map(function(r) { return r.path });

  return results;
}

JSONPath.prototype.nodes = function(obj, string) {

  var path = this.parser.parse(string);
  var handlers = this.handlers;

  var partials = [ { path: ['$'], value: obj } ];
  var matches = [];

  path.components.forEach(function(component, index) {

    var handler = handlers.resolve(component);
    var _partials = [];

    partials.forEach(function(p) {
      var results = handler(component, p);
      if (index == path.components.length - 1) {
        matches = matches.concat(results);
      } else {
        _partials = _partials.concat(results);
      }
    });

    partials = _partials;

  });

  return matches;
}

JSONPath.Handlers = Handlers;
JSONPath.Parser = Parser;

var instance = new JSONPath;
instance.JSONPath = JSONPath;

module.exports = instance;

