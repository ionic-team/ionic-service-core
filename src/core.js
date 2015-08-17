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
