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
            
            if (typeof user.wechatId !== 'undefined' && typeof user.claimtoken !== 'undefined') {
                parseUser.set("wechatId", user.wechatId);
                parseUser.set("claimtoken", user.claimtoken);
            }

            var defer = $q.defer();
            parseUser.signUp(
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
                        if (user.wechatId && user.claimtoken) {
                            parseUser.set('wechatId',user.wechatId);
                            parseUser.set('claimtoken', user.claimtoken);
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