# json-path

Query JavaScript objects with JSONPath expressions.  Robust / safe JSONPath engine for Node.js.


## Query Example

```javascript
var store = {
  books: [
    { "author": "Nigel Rees",       "title": "Sayings of the Century" },
    { "author": "Evelyn Waugh",     "title": "Sword of Honour" },
    { "author": "Herman Melville",  "title": "Moby Dick" },
    { "author": "J. R. R. Tolkien", "title": "The Lord of the Rings" }
  ]
};

var jp = require('json-path');
var authors = jp.query(books, '$..author');

// [ 'Nigel Rees', 'Evelyn Waugh', 'Herman Melville', 'J. R. R. Tolkien' ]
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

#### jp.paths(obj, pathExpression)

Find elements in `obj` matching `pathExpression`.  Returns an array of element paths that satisfy the provided JSONPath expression. Each path is itself an array of keys representing the location within `obj` of the matching element.

#### jp.nodes(obj, pathExpression)

Find elements and their corresponding paths in `obj` matching `pathExpression`.  Returns an array of node objects where each node has a `path` containing an array of keys representing the location within `obj`, and a `value` pointing to the matched element.

#### jp.parse(pathExpression)

Parse the provided JSONPath expression into path components and their associated operations.

## Evaluating Script Expressions

This implementation aims to be equivalent with Stefan Goessner's original implementation with the notable exception that script expressions are statically evaluated rather than using the underlying (Node.js) script engine directly.  That means both that the scope is limited to the instance variable, and only a subset of operations are available.  See more at `static-eval`.

 
## Differences from Original Implementation

While this implementation aims to be mostly equivalent to Stefan Goessner's original implementation, in addition to the difference in script evaluation mentioned above, there are also some arguable bugs in the original library that have not been carried through here:

- final `step` arguments in slice operators may now be negative
- script expressions may now contain `@` characters not referring to instance variables
- subscript operators may now be double-quoted


## License

MIT

