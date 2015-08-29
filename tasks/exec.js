var gulp = require('gulp');
var exec = require('child_process').exec;

gulp.task("run-server",function (cb) {
  exec('npm start',function (err,stdout,stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});
