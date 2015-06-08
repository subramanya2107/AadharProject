'use strict';

app.factory('CordovaFactory', function($q){
     var factory = {};
     factory.scanBarCode=function(){
         var deferred = $q.defer();
         cordova.plugins.barcodeScanner.scan(
          function (result) {
             deferred.resolve(result);
          }, function(error){
             deferred.reject('Scanning failed');
          });
          return deferred.promise;
     };
    
    factory.getLocation=function(){
         var deferred = $q.defer();
         navigator.geolocation.getCurrentPosition(function(position){
            deferred.resolve(position);
          }, function(error){
            deferred.reject('fetching location failed.Please make sure gps is turned on.');
          });
        return deferred.promise;
    };
	
     return factory;       
}).factory('$localstorage', ['$window',
        function($window) {
            return {
                set: function(key, value) {
                    $window.localStorage[key] = value;
                },
                get: function(key, defaultValue) {
                    return $window.localStorage[key] || defaultValue;
                },
                setObject: function(key, value) {
                    $window.localStorage[key] = JSON.stringify(value);
                },
                getObject: function(key) {
                    return JSON.parse($window.localStorage[key] || '{}');
                }
            };
        }
    ]);