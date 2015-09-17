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
    'src/io.js',
    'src/promise.js',
    'src/request.js',
    'src/events.js',
    'src/logger.js',
    'src/storage.js',
    'src/settings.js',
    'src/core.js',
    'src/user.js',
    'src/app.js',
    'src/angular-integration.js'
  ],

  versionData: {
    version: pkg.version
  }
};
