var module = angular.module('ParseAngular.User', [
//    'ParseAngular.Object',
//    'ParseAngular.Core'
]);

module.factory('ParseUser', ['$q', '$http', function($q, $http) {
    return {
        current: function() {
            return Parse.User.current();
        },
        
        signUp: function(user) {
            var defer = $q.defer();
            return $http.post('/signUp', user).
                then(function() {
                    defer.resolve(user);
                    return defer.promise;
                }, function(error) {
                    defer.reject(user);
                    return defer.promise;
                });
        },
        
        logIn: function(user) {   
            var defer = $q.defer();
            return $http.post('/login', user).
                then(function() {
                    defer.resolve(user);
                    return defer.promise;
                }, function(error) {
                    defer.reject(user);
                    return defer.promise;
                });
        },
        
        logOut: function() {
            return $http.get('/signOut');
        },
    };
}]);