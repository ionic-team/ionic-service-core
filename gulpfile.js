var gulp = require('gulp'),
  buildConfig = require('./build/config.js'),
  gutil = require('gulp-util'),
  concat = require('gulp-concat'),
  footer = require('gulp-footer'),
  header = require('gulp-header'),
  watch = require('gulp-watch'),
  browserify = require("browserify"),
  babelify = require("babelify"),
  fs = require("fs"),
  eslint = require('gulp-eslint'),
  replace = require('gulp-replace');

gulp.task('pre-build', function() {
  
});

gulp.task('post-build', function() {
  
});

gulp.task('build', [
  'pre-build',
  'lint',
  'build-core-module',
  'build-push-module',
  'build-deploy-module',
  'build-analytics-module',
  'build-bundle',
  'post-build'
]);

gulp.task('build-core-module', ['lint'], function () {
  browserify({
    entries: buildConfig.sourceFiles.core,
    debug: false,
    transform: [babelify]
  }).bundle()
  .on("error", function (err) { console.log("Error : " + err.message); })
  .pipe(fs.createWriteStream(buildConfig.dist + "/core.js"));
});

gulp.task('build-push-module', ['lint'], function () {
  browserify({
    entries: buildConfig.sourceFiles.push,
    debug: false,
    transform: [babelify]
  }).bundle()
  .on("error", function (err) { console.log("Error : " + err.message); })
  .pipe(fs.createWriteStream(buildConfig.dist + "/push.js"));
});

gulp.task('build-deploy-module', ['lint'], function () {
  browserify({
    entries: buildConfig.sourceFiles.deploy,
    debug: false,
    transform: [babelify]
  }).bundle()
  .on("error", function (err) { console.log("Error : " + err.message); })
  .pipe(fs.createWriteStream(buildConfig.dist + "/deploy.js"));
});

gulp.task('build-analytics-module', ['lint'], function () {
  browserify({
    entries: buildConfig.sourceFiles.analytics,
    debug: false,
    transform: [babelify]
  }).bundle()
  .on("error", function (err) { console.log("Error : " + err.message); })
  .pipe(fs.createWriteStream(buildConfig.dist + "/analytics.js"));
});

gulp.task('build-bundle', ['lint'], function () {
  browserify({
    entries: buildConfig.sourceFiles.bundle,
    debug: false,
    transform: [babelify]
  }).bundle()
  .on("error", function (err) { console.log("Error : " + err.message); })
  .pipe(fs.createWriteStream(buildConfig.dist + "/ionic.io.bundle.js"));
});

gulp.task('lint', function () {
  return gulp.src(['src/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.failOnError())
    .pipe(eslint.formatEach());
});

gulp.task('watch', ['build'], function() {
  gulp.watch(['src/**/*.js'], ['build']);
});

gulp.task('default', ['build']);
