function (fn, require, module, exports) {
  module.locals = {};
  module.calls = {};

  module.exec = function(key, fn) {
    if (module.calls[key]) {
      return;
    }

    module.calls[key] = true;
    fn();
  };

  (function handler(require, module, exports) {
    if (module.code === fn.toString()) {
      return;
    }

    fn.call(module, require, module, exports);

    if (!module.code) {
      window.addEventListener('patch', function() {
        handler.call(module, require, module, exports);
      });
    }

    module.code = fn.toString();
  }(require, module, exports));
};
