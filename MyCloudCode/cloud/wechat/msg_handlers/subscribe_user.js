var serviceSetting = require('cloud/app.config.js').settings.webservice;
var wechatUser = Parse.Object.extend('WechatUser');

var wcMsgFormats = require('cloud/wechat/msg_handlers/wechat_message_formats');
var sprintf = require('cloud/lib/sprintf').sprintf,
    vsprintf = require('cloud/lib/sprintf').vsprintf;

module.exports.subscribe = function (userId, appId, createTime, res) {
    var query = new Parse.Query(wechatUser);
    query.equalTo('wechatId', userId);
    query.first({
        success: function(result) {
            if (result != null) {
                result.set('status', 'active');
                result.save(null, {
                    success: function(user) {
                        console.log('Existing user rejoined');
                    },
                    error: function(user, error) {
                        console.error(error.message);
                    }
                });
            }
            else {
                var user = new wechatUser();
                user.set('status', 'active');
                user.set('wechatId', userId);
                user.save();
            }
            
            var message = createInvitationCard(userId);
            res.contentType('application/xml');
            var str = vsprintf(wcMsgFormats.basicReplyXmlFormat, [
                    userId,
                    appId,
                    createTime+1,
                    'text',
                    message
                ]);
            console.log(str);
            res.send(str);
        },

        error: function(error) {
            console.log('error');
            console.log(error.message);
            res.error();
        }
    });
};

var subscribeMsg = function (userId) {
    console.log('subscribe');
    console.log('fromuser: '+ userId);
    
    var msg = 'Welcome user: ' + userId;
    return msg;
};

var createInvitationCard = function (userId) {
    var message = '欢迎加入团购宝！ 请按以下链接绑定团购宝账户。'
//        + '<a href="' + serviceSetting.baseUrl + '/newuser?wechatid='
        + '<a href="' + serviceSetting.baseUrl + '/index.html?wechatId='
        + userId 
        + '">绑定团购宝</a>';
    return message;
}