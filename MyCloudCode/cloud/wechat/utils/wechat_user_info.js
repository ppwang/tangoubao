var wechatSetting = require('cloud/app.config.js').settings.wechat;
var logger = require('cloud/lib/logger');

module.exports.getUserInfo = function (accessToken, wechatId) {
        var url = 'https://api.weixin.qq.com/cgi-bin/user/info?'
            + 'access_token=' + accessToken
            + '&openid=' + wechatId
            + '&lang=en';
        logger.debugLog('getUserInfo log. url: ' + url);
        return Parse.Cloud.httpRequest({
            url: url
    })
    .then(function(httpResponse) {
        var buffer = httpResponse.buffer;

        var text = buffer.toString('utf8');
        logger.debugLog('getUserInfo log. response text (utf8): ' + text);

        return text;
    });
}
