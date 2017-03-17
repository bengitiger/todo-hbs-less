var gulp = require('gulp');
var less = require('gulp-less');
var header = require('gulp-header');
var cleanCSS = require('gulp-clean-css');
var rename = require("gulp-rename");
var coffee = require('gulp-coffee');
var pkg = require('./package.json');
var uglify = require('gulp-uglify');

// Set the banner content
var banner = ['/*!\n',
    ' * Studio Riehl - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
    ' * Copyright 2017-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
    ' * Licensed under <%= pkg.license.type %> (<%= pkg.license.url %>)\n',
    ' */\n',
    ''
].join('');

// Compile LESS files from /less into /css
gulp.task('less', function() {
    return gulp.src('./less/style.less')
        .pipe(less())
        .pipe(header(banner, { pkg: pkg }))
        .pipe(gulp.dest('./public/css'))
});

// Minify compiled CSS
gulp.task('minify-css', ['less'], function() {
    return gulp.src('./public/css/*.css')
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./public/css'))
});

gulp.task('coffee', function() {
  return gulp.src('./coffee/*.coffee')
    .pipe(coffee({bare: true}))
    .pipe(gulp.dest('./public/js'));
});

gulp.task('minify-js', function() {
  return gulp.src('./public/js/index.js')
    .pipe(uglify())
    .pipe(header(banner, { pkg: pkg }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./public/js'))
});

gulp.task('default', ['coffee', 'less', 'minify-css', 
//'minify-js'
]);

// Run everything
// gulp.task('dev', ['less', 'minify-css', 'coffee', 'minify-js'], function() {
//   gulp.watch('less/*.less', ['less']);
//   gulp.watch('public/css/*.css', ['minify-css']);
//   gulp.watch('coffee/*.coffee', ['coffee']);
//   gulp.watch('public/js/*.js', ['minify-js']);
// });
