var fs = require('fs');
var pkg = require('../package.json');

module.exports = {
  banner:
    '/**\n' +
    ' * Ionic Core Module\n' +
    ' * Copyright 2015 Ionic http://ionicframework.com/\n' +
    ' * See LICENSE in this repository for license information\n' +
    ' */\n\n',

  dist: '.',

  jsFiles: [
    'src/core/promise.js',
    'src/core/request.js',
    'src/core/events.js',
    'src/core/logger.js',
    'src/core/storage.js',
    'src/core/settings.js',
    'src/core/core.js',
    'src/core/user.js',
    'src/core/app.js',
    'src/core/es5.js',
    'src/core/angular.js'
  ],

  versionData: {
    version: pkg.version
  }
};
