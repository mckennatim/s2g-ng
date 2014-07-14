'use strict';


// Declare app level module which depends on filters, and services
var StuffApp = angular.module('stuffApp', [
  'ui.router',
  'stuffAppServices',
  'stuffAppControllers'
]).
config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider) {
  $stateProvider.state('list', {
    url: '/list', 
    templateUrl: 'partials/list.html', 
    controller: 'ListCtrl'});
  $stateProvider.state('lists', {
    url: '/lists', 
    templateUrl: 'partials/lists.html', 
    controller: 'ListsCtrl'});
  $stateProvider.state('user', {
    url: '/user', 
    templateUrl: 'partials/user.html', 
    controller: 'UserCtrl'});
  $stateProvider.state('shops', {
    url: '/shops', 
    templateUrl: 'partials/shops.html', 
    controller: 'ShopsCtrl'});
  $stateProvider.state('config', {
    url: '/config', 
    templateUrl: 'partials/config.html', 
    controller: 'ConfigCtrl'});
  $stateProvider.state('x', {
    url: '/', 
    templateUrl: 'partials/shownothing.html', 
    controller: 'IsregCtrl'});
  $stateProvider.state('register', {
    url: '/register', 
    templateUrl: 'partials/register.html', 
    controller: 'RegisterCtrl'});
  $stateProvider.state('admin', {
    url: '/admin', 
    templateUrl: 'partials/admin.html', 
    controller: 'AdminCtrl'});
  $urlRouterProvider.otherwise('/');
}],
  ['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
  }
]);

StuffApp.config(function ($httpProvider) {
    $httpProvider.interceptors.push('TokenInterceptor');
    console.log($httpProvider.interceptors);
});
