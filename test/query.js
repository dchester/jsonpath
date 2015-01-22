var assert = require('assert');
var JSONPath = require('../');
var jp;

var data = require('./data/store.json');

suite('json-path-query', function() {

  setup(function() {
    jp = new JSONPath;
  });

  test('first-level member', function() {
    var results = jp.nodes(data, '$.store');
    assert.deepEqual(results, [ { path: ['$', 'store'], value: data.store } ]);
  });

  test('authors of all books in the store', function() {
    var results = jp.nodes(data, '$.store.book[*].author');
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book', 0, 'author'], value: 'Nigel Rees' },
      { path: ['$', 'store', 'book', 1, 'author'], value: 'Evelyn Waugh' },
      { path: ['$', 'store', 'book', 2, 'author'], value: 'Herman Melville' },
      { path: ['$', 'store', 'book', 3, 'author'], value: 'J. R. R. Tolkien' }
    ]);
  });

  test('all authors', function() {
    var results = jp.nodes(data, '$..author');
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book', 0, 'author'], value: 'Nigel Rees' },
      { path: ['$', 'store', 'book', 1, 'author'], value: 'Evelyn Waugh' },
      { path: ['$', 'store', 'book', 2, 'author'], value: 'Herman Melville' },
      { path: ['$', 'store', 'book', 3, 'author'], value: 'J. R. R. Tolkien' }
    ]);
  });

  test('all things in store', function() {
    var results = jp.nodes(data, '$.store.*');
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book'], value: data.store.book },
      { path: ['$', 'store', 'bicycle'], value: data.store.bicycle }
    ]);
  });

  test('price of everything in the store', function() {
    var results = jp.nodes(data, '$.store..price');
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book', 0, 'price'], value: 8.95 },
      { path: ['$', 'store', 'book', 1, 'price'], value: 12.99 },
      { path: ['$', 'store', 'book', 2, 'price'], value: 8.99 },
      { path: ['$', 'store', 'book', 3, 'price'], value: 22.99 },
      { path: ['$', 'store', 'bicycle', 'price'], value: 19.95 }
    ]);
  });

  test('last book in order via expression', function() {
    var results = jp.nodes(data, '$..book[(@.length-1)]');
    assert.deepEqual(results, [ { path: ['$', 'store', 'book', 3], value: data.store.book[3] }]);
  });

  test('first two books via union', function() {
    var results = jp.nodes(data, '$..book[0,1]');
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book', 0], value: data.store.book[0] },
      { path: ['$', 'store', 'book', 1], value: data.store.book[1] }
    ]);
  });

  test('first two books via slice', function() {
    var results = jp.nodes(data, '$..book[0:2]');
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book', 0], value: data.store.book[0] },
      { path: ['$', 'store', 'book', 1], value: data.store.book[1] }
    ]);
  });

  test('filter all books with isbn number', function() {
    var results = jp.nodes(data, '$..book[?(@.isbn)]');
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book', 2], value: data.store.book[2] },
      { path: ['$', 'store', 'book', 3], value: data.store.book[3] }
    ]);
  });

  test('filter all books with a price less than 10', function() {
    var results = jp.nodes(data, '$..book[?(@.price<10)]');
    var books = data.store.book;
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book', 0], value: data.store.book[0] },
      { path: ['$', 'store', 'book', 2], value: data.store.book[2] }
    ]);
  });

  test('path to match all elements', function() {
    var results = jp.nodes(data, '$..*');
    assert.deepEqual(results, [
      { path: [ '$', 'store' ], value: data.store },
      { path: [ '$', 'store', 'book' ], value: data.store.book },
      { path: [ '$', 'store', 'bicycle' ], value: data.store.bicycle },
      { path: [ '$', 'store', 'book', 0 ], value: data.store.book[0] },
      { path: [ '$', 'store', 'book', 1 ], value: data.store.book[1] },
      { path: [ '$', 'store', 'book', 2 ], value: data.store.book[2] },
      { path: [ '$', 'store', 'book', 3 ], value: data.store.book[3] },
      { path: [ '$', 'store', 'book', 0, 'category' ], value: 'reference' },
      { path: [ '$', 'store', 'book', 0, 'author' ], value: 'Nigel Rees' },
      { path: [ '$', 'store', 'book', 0, 'title' ], value: 'Sayings of the Century' },
      { path: [ '$', 'store', 'book', 0, 'price' ], value: 8.95 },
      { path: [ '$', 'store', 'book', 1, 'category' ], value: 'fiction' },
      { path: [ '$', 'store', 'book', 1, 'author' ], value: 'Evelyn Waugh' },
      { path: [ '$', 'store', 'book', 1, 'title' ], value: 'Sword of Honour' },
      { path: [ '$', 'store', 'book', 1, 'price' ], value: 12.99 },
      { path: [ '$', 'store', 'book', 2, 'category' ], value: 'fiction' },
      { path: [ '$', 'store', 'book', 2, 'author' ], value: 'Herman Melville' },
      { path: [ '$', 'store', 'book', 2, 'title' ], value: 'Moby Dick' },
      { path: [ '$', 'store', 'book', 2, 'isbn' ], value: '0-553-21311-3' },
      { path: [ '$', 'store', 'book', 2, 'price' ], value: 8.99 },
      { path: [ '$', 'store', 'book', 3, 'category' ], value: 'fiction' },
      { path: [ '$', 'store', 'book', 3, 'author' ], value: 'J. R. R. Tolkien' },
      { path: [ '$', 'store', 'book', 3, 'title' ], value: 'The Lord of the Rings' },
      { path: [ '$', 'store', 'book', 3, 'isbn' ], value: '0-395-19395-8' },
      { path: [ '$', 'store', 'book', 3, 'price' ], value: 22.99 },
      { path: [ '$', 'store', 'bicycle', 'color' ], value: 'red' },
      { path: [ '$', 'store', 'bicycle', 'price' ], value: 19.95 }
    ]);
  });
});

