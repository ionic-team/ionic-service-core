/**
 * Ionic Core Module
 * Copyright 2015 Ionic http://ionicframework.com/
 * See LICENSE in this repository for license information
 */

angular.module('ionic.service.core', [])

/**
 * A core Ionic account identity provider.
 *
 * Usage:
 * angular.module('myApp', ['ionic', 'ionic.service.core'])
 * .config(['$ionicAppProvider', function($ionicAccountProvider) {
 *   $ionicAppProvider.identify({
 *     app_id: 'x34dfxjydi23dx'
 *   });
 * }]);
 */
.provider('$ionicApp', ['$httpProvider', function($httpProvider) {
  var app = {};

  var settings = {
    'api_server': 'https://apps.ionic.io',
    'push_api_server': 'https://push.ionic.io',
    'analytics_api_server': 'https://analytics.ionic.io'
  };

  var _is_cordova_available = function() {

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

  this.identify = function(opts) {
  if (!opts.gcm_id){
    opts.gcm_id = 'None';
  }
    app = opts;
  };

  /**
   * Set a config property.
   */
  this.set = function(k, v) {
    settings[k] = v;
  };

  this.setApiServer = function(server) {
    settings.api_server = server;
  };

  this.$get = [function() {
    return {
      getId: function() {
        return app.app_id;
      },
      getGcmId: function(){
        return app.gcm_id;
      },
      getValue: function(k) {
        return settings[k];
      },
      getApiUrl: function() {
        return this.getValue('api_server');
      },
      getApiKey: function() {
        return app.api_key;
      },
      getApiEndpoint: function(service) {
        var app = this.getApp();
        if(!app) return null;

        return this.getApiUrl() + '/api/v1/' + app.app_id + '/' + service;
      },

      /**
       * Get the registered app for all commands.
       */
      getApp: function() {
        return app;
      },

      getDeviceTypeByNavigator: function() {
        return (navigator.userAgent.match(/iPad/i))  == "iPad" ? "ipad" : (navigator.userAgent.match(/iPhone/i))  == "iPhone" ? "iphone" : (navigator.userAgent.match(/Android/i)) == "Android" ? "android" : (navigator.userAgent.match(/BlackBerry/i)) == "BlackBerry" ? "blackberry" : "unknown";
      },

      loadCordova: function() {
        if(!_is_cordova_available()) {
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
      },

      bootstrap: function() {
        this.loadCordova();
      }
    }
  }];
}])

.run(['$ionicApp', function($ionicApp) {
  console.log('Ionic Core: init');
  $ionicApp.bootstrap();
}]);

(function() {
  
  angular.module('ionic.service.core')

  /**
   * @private
   * Provides a safe interface to store objects in persistent memory
   */
  .provider('persistentStorage', function() {
    return {
      $get: ['$q', '$window', function($q, $window) {
        var objectCache = {};
        var memoryLocks = {};

        var persistenceStrategy = {
          get: function(key) {
            return $window.localStorage.getItem(key);
          },
          remove: function(key) {
            return $window.localStorage.removeItem(key);
          },
          set: function(key, value) {
            return $window.localStorage.setItem(key, value);
          }
        };

        return {
          /**
           * Stores an object in local storage under the given key
          */
          storeObject: function(key, object) {

            // Convert object to JSON and store in localStorage
            var json = JSON.stringify(object);
            persistenceStrategy.set(key, json);

            // Then store it in the object cache
            objectCache[key] = object;
          },

          /**
           * Either retrieves the cached copy of an object,
           * or the object itself from localStorage.
           * Returns null if the object couldn't be found.
          */
          retrieveObject: function(key) {

            // First check to see if it's the object cache
            var cached = objectCache[key];
            if (cached) {
              return cached;
            }

            // Deserialize the object from JSON
            var json = persistenceStrategy.get(key);

            // null or undefined --> return null.
            if (json == null) {
              return null;
            }

            try {
              return JSON.parse(json);
            } catch (err) {
              return null;
            }
          },

          /**
           * Locks the async call represented by the given promise and lock key.
           * Only one asyncFunction given by the lockKey can be running at any time.
           *
           * @param lockKey should be a string representing the name of this async call.
           *        This is required for persistence.
           * @param asyncFunction Returns a promise of the async call.
           * @returns A new promise, identical to the one returned by asyncFunction,
           *          but with two new errors: 'in_progress', and 'last_call_interrupted'.
          */
          lockedAsyncCall: function(lockKey, asyncFunction) {

            var deferred = $q.defer();

            // If the memory lock is set, error out.
            if (memoryLocks[lockKey]) {
              deferred.reject('in_progress');
              return deferred.promise;
            }

            // If there is a stored lock but no memory lock, flag a persistence error
            if (persistenceStrategy.get(lockKey) === 'locked') {
              deferred.reject('last_call_interrupted');
              deferred.promise.then(null, function() {
                persistenceStrategy.remove(lockKey);
              });
              return deferred.promise;
            }

            // Set stored and memory locks
            memoryLocks[lockKey] = true;
            persistenceStrategy.set(lockKey, 'locked');

            // Perform the async operation
            asyncFunction().then(function(successData) {
              deferred.resolve(successData);

              // Remove stored and memory locks
              delete memoryLocks[lockKey];
              persistenceStrategy.remove(lockKey);
            }, function(errorData) {
              deferred.reject(errorData);

              // Remove stored and memory locks
              delete memoryLocks[lockKey];
              persistenceStrategy.remove(lockKey);
            }, function(notifyData) {
              deferred.notify(notifyData);
            });

            return deferred.promise;
          }
        };
      }]
    };
  })
})();

(function() {

  angular.module('ionic.service.core')

  // Auto-generated configuration factory
  .factory('$ionicCoreSettings', function() {
    var settings = {};
    return {
      get: function(setting) {
        if (settings[setting]) {
          return settings[setting];
        }
        return null;
      }
    }
  })
  // Auto-generated configuration factory

})();

(function() {

  var IonicUserFactory = function($q, $ionicCoreSettings, $timeout, $http, persistentStorage, $ionicApp) {
    var user_api_base = $ionicApp.getApiUrl() + '/api/v1/app/' + $ionicCoreSettings.get('app_id') + '/users';
    var user_api_endpoints = {
      'save': function(userModel) {
        return user_api_base + '/identify';
      }
    };

    var IonicUserModel = (function() {
      var UserModel = function(){};
      var user = UserModel.prototype;
      var _block_save = false;
      var _user_data = {
        'user_id': null,
        '_push': {
          'android': [],
          'ios': []
        }
      };

      user.load = function(id) {
        console.log('load', id);
      };

      Object.defineProperty(user, "user_id", {
        set: function(v) {
          if(v && (typeof v === 'string') && v != '') {
            _user_data.user_id = v;
            return true;
          } else {
            return false;
          }
        },

        get: function() {
          return _user_data.user_id || null;
        }
      });

      user.compileUserData = function() {
        return _user_data;
      };

      user.save = function() {
        var self = this;
        if(!_block_save) {
          _block_save = true;
          $http.post(user_api_endpoints.save(this), self.compileUserData()).then(function(result) {
            _block_save = false;
            console.log('just saved user', result);
          }, function(err) {
            _block_save = false;
            console.log('user error', err);
          });
        } else {
          console.log("Ionic User: A save operation is already in progress for " + this + ".")
        }
      };

      user.toString = function() {
        return '<IonicUser [\'' + this.user_id + '\']>'; 
      }

      return UserModel;
    })();
    
    return {
      'factory': function() {
        return new IonicUserModel();
      }
    };
  };

  angular.module('ionic.service.core')

  .factory('$ionicUser', [
    '$q',
    '$ionicCoreSettings',
    '$timeout',
    '$http',
    'persistentStorage',
    '$ionicApp',
    IonicUserFactory
  ]);

})();
