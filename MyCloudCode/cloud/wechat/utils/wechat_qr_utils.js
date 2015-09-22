var logger = require('cloud/lib/logger');
var wcMsgFormats = require('cloud/wechat/msg_handlers/wechat_message_formats');
var sprintf = require('cloud/lib/sprintf').sprintf,
    vsprintf = require('cloud/lib/sprintf').vsprintf;
var wechatAccessToken = require('cloud/wechat/utils/wechat_access_token');

module.exports.generateQRImage = function(sceneId) {
    return wechatAccessToken.getAccessToken()
    .then(function(accessToken) {
        return generateQRTicket(accessToken, sceneId);
    }, function(error) {
        logger.debugLog('Failed to obtain access token for QR ticket: ' + error);
    })
    .then(function(qrTicket) {
        return redeemQRTicket(qrTicket);
    }, function(error) {
        logger.debugLog('Failed to redeem ticket for QR image!');
    });
};

var generateQRTicket = function(accessToken, sceneId) {
    var url = 'https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=' + accessToken.token;
    logger.debugLog('Generating QR ticket: ' + url);
    return Parse.Cloud.httpRequest({ 
        method: 'POST', 
        url: url,
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: '{"action_name": "QR_LIMIT_STR_SCENE", "action_info": {"scene": {"scene_str": "' + sceneId + '"}}}'
    })
    .then(function(httpResponse) {
        logger.debugLog('generateQRTicket log. got response: ' + httpResponse.text);
        var result = JSON.parse(httpResponse.text);
        return result.ticket;
    }, function(httpResponse) {
        logger.debugLog('Failed to generate a QR ticket: ' + httpResponse.status);
        return;
    });
};

var redeemQRTicket = function(qrTicket) {
    var url = 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=' + qrTicket;
    logger.debugLog('Generating QR ticket: ' + url);
    
    return Parse.Cloud.httpRequest({ 
        url: url,
    })
    .then(function(httpResponse) {
        logger.debugLog('redeemQRTicket log. got image.');
        return httpResponse.buffer;
    }, function(httpResponse) {
        logger.debugLog('Failed to generate a QR ticket: ' + httpResponse.status);
        return;
    });

}