var concat = require('gulp-concat');
var ts = require('gulp-typescript');
var gulp   = require('gulp');
var Elixir = require('laravel-elixir');
var fileExists = require('file-exists');
var path = require('path');

var _ = require('underscore');

var $ = Elixir.Plugins;
var config = Elixir.config;

// overwrite elixir config values
var tsFolder = 'resources/assets/typescript'; // would be config.get('assets.js.typescript.folder');
var tsOutput = config.get('public.js.outputFolder');

Elixir.extend('typescript', function(src, output, options) {
    var paths = prepGulpPaths(src, output);

    new Elixir.Task('typescript', function() {
        this.log(paths.src, paths.output);

        // check if there is an tsconfig.json file --> initialize ts project
        var tsProject = null;
        var tsConfigPath = path.join(tsFolder, 'tsconfig.json');
        if(fileExists(tsConfigPath)){
            tsProject = ts.createProject(tsConfigPath, options);
        }else{
            // useful default options
            options = _.extend({
                sortOutput: true
            }, options);
        }

        return (
            gulp
            .src(paths.src.path)
            .pipe($.if(config.sourcemaps, $.sourcemaps.init()))
            .pipe(ts(tsProject == null ? options : tsProject)
                .on('error', function(e) {
                    new Elixir.Notification().error(e, 'TypeScript Compilation Failed!');

                    this.emit('end');
                }))
//            .pipe($.concat(paths.output.name))
            .pipe($.if(config.production, $.uglify()))
            .pipe($.if(config.sourcemaps, $.sourcemaps.write('.')))
            .pipe(gulp.dest(paths.output.baseDir))
            .pipe(new Elixir.Notification('TypeScript Compiled!'))
        );
    })
    .watch(path.join(paths.src.baseDir, "**/*.ts"))
    .ignore(paths.output.path);
});

/**
 * Prep the Gulp src and output paths.
 *
 * @param  {string|Array} src
 * @param  {string|null}  output
 * @return {GulpPaths}
 */
var prepGulpPaths = function(src, output) {
    return new Elixir.GulpPaths()
        .src(src, tsFolder)
        .output(output || tsOutput, 'app.js');
};
