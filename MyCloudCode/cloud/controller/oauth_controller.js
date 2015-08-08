var WechatUser = Parse.Object.extend('WechatUser');
var wechatSetting = require('cloud/app.config.js').settings.wechat;
var serviceSetting = require('cloud/app.config.js').settings.webservice;
var tgbWechatUser = require('cloud/tuangoubao/wechat_user');
var userModel = require('cloud/tuangoubao/user');
var _ = require('underscore');
var Buffer = require('buffer').Buffer;
var logger = require('cloud/lib/logger');

module.exports.oauthConnect = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var authProvider = req.params.authProvider;
	logger.debugLog('oauthConnect logger. oauthConnect request: ' + req.url);
	logger.debugLog('oauthConnect logger. req query: ' + JSON.stringify(req.query));

	// We are supporting only wechat for now
	if (authProvider != 'wechat' || !req.query.code) {
		var errorMessage = 'oauthConnect error: authProvider not wechat or not code in request';
		logger.logDiagnostics(correlationId, 'error', errorMessage);
		return res.status(401).send(responseError);
	}
	var redirUrl = req.query.redir;

	var wechatOAuthCode = req.query.code;
	var wechatTokenRequestUrl = 
			'https://api.weixin.qq.com/sns/oauth2/access_token?grant_type=authorization_code'
            + '&appid=' + wechatSetting.wechatAppId 
            + '&secret=' + wechatSetting.wechatAppSecret
            + '&code=' + wechatOAuthCode;

	logger.debugLog('oauthConnect logger. token request: ' + wechatTokenRequestUrl);
    var now = new Date();
    return Parse.Cloud.httpRequest({
        	url: wechatTokenRequestUrl
    	})
    	.then(function(httpResponse) {
    		// TODO: error code check for refresh token ...
			logger.debugLog('oauthConnect logger. got token: ' + httpResponse.text);
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
				return query.first({useMasterKey: true})
					.then(function(parseWechatUser) {
						if (!parseWechatUser) {
							logger.debugLog('oauthConnect logger. no parseWechatUser. We need to request oauth based user info');
							var userInfoUrl = serviceSetting.baseUrl + '/api/user/wechat';
							if (redirUrl) {
								userInfoUrl += '?redir=' + redirUrl;
							}
							var wechatUserInfoOAuthUrl = 
								'https://open.weixin.qq.com/connect/oauth2/authorize?'
					            + 'appid=' + wechatSetting.wechatAppId 
					            + '&redirect_uri=' + encodeURIComponent(userInfoUrl)
					            + '&response_type=code&scope=snsapi_userinfo#wechat_redirect';
							logger.debugLog('oauthConnect logger. no parseWechatUser. redirUrl wechatUserInfoOAuthUrl:' + wechatUserInfoOAuthUrl);

				            result.action = 'redirect';
				            result.redirUrl = wechatUserInfoOAuthUrl; 
						}
						else {
							// We found the user, no need to ask user info again
							logger.debugLog('oauthConnect logger. We found the user, no need to ask user info again');
							result.action = 'done';
							var wechatUser = tgbWechatUser.convertToWechatUserModel(parseWechatUser);
							result.data = wechatUser;
							var parseUserQuery = new Parse.Query(Parse.User);
							parseUserQuery.equalTo('wechatId', accessToken.openid);
							return parseUserQuery.first({useMasterKey: true})
								.then(function(parseUser) {
									if (parseUser) {
										var parseUserName = parseUser.get('username');
										logger.debugLog('oauthConnect logger. found user: ' + parseUserName);

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
											logger.debugLog('oauthConnect logger. reset password: ' + password);
											return parseUser.save(null, {useMasterKey: true})
												.then(function(savedUser) {
													logger.debugLog('oauthConnect log. log in user now.');
													return Parse.User.logIn(parseUserName, password);
												});
										}
										logger.debugLog('oauthConnect logger. user name not matching wechat id');

										var sessionToken = parseUser.getSessionToken();
										logger.debugLog('oauthConnect logger. Got sessionToken: ' + JSON.stringify(sessionToken));
										return Parse.User.become(sessionToken);
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
										logger.debugLog('oauthConnect logger. create new user. username: ' + username + ', password: ' + password);
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
			var errorMessage;
			if (!result) {
				errorMessage = 'oauthConnect error: no result from token request';
				logger.logDiagnostics(correlationId, 'error', errorMessage);
				return res.status(500).send(responseError);
			}
			if (result.action == 'done') {
				var endUrl = (redirUrl && redirUrl != 'null')? redirUrl : serviceSetting.baseUrl;
				logger.debugLog('oauthConnect logger. oauth controller redirect,' + redirUrl + ', redirect to: ' + endUrl + ', baseUrl: ' + serviceSetting.baseUrl);
				return res.redirect(endUrl);
			}
			if (result.action == 'redirect') {
				var endUrl = (result.redirUrl && result.redirUrl != 'null')? result.redirUrl : serviceSetting.baseUrl;
				logger.debugLog('oauthConnect logger. oauth controller redirect,' + result.redirUrl + ', redirect to: ' + endUrl + ', baseUrl: ' + serviceSetting.baseUrl);
				return res.redirect(endUrl);
			}
			errorMessage = 'oauthConnect error: unknown result.action';
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			return res.status(401).send(responseError);
		}, function(error) {
			var errorMessage = 'oauthConnect error: ' + JSON.stringify(error);
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			return res.status(500).send(responseError);
		});
};