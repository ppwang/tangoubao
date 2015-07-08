var WechatUser = Parse.Object.extend('WechatUser');
var wechatSetting = require('cloud/app.config.js').settings.wechat;
var serviceSetting = require('cloud/app.config.js').settings.webservice;
var tgbWechatUser = require('cloud/tuangoubao/wechat_user');

module.exports.oauthConnect = function(req, res) {
	var authProvider = req.params.authProvider;
	console.log('oauthConnect request: ' + req.url);

	// We are supporting only wechat for now
	if (authProvider != 'wechat' || !req.query.code) {
		return res.status(401).end();
	}

	var wechatOAuthCode = req.query.code;
	var wechatTokenRequestUrl = 
			'https://api.weixin.qq.com/sns/oauth2/access_token?grant_type=authorization_code'
            + '&appid=' + wechatSetting.wechatAppId 
            + '&secret=' + wechatSetting.wechatAppSecret
            + '&code=' + wechatOAuthCode;

    console.log('token request: ' + wechatTokenRequestUrl);
    var now = new Date();
    return Parse.Cloud.httpRequest({
        	url: wechatTokenRequestUrl
    	})
    	.then(function(httpResponse) {
    		// TODO: error code check for refresh token ...
	        console.log('got token: ' + httpResponse.text);
	        var tokenResult = JSON.parse(httpResponse.text);
	        var accessToken = {};
	        accessToken.token = tokenResult.access_token;
	        accessToken.expiry = now;
	        accessToken.expiry.setSeconds(now.getSeconds() + tokenResult.expires_in);
	        accessToken.openid = tokenResult.openid;

	        return accessToken;
    	})
    	.then(function(accessToken) {
    		if (accessToken.token && accessToken.openid) {
	    		var query = new Parse.Query(WechatUser);
				query.equalTo('wechatId', accessToken.openid);
				var result = {};
				return query.first()
					.then(function(parseWechatUser) {
						if (!parseWechatUser) {
							console.log('no parseWechatUser. We need to request oauth based user info');
							var userInfoUrl = serviceSetting.baseUrl + '/api/user/wechat'; 
							var wechatUserInfoOAuthUrl = 
								'https://open.weixin.qq.com/connect/oauth2/authorize?'
					            + 'appid=' + wechatSetting.wechatAppId 
					            + '&redirect_uri=' + encodeURIComponent(userInfoUrl)
					            + '&response_type=code&scope=snsapi_userinfo#wechat_redirect';
				            console.log('redirUrl wechatUserInfoOAuthUrl:' + wechatUserInfoOAuthUrl);
				            result.action = 'redirect';
				            result.redirUrl = wechatUserInfoOAuthUrl;
						}
						else {
							// We found the user, no need to ask user info again
							console.log('We found the user, no need to ask user info again');
							result.action = 'done';
							result.data = tgbWechatUser.convertToWechatUserModel(parseWechatUser);
						}					
						return result;
					});
			}
			return null;	
    	})
		.then(function(result) {
			if (!result) {
				return res.status(500).end();
			}
			if (result.action == 'done') {
				return res.status(200).send(result.data);
			}
			if (result.action == 'redirect') {
				return res.redirect(result.redirUrl);
			}
			return res.status(401).end();
		}, function(error) {
			console.log('error: ' + JSON.stringify(error));
			return res.status(500).end();
		});
};