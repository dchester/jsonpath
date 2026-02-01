var assert = require('assert');
var jp = require('../');

suite('security', function() {

  var cleanup = function() {
    if (Object.prototype.polluted) {
      delete Object.prototype.polluted;
    }
  };

  teardown(function() {
    cleanup();
  });

  test('blocks prototype pollution via value()', function() {
    cleanup();
    var data = {};
    assert.throws(function() {
      jp.value(data, '$.__proto__.polluted', 'yes');
    }, /Unsafe key/);
    assert.equal(({}).polluted, undefined);
  });

  test('blocks prototype pollution via apply()', function() {
    cleanup();
    var data = { safe: { ok: true } };
    assert.throws(function() {
      jp.apply(data, '$.__proto__.polluted', function() { return 'yes'; });
    }, /Unsafe key/);
    assert.equal(({}).polluted, undefined);
  });

  test('blocks unsafe subscript access', function() {
    cleanup();
    var data = {};
    assert.throws(function() {
      jp.query(data, '$["__proto__"]["polluted"]');
    }, /Unsafe key/);
    assert.equal(({}).polluted, undefined);
  });

  test('blocks unsafe union access', function() {
    cleanup();
    var data = { safe: 1 };
    assert.throws(function() {
      jp.nodes(data, "$['safe','__proto__']");
    }, /Unsafe key/);
    assert.equal(({}).polluted, undefined);
  });
});
