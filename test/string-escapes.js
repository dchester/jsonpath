var assert = require('assert');
var jp = require('../');

suite('quoted subscript escapes', function() {
  var keys = [
    ['backslash', 'a\\b'],
    ['double quote', 'a"b'],
    ['single quote', "a'b"],
    ['newline', 'a\nb'],
    ['tab', 'a\tb'],
    ['carriage return', 'a\rb'],
    ['backspace', 'a\bb'],
    ['form feed', 'a\fb'],
    ['literal Unicode escape', '\\u0061'],
    ['literal newline escape', '\\n'],
    ['solidus', 'a/b'],
    ['plain key', 'plain'],
    ['non-ASCII key', '漢字'],
    ['astral character', '😀']
  ];

  keys.forEach(function(entry) {
    ['double', 'single'].forEach(function(quote) {
      test(entry[0] + ' in a ' + quote + '-quoted subscript', function() {
        var key = entry[1];
        var literal = JSON.stringify(key);
        if (quote === 'single') {
          literal = "'" + literal.slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'") + "'";
        }
        var expression = '$[' + literal + ']';
        var obj = {};
        obj[key] = 42;

        assert.strictEqual(jp.parse(expression)[1].expression.value, key);
        assert.deepEqual(jp.query(obj, expression), [42]);
        assert.deepEqual(jp.paths(obj, expression), [['$', key]]);
        assert.deepEqual(jp.query(obj, jp.stringify(['$', key])), [42]);
      });
    });
  });

  ['"', "'"].forEach(function(quote) {
    test('Unicode and solidus escapes with ' + quote, function() {
      var expression = '$[' + quote + '\\u0061\\/\\uD83D\\uDE00' + quote + ']';
      assert.deepEqual(jp.query({ 'a/😀': 42 }, expression), [42]);
    });
  });

  test('escaped keys in a union', function() {
    var obj = { 'a\\b': 1, 'c\nd': 2 };
    assert.deepEqual(jp.query(obj, '$["a\\\\b",\'c\\nd\']'), [1, 2]);
  });

  test('escaped keys in a descendant subscript', function() {
    assert.deepEqual(jp.query({ nested: { 'a\\b': 42 } }, '$..["a\\\\b"]'), [42]);
  });

  test('sets a value through a stringified path with escaped parent keys', function() {
    var obj = { 'a\\b': { 'c"d': 1 } };
    var expression = jp.stringify(['$', 'a\\b', 'c"d']);
    assert.strictEqual(jp.value(obj, expression, 2), 2);
    assert.strictEqual(obj['a\\b']['c"d'], 2);
  });

  test('continues rejecting invalid escapes and resets after an error', function() {
    assert.throws(function() { jp.parse('$["\\x41"]'); });
    assert.throws(function() { jp.parse('$["\\u00xx"]'); });
    assert.deepEqual(jp.query({ plain: 42 }, '$.plain'), [42]);
  });

  test('preserves accepted literal newlines in quoted keys', function() {
    assert.deepEqual(jp.query({ 'a\nb': 42 }, '$["a\nb"]'), [42]);
  });
});
