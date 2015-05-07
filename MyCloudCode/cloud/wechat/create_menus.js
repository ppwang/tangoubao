var wechatSetting = require('cloud/app.config.js').wechat;

var WechatAccessToken = Parse.Object.extend('WechatAccessToken');

var getAccessToken = function() {
    var query = new Parse.Query(WechatAccessToken);
    query.first({
        success: function(result) {
            var token = null;
            if (result != null) {
                var expiry = result.expiry;
                var now = new Date();
                var timeNow = now.getTime();
                if (timeNow > expiry) {
                    token = fetchFreshToken();
                    result.token = token;
                    result.expiry = (new Date()).getTime();
                    result.save();
                }
            }
            else {
                token = fetchFreshToken(); 
                var accessToken = new WechatAccessToken();
                accessToken.token = token;
                accessToken.expiry = (new Date()).getTime();
                accessToken.save();
            }
        },

        error: function(error) {
            console.log('error');
            console.log(error.message);
            res.error();
        }
    });
}

var fetchFreshToken = function () {
    var url = "https://api.weixin.qq.com";
    var options = {
        host: url,
        port: 80,
        path: '/cgi-bin/token?grant_type=client_credential&appid=' + wechatSetting.WeChatAppId + '&secret=' + Constants.WeChatAppSecret,
        method: 'GET'
    };
    
    var token;
    http.request(options, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            token = chunk;
        });
    }).end();
    
    return token;
}

module.exports.create = function (req, res) {
    res.render('create_menus');
}