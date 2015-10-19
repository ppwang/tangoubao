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
    var parseOrder;
    var order;
    var deal;
    var scanUser;
    
	var parseUserPromise = new Parse.Query(Parse.User);
	parseUserPromise.equalTo('wechatId', wechatId);
	return parseUserPromise.first().then(function(parseUser) {
        scanUser = parseUser;

        // Verify the user who scanned QR is authorized to close the deal.
        parseOrder = new ParseOrder();
        parseOrder.id = orderId;
        return parseOrder.fetch();
    }).then(function(fetchedOrder) {
        order = orderModel.convertToOrderModel(fetchedOrder);
        
        if (order.status === 'closed') {
            logger.debugLog('Order already closed. id=' + orderId);
            var message = messageUtils.generateTextMessage(wechatId, publicAccountId, createTime, "您刚刚扫描的二维码已经使用过了, 不能重复使用。");
            res.send(message);
            var promise = new Parse.Promise();
            promise.reject('QRCloseOrderReuse');
            return promise;
        }
        
        var parseDeal = new ParseDeal();
        parseDeal.id = order.dealId;
        return parseDeal.fetch();
    }).then(function(fetchedDeal) {
        deal = dealModel.convertToDealModel(fetchedDeal);
        if (deal.authorizedClosers) {
            var closers = JSON.parse(deal.authorizedClosers);
            if (closers.indexOf(scanUser.id) != -1) {
                logger.debugLog('Close order authorized for wechat id ' + wechatId + '; user id ' + scanUser.id);
                
                // Close the order and respond to QR scanner.
                parseOrder.set('status', 'closed');
                return parseOrder.save().then(function(savedParseOrder) {
                    if (savedParseOrder == 'Not authorized') {
                        logger.debugLog('User unauthorized to set order status to closed.');
                        return false;
                    }
                    
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
        var promise = new Parse.Promise();
        promise.reject('QRCloseOrderUnauthorized');
        return promise;
    }).then(function(success) {
        logger.debugLog('Sending notification to buyer. QR result ' + success);
        var qrReplyPromise;
        var notifyBuyerPromise;
        // NOTE: The scan user id is populated, but display name is set to wephoon.
        if (success) {
            notifyBuyerPromise = notificationController.notifyBuyer(scanUser.id, '微蜂网', order.creatorId, order, 'general', '您购买的' + order.dealName + '已成交! 订单编号为' + orderId + '.')
        } else {
            notifyBuyerPromise = notificationController.notifyBuyer(scanUser.id, '微蜂网', order.creatorId, order, 'general', '您购买的' + order.dealName + '未能成交! 请稍后再试试。订单编号为' + orderId + '.')
        }
        
        var qrMessage = success 
            ? '订单编号' + orderId + '已成交!'
            : '订单编号' + orderId + '二维吗扫描不成功，请您稍后再试试。';
        return notifyBuyerPromise.then(function() {
            // Send reply to QR event.
            var message = messageUtils.generateTextMessage(wechatId, publicAccountId, createTime, qrMessage);
            return res.send(message);
        }, function(error) {
            logger.debugLog('Failed to send notification to buyer. Error: ' + error);
        });
    });
};