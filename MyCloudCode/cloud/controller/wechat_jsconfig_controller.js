var wechatJsTicket = require('cloud/wechat/utils/wechat_js_ticket');
var jsSHA = require('cloud/lib/sha');

module.exports.getConfigs = function(req, res) {
	var postData = req.body;
	var url = postData.url;
	console.log('get wechat js config for url: ' + url);
	if (!url) {
		// not found
		return res.status(404).end();
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
			console.log('wechat jsconfig error: ' + JSON.stringify(error));
			return res.status(500).end();
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
	console.log('string to sign: ' + string);
	return string;
};
