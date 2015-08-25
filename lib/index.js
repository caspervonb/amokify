var transform = require('./transform');
var wrap = require('./wrap');

function plugin(bundler, options) {
  bundler.transform(transform);

  bundler.pipeline.get('wrap').push(wrap());
  bundler.on('reset', function() {
    bundler.pipeline.get('wrap').push(wrap());
  });
}

module.exports = plugin;
