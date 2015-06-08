'use strict';

var app=angular.module('myApp', [
    'ngTouch',
    'ngRoute',
    'ngAnimate'
]).
config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/home', {templateUrl: 'partials/home.html', controller: 'HomeCtrl'});
    $routeProvider.when('/register', {templateUrl: 'partials/register.html', controller: 'SignUpCtrl'});
    $routeProvider.when('/qrcode', {templateUrl: 'partials/qrcode.html', controller: 'QrcodeCtrl'});

    $routeProvider.otherwise({redirectTo: '/register'});
}]);
