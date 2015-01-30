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
.provider('$ionicApp', function() {
  var app = {};

  var settings = {
    'api_server': 'https://ionic.io',
    'push_api_server': 'https://push.ionic.io/'
  };

  this.identify = function(opts) {
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
        return this.getValue('app_id');
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
        return this.getValue('api_key');
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
  'persistentStorage',
  '$ionicApp',
function($q, $timeout, persistentStorage, $ionicApp) {
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
    identify: function(userData) {
      if (userData._id) {
        var msg = 'You cannot override the _id property on users.';
        throw new Error(msg)
      }

      // Copy all the data into our user object
      angular.extend(user, userData);

      // Write the user object to our local storage
      persistentStorage.storeObject(storageKeyName, user);
    },
    get: function() {
      return user;
    }
  }
}])

