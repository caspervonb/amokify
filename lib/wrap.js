var fs = require('fs');
var through = require('through2');

var prelude = fs.readFileSync(__dirname + '/_prelude.js');

// XXX this is brittle, but its faster than parsing the AST.
function wrap() {
  var first = true;
  return through.obj(function(chunk, encoding, next) {
    chunk = chunk.toString('utf-8');

    if (first) {
      chunk = 'require=' +
        chunk.replace(/t\[o\]/g, 't()[o]')
             .replace('s})({', 's})(function(){return {');

      chunk = 'hot=' + prelude + '\n' + chunk;
    } else {

      chunk = chunk.replace('},{},[', '}; /* END OF RETURN */},{},[');
    }

    first = false;
    this.push(chunk);
    next();
  }, function(done) {
    done();
  });
}

module.exports = wrap;
