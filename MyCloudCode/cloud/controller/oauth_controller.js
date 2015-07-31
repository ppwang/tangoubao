var WechatUser = Parse.Object.extend('WechatUser');
var wechatSetting = require('cloud/app.config.js').settings.wechat;
var serviceSetting = require('cloud/app.config.js').settings.webservice;
var tgbWechatUser = require('cloud/tuangoubao/wechat_user');
var userModel = require('cloud/tuangoubao/user');
var _ = require('underscore');
var Buffer = require('buffer').Buffer;

module.exports.oauthConnect = function(req, res) {
	Parse.Cloud.useMasterKey();

	var authProvider = req.params.authProvider;
	console.log('oauthConnect request: ' + req.url);
	console.log('req query: ' + JSON.stringify(req.query));

	// We are supporting only wechat for now
	if (authProvider != 'wechat' || !req.query.code) {
		return res.status(401).end();
	}
	var redirUrl = req.query.redir;

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
							if (redirUrl) {
								userInfoUrl += '?redir=' + redirUrl;
							}
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
							var wechatUser = tgbWechatUser.convertToWechatUserModel(parseWechatUser);
							result.data = wechatUser;
							var parseUserQuery = new Parse.Query(Parse.User);
							parseUserQuery.equalTo('wechatId', accessToken.openid);
							return parseUserQuery.first()
								.then(function(parseUser) {
									if (parseUser) {
										var parseUserName = parseUser.get('username');
										console.log('found user: ' + parseUserName);

										// log in on user's behalf now
										if (parseUserName == 'wechat_' + accessToken.openid) {
											// This is the wechat signed in user. It is OK to reset password
											var passwordBuffer = new Buffer(24);
										  	_.times(24, function(i) {
											    passwordBuffer.set(i, _.random(0, 255));
											});
											var password = passwordBuffer.toString('base64');
											parseUser.set('password', password);
											parseUser.set('masterRequest', 'true');
											console.log('reset password: ' + password);
											return parseUser.save()
												.then(function(savedUser) {
													console.log('log in user now');
													return Parse.User.logIn(parseUserName, password);
												});
										}
										console.log('user name not matching wechat id');
										return parseUser;
									}
									else {
										// create a new user
										var newUser = new Parse.User();
									  	var passwordBuffer = new Buffer(24);
									  	_.times(24, function(i) {
										    passwordBuffer.set(i, _.random(0, 255));
										});
										var username = 'wechat_' + accessToken.openid;
										var password = passwordBuffer.toString('base64')
										console.log('create new user. username: ' + username + ', password: ' + password);
									  	newUser.set('username', username);
									  	newUser.set('password', password);
									  	newUser.set('wechatId', wechatUser.wechatId);
									  	newUser.set('nickname', wechatUser.nickname);
									  	newUser.set('headimgurl', wechatUser.headimgurl);
									  	newUser.set('wechatNotify', true);
									  	newUser.set('emailNotify', true);
									  	newUser.set('bypassClaim', 'true');
									  	return newUser.signUp();
									}
								})
								.then(function(loggedInUser) {
									result.data = userModel.convertToUserModel(loggedInUser);
									return result;
								});
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
				var endUrl = (redirUrl && redirUrl != 'null')? redirUrl : serviceSetting.baseUrl;
				console.log('oauth controller redirect,' + redirUrl + ', redirect to: ' + endUrl + ', baseUrl: ' + serviceSetting.baseUrl);
				return res.redirect(endUrl);
			}
			if (result.action == 'redirect') {
				var endUrl = (result.redirUrl && result.redirUrl != 'null')? result.redirUrl : serviceSetting.baseUrl;
				console.log('oauth controller redirect,' + result.redirUrl + ', redirect to: ' + endUrl + ', baseUrl: ' + serviceSetting.baseUrl);
				return res.redirect(endUrl);
			}
			return res.status(401).end();
		}, function(error) {
			console.log('error: ' + JSON.stringify(error));
			return res.status(500).end();
		});
};