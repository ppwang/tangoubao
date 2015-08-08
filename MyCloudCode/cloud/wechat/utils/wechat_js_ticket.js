var wechatSetting = require('cloud/app.config.js').settings.wechat;
var WechatJsTicket = Parse.Object.extend('WechatJsTicket');
var wechatAccessTokenUtil = require('cloud/wechat/utils/wechat_access_token');
var logger = require('cloud/lib/logger');

module.exports.getJsTicket = function() {
    var query = new Parse.Query(WechatJsTicket);
    return query.first().then( function(jsTicket) {
        var now = new Date();
        var fetch = false;
        if (!jsTicket) {
            jsTicket = new WechatJsTicket();
            fetch = true;
        }
        else {
            var ticket = jsTicket.get('ticket');
            var expiry = jsTicket.get('expiry');
            if (!ticket || !expiry || expiry < now) {
                fetch = true;
            }
            else {
                jsTicket.ticket = ticket;
                jsTicket.expiry = expiry;
            }
        }
        if (fetch) {
            return fetchFreshJsTicket(jsTicket, now);
        }
        logger.debugLog('getJsTicket log. return ticket: ' + jsTicket);
        return jsTicket;
    });
}

var fetchFreshJsTicket = function (jsTicket, now) {
    logger.debugLog('fetchFreshJsTicket log. request ticket');
    return wechatAccessTokenUtil.getAccessToken()
        .then(function(accessToken) {
            var url = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token='
                + accessToken.token
                + '&type=jsapi';
            return Parse.Cloud.httpRequest({ url: url });
        })
        .then(function(httpResponse) {
            logger.debugLog('fetchFreshJsTicket log. got ticket: ' + httpResponse.text);
            var ticketResult = JSON.parse(httpResponse.text);
            jsTicket.ticket = ticketResult.ticket;
            jsTicket.expiry = now;
            jsTicket.expiry.setSeconds(now.getSeconds() + ticketResult.expires_in);
            jsTicket.set('ticket', jsTicket.ticket);
            jsTicket.set('expiry', jsTicket.expiry);
            return jsTicket.save();
        });
}
