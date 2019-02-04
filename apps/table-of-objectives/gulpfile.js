var gulp = require('gulp');
var cssnano = require('gulp-cssnano');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify-es').default;
var browserSync = require('browser-sync').create();

gulp.task('sass', function(){
  return gulp.src('app/sass/style.scss')
     .pipe(sass())
     .pipe(cssnano())
     .pipe(gulp.dest('app/css'));
});

gulp.task('js', function(){
  return gulp.src(['app/js/plugins/*.js', 'app/js/*.js'])
      .pipe(concat('all.js'))
      .pipe(uglify())
      .pipe(gulp.dest('dist'));
});

gulp.task('watch', function(){
  browserSync.init({
    server: "./app",
    port: 8080,
    notify: false
  });

  gulp.watch("./app/sass/*.scss", ['sass']);
  gulp.watch("./app/sass/*.scss").on('change', browserSync.reload);
  gulp.watch("./app/*.html").on('change', browserSync.reload);
  gulp.watch("./app/css/*.css").on('change', browserSync.reload);
  gulp.watch("./app/js/*.js").on('change', browserSync.reload);
});

gulp.task('default', ['sass', 'js', 'watch']);