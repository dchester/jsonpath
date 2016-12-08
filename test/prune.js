var assert = require('assert');
var jp = require('../');
var util = require('util');

suite('prune', function() {

  test('prune removes odds from array of literals', function() {
    var data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    jp.prune(data, '$..*', function(x) { return x % 2 == 1 });
    assert.deepEqual(data, [0, 2, 4, 6, 8]);
  });

  test('prune removes odds by path match', function() {
    var data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    jp.prune(data, '$..*', function(value, path) { return path == '$[2]' });
    assert.deepEqual(data, [0, 1, 3, 4, 5, 6, 7, 8, 9]);
  });

  test('prune removes all matches if no fn supplied', function() {
    var data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    jp.prune(data, '$[:7]');
    assert.deepEqual(data, [7, 8, 9]);
  });

  test('delete deletes by static path', function() {
    var data = { a: 1, b: 2, c: 3, z: { a: 100, b: 200 } };
    jp.delete(data, '$.a'),
    assert.deepEqual(data, { b: 2, c: 3, z: { a: 100, b: 200 } });
  });

  test('delete deletes obj by static path', function() {
    var data = { a: 1, b: 2, c: 3, z: { a: 100, b: 200 } };
    jp.delete(data, '$.z.a'),
    assert.deepEqual(data, { a: 1, b: 2, c: 3, z: { b: 200 } });
  });

  test('non-existent path does nothing', function() {
    var data = { a: 1, b: 2, c: 3, z: { a: 100, b: 200 } };
    jp.delete(data, '$.non.existent');
    assert.deepEqual(data, { a: 1, b: 2, c: 3, z: { a: 100, b: 200 } });
  });

  test('delete by dynamic path throws', function() {
    var data = { a: 1, b: 2 };
    assert.throws(function(done) {
      jp.delete(data, '$..*');
      done();
    });
  });

  test('up finds parent path', function() {
    var ancestor = jp.up('$.one.two.three');
    assert.equal(ancestor, '$.one.two');
  });

  test('up finds grandparent path', function() {
    var ancestor = jp.up('$.one.two.three', 2);
    assert.equal(ancestor, '$.one');
  });

  test('up finds ancestor path from path components', function() {
    var ancestor = jp.up(jp._normalize('$.one.two.three'));
    assert.equal(ancestor, '$.one.two');
  });

});
