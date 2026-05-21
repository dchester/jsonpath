var aesprim = require('./aesprim');
var slice = require('./slice');
var _evaluate = require('static-eval');
var uniqBy = require('lodash/uniqBy');

// Property names that must never be accessible in expressions.
// Mitigates prototype pollution and constructor escape attacks.
var UNSAFE_PROPERTY_NAMES = Object.create(null);

/* jshint -W069: true */
UNSAFE_PROPERTY_NAMES['constructor'] = true;
UNSAFE_PROPERTY_NAMES['__proto__'] = true;
UNSAFE_PROPERTY_NAMES['prototype'] = true;
/* jshint -W069: false */

function isUnsafePropertyName(name) {
  return typeof name === 'string' && UNSAFE_PROPERTY_NAMES[name] === true;
}

function isSafeAst(ast) {
  if (!ast || typeof ast !== 'object') return false;

  function walk(node) {
    if (!node || typeof node !== 'object' || !node.type) {
      return false;
    }

    switch (node.type) {

      // ===== SAFE TERMINALS =====

      case 'Literal':
        return true;

      case 'Identifier':
        // Only allow the special scope identifier
        return node.name === '@';


      // ===== PROPERTY ACCESS =====

      case 'MemberExpression': {
        if (!walk(node.object)) {
          return false;
        }

        // Non-computed: obj.property
        if (!node.computed && node.property.type === 'Identifier') {
          if (isUnsafePropertyName(node.property.name)) {
            return false;
          }
          return true;
        }

        // Computed: obj["property"]
        if (node.computed) {
          if (!walk(node.property)) {
            return false;
          }

          if (
            node.property.type === 'Literal' &&
            isUnsafePropertyName(String(node.property.value))
          ) {
            return false;
          }

          return true;
        }

        return false;
      }


      // ===== EXPRESSIONS =====

      case 'UnaryExpression':
        return walk(node.argument);

      case 'BinaryExpression':
      case 'LogicalExpression':
        return walk(node.left) && walk(node.right);

      case 'ConditionalExpression':
        return (
          walk(node.test) &&
          walk(node.consequent) &&
          walk(node.alternate)
        );

      case 'ArrayExpression':
        for (var i = 0; i < node.elements.length; i++) {
          if (!walk(node.elements[i])) {
            return false;
          }
        }
        return true;

      case 'ObjectExpression':
        for (var j = 0; j < node.properties.length; j++) {
          var prop = node.properties[j];

          // Reject unsafe keys
          if (
            prop.key &&
            (
              (prop.key.type === 'Identifier' &&
               isUnsafePropertyName(prop.key.name)) ||
              (prop.key.type === 'Literal' &&
               isUnsafePropertyName(String(prop.key.value)))
            )
          ) {
            return false;
          }

          if (!walk(prop.value)) {
            return false;
          }
        }
        return true;


      // ===== EXPLICITLY REJECT DANGEROUS TYPES =====
      // Security: do not rely on default deny; list each code-execution / escape vector.

      case 'CallExpression':
      case 'NewExpression':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
      case 'ThisExpression':
      case 'AssignmentExpression':
      case 'UpdateExpression':
      case 'SequenceExpression':
      case 'TemplateLiteral':
      case 'TemplateElement':
      case 'TaggedTemplateExpression':
      case 'ReturnStatement':
      case 'ExpressionStatement':
        return false;


      // ===== DEFAULT DENY =====

      default:
        return false;
    }
  }

  return walk(ast);
}

var Handlers = function() {
  return this.initialize.apply(this, arguments);
}

Handlers.prototype.initialize = function() {
  this.traverse = traverser(true);
  this.descend = traverser();
}

Handlers.prototype.keys = Object.keys;

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
};

Handlers.prototype._fns = {

  'member-child-identifier': function(component, partial) {
    var key = component.expression.value;
    var value = partial.value;
    if (value instanceof Object && key in value) {
      return [ { value: value[key], path: partial.path.concat(key) } ]
    }
  },

  'member-descendant-identifier':
    _traverse(function(key, value, ref) { return key == ref }),

  'subscript-child-numeric_literal':
    _descend(function(key, value, ref) { return key === ref }),

  'member-child-numeric_literal':
    _descend(function(key, value, ref) { return String(key) === String(ref) }),

  'subscript-descendant-numeric_literal':
    _traverse(function(key, value, ref) { return key === ref }),

  'member-child-wildcard':
    _descend(function() { return true }),

  'member-descendant-wildcard':
    _traverse(function() { return true }),

  'subscript-descendant-wildcard':
    _traverse(function() { return true }),

  'subscript-child-wildcard':
    _descend(function() { return true }),

  'subscript-child-slice': function(component, partial) {
    if (is_array(partial.value)) {
      var args = component.expression.value.split(':').map(_parse_nullable_int);
      var values = partial.value.map(function(v, i) { return { value: v, path: partial.path.concat(i) } });
      return slice.apply(null, [values].concat(args));
    }
  },

  'subscript-child-union': function(component, partial) {
    var results = [];
    component.expression.value.forEach(function(component) {
      var _component = { operation: 'subscript', scope: 'child', expression: component.expression };
      var handler = this.resolve(_component);
      var _results = handler(_component, partial);
      if (_results) {
        results = results.concat(_results);
      }
    }, this);

    return unique(results);
  },

  'subscript-descendant-union': function(component, partial, count) {

    var jp = require('..');
    var self = this;

    var results = [];
    var nodes = jp.nodes(partial, '$..*').slice(1);

    nodes.forEach(function(node) {
      if (results.length >= count) return;
      component.expression.value.forEach(function(component) {
        var _component = { operation: 'subscript', scope: 'child', expression: component.expression };
        var handler = self.resolve(_component);
        var _results = handler(_component, node);
        results = results.concat(_results);
      });
    });

    return unique(results);
  },

  'subscript-child-filter_expression': function(component, partial, count) {

    // slice out the expression from ?(expression)
    var src = component.expression.value.slice(2, -1);
    var ast = aesprim.parse(src).body[0].expression;

    var passable = function(key, value) {
      return evaluate(ast, { '@': value });
    }

    return this.descend(partial, null, passable, count);

  },

  'subscript-descendant-filter_expression': function(component, partial, count) {

    // slice out the expression from ?(expression)
    var src = component.expression.value.slice(2, -1);
    var ast = aesprim.parse(src).body[0].expression;

    var passable = function(key, value) {
      return evaluate(ast, { '@': value });
    }

    return this.traverse(partial, null, passable, count);
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

Handlers.prototype._fns['member-descendant-numeric_literal'] =
    Handlers.prototype._fns['subscript-descendant-string_literal'] =
    Handlers.prototype._fns['member-descendant-identifier'];

function eval_recurse(partial, src, template) {

  var jp = require('./index');
  var ast = aesprim.parse(src).body[0].expression;
  var value = evaluate(ast, { '@': partial.value });
  var path = template.replace(/\{\{\s*value\s*\}\}/g, value);

  var results = jp.nodes(partial.value, path);
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

function traverser(recurse) {

  return function(partial, ref, passable, count) {

    var value = partial.value;
    var path = partial.path;

    var results = [];

    var descend = function(value, path) {

      if (is_array(value)) {
        value.forEach(function(element, index) {
          if (results.length >= count) { return }
          if (passable(index, element, ref)) {
            results.push({ path: path.concat(index), value: element });
          }
        });
        value.forEach(function(element, index) {
          if (results.length >= count) { return }
          if (recurse) {
            descend(element, path.concat(index));
          }
        });
      } else if (is_object(value)) {
        this.keys(value).forEach(function(k) {
          if (results.length >= count) { return }
          if (passable(k, value[k], ref)) {
            results.push({ path: path.concat(k), value: value[k] });
          }
        })
        this.keys(value).forEach(function(k) {
          if (results.length >= count) { return }
          if (recurse) {
            descend(value[k], path.concat(k));
          }
        });
      }
    }.bind(this);
    descend(value, path);
    return results;
  }
}

function _descend(passable) {
  return function(component, partial, count) {
    return this.descend(partial, component.expression.value, passable, count);
  }
}

function _traverse(passable) {
  return function(component, partial, count) {
    return this.traverse(partial, component.expression.value, passable, count);
  }
}

function evaluate(ast, scope) {
  if (!isSafeAst(ast)) {
    throw new Error('Unsafe expression: script and filter expressions may only access the current node (@) with safe property names');
  }
  try { return _evaluate(ast, scope) }
  catch (e) { }
}

function unique(results) {
  results = results.filter(function(d) { return d })
  return uniqBy(
    results,
    function(r) { return r.path.map(function(c) { return String(c).replace('-', '--') }).join('-') }
  );
}

function _parse_nullable_int(val) {
  var sval = String(val);
  return sval.match(/^-?[0-9]+$/) ? parseInt(sval) : null;
}

module.exports = Handlers;
