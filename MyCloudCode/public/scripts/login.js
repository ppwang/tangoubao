var tgbApp = angular.module('tuanGouBao', ['GlobalConfiguration', 'ui.router', 'xeditable', 'imageupload', 'cgBusy', 'ui.bootstrap']);

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
            params: { deal: null },
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
            url:'/createOrder?dealId&orderId',
            params: { 
                deal: null,
                order: null,
            },
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
        .state('messageCenter', {
            url: '/messageCenter',
            views: {
                'content': {
                    templateUrl: 'views/messageCenter.html',
                    controller: 'messageCenterController',
                },
            },
        })
        .state('userProfile', {
            url: '/userProfile',
            views: {
                'content': {
                    templateUrl: 'views/userProfile.html',
                    controller: 'userProfileController',
                },
            },
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

tgbApp.factory('userAgentDetectionService', [function() {
    var userAgent = navigator.userAgent;
    var isiOS = (/(iPad|iPhone|iPod)/gi).test(userAgent);
    var isAndroid = (/(Android)/gi).test(userAgent);
    var isWindowsPhone = (/(IEMobile)/gi).test(userAgent);
    var isBB10 = (/(BB10)/gi).test(userAgent);
    var isWeixin = (/(MicroMessenger)/gi).test(userAgent);
    
    var service = {};

    service.getUserAgent = function() {
        return userAgent;
    };

    service.isiOS = function() {
        return isiOS;
    };

    service.isAndroid = function() {
        return isAndroid;
    };

    service.isWindowsPhone = function() {
        return isWindowsPhone;
    };

    service.isBB10 = function() {
        return isBB10;
    };

    service.isWeixin = function() {
        return isWeixin;
    };
    
    return service;
}]);

tgbApp.factory('serviceBaseUrl', ['$window', function($window) {
    if ($window.location.hostname === '127.0.0.1') {
        serviceBaseUrl = 'https://tuangoubao.parseapp.com';
    } else {
        serviceBaseUrl = '';
    }
    
    return serviceBaseUrl;
}]);

tgbApp.factory('userService', ['$http', '$q', 'serviceBaseUrl', '$rootScope', '$state', '$interval', 'modalDialogService', function($http, $q, serviceBaseUrl, $rootScope, $state, $interval, modalDialogService) {
    var currentUser;
    var shouldTryLogin = true;
    
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
                        var modalDialog = modalDialogService.show({
                            message: '您想要使用的功能需要登录, 现在将自动跳转到登录/注册页面...',
                            showCancelButton: false,
                        });
                        
                        closeModalDialog = $interval(function() {
                            modalDialog.close(null);
                        }, 3000, 1);
                        
                        modalDialog.result.then(function() {
                            $state.go('login');            
                        });
                        
                        return $q.reject(error);
                    })
            } else {
                var resultDeferred = $q.defer();
                resultDeferred.resolve(currentUser);
                return resultDeferred.promise;
            }
        },
        
        tryUserLogIn: function() {
            if (shouldTryLogin && !currentUser) {
                return this.logIn(null).then(function(user) {
                    return user;
                }, function(error) {
                    // If cannot log in, no need to try again, and don't treat this as a failure.
                    shouldTryLogin = false;
                    return null;
                });
            } else {
                var resultDeferred = $q.defer();
                resultDeferred.resolve(currentUser);
                return resultDeferred.promise;
            }
        },
        
        getUserProfile: function() {
            var resultDeferred = $q.defer();
            $http.get(serviceBaseUrl + '/api/userProfile')
                .success(function(data, status, headers, config) {
                      resultDeferred.resolve(data);
                })
                .error(function(data, status, headers, config) {
                    resultDeferred.reject(status);
                    console.log('error code:' + status);
                });
            return resultDeferred.promise;
        },
        
        saveUserProfile: function(profile) {
            var resultDeferred = $q.defer();
            $http.put(serviceBaseUrl + '/api/userProfile', profile)
                .success(function(data, status, headers, config) {
                    resultDeferred.resolve(data);
                })
                .error(function(data, status, headers, config) {
                    resultDeferred.reject(status);
                    console.log('error code:' + status);
                });
            return resultDeferred.promise;            
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

tgbApp.factory('commentDataService', ['$http', 'serviceBaseUrl', '$q', function($http, serviceBaseUrl, $q) {
    var commentDataService = {};
    
    commentDataService.getComments = function(dealId) {
        var resultDeferred = $q.defer();
        
         $http.get(serviceBaseUrl + '/api/comments/' + dealId)
         .success(function(data, status, headers, config) {
             resultDeferred.resolve(data);
         })
         .error(function(data, status, headers, config) {
             console.log('error code:' + status);
             resultDeferred.reject(status);
         });

        return resultDeferred.promise;        
    };
    
    commentDataService.addComment = function(dealId, rating, comment) {
        var commentWrapper = {
            rating: rating,
            commentText: comment,
        };
        
        var resultDeferred = $q.defer();
        
         $http.put(serviceBaseUrl + '/api/comment/' + dealId, commentWrapper)
         .success(function(data, status, headers, config) {
             resultDeferred.resolve(data);
         })
         .error(function(data, status, headers, config) {
             console.log('error code:' + status);
             resultDeferred.reject(status);
         });

        return resultDeferred.promise;        
    };

    return commentDataService;
}]);

tgbApp.factory('messageDataService', ['$http', 'serviceBaseUrl', '$q', function($http, serviceBaseUrl, $q) {
    // Cached data
    var cachedMessagesPromise;

    var dirtyCache = function() {
        cachedOrdersPromise = null;    
    };

    var sortMessages = function(messages) {
        return _.sortByOrder(messages, ['isRead', 'createdAt'], [true, false]);
    };
    
    var messageDataService = {};
    
    messageDataService.getMessages = function() {
        if (cachedMessagesPromise) {
            return cachedMessagesPromise;
        }
        
        var resultDeferred = $q.defer();
        
         $http.get(serviceBaseUrl + '/api/messages')
         .success(function(data, status, headers, config) {
             var sortedMessages = sortMessages(data);
             resultDeferred.resolve(sortedMessages);
             cachedMessagesPromise = resultDeferred.promise; 
         })
         .error(function(data, status, headers, config) {
             console.log('error code:' + status);
             resultDeferred.reject(status);
             cachedMessagesPromise = null;
         });

        return resultDeferred.promise;
    };

    messageDataService.markRead = function(message) {
        return $http.put(serviceBaseUrl + '/api/messageStatus/' + message.id + '?status=read').then(function() {
            message.isRead = true;
        });
    }

    messageDataService.notifyBuyers = function(dealId, messageType, messageText) {
        var messageWrapper = {
            dealId: dealId,
            messageType: messageType,
            messageText: messageText
        };
        var resultDeferred = $q.defer();
        
         $http.post(serviceBaseUrl + '/api/notifyBuyers', messageWrapper)
         .success(function(data, status, headers, config) {
             resultDeferred.resolve(data);
         })
         .error(function(data, status, headers, config) {
             console.log('error code:' + status);
             resultDeferred.reject(status);
         });

        return resultDeferred.promise;        
    };

    messageDataService.sendEmailVerification = function() {
        var resultDeferred = $q.defer();

        $http.post(serviceBaseUrl + '/api/user/sendEmailVerification')
            .success(function(data, status, headers, config) {
                resultDeferred.resolve();
            })
            .error(function(data, status, headers, config) {
                resultDeferred.reject("Unable to send email verification: " + status + " " + data);
                console.log('error code:' + status);
            });
            
        return resultDeferred.promise;

    };
    
    return messageDataService;
}]);

tgbApp.factory('weixinService', ['$http', '$q', '$location', 'serviceBaseUrl', 'weixinAppId', function($http, $q, $location, serviceBaseUrl, weixinAppId) {
    var cachedPromise;
    
    var weixinService = {};

    var currentUrl = $location.absUrl();
    var hashIndex = currentUrl.indexOf("#");
    var currentUrlWithoutHash;
    if (hashIndex > 0) {
         currentUrlWithoutHash = currentUrl.substring(0, hashIndex);
    } else {
         currentUrlWithoutHash = currentUrl;
    }
    
    weixinService.configCurrentUrl = function() {
        if (!cachedPromise) {
            var body = {
                url: currentUrlWithoutHash,
            };

            var resultDeferred = $q.defer();
            cachedPromise = resultDeferred.promise;

            $http.post(serviceBaseUrl + '/api/wechatJsConfig', body).success(function(data, status, headers, config) {
                wx.ready(function() {
                    resultDeferred.resolve();
                    alert("Ready!")
                });

                wx.error(function(res){
                    resultDeferred.reject(res);
                    alert("Error " + JSON.stringify(res));
                });

                var r = wx.config({
                    debug: false,
                    appId: weixinAppId,
                    timestamp: data.timestamp,
                    nonceStr: data.nonceStr,
                    signature: data.signature,
                    jsApiList: [
                        'checkJsApi',
                    'onMenuShareTimeline',
                    'onMenuShareAppMessage',
                //        'onMenuShareQQ',
                //        'onMenuShareWeibo',
                        'hideMenuItems',
                        'showMenuItems',
                //        'hideAllNonBaseMenuItem',
                //        'showAllNonBaseMenuItem',
                //        'translateVoice',
                //        'startRecord',
                //        'stopRecord',
                //        'onRecordEnd',
                //        'playVoice',
                //        'pauseVoice',
                //        'stopVoice',
                //        'uploadVoice',
                //        'downloadVoice',
                //        'chooseImage',
                //        'previewImage',
                //        'uploadImage',
                //        'downloadImage',
                //        'getNetworkType',
                //        'openLocation',
                //        'getLocation',
                //        'hideOptionMenu',
                //        'showOptionMenu',
                //        'closeWindow',
                //        'scanQRCode',
                //        'chooseWXPay',
                //        'openProductSpecificView',
                //        'addCard',
                //        'chooseCard',
                //        'openCard'
                    ],
                });
             })
             .error(function(data, status, headers, config) {
                 console.log('error code:' + status);
                 resultDeferred.reject(status);
             });
        }
        
        return cachedPromise;                
    };
    
    return weixinService;
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
        
        return modalInstance;
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

tgbApp.controller('topNavController', ['$scope', '$modal', function($scope, $modal) {
    $scope.showCreateDealInfo = function() {
        $modal.open({
            templateUrl: 'views/createOrderDisabledNotice.html',
            size: 'sm',
            backdrop: 'static',
        });
    };
}]);

tgbApp.controller('welcomeController', ['$scope', 'userService', function($scope, userService) {
    userService.ensureUserLoggedIn();
}]);

tgbApp.controller('publicDealsController', ['$scope', 'dealDataService', 'userService', function($scope, dealDataService, userService) {
    userService.tryUserLogIn();

    // Wrap the promise in an object before passing into child directive.
    // http://stackoverflow.com/questions/17159614/how-do-i-pass-promises-as-directive-attributes-in-angular
    // No need to wait for logon for public deals.
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

tgbApp.controller('dealDetailController', ['$scope', '$state', '$stateParams', '$modal', '$location', '$q', 'userService', 'userAgentDetectionService', 'dealDataService', 'commentDataService', 'modalDialogService', 'weixinService', function($scope, $state, $stateParams, $modal, $location, $q, userService, userAgentDetectionService, dealDataService, commentDataService, modalDialogService, weixinService) {
    userService.tryUserLogIn();

    var dealPromise = dealDataService.getDeal($stateParams.id).then(function(deal) {
        $scope.deal = deal;
        
        // TODO: this can probably be more gracefully done using directives.
        // Set up weixin share.
        document.title = $scope.deal.name;
//        document.getElementsByName('description')[0].content = "test content";
    });

    var commentPromise = commentDataService.getComments($stateParams.id).then(function(comments) {
        $scope.comments = comments;
    });        

//    var allPromises = $q.all(dealPromise, commentPromise);
//    $scope.busyPromise = $q.all(dealPromise, commentPromise);
    $scope.busyPromise = [dealPromise, commentPromise];

    $scope.weixinShareVisible = userAgentDetectionService.isWeixin() && userAgentDetectionService.isiOS();
//    if ($scope.weixinShareVisible) {
//        weixinService.configCurrentUrl().then(function() {
//            dealPromise.then(function(deal) {
//                wx.onMenuShareAppMessage({
//                    title: deal.name,
//                    desc: deal.description,
//                    link: $location.absUrl(),
//                    imgUrl: deal.dealImageUrl || $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/resources/placeholder.png',
//                });
//            });
//        });
//    }
    
    $scope.toggleFollowedStatus = function() {
        userService.ensureUserLoggedIn().then(function() {
            if ($scope.deal.followed) {
                $scope.busyPromise = dealDataService.unfollowDeal($scope.deal);
            } else {
                $scope.busyPromise = dealDataService.followDeal($scope.deal)
            }
        });
    };
    
    $scope.purchaseDeal = function() {
        userService.ensureUserLoggedIn().then(function() {
            $state.go('createOrder', { 
                    deal: $scope.deal,
                    dealId: $scope.deal.id,
            });
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
    
    $scope.weixinShare = function() {
        var modalInstance = $modal.open({
            templateUrl: 'views/weixinShare.html',
            size: 'sm',
            backdrop: 'true',
        });
        
    };
    
    $scope.ratingHoveringOver = function(value) {
        $scope.overStar = value;
        $scope.percent = 100 * (value / 5);
    };

    $scope.ratingStates = [
        {stateOn: 'glyphicon-star icon-star-selected', stateOff: 'glyphicon-star-empty'},
        {stateOn: 'glyphicon-star icon-star-selected', stateOff: 'glyphicon-star-empty'},
        {stateOn: 'glyphicon-star icon-star-selected', stateOff: 'glyphicon-star-empty'},
        {stateOn: 'glyphicon-star icon-star-selected', stateOff: 'glyphicon-star-empty'},
        {stateOn: 'glyphicon-star icon-star-selected', stateOff: 'glyphicon-star-empty'},
    ];
    
    $scope.addComment = function() {
        userService.ensureUserLoggedIn().then(function() {
            commentDataService.addComment($scope.deal.id, $scope.rating, $scope.comment).then(function(comment) {
                if ($scope.comments) {
                    $scope.comments.unshift(comment);
                    $scope.rating = undefined;
                    $scope.comment = undefined;
                } 
            }, function(reason) {
                modalDialogService.show({
                    message: "对不起, 刚才没能发布您的评论，请稍后再试试.",
                    showCancelButton: false,
                });
            });
        });
    };
}]);

tgbApp.controller('createDealController', ['$scope', '$state', '$stateParams', 'dealDataService', 'regionDataService', 'userService', 'modalDialogService',  function($scope, $state, $stateParams, dealDataService, regionDataService, userService, modalDialogService) {
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

    userService.ensureUserLoggedIn().then(function() {
        $scope.regions = [];
        regionDataService.populateRegions($scope.regions);

        if ($stateParams.deal) {
            $scope.deal = $stateParams.deal;
        } else {
            // Populate the new deal with initial parameters.
            $scope.deal = {};
            $scope.deal.unitName = '磅';
            if (userService.currentUser) {
                $scope.deal.email = userService.email;
                $scope.deal.phoneNumber = userService.phoneNumber;
            }
            $scope.deal.pickupOptions = [];
        }
        
        addNewPickupOption();
    });
    
    $scope.clearproductImageUpload = function() {
        if ($scope.productImageUpload) {
            $scope.productImageUpload.dataURL = undefined;
            
            if ($scope.productImageUpload.resized) {
                $scope.productImageUpload.resized.dataURL = undefined;            
            }
        }
        $scope.productImageUpload = undefined;
        
        $scope.deal.dealImageUrl = null;
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

        dealDataService.saveDeal($scope.deal).then(function() {
            var message = '您成功发布了' + $scope.deal.name + '团购,'
            if ($scope.deal.endDate) {
                message += ' 截止日期为' + $scope.deal.endDate.getYear() + '年' + $scope.deal.endDate.getMonth() + '月' + $scope.deal.endDate.getDay() + '日,'
            }
            message += ' 谢谢您的参与!';
            
            modalDialogService.show({
                message: message,
                showCancelButton: false,
            });
            
            $state.go('sellerAccount.deals', { status: 'active' });
        }, function() {
            var message = '对不起, 刚才您发布' + $scope.deal.name + '团购不成功, 请稍后再试试.';
            modalDialogService.show({
                message: message,
                showCancelButton: false,
            });            
        });
    };
}]);

tgbApp.controller('orderDetailController', ['$scope', '$state', '$stateParams', 'userService', 'orderDataService', 'regionDataService', function($scope, $state, $stateParams, userService, orderDataService, regionDataService) {
    userService.ensureUserLoggedIn().then(function() {
        var id = $stateParams.id;
        orderDataService.getOrder(id).then(function(order) {
            $scope.order = order;
            $scope.pickupOption = _.find($scope.order.deal.pickupOptions, function(o){
                return o.id === order.pickupOptionId;
            });
        });
    });
                                                      
    $scope.modifyOrder = function() {
          $state.go(
              'createOrder',
              {
                  dealId: $scope.order.deal.id,
                  deal: $scope.order.deal,
                  orderId: $scope.order.id,
                  order: $scope.order,
              });
    };
}]);

tgbApp.controller('createOrderController', ['$scope', '$state', '$stateParams', '$q', 'userService', 'dealDataService', 'orderDataService', 'modalDialogService', function($scope, $state, $stateParams, $q, userService, dealDataService, orderDataService, modalDialogService) {
    
    userService.ensureUserLoggedIn().then(function(user) {
        $scope.user = user;
        
        // TODO: optimization: no need to get deal if also need to get order, since order contains the deal object.
        var dealPromise;
        if ($stateParams.deal) {
            var dealDeferred = $q.defer();
            dealDeferred.resolve($stateParams.deal);
            dealPromise = dealDeferred.promise;
        } else {
            dealPromise = dealDataService.getDeal($stateParams.dealId)
        }

        var orderPromise;
        if ($stateParams.order) {
            var orderDeferred = $q.defer();
            orderDeferred.resolve($stateParams.order);
            orderPromise = orderDeferred.promise;
        } else if ($stateParams.orderId) {
            orderPromise = orderDataService.getOrder($stateParams.orderId);
        } else {
            var orderDeferred = $q.defer();
            orderDeferred.resolve(null);
            orderPromise = orderDeferred.promise;
        }
        
        $q.all([dealPromise, orderPromise]).then(function(results) {
            var deal = results[0];
            var order = results[1];
            
            $scope.deal = deal;
            var pickupOptions = $scope.deal.pickupOptions;
            
            if (order) {
                $scope.order = order;
            } else {
                $scope.order = {
                    dealId: $stateParams.dealId,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    creatorName: user.nickname,
                    // TODO: verify that imageUrl is the correct property.
                    creatorImageUrl: user.headimgurl,
                };

                if (pickupOptions && pickupOptions.length > 0) {
                    $scope.order.pickupOptionId = pickupOptions[0].id;  
                }
            }            
        });
    });

    // TODO: implement better tooltips for form validation.
    var validateOrder = function() {
        if (!$scope.order.phoneNumber) {
            return "请您填写您的联系电话.";
        }
        
        if (!$scope.order.email) {
            return "请您填写您的邮件信箱.";            
        }
        
        var quantity = $scope.order.quantity;
        if (!quantity || Number(quantity) !== quantity || quantity % 1 !== 0) {
            return "请您填写正确的购买件数.";
        };
    };
    
    $scope.createOrder = function() {
        var errorMessage = validateOrder();
        if (errorMessage) {
            modalDialogService.show({
                message: errorMessage,
                showCancelButton: false,
            });
            return;
        }
        
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
        }).result.then(function() {
            orderDataService.createOrder($scope.order).then(function() {
                // TODO: show order details.
                $state.go('buyerAccount.orders', { status: 'active' });
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

tgbApp.controller('dealStatusController', ['$scope', '$state', '$stateParams', '$q', 'userService', 'dealDataService', 'modalDialogService', '$modal', function($scope, $state, $stateParams, $q, userService, dealDataService, modalDialogService, $modal) {
    userService.ensureUserLoggedIn().then(function(user) {
        var dealPromise;
        if ($stateParams.deal) {
            var dealDeferred = $q.defer();
            dealDeferred.resolve($stateParams.deal);
            dealPromise = dealDeferred.promise;
        } else {
            dealPromise = dealDataService.getDeal($stateParams.id);
        }

        dealPromise.then(function(deal) {
            $scope.deal = deal;
        });
    });

    $scope.modifyDeal = function() {
        $state.go('createDeal', { deal: $scope.deal });
    };
    
    $scope.closeDeal = function() {
        dealDataService.closeDeal($scope.deal);
    };
    
    $scope.sendProductArrivedMessage = function() {
        
    };
    
    $scope.sendMessage = function(messageType) {
        var modalInstance = $modal.open({
            templateUrl: 'views/messageSendForm.html',
            controller: 'messageSendFormController',
            backdrop: 'static',
            resolve: {
                deal: function() {
                    return $scope.deal;    
                },
                messageType: function() {
                    return messageType;  
                },
            },
        });
    };
    
    $scope.sendSpreadsheet = function() {
        dealDataService.sendSpreadsheet($scope.deal.id).then(function() {
            var message = '买家信息已生成Excel表格并发送到您注册账号的邮箱. 谢谢您使用团购宝!';

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

tgbApp.controller('messageSendFormController', ['$scope', 'messageDataService', 'deal', 'messageType', function($scope, messageDataService, deal, messageType) {
    $scope.deal = deal;
    $scope.messageType = messageType;
    $scope.mode = 'input';
    $scope.messageOptional = ($scope.messageType === 'productArrived');
    
    if (messageType === 'productArrived') {
        $scope.title = '您即将通知买家到货. 如果要发送附加信息, 请在下面填写:';
    } else {
        $scope.title = '写给买家的信息:';
    }
    
    $scope.sendMessage = function() {
        $scope.sendError = false;
        messageDataService.notifyBuyers($scope.deal.id, $scope.messageType, $scope.content).then(function() {
          $scope.mode = 'success';
        }, function() {
          $scope.sendError = true;
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

tgbApp.controller('messageCenterController', ['$scope', 'userService', 'messageDataService', function($scope, userService, messageDataService) {
    userService.ensureUserLoggedIn().then(function(user) {
        messageDataService.getMessages().then(function(messages) {
            $scope.messages = messages;
        });
    });
    
    $scope.markRead = function(message) {
        if (!message.isRead) {
            messageDataService.markRead(message).then(function() {
                // TODO: modifying variable at root scope is not ideal.
                var countByIsRead = _.countBy($scope.messages, 'isRead');
                if (countByIsRead.false) {
                    $scope.currentUser.unreadMessageCount = countByIsRead.false;
                } else {
                    $scope.currentUser.unreadMessageCount = 0;
                }                
            });
        }
    };

    $scope.sendEmailVerification = function() {
        messageDataService.sendEmailVerification()
            .then(function() 
                {
                    // notify user of sending verification success
                }, function(error)
                {
                    // notify user of failure

                });
    };
}]);

tgbApp.controller('userProfileController', ['$scope', '$rootScope', 'userService', 'modalDialogService', function($scope, $rootScope, userService, modalDialogService) {
    userService.ensureUserLoggedIn().then(function(user) {
        $scope.user = angular.copy($rootScope.currentUser);

        userService.getUserProfile().then(function(profile) {
            $scope.profile = profile;
        });
    });
    
    $scope.saveProfile = function() {
        userService.saveUserProfile($scope.profile).then(function(profile) {
            $rootScope.currentUser.nickname = profile.nickname;
            $rootScope.currentUser.email = profile.email;
            $rootScope.currentUser.phoneNumber = profile.phoneNumber;
            $rootScope.currentUser.emailNotify = profile.emailNotify;
            $rootScope.currentUser.wechatNotify = profile.wechatNotify;
            
            $scope.user = angular.copy($rootScope.currentUser);
        }, function(error) {
            modalDialogService.show({
                message: '对不起, 刚才没能成功保存您的信息, 请稍后再试试.',
                showCancelButton: false,
            });
        });
    };
}]);

tgbApp.controller('contactController', function($scope) {
    
});

tgbApp.controller('loginController', function($scope, $location, $state, $window, weixinAppId, serviceBaseUrl, userService) {

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
                if ($state.previousState) {
                    $state.go($state.previousState, $state.previousParams);
                }
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
                if ($state.previousState) {
                    $state.go($state.previousState, $state.previousParams);
                } else {
                    $state.go('welcome');
                }
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

    $scope.weixinSignin = function() {
        var redirUrl = $state.href($state.previousState, $state.previousParams, {absolute: true});
        var apiUrl = 'https://tuangoubao.parseapp.com' + '/api/oauth/wechat?redir=' + encodeURIComponent(redirUrl);
        var wexinOauthUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid='
            + weixinAppId
            + '&redirect_uri='
            + encodeURIComponent(apiUrl)
            + '&response_type=code&scope=snsapi_base#wechat_redirect';
        $window.location.href = wexinOauthUrl;
    };
});

tgbApp.run(['$rootScope', '$state', 'weixinService', function($rootScope, $state, weixinService) {
    $rootScope.scenario = 'Sign up';
    
    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        $state.previousState = fromState;
        $state.previousParams = fromParams;
    });
    
//    weixinService.configCurrentUrl();
}]);
