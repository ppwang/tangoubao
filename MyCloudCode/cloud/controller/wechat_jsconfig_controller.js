var wechatJsTicket = require('cloud/wechat/utils/wechat_js_ticket');
var jsSHA = require('cloud/lib/sha');
var logger = require('cloud/lib/logger');

module.exports.getConfigs = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var postData = req.body;
	var url = postData.url;
	logger.debugLog('wechat jsConfig getConfigs log. get wechat js config for url: ' + url);
	if (!url) {
		// not found
		logger.logDiagnostics(correlationId, 'error', 'wechatJsConfigs error: no url provided in request');
		return res.status(404).send(responseError);
	}
	return wechatJsTicket.getJsTicket()
		.then(function(jsTicket) {
			var config = sign(jsTicket, url);
			var jsConfig = {};
			jsConfig.timestamp = config.timestamp;
			jsConfig.nonceStr = config.nonceStr;
			jsConfig.signature = config.signature;

			return res.status(200).send(jsConfig);
		}, function(error) {
			var errorMessage = 'wechatJsConfigs error: ' + JSON.stringify(error);
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			return res.status(500).send(responseError);
		});
};

/**
* @synopsis 签名算法 
*
* @param jsapi_ticket 用于签名的 jsapi_ticket
* @param url 用于签名的 url ，注意必须动态获取，不能 hardcode
*
* @returns
*/
var sign = function (jsapi_ticket, url) {
	var ret = {
	    jsapi_ticket: jsapi_ticket.ticket,
	    nonceStr: createNonceStr(),
	    timestamp: createTimestamp(),
	    url: url
  	};
  	var string = raw(ret);
  	shaObj = new jsSHA(string, 'TEXT');
  	ret.signature = shaObj.getHash('SHA-1', 'HEX');

  	return ret;
};

var createNonceStr = function () {
	return Math.random().toString(36).substr(2, 15);
};

var createTimestamp = function () {
	return parseInt(new Date().getTime() / 1000);
};

var raw = function (args) {
	var keys = Object.keys(args);
	keys = keys.sort()
	var newArgs = {};
	keys.forEach(function (key) {
		newArgs[key.toLowerCase()] = args[key];
	});

	var string = '';
	for (var k in newArgs) {
		string += '&' + k + '=' + newArgs[k];
	}
	string = string.substr(1);
	logger.debugLog('string to sign: ' + string);
	return string;
};
