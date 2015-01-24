# json-path

Query JavaScript objects with JSONPath expressions.  Robust / safe JSONPath engine for Node.js.


## Query Example

```javascript
var cities = [
  { name: "London", "population": 8615246 },
  { name: "Berlin", "population": 3517424 },
  { name: "Madrid", "population": 3165235 },
  { name: "Rome",   "population": 2870528 }
];

var jp = require('json-path');
var names = jp.query(cities, '$..name');

// [ "London", "Berlin", "Madrid", "Rome" ]
```

## JSONPath Syntax

Here are syntax and examples adapted from [Stefan Goessner's original post](http://goessner.net/articles/JsonPath/) introducing JSONPath in 2007.

JSONPath         | Description
-----------------|------------
$                | The root object/element
@                | The current object/element
.                | Child member operator
..	         | Recursive descendant operator; JSONPath borrows this syntax from E4X
\*	         | Wildcard matching all objects/elements regardless their names
[]	         | Subscript operator
[,]	         | Union operator for alternate names or array indices as a set
[start:end:step] | Array slice operator borrowed from ES4 / Python
?()              | Applies a filter (script) expression via static evaluation
()	         | Script expression via static evaluation 

Given this sample data set, see example expressions below:

```
{
  "store": {
    "book": [ 
      {
        "category": "reference",
        "author": "Nigel Rees",
        "title": "Sayings of the Century",
        "price": 8.95
      }, {
        "category": "fiction",
        "author": "Evelyn Waugh",
        "title": "Sword of Honour",
        "price": 12.99
      }, {
        "category": "fiction",
        "author": "Herman Melville",
        "title": "Moby Dick",
        "isbn": "0-553-21311-3",
        "price": 8.99
      }, {
         "category": "fiction",
        "author": "J. R. R. Tolkien",
        "title": "The Lord of the Rings",
        "isbn": "0-395-19395-8",
        "price": 22.99
      }
    ],
    "bicycle": {
      "color": "red",
      "price": 19.95
    }
  }
}
```

Example JSONPath expressions:

JSONPath                      | Description
------------------------------|------------
$.store.book[\*].author       | The authors of all books in the store
$..author                     | All authors
$.store.\*                    | All things in store, which are some books and a red bicycle
$.store..price                | The price of everything in the store
$..book[2]                    | The third book via array subscript
$..book[(@.length-1)]         | The third book via script subscript
$..book[-1:]                  | The last book in order
$..book[0,1]                  | The first two books via subscript union
$..book[:2]                   | The first two books via subscript array slice
$..book[?(@.isbn)]            | Filter all books with isbn number
$..book[?(@.price<10)]        | Filter all books cheapier than 10
$..\*                         | All members of JSON structure


## Methods

#### jp.query(obj, pathExpression)

Find elements in `obj` matching `pathExpression`.  Returns an array of elements that satisfy the provided JSONPath expression, or an empty array if none were matched.

```javascript
var authors = jp.query(data, '$..author');
// [ 'Nigel Rees', 'Evelyn Waugh', 'Herman Melville', 'J. R. R. Tolkien' ]
```

#### jp.paths(obj, pathExpression)

Find elements in `obj` matching `pathExpression`.  Returns an array of element paths that satisfy the provided JSONPath expression. Each path is itself an array of keys representing the location within `obj` of the matching element.

```javascript
var paths = jp.paths(data, '$..author');
// [
//   ['$', 'store', 'book', 0, 'author'] },
//   ['$', 'store', 'book', 1, 'author'] },
//   ['$', 'store', 'book', 2, 'author'] },
//   ['$', 'store', 'book', 3, 'author'] }
// ]
```

#### jp.nodes(obj, pathExpression)

Find elements and their corresponding paths in `obj` matching `pathExpression`.  Returns an array of node objects where each node has a `path` containing an array of keys representing the location within `obj`, and a `value` pointing to the matched element.

```javascript
var nodes = jp.nodes(data, '$..author');
// [
//   { path: ['$', 'store', 'book', 0, 'author'], value: 'Nigel Rees' },
//   { path: ['$', 'store', 'book', 1, 'author'], value: 'Evelyn Waugh' },
//   { path: ['$', 'store', 'book', 2, 'author'], value: 'Herman Melville' },
//   { path: ['$', 'store', 'book', 3, 'author'], value: 'J. R. R. Tolkien' }
// ]
```

#### jp.parse(pathExpression)

Parse the provided JSONPath expression into path components and their associated operations.

```javascript
var path = jp.parse('$..author');
// [
//   { expression: { type: 'root', value: '$' } },
//   { expression: { type: 'identifier', value: 'author' }, operation: 'member', scope: 'descendant' }
// ]
```


## Differences from Original Implementation

This implementation aims to be compatible with Stefan Goessner's original implementation with a few notable exceptions described below.

### Evaluating Script Expressions

Script expressions (i.e, `(...)` and `?(...)`) are statically evaluated via [static-eval](https://github.com/substack/static-eval) rather than using the underlying script engine directly.  That means both that the scope is limited to the instance variable (`@`), and only simple expressions (with no side effects) will be valid.  So for example, `?(@.length>10)` will be just fine to match arrays with more than ten elements, but `?(process.exit())` will not get evaluated since `process` would yield a `ReferenceError`.  This method is even safer than `vm.runInNewContext`, since the script engine itself is more limited and entirely distinct from the one running the application ocde.  See more details in the [implementation](https://github.com/substack/static-eval/blob/master/index.js) of the evaluator.

### Grammar

This project uses a formal BNF grammar to parse JSONPath expressions, an attempt at reverse-engineering the intent of the original implementation, which parses via a series of creative regular expressions.  The regex approach can sometimes be forgiving for better or for worse (e.g., `$['store]` => `$['store']`), and in other cases, can be just plain wrong (e.g. `[` => `$`). 

### Other Minor Differences

As a result of using a real parser and static evaluation, there are some arguable bugs in the original library that have not been carried through here:

- strings in subscripts may now be double-quoted
- final `step` arguments in slice operators may now be negative
- script expressions may now contain `.` and `@` characters not referring to instance variables
- subscripts no longer act as character slices on string elements
- non-asci non-word characters are no-longer valid in member identifier names; use quoted subscript strings instead (e.g., `$['$']` instead of `$.$`)
- unions now yield real unions with no duplicates rather than concatenated results

## License

MIT

