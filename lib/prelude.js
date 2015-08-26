(function(cache, entries) {
  function require(name) {
    if (cache[name]) {
      return cache[name].exports;
    }

    var modules = <%= modules %>

    if(!modules[name]) {
      var error = new Error('Cannot find module \'' + name + '\'');
      throw error;
    }

    function resolve(name, key) {
      var resolves = <%= resolves %>[name];
      if (resolves) {
        return resolves[key];
      }
    }

    var module = {
      locals: {},
      exports: {},
      identities: {},
      exec: function(id, fn) {
        if (!module.identities[id]) {
          module.identities[id] = fn;
          fn();
        }
      },
    };

    cache[name] = module;

    var fn = modules[name].bind(module.exports, function(key) {
      console.log('resolving module ' + name);
      var id = resolve(name, key);
      return require(id ? id : key);
    }, module, module.exports);

    fn();

    var source = modules[name].toString();
    addEventListener('patch', function() {
      if (source !== modules[name].toString()) {
        fn();
      }

      source = modules[name].toString();
    });
  }

  entries.forEach(require);
  return require;
}(%= arguments %));
