var gulp = require('gulp');
var requireDir = require('require-dir');
var _tasks = requireDir('./tasks');

var mainBowerFiles = require('main-bower-files');

// var babel = require('gulp-babel');
_tasks.toString();//Ignore causes an eslint warning if removed


gulp.task('bower', function() {
    return gulp.src(mainBowerFiles())
        .pipe(gulp.dest('src/lib'));
});

gulp.task("default",["js","test"],function () {
   gulp.watch('src/**/*.jsx',['test']);
   gulp.watch('test/**/*.js',['test']);
});
