var assert = require('assert');
var jp = require('../');
var util = require('util');

suite('sugar', function() {

  test('parent gets us parent value', function() {
    var data = { a: 1, b: 2, c: 3, z: { a: 100, b: 200 } };
    var parent = jp.parent(data, '$.z.b');
    assert.equal(parent, data.z);
  });

  test('apply method sets values', function() {
    var data = { a: 1, b: 2, c: 3, z: { a: 100, b: 200 } };
    jp.apply(data, '$..a', function(v) { return v + 1 });
    assert.equal(data.a, 2);
    assert.equal(data.z.a, 101);
  });

  test('value method gets us a value', function() {
    var data = { a: 1, b: 2, c: 3, z: { a: 100, b: 200 } };
    var b = jp.value(data, '$..b')
    assert.equal(b, data.b);
  });

  test('value method sets us a value', function() {
    var data = { a: 1, b: 2, c: 3, z: { a: 100, b: 200 } };
    var b = jp.value(data, '$..b', '5000')
    assert.equal(b, 5000);
    assert.equal(data.b, 5000);
  });

});
