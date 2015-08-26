var fs = require('fs');
var through = require('through2');

var estemplate = require('estemplate');
var esprima = require('esprima');
var escodegen = require('escodegen');
var estraverse = require('estraverse');

var cache = [];

function wrap() {
  console.log('order: ', cache);
  var source = '';

  return through.obj(function(chunk, encoding, next) {
    source += chunk;
    next();
  }, function(done) {
    var ast = esprima.parse(source);

    var node = ast.body[0];
    var expression = node.expression;

    var modules = {
      'type': 'ObjectExpression',
      'properties': expression.arguments[0].properties.map(function(node, index) {
        return {
          type: node.type,
          key: node.key,
          value: node.value.elements[0],
        };
      }).sort(function(a, b) {
        if (cache.indexOf(a.key.value) < cache.indexOf(b.key.value)) {
          return -1;
        }

        return 0;
      }),
    };

    cache = modules.properties.map(function(property) {
      return property.key.value;
    });

    var resolves = {
      'type': 'ObjectExpression',
      'properties': expression.arguments[0].properties.map(function(node, index) {
        return {
          type: node.type,
          key: node.key,
          value: node.value.elements[1],
        };
      }),
    };

    var arguments = expression.arguments.slice(1);

    ast = estemplate(fs.readFileSync(__dirname + '/prelude.js', 'utf-8'), {
      modules: modules,
      resolves: resolves,
      arguments: arguments,
    });

    var output = escodegen.generate(ast);

    this.push(output);
    done();
  });
}

module.exports = wrap;
