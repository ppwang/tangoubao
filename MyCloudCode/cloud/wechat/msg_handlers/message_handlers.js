var wcMsgFormats = require('cloud/wechat/msg_handlers/wechat_message_formats');
var sprintf = require('cloud/lib/sprintf').sprintf,
    vsprintf = require('cloud/lib/sprintf').vsprintf;
var subscribeUser = require('cloud/wechat/msg_handlers/subscribe_user');
var unsubscribeUser = require('cloud/wechat/msg_handlers/unsubscribe_user');
var qrCloseOrder = require('cloud/wechat/msg_handlers/qr_close_order');
var wechatAccessToken = require('cloud/wechat/utils/wechat_access_token');
var wechatUserInfo = require('cloud/wechat/utils/wechat_user_info');
var tgbWechatUser = require('cloud/tuangoubao/wechat_user');
var messageUtils = require('cloud/wechat/utils/message_utils');
var logger = require('cloud/lib/logger');

module.exports.textMsgHandler = function (wechatId, publicAccountId, createTime, req, res) {
    var userMessage = req.body.xml.content.toString();
    logger.debugLog('textMsgHandler log. message: ' + JSON.stringify(req.body.xml));
    logger.debugLog('textMsgHandler log. userMessage: ' + userMessage);
    var recreateWelcomeMessage = userMessage.indexOf('Recreate binding') === 0;

    wechatAccessToken.getAccessToken()
    .then( function(accessToken) {
        return wechatUserInfo.getUserInfo(accessToken.token, wechatId);
    })
    .then( function(wechatUserRawData) {
        return tgbWechatUser.update(wechatId, wechatUserRawData, recreateWelcomeMessage);
    })
    .then( function(wechatUser) {
        var message;
        if (recreateWelcomeMessage) {
            message = messageUtils.generateWelcomeMessage(wechatId, publicAccountId, createTime, 
                wechatUser.nickname, wechatUser.headimgurl, wechatUser.claimtoken);
        }
        else {
            message = messageUtils.generateReplyMessage(wechatId, publicAccountId, createTime, 
                wechatUser.nickname, userMessage);
        }
        // send response
        res.contentType('application/xml');
        logger.logUsage('wechatUser_' + wechatUser.id, 'textMsg', userMessage, message);
        res.send(message);
    }, function(error) {
        logger.debugLog('textMsgHandler log. message handler error: ' + error.message);
        res.error();
    });
}

module.exports.eventMsgHandler = function (wechatId, publicAccountId, createTime, eventKey, req, res) {
    var event = req.body.xml.event.toString();
    logger.debugLog('eventMsgHandler log. event message: ' + JSON.stringify(req.body.xml));
    switch (event.trim())
    {
        case 'subscribe':
            subscribeUser(wechatId, publicAccountId, createTime, res);
            break;
        case 'unsubscribe':
            unsubscribeUser(wechatId, publicAccountId, createTime, res);
            break;
        case 'SCAN':
            logger.debugLog('Received wechat event. user=' + wechatId + ';eventKey=' + eventKey + ';createTime=' + createTime);
            // Parse event key.
            var events = eventKey.split(';');
            var eventParams = {};
            events.forEach(function(e) {
                var keyValue = e.split('=');
                if (keyValue.length != 2) {
                    logger.debugLog('Received invalid event parameter ' + e);
                } else {
                    eventParams[keyValue[0]] = keyValue[1];
                }
            });
            
            switch (eventParams['a'])
            {
                case 'co':
                    return qrCloseOrder(wechatId, publicAccountId, createTime, eventParams['id'], res);
                    break;
                default:
                    logger.debugLog('Unknown event action ' + eventParams['a']);
                    break;
            }
            break;
        default:
            break;
    }
}