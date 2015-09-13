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
    var content = nickname + ', 谢谢您关注微蜂团购! ' 
                + '请按以下链接进入'
                + '<a href="' + serviceSetting.baseUrl 
                + '">微蜂团购</a>';

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

var wechatIdWhiteList = ['oy2t5t4i9QvA4NerKGZEbFnFqCeE', 
    'oy2t5ty4wthpZ-Yne912a0I94KV4', 
    'oy2t5t8JaHH6rv0Fr7VG86fSONJc',
    'oy2t5t--FEKOgK4GKstCpgreQ0uQ'];

var createInvitationCard = function (wechatId, nickname, headimgurl, claimtoken) {
    var message;

    message = nickname + '，'
            + '欢迎加入微蜂团购！ 请按以下链接绑定微蜂团购账户。'
            + '<a href="' + serviceSetting.baseUrl 
                + '/#/login?wechatId=' + wechatId 
                + '&nickname=' + nickname
                + '&claimtoken=' + claimtoken
                + '&headimgurl=' + encodeURIComponent(headimgurl)
            + '">绑定微蜂团购</a>'
            + '\n' 
            + '如果已有账户，请按以下链接进入你的账户。'
            + '<a href="' + serviceSetting.baseUrl 
                + '/#/welcome?wechatId=' + wechatId 
                + '&nickname=' + nickname
                + '&claimtoken=' + claimtoken
                + '&headimgurl=' + encodeURIComponent(headimgurl)
            + '">进入微蜂团购</a>';
    // // TODO: remove whitelist
    // if (wechatIdWhiteList.indexOf(wechatId) != -1) {
    //     message = nickname + '，'
    //         + '欢迎加入微蜂团购！ 请按以下链接绑定微蜂团购账户。'
    //         + '<a href="' + serviceSetting.baseUrl 
    //             + '/#/login?wechatId=' + wechatId 
    //             + '&nickname=' + nickname
    //             + '&claimtoken=' + claimtoken
    //             + '&headimgurl=' + encodeURIComponent(headimgurl)
    //         + '">绑定微蜂团购</a>'
    //         + '\n' 
    //         + '如果已有账户，请按以下链接进入你的账户。'
    //         + '<a href="' + serviceSetting.baseUrl 
    //             + '/#/welcome?wechatId=' + wechatId 
    //             + '&nickname=' + nickname
    //             + '&claimtoken=' + claimtoken
    //             + '&headimgurl=' + encodeURIComponent(headimgurl)
    //         + '">进入微蜂团购</a>';
    // }
    // else {
    //     message = nickname + '，'
    //         + '欢迎加入微蜂团购！我们正在测试开发阶段，请继续关注我们。';
    // }
    return message;
}