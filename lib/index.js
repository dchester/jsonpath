var Parser = require('./parser');
var Handlers = require('./handlers');

var JSONPath = function() {
  this.parser = new Parser();
  this.handlers = new Handlers();
};

JSONPath.prototype.parse = function(string) {
  return this.parser.parse(string);
}

JSONPath.prototype.evaluate = function(obj, string) {

    var path = this.parser.parse(string);
    var handlers = this.handlers;

    var partials = [obj];
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

module.exports = JSONPath;

