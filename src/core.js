(function() {

  var IonicPromise = require("es6-promise").Promise;
  var request = require("browser-request");

  class APIRequest {
    constructor(options) {
      var p = new IonicPromise(function(resolve, reject) {
        request(options, function(err, response, result) {
          if(err) {
            reject(err);
          } else {
            if (response.statusCode < 200 || response.statusCode >= 300) {
              var err = new Error("Request Failed with status code of " + response.statusCode);
              reject(err);
            } else {
              resolve({'response': response, 'payload': result});
            }
          }
        });
      });
      return p;
    }
  };

  class DeferredPromise {
    constructor() {
      var self = this;
      this.promise = new IonicPromise(function(resolve, reject) {
        self.resolve = resolve;
        self.reject = reject;
      });
    }
  }

  class IonicIOCore {
    constructor() {
      console.log('Ionic Core: init');
      this.modules = {};
    }

    _basicModuleInit(name, module) {
      if(typeof this.modules[name] === 'undefined') {
        this.modules[name] = new module();
      }
      return this.modules[name];
    }

    get push() {
      return this._basicModuleInit('push', ionic.io.push.PushService);
    }

    get settings() {
      return this._basicModuleInit('settings', ionic.io.core.Settings);
    }

    get storage() {
      return this._basicModuleInit('storage', ionic.io.core.Storage);
    }

    get user() {
      return this._basicModuleInit('user', ionic.io.core.UserInterface);
    }

    get events() {
      return this._basicModuleInit('events', ionic.io.util.Events);
    }

    _is_cordova_available() {
      console.log('Ionic Core: searching for cordova.js');

      try {
        if (window.cordova || cordova) {
          console.log('Ionic Core: cordova.js has already been loaded');
          return true;
        }
      } catch(e) {}

      var scripts = document.getElementsByTagName('script');
      var len = scripts.length;
      for(var i = 0; i < len; i++) {
        var script = scripts[i].getAttribute('src');
        if(script) {
          var parts = script.split('/');
          var partsLength = 0;
          try {
            partsLength = parts.length;
            if (parts[partsLength-1] === 'cordova.js') {
              console.log('Ionic Core: cordova.js has previously been included.');
              return true;
            }
          } catch(e) {}
        }
      }

      return false;
    };

    loadCordova() {
      if(!this._is_cordova_available()) {
        var cordova_script = document.createElement('script');
        var cordova_src = 'cordova.js';
        switch(this.getDeviceTypeByNavigator()) {
          case 'android':
            if (window.location.href.substring(0, 4) === "file") {
              cordova_src = 'file:///android_asset/www/cordova.js';
            }
            break;

          case 'ipad':
          case 'iphone':
            try {
              var resource = window.location.search.match(/cordova_js_bootstrap_resource=(.*?)(&|#|$)/i);
              if (resource) {
                cordova_src = decodeURI(resource[1]);
              }
            } catch(e) {
              console.log('Could not find cordova_js_bootstrap_resource query param');
              console.log(e);
            }
            break;

          case 'unknown':
            return false;

          default:
            break;
        }
        cordova_script.setAttribute('src', cordova_src);
        document.head.appendChild(cordova_script);
        console.log('Ionic Core: injecting cordova.js');
      }
    };

    getDeviceTypeByNavigator() {
      return (navigator.userAgent.match(/iPad/i))  == "iPad" ? "ipad" : (navigator.userAgent.match(/iPhone/i))  == "iPhone" ? "iphone" : (navigator.userAgent.match(/Android/i)) == "Android" ? "android" : (navigator.userAgent.match(/BlackBerry/i)) == "BlackBerry" ? "blackberry" : "unknown";
    };

    bootstrap() {
      this.loadCordova();
    };
  }

  if((typeof ionic == 'undefined')) { ionic = {}; }
  if((typeof ionic.io == 'undefined')) { ionic.io = {}; }

  ionic.io.register = function(namespace, context) {
    context = context || ionic.io;
    var namespaces = namespace.split(".");
    var len = namespaces.length;
    for(var i = 0; i < len; i++) {
      if(i > 0) {
        context = context[namespace];
      }
      namespace = namespaces[i];
      try {
        if('undefined' === typeof context[namespace]) { context[namespace] = {}; }
      } catch(e) {}
    }
    return context;
  };

  // Main user interface
  ionic.io.init = function() {
    if(typeof ionic.io.core.main === 'undefined') {
      ionic.io.core.main = new IonicIOCore();
    }
    return ionic.io.core.main;
  };

  ionic.io.register('core');
  ionic.io.register('util');

  ionic.io.util.Promise = IonicPromise;
  ionic.io.util.DeferredPromise = DeferredPromise;
  ionic.io.util.ApiRequest = APIRequest;

})();
