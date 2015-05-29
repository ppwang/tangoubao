var tgbApp = angular.module('tuanGouBao', ['GlobalConfiguration', 'Parse', 'ui.router']);

tgbApp.config(function($locationProvider) {
    //$locationProvider.html5Mode(true).hashPrefix('!');
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
});

tgbApp.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
 
    $stateProvider
        .state('home', {
            url:'/',
            views: {
                'content': {
                    templateUrl: 'views/home.html',
                    controller: 'mainController',
                }
            }
        })
        .state('home.dealDetail', {
            url:'/deal/:id',
            views: {
                'dealDetail': {
                    templateUrl: 'views/dealDetail.html',
                    controller: 'dealDetailController',
                }
            }
        })
        .state('about', {
            url:'/about',
            views: {
                'content': {
                    templateUrl: 'views/about.html',
                    controller: 'aboutController',
                }
            }
        })
        .state('contact', {
            url:'/contact',
            views: {
                'content': {
                    templateUrl: 'views/contact.html',
                    controller: 'contactController',
                }
            }
        })
        .state('login', {
            url:'/login',
            views: {
                'content': {
                    templateUrl: 'views/login.html',
                    controller: 'loginController',
                }
            }
        })
}]);

tgbApp.factory('dataFactory', ['$http', function($http) {

    //var urlBase = '/api/customers';
    var dataFactory = {};

//    dataFactory.getCustomers = function () {
//        return $http.get(urlBase);
//    };
//
//    dataFactory.getCustomer = function (id) {
//        return $http.get(urlBase + '/' + id);
//    };
//
//    dataFactory.insertCustomer = function (cust) {
//        return $http.post(urlBase, cust);
//    };
//
//    dataFactory.updateCustomer = function (cust) {
//        return $http.put(urlBase + '/' + cust.ID, cust)
//    };
//
//    dataFactory.deleteCustomer = function (id) {
//        return $http.delete(urlBase + '/' + id);
//    };
//
//    dataFactory.getOrders = function (id) {
//        return $http.get(urlBase + '/' + id + '/orders');
//    };

    // Mock data
    dataFactory.getDeals = function() {
        return [
            {
                id: 1,
                name: 'deal 1',
                detailedDescription: 'detailed description 1',
            },
            {
                id: 2,
                name: 'deal 2',
                detailedDescription: 'detailed description 2',
            },
        ];
    };
    
    return dataFactory;
}]);

tgbApp.controller('mainController', function($scope, $location, $rootScope, dataFactory) {
    if (!$rootScope.currentUser) {
        $location.path('/login');
    }
    
    $scope.deals = dataFactory.getDeals();
    
    // create a message to display in our view
    $scope.message = 'Hello !';// + $rootScope.currentUser.getUsername() + '!';
});

tgbApp.controller('dealDetailController', function($scope, $stateParams){
    $scope.deal = _.find($scope.deals, function(d) { return d.id == $stateParams.id; });
});

tgbApp.controller('aboutController', function($scope) {
    $scope.message = 'Look! I am an about page.';
});

tgbApp.controller('contactController', function($scope) {
    $scope.message = 'Contact us! JK. This is just a demo.';
});

tgbApp.controller('loginController', function($scope, $location, $rootScope, ParseSDK) {
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

tgbApp.run(['$rootScope', 'applicationId', 'javaScriptKey', 'ParseSDK', '$location', function($rootScope, applicationId, javaScriptKey, ParseSDK, $location) {
    ParseSDK.initialize(applicationId, javaScriptKey);
    $rootScope.scenario = 'Sign up';
    $rootScope.currentUser = ParseSDK.User.current();
}]);
