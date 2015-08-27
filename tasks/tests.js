var gulp = require('gulp');
var mocha = require('gulp-mocha');
var babel = require('babel/register');
var localStorage = require('mock-local-storage');

gulp.task("test",function () {
  return gulp.src("test/**/*.js")
    .pipe(mocha({
      reporter: 'nyan',
      require: localStorage,
      compilers: babel
    }));
});
