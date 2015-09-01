(function() {

  class App {

    constructor(appId, apiKey) {
      if (!appId || appId === '') {
        console.log('Ionic Core: No app_id was provided to IonicApp');
        return false;
      }

      if (!apiKey || apiKey === '') {
        console.log('Ionic Core: No api_key was provided to IonicApp');
        return false;
      }

      var privateData = {
        'id': appId,
        'apiKey': apiKey
      };

      this.privateVar = function(name) {
        return privateData[name] || null;
      };

      // other config value reference
      this.devPush = null;
      this.gcmKey = null;
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
  }

  ionic.io.core.App = App;

})();
