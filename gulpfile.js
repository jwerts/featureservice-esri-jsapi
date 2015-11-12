"use strict";

var gulp =        require('gulp');
var uglify =      require('gulp-uglify');
var rename =      require('gulp-rename');
var clean =       require('gulp-clean');

var JS_PATH = './src/js/FeatureService.js';

gulp.task('clean', function() {
  return gulp.src('./dist')
    .pipe(clean({force: true}));
});

// copy / minify to dist folder.
gulp.task('dist', ['clean'], function() {
  return gulp.src(JS_PATH)
    .pipe(gulp.dest('./dist'))
    .pipe(rename('FeatureService.min.js'))
    .pipe(uglify({
      mangle: true,
      compress: true,
      preserveComments: false
    }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('default', ['clean', 'dist']);
