var Encore = require('@symfony/webpack-encore');
// Put back in when update encore to use webpack 4.x
// var webpack = require('webpack');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

Encore
    // directory where compiled assets will be stored
    .setOutputPath('web/build/')
    // public path used by the web server to access the output path
    .setPublicPath('/build')
    // only needed for CDN's or sub-directory deploy
    //.setManifestKeyPrefix('build/')

    /*
     * ENTRY CONFIG
     *
     * Add 1 entry for each "page" of your app
     * (including one that's included on every page - e.g. "app")
     *
     * Each entry will result in one JavaScript file (e.g. app.js)
     * and one CSS file (e.g. app.css) if you JavaScript imports CSS.
     */
    
    //used on all pages, incl. app builder
    .addEntry('mlab', './assets/js/mlab.js')
    
    //used on all admin pages
    .addEntry('admin', './assets/js/admin.js')
    
    //used only on the page listing the apps
    .addEntry('applist', './assets/js/applist.js')
    
    //used on app builder page
    .addEntry('builder', './assets/js/builder.js')
    
    // see https://symfony.com/doc/current/frontend/encore/legacy-apps.html re what this does.
    // in short makes $ and jQuery global vars
    .autoProvidejQuery()

    .cleanupOutputBeforeBuild()
    .enableSourceMaps(!Encore.isProduction())
    // enables hashed filenames (e.g. app.abc123.css)
    .enableVersioning(Encore.isProduction())

    // we add the uglifyjs plugin to protect source. We do NOT use babel.
    // Although it used uglifyjs it is more difficult to configure and Babael creates backwards compatible code which we do not need
    // https://symfony.com/doc/3.4/frontend/encore/custom-loaders-plugins.html 
    // https://webpack.js.org/plugins/uglifyjs-webpack-plugin/
    

    // first, install any presets you want to use (e.g. yarn add babel-preset-es2017)
    // then, modify the default Babel configuration
    // see https://symfony.com/doc/current/frontend/encore/babel.html

    // REMOVE THIS WHEN Encore is updated to work with Webpack 4.x
    .configureBabel(function(babelConfig) {
        // add additional presets
        babelConfig.presets.push('es2017');
        // debug info: console.log(babelConfig.presets[0][1]);

        // no plugins are added by default, but you can add some
        // babelConfig.plugins.push('styled-jsx/babel');
    })
    
    
;

var config = Encore.getWebpackConfig();

/* Waiting for we4bpack encore to be updated to version after 0.12.1: 
 * https://github.com/symfony/webpack-encore/tree/master and https://github.com/symfony/webpack-encore/issues/250
 * 
config.optimization = { minimiser: [new UglifyJsPlugin({
    test: /\.js(\?.*)?$/i,
    uglifyOptions: {
        warnings: false,
        parse: {},
        compress: {},
        mangle: true, // Note `mangle.properties` is `false` by default.
        output: null,
        toplevel: false,
        nameCache: null,
        ie8: false,
        keep_fnames: false,
        ecma: 6
    }
})]}; */

// add alias for jquery ui. See following for info
//how to in encore: https://symfony.com/doc/3.4/frontend/encore/advanced-config.html
// why use alias: https://github.com/symfony/webpack-encore/issues/122
// why use dist and not plain jquery-ui: https://stackoverflow.com/questions/47622786/how-to-prevent-jquery-from-importing-twice-with-webpack-typescript
config.resolve.alias["jquery-ui"] = 'jquery-ui-dist/jquery-ui.js';

module.exports = config;