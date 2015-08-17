(function() {
  
  angular.module('ionic.service.core')

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
})();
