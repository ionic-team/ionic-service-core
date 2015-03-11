angular.module('ionic.service.core', [])

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
.provider('$ionicApp', function() {
  var app = {};

  var settings = {
    'api_server': 'https://apps.ionic.io',
    'push_api_server': 'https://push.ionic.io'
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
      getApiWriteKey: function() {
        return app.api_write_key;
      },
      getApiReadKey: function() {
        return app.api_read_key;
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
      }
    }
  }];
})

/**
* @ngdoc service
* @name $ionicUser
* @module ionic.service.core
* @description
*
* An interface for storing data to a user object which will be sent with many ionic services
*
* Add tracking data to the user by passing objects in to the identify function.
* The _id property identifies the user on this device and cannot be overwritten.
*
* @usage
* ```javascript
* $ionicUser.get();
*
* // Add info to user object
* $ionicUser.identify({
*   username: "Timmy"
* });
*
* ```
*/
.factory('$ionicUser', [
  '$q',
  '$timeout',
  '$http',
  'persistentStorage',
  '$ionicApp',
function($q, $timeout, $http, persistentStorage, $ionicApp) {
      // User object we'll use to store all our user info


  var storageKeyName = 'ionic_analytics_user_' + $ionicApp.getApp().app_id,
      user = persistentStorage.retrieveObject(storageKeyName) || {},
      deviceCordova = ionic.Platform.device(),
      device = {
          screen_width: window.innerWidth * (window.devicePixelRatio || 1),
          screen_height: window.innerHeight * (window.devicePixelRatio || 1)
      };

  if (deviceCordova.model) device.model = deviceCordova.model;
  if (deviceCordova.platform) device.platform = deviceCordova.platform;
  if (deviceCordova.version) device.version = deviceCordova.version;

  // Flag if we've changed anything on our user
  var dirty = false;
  dirty = storeOrDirty('is_on_device', ionic.Platform.isWebView());
  dirty = storeOrDirty('device', device);
  if (!user._id) {
    user._id = generateGuid();
    dirty = true;
  }

  if (dirty) {
      persistentStorage.storeObject(storageKeyName, user);
  }

  function generateGuid() {
    // Some crazy bit-twiddling to generate a random guid
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  function storeOrDirty(key, value) {
    // Store the key on the user object and return whether something changed
    if (!angular.equals(user[key], value)) {
      user[key] = value;
      return true;
    }
    return false;
  }

  return {
    /**
     * Push a value to the array with the given key.
     */
    push: function(key, value) {
      var u = user.user_id;
      if(!u) {
        throw new Error("Please call identify with a user_id before calling push");
      }
      var o = {};
      o['user_id'] = u;
      o[key] = value;
      return $http.post($ionicApp.getApiUrl() + '/api/v1/app/' + $ionicApp.getId() + '/users/push', o);
    },
    set: function(key, value) {
      var u = user.user_id;
      if(!u) {
        throw new Error("Please call identify with a user_id before calling set");
      }

      var o = {};
      o['user_id'] = u;
      o[key] = value;
      return $http.post($ionicApp.getApiUrl() + '/api/v1/app/' + $ionicApp.getId() + '/users/set', o);
    },
    identify: function(userData) {
      if (userData._id) {
        var msg = 'You cannot override the _id property on users.';
        throw new Error(msg)
      }

      if (!userData.user_id) {
        var msg = 'You must supply a unique user_id field.';
        throw new Error(msg)
      }

      /*
      if(!userData.user_id) {
        userData.user_id = generateGuid();
      }
      */

      // Copy all the data into our user object
      angular.extend(user, userData);

      // Write the user object to our local storage
      persistentStorage.storeObject(storageKeyName, user);

      return $http.post($ionicApp.getApiUrl() + '/api/v1/app/' + $ionicApp.getId() + '/users/identify', userData);
    },
    get: function() {
      return user;
    }
  }
}])


