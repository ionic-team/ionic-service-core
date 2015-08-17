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
