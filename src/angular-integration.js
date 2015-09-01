// Add Angular integrations if Angular is available
if ((typeof angular === 'object') && angular.module) {
  angular.module('ionic.service.core', [])

  /**
   * @private
   * Provides a safe interface to store objects in persistent memory
   */
  .provider('persistentStorage', function() {
    return {
      '$get': [function() {
        var io = ionic.io.init();
        return io.storage;
      }]
    };
  })

  .factory('$ionicCoreSettings', [
    function() {
      var io = ionic.io.init();
      return io.settings;
    }
  ])

  .factory('$ionicUser', [
    function() {
      return {
        'create': function() {
          var io = ionic.io.init();
          return io.user.create();
        },

        'load': function(id) {
          var io = ionic.io.init();
          return io.user.load(id);
        }
      };
    }
  ])

  .run([function() {
    var io = ionic.io.init();
    io.bootstrap();
  }]);
}
