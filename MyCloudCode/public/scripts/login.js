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
    $urlRouterProvider.otherwise('/publicDeals');
 
    $stateProvider
        .state('publicDeals', {
            url:'/publicDeals',
            views: {
                'content': {
                    templateUrl: 'views/publicDeals.html',
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
        .state('createOrder', {
            url:'/createOrder?dealId',
            views: {
                'content': {
                    templateUrl: 'views/createOrder.html',
                    controller: 'createOrderController',
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
          return Math.ceil((date.getTime() - Date.now())/86400000);
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
                this.logIn(null)
                .then(
                    function(user) {
                    },
                    function(error) {
                        $state.go('login');            
                    })
            };
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

tgbApp.factory('dealDataService', ['$http', 'serviceBaseUrl', '$q', function($http, serviceBaseUrl, $q) {    
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
    };
    
    dealDataService.getDeals = function() {
        var dealsDeferred = $q.defer();
        $http.get(dealsApiUrl)
        .success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available
            _.forEach(data.deals, function(d) {
                patchDealFromServer(d);
                });
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
            _.forEach(data.deals, function(d) {
                patchDealFromServer(d);
            });
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
        })
        .error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            console.log('error code:' + status);
            newDealDeferred.reject(status);
        });
        
        return newDealDeferred.promise;
    };
    
    dealDataService.followDeal = function(id) {
        var resultDeferred = $q.defer();
        
        return $http.put(apiUrl + '/followDeal/' + id)
        .success(function(data, status, headers, config) {
            resultDeferred.resolve();
        })
        .error(function(data, status, headers, config) {
            console.log('error code:' + status);
            resultDeferred.reject(status);
        });
        
        return resultDeferred.promise;
    };

    dealDataService.unfollowDeal = function(id) {
        var resultDeferred = $q.defer();
        
        return $http.delete(apiUrl + '/followDeal/' + id)
        .success(function(data, status, headers, config) {
            resultDeferred.resolve();
        })
        .error(function(data, status, headers, config) {
            console.log('error code:' + status);
            resultDeferred.reject(status);
        });
        
        return resultDeferred.promise;
    };

    dealDataService.deleteDeal = function(id) {
        // TODO:
    };
    
    return dealDataService;
}]);

tgbApp.factory('orderDataService', ['$http', function($http) {
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

tgbApp.directive('backgroundImage', function() {
    return function(scope, element, attrs) {
        var imgUrl = attrs.backgroundImage;
        element.css({ 
            'background-image': 'url(' + imgUrl + ')'
        });
    };
});

//tgbApp.controller('$scope', 'topNavController', ['$scope', 'userService', function(userService) {
//    $scope.currentUser = userService.currentUser;
//}]);

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

tgbApp.controller('dealCardController', ['$scope', '$state', 'regionDataService', function($scope, $state, regionDataService) {
    regionDataService.setDealRegion($scope.deal);
    
    $scope.showDealDetail = function() {
        $state.go('dealDetail', {'id': $scope.deal.id} );
    };
}]);

tgbApp.controller('dealDetailController', ['$scope', '$state', '$stateParams', 'userService', 'dealDataService', 'regionDataService', function($scope, $state, $stateParams, userService, dealDataService, regionDataService) {
    userService.ensureUserLoggedIn();
    
    dealDataService.getDeal($stateParams.id)
    .then(function(d) {
        $scope.deal = d;
        regionDataService.setDealRegion($scope.deal);
    });
    
    $scope.toggleFollowedStatus = function() {
        var resultPromise;
        if ($scope.deal.followed) {
            dealDataService.unfollowDeal($scope.deal.id)
            .then(function() {
                $scope.deal.followed = false; 
            });
        } else {
            dealDataService.followDeal($scope.deal.id)
            .then(function() {
                $scope.deal.followed = true;
            });
        }
    };
    
    $scope.purchaseDeal = function() {
        $state.go('createOrder', { 'dealId': $scope.deal.id });
    };
    
    $scope.manageDeal = function() {
        
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

tgbApp.controller('createOrderController', ['$scope', '$state', '$stateParams', 'userService', function($scope, $state, $stateParams, userService) {
    userService.ensureUserLoggedIn();

    var id = $stateParams.dealId;
    $scope.order = {};
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
                $state.go('publicDeals');
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

tgbApp.run(['$rootScope', 'userService', 'regionDataService', function($rootScope, userService, regionDataService) {
    $rootScope.scenario = 'Sign up';
}]);
