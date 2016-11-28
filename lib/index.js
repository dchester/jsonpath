var assert = require('assert');
var dict = require('./dict');
var Parser = require('./parser');
var Handlers = require('./handlers');

var JSONPath = function() {
  this.initialize.apply(this, arguments);
};

JSONPath.prototype.initialize = function() {
  this.parser = new Parser();
  this.handlers = new Handlers();
};

JSONPath.prototype.parse = function(string) {
  assert.ok(_is_string(string), "we need a path");
  return this.parser.parse(string);
};

JSONPath.prototype.parent = function(obj, string) {

  assert.ok(obj instanceof Object, "obj needs to be an object");
  assert.ok(string, "we need a path");

  var node = this.nodes(obj, string)[0];
  return _get_value_by_path(obj, node.path, 1);
}

JSONPath.prototype.apply = function(obj, string, fn) {

  assert.ok(obj instanceof Object, "obj needs to be an object");
  assert.ok(string, "we need a path");
  assert.equal(typeof fn, "function", "fn needs to be function")

  return this._iterateNodes(obj, string, function(node) {
    var key = node.path[node.path.length - 1];
    var parent = _get_value_by_path(obj, node.path, 1);
    var val = node.value = fn.call(obj, parent[key]);
    parent[key] = val;
  });
}

JSONPath.prototype.forEachNode = function(obj, path, fn) {

  assert.ok(obj instanceof Object, "obj needs to be an object");
  assert.ok(path, "we need a path");
  assert.equal(typeof fn, "function", "fn needs to be function")

  return this._iterateNodes(obj, path, function(node) {
    fn(new _NodeWrapper(obj, node));
  });
}

JSONPath.prototype._iterateNodes = function(obj, path, fn) {

  assert.ok(obj instanceof Object, "obj needs to be an object");
  assert.ok(path, "we need a path");
  assert.equal(typeof fn, "function", "fn needs to be function")

  var nodes = this.nodes(obj, path).sort(function(a, b) {
    // sort nodes so we apply from the bottom up
    return b.path.length - a.path.length;
  });

  return nodes.forEach(fn.bind(this));
}

JSONPath.prototype.value = function(obj, path, value) {

  assert.ok(obj instanceof Object, "obj needs to be an object");
  assert.ok(path, "we need a path");

  if (arguments.length >= 3) {
    var node = this.nodes(obj, path).shift();
    if (!node) return this._vivify(obj, path, value);
    var key = node.path.slice(-1).shift();
    var parent = _get_value_by_path(obj, node.path, 1);
    parent[key] = value;
  }
  return this.query(obj, this.stringify(path), 1).shift();
}

JSONPath.prototype._vivify = function(obj, string, value) {

  var self = this;

  assert.ok(obj instanceof Object, "obj needs to be an object");
  assert.ok(string, "we need a path");

  var path = this.parser.parse(string)
    .map(function(component) { return component.expression.value });

  var setValue = function(path, value) {
    var key = path.pop();
    var node = self.value(obj, path);
    if (!node) {
      setValue(path.concat(), typeof key === 'string' ? {} : []);
      node = self.value(obj, path);
    }
    node[key] = value;
  }
  setValue(path, value);
  return this.query(obj, string)[0];
}

JSONPath.prototype.query = function(obj, string, count) {

  assert.ok(obj instanceof Object, "obj needs to be an object");
  assert.ok(_is_string(string), "we need a path");

  var results = this.nodes(obj, string, count)
    .map(function(r) { return r.value });

  return results;
};

JSONPath.prototype.paths = function(obj, string, count) {

  assert.ok(obj instanceof Object, "obj needs to be an object");
  assert.ok(string, "we need a path");

  var results = this.nodes(obj, string, count)
    .map(function(r) { return r.path });

  return results;
};

JSONPath.prototype.nodes = function(obj, string, count) {

  assert.ok(obj instanceof Object, "obj needs to be an object");
  assert.ok(string, "we need a path");

  if (count === 0) return [];

  var path = this.parser.parse(string);
  var handlers = this.handlers;

  var partials = [ { path: ['$'], value: obj } ];
  var matches = [];

  if (path.length && path[0].expression.type == 'root') path.shift();

  if (!path.length) return partials;

  path.forEach(function(component, index) {

    if (matches.length >= count) return;
    var handler = handlers.resolve(component);
    var _partials = [];

    partials.forEach(function(p) {

      if (matches.length >= count) return;
      var results = handler(component, p, count);

      if (index == path.length - 1) {
        // if we're through the components we're done
        matches = matches.concat(results || []);
      } else {
        // otherwise accumulate and carry on through
        _partials = _partials.concat(results || []);
      }
    });

    partials = _partials;

  });

  return count ? matches.slice(0, count) : matches;
};

JSONPath.prototype.stringify = function(path) {

  assert.ok(path, "we need a path");

  var string = '$';

  var templates = {
    'descendant-member': '..{{value}}',
    'child-member': '.{{value}}',
    'descendant-subscript': '..[{{value}}]',
    'child-subscript': '[{{value}}]'
  };

  path = this._normalize(path);

  path.forEach(function(component) {

    if (component.expression.type == 'root') return;

    var key = [component.scope, component.operation].join('-');
    var template = templates[key];
    var value;

    if (component.expression.type == 'string_literal') {
      value = JSON.stringify(component.expression.value)
    } else {
      value = component.expression.value;
    }

    if (!template) throw new Error("couldn't find template " + key);

    string += template.replace(/{{value}}/, value);
  });

  return string;
}

JSONPath.prototype._normalize = function(path) {

  assert.ok(path, "we need a path");

  if (typeof path == "string") {

    return this.parser.parse(path);

  } else if (Array.isArray(path) && typeof path[0] == "string") {

    var _path = [ { expression: { type: "root", value: "$" } } ];

    path.forEach(function(component, index) {

      if (component == '$' && index === 0) return;

      if (typeof component == "string" && component.match("^" + dict.identifier + "$")) {

        _path.push({
          operation: 'member',
          scope: 'child',
          expression: { value: component, type: 'identifier' }
        });

      } else {

        var type = typeof component == "number" ?
          'numeric_literal' : 'string_literal';

        _path.push({
          operation: 'subscript',
          scope: 'child',
          expression: { value: component, type: type }
        });
      }
    });

    return _path;

  } else if (Array.isArray(path) && typeof path[0] == "object") {

    return path
  }

  throw new Error("couldn't understand path " + path);
}

function _is_string(obj) {
  return Object.prototype.toString.call(obj) == '[object String]';
}

function _get_value_by_path(obj, path, skip) {
  skip = skip || 0;
  for (var i = 1; i < path.length - skip; ++i)
    obj = obj[path[i]];
  return obj;
}

var _NodeWrapper = function(root, node) {
  this._root = root;
  this._node = node;
};

_NodeWrapper.prototype.value = function(skip) {
  skip = skip || 0;
  if (skip === 0)
    return this._node.value;
  return _get_value_by_path(this._root, this._node.path, skip);
};

_NodeWrapper.prototype.parent = function(skip) {
  skip = (skip + 1) || 1;
  return this.value(skip);
};

_NodeWrapper.prototype.path = function() {
  return this._node.path;
};

_NodeWrapper.prototype.key = function(skip) {
  skip = skip || 0;
  var index = this._node.path.length - 1 - skip;
  if (index === 0) return undefined;
  return this._node.path[index];
};

_NodeWrapper.prototype.update = function(value, skip) {
  skip = skip || 0;
  this.parent(skip)[this.key(skip)] = value;
};

_NodeWrapper.prototype.remove = function(skip) {
  skip = skip || 0;
  var parent = this.parent(skip);
  var key = this.key(skip);
  var value = parent[key];

  if (Array.isArray(parent))
    Array.prototype.splice.call(parent, key, 1);
  else
    delete parent[key];

  return value;
};

JSONPath.Handlers = Handlers;
JSONPath.Parser = Parser;

var instance = new JSONPath;
instance.JSONPath = JSONPath;

module.exports = instance;
