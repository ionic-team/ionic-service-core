(function() {

  var ApiRequest = Ionic.IO.ApiRequest;
  var DeferredPromise = Ionic.IO.DeferredPromise;
  var Settings = new Ionic.IO.Settings();
  var Core = Ionic.IO.Core;

  var userAPIBase = Settings.getURL('api') + '/api/v1/app/' + Settings.get('app_id') + '/users';
  var userAPIEndpoints = {
    'load': function(userModel) {
      return userAPIBase + '/' + userModel.id;
    },
    'remove': function(userModel) {
      return userAPIBase + '/' + userModel.id;
    },
    'save': function() {
      return userAPIBase + '/identify';
    },
    'addToken': function() {
      return userAPIBase + '/pushUnique';
    }
  };

  class PushData {

    /**
     * Push Data Object
     *
     * Holds push data to use in conjunction with Ionic User models.
     * @constructor
     */
    constructor() {
      this.tokens = {
        'android': [],
        'ios': []
      };
    }

    /**
     * Add a new token to the current list of tokens
     * Duplicates are not added, but still return as succesfully added.
     *
     * @param {ionic.io.push.Token} token Push Token
     * @return {boolean} False on error, otherwise true
     */
    addToken(token) {
      var platform = null;

      if ((typeof token === 'undefined') || !token || token === '') {
        this.logger.info('you need to pass a valid token to addToken()');
        return false;
      }

      if (token.token) {
        token = token.token;
      }

      if (Core.isAndroidDevice()) {
        platform = 'android';
      } else if (Core.isIOSDevice()) {
        platform = 'ios';
      }

      if (platform === null || !this.tokens.hasOwnProperty(platform)) {
        this.logger.info('cannot determine the token platform. Are you running on an Android or iOS device?');
        return false;
      }

      var platformTokens = this.tokens[platform];
      var hasToken = false;
      var testToken = null;

      for (testToken in platformTokens) {
        if (platformTokens[testToken] === token) {
          hasToken = true;
        }
      }
      if (!hasToken) {
        platformTokens.push(token);
      }

      return true;
    }
  }

  class CustomData {
    constructor(data) {
      this.data = {};
      if ((typeof data === 'object')) {
        this.data = data;
      }
    }

    set(key, value) {
      this.data[key] = value;
    }

    unset(key) {
      delete this.data[key];
    }

    get(key) {
      return this.data[key];
    }

    toString() {
      return JSON.stringify(this.data);
    }
  }

  class User {
    constructor() {
      this.logger = new Ionic.IO.Logger({
        'prefix': 'Ionic User:'
      });
      this._blockLoad = false;
      this._blockSave = false;
      this._blockDelete = false;
      this.push = new PushData();
      this.data = new CustomData();
    }

    static load(id) {
      var self = this;
      var deferred = new DeferredPromise();

      var tempUser = new Ionic.User();
      tempUser.id = id;

      if (!self._blockLoad) {
        self._blockLoad = true;
        new ApiRequest({
          'uri': userAPIEndpoints.load(tempUser),
          'method': 'GET',
          'json': true,
          'headers': {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }).then(function(result) {
          self._blockLoad = false;
          self.logger.info('loaded user');

          // set the custom data
          tempUser.data = new CustomData(result.payload.custom_data);

          // set the push tokens
          if (result.payload._push && result.payload._push.android_tokens) {
            tempUser.push.tokens.android = result.payload._push.android_tokens;
          }
          if (result.payload._push && result.payload._push.ios_tokens) {
            tempUser.push.tokens.ios = result.payload._push.ios_tokens;
          }

          tempUser.image = result.payload.image;

          deferred.resolve(tempUser);
        }, function(error) {
            self._blockLoad = false;
            self.logger.error(error);
            deferred.reject(error);
          });
      } else {
        self.logger.info("a load operation is already in progress for " + this + ".");
        deferred.reject(false);
      }

      return deferred.promise;
    }

    get valid() {
      if (this.id) {
        return true;
      }
      return false;
    }

    getAPIFormat() {
      var customData = this.data.data;
      customData.user_id = this.id; // eslint-disable-line camelcase
      customData._push = {
        'android_tokens': this.push.tokens.android,
        'ios_tokens': this.push.tokens.ios
      };
      return customData;
    }

    getFormat(format) {
      var self = this;
      var formatted = null;
      switch (format) {
        case 'api':
          formatted = self.getAPIFormat();
          break;
      }
      return formatted;
    }

    delete() {
      var self = this;
      var deferred = new DeferredPromise();

      if (!self.valid) {
        return false;
      }

      if (!self._blockDelete) {
        self._blockDelete = true;
        new ApiRequest({
          'uri': userAPIEndpoints.remove(this),
          'method': 'DELETE',
          'headers': {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }).then(function(result) {
          self._blockDelete = false;
          self.logger.info('deleted ' + self);
          deferred.resolve(result);
        }, function(error) {
            self._blockDelete = false;
            self.logger.error(error);
            deferred.reject(error);
          });
      } else {
        self.logger.info("a delete operation is already in progress for " + this + ".");
        deferred.reject(false);
      }

      return deferred.promise;
    }

    save() {
      var self = this;
      var deferred = new DeferredPromise();

      if (!self._blockSave) {
        self._blockSave = true;
        new ApiRequest({
          'uri': userAPIEndpoints.save(this),
          'method': 'POST',
          'headers': {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          'body': JSON.stringify(self.getFormat('api'))
        }).then(function(result) {
          self._blockSave = false;
          self.logger.info('saved user');
          deferred.resolve(result);
        }, function(error) {
            self._blockSave = false;
            self.logger.error(error);
            deferred.reject(error);
          });
      } else {
        self.logger.info("a save operation is already in progress for " + this + ".");
        deferred.reject(false);
      }

      return deferred.promise;
    }

    set id(v) {
      if (v && (typeof v === 'string') && v !== '') {
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
  }

  Ionic.namespace('Ionic', 'User', User, window);

})();
