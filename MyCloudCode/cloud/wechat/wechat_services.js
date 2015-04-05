var sha1 = require('cloud/lib/sha1');
var wcMsgHandlers = require('cloud/wechat/message_handlers');
var utils = require('cloud/lib/utils');
var createMenus = require('cloud/wechat/create_menus');

var APP_TOKEN = 'tuangoubao';

var authenticate = function (req) {
    var token = APP_TOKEN;
    var timestamp = req.query.timestamp;
    var nonce = req.query.nonce;
    var signatureArray = new Array(token, timestamp, nonce);
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
    if (authenticate(req)) {
        console.log('xml: ' + req.body.xml);
        var msgType = req.body.xml.msgtype[0];
        console.log('msg type: ' + msgType);
        
        switch (msgType)
        {
            case 'text':
                wcMsgHandlers.textMsgHandler(req, res);
                break;
            case 'event':
                wcMsgHandlers.eventMsgHandler(req, res);
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