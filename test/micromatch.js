var assert = require('assert');
var jp = require('../');

var data = require('./data/store.json');

suite('parse', function() {

  test('micromatch in filter', function() {
    var pathExpression = '$..book[?(@.price<30 && mm.isMatch(@.author, "E*"))]'
    var results = jp.query(data, pathExpression);
    assert.deepEqual(results, [ { category: 'fiction', author: 'Evelyn Waugh', title: 'Sword of Honour', price: 12.99 } ]);
  });

});