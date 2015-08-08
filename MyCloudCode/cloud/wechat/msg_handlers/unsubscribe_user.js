var wechatSetting = require('cloud/app.config.js').settings.wechat;
var tgbWechatUser = require('cloud/tuangoubao/wechat_user');
var logger = require('cloud/lib/logger');

module.exports = function (wechatId, publicAccountId, createTime, res) {
    tgbWechatUser.deactivate(wechatId)
    .then()
    .fail( function(error) {
    	logger.debugLog('unsubscribe error: ' + error.message);
        res.error();
    });
}