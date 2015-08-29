var gulp = require('gulp');
var watchify = require('watchify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var assign = require('lodash.assign');
var babelify = require('babelify');

var externalLibs = [
   "react",
   "flux",
   "classnames",
   "material-ui",
   "react-tap-event-plugin"
];
var customOpts ={
   entries: './src/App.jsx',
   debug: true
};
var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts));
//Transform
b.transform(babelify.configure({
   compact: false,
   only: '/src/',
   plugins: ["object-assign"]
}));
// b.transform('debowerify');
externalLibs.forEach(function(lib) {
  b.external(lib);
});
gulp.task('js',bundle);
b.on('update',bundle);
b.on('log', gutil.log);

function bundle() {
   return  b.transform(babelify.configure({
      compact: false,
      only: '/src/',
      plugins: ["object-assign"]
   }))
   .bundle()
    // log errors if they happen
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('bundle.js'))
    // optional, remove if you don't need to buffer file contents
    .pipe(buffer())
    // optional, remove if you dont want sourcemaps
    .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
       // Add transformation tasks to the pipeline here.
    .pipe(sourcemaps.write('./')) // writes .map file
    .pipe(gulp.dest('./dist'));
}

gulp.task('browser-vendor',function bundleVendor() {
   var browserifyVendor =  browserify({
        debug: true
    });
    externalLibs.forEach(function(lib) {
      browserifyVendor.require(lib);
    });

    return browserifyVendor.bundle()
      .pipe(source('vendor.js'))
      .pipe(gulp.dest("./dist"));
});
