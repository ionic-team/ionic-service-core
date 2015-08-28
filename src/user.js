(function() {

  var ApiRequest = ionic.io.util.ApiRequest;
  var DeferredPromise = ionic.io.util.DeferredPromise;
  var Settings = new ionic.io.core.Settings();

  var user_api_base = Settings.getURL('api') + '/api/v1/app/' + Settings.get('app_id') + '/users';
  var user_api_endpoints = {
    'load': function(userModel) {
      return user_api_base + '/' + userModel.id;
    },
    'save': function(userModel) {
      return user_api_base + '/identify';
    },
    'addToken': function(userModel) {
      return user_api_base + '/pushUnique';
    }
  };

  class PushData {

    /**
     * Push Data Object
     *
     * Holds push data to use in conjunction with Ionic User models.
     */
    constructor() {
      this.tokens = {
        'android': [],
        'ios': []
      };
    };

    /**
     * Add a new token to the current list of tokens
     * Duplicates are not added, but still return as succesfully added.
     * 
     * @param {ionic.io.push.Token} Push Token
     * @return {Boolean} False on error, otherwise true
     */
    addToken(token) {
      var self = this;
      var platform = null;

      if((typeof token === 'undefined') || !token || token === '') {
        console.log('Ionic Push Data: You need to pass a valid token to addToken()');
        return false;
      }

      if(token.token) {
        token = token.token;
      }

      if(ionic.Platform.isAndroid()) {
        platform = 'android';
      } else if(ionic.Platform.isIOS()) {
        platform = 'ios';
      }

      if(platform === null || !this.tokens.hasOwnProperty(platform)) {
        console.log('Ionic User: Cannot determine the token platform. Are you running on an Android or iOS device?');
        return false;
      }

      var platform_tokens = this.tokens[platform];
      var hasToken = false;
      var testToken = null;

      for(testToken in platform_tokens) {
        if(platform_tokens[testToken] === token) {
          hasToken = true;
        }
      }
      if(!hasToken) {
        platform_tokens.push(token);
      }

      return true;
    }
  };

  class CustomData {
    constructor(data) {
      this.data = {};
      if((typeof data === 'object')) {
        this.data = data;
      }
    };

    set(key, value) {
      this.data[key] = value;
    };

    unset(key) {
      delete this.data[key];
    };

    get(key) {
      return this.data[key];
    };

    toString() {
      return JSON.stringify(this.data);
    }
  };

  class User {
    constructor() {
      this.block_load = false;
      this.block_save = false;
      this.push = new PushData();
      this.data = new CustomData();
    }

    load(id) {
      var self = this;
      var deferred = new DeferredPromise();

      var tempUser = new ionic.io.core.User();
      tempUser.id = id;

      if(!self._block_load) {
        self._block_load = true;
        new ApiRequest({
          'uri': user_api_endpoints.load(tempUser),
          'method': 'GET',
          'json': true,
          'headers': {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }).then(function(result) {
          self._block_load = false;
          console.log('Ionic User: loaded user');

          // set the custom data
          tempUser.data = new CustomData(result.payload.custom_data);
          
          // set the push tokens
          if(result.payload._push && result.payload._push.android_tokens) {
            tempUser.push.tokens.android = result.payload._push.android_tokens;
          }
          if(result.payload._push && result.payload._push.ios_tokens) {
            tempUser.push.tokens.ios = result.payload._push.ios_tokens;
          }

          tempUser.image = result.payload.image;

          deferred.resolve(tempUser);
        }, function(error) {
          self._block_load = false;
          console.log('Ionic User:', error);
          deferred.reject(error);
        });
      } else {
        console.log("Ionic User: A load operation is already in progress for " + this + ".")
        return false;
      }

      return deferred.promise;
    }

    get valid() {
      if(this.id) {
        return true;
      }
      return false;
    }

    getAPIFormat() {
      var custom_data = this.data.data;
      custom_data.user_id = this.id;
      custom_data._push = {
        'android_tokens': this.push.tokens.android,
        'ios_tokens': this.push.tokens.ios
      };
      return custom_data;
    };

    getFormat(format) {
      var self = this;
      var formatted = null;
      switch(format) {
        case 'api':
          formatted = self.getAPIFormat();
          break;
      }
      return formatted;
    };

    save() {
      var self = this;
      var deferred = new DeferredPromise();

      if(!self._block_save) {
        self._block_save = true;
        new ApiRequest({
          'uri': user_api_endpoints.save(this),
          'method': 'POST',
          'headers': {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          'body': JSON.stringify(self.getFormat('api'))
        }).then(function(result) {
          self._block_save = false;
          console.log('Ionic User: saved user');
          deferred.resolve(result);
        }, function(error) {
          self._block_save = false;
          console.log('Ionic User:', error);
          deferred.reject(error);
        });
      } else {
        console.log("Ionic User: A save operation is already in progress for " + this + ".");
        return false;
      };

      return deferred.promise;
    }

    set id(v) {
      if(v && (typeof v === 'string') && v != '') {
        this._id = v;
        return true;
      } else {
        return false;
      }
    }

    get id() {
      return this._id || null;
    }

    toString() {
      return '<IonicUser [\'' + this.id + '\']>'; 
    }

    addPushToken(token) {
      return this.push.addToken(token);
    }

    set(key, value) {
      return this.data.set(key,value);
    }

    get(key) {
      return this.data.get(key);
    }
  };


  class UserInterface {
    load(id) {
      var deferred = new DeferredPromise();
      var user = new User();
      user.load(id).then(function(loadedUser) {
        deferred.resolve(loadedUser);
      }, function(error) {
        deferred.reject(error);
      })
      return deferred.promise;
    };

    create() {
      return new User();
    };
  }

  ionic.io.core.User = User;
  ionic.io.core.UserInterface = UserInterface;

})();
