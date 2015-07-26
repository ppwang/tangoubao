var wechatSetting = require('cloud/app.config.js').settings.wechat;
var WechatAccessToken = Parse.Object.extend('WechatAccessToken');

module.exports.getAccessToken = function() {
    var query = new Parse.Query(WechatAccessToken);
    return query.first().then( function(accessToken) {
        var now = new Date();
        var fetch = false;
        if (!accessToken) {
            accessToken = new WechatAccessToken();
            fetch = true;
        }
        else {
            var token = accessToken.get('token');
            var expiry = accessToken.get('expiry');
            if (!token || !expiry || expiry < now) {
                fetch = true;
            }
            else {
                accessToken.token = token;
                accessToken.expiry = expiry;
            }
        }
        if (fetch) {
            return fetchFreshToken(accessToken, now);
        }
        console.log('return token: ' + accessToken);
        return accessToken;
    });
}

var fetchFreshToken = function (accessToken, now) {
    console.log('request token');
    var url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential'
        + '&appid=' + wechatSetting.wechatAppId 
        + '&secret=' + wechatSetting.wechatAppSecret;
    console.log('token request: ' + url);
    return Parse.Cloud.httpRequest({ url: url })
        .then(function(httpResponse) {
            console.log('got token: ' + httpResponse.text);
            var tokenResult = JSON.parse(httpResponse.text);
            accessToken.token = tokenResult.access_token;
            accessToken.expiry = now;
            accessToken.expiry.setSeconds(now.getSeconds() + tokenResult.expires_in);
            accessToken.set('token', accessToken.token);
            accessToken.set('expiry', accessToken.expiry);
            return accessToken.save();
        });
}
