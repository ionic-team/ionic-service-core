if (typeof Ionic === 'undefined') { window.Ionic = {}; }

(function() {

  // Provider a single storage for services that have previously been registered
  var serviceStorage = {};

  Ionic.io = function() {
    if (typeof Ionic.IO.main === 'undefined') {
      Ionic.IO.main = new Ionic.IO.Core();
    }
    return Ionic.IO.main;
  };

  Ionic.getService = function(name) {
    if (typeof serviceStorage[name] === 'undefined' || !serviceStorage[name]) {
      return false;
    }
    return serviceStorage[name];
  };

  Ionic.addService = function(name, service, force) {
    if (service && typeof serviceStorage[name] === 'undefined') {
      serviceStorage[name] = service;
    } else if (service && force) {
      serviceStorage[name] = service;
    }
  };

  Ionic.removeService = function(name) {
    if (typeof serviceStorage[name] !== 'undefined') {
      delete serviceStorage[name];
    }
  };

  Ionic.namespace = function(namespace, name, cls, context) {
    context = context || Ionic;
    var namespaces = namespace.split(".");
    var len = namespaces.length;
    for (var i = 0; i < len; i++) {
      if (i > 0) {
        context = context[namespace];
      }
      namespace = namespaces[i];
      if ('undefined' === typeof context[namespace]) { context[namespace] = {}; }
    }
    context[namespace][name] = cls;
    return context;
  };

})();
