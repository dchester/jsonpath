var grammar = {
    "lex": {
        "macros": {
            "esc": "\\\\",
            "int": "-?(?:[0-9]|[1-9][0-9]+)",
        },
        "rules": [
            ["\\$", "return 'DOLLAR'"],
            ["\\.\\.$", "return 'DOUBLE_DOT_EOL'"],
            ["\\.\\.", "return 'DOUBLE_DOT'"],
            ["\\.", "return 'DOT'"],
            ["\\*", "return 'STAR'"],
            ["[a-zA-Z]+[a-zA-Z0-9]*", "return 'IDENTIFIER'"],
            ["\\[", "return '['"],
            ["\\]", "return ']'"],
            [",", "return ','"],
            ["({int})?\\:({int})?(\\:({int})?)?", "return 'ARRAY_SLICE'"],
            ["{int}", "return 'INTEGER'"],
            ["\"(?:{esc}[\"bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^\"{esc}])*\"", "yytext = yytext.substr(1,yyleng-2); return 'QQ_STRING';"],
            ["'(?:{esc}[\'bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^\'{esc}])*'", "yytext = yytext.substr(1,yyleng-2); return 'Q_STRING';"],
            ["\\(.+?\\)", "return 'SCRIPT_EXPRESSION'"],
            ["\\?\\(.+?\\)", "return 'FILTER_EXPRESSION'"],
        ]
    },

    "start": "JSONPath",

    "bnf": {
        "JSONPath": [
            [ "RootElement",                 "return $$ = $1;" ],
            [ "RootElement PathExpression",  "$$ = $1; $1.components = $2; return $$" ]
        ],
        "RootElement": [
            [ "DOLLAR",    "$$ = { root_element: $1 }" ]
        ],
        "PathExpression": [
            [ "PathComponent",                 "$$ = [ $1 ]" ],
            [ "PathExpression PathComponent",  "$$ = $1; $1.push( $2 )" ],
        ],
        "PathComponent": [
            [ "DOUBLE_DOT IDENTIFIER",         "$$ = { operation: 'member', scope: 'descendant', expression: { type: 'identifier', value: $2 } }" ],
            [ "DOUBLE_DOT Subscript",          "$$ = { operation: 'subscript', scope: 'descendant', expression: $2 }" ],
            [ "DOUBLE_DOT_EOL",                "$$ = { operation: 'member', scope: 'descendant', expression: { type: 'void' } }", ],
            [ "DOUBLE_DOT STAR",               "$$ = { operation: 'member', scope: 'descendant', expression: { type: 'wildcard' } }", ],
            [ "DOUBLE_DOT SCRIPT_EXPRESSION",  "$$ = { operation: 'member', scope: 'descendant', expression: { type: 'script_expression', value: $2 } }" ],
            [ "DOT IDENTIFIER",                "$$ = { operation: 'member', scope: 'child', expression: { type: 'identifier', value: $2 } }" ],
            [ "DOT STAR",                      "$$ = { operation: 'member', scope: 'child', expression: { type: 'wildcard' } }" ],
            [ "DOT SCRIPT_EXPRESSION",         "$$ = { operation: 'member', scope: 'child', expression: { type: 'script_expression', value: $2 } }" ],
            [ "Subscript",                     "$$ = { operation: 'subscript', scope: 'child', expression: $1 }" ],
	],
        "Subscript": [
            [ "[ SubscriptExpression ]",      "$$ = $2" ],
            [ "[ SubscriptExpressionList ]",  "$$ = $2" ],
        ],
        "SubscriptExpressionList": [
            [ "SubscriptExpression , SubscriptExpression",     "$$ = { type: 'union', value: [ $1, $3 ] }" ],
            [ "SubscriptExpressionList , SubscriptExpression", "$$ = $1; $1.value.push( $3 )" ],
        ],
        "SubscriptExpression": [
            [ "INTEGER",              "$$ = { type: 'numeric_literal', value: $1 }" ],
            [ "ARRAY_SLICE",          "$$ = { type: 'slice', value: $1 }" ],
            [ "STAR",                 "$$ = { type: 'wildcard' }" ],
            [ "SCRIPT_EXPRESSION",    "$$ = { type: 'script_expression', value: $1 }" ],
            [ "StringLiteral",        "$$ = { type: 'string_literal', value: $1 }" ],
            [ "FILTER_EXPRESSION",    "$$ = { type: 'filter_expression', value: $1 }" ],
        ],
        "StringLiteral": [
            [ 'QQ_STRING', "$$ = $1" ],
            [ 'Q_STRING',  "$$ = $1" ],
        ]
    }
};

module.exports = grammar;

