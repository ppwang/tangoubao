var wechatSetting = require('cloud/app.config.js').settings.wechat;
var tgbWechatUser = require('cloud/tuangoubao/wechat_user');

module.exports = function (wechatId, publicAccountId, createTime, res) {
    tgbWechatUser.deactivate(wechatId)
    .then()
    .fail( function(error) {
        console.error('error: ' + error.message);
        res.error();
    });
}