var module = angular.module('ParseAngular.User', [
//    'ParseAngular.Object',
//    'ParseAngular.Core'
]);

module.factory('ParseUser', ['$q', function($q) {
    return {
        current: function() {
            return Parse.User.current();
        },
        
        signUp: function(username, password, email) {
            var user = new Parse.User();
            user.set("username", username);
            user.set("password", password);
            user.set("email", email);

            var defer = $q.defer();
            user.signUp(
                null, 
                {
                    success: function(user) {
                        defer.resolve(user);
                    },
                    error: function(user, error) {
                        defer.reject(error);
                    }
                });
            
            return defer.promise;
        },
        
        logIn: function(username, password) {
            var defer = $q.defer();
            Parse.User.logIn(
                username, 
                password, 
                {
                    success: function(user) {
                        defer.resolve(user);
                    },
                    error: function(user, error) {
                        defer.reject(error);
                    }
            });
            return defer.promise;
        },
        
        logOut: function() {
            Parse.User.logOut();
        },
    };
}]);