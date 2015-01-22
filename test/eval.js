var assert = require('assert');
var JSONPath = require('../');
var jp;

var data = require('./data/store.json');

suite('json-path-eval', function() {

  setup(function() {
    jp = new JSONPath;
  });

  test('authors of all books in the store', function() {
    var results = jp.evaluate(data, '$.store.book[*].author');
    assert.deepEqual(results, [
      'Nigel Rees',
      'Evelyn Waugh',
      'Herman Melville',
      'J. R. R. Tolkien'
    ]);
  });

  test('all authors', function() {
    var results = jp.evaluate(data, '$..author');
    assert.deepEqual(results, [
      'Nigel Rees',
      'Evelyn Waugh',
      'Herman Melville',
      'J. R. R. Tolkien'
    ]);
  });

  test('all things in store', function() {
    var results = jp.evaluate(data, '$.store.*');
    assert.deepEqual(results, [data.store.book, data.store.bicycle]);
  });

  test('price of everything in the store', function() {
    var results = jp.evaluate(data, '$.store..price');
    assert.deepEqual(results, [8.95, 12.99, 8.99, 22.99, 19.95]);
  });

  test('last book in order via expression', function() {
    var results = jp.evaluate(data, '$..book[(@.length-1)]');
    assert.deepEqual(results, [data.store.book[3]]);
  });

  test('first two books via union', function() {
    var results = jp.evaluate(data, '$..book[0,1]');
    assert.deepEqual(results, data.store.book.slice(0,2));
  });

  test('first two books via slice', function() {
    var results = jp.evaluate(data, '$..book[0:2]');
    assert.deepEqual(results, data.store.book.slice(0,2));
  });

  test('filter all books with isbn number', function() {
    var results = jp.evaluate(data, '$..book[?(@.isbn)]');
    assert.deepEqual(results, data.store.book.slice(2));
  });

  test('filter all books with a price less than 10', function() {
    var results = jp.evaluate(data, '$..book[?(@.price<10)]');
    var books = data.store.book;
    assert.deepEqual(results, [books[0], books[2]]);
  });

  test('path to match all elements', function() {
    var results = jp.evaluate(data, '$..*');
    var expected = [
      data.store,
      data.store.book,
      data.store.bicycle,
      data.store.book[0],
      data.store.book[1],
      data.store.book[2],
      data.store.book[3],
      'reference',
      'Nigel Rees',
      'Sayings of the Century',
      8.95,
      'fiction',
      'Evelyn Waugh',
      'Sword of Honour',
      12.99,
      'fiction',
      'Herman Melville',
      'Moby Dick',
      '0-553-21311-3',
      8.99,
      'fiction',
      'J. R. R. Tolkien',
      'The Lord of the Rings',
      '0-395-19395-8',
      22.99,
      'red',
      19.95
    ]
    assert.deepEqual(results, expected);
  });

});

