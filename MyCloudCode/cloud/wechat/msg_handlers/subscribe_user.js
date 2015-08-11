// subscribe user module is responsible for creating wechat user; sending welcome message and tuangoubao 
//  account bundling.

var tgbWechatUser = require('cloud/tuangoubao/wechat_user');
var wechatAccessToken = require('cloud/wechat/utils/wechat_access_token');
var wechatUserInfo = require('cloud/wechat/utils/wechat_user_info');
var messageUtils = require('cloud/wechat/utils/message_utils');
var logger = require('cloud/lib/logger');

module.exports = function (wechatId, publicAccountId, createTime, res) {
    logger.debugLog('subscribeUser log. subscribe: ' + wechatId);
    wechatAccessToken.getAccessToken()
    .then( function(accessToken) {
        return wechatUserInfo.getUserInfo(accessToken.token, wechatId);
    })
    .then( function(wechatUserRawData) {
        return tgbWechatUser.activate(wechatId, wechatUserRawData);
    })
    .then( function(wechatUser) {
        var message = messageUtils.generateWelcomeMessage(wechatId, publicAccountId, createTime, 
            wechatUser.nickname, wechatUser.headimgurl, wechatUser.claimtoken);
        // send response
        res.contentType('application/xml');
        logger.logUsage('wechatUser_' + wechatUser.id, 'subscribe', '', message);
        res.send(message);
    }, function(error) {
        logger.debugLog('subscribe wechat user error: ' + error.message);
        res.error();
    });
};