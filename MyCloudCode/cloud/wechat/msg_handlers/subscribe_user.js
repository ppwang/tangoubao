// subscribe user module is responsible for creating wechat user; sending welcome message and tuangoubao 
//  account bundling.

var serviceSetting = require('cloud/app.config.js').settings.webservice;

var wcMsgFormats = require('cloud/wechat/msg_handlers/wechat_message_formats');
var sprintf = require('cloud/lib/sprintf').sprintf,
    vsprintf = require('cloud/lib/sprintf').vsprintf;

var tgbWechatUser = require('cloud/tuangoubao/wechat_user');
var wechatAccessToken = require('cloud/wechat/utils/wechat_access_token');
var wechatUserInfo = require('cloud/wechat/utils/wechat_user_info');

module.exports = function (wechatId, publicAccountId, createTime, res) {
    console.log('subscribe: ' + wechatId);
    wechatAccessToken.getAccessToken()
    .then( function(accessToken) {
        return wechatUserInfo.getUserInfo(accessToken.token, wechatId);
    })
    .then( function(wechatUserData) {
        return tgbWechatUser.activate(wechatId, wechatUserData);
    })
    .then( function() {
        sendWelcomeMessage(wechatId, publicAccountId, createTime, res);
    })
    .fail( function(error) {
        console.error('subscribe user error: ' + error.message);
        res.error();
    });
};

var sendWelcomeMessage = function(wechatId, publicAccountId, createTime, res) {
    var message = createInvitationCard(wechatId);
    res.contentType('application/xml');
    var str = vsprintf(wcMsgFormats.basicReplyXmlFormat, [
            wechatId,
            publicAccountId,
            createTime+1,
            'text',
            message
        ]);
    console.log(str);
    res.send(str);
};

var createInvitationCard = function (userId) {
    var message = '欢迎加入团购宝！ 请按以下链接绑定团购宝账户。'
//        + '<a href="' + serviceSetting.baseUrl + '/newuser?wechatid='
        + '<a href="' + serviceSetting.baseUrl + '/index.html?wechatId='
        + userId 
        + '">绑定团购宝</a>';
    return message;
}