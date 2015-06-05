var tgbApp = angular.module('tuanGouBao', ['GlobalConfiguration', 'Parse', 'ui.router', 'xeditable', 'imageupload']);

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

    // Mock data
    var mockDealData = 
        [
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

    dealDataService.getDeals = function() {
        // TODO: this is mock data
        return _.map(mockDealData, function(deal) {
            return {
                id: deal.id,
                name: deal.name,
            };
        });
    };
    
    dealDataService.getDeal = function(id) {
        // TODO: temporary code
        return _.find(mockDealData, function(deal) {
            return deal.id === id;
        });
    };
    
    dealDataService.saveDeal = function(deal) {
        // TODO: temporary code
        // $http.put();
        mockDealData.push(deal);
        return mockDealData.length;
    };
    
    dealDataService.deleteDeal = function(id) {
        // TODO: temporary code
        _.remove(mockDealData, function(deal) {
            return deal.id === id;
        });
    };
    
    return dealDataService;
}]);

tgbApp.directive('dealDetailEditableForm', function() {
    function link(scope, element, attrs) {
        if (!scope.deal.id) {
            scope.editableForm.$show();
        }
        
        // Populate image
//        if (scope.deal.imageBase64) {
//            var dataURL = scope.deal.imageType + ';base64,' + scope.deal.imageBase64;
//        }
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

tgbApp.controller('dealDetailController', function($scope, $stateParams, $state, dealDataService){
    $scope.deal = dealDataService.getDeal(parseInt($stateParams.id));
    if (!$scope.deal) {
        $scope.deal = { };
    }
    
    $scope.clearproductImageUpload = function() {
        if ($scope.productImageUpload) {
            $scope.productImageUpload.dataURL = undefined;
            
            if ($scope.productImageUpload.resized) {
                $scope.productImageUpload.resized.dataURL = undefined;            
            }
        }
        $scope.productImageUpload = undefined;
    };
    
    $scope.saveDeal = function() {
        // TODO: optimization - if image is not changed, we don't have to upload it.
        if ($scope.productImageUpload && $scope.productImageUpload.resized) {
            var resizedImage = $scope.productImageUpload.resized;
            $scope.deal.imageType = resizedImage.type;
            // TODO: find a better way to parse the base64 image data out of data url.
            $scope.deal.imageBase64 = $scope.productImageUpload.resized.dataURL.split(',')[1];
        }
        
        var newId = dealDataService.saveDeal($scope.deal);
        // TODO: need error handling here.
        
        // Add to deal to model if it is a new deal.
        if (!$scope.deal.id) {
            $scope.deal.id = newId;
            $scope.deals.unshift($scope.deal);
            // Navigate to the deal that was just created.
            $state.go('home.dealDetail', { 'id': $scope.deal.id });
        }
    };
    
    $scope.deleteDeal = function() {
        // TODO: need error handling here.
        dealDataService.deleteDeal($scope.deal.id);
        
        _.remove($scope.deals, function(d) {
            return d.id === $scope.deal.id;
        }); 

        if ($scope.deals.length === 0) {
            $state.go('home.dealDetail', { 'id': -1 });
        } else {
            $state.go('home.dealDetail', { 'id': $scope.deals[0].id });
        }
    };
});

tgbApp.controller('aboutController', function($scope) {
    $scope.message = 'Look! I am an about page.';
});

tgbApp.controller('contactController', function($scope) {
    $scope.message = 'Contact us! JK. This is just a demo.';
});

tgbApp.controller('loginController', function($scope, $location, $state, $rootScope, ParseSDK) {

    if ($scope.user == null)
    {
        $scope.user = {};
    }
    var wechatId = $location.search().wechatId;
    var claimToken = $location.search().claimToken;
    if (wechatId && claimToken) {
        $scope.user.wechatId = wechatId;
        $scope.user.claimToken = claimToken; 
    }

    $scope.signUp = function(user) {
        clearStatusMessage();
        user.wechatId = $scope.user.wechatId;
        user.claimToken = $scope.user.claimToken;
        ParseSDK.User.signUp(user)
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
        user.wechatId = $scope.user.wechatId;
        user.claimToken = $scope.user.claimToken;
        ParseSDK.User.logIn(user)
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
