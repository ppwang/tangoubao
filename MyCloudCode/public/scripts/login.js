var module = angular.module('AuthApp', ['GlobalConfiguration', 'Parse']);

module.run(['$rootScope', 'applicationId', 'javaScriptKey', 'ParseSDK',  function($scope, applicationId, javaScriptKey, ParseSDK) {
    ParseSDK.initialize(applicationId, javaScriptKey);
    $scope.scenario = 'Sign up';
    $scope.currentUser = ParseSDK.User.current();
  
    $scope.signUp = function(user) {
        clearStatusMessage();
        ParseSDK.User.signUp(user.username, user.password, user.email)
            .then(function(user) {
                $scope.currentUser = user;
            },
            function(error) {
                $scope.statusMessage = "Unable to sign up:  " + error.code + " " + error.message;
            });
    };
  
    $scope.logIn = function(user) {
        clearStatusMessage();
        ParseSDK.User.logIn(user.username, user.password)
            .then(function(user) {
                $scope.currentUser = user;
            },
            function(error) {
                $scope.statusMessage = "Unable to log in: " + error.code + " " + error.message;
            });
    };
  
    $scope.logOut = function() {
        clearStatusMessage();
        ParseSDK.User.logOut();
        $scope.currentUser = null;
    };
    
    // Private methods.
    var clearStatusMessage = function() {
        $scope.statusMessage = null;
    };
}]);
