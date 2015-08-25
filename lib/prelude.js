(function() {
  var modules = {};
  var keys = {};
  var cache = {};

  <%= apply %>

  function get(id) {
    if (cache[id]) {
      return cache[id];
    }

    apply(modules, keys);

    if (!modules[id]) {
      throw new Error('Can\'t find module \'' + id + '\'' );
    }

    cache[id] = {
      exports: {},
      locals: {},
      keys: {},
      exec: function(key, fn) {
        if (!cache[id].keys[key]) {
          fn();
          cache[id].keys[key] = true;
        }
      }
    };

    modules[id].call(cache[id].exports, function(x) {
      var y = keys[id][x];
      return get(y ? y : x);
    }, cache[id], cache[id].exports);

    addEventListener('patch', function() {
      modules[id].call(cache[id].exports, function(x) {
        apply(modules, keys);
        var y = keys[id][x];
        return get(y ? y : x);
      }, cache[id], cache[id].exports);
    });

    return cache[id].exports;
  }

  var entries = <%= entries %>;
  entries.forEach(get);

  return get;
}());
