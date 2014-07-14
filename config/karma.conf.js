module.exports = function(config){
    config.set({
    basePath : '../',

    files : [
      //'app/lib/angular/angular.js',
      //'app/lib/angular/angular-*.js',
      'http://ajax.googleapis.com/ajax/libs/angularjs/1.3.0-beta.6/angular.min.js',
      'http://ajax.googleapis.com/ajax/libs/angularjs/1.3.0-beta.6/angular-route.min.js',
      'http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.5.2/underscore-min.js',
      'http://cdnjs.cloudflare.com/ajax/libs/angular-ui-router/0.2.10/angular-ui-router.min.js',
      'test/lib/angular/angular-mocks.js',
      'app/js/**/*.js',
      'test/unit/**/*.js'
    ],

    exclude : [
      'app/lib/angular/angular-loader.js',
      'app/lib/angular/*.min.js',
      'app/lib/angular/angular-scenario.js'
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['PhantomJS'],

    plugins : [
            'karma-junit-reporter',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-script-launcher',
            'karma-phantomjs-launcher',
            'karma-spec-reporter',
            'karma-jasmine'
            ],

    reporters: ['spec'],          

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

})}
