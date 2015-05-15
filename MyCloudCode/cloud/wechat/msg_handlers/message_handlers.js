var wcMsgFormats = require('cloud/wechat/msg_handlers/wechat_message_formats');
var sprintf = require('cloud/lib/sprintf').sprintf,
    vsprintf = require('cloud/lib/sprintf').vsprintf;
var subscribeUser = require('cloud/wechat/msg_handlers/subscribe_user');
var unsubscribeUser = require('cloud/wechat/msg_handlers/unsubscribe_user');
var wechatAccessToken = require('cloud/wechat/utils/wechat_access_token');
var wechatUserInfo = require('cloud/wechat/utils/wechat_user_info');
var tgbWechatUser = require('cloud/tuangoubao/wechat_user');
var messageUtils = require('cloud/wechat/msg_handlers/message_utils');

module.exports.textMsgHandler = function (req, res) {
    var toUser = req.body.xml.tousername[0]; // public account
    var fromUser = req.body.xml.fromusername[0]; // subscriber
    var createTime = parseInt(req.body.xml.createtime[0]);

    wechatAccessToken.getAccessToken()
    .then( function(accessToken) {
        return wechatUserInfo.getUserInfo(accessToken.token, fromUser);
    })
    .then( function(wechatUserRawData) {
        return tgbWechatUser.update(fromUser, wechatUserRawData);
    })
    .then( function(wechatUser) {
        var message = messageUtils.generateReplyMessage(fromUser, toUser, createTime, 
            wechatUser.nickname, req.body.xml.content);
        // send response
        res.contentType('application/xml');
        res.send(message);
    })
    .fail( function(error) {
        console.error('message handler error: ' + error.message);
        res.error();
    });
}

module.exports.eventMsgHandler = function (req, res) {
    var toUser = req.body.xml.tousername[0]; // public account
    var fromUser = req.body.xml.fromusername[0]; // subscriber
    var createTime = parseInt(req.body.xml.createtime[0]);
    var event = req.body.xml.event.toString();
    console.log('event: ' + event);
    console.log('from user:' + fromUser);

    var content = req.body.xml.content;
    switch (event.trim())
    {
        case 'subscribe':
            subscribeUser(fromUser, toUser, createTime, res);
            break;
        case 'unsubscribe':
            unsubscribeUser(fromUser, toUser, createTime, res);
            break;
        default:
            break;
    }
}