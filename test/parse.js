var assert = require('assert');
var JSONPath = require('../');
var jp;

suite('json-path-parse', function() {

  setup(function() {
    jp = new JSONPath;
  });

  test('should parse root-only', function() {
    var tree = jp.parse('$');
    assert.deepEqual(tree.root_element, "$");
  });

  test('parse path for the authors of all books in the store', function() {
    var path = jp.parse('$.store.book[*].author');
    assert.deepEqual(path.components, [
      { operation: 'member', scope: 'child', expression: { type: 'identifier', value: 'store' } },
      { operation: 'member', scope: 'child', expression: { type: 'identifier', value: 'book' } },
      { operation: 'subscript', scope: 'child', expression: { type: 'wildcard' } },
      { operation: 'member', scope: 'child', expression: { type: 'identifier', value: 'author' } }
    ])
  });

  test('parse path for all authors', function() {
    var path = jp.parse('$..author');
    assert.deepEqual(path.components, [
      { operation: 'member', scope: 'descendant', expression: { type: 'identifier', value: 'author' } }
    ])
  });

  test('parse path for all things in store', function() {
    var path = jp.parse('$.store.*');
    assert.deepEqual(path.components, [
      { operation: 'member', scope: 'child', expression: { type: 'identifier', value: 'store' } },
      { operation: 'member', scope: 'child', expression: { type: 'wildcard' } }
    ])
  });

  test('parse path for price of everything in the store', function() {
    var path = jp.parse('$.store..price');
    assert.deepEqual(path.components, [
      { operation: 'member', scope: 'child', expression: { type: 'identifier', value: 'store' } },
      { operation: 'member', scope: 'descendant', expression: { type: 'identifier', value: 'price' } }
    ])
  });

  test('parse path for the last book in order via expression', function() {
    var path = jp.parse('$..book[(@.length-1)]');
    assert.deepEqual(path.components, [
      { operation: 'member', scope: 'descendant', expression: { type: 'identifier', value: 'book' } },
      { operation: 'subscript', scope: 'child', expression: { type: 'script_expression', value: '(@.length-1)' } }
    ])
  });

  test('parse path for the first two books via union', function() {
    var path = jp.parse('$..book[0,1]');
    assert.deepEqual(path.components, [
      { operation: 'member', scope: 'descendant', expression: { type: 'identifier', value: 'book' } },
      { operation: 'subscript', scope: 'child', expression: { type: 'union', value: [ { type: 'numeric_literal', value: '0' }, { type: 'numeric_literal', value: '1' } ] } }
    ])
  });

  test('parse path for the first two books via slice', function() {
    var path = jp.parse('$..book[0:2]');
    assert.deepEqual(path.components, [
      { operation: 'member', scope: 'descendant', expression: { type: 'identifier', value: 'book' } },
      { operation: 'subscript', scope: 'child', expression: { type: 'slice', value: '0:2' } }
    ])
  });

  test('parse path to filter all books with isbn number', function() {
    var path = jp.parse('$..book[?(@.isbn)]');
    assert.deepEqual(path.components, [
      { operation: 'member', scope: 'descendant', expression: { type: 'identifier', value: 'book' } },
      { operation: 'subscript', scope: 'child', expression: { type: 'filter_expression', value: '?(@.isbn)' } }
    ])
  });

  test('parse path to filter all books with a price less than 10', function() {
    var path = jp.parse('$..book[?(@.price<10)]');
    assert.deepEqual(path.components, [
      { operation: 'member', scope: 'descendant', expression: { type: 'identifier', value: 'book' } },
      { operation: 'subscript', scope: 'child', expression: { type: 'filter_expression', value: '?(@.price<10)' } }
    ])
  });

  test('parse path to match all elements', function() {
    var path = jp.parse('$..*');
    assert.deepEqual(path.components, [
      { operation: 'member', scope: 'descendant', expression: { type: 'wildcard' } }
    ])
  });

});
