import critical from 'critical';
import babelify from 'babelify';
import browserSync from 'browser-sync';
import browserify from 'browserify';
import buffer from 'vinyl-buffer';
import gulp from 'gulp';
import plugins from 'gulp-load-plugins';
import source from 'vinyl-source-stream';
import inject from 'gulp-inject';
import sequence from 'run-sequence';
import del from 'del';
import jshint from 'gulp-jshint';
import bower from 'gulp-bower';
import pleeease from 'gulp-pleeease';
import autoprefixer from 'gulp-autoprefixer';


/* ----------------- */
/* CONFIGURATION
 /* ----------------- */

const PATHS = {
    SOURCE : './src/',
    DEST: './build/',
};

/* ----------------- */
/* Development
 /* ----------------- */

gulp.task('development', () => {
    sequence('clean','bower', 'images', 'json', 'scripts', 'cssmin', 'htmlTemplates', 'html', () => {
        browserSync({
            'server': {
                baseDir: PATHS.DEST
            },
            'snippetOptions': {
                'rule': {
                    'match': /<\/body>/i,
                    'fn': (snippet) => snippet
                }
            }
        });
    });

    gulp.watch(PATHS.SOURCE+'view/**/*.html', ['htmlTemplates']);
    gulp.watch(PATHS.SOURCE+'server/**/*.json', ['json']);
    gulp.watch(PATHS.SOURCE+'img/**/*.*', ['images']);
    gulp.watch(PATHS.SOURCE+'scss/**/*.scss', ['cssmin']);
    gulp.watch(PATHS.SOURCE+'js/**/*.js', ['scripts']);
    gulp.watch(PATHS.SOURCE+'index.html', () => {
        sequence('html', browserSync.reload)
    });
});

/* ----------------- */
/* CLEAN
 /* ----------------- */


gulp.task('clean', () => {
    return del(PATHS.DEST);
});


/* ----------------- */
/* Components
 /* ----------------- */

// TODO: At the moment this doesn't work because of invalid SSL certificate verification failure
gulp.task('bower', function() {
    return bower('./my_bower_components')
        .pipe(gulp.dest(PATHS.DEST+'lib/'))
});


/* ----------------- */
/* Scripts
 /* ----------------- */


gulp.task('lint', function() {
    return gulp.src(PATHS.SOURCE+'js/main.js')
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'));

});

gulp.task('scripts', ['lint'], () => {
    return browserify({
        'entries': [PATHS.SOURCE+'js/main.js'],
        'debug': true,
        'transform': [
            babelify.configure({
                'presets': ['es2015']
            })
        ]
    })
        .bundle()
        .on('error', function () {
            let args = Array.prototype.slice.call(arguments);

            plugins().notify.onError({
                'title': 'Compile Error',
                'message': '<%= error, error.message %>'
            }).apply(this, args);

            this.emit('end');
        })
        .pipe(source('main.bundled.js'))
        .pipe(buffer())
        .pipe(plugins().sourcemaps.init({'loadMaps': true}))
        .pipe(plugins().sourcemaps.write('.'))
        .pipe(gulp.dest(PATHS.DEST+'js/'))
        .pipe(browserSync.stream());

});




/* ----------------- */
/* Images
 /* ----------------- */

gulp.task('images', () => {
    return gulp.src(PATHS.SOURCE+'img/**/*.*')
        .pipe(gulp.dest(PATHS.DEST+'img/'))
});



/* ----------------- */
/* HTML
 /* ----------------- */

gulp.task('html', () => {
    return gulp.src(PATHS.SOURCE+'index.html')
        .pipe(critical.stream({
            'base': PATHS.DEST,
            'inline': true,
            'extract': true,
            'minify': true,
            'css': [PATHS.DEST+'css/main.css']
        }))
        .pipe(inject(gulp.src([PATHS.DEST+'**/*.js', PATHS.DEST+'**/*.css', PATHS.DEST+'lib/**/*.*']), {relative: false, addRootSlash: true, ignorePath: 'build'}))
        .pipe(gulp.dest(PATHS.DEST));
});

gulp.task('updateIndex', () => {
    return gulp.src(PATHS.SOURCE+'index.html')
        .pipe(gulp.dest(PATHS.DEST));
});

gulp.task('htmlTemplates', () => {
    return gulp.src(PATHS.SOURCE+'view/**/*.html')
        .pipe(gulp.dest(PATHS.DEST+'view/'));
});


/* ----------------- */
/* JSON FILES
 /* ----------------- */

gulp.task('json', () => {
    return gulp.src(PATHS.SOURCE+'server/**/*.json')
        .pipe(gulp.dest(PATHS.DEST+'server/'));
});

/* ----------------- */
/* Cssmin
 /* ----------------- */

gulp.task('cssmin', () => {
    return gulp.src(PATHS.SOURCE+'scss/**/*.scss')
        .pipe(plugins().sass({
            'outputStyle': 'compressed'
        }).on('error', plugins().sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 3 versions', 'Android 2.3', '> 5%'],
            cascade: false
        }))
        .on('error', plugins().sass.logError)
        .pipe(gulp.dest(PATHS.DEST+'css/'))
        .pipe(browserSync.stream());
});


/* ----------------- */
/* Jsmin
 /* ----------------- */

gulp.task('jsmin', () => {
    let envs = plugins().env.set({
        'NODE_ENV': 'production'
    });

    return browserify({
        'entries': [PATHS.SOURCE+'js/main.js'],
        'debug': false,
        'transform': [
            babelify.configure({
                'presets': ['es2015']
            })
        ]
    })
        .bundle()
        .pipe(source('main.bundled.js'))
        .pipe(envs)
        .pipe(buffer())
        .pipe(plugins().uglify())
        .pipe(envs.reset)
        .pipe(gulp.dest(PATHS.DEST+'js/'));
});

/* ----------------- */
/* Taks
 /* ----------------- */

gulp.task('default', ['development']);
gulp.task('deploy', () => {
    sequence('clean','bower', 'images', 'json', 'scripts', 'cssmin', 'htmlTemplates', 'html', 'jsmin');
});