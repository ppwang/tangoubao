var wechatSetting = require('cloud/app.config.js').settings.wechat;

module.exports.getUserInfo = function (accessToken, wechatId) {
        var url = 'https://api.weixin.qq.com/cgi-bin/user/info?'
            + 'access_token=' + accessToken
            + '&openid=' + wechatId;
        console.log('url: '+ url);
        return Parse.Cloud.httpRequest({
            url: url
    })
    .then(function(httpResponse) {
        console.log('got user info response: ' + httpResponse);
        console.log('response text: ' + httpResponse.text);

        return JSON.parse(httpResponse.text);
    })
    .fail(function(error) {
        console.log('user info request error' + error.message);
    });
}
