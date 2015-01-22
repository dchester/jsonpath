var aesprim = require('./aesprim');
var slice = require('./slice');
var evaluate = require('static-eval');

var Handlers = function() { this._h = 1 };

Handlers.prototype.resolve = function(component) {

  var key = [ component.operation, component.scope, component.expression.type ].join('-');
  var method = this._fns[key];

  if (!method) throw new Error("couldn't resolve key: " + key);
  return method.bind(this);
};

Handlers.prototype.register = function(key, handler) {

  if (!handler instanceof Function) {
    throw new Error("handler must be a function");
  }

  this._fns[key] = handler;
}

Handlers.prototype._fns = {

  'member-child-identifier': function(component, partial) {

    var value = partial.value;
    var path = partial.path;
    var results = [];

    if (!is_object(value)) return;
    Object.keys(value).forEach(function(key) {
      if (key == component.expression.value) {
        results.push({ path: path.concat(key), value: value[key] });
      } 
    });

    return results;
  },

  'member-child-wildcard': function(component, partial) {

    var value = partial.value;
    var path = partial.path;
    var results = [];

    if (!is_object(value)) return;
    Object.keys(value).forEach(function(key) {
      results.push({ path: path.concat(key), value: value[key] });
    });

    return results;
  },

  'member-descendant-wildcard': function(component, partial) {

    var value = partial.value;
    var path = partial.path;
    var results = [];
    var key = component.expression.value;

    function descend(value, path) {
      if (is_object(value)) {
        Object.keys(value).forEach(function(k) {
          results.push({ path: path.concat(k), value: value[k] });
        });
        Object.keys(value).forEach(function(k) {
          descend(value[k], path.concat(k));
        });
      } else if (is_array(value)) {
        value.forEach(function(el, i) {
          results.push({ path: path.concat(i), value: el });
        });
        value.forEach(function(v, i) {
          descend(v, path.concat(i));
        });
      }
    }

    descend(value, path);
    return results;
  },

  'member-descendant-identifier': function(component, partial) {

    var value = partial.value;
    var path = partial.path;
    var results = [];
    var key = component.expression.value;

    function descend(value, path) {
      if (is_object(value)) {
        Object.keys(value).forEach(function(k) {
          var prop = value[k];
          if (k == key) results.push({ path: path.concat(k), value: prop });
          descend(prop, path.concat(k));
        });
      } else if (is_array(value)) {
        value.forEach(function(v, i) { descend(v, path.concat(i)) });
      }
    }

    descend(value, path);
    return results;
  },

  'subscript-child-wildcard': function(comonent, partial) {
    if (is_object(partial.value)) {
      var handler = this.resolve({ scope: 'chlid', operation: 'member', expression: { type: 'wildcard' } });
      return handler(component, partial);

    } else if (is_array(partial.value)) {
      return partial.value.map(function(x, i) {
        return { path: partial.path.concat(i), value: x }
      })
    }
  },

  'subscript-child-slice': function(component, partial) {
    if (is_array(partial.value)) {
      var args = component.expression.value.split(':');
      var values = partial.value.map(function(v, i) { return { value: v, path: partial.path.concat(i) } });
      return slice.apply(null, [values].concat(args));
    }
  },

  'subscript-child-numeric_literal': function(component, partial) {
    if (is_array(partial.value)) {
      var index = component.expression.value;
      return { path: partial.path.concat(index), value: partial.value[index] };
    }
  },

  'subscript-child-union': function(component, partial) {
    if (is_array(partial.value)) {
      var results = [];
      component.expression.value.forEach(function(expression) {
        var _component = { operation: 'subscript', scope: 'child', expression: expression };
        var handler = this.resolve(_component);
        var _results = handler(_component, partial);
        results.push(_results);
      }, this);
    }
    return results;
  },

  'subscript-child-filter_expression': function(component, partial) {
    if (is_array(partial.value)) {
      var results = [];
      partial.value.forEach(function(element, index) {
        // slice out the expression from ?(expression)
        var src = component.expression.value.slice(2, -1);
        var ast = aesprim.parse(src).body[0].expression;
        var passable = evaluate(ast, { '@': element });
        if (passable) results.push({ path: partial.path.concat(index), value: element });
      });
    }
    return results;
  },

  'subscript-child-script_expression': function(component, partial) {
    var exp = component.expression.value.slice(1, -1);
    return eval_recurse(partial, exp, '$[{{value}}]');
  },

  'member-child-script_expression': function(component, partial) {
    var exp = component.expression.value.slice(1, -1);
    return eval_recurse(partial, exp, '$.{{value}}');
  },

  'member-descendant-script_expression': function(component, partial) {
    var exp = component.expression.value.slice(1, -1);
    return eval_recurse(partial, exp, '$..value');
  }
};

Handlers.prototype._fns['subscript-child-string_literal'] = 
	Handlers.prototype._fns['member-child-identifier'];

function eval_recurse(partial, src, template) {

    var JSONPath = require('./index');
    var jp = new JSONPath;

    var ast = aesprim.parse(src).body[0].expression;
    var value = evaluate(ast, { '@': partial.value });
    var path = template.replace(/\{\{\s*value\s*\}\}/g, value);

    var results = jp.evaluate(partial.value, path);
    results.forEach(function(r) {
      r.path = partial.path.concat(r.path.slice(1));
    });

    return results;
}

function is_array(val) {
  return Array.isArray(val);
}

function is_object(val) {
  // is this a non-array, non-null object?
  return val && !(val instanceof Array) && val instanceof Object;
}

module.exports = Handlers;
