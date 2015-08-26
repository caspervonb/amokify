var through = require('through2');
var crypto = require('crypto');

var fs = require('fs');
var path = require('path');

var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require('escodegen');

var cache = {};

function transform(filename, options) {
  if (!cache[filename]) {
    cache[filename] = {
      identities: {},
      counter: 0,
    };
  }

  var source = '';
  return through(function(chunk, encoding, next) {
    source += chunk;
    next();
  }, function(done) {
    var ast = esprima.parse(source, {
      source: filename,
    });

    var scopes = [];
    ast = estraverse.replace(ast, {
      enter: function(node, parent) {
        if (node.type.match(/Declarator|Declaration/) && node.id) {
          scopes[scopes.length - 1].push(node.id.name);
        }

        if (node.type.match(/Program|Function/)) {
          scopes.push([]);
        }

        if (node.type.match(/Function/)) {
          scopes[scopes.length - 1].concat(node.params.map(function(param) {
            return param.name;
          }));
        }
      },

      leave: function(node, parent) {
        if (node.type.match(/Program|Function/)) {
          scopes.pop();
        }

        if (node.type === 'VariableDeclaration' && scopes.length === 1) {
          return {
            'type': 'ExpressionStatement',
            'expression': {
              'type': 'SequenceExpression',
              'expressions': node.declarations,
            }
          };
        }

        if (node.type === 'VariableDeclarator' && scopes.length === 1) {
          return {
            'type': 'ExpressionStatement',
            'expression': {
              'type': 'AssignmentExpression',
              'operator': '=',
              'left': node.id,
              'right': node.init,
            },
          };
        }

        if (node.type === 'FunctionDeclaration' && scopes.length === 1) {
          return {
            'type': 'ExpressionStatement',
            'expression': {
              'type': 'AssignmentExpression',
              'operator': '=',
              'left': node.id,
              'right': {
                'type': 'FunctionExpression',
                'id': node.id.property,
                'params': node.params,
                'defaults': node.defaults,
                'body': node.body,
                'generator': node.generator,
                'expression': node.expression
              },
            },
          };
        }

        if (node.type === 'Identifier') {
          if (parent.type === 'MemberExpression' && parent.object !== node) {
            return;
          }

          if (parent.type === 'FunctionDeclaration' && scopes.length !== 2) {
            return;

            if (parent.id !== node) {
              return;
            }
          }

          if (parent.type === 'VariableDeclarator' && scopes.length !== 1) {
            return;
          }

          var match = scopes.filter(function(scope) {
            return scope.indexOf(node.name) > -1;
          }).map(function(scope) {
            return scopes.indexOf(scope);
          }).reverse();

          if (match[0] !== 0) {
            return;
          }

          return {
            'type': 'MemberExpression',
            'object': {
              'type': 'MemberExpression',
              'object': {
                'type': 'Identifier',
                'name': 'module'
              },
              'property': {
                'type': 'Identifier',
                'name': 'locals'
              }
            },
            'property': node
          };
        }
      },
    });

    var identities = {};
    ast = estraverse.replace(ast, {
      enter: function(node) {
        if (node.type.match(/Function/)) {
          this.skip();
        }
      },

      leave: function(node, parent) {
        if (node.type !== 'ExpressionStatement' || parent.type !== 'Program') {
          return;
        }

        var identity = JSON.stringify(node, [
          'id',
          'type',
          'name',

          'expression',
          'operator',
          'left',
          'right',

          'callee',
          'arguments',
          'params',

          'value',
          'raw',
        ]);

        var keys = Object.keys(cache[filename].identities).filter(function(key) {
          return cache[filename].identities[key] === identity;
        });

        if (keys.length > 0) {
          var key = keys[0];
          delete cache[filename].identities[key];
        } else {
          var key = cache[filename].counter++;
        }

        identities[key] = identity;

        return {
          'type': 'ExpressionStatement',
          'expression': {
            'type': 'CallExpression',
            'callee': {
              'type': 'MemberExpression',
              'object': {
                'type': 'Identifier',
                'name': 'module'
              },
              'property': {
                'type': 'Identifier',
                'name': 'exec'
              }
            },
            'arguments': [
              {
                'type': 'Literal',
                'value': key,
              },
              {
                'type': 'FunctionExpression',
                'id': null,
                'params': [],
                'defaults': [],
                'body': {
                  'type': 'BlockStatement',
                  'body': [node]
                },
                'generator': false,
                'expression': false
              }
            ]
          }
        };
      }
    });

    cache[filename].identities = identities;
    var output = escodegen.generate(ast, {
      sourceMap: true,
      sourceMapWithCode: true
    });

    this.push(output.code);

    done();
  });
}

module.exports = transform;
