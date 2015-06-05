var module = angular.module('ParseAngular.User', [
//    'ParseAngular.Object',
//    'ParseAngular.Core'
]);

module.factory('ParseUser', ['$q', function($q) {
    return {
        current: function() {
            return Parse.User.current();
        },
        
        signUp: function(user) {
            var parseUser = new Parse.User();
            parseUser.set("username", user.username);
            parseUser.set("password", user.password);
            parseUser.set("email", user.email);
            
            if (user.wechatId && user.claimToken) {
                parseUser.set("wechatId", user.wechatId);
                parseUser.set("claimToken", user.claimToken);
            }

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
        
        logIn: function(user) {            
            var defer = $q.defer();
            Parse.User.logIn(
                user.username, 
                user.password, 
                {
                    success: function(parseUser) {
                        defer.resolve(parseUser);
                        if (user.wechatId && user.claimToken) {
                            parseUser.set('wechatId',user.wechatId);
                            parseUser.set('claimToken', user.claimToken);
                            return parseUser.save();
                        }
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