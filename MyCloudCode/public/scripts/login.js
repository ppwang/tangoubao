var tgbApp = angular.module('tuanGouBao', ['GlobalConfiguration', 'ui.router', 'xeditable', 'imageupload']);

//tgbApp.config(function($locationProvider) {
//    //$locationProvider.html5Mode(true).hashPrefix('!');
//    $locationProvider.html5Mode({
//        enabled: true,
//        requireBase: false
//    });
//});

tgbApp.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    $httpProvider.defaults.withCredentials = true;
}]);

tgbApp.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
 
    $stateProvider
        .state('deals', {
            url:'/',
            views: {
                'content': {
                    templateUrl: 'views/deals.html',
                    controller: 'dealsController',
                }
            }
        })
        .state('publicDeals', {
            url:'/publicDeals',
            views: {
                'content': {
                    templateUrl: 'views/publicDeals.html',
                    controller: 'publicDealsController',
                }
            }
        })
        .state('deals.dealDetail', {
            url:'/deal/:id',
            views: {
                'dealDetail': {
                    templateUrl: 'views/dealDetail.html',
                    controller: 'dealDetailController',
                }
            }
        })
        .state('createDeal', {
            url:'/createDeal',
            views: {
                'content': {
                    templateUrl: 'views/createDeal.html',
                    controller: 'createDealController',
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

tgbApp.factory('serviceBaseUrl', ['$window', function($window) {
    if ($window.location.hostname === '127.0.0.1') {
        serviceBaseUrl = 'https://tuangoubao.parseapp.com';
    } else {
        serviceBaseUrl = '';
    }
    
    return serviceBaseUrl;
}]);

tgbApp.factory('userService', ['$http', 'serviceBaseUrl', '$rootScope', '$state', function($http, serviceBaseUrl, $rootScope, $state) {
    return {
        signUp: function(user) {
            return $http.post(serviceBaseUrl + '/signUp', user);
        },
        
        logIn: function(user) {
            if (user) {
                return $http.post(serviceBaseUrl + '/login', user);
            } else {
                return $http.post(serviceBaseUrl + '/login');
            }
        },
        
        logOut: function() {
            return $http.get(serviceBaseUrl + '/logOut');
        },
        
        ensureUserLoggedIn: function() {
            if (!$rootScope.currentUser) {
                this.logIn()
                    .success(function(data, status, headers, config) {
                          $rootScope.currentUser = data.user;
                    })
                    .error(function(data, status, headers, config) {
                        $rootScope.currentUser = null;
                        $state.go('login');            
                    });
            }
        },
    };
}]);

tgbApp.factory('dealGroupingService', [function() {
    var dealGroupingService = {};
    
    dealGroupingService.getYearMonthString = function(date) {
        return date 
            ? date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString() 
            : 'Undated';
//        return date ? date.substring(0, 7) : 'Undated';
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
//                return date ? date.substring(0, 7) : 'Undated';
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

tgbApp.factory('dealDataService', ['$http', 'serviceBaseUrl', '$q', function($http, serviceBaseUrl, $q) {    
    var apiUrl = serviceBaseUrl + '/api'
    var dealApiUrl = apiUrl + '/deal';
    var dealsApiUrl = apiUrl + '/deals';
    var dealDataService = {};
    
    var patchDateTimeProperties = function(deals) {
        _.forEach(deals, function(d) {
            if (d.beginDate) {
                d.beginDate = new Date(d.beginDate);
            }
            
            if (d.endDate) {
                d.endDate = new Date(d.endDate);
            }
        });
    };
    dealDataService.getDeals = function() {
        var dealsDeferred = $q.defer();
        $http.get(dealsApiUrl)
        .success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available
            patchDateTimeProperties(data.deals);
            dealsDeferred.resolve(data.deals);
        })
        .error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            console.log('error code:' + status);
            dealsDeferred.reject(status);
        });
        
        return dealsDeferred.promise;
    };
    
    dealDataService.getPublicDeals = function() {
        var publicDealsDeferred = $q.defer();
        
        $http.get(apiUrl + '/publicDeals')
        .success(function(data, status, headers, config) {
            patchDateTimeProperties(data.deals);
            publicDealsDeferred.resolve(data.deals);
        })
        .error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            console.log('error code:' + status);
            publicDealsDeferred.reject(status);
        });

        return publicDealsDeferred.promise;
    };
    
    dealDataService.getDeal = function(deals, id) {
        return _.find(deals, function(deal) {
            return deal.id === id;
        });
    };
    
    dealDataService.saveDeal = function(deal) {
        var newDeal = $http.put(dealApiUrl, deal);
        return newDeal;
    };
    
    dealDataService.deleteDeal = function(id) {
        // TODO:
    };
    
    return dealDataService;
}]);

tgbApp.factory('orderDataService', ['$http', function($http) {
    var mockOrderData = 
        [
            {
                id: 1,
                dealId: 5,
                state: 'created',
                createdDate: new Date(2015, 8, 2),
                numberOfUnits: 6,
                pickupOptionId: 2,
                wechatId: 'customer1',
                phoneNumber: '123-4325',
                email: 'customer1@abc.com',
            },
            {
                id: 2,
                dealId: 5,
                state: 'completed',
                createdDate: new Date(2015, 8, 3),
                completedDate: new Date(2015, 9, 1),
                numberOfUnits: 3,
                pickupOptionId: 1,                
                wechatId: 'customer2',
                phoneNumber: '365-7285',
                email: 'customer2@abc.com',
            },
            {
                id: 3,
                dealId: 6,
                state: 'created',
                createdDate: new Date(2015, 8, 5),
                numberOfUnits: 4.5,
                pickupOptionId: 2,                
                wechatId: 'customer3',
                phoneNumber: '177-3984',
                email: 'customer3@abc.com',
            },
        ];
        
    var orderDataService = {};
    
    orderDataService.getOrders = function()
    {
        return _.map(mockOrderData, function(order) {
            return {
                id: order.id,
                dealId: order.dealId,
                state: order.state,
                createdDate: order.createdDate,
                completedDate: order.completedDate,
            };
        });          
    };

    orderDataService.getOrdersByDealId = function(dealId) {
        return _.filter(mockOrderData, function(o) {
            return o.dealId === dealId;
        });
    };
    
    return orderDataService;
}]);

tgbApp.directive('dealCard', function() {
    return {
        restrict: 'E',
        templateUrl: '/directives/dealCard.html',
        scope: {
            deal: '=',  
        },
    };   
});

tgbApp.directive('dealDetailEditableForm', function() {
    function link(scope, element, attrs) {
        if (!scope.deal.id) {
            // for new deal, default type is "own"
            scope.deal.type = 'own';
            scope.editableForm.$show();
        }
    };

    return {
        restrict: 'E',
        templateUrl: '/views/dealDetailEditableForm.html',
        link: link,
    };   
});

tgbApp.controller('dealsController', function($scope, $state, $rootScope, userService, dealDataService, dealGroupingService) {
    userService.ensureUserLoggedIn();
    
    dealDataService.getDeals().then(function(deals) {
        $scope.deals = deals;
        $scope.dealGroups = dealGroupingService.groupDeals(deals);    
    });
        
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

tgbApp.controller('publicDealsController', ['$scope', 'dealDataService', 'userService', function($scope, dealDataService, userService) {
    userService.ensureUserLoggedIn();
    
    var setDeals = function(deals) {
        $scope.Deals = deals;
        $scope.chunkedDeals = _.chunk(deals, 4); 
    };
    
    dealDataService.getPublicDeals().then(function(deals) {
        setDeals(deals);
    });
}]);

tgbApp.controller('dealCardController', ['$scope', function($scope) {
    $scope.getDealRemainingDays = function() {
        if ($scope.deal.endDate) {
            return Math.ceil(($scope.deal.endDate.getTime() - Date.now())/86400000);
        }
    };
}]);

tgbApp.controller('dealDetailController', function($scope, $stateParams, $state, dealDataService, dealGroupingService) {
    var dealId = $stateParams.id;
    
    if (dealId == '-1') {
        $scope.deal = {
            type: 'own',
        };
    } else {
        $scope.deal = dealDataService.getDeal($scope.deals, dealId);
    }

    if (!$scope.deal.pickupOptions) {
        $scope.deal.pickupOptions = {};
    }
    
    // Create a shadow copy of pickupOptions, so that we can hook into editable form in a custom way.
    $scope.deal.pickUpOptionsShadow = angular.copy($scope.deal.pickupOptions);
    
    $scope.getDealRemainingDays = function() {
        return Math.ceil(($scope.deal.endDate.getTime() - Date.now())/86400000);    
    };
    
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
        
        dealDataService.saveDeal($scope.deal)
        .then(function(response) {
            // TODO: need error handling here.
            
            // Add to deal to model if it is a new deal.
            if (!$scope.deal.id) {
                $scope.deal.type = response.data.type;
                $scope.deal.id = response.data.id;
                $scope.deal.dealImageUrl = response.data.dealImageUrl;
    //            $scope.deals.unshift($scope.deal);
                dealGroupingService.insertDeal($scope.deal, $scope.dealGroups);
                
                // Navigate to the deal that was just created.
                $state.go('deals.dealDetail', { 'id': $scope.deal.id });
            }
            
            // Synchronize any custom shadow objects.
            // TODO: copying might be expensive. Consider updating instead. 
            $scope.deal.pickupOptions = angular.copy($scope.deal.pickUpOptionsShadow);
        }, function(error){
            alert(error.message);
        });
    };
    
    $scope.deleteDeal = function() {
        // TODO: need error handling here.
        dealDataService.deleteDeal($scope.deal.id);
        dealGroupingService.deleteDeal($scope.deal, $scope.dealGroups);
        $state.go('deals.dealDetail', { 'id': -1 });
    };

    $scope.newPickupOptionShadow = function() {
        // TODO: how do we update option id after saving? Probably save will return entire deal object.
        var newOption = {
            id: _.max($scope.deal.pickUpOptionsShadow, 'id') + 1,  
        };
        $scope.deal.pickUpOptionsShadow.push(newOption);
    }
    
    $scope.deletePickupOptionShadow = function(option) {
        _.remove($scope.deal.pickUpOptionsShadow, function(o) {
            return o.id === option.id; 
        });
    };
    
    $scope.cancelForm = function() {
        // Restore shadow objects;
        // TODO: copying might be expensive. Consider updating instead. 
        $scope.deal.pickUpOptionsShadow = angular.copy($scope.deal.pickupOptions);
        
        $scope.editableForm.$cancel();
    };
    
    $scope.purchaseDeal = function() {
        
    };
});

tgbApp.controller('createDealController', ['$scope', function($scope) {
    if (!$rootScope.currentUser) {
        // TODO: after signing in, return to orders page.
        $state.go('login');
    }
    
    $scope.orders = orderDataService.getOrders();
    // TODO: should develope a deal/order cache, so that we don't have to load individual deal/order repeatedly.
}]);

tgbApp.controller('aboutController', function($scope) {
    $scope.message = 'Look! I am an about page.';
});

tgbApp.controller('contactController', function($scope) {
    $scope.message = 'Contact us! JK. This is just a demo.';
});

tgbApp.controller('loginController', function($scope, $location, $state, $rootScope, userService) {

    if (!$scope.user)
    {
        $scope.user = {};
    }
    var wechatId = $location.search().wechatId;
    var claimtoken = $location.search().claimtoken;
    var nickname = $location.search().nickname;
    var headimgurl = $location.search().headimgurl;
    if (wechatId && claimtoken) {
        $scope.user.wechatId = wechatId;
        $scope.user.claimtoken = claimtoken;
    }
    $scope.user.nickname = nickname;
    $scope.user.headimgurl = headimgurl;

    $scope.signUp = function(user) {
        clearStatusMessage();
        user.wechatId = $scope.user.wechatId;
        user.claimtoken = $scope.user.claimtoken;
        userService.signUp(user)
            .then(function(user) {
                $rootScope.currentUser = user;
                $state.go('deals');
            },
            function(error) {
                $scope.statusMessage = "Unable to sign up:  " + error.code + " " + error.message;
            });
    };
  
    $scope.logIn = function(user) {
        clearStatusMessage();
        user.wechatId = $scope.user.wechatId;
        user.claimtoken = $scope.user.claimtoken;
        userService.logIn(user)
            .then(function(user) {
                $rootScope.currentUser = user;
                $state.go('deals');
            },
            function(error) {
                $scope.statusMessage = "Unable to log in: " + error.code + " " + error.message;
            });
    };
  
    $scope.logOut = function() {
        clearStatusMessage();
        userService.logOut();
        $rootScope.currentUser = null;
    };
    
    // Private methods.
    var clearStatusMessage = function() {
        $scope.statusMessage = null;
    };
});

tgbApp.run(['$rootScope', 'applicationId', 'javaScriptKey', 'userService', '$http', function($rootScope, applicationId, javaScriptKey, userService, $http) {
    //ParseSDK.initialize(applicationId, javaScriptKey);
    $rootScope.scenario = 'Sign up';
    userService.ensureUserLoggedIn();
}]);
