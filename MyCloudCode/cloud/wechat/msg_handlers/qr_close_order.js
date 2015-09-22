// QR close order module is responsible for closing the order when authorized user scans buyer's order QR code.

var tgbWechatUser = require('cloud/tuangoubao/wechat_user');
var wechatAccessToken = require('cloud/wechat/utils/wechat_access_token');
var wechatUserInfo = require('cloud/wechat/utils/wechat_user_info');
var messageUtils = require('cloud/wechat/utils/message_utils');
var logger = require('cloud/lib/logger');

module.exports = function (wechatId, publicAccountId, createTime, eventKey, res) {
    logger.debugLog('QR close order log. user=' + wechatId + ';eventKey=' + eventKey + ';createTime=' + createTime);
    var message = messageUtils.generateTextMessage(wechatId, publicAccountId, createTime, "Order close success: " + wechatId + ";" + eventKey);
    res.send(message);
//    wechatAccessToken.getAccessToken()
//    .then( function(accessToken) {
//        return wechatUserInfo.getUserInfo(accessToken.token, wechatId);
//    })
//    .then( function(wechatUserRawData) {
//        return tgbWechatUser.activate(wechatId, wechatUserRawData);
//    })
//    .then( function(wechatUser) {
//        var message = messageUtils.generateWelcomeMessage(wechatId, publicAccountId, createTime, 
//            wechatUser.nickname, wechatUser.headimgurl, wechatUser.claimtoken);
//        // send response
//        res.contentType('application/xml');
//        logger.logUsage('wechatUser_' + wechatUser.id, 'subscribe', '', message);
//        res.send(message);
//    }, function(error) {
//        logger.debugLog('subscribe wechat user error: ' + error.message);
//        res.error();
//    });
};