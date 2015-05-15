var wcMsgFormats = require('cloud/wechat/msg_handlers/wechat_message_formats');
var sprintf = require('cloud/lib/sprintf').sprintf,
    vsprintf = require('cloud/lib/sprintf').vsprintf;
var serviceSetting = require('cloud/app.config.js').settings.webservice;

module.exports.generateWelcomeMessage = function(wechatId, publicAccountId, createTime, nickname, claimtoken) {
    var message = createInvitationCard(wechatId, nickname, claimtoken);
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

var createInvitationCard = function (wechatId, nickname, claimtoken) {
    var message = nickname + '，'
        + '欢迎加入团购宝！ 请按以下链接绑定团购宝账户。'
//        + '<a href="' + serviceSetting.baseUrl + '/newuser?wechatid='
        + '<a href="' + serviceSetting.baseUrl + '/index.html?wechatId=' + wechatId 
            + '&claimtoken=' + claimtoken
        + '">绑定团购宝</a>';
    return message;
}