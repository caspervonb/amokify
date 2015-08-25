var fs = require('fs');
var through = require('through2');

var estemplate = require('estemplate');
var esprima = require('esprima');
var escodegen = require('escodegen');
var estraverse = require('estraverse');

var cache = [];

function wrap() {
  var source = '';

  return through.obj(function(chunk, encoding, next) {
    source += chunk;
    next();
  }, function(done) {
    var ast = esprima.parse(source);

    var node = ast.body[0];
    var expression = node.expression;

    var arguments = expression.arguments;
    var properties = arguments[0].properties.map(function(node) {
      node.rank = cache.indexOf(node.key.value);
      return node;
    }).sort(function(a, b) {
      return a.rank - b.rank;
    });

    var apply = {
      "type": "FunctionDeclaration",
      "id": {
        "type": "Identifier",
        "name": "apply"
      },      "params": [
        {
          "type": "Identifier",
          "name": "modules"
        },
        {
          "type": "Identifier",
          "name": "keys"
        }
      ],
      "defaults": [],
      "body": {
        "type": "BlockStatement",
        "body": properties.reduce(function(expressions, property) {
          expressions.push({
            "type": "IfStatement",
            "test": {
              "type": "UnaryExpression",
              "operator": "!",
              "argument": {
                "type": "MemberExpression",
                "computed": true,
                "object": {
                  "type": "Identifier",
                  "name": "modules"
                },
                "property": property.key,
              },
              "prefix": true
            },
            "consequent": {
              "type": "BlockStatement",
              "body": [
                {
                  "type": "ExpressionStatement",
                  "expression": {
                    "type": "CallExpression",
                    "callee": {
                      "type": "FunctionExpression",
                      "id": null,
                      "params": [],
                      "defaults": [],
                      "body": {
                        "type": "BlockStatement",
                        "body": [
                          {
                            "type": "ExpressionStatement",
                            "expression": {
                              "type": "AssignmentExpression",
                              "operator": "=",
                              "left": {
                                "type": "MemberExpression",
                                "computed": true,
                                "object": {
                                  "type": "Identifier",
                                  "name": "modules"
                                },
                                "property": property.key,
                              },
                              "right": property.value.elements[0],
                            }
                          }
                        ]
                      },
                      "generator": false,
                      "expression": false
                    },
                    "arguments": []
                  }
                }
              ]
            },
            "alternate": null
          });

          expressions.push({
            "type": "ExpressionStatement",
            "expression": {
              "type": "AssignmentExpression",
              "operator": "=",
              "left": {
                "type": "MemberExpression",
                "computed": true,
                "object": {
                  "type": "Identifier",
                  "name": "keys"
                },
                "property": property.key,
              },
              "right": property.value.elements[1],
            }
          });

          return expressions;
        }, []),
      },
    };


    cache = properties.map(function(property) {
      return property.key.value;
    });

    ast = estemplate(fs.readFileSync(__dirname + '/prelude.js', 'utf-8'), {
      apply: apply,
      entries: arguments[2],
    });

    var output = escodegen.generate(ast);

    this.push(output);
    done();
  });
}

module.exports = wrap;
