var WechatUser = Parse.Object.extend('WechatUser');
var wechatAccessToken = require('cloud/wechat/utils/wechat_access_token');
var emailController = require('cloud/controller/email_controller');
var serviceSetting = require('cloud/app.config.js').settings.webservice;

// We will try to notify using wechat first and fall back to email if there is no associated wechat user
// TBD what are we notifying user of?
module.exports.notifyUser = function (req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		return res.status(401).send();
	}

	var userId = req.params.userId;
	console.log('notifyUser id: ' + userId);
	if (!userId) {
		// not found
		return res.status(404).end();
	}

	var query = new Parse.Query(Parse.User);
	query.equalTo('objectId', userId);
	return query.first()
		.then(function(parseUser) {
			if (!parseUser) {
				console.log('no parseUser');
				return;
			}
			var wechatId = parseUser.get('wechatId');
			console.log('wechatId: ' + wechatId);
			if (!wechatId) {
				var email = parseUser.get('email');
				var emailVerified = parseUser.get('emailVerified');
				if (!emailVerified) {
					return;
				}
				var nickname = parseUser.get('nickname');
				var username = parseUser.get('username');
				var sendeeName = nickname? nickname : username;
				return emailController.sendEmail(email, sendeeName);
			}
			return wechatAccessToken.getAccessToken()
			    .then( function(accessToken) {
			        return sendNotification(accessToken.token, wechatId);
			    }, function(error) {
			    	console.log('send notification error: ' + JSON.stringify(error));
			    });
		})
		.then(function() {
			res.status(200).end();
		}, function(error) {
			console.log('notification user error: ' + JSON.stringify(error));
			res.status(500).end();
		});
};

var sendNotification = function (accessToken, wechatId) {
    var url = 'https://api.weixin.qq.com/cgi-bin/message/template/send?'
        + 'access_token=' + accessToken;
    console.log('url: '+ url);
    var userUrl = serviceSetting.baseUrl;
    var postData = {
        	"touser": wechatId,
        	"template_id": "8USkiY6ugFj2GbUWgfl3nVCcuBx7XT1gFNV02oLGuFg",
        	"url": userUrl,
        	"topcolor":"#FF0000",
        	"data":{
        		"first": {
                   "value":"恭喜你购买成功！",
                   "color":"#173177"
               },
               "keyword1":{
                   "value":"100磅", // order amount
                   "color":"#173177"
               },
               "keyword2":{
                   "value":"$100.99", // order price
                   "color":"#173177"
               },
               "remark":{
                   "value":"欢迎使用北美团购宝！",
                   "color":"#173177"
               }
        	}
        };
    return Parse.Cloud.httpRequest( { 
    	method: 'POST', 
    	url: url, 
    	headers: {
		    'Content-Type': 'application/json;charset=utf-8'
		  },
    	body: JSON.stringify(postData) 
    } );
}