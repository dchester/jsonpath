var assert = require('assert');
var vm = require('vm');
var jp = require('../');

suite('objects from another realm', function() {
  test('query, paths and nodes accept foreign roots', function() {
    var obj = vm.runInNewContext('({items: [{price: 3}, {price: 7}]})');
    assert.deepEqual(jp.query(obj, '$.items[?(@.price > 5)].price'), [7]);
    assert.deepEqual(jp.paths(obj, '$..price'), [['$', 'items', 0, 'price'], ['$', 'items', 1, 'price']]);
    assert.equal(jp.nodes(obj, '$.items[0].price')[0].value, 3);
  });

  test('traverses foreign children below a local root', function() {
    var obj = {items: vm.runInNewContext('([{price: 3}, {price: 7}])')};
    assert.deepEqual(jp.query(obj, '$..price'), [3, 7]);
    assert.deepEqual(jp.query(obj, '$.items[0].*'), [3]);
  });

  test('foreign arrays remain arrays during wildcard traversal', function() {
    var obj = vm.runInNewContext('([3, 7])');
    assert.deepEqual(jp.paths(obj, '$[*]'), [['$', 0], ['$', 1]]);
  });

  test('parent, value and apply preserve foreign object identity', function() {
    var obj = vm.runInNewContext('({item: {price: 3}})');
    assert.strictEqual(jp.parent(obj, '$.item.price'), obj.item);
    assert.equal(jp.value(obj, '$.item.price', 4), 4);
    jp.apply(obj, '$.item.price', function(value) { return value * 2; });
    assert.equal(obj.item.price, 8);
    assert.equal(jp.value(obj, '$.new.price', 9), 9);
  });

  test('accepts dictionaries without an Object prototype', function() {
    var obj = Object.create(null);
    obj.item = Object.create(null);
    obj.item.price = 3;
    assert.deepEqual(jp.query(obj, '$..price'), [3]);
    assert.equal(jp.value(obj, '$.item.price', 4), 4);
  });

  test('continues to reject primitive roots and unsafe paths', function() {
    [null, undefined, true, 3, 'text'].forEach(function(value) {
      assert.throws(function() { jp.query(value, '$'); }, /obj needs to be an object/);
    });
    var obj = vm.runInNewContext('({})');
    assert.throws(function() { jp.value(obj, '$.__proto__.x', 1); }, /Unsafe key/);
  });
});
