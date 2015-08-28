var gulp = require('gulp'),
  buildConfig = require('./build/config.js'),
  gutil = require('gulp-util'),
  concat = require('gulp-concat'),
  footer = require('gulp-footer'),
  header = require('gulp-header'),
  watch = require('gulp-watch'),
  browserify = require("browserify"),
  babelify = require("babelify"),
  fs = require("fs")

gulp.task('build', function () {
  browserify({
    entries: buildConfig.jsFiles,
    debug: false,
    transform: [babelify]
  }).bundle()
  .on("error", function (err) { console.log("Error : " + err.message); })
  .pipe(fs.createWriteStream("ionic-core.js"));
});

gulp.task('watch', ['build'], function() {
  gulp.watch(['src/**/*.js'], ['build']);
});

gulp.task('default', ['build']);
