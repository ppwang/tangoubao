var wcMsgFormats = require('cloud/wechat/msg_handlers/wechat_message_formats');
var sprintf = require('cloud/lib/sprintf').sprintf,
    vsprintf = require('cloud/lib/sprintf').vsprintf;
var subscribeUser = require('cloud/wechat/msg_handlers/subscribe_user');
var unsubscribeUser = require('cloud/wechat/msg_handlers/unsubscribe_user');

var wechatAccessToken = Parse.Object.extend('WechatAccessToken');

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
            break;
        case 'unsubscribe':
            unsubscribeUser(fromUser, toUser, createTime, res);
            break;
        default:
            break;
    }
}