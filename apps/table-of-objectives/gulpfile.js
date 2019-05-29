let gulp = require('gulp');
let cssnano = require('gulp-cssnano');
let sass = require('gulp-sass');
let concat = require('gulp-concat');
let uglify = require('gulp-uglify-es').default;
let browserSync = require('browser-sync').create();

gulp.task('sass', function(){
  return gulp.src('app/sass/style.scss')
     .pipe(sass())
     .pipe(cssnano())
     .pipe(gulp.dest('app/css'));
});

gulp.task('watch', function(){
  browserSync.init({
    server: "./app",
    port: 8080,
    notify: false
  });

  gulp.watch("./app/sass/*.scss", gulp.parallel(['sass']));
  gulp.watch("./app/sass/*.scss").on('change', browserSync.reload);
  gulp.watch("./app/*.html").on('change', browserSync.reload);
  gulp.watch("./app/css/*.css").on('change', browserSync.reload);
  gulp.watch("./app/js/*.js").on('change', browserSync.reload);
});

gulp.task("uglify", function () {
  return gulp.src("./app/js/bundle.js")
      // .pipe(rename("bundle.min.js"))
      .pipe(uglify(/* options */))
      .pipe(gulp.dest("./dist/js/"));
});

gulp.task('dist', /*gulp.series(['sass', 'uglify']),*/ function() {
  let globs = [
    './app/css/style.css',
    './app/js/bundle.js',
    './app/js/verbs.js',
    './app/*.+(html|png|xml|svg|ico|json)'
  ];

  // Specifying the base makes it so the resulting structure is dist/css and not dist/app/css.
  return gulp.src(globs, { base: './app' })
    .pipe(gulp.dest('./dist'));
});

gulp.task('default', gulp.parallel(['sass', 'watch']));