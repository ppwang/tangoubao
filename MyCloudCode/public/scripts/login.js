var tgbApp = angular.module('tuanGouBao', ['GlobalConfiguration', 'Parse', 'ui.router', 'xeditable']);

//tgbApp.config(function($locationProvider) {
//    //$locationProvider.html5Mode(true).hashPrefix('!');
//    $locationProvider.html5Mode({
//        enabled: true,
//        requireBase: false
//    });
//});

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

tgbApp.factory('dealDataService', ['$http', function($http) {

    //var urlBase = '/api/customers';
    var dealDataService = {};

//    dealDataService.getCustomers = function () {
//        return $http.get(urlBase);
//    };
//
//    dealDataService.getCustomer = function (id) {
//        return $http.get(urlBase + '/' + id);
//    };
//
//    dealDataService.insertCustomer = function (cust) {
//        return $http.post(urlBase, cust);
//    };
//
//    dealDataService.updateCustomer = function (cust) {
//        return $http.put(urlBase + '/' + cust.ID, cust)
//    };
//
//    dealDataService.deleteCustomer = function (id) {
//        return $http.delete(urlBase + '/' + id);
//    };
//
//    dealDataService.getOrders = function (id) {
//        return $http.get(urlBase + '/' + id + '/orders');
//    };

    // Mock data
    dealDataService.getDeals = function() {
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
    
    dealDataService.saveDeal = function(deal) {
        // TODO: temporary code
            // $http.put();
        deal.id = 100;
    };
    
    return dealDataService;
}]);

tgbApp.directive('dealDetailEditableForm', function() {
    function link(scope, element, attrs) {
        if (!scope.deal.id) {
            scope.editableForm.$show();
        }
    };

    return {
        restrict: 'E',
        templateUrl: '/views/dealDetailEditableForm.html',
        link: link,
    };   
});

tgbApp.controller('mainController', function($scope, $state, $rootScope, dealDataService) {
    if (!$rootScope.currentUser) {
        $state.go('login');
    }
    
    $scope.deals = dealDataService.getDeals();
});

tgbApp.controller('dealDetailController', function($scope, $stateParams, dealDataService){
    $scope.deal = _.find($scope.deals, function(d) { return d.id == $stateParams.id; });
    if (!$scope.deal) {
        $scope.deal = { };
    }
    
    $scope.saveDeal = function() {
        dealDataService.saveDeal($scope.deal);
        // TODO: need error handling here.
        $scope.deals.unshift($scope.deal);
    };
    
    $scope.onShow = function() {
        $scope.editableForm.$show();        
    };
});

tgbApp.controller('aboutController', function($scope) {
    $scope.message = 'Look! I am an about page.';
});

tgbApp.controller('contactController', function($scope) {
    $scope.message = 'Contact us! JK. This is just a demo.';
});

tgbApp.controller('loginController', function($scope, $location, $state, $rootScope, ParseSDK) {
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
                $state.go('home');
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
                $state.go('home');
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

tgbApp.run(['$rootScope', 'applicationId', 'javaScriptKey', 'ParseSDK', function($rootScope, applicationId, javaScriptKey, ParseSDK) {
    ParseSDK.initialize(applicationId, javaScriptKey);
    $rootScope.scenario = 'Sign up';
    $rootScope.currentUser = ParseSDK.User.current();
}]);
