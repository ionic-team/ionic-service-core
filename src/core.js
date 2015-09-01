if (typeof ionic === 'undefined') { window.ionic = {}; }

(function() {

  var ionic = window.ionic;
  var IonicPromise = require("es6-promise").Promise;
  var request = require("browser-request");

  class APIRequest {
    constructor(options) {
      var p = new IonicPromise(function(resolve, reject) {
        request(options, function(err, response, result) {
          if (err) {
            reject(err);
          } else {
            if (response.statusCode < 200 || response.statusCode >= 400) {
              var _err = new Error("Request Failed with status code of " + response.statusCode);
              reject(_err);
            } else {
              resolve({ 'response': response, 'payload': result });
            }
          }
        });
      });
      return p;
    }
  }

  class DeferredPromise {
    constructor() {
      var self = this;
      this._update = false;
      this.promise = new IonicPromise(function(resolve, reject) {
        self.resolve = resolve;
        self.reject = reject;
      });
      var originalThen = this.promise.then;
      this.promise.then = function(ok, fail, update) {
        self._update = update;
        return originalThen.call(self.promise, ok, fail);
      };
    }

    notify(value) {
      if (this._update && (typeof this._update === 'function')) {
        this._update(value);
      }
    }
  }

  class IonicIOCore {
    constructor() {
      var self = this;
      console.log('Ionic Core: init');
      this.modules = {};
      this._pluginsReady = false;
      this._emitter = this.events;

      try {
        document.addEventListener("deviceready", function() {
          console.log('Ionic Core: plugins are ready');
          self._pluginsReady = true;
          self._emitter.emit('ionic_core:plugins_ready');
        }, false);
      } catch(e) {
        console.log('Ionic Core: unable to listen for cordova plugins to be ready');
      }
    }

    _basicModuleInit(name, module) {
      if (typeof this.modules[name] === 'undefined') {
        this.modules[name] = new module(); // eslint-disable-line new-cap
      }
      return this.modules[name];
    }

    get push() {
      return this._basicModuleInit('push', ionic.io.push.PushService);
    }

    get deploy() {
      return this._basicModuleInit('deploy', ionic.io.deploy.DeployService);
    }

    get settings() {
      return this._basicModuleInit('settings', ionic.io.core.Settings);
    }

    get storage() {
      return this._basicModuleInit('storage', ionic.io.core.Storage);
    }

    get users() {
      return this._basicModuleInit('user', ionic.io.core.UserInterface);
    }

    get events() {
      return this._basicModuleInit('events', ionic.io.util.Events);
    }

    _isCordovaAvailable() {
      console.log('Ionic Core: searching for cordova.js');

      if (typeof cordova !== 'undefined') {
        console.log('Ionic Core: cordova.js has already been loaded');
        return true;
      }

      var scripts = document.getElementsByTagName('script');
      var len = scripts.length;
      for (var i = 0; i < len; i++) {
        var script = scripts[i].getAttribute('src');
        if (script) {
          var parts = script.split('/');
          var partsLength = 0;
          try {
            partsLength = parts.length;
            if (parts[partsLength - 1] === 'cordova.js') {
              console.log('Ionic Core: cordova.js has previously been included.');
              return true;
            }
          } catch(e) {
            console.log('Ionic Core: encountered error while testing for cordova.js presence, ' + e.toString());
          }
        }
      }

      return false;
    }

    loadCordova() {
      if (!this._isCordovaAvailable()) {
        var cordovaScript = document.createElement('script');
        var cordovaSrc = 'cordova.js';
        switch (this.getDeviceTypeByNavigator()) {
          case 'android':
            if (window.location.href.substring(0, 4) === "file") {
              cordovaSrc = 'file:///android_asset/www/cordova.js';
            }
            break;

          case 'ipad':
          case 'iphone':
            try {
              var resource = window.location.search.match(/cordova_js_bootstrap_resource=(.*?)(&|#|$)/i);
              if (resource) {
                cordovaSrc = decodeURI(resource[1]);
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
        cordovaScript.setAttribute('src', cordovaSrc);
        document.head.appendChild(cordovaScript);
        console.log('Ionic Core: injecting cordova.js');
      }
    }

    /**
     * Determine the device type via the user agent string
     * @return {string} name of device platform or "unknown" if unable to identify the device
     */
    getDeviceTypeByNavigator() {
      var agent = navigator.userAgent;

      var ipad = agent.match(/iPad/i);
      if (ipad && (ipad[0].toLowerCase() === 'ipad')) {
        return 'ipad';
      }

      var iphone = agent.match(/iPhone/i);
      if (iphone && (iphone[0].toLowerCase() === 'iphone')) {
        return 'iphone';
      }

      var android = agent.match(/Android/i);
      if (android && (android[0].toLowerCase() === 'android')) {
        return 'android';
      }

      return "unknown";
    }

    /**
     * Check if the device is an Android device
     * @return {boolean} True if Android, false otherwise
     */
    isAndroidDevice() {
      var device = this.getDeviceTypeByNavigator();
      if (device === 'android') {
        return true;
      }
      return false;
    }

    /**
     * Check if the device is an iOS device
     * @return {boolean} True if iOS, false otherwise
     */
    isIOSDevice() {
      var device = this.getDeviceTypeByNavigator();
      if (device === 'iphone' || device === 'ipad') {
        return true;
      }
      return false;
    }

    /**
     * Bootstrap Ionic Core
     *
     * Handles the cordova.js bootstrap
     * @return {void}
     */
    bootstrap() {
      this.loadCordova();
    }

    /**
     * Fire a callback when core + plugins are ready. This will fire immediately if
     * the components have already become available.
     *
     * @param {function} callback function to fire off
     * @return {void}
     */
    onReady(callback) {
      var self = this;
      if (this._pluginsReady) {
        callback(self);
      } else {
        self._emitter.on('ionic_core:plugins_ready', function() {
          callback(self);
        });
      }
    }
  }

  if (typeof ionic.io === 'undefined') { ionic.io = {}; }

  ionic.io.register = function(namespace, context) {
    context = context || ionic.io;
    var namespaces = namespace.split(".");
    var len = namespaces.length;
    for (var i = 0; i < len; i++) {
      if (i > 0) {
        context = context[namespace];
      }
      namespace = namespaces[i];
      if ('undefined' === typeof context[namespace]) { context[namespace] = {}; }
    }
    return context;
  };

  // Main user interface
  ionic.io.init = function() {
    if (typeof ionic.io.core.main === 'undefined') {
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
