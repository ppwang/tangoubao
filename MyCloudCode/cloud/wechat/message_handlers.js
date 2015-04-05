var wcMsgFormats = require('cloud/wechat/wechat_message_formats');
var sprintf = require("cloud/lib/sprintf").sprintf,
    vsprintf = require("cloud/lib/sprintf").vsprintf;
var WechatUser = Parse.Object.extend('WechatUser');

var createInvitationCard = function (userId) {
    var message = '欢迎加入团购宝！ 请按以下链接绑定团购宝账户。'
        + '<a href="http://tuangoubao.parseapp.com/newuser?wechatid='
        + userId 
        + '">绑定团购宝</a>';
    console.log(message);
    return message;
}

var AppId = 'wx9c7c39cc1974737f';
var AppSecret = 'c94f424e801ef527a0a0f9b9f7e535f7';

var WechatAccessToken = Parse.Object.extend('WechatAccessToken');

var subscribeUser = function (userId, appId, createTime, res) {
    var query = new Parse.Query(WechatUser);
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
                var user = new WechatUser();
                user.set('status', 'active');
                user.set('wechatId', userId);
                user.save();
            }
            //getAccessToken();
            
            var url = 'https://api.wechat.com/cgi-bin/user/info?access_token=' + '24X6ZwnsQRnfkxjp1JXdrsCU9CLf8zMxukAjtCwj1kptJKt0TDKr8vouUTYRwO4Kd2fi-j_WCLCpdsaSRlklez8yi0GviujbydfaD7chhUc' + '&openid=' + userId + '&lang=zh_CN';
            console.log('url: ' + url);
            // Try to get user info:
            Parse.Cloud.httpRequest({
              url: url,
              success: function(httpResponse) {
                console.log(httpResponse.text);
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
              error: function(httpResponse) {
                console.error('Request failed with response code ' + httpResponse.status);
              }
            });
            
            
        },

        error: function(error) {
            console.log('error');
            console.log(error.message);
            res.error();
        }
    });
};

var unsubscribeUser = function (userId, appId, createTime, res) {
    console.log('remove user');
    var query = new Parse.Query(WechatUser);
    query.equalTo('wechatId', userId);
    query.first({
        success: function(result) {
            console.log('success');
            if (result != null) {
                result.set('status', 'inactive');
                result.save(null, {
                    success: function(user) {
                        console.log('Existing user left');
                    },
                    error: function(user, error) {
                        console.error(error.message);
                    }
                });
            }
            else {
                console.log('Unexpected in querying existing user' + error.message);
                var user = new WechatUser();
                user.set('wechatId', userId);
                user.set('status', 'inactive');
                user.save(null, {
                    success: function(user) {
                        console.log('Create an inactive user');
                    },
                    error: function(user, error) {
                        console.error(error.message);
                    }
                });
            }
            res.success();
        },

        error: function(error) {  
            res.error();
        }
    });
}

var subscribeMsg = function (userId) {
    console.log('subscribe');
    console.log('fromuser: '+ userId);
    
    var msg = 'Welcome user: ' + userId;
    return msg;
};

var unsubscribeMsg = function (userId) {
    return userId;
};

module.exports.textMsgHandler = function (req, res) {
    var toUser = req.body.xml.tousername[0];
    var fromUser = req.body.xml.fromusername[0];
    var createTime = parseInt(req.body.xml.createtime[0]);
    var reqMsg = req.body.xml.content;
    
    var content = 'You said: ' + reqMsg;        
    // send response
    res.contentType('application/xml');
    var str = vsprintf(wcMsgFormats.basicReplyXmlFormat, [
            fromUser,
            toUser,
            createTime+1,
            'text',
            content
        ]);
    console.log(str);
    res.send(str);
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
            content = 'Welcome user: ' + fromUser;
            break;
        case 'unsubscribe':
            unsubscribeUser(fromUser, toUser, createTime, res);
            content = unsubscribeMsg(fromUser);
            break;
        default:
            break;
    }
}