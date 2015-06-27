var module = angular.module('ParseAngular.User', ['GlobalConfiguration']);

module.factory('ParseUser', ['$q', '$http', '$window', function($q, $http, $window) {
    // Point the service url to TGB in local debugging scenario.
    var serviceBaseUrl = '';
    if ($window.location.hostname === '127.0.0.1') {
        serviceBaseUrl = 'https://tuangoubao.parseapp.com';
        $http.defaults.useXDomain = true;
    }
    
    return {        
        current: function() {
            return Parse.User.current();
        },
        
        signUp: function(user) {
//            var defer = $q.defer();
//            return $http.post(serviceBaseUrl + '/signUp', user).
//                then(function() {
//                    defer.resolve(user);
//                    return defer.promise;
//                }, function(error) {
//                    defer.reject(user);
//                    return defer.promise;
//                });
            return $http.post(serviceBaseUrl + '/signUp', user);
        },
        
        logIn: function(user) {   
//            var defer = $q.defer();
//            return $http.post(serviceBaseUrl + '/login', user).
//                then(function() {
//                    defer.resolve(user);
//                    return defer.promise;
//                }, function(error) {
//                    defer.reject(user);
//                    return defer.promise;
//                });
            return $http.post(serviceBaseUrl + '/login', user);
        },
        
        logOut: function() {
            return $http.get(serviceBaseUrl + '/signOut');
        },
    };
}]);