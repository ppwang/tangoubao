var wcMsgFormats = require('cloud/wechat/wechat_message_formats');
var sprintf = require('cloud/lib/sprintf').sprintf,
    vsprintf = require('cloud/lib/sprintf').vsprintf;
var constants = require('cloud/wechat/constants');
var WechatUser = Parse.Object.extend('WechatUser');

var WechatAccessToken = Parse.Object.extend('WechatAccessToken');


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

var createInvitationCard = function (userId) {
    var message = '欢迎加入团购宝！ 请按以下链接绑定团购宝账户。'
        + '<a href="' + constants.ServiceBaseUrl + '/newuser?wechatid='
        + userId 
        + '">绑定团购宝</a>';
    return message;
}