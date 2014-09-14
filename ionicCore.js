angular.module('ionic.services.core', [])

/**
 * A core Ionic account identity provider. 
 *
 * Usage:
 * angular.module('myApp', ['ionic', 'ionic.services.common'])
 * .config(['$ionicAppProvider', function($ionicAccountProvider) {
 *   $ionicAppProvider.identify({
 *     app_id: 'x34dfxjydi23dx'
 *   });
 * }]);
 */
.provider('$ionicApp', function() {
  var app = {};

  var settings = {
    'api_server': 'http://ionic.io'
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

  this.$get = [function() {
    return {
      getValue: function(k) {
        return settings[k];
      },
      getApiUrl: function() {
        return this.getValue('api_server');
      },

      /**
       * Get the registered app for all commands.
       */
      getApp: function() {
        return app;
      }
    }
  }];
});

// Backwards compat
.module('ionic.services.common', ['ionic.services.core'])
