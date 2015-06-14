var wcMsgFormats = require('cloud/wechat/msg_handlers/wechat_message_formats');
var sprintf = require('cloud/lib/sprintf').sprintf,
    vsprintf = require('cloud/lib/sprintf').vsprintf;
var serviceSetting = require('cloud/app.config.js').settings.webservice;

module.exports.generateWelcomeMessage = function(wechatId, publicAccountId, createTime, nickname, headimgurl, claimtoken) {
    var message = createInvitationCard(wechatId, nickname, headimgurl, claimtoken);
    var str = vsprintf(wcMsgFormats.basicReplyXmlFormat, [
            wechatId,
            publicAccountId,
            createTime+1,
            'text',
            message
        ]);
    console.log(str);
    return str;
};

module.exports.generateReplyMessage = function(wechatId, publicAccountId, createTime, nickname, reqMessage) {    
    var content = nickname + ' said: ' + reqMessage;        
    var str = vsprintf(wcMsgFormats.basicReplyXmlFormat, [
            wechatId,
            publicAccountId,
            createTime+1,
            'text',
            content
        ]);
    console.log(str);
    return str;
};

var wechatIdWhiteList = ['oy2t5t4i9QvA4NerKGZEbFnFqCeE', 'oy2t5ty4wthpZ-Yne912a0I94KV4', 'oy2t5t8JaHH6rv0Fr7VG86fSONJc'];

var createInvitationCard = function (wechatId, nickname, headimgurl, claimtoken) {
    var message;
    if (wechatIdWhiteList.indexOf(wechatId) != -1) {
        message = nickname + '，'
            + '欢迎加入团购宝！ 请按以下链接绑定团购宝账户。'
            + '<a href="' + serviceSetting.baseUrl 
                + '/#/login?wechatId=' + wechatId 
                + '&nickname=' + nickname
                + '&claimtoken=' + claimtoken
                + '&headimgurl=' + encodeURIComponent(headimgurl)
            + '">绑定团购宝</a>';
    }
    else {
        message = nickname + '，'
            + '欢迎加入团购宝！我们正在测试开发阶段，请继续关注我们。';
    }
    return message;
}