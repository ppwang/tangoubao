// QR close order module is responsible for closing the order when authorized user scans buyer's order QR code.

var ParseOrder= Parse.Object.extend('Order');
var orderModel = require('cloud/tuangoubao/order');
var dealModel = require('cloud/tuangoubao/deal');
var userModel = require('cloud/tuangoubao/user');
var ParseDeal = Parse.Object.extend('Deal');
var ParseUser = Parse.Object.extend('User');
var tgbWechatUser = require('cloud/tuangoubao/wechat_user');
var wechatAccessToken = require('cloud/wechat/utils/wechat_access_token');
var wechatUserInfo = require('cloud/wechat/utils/wechat_user_info');
var messageUtils = require('cloud/wechat/utils/message_utils');
var logger = require('cloud/lib/logger');
var notificationController = require('cloud/controller/notification_controller');

module.exports = function (wechatId, publicAccountId, createTime, orderId, res) {
    logger.debugLog('QR close order log. user=' + wechatId + ';orderId=' + orderId + ';createTime=' + createTime);
    var order;
    var deal;
    
    // Verify the user who scanned QR is authorized to close the deal.
    var parseOrder = new ParseOrder();
    parseOrder.id = orderId;
    parseOrder.fetch().then(function(fetchedOrder) {
        order = orderModel.convertToOrderModel(fetchedOrder);
        
        if (order.status === 'closed') {
            logger.debugLog('Order already closed. id=' + orderId);
            var message = messageUtils.generateTextMessage(wechatId, publicAccountId, createTime, "您刚刚扫描的二维码已经使用过了, 不能重复使用。");
            res.send(message);
            var promise = new Parse.Promise();
            promise.reject('QRCodeReuse');
            return promise;
        }
        
        var parseDeal = new ParseDeal();
        parseDeal.id = order.dealId;
        return parseDeal.fetch();
    }).then(function(fetchedDeal) {
        deal = dealModel.convertToDealModel(fetchedDeal);
        if (deal.authorizedClosers) {
            var closers = JSON.parse(deal.authorizedClosers);
//            logger.debugLog('closers ' + closers);
            if (closers.indexOf(wechatId) != -1) {
                logger.debugLog('Close order authorized for wechat id ' + wechatId);
                
                // Close the order and respond to QR scanner.
                parseOrder.set('status', 'closed');
                return parseOrder.save().then(function(savedParseOrder) {
                    if (savedParseOrder == 'Not authorized') {
                        logger.debugLog('User unauthorized to set order status to closed.');
                        return false;
                    }
                    
                    // Send reply to QR event.
                    var message = messageUtils.generateTextMessage(wechatId, publicAccountId, createTime, 'Order closed');
                    res.send(message);

                    return true;
                }, function(error) {
                    logger.debugLog('Failed to set order status to closed.');
                    return false;
                });                
            } else {
                logger.debugLog('Close order is unauthorized for wechat id ' + wechatId);
            }
        } else {
            logger.debugLog('No authorized user is found for deal ' + deal.id);
        }

        // User is not authorized to close the deal. Send reply.
        var message = messageUtils.generateTextMessage(wechatId, publicAccountId, createTime, "您刚刚扫描了二维码，但是没有权限使用此二维码的功能。");
        res.send(message);
        return false;
    }).then(function(success) {
//        // Find scanner and buyer users.
//        promises = [];
//        
//        var parseUserScanner = new ParseUser();
//        parseUserScanner.equalTo('wechatId', wechatId);
//        promises.push(parseUserScanner.first());
//        
//        var parseUserBuyer = new ParseUser();
//        parseUserBuyer.id = order.creatorId;
//        promises.push(parseUserBuyer.fetch());
//        
//        return Parse.promise.when(promises);
//    }).then(function(parseUserScanner, parseUserBuyer) {
//        userScanner = userModel.convertToUserModel(parseUserScanner);
//        userBuyer = userModel.convertToUserModel(parseUserBuyer);
        if (success) {
            notificationController.notifyBuyer(wechatId, 'Creator', order.creatorId, order, 'general', 'Your order is closed!')
        } else {
            notificationController.notifyBuyer(wechatId, 'Creator', order.creatorId, order, 'general', 'Your order was not closed!')
        }
    });
};