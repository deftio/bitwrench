// Karma configuration
// Generated on Thu Jan 30 2020 21:16:09 GMT-0800 (Pacific Standard Time)
// note karma may need env set: export CHROME_BIN=/usr/bin/chromium-browser

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha','chai'],


// plugins used
//    plugins: ['karma-chai', 'karma-chrome-launcher', 'karma-mocha', 'karma-mocha-reporter'],

//    customContextFile: 'test/karma-test.html',

    // list of files / patterns to load in the browser
    files: [
      'bitwrench.js',
      'test/karma-test.js'
      
  
    ],


    // list of files / patterns to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors : {
      //'test/karma-test.js': 'coverage'
      'bitwrench.js':'coverage'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    //old reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    //begin istanbul code coverage
     // anything named karma-* is normally auto included so you probably dont need this
    //plugins: ['karma-coverage-istanbul-reporter'],
 
    reporters: ['progress','coverage'],
    coverageReporter: {
      type : 'lcov',
      dir:  'coverage',
      //file : 'coverage.txt'
      // Would output the results into: .'/coverage/report/'
    },
 
    // any of these options are valid: https://github.com/istanbuljs/istanbuljs/blob/aae256fb8b9a3d19414dcf069c592e88712c32c6/packages/istanbul-api/lib/config.js#L33-L39
    coverageIstanbulReporter: {
      // reports can be any that are listed here: https://github.com/istanbuljs/istanbuljs/tree/aae256fb8b9a3d19414dcf069c592e88712c32c6/packages/istanbul-reports/lib
      reports: ['html', 'lcovonly', 'text-summary'],
 
      // base output directory. If you include %browser% in the path it will be replaced with the karma browser name
      //dir: path.join(__dirname, 'coverage'),
 
      // Combines coverage information from multiple browsers into one report rather than outputting a report
      // for each browser.
      combineBrowserReports: true,
 
      // if using webpack and pre-loaders, work around webpack breaking the source path
      fixWebpackSourcePaths: true,
 
      // Omit files with no statements, no functions and no branches from the report
      skipFilesWithNoCoverage: true,
 
      // Most reporters accept additional config options. You can pass these through the `report-config` option
      'report-config': {
        // all options available at: https://github.com/istanbuljs/istanbuljs/blob/aae256fb8b9a3d19414dcf069c592e88712c32c6/packages/istanbul-reports/lib/html/index.js#L135-L137
        html: {
          // outputs the report in ./coverage/html
          subdir: 'html'
        }
      },
 
      // enforce percentage thresholds
      // anything under these percentages will cause karma to fail with an exit code of 1 if not running in watch mode
      thresholds: {
        emitWarning: false, // set to `true` to not fail the test command when thresholds are not met
        // thresholds for all files
        global: {
          statements: 80,
          lines: 80,
          branches: 80,
          functions: 80
        }
      },
 
      verbose: true, // output config used by istanbul for debugging
 
      // `instrumentation` is used to configure Istanbul API package.
      instrumentation: {
        // To include `node_modules` code in the report.
        'default-excludes': false
      }
    }
  }) // config.set
}
