var gulp = require('gulp'),
  buildConfig = require('./build/config.js'),
  gutil = require('gulp-util'),
  concat = require('gulp-concat'),
  footer = require('gulp-footer'),
  header = require('gulp-header'),
  watch = require('gulp-watch');

gulp.task('build', function () {
  return gulp.src(buildConfig.jsFiles)
    .pipe(concat('ionic-core.js'))
    .pipe(header(buildConfig.banner))
    .pipe(gulp.dest(buildConfig.dist));
});

gulp.task('watch', ['build'], function() {
  gulp.watch(['src/**/*.js'], ['build']);
});

gulp.task('default', ['build']);
