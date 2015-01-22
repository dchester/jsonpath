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
$                | the root object/element
@                | the current object/element
.                | child member operator
..	         | recursive descendant operator; JSONPath borrows this syntax from E4X
*	         | wildcard matching all objects/elements regardless their names
[]	         | subscript operator
[,]	         | union operator for alternate names or array indices as a set
[start:end:step] | array slice operator borrowed from ES4 / python
?()              | applies a filter (script) expression via static evaluation
()	         | script expression via static evaluation 


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

- final `step` arguments in slice operators may be negative
- script expressions may contain `@` characters not referring to instance variables
- subscript operators may be single-quoted


## License

MIT

