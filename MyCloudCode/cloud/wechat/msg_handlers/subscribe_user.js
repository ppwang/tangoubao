// subscribe user module is responsible for creating wechat user; sending welcome message and tuangoubao 
//  account bundling.

var tgbWechatUser = require('cloud/tuangoubao/wechat_user');
var wechatAccessToken = require('cloud/wechat/utils/wechat_access_token');
var wechatUserInfo = require('cloud/wechat/utils/wechat_user_info');
var messageUtils = require('cloud/wechat/msg_handlers/message_utils');

module.exports = function (wechatId, publicAccountId, createTime, res) {
    console.log('subscribe: ' + wechatId);
    wechatAccessToken.getAccessToken()
    .then( function(accessToken) {
        return wechatUserInfo.getUserInfo(accessToken.token, wechatId);
    })
    .then( function(wechatUserRawData) {
        return tgbWechatUser.activate(wechatId, wechatUserRawData);
    })
    .then( function(wechatUser) {
        var message = messageUtils.generateWelcomeMessage(wechatId, publicAccountId, createTime, 
            wechatUser.nickname, wechatUser.claimtoken);
        // send response
        res.contentType('application/xml');
        res.send(message);
    })
    .fail( function(error) {
        console.error('subscribe user error: ' + error.message);
        res.error();
    });
};