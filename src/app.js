(function() {

  class App {

    constructor(app_id, api_key) {
      if(!app_id || app_id === '') {
        console.log('Ionic Core: No app_id was provided to IonicApp');
        return false;
      }

      if(!api_key || api_key === '') {
        console.log('Ionic Core: No api_key was provided to IonicApp');
        return false;
      }

      var privateData = {
        'id': app_id,
        'apiKey': api_key
      };

      this.privateVar = function(name) {
        return privateData[name] || null;
      };

      // other config value reference
      this.devPush = null;
      this.gcmKey = null;

      if((typeof config === 'object')) {
        var x = null;
        for(x in config) {
          this[x] = config[x];
        }
      }
    }

    get id() {
      return this.privateVar('id');
    }

    get apiKey() {
      return this.privateVar('apiKey');
    }

    toString() {
      return '<IonicApp>';
    }
  };

  ionic.io.core.App = App; 

})();
