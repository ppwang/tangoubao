var tgbApp = angular.module('tuanGouBao', ['GlobalConfiguration', 'Parse', 'ui.router', 'xeditable', 'imageupload', 'ui.bootstrap']);

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

tgbApp.factory('dealGroupingService', [function() {
    var dealGroupingService = {};
    
    dealGroupingService.getYearMonthString = function(date) {
        return date 
            ? date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString() 
            : 'Undated';
    };
    
    dealGroupingService.groupDeals = function(deals) {
        // Group the deals first by deal type, then by end date.
        // TODO: optimize this code, so that we can defined multiple level of nested lists more cleanly.
        var originalDealByType = _.groupBy(deals, 'type');
        var dealGroups = {};
        for (var dealType in originalDealByType) {
            dealGroups[dealType] = {};
            dealGroups[dealType].active = true;

            var originalDealByYearMonth = _.groupBy(originalDealByType[dealType], function(deal) {
                // TODO: this doesn't work.
                //return this.getYearMonthString(deal.endDate);
                var date = deal.endDate;
                return date ? date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString() : 'Undated';
            });

            dealGroups[dealType].dealByYearMonth = {};
            var newDealByYearMonth = dealGroups[dealType].dealByYearMonth;
            for (var yearMonth in originalDealByYearMonth) {
                newDealByYearMonth[yearMonth] = {};
                newDealByYearMonth[yearMonth].active = false;
                newDealByYearMonth[yearMonth].deals = originalDealByYearMonth[yearMonth];
            }
        }
        
        return dealGroups;
    };
    
    // Inserts a deal in the proper location in deal group.
    dealGroupingService.insertDeal = function(deal, dealGroups) {
        if (!dealGroups['own']) {
            dealGroups['own'] = {};
        }
        var newDealGroup = dealGroups['own'];
        newDealGroup.active = true;
        
        if (!newDealGroup.dealByYearMonth) {
            newDealGroup.dealByYearMonth = {};
        }
        var newDealsByYearMonth = newDealGroup.dealByYearMonth;
        
        var yearMonthString = this.getYearMonthString(deal.endDate);
        if (!newDealsByYearMonth[yearMonthString]) {
            newDealsByYearMonth[yearMonthString] = {};
        }
        var deals = newDealsByYearMonth[yearMonthString];
        deals.active = true;
        
        if (!deals.deals) {
            deals.deals = [];
        }
        deals.deals.unshift(deal);
    };
    
    dealGroupingService.deleteDeal = function(deal, dealGroups) {
        // Assume the deal exists in the tree.
        for (var dealType in dealGroups) {
            var dealByYearMonth = dealGroups[dealType].dealByYearMonth;
            if (!dealByYearMonth) {
                continue;
            }

            var dealByYearMonthString = this.getYearMonthString(deal.endDate);
            if (!dealByYearMonth[dealByYearMonthString]) {
                continue;
            }
            
            var deals = dealByYearMonth[dealByYearMonthString].deals;
            if (!deals) {
                continue;
            }
            
            _.remove(deals, function(d) {
                return d.id === deal.id;
            });
            
            if (deals.length === 0) {
                delete dealByYearMonth[dealByYearMonthString];
            }
        }
    };
    
    return dealGroupingService;
}]);

tgbApp.factory('dealDataService', ['$http', function($http) {

    // Mock data
    var mockDealData = 
        [
            {
                id: 1,
                type: 'own',
                name: 'deal 1',
                subtitle: 'subtitle 1',
                detailedDescription: 'detailed description 1',
                beginDate: new Date(2015, 7, 1),
                endDate: new Date(2015, 7, 15),
                email: 'email1@tgb.com',
                phoneNumber: '111-1111',
                pickupOptions: [
                    {
                        id: 1,
                        description: 'pickup option 1',
                    },
                    {
                        id: 2,
                        description: 'pickup option 2',
                    },
                ],
                remarks: 'remarks 1',
            },
            {
                id: 2,
                type: 'own',
                name: 'deal 2',
                subtitle: 'subtitle 2',
                detailedDescription: 'detailed description 2',
                beginDate: new Date(2015, 7, 8),
                endDate: new Date(2015, 7, 16),
                email: 'email2@tgb.com',
                phoneNumber: '222-2222',
                remarks: 'remarks 2',
            },
            {
                id: 3,
                type: 'own',
                name: 'deal 3',
                subtitle: 'subtitle 3',
                detailedDescription: 'detailed description 3',
                beginDate: new Date(2015, 7, 30),
                endDate: new Date(2015, 8, 7),
                email: 'email3@tgb.com',
                phoneNumber: '333-3333',
                remarks: 'remarks 3',
            },
            {
                id: 4,
                type: 'own',
                name: 'deal 4',
                subtitle: 'subtitle 4',
                detailedDescription: 'detailed description 4',
                beginDate: new Date(2015, 8, 2),
                endDate: new Date(2015, 8, 9),
                email: 'email4@tgb.com',
                phoneNumber: '444-4444',
                remarks: 'remarks 4',
            },
            {
                id: 5,
                type: 'follow',
                name: 'deal 5',
                subtitle: 'subtitle 5',
                detailedDescription: 'detailed description 5',
                beginDate: new Date(2015, 8, 1),
                endDate: new Date(2015, 8, 14),
                email: 'email5@tgb.com',
                phoneNumber: '555-5555',
                remarks: 'remarks 5',
            },
            {
                id: 6,
                type: 'follow',
                name: 'deal 6',
                subtitle: 'subtitle 6',
                detailedDescription: 'detailed description 6',
                beginDate: new Date(2015, 8, 2),
                endDate: new Date(2015, 8, 10),
                email: 'email6@tgb.com',
                phoneNumber: '666-6666',
                remarks: 'remarks 6',
            },
            {
                id: 7,
                type: 'follow',
                name: 'deal 7',
                subtitle: 'subtitle 7',
                detailedDescription: 'detailed description 7',
                beginDate: new Date(2015, 8, 30),
                endDate: new Date(2015, 9, 2),
                email: 'email7@tgb.com',
                phoneNumber: '777-7777',
                remarks: 'remarks 7',
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
                type: deal.type,
                beginDate: deal.beginDate,
                endDate: deal.endDate,
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
    };

    return {
        restrict: 'E',
        templateUrl: '/views/dealDetailEditableForm.html',
        link: link,
    };   
});

tgbApp.controller('mainController', function($scope, $state, $rootScope, dealDataService, dealGroupingService) {
    if (!$rootScope.currentUser) {
        $state.go('login');
    }
    
    var deals = dealDataService.getDeals();
    
    $scope.dealGroups = dealGroupingService.groupDeals(deals);
    
    $scope.getSortedDealEndDates = function(dealGroup) {
        return _.sortByOrder(_.keys(dealGroup), [_.identity], [false]);
    };
    
    $scope.getSortedDeals = function(deals) {
        // Sort by end date descending.
        return _.sortByOrder(
            deals, 
            [function(deal) {
                return deal.endDate; 
            }],
            [false]);
    };
});

tgbApp.controller('dealDetailController', function($scope, $stateParams, $state, dealDataService, dealGroupingService){
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
            $scope.deal.type = 'own';
            $scope.deal.id = newId;
//            $scope.deals.unshift($scope.deal);
            
            dealGroupingService.insertDeal($scope.deal, $scope.dealGroups);
            
            // Navigate to the deal that was just created.
            $state.go('home.dealDetail', { 'id': $scope.deal.id });
        }
    };
    
    $scope.deleteDeal = function() {
        // TODO: need error handling here.
        dealDataService.deleteDeal($scope.deal.id);
        dealGroupingService.deleteDeal($scope.deal, $scope.dealGroups);
        $state.go('home.dealDetail', { 'id': -1 });
//        _.remove($scope.deals, function(d) {
//            return d.id === $scope.deal.id;
//        }); 

//        if ($scope.deals.length === 0) {
//            $state.go('home.dealDetail', { 'id': -1 });
//        } else {
//            $state.go('home.dealDetail', { 'id': $scope.deals[0].id });
//        }
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
    var claimtoken = $location.search().claimtoken;
    var nickname = $location.search().nickname;
    var headimgurl = $location.search().headimgurl;
    if (typeof wechatId !== 'undefined' && typeof claimtoken !== 'undefined') {
        $scope.user.wechatId = wechatId;
        $scope.user.claimtoken = claimtoken; 
    }
    $scope.user.nickname = nickname;
    $scope.user.headimgurl = headimgurl;

    $scope.signUp = function(user) {
        clearStatusMessage();
        user.wechatId = $scope.user.wechatId;
        user.claimtoken = $scope.user.claimtoken;
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
        user.claimtoken = $scope.user.claimtoken;
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
