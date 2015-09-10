(function() {

  var _EventEmitter = require("events");

  class EventEmitter {
    constructor() {
      this._emitter = new _EventEmitter();
    }

    on(event, callback) {
      return this._emitter.on(event, callback);
    }

    emit(label, data) {
      return this._emitter.emit(label, data);
    }
  }

  Ionic.namespace('IO', 'EventEmitter', EventEmitter);

})();
