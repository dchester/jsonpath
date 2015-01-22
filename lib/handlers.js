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

    var results = [];

    if (!is_object(partial)) return;
    Object.keys(partial).forEach(function(key) {
      if (key == component.expression.value) {
        results.push(partial[key]);
      } 
    });

    return results;
  },

  'member-child-wildcard': function(component, partial) {

    var results = [];

    if (!is_object(partial)) return;
    Object.keys(partial).forEach(function(key) {
      results.push(partial[key]);
    });

    return results;
  },

  'member-descendant-wildcard': function(component, partial) {

    var results = [];
    var key = component.expression.value;

    function descend(obj) {
      if (is_object(obj)) {
        Object.keys(obj).forEach(function(k) {
          results.push(obj[k]);
        });
        Object.keys(obj).forEach(function(k) {
          descend(obj[k]);
        });
      } else if (is_array(obj)) {
        obj.forEach(function(el) {
          results.push(el);
        });
        obj.forEach(descend);
      }
    }

    descend(partial);
    return results;
  },

  'member-descendant-identifier': function(component, partial) {

    var results = [];
    var key = component.expression.value;

    function descend(obj) {
      if (is_object(obj)) {
        Object.keys(obj).forEach(function(k) {
          var prop = obj[k];
          if (k == key) results.push(prop);
          descend(prop);
        });
      } else if (is_array(obj)) {
        obj.forEach(descend);
      }
    }

    descend(partial);
    return results;
  },

  'subscript-child-wildcard': function(comonent, partial) {
    if (is_object(partial)) {
      return component_methods['member-child-wildcard'](component, partial);

    } else if (is_array) {
      return partial;
    }
  },

  'subscript-child-slice': function(component, partial) {
    if (is_array(partial)) {
      var args = component.expression.value.split(':');
      return slice.apply(null, [partial].concat(args));
    }
  },

  'subscript-child-numeric_literal': function(component, partial) {
    if (is_array(partial)) {
      return partial[component.expression.value];
    }
  },

  'subscript-child-union': function(component, partial) {
    if (is_array(partial)) {
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
    if (is_array(partial)) {
      var results = [];
      partial.forEach(function(element) {
        // slice out the expression from ?(expression)
        var src = component.expression.value.slice(2, -1);
        var ast = aesprim.parse(src).body[0].expression;
        var passable = evaluate(ast, { '@': element });
        if (passable) results.push(element);
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
    var ast = aesprim.parse(src).body[0].expression;
    var value = evaluate(ast, { '@': partial });
    var jp = new JSONPath;
    var path = template.replace(/\{\{\s*value\s*\}\}/g, value);
    return jp.evaluate(partial, path);
}

function is_array(val) {
  return Array.isArray(val);
}

function is_object(val) {
  // is this a non-array, non-null object?
  return val && !(val instanceof Array) && val instanceof Object;
}

module.exports = Handlers;
