var tgbApp = angular.module('tuanGouBao', ['GlobalConfiguration', 'ui.router', 'xeditable', 'imageupload', 'ui.bootstrap']);

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
    $urlRouterProvider.otherwise('/publicDeals');
 
    $stateProvider
        .state('welcome', {
            url:'/welcome',
            views: {
                'content': {
                    templateUrl: 'views/welcome.html',
                    controller: 'welcomeController',
                }
            }
        })
        .state('publicDeals', {
            url:'/publicDeals',
            views: {
                'content': {
                    templateUrl: 'views/deals.html',
                    controller: 'publicDealsController',
                }
            }
        })
        .state('dealDetail', {
            url: '/dealDetail/:id',
            views: {  
                'content': {  
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
        .state('dealStatus', {
            url:'/dealStatus/:id',
            params: { deal: null },
            views: {
                'content': {
                    templateUrl: 'views/dealStatus.html',
                    controller: 'dealStatusController',
                }
            }
        })
        .state('orderDetail', {
            url:'/orderDetail/:id',
            views: {
                'content': {
                    templateUrl: 'views/orderDetail.html',
                    controller: 'orderDetailController',
                }
            }
        })
        .state('createOrder', {
            //　dealId is extra. It is used to redirect user when deal is not passed. Usually this happens when page is refreshed.
            url:'/createOrder?dealId',
            params: { deal: null },
            views: {
                'content': {
                    templateUrl: 'views/createOrder.html',
                    controller: 'createOrderController',
                }
            }
        })
        .state('buyerAccount', {
            url:'/buyerAccount',
            views: {
                'content': {
                    templateUrl: 'views/buyerAccount.html',
                    controller: 'buyerAccountController',
                }
            }
        })
        .state('buyerAccount.orders', {
            url:'/orders/:status',
            views: {
                'content': {
                    templateUrl: 'views/orders.html',
                    controller: 'filteredOrdersController',
                }
            }
        })
        .state('buyerAccount.followedDeals', {
            url:'/followedDeals',
            views: {
                'content': {
                    templateUrl: 'views/deals.html',
                    controller: 'followedDealsController',
                }
            }
        })
        .state('sellerAccount', {
            url:'/sellerAccount',
            views: {
                'content': {
                    templateUrl: 'views/sellerAccount.html',
                    controller: 'sellerAccountController',
                }
            }
        })
        .state('sellerAccount.deals', {
            url:'/deals/:status',
            views: {
                'content': {
                    templateUrl: 'views/deals.html',
                    controller: 'filteredDealsController',
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

tgbApp.filter('daysRemainingFilter', function() {
    return function(date) {
        if (date) {
            var daysRemaining = Math.ceil((date.getTime() - Date.now())/86400000);
            if (daysRemaining > 0) {
                return '还剩' + daysRemaining + '天';
            } else {
                return '已截止订购';
            }
        } else {
            return '未知';
        }
    };
});

tgbApp.factory('serviceBaseUrl', ['$window', function($window) {
    if ($window.location.hostname === '127.0.0.1') {
        serviceBaseUrl = 'https://tuangoubao.parseapp.com';
    } else {
        serviceBaseUrl = '';
    }
    
    return serviceBaseUrl;
}]);

tgbApp.factory('userService', ['$http', '$q', 'serviceBaseUrl', '$rootScope', '$state', function($http, $q, serviceBaseUrl, $rootScope, $state) {
    var currentUser;
    
    var setCurrentUser = function(user) {
        currentUser = user;
        // TODO：refactor the code so we no longer rely on currentUser being set on root scope.
        $rootScope.currentUser = user;
    };
    
    return {
        currentUser: currentUser,
        
        signUp: function(user) {
            var resultDeferred = $q.defer();

            $http.post(serviceBaseUrl + '/signUp', user)
            .success(function(data, status, headers, config) {
                setCurrentUser(data.user);
                resultDeferred.resolve();
            })
            .error(function(data, status, headers, config) {
                setCurrentUser(null);
                resultDeferred.reject("Unable to log in: " + status + " " + data);
                console.log('error code:' + status);
            });
            
            return resultDeferred.promise;
        },
        
        logIn: function(user) {
            var resultDeferred = $q.defer();
            var httpResult;

            if (user) {
                httpResult = $http.post(serviceBaseUrl + '/login', user);
            } else {
                httpResult = $http.post(serviceBaseUrl + '/login');
            }

            httpResult
            .success(function(data, status, headers, config) {
                setCurrentUser(data.user);
                resultDeferred.resolve(currentUser);
            })
            .error(function(data, status, headers, config) {
                setCurrentUser(null);
                resultDeferred.reject(
                    {
                        data: data,
                        status: status,
                    });
                console.log('error code:' + status);
            });

            return resultDeferred.promise;
        },
        
        logOut: function() {
            var resultDeferred = $q.defer();
            setCurrentUser(null);

            $http.get(serviceBaseUrl + '/logOut')
            .success(function(data, status, headers, config) {
                resultDeferred.resolve();
            })
            .error(function(data, status, headers, config) {
                resultDeferred.reject(
                    {
                        data: data,
                        status: status,
                    });
                console.log('error code:' + status);
            });
        
            return resultDeferred.promise;
        },
        
        ensureUserLoggedIn: function() {
            if (!currentUser) {
                return this.logIn(null)
                .then(
                    function(user) {
                        return user;
                    },
                    function(error) {
                        $state.go('login');            
                    })
            } else {
                var resultDeferred = $q.defer();
                resultDeferred.resolve(currentUser);
                return resultDeferred.promise;
            }
        },
    };
}]);

tgbApp.factory('regionDataService', ['$http', 'serviceBaseUrl', '$q', function($http, serviceBaseUrl, $q) {
    var regionsPromise;

    var getRegions = function() {
        var regionsDeferred = $q.defer();
        $http.get(serviceBaseUrl + '/api/regions')
            .success(function(data, status, headers, config) {
                  regionsDeferred.resolve(data.regions);
            })
            .error(function(data, status, headers, config) {
                regionsDeferred.reject(status);
                console.log('error code:' + status);
            });
        return regionsDeferred.promise;
    };

    var init = function() {
        if (!regionsPromise) {
            regionsPromise = getRegions();
        }    
    };
        
    return {
        populateRegions: function(regionList) {
            init();
            regionsPromise
            .then(function(regions) {
                _.forEach(regions, function(r) {
                    regionList.push(r);
                });
            });
        },
        
        setDealRegion: function(deal) {
            init();
            regionsPromise.then(function(regions) {
                var region = _.find(regions, function(r) {
                    return r.id === deal.regionId;
                });

                if (region) {
                    deal.region = region.name;
                } else {
                    deal.region = '??';
                }
            });
        },
    };
}]);

tgbApp.factory('dealDataService', ['$http', 'serviceBaseUrl', '$q', 'regionDataService', function($http, serviceBaseUrl, $q, regionDataService) {
    // Cached data
    // The deals are transformed in the following sequence:
    // - Group by type (own, follow, order)
    // - Group by status (active, closed)
    // - Sort by endDate in descending order.
    var cachedDealsPromise;
    
    var cachedPublicDealsPromise;
    
    var apiUrl = serviceBaseUrl + '/api'
    var dealApiUrl = apiUrl + '/deal';
    var dealsApiUrl = apiUrl + '/deals';
    var dealDataService = {};
    
    var patchDealFromServer = function(deal) {
        if (deal.beginDate) {
            deal.beginDate = new Date(deal.beginDate);
        }

        if (deal.endDate) {
            deal.endDate = new Date(deal.endDate);
        }
        
        if (deal.pickupOptions) {
            deal.pickupOptions = angular.fromJson(deal.pickupOptions);
        }
        
        regionDataService.setDealRegion(deal);
    };
    
    var groupDeals = function(deals) {
        // Group by type.
        var groupByType = _.groupBy(deals, 'type');
        for (var type in groupByType) {
            // Group by status.
            groupByType[type] = _.groupBy(groupByType[type], function(d) {
                return d.status || 'active';
            });
            
            // Sort by endTime.
            for (var status in groupByType[type]) {
                groupByType[type][status] = _.sortByOrder(groupByType[type][status], ['createdAt'], [false]);
            }
        };
        return groupByType;
    };
    
    var dirtyCache = function() {
        cachedDealsPromise = null;
        cachedPublicDealsPromise = null;
    };
    
    dealDataService.patchDealFromServer = patchDealFromServer;
    
    dealDataService.getDeals = function() {
        if (cachedDealsPromise) {
            return cachedDealsPromise;
        }
        
        var resultDeferred = $q.defer();
        $http.get(dealsApiUrl)
        .success(function(data, status, headers, config) {
            _.forEach(data.deals, function(d) {
                patchDealFromServer(d);
            });
            var groupedDeals = groupDeals(data.deals);
            resultDeferred.resolve(groupedDeals);
            cachedDealsPromise = resultDeferred.promise;
        })
        .error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            console.log('error code:' + status);
            resultDeferred.reject(status);
            cachedDealsPromise = null;
        });
        
        return resultDeferred.promise;
    };
    
    dealDataService.getPublicDeals = function() {
        if (cachedPublicDealsPromise) {
            return cachedPublicDealsPromise;    
        }
        
        var resultDeferred = $q.defer();
        
        $http.get(apiUrl + '/publicDeals')
        .success(function(data, status, headers, config) {
            _.forEach(data.deals, function(d) {
                patchDealFromServer(d);
            });
            resultDeferred.resolve(data.deals);
            cachedPublicDealsPromise = resultDeferred.promise;
        })
        .error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            console.log('error code:' + status);
            resultDeferred.reject(status);
            cachedPublicDealsPromise = null;
        });

        return resultDeferred.promise;
    };
    
    dealDataService.getDeal = function(id) {
        var resultDeferred = $q.defer();
        
        $http.get(apiUrl + '/deal/' + id)
        .success(function(data, status, headers, config) {
            patchDealFromServer(data);
            resultDeferred.resolve(data);
        })
        .error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            console.log('error code:' + status);
            resultDeferred.reject(status);
        });

        return resultDeferred.promise;
    };
    
    dealDataService.saveDeal = function(deal) {
        var newDealDeferred = $q.defer();
        
        $http.put(dealApiUrl, deal)
        .success(function(data, status, headers, config) {
            patchDealFromServer(data);
            newDealDeferred.resolve(data);
            dirtyCache();
        })
        .error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            console.log('error code:' + status);
            newDealDeferred.reject(status);
        });
        
        return newDealDeferred.promise;
    };
    
    dealDataService.followDeal = function(deal) {
        var resultDeferred = $q.defer();
        
        $http.put(apiUrl + '/followDeal/' + deal.id)
        .success(function(data, status, headers, config) {
            resultDeferred.resolve();
            deal.followed = true;
        })
        .error(function(data, status, headers, config) {
            console.log('error code:' + status);
            resultDeferred.reject(status);
        });
        
        return resultDeferred.promise;
    };

    dealDataService.unfollowDeal = function(deal) {
        var resultDeferred = $q.defer();
        
        $http.delete(apiUrl + '/followDeal/' + deal.id)
        .success(function(data, status, headers, config) {
            resultDeferred.resolve();
            deal.followed = false;
        })
        .error(function(data, status, headers, config) {
            console.log('error code:' + status);
            resultDeferred.reject(status);
        });
        
        return resultDeferred.promise;
    };

    dealDataService.getDealStatus = function(id) {
        var resultDeferred = $q.defer();
        
        $http.get(apiUrl + '/dealStatus/' + id)
        .success(function(data, status, headers, config) {
            resultDeferred.resolve(data);
        })
        .error(function(data, status, headers, config) {
            console.log('error code:' + status);
            resultDeferred.reject(status);
        });
        
        return resultDeferred.promise;
    };
    
    dealDataService.closeDeal = function(deal) {
        return $http.put(apiUrl + '/dealStatus/' + deal.id + '?status=closed').then(function() {
            deal.status = 'closed';
        });
    }
    
    dealDataService.sendSpreadsheet = function(id) {
        return $http.get(apiUrl + '/dealReport/' + id);    
    };
    
    dealDataService.deleteDeal = function(id) {
        // TODO:
    };
    
    return dealDataService;
}]);

tgbApp.factory('orderDataService', ['$http', 'serviceBaseUrl', '$q', 'dealDataService', function($http, serviceBaseUrl, $q, dealDataService) {
    // Cached data
    var cachedOrdersPromise;
    
    var groupOrders = function(orders) {
        // Group by status.
        var groupByStatus = _.groupBy(orders, function(d) {
                return d.status || 'active';
        });
        
        for (var status in groupByStatus) {
            // Sort by created time.
            // TODO: is the property named createdAt or orderTime?
            groupByStatus[status] = _.sortByOrder(groupByStatus[status], ['orderTime'], [false]);
        };
        return groupByStatus;
    };
    
    var dirtyCache = function() {
        cachedOrdersPromise = null;    
    };
    
    var orderDataService = {};
    
    orderDataService.createOrder = function(order) {
        resultDeferred = $q.defer();
        
        $http.put(serviceBaseUrl + '/api/order', order)
        .success(function(data, status, headers, config) {
            resultDeferred.resolve();
            dirtyCache();
        })
        .error(function(data, status, headers, config) {
            console.log('error code:' + status);
            resultDeferred.reject(status);
        });
        
        return resultDeferred.promise;
    };
    
    orderDataService.getOrder = function(id) {
        var resultDeferred = $q.defer();
        
        $http.get(serviceBaseUrl + '/api/order/' + id)
        .success(function(data, status, headers, config) {
            dealDataService.patchDealFromServer(data.deal);
            resultDeferred.resolve(data);
        })
        .error(function(data, status, headers, config) {
            console.log('error code:' + status);
            resultDeferred.reject(status);
        });
        
        return resultDeferred.promise;
    };
    
    orderDataService.getOrders = function() {
        if (cachedOrdersPromise) {
            return cachedOrdersPromise;
        }
        
        var resultDeferred = $q.defer();
        
         $http.get(serviceBaseUrl + '/api/myOrders')
         .success(function(data, status, headers, config) {
             var groupedOrders = groupOrders(data.orders);
             resultDeferred.resolve(groupedOrders);
             cachedOrdersPromise = resultDeferred.promise; 
         })
         .error(function(data, status, headers, config) {
             console.log('error code:' + status);
             resultDeferred.reject(status);
             cachedOrdersPromise = null;
         });

        return resultDeferred.promise;
    };
    
    return orderDataService;
}]);

tgbApp.factory('modalDialogService', ['$modal', function($modal) {
    var modalDialogService = {};
    
    modalDialogService.show = function(settings) {
        var modalInstance = $modal.open({
            templateUrl: 'views/modalDialog.html',
            controller: 'modalDialogController',
            size: 'sm',
            backdrop: 'static',
            resolve: {
                settings: function () {
                    return settings;
                }
            }
        });
        
        return modalInstance.result;
    };
    
    return modalDialogService;
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

tgbApp.directive('dealCardList', function() {
    return {
        restrict: 'E',
        templateUrl: '/directives/dealCardList.html',
        scope: {
            dealsPromiseWrapper: '=',  
        },
    };   
});

tgbApp.directive('orderCard', function() {
    return {
        restrict: 'E',
        templateUrl: '/directives/orderCard.html',
        scope: {
            order: '=',  
        },
    };   
});

tgbApp.directive('orderCardList', function() {
    return {
        restrict: 'E',
        templateUrl: '/directives/orderCardList.html',
        scope: {
            ordersPromiseWrapper: '=',  
        },
    };   
});

tgbApp.directive('backgroundImage', function() {
    return function(scope, element, attrs) {
        var imgUrl = attrs.backgroundImage;
        element.css({ 
            'background-image': 'url(' + imgUrl + ')'
        });
    };
});

tgbApp.controller('welcomeController', ['$scope', 'userService', function($scope, userService) {
    userService.ensureUserLoggedIn();
}]);
//tgbApp.controller('$scope', 'topNavController', ['$scope', 'userService', function(userService) {
//    $scope.currentUser = userService.currentUser;
//}]);

tgbApp.controller('publicDealsController', ['$scope', 'dealDataService', 'userService', function($scope, dealDataService, userService) {
    userService.ensureUserLoggedIn();
    
    // Wrap the promise in an object before passing into child directive.
    // http://stackoverflow.com/questions/17159614/how-do-i-pass-promises-as-directive-attributes-in-angular
    $scope.dealsPromiseWrapper = {
        promise: dealDataService.getPublicDeals(),
    };
}]);

tgbApp.controller('dealCardController', ['$scope', '$state', function($scope, $state) {
    $scope.showDealDetail = function() {
        $state.go('dealDetail', {'id': $scope.deal.id} );
    };
}]);

tgbApp.controller('dealCardListController', ['$scope', function($scope) {
    $scope.dealsPromiseWrapper.promise.then(function(deals) {
        $scope.chunkedDeals = _.chunk(deals, 4); 
    });
}]);

tgbApp.controller('orderCardController', ['$scope', '$state', function($scope, $state) {
    $scope.showOrderDetail = function() {
        $state.go('orderDetail', {'id': $scope.order.id} );
    };
}]);

tgbApp.controller('orderCardListController', ['$scope', function($scope) {
    $scope.ordersPromiseWrapper.promise.then(function(orders) {
        $scope.chunkedOrders = _.chunk(orders, 4); 
    });
}]);

tgbApp.controller('dealDetailController', ['$scope', '$state', '$stateParams', 'userService', 'dealDataService', function($scope, $state, $stateParams, userService, dealDataService) {
    userService.ensureUserLoggedIn();
    
    dealDataService.getDeal($stateParams.id)
    .then(function(d) {
        $scope.deal = d;
    });
    
    $scope.toggleFollowedStatus = function() {
        var resultPromise;
        if ($scope.deal.followed) {
            dealDataService.unfollowDeal($scope.deal);
        } else {
            dealDataService.followDeal($scope.deal)
        }
    };
    
    $scope.purchaseDeal = function() {
        $state.go(
            'createOrder', 
            { 
                deal: $scope.deal,
                dealId: $scope.deal.id,
            });
    };
    
    $scope.manageDeal = function() {
        $state.go(
            'dealStatus',
            {
                id: $scope.deal.id,
                deal: $scope.deal,
            });
    };
}]);

tgbApp.controller('createDealController', ['$scope', '$state', 'dealDataService', 'regionDataService', 'userService', function($scope, $state, dealDataService, regionDataService, userService) {
    userService.ensureUserLoggedIn();
    
    var addNewPickupOption = function() {
        var nextId;
        if ($scope.deal.pickupOptions.length === 0) {
            nextId = 0;
        } else {
            nextId = _.max($scope.deal.pickupOptions, 'id').id + 1;
        }
        
        $scope.deal.pickupOptions.push({
            id: nextId,
        });
    };

    $scope.regions = [];
    regionDataService.populateRegions($scope.regions);
    
    // Populate the new deal with initial parameters.
    $scope.deal = {};
    $scope.deal.unitName = '磅';
    if (userService.currentUser) {
        $scope.deal.email = userService.email;
        $scope.deal.phoneNumber = userService.phoneNumber;
    }
    $scope.deal.pickupOptions = [];
    addNewPickupOption();
    
    $scope.clearproductImageUpload = function() {
        if ($scope.productImageUpload) {
            $scope.productImageUpload.dataURL = undefined;
            
            if ($scope.productImageUpload.resized) {
                $scope.productImageUpload.resized.dataURL = undefined;            
            }
        }
        $scope.productImageUpload = undefined;
    };

    $scope.addPickupOption = function() {
        addNewPickupOption();
    };
    
    $scope.removePickupOption = function(option) {
        _.remove($scope.deal.pickupOptions, function(o) {
            return o.id === option.id;
        })    
    };
    
    $scope.saveDeal = function() {
        // Validate the new deal.
        _.remove($scope.deal.pickupOptions, function(o) {
            return !o.address && !o.contactName && !o.phoneNumber;
        });
        
        if ($scope.productImageUpload && $scope.productImageUpload.resized) {
            var resizedImage = $scope.productImageUpload.resized;
            $scope.deal.imageType = resizedImage.type;
            // TODO: find a better way to parse the base64 image data out of data url.
            $scope.deal.imageBase64 = $scope.productImageUpload.resized.dataURL.split(',')[1];
        }

        dealDataService.saveDeal($scope.deal);
    };
}]);

tgbApp.controller('orderDetailController', ['$scope', '$stateParams', 'userService', 'orderDataService', 'regionDataService', function($scope, $stateParams, userService, orderDataService, regionDataService) {
    userService.ensureUserLoggedIn();

    var id = $stateParams.id;
    orderDataService.getOrder(id).then(function(order) {
        $scope.order = order;
        $scope.pickupOption = _.find($scope.order.deal.pickupOptions, function(o){
            return o.id === order.pickupOptionId;
        });
    });
}]);

tgbApp.controller('createOrderController', ['$scope', '$state', '$stateParams', 'userService', 'orderDataService', 'modalDialogService', function($scope, $state, $stateParams, userService, orderDataService, modalDialogService) {
    $scope.order = {
        dealId: $stateParams.dealId,
    };
    
    userService.ensureUserLoggedIn().then(function(user) {
        $scope.user = user;
        $scope.order.email = user.email;
        $scope.order.phoneNumber = user.phoneNumber;
        $scope.order.creatorName = user.nickname;
        // TODO: verify that imageUrl is the correct property.
        $scope.order.creatorImageUrl = user.headimgurl;
    });

    if (!$stateParams.deal) {
        // deal parameter can be null if browser is refreshed (since the entire deal object is not in the url).
        $state.go(
            'dealDetail',
            {
                id: $stateParams.dealId,
            }
        );
        return;
    }
        
    $scope.deal = $stateParams.deal;

    var pickupOptions = $scope.deal.pickupOptions;
    if (pickupOptions && pickupOptions.length > 0) {
        $scope.order.pickupOptionId = pickupOptions[0].id;  
    }
    
    $scope.createOrder = function() {
        var deal = $scope.deal;
        var order = $scope.order;
        var units = order.quantity * deal.unitsPerPackage;
        var price = units * deal.unitPrice;
        var pickupOption = _.find(deal.pickupOptions, function(o) {
            return o.id === order.pickupOptionId;
        });
        var address = pickupOption ? pickupOption.address : '未知';
        var message = '您即将预定 ' + deal.name + ' ' + order.quantity + '件(共' + units + deal.unitName + '), 总计' + price + '美元. 取货地址是 ' + address + '. 谢谢您的参与!';
        
        modalDialogService.show({
            message: message,
            showCancelButton: true,
        }).then(function() {
            orderDataService.createOrder($scope.order).then(function() {
                // TODO: show order details.
            }, function(error) {
                var orderFailedMessage = '您的订单提交不成功,　请稍后再试试.';
                modalDialogService.show({
                    message: orderFailedMessage,
                    showCancelButton: false,
                });
            });
        }, function() {
        });
    };
}]);

tgbApp.controller('buyerAccountController', ['$state', 'userService', function($state, userService) {
    userService.ensureUserLoggedIn();
}]);

tgbApp.controller('filteredOrdersController', ['$scope', '$stateParams', 'orderDataService', function($scope, $stateParams, orderDataService) {
    $scope.ordersPromiseWrapper = {
        promise: orderDataService.getOrders().then(function(orders) {
            return orders[$stateParams.status];
        }),
    };
}]);

tgbApp.controller('sellerAccountController', ['$state', 'userService', function($state, userService) {
    userService.ensureUserLoggedIn();
}]);

tgbApp.controller('filteredDealsController', ['$scope', '$stateParams', 'dealDataService', function($scope, $stateParams, dealDataService) {
    $scope.dealsPromiseWrapper = {
        promise: dealDataService.getDeals().then(function(deals) {
            return deals.own[$stateParams.status];
        }),
    };
}]);

tgbApp.controller('followedDealsController', ['$scope', 'dealDataService', function($scope, dealDataService) {
    $scope.dealsPromiseWrapper = {
        promise: dealDataService.getDeals().then(function(deals) {
            return deals.follow.active;
        }),
    };
}]);

tgbApp.controller('dealStatusController', ['$scope', '$state', '$stateParams', 'userService', 'dealDataService', 'modalDialogService', function($scope, $state, $stateParams, userService, dealDataService, modalDialogService) {
    userService.ensureUserLoggedIn();

    if (!$stateParams.deal) {
        $state.go('dealDetail', { id: $stateParams.id });
        return;
    }
    
    $scope.deal = $stateParams.deal;
    
    $scope.modifyDeal = function() {
        
    };
    
    $scope.closeDeal = function() {
        dealDataService.closeDeal($scope.deal);
    };
    
    $scope.sendMessage = function() {
    };
    
    $scope.sendSpreadsheet = function() {
        dealDataService.sendSpreadsheet($scope.deal.id).then(function() {
            var message = '买家信息已生成Excel表格并发送到您的邮箱: ' + $scope.deal.email + '. 谢谢您使用团购宝!';

            modalDialogService.show({
                message: message,
                showCancelButton: false,
            });
        }, function() {
            var failedMessage = '没能将买家信息发送到您的邮箱, 请稍后再试试.';
            modalDialogService.show({
                message: failedMessage,
                showCancelButton: false,
            });
        });
    };
}]);

tgbApp.controller('modalDialogController', ['$scope', '$modalInstance', 'settings', function($scope, $modalInstance, settings) {
    $scope.settings = settings;
    
    $scope.ok = function () {
        $modalInstance.close(null);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss(null);
    };
}]);

tgbApp.controller('aboutController', function($scope) {
    $scope.message = 'Look! I am an about page.';
});

tgbApp.controller('contactController', function($scope) {
    $scope.message = 'Contact us! JK. This is just a demo.';
});

tgbApp.controller('loginController', function($scope, $location, $state, userService) {

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
        $scope.wechatWelcomeVisible = true;
    }
    else {
        $scope.wechatWelcomeVisible = false;
    }
    $scope.user.nickname = nickname;
    $scope.user.headimgurl = headimgurl;

    $scope.signUp = function(user) {
        clearStatusMessage();
        user.wechatId = $scope.user.wechatId;
        user.claimtoken = $scope.user.claimtoken;
        userService.signUp(user).then(
            function() {
            },
            function(response) {
                if (response.data == "Email not verified!") {
                    $('#email-confirm-modal').modal({
                        keyboard: false
                    });
                }
                else {
                    $scope.statusMessage = "Unable to sign up: " + response.status + " " + response.data;                    
                }
            });
    };
  
    $scope.logIn = function(user) {
        clearStatusMessage();
        user.wechatId = $scope.user.wechatId;
        user.claimtoken = $scope.user.claimtoken;
        userService.logIn(user).then(
            function(user) {
                $state.go('welcome');
            },
            function(response) {
                if (response.data == "Email not verified!") {
                    $('#email-confirm-modal').modal({
                        keyboard: false
                    });
                }
                else {
                    $scope.statusMessage = "Unable to log in: " + response.status + " " + response.data;
                }
            });
    };
  
    $scope.logOut = function() {
        clearStatusMessage();
        userService.logOut();
    };
    
    // Private methods.
    var clearStatusMessage = function() {
        $scope.statusMessage = null;
    };
});

tgbApp.run(['$rootScope', function($rootScope) {
    $rootScope.scenario = 'Sign up';
}]);
