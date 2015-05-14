var wechatSetting = require('cloud/app.config.js').settings.wechat;

module.exports.getUserInfo = function (accessToken, wechatId) {
        var url = 'https://api.weixin.qq.com/cgi-bin/user/info?'
            + 'access_token=' + accessToken
            + '&openid=' + wechatId
            + '&lang=en';
        console.log('url: '+ url);
        return Parse.Cloud.httpRequest({
            url: url
    })
    .then(function(httpResponse) {
        var buffer = httpResponse.buffer;

        var text = buffer.toString('utf8');
        console.log('response text (utf8): ' + text);

        return text;
    })
    .fail(function(error) {
        console.log('user info request error' + error.message);
    });
}
