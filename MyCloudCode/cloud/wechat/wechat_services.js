var wechatSetting = require('cloud/app.config.js').settings.wechat;

var sha1 = require('cloud/lib/sha1');
var wcMsgHandlers = require('cloud/wechat/msg_handlers/message_handlers');
var utils = require('cloud/lib/utils');
var createMenus = require('cloud/wechat/create_menus');
var logger = require('cloud/lib/logger');

var authenticate = function (req) {
    var timestamp = req.query.timestamp;
    var nonce = req.query.nonce;
    logger.debugLog('wechat authenticate. timestamp: ' + timestamp 
        + ', nonce: ' + nonce + ', signature' + req.query.signature);
    var signatureArray = new Array(wechatSetting.wechatAppToken, timestamp, nonce);
    signatureArray = signatureArray.sort();
    var signature = signatureArray.join('');
	signature = sha1.Sha1Hash(signature);
	
	if( signature == req.query.signature ){
        return true;
	}else{
		return false;
	}
}

// respond to get request for wechat validation
module.exports.requestValidate = function (req, res) {
    if (authenticate(req)) {
        var echoStr = req.query.echostr;
		res.send(echoStr);
	}else{
		res.send('error');
	}
}

// respond to host requests. route to different message handlers
module.exports.reply = function(req, res) {
    logger.debugLog('wechat service reply');
    if (authenticate(req)) {
        var msgType = req.body.xml.msgtype[0];
        var publicAccountId = req.body.xml.tousername[0]; // public account
        var wechatId = req.body.xml.fromusername[0]; // subscriber
        var createTime = parseInt(req.body.xml.createtime[0]);
        var eventKey;
        if (req.body.xml.eventkey) {
            eventKey = req.body.xml.eventkey[0];
        }
        
        switch (msgType)
        {
            case 'text':
                wcMsgHandlers.textMsgHandler(wechatId, publicAccountId, createTime, req, res);
                break;
            case 'event':
                wcMsgHandlers.eventMsgHandler(wechatId, publicAccountId, createTime, eventKey, req, res);
                break;
            default:
                break;
        }
	}else{
		res.send('error');
	}
}

module.exports.createMenus = function (req, res) {
    createMenus.create(req, res); 
}