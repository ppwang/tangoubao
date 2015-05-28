var module = angular.module('tuanGouBao', ['GlobalConfiguration', 'Parse', 'ngRoute']);

module.config(function($locationProvider) {
    //$locationProvider.html5Mode(true).hashPrefix('!');
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
});

module.config(function($routeProvider) {
    $routeProvider
        // route for the home page
        .when('/', {
            templateUrl: 'views/home.html',
            controller: 'mainController'
        })
        // route for the about page
        .when('/about', {
            templateUrl: 'views/about.html',
            controller: 'aboutController'
        })
        // route for the contact page
        .when('/contact', {
            templateUrl: 'views/contact.html',
            controller: 'contactController'
        })
        .when('/login', {
            templateUrl: 'views/login.html',
            controller: 'loginController',
        })
        .otherwise({ 
            redirectTo: '/',
        });
});

module.controller('mainController', function($scope, $location, $rootScope) {
    if (!$rootScope.currentUser) {
        $location.path('/login');
    }
    // create a message to display in our view
    $scope.message = 'Hello !';// + $rootScope.currentUser.getUsername() + '!';
});

module.controller('aboutController', function($scope) {
    $scope.message = 'Look! I am an about page.';
});

module.controller('contactController', function($scope) {
    $scope.message = 'Contact us! JK. This is just a demo.';
});

module.controller('loginController', function($scope, $location, $rootScope, ParseSDK) {
    $scope.signUp = function(user) {
        clearStatusMessage();
        
        var wechatId = $location.search().wechatId;
        var attr;
        if (wechatId) {
            attr = { "wechatId": wechatId }; 
        }
        
        ParseSDK.User.signUp(user.username, user.password, user.email, attr)
            .then(function(user) {
                $rootScope.currentUser = user;
                $location.path('/');
            },
            function(error) {
                $scope.statusMessage = "Unable to sign up:  " + error.code + " " + error.message;
            });
    };
  
    $scope.logIn = function(user) {
        clearStatusMessage();
        ParseSDK.User.logIn(user.username, user.password)
            .then(function(user) {
                $rootScope.currentUser = user;
                $location.path('/');
            },
            function(error) {
                $scope.statusMessage = "Unable to log in: " + error.code + " " + error.message;
            });
    };
  
    $scope.logOut = function() {
        clearStatusMessage();
        ParseSDK.User.logOut();
        $rootScope.currentUser = null;
    };
    
    // Private methods.
    var clearStatusMessage = function() {
        $scope.statusMessage = null;
    };
});

module.run(['$rootScope', 'applicationId', 'javaScriptKey', 'ParseSDK', '$location', function($rootScope, applicationId, javaScriptKey, ParseSDK, $location) {
    ParseSDK.initialize(applicationId, javaScriptKey);
    $rootScope.scenario = 'Sign up';
    $rootScope.currentUser = ParseSDK.User.current();
}]);
