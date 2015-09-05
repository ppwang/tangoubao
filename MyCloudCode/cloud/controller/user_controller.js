var wechatSetting = require('cloud/app.config.js').settings.wechat;
var tgbWechatUser = require('cloud/tuangoubao/wechat_user');
var tgbUser = require('cloud/tuangoubao/user');
var _ = require('underscore');
var Buffer = require('buffer').Buffer;
var ParseMessage = Parse.Object.extend('Message');
var userModel = require('cloud/tuangoubao/user');
var messageModel = require('cloud/tuangoubao/message');
var emailController = require('cloud/controller/email_controller');
var logger = require('cloud/lib/logger');

module.exports.getCurrentUser = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
	logger.debugLog('getCurrentUser log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		logger.logDiagnostics(correlationId, 'error', 'getCurrentUser error: user not logged in');
		return res.status(401).send(responseError);
	}
	return convertToUserResponseData(currentUser)
		.then(function(responseData) {
			logger.logUsage(currentUser.id, 'getCurrentUser', currentUser.id, responseData);
    		return res.status(200).send(responseData);
		}, function(error) {
			var errorMessage = 'getCurrentUser error: ' + JSON.stringify(error);
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			return res.status(500).send(responseError);
		});
}

module.exports.signUp = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var parseUser = new Parse.User();
	var username = req.body.username;
	var password = req.body.password;
	var email = req.body.email;
	var wechatId = req.body.wechatId;
	var claimtoken = req.body.claimtoken;

    parseUser.set("username", username);
    parseUser.set("password", password);
    parseUser.set("email", email);

    // set default user preference of getting notified to be all
    parseUser.set('emailNotify', true);
    parseUser.set('wechatNotify', true);
    
    if (wechatId && claimtoken) {
    	parseUser.set('action', 'signUp');
        parseUser.set("wechatId", wechatId);
        parseUser.set("claimtoken", claimtoken);
    }
    return parseUser.signUp()
    	.then(function(signedUpUser) {
    		// Add a new welcome message
    		return messageModel.addWelcomeMessage(signedUpUser)
    			.then(function(welcomeMessage) {
    				return convertToUserResponseData(signedUpUser);
    			})
    			.then(function(responseData) {
    				logger.debugLog('signUp log. signUp user: ' + responseData);
    				logger.logUsage(signedUpUser.id, 'signUp', signedUpUser.id, responseData);
    				return res.status(200).send(responseData);
    			});
    	}, function(error) {
    		if (error.code && error.code == 202) {
    			responseError.message = '您输入的用户名已经被使用，请选择其他用户名';
    		}
    		else if (error.code && error.code == 203) {
    			responseError.message = '您输入的电子邮件地址已经被使用，请选择其他电子邮件地址';
    		}
			var errorMessage = 'Signup error: ' + JSON.stringify(error);
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			Parse.User.logOut();
			return res.status(500).send(responseError);
		});
};

module.exports.logIn = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

    logger.debugLog('logIn log. req.body: ' + JSON.stringify(req.body));

	var username = req.body.username;
	var password = req.body.password;
	var wechatId = req.body.wechatId;
	var claimtoken = req.body.claimtoken;

	if (!username && !password) {
		// check if the user is already logged in
		var currentUser = Parse.User.current();
		if (currentUser) {
			return convertToUserResponseData(currentUser)
				.then(function(responseData) {
            		return res.status(200).send(responseData);
				});
		}
		var errorMessage = 'Login error: no user/password provided in request';
		logger.logDiagnostics(correlationId, 'error', errorMessage); 
		return res.status(401).send(responseError);
	}

	Parse.User.logIn(req.body.username, req.body.password)
	.then(function(parseUser) {
		if (wechatId && claimtoken) {
			parseUser.set('action', 'logIn');
        	parseUser.set("wechatId", wechatId);
        	parseUser.set("claimtoken", claimtoken);
        	return parseUser.save();
    	}
    	return parseUser;
	})
	.then(function(currentUser) {
		// Login succeeded, redirect to homepage.
		// parseExpressCookieSession will automatically set cookie.
		if (currentUser) {
			return convertToUserResponseData(currentUser)
				.then(function(responseData) {
					logger.logUsage(currentUser.id, 'logIn', currentUser.id, responseData);
            		return res.status(200).send(responseData);
				});
		}
		var errorMessage = 'Login error: no currentUser';
		logger.logDiagnostics(correlationId, 'error', errorMessage);
		return res.status(401).send(responseError);
	},
	function(error) {
		var errorMessage = 'logIn error: ' + JSON.stringify(error);
		logger.logDiagnostics(correlationId, 'error', errorMessage);
		if (error.code == Parse.Error.INVALID_SESSION_TOKEN) {
			Parse.User.logOut();
			return res.status(401).send(responseError);
		}
		return res.status(401).send(responseError);
	});	
};

module.exports.logOut = function(req, res) {
	Parse.User.logOut();
	var currentUser = Parse.User.current();
	var userId = currentUser? currentUser.id : 'anonymous';
	logger.logUsage(userId, 'logOut', userId, '');
	return res.redirect('/');
};

var convertToUserResponseData = function(parseUser) {
	var promises = [];

	promises.push(parseUser.fetch());
	
	var query = new Parse.Query(ParseMessage);
	query.equalTo('receiverId', parseUser.id);
	query.equalTo('isRead', false);
	promises.push(query.count());
	
	return Parse.Promise.when(promises)
		.then(function(instantiatedUser, unreadMessageCount) {
			logger.debugLog('convertToUserResponseData log. unreadMessageCount: ' + unreadMessageCount);
			var responseData = {};
		    responseData.user = tgbUser.convertToUserModel(instantiatedUser);
		    responseData.user.unreadMessageCount = unreadMessageCount;
		    logger.debugLog('convertToUserResponseData log. convertToUserResponseData: ' + JSON.stringify(responseData));
		    return JSON.stringify(responseData);
		});
}

module.exports.obtainUserInfo = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	Parse.Cloud.useMasterKey();
	var authProvider = req.params.authProvider;
	
	// We are supporting only wechat for now
	if (authProvider != 'wechat' || !req.query.code) {
		var currentUser = Parse.User.current();
		if (currentUser) {
			return convertToUserResponseData(currentUser)
				.then(function(responseData) {
					logger.logUsage(authProvider, 'obtainUserInfo', currentUser.id, responseData);
            		return res.status(200).send(responseData);
				});
		}
		var errorMessage = 'obtainUserInfo error: user not logged in';
		logger.logDiagnostics(correlationId, 'error', errorMessage);
		return res.status(401).send(responseError);
	}

	var redirUrl = req.query.redir;
	logger.debugLog('obtainUserInfo log. user controller obtainUserInfo redirUrl: ' + redirUrl);

	var wechatOAuthCode = req.query.code;
	var wechatTokenRequestUrl = 
			'https://api.weixin.qq.com/sns/oauth2/access_token?grant_type=authorization_code'
            + '&appid=' + wechatSetting.wechatAppId 
            + '&secret=' + wechatSetting.wechatAppSecret
            + '&code=' + wechatOAuthCode;

    logger.debugLog('obtainUserInfo log. token request: ' + wechatTokenRequestUrl);
    var now = new Date();
    return Parse.Cloud.httpRequest({
        	url: wechatTokenRequestUrl
    	})
    	.then(function(httpResponse) {
    		// TODO: error code check for refresh token ...
    		logger.debugLog('obtainUserInfo log. token request: usercontroller got token: ' + httpResponse.text);
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
	    		var wechatUesrInfoUrl = 
	    				'https://api.weixin.qq.com/sns/userinfo?'
	    				+ 'access_token=' + accessToken.token
	    				+ '&openid=' + accessToken.openid
	    				+ '&lang=en';

				logger.debugLog('obtainUserInfo log. user info request: ' + wechatUesrInfoUrl);
				return Parse.Cloud.httpRequest( {
						url: wechatUesrInfoUrl
					})
					.then(function(httpResponse) {
						return tgbWechatUser.update(accessToken.openid, httpResponse.text, null);
					});
			}	
			return null;	
    	})
    	.then(function(parseWechatUser) {
    		if (parseWechatUser) {
    			logger.debugLog('obtainUserInfo log. Got tgbWechatUser: ' + JSON.stringify(parseWechatUser));
	    		return tgbWechatUser.convertToWechatUserModel(parseWechatUser);
	    	}
	    	return null;
		})
		.then(function(wechatUser) {
			if (wechatUser) {
				logger.debugLog('obtainUserInfo log. usercontroller querying parseUser');
				var parseUserQuery = new Parse.Query(Parse.User);
				parseUserQuery.equalTo('wechatId', wechatUser.wechatId);
				return parseUserQuery.first()
					.then(function(parseUser) {
						if (parseUser) {
							logger.debugLog('obtainUserInfo log. Got parseUser');
							var parseUserName = parseUser.get('username');
							// log in on user's behalf now
							if (parseUserName == 'wechat_' + wechatUser.wechatId) {
								logger.debugLog('obtainUserInfo log. username: ' + parseUserName);
								return Parse.User.logOut()
									.then(function(loggedOutUser) {
										// This is the wechat signed in user. It is OK to reset password
										var passwordBuffer = new Buffer(24);
									  	_.times(24, function(i) {
										    passwordBuffer.set(i, _.random(0, 255));
										});
										var password = passwordBuffer.toString('base64');
										parseUser.set('password', password);
										return parseUser.save()
											.then(function(savedUser) {
												return Parse.User.logIn(parseUserName, password);
											});
									});
							}
							return parseUser;
						}
						else {
							logger.debugLog('obtainUserInfo log. create a new user');
							var newUser = new Parse.User();
						  	var passwordBuffer = new Buffer(24);
						  	_.times(24, function(i) {
							    passwordBuffer.set(i, _.random(0, 255));
							});
							var username = 'wechat_' + wechatUser.wechatId;
							var password = passwordBuffer.toString('base64');
							logger.debugLog('obtainUserInfo log. create a new user username: ' + username + ', password: ' + password);
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
						if (loggedInUser) {
							var loggedInUserModel = userModel.convertToUserModel(loggedInUser);
							logger.debugLog('obtainUserInfo log. send back user model: ' + JSON.stringify(loggedInUserModel));
							logger.debugLog('obtainUserInfo log. usercontroller redirUrl: ' + redirUrl);
							logger.logUsage(authProvider, 'obtainUserInfo', loggedInUserModel.id, redirUrl);
							return res.redirect(redirUrl);
						}
						logger.debugLog('obtainUserInfo log. usercontroller cannot find sessionToken for existing user');
						var errorMessage = 'obtainUserInfo error: usercontroller cannot find sessionToken for existing user';
						logger.logDiagnostics(correlationId, 'error', errorMessage);
						return res.status(500).send(responseError);
					});

			}
			logger.logDiagnostics(correlationId, 'error', 'obtainUserInfo error: Not valid wechat oauth request. Need to ask user to auth again.');
			return res.status(401).send(responseError);
		}, function(error) {
			var errorMessage = 'obtainUserInfo error: ' + JSON.stringify(error);
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			return res.status(500).send(responseError);
		});
};

module.exports.sendEmailVerification = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
	logger.debugLog('sendEmailVerification log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		var errorMessage = 'sendEmailVerification error: user not logged in';
		logger.logDiagnostics(correlationId, 'error', errorMessage);
		return res.status(401).send(responseError);
	}
	
	var email;
	return currentUser.fetch()
		.then(function(parseUser) {
			var user = tgbUser.convertToUserModel(parseUser);
			email = user.email;
			logger.debugLog('sendEmailVerification log. set user emal to empty');
			parseUser.set('email', '');
			return parseUser.save(null, {useMasterKey: true});
		})
		.then(function(savedUser) {
			logger.debugLog('sendEmailVerification log. reset email: ' + email);
			savedUser.set('email', email);
			return savedUser.save(null, {useMasterKey: true});
		})
		.then(function(updatedUser) {
			logger.logUsage(currentUser.id, 'sendEmailVerification', currentUser.id, email);
			return res.status(200).end();
		}, function(error) {
			var errorMessage = 'sendEmailVerification error: ' + JSON.stringify(error);
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			return res.status(500).send(responseError);
		});
};

module.exports.sendContactUsEmail = function (req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
	logger.debugLog('sendContactUsEmail log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		var errorMessage = 'sendEmailVerification error: usrer not logged in';
		logger.logDiagnostics(correlationId, 'error', errorMessage);
		return res.status(401).send(responseError);
	}

	var message = req.body.message;
	if (message) {
		return currentUser.fetch()
			.then(function(parseUser) {
				var user = tgbUser.convertToUserModel(parseUser);
				var senderName = user.nickname? user.nickname : user.username;
				return emailController.sendContactUsEmail(senderName, 
					'Message from user in contactus', message);
			})
			.then(function() {
				logger.logUsage(currentUser.id, 'sendContactUsEmail', '', message);
				return res.status(200).end();
			}, function(error) {
				var errorMessage = 'sendEmailVerification error: ' + JSON.stringify(error);
				logger.logDiagnostics(correlationId, 'error', errorMessage);
				return res.status(500).send(responseError);
			});
	}
	logger.logDiagnostics(correlationId, 'error', 'sendContactUsEmail error: no message provided in request');
	return res.status(400).send(responseError);
};

module.exports.resetPassword = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();

	var email = req.body.email;
	if (!email) {
		var errorMessage = 'resetPassword error: No email provided';
		logger.logDiagnostics(correlationId, 'error', errorMessage);
		return res.status(400).send(responseError);
	}
	return Parse.User.requestPasswordReset(email)
		.then(function() {
			logger.debugLog('resetPassword log. password reset email sent for: ' + email);
			if (currentUser) {
				return Parse.User.logOut()
					.then(function() {
						logger.logUsage(currentUser.id, 'resetPassword', email, '');
						return res.status(200).end();
					});
			}
			logger.logUsage('anonymous', 'resetPassword', email, '');
			return res.status(200).end();
		}, function(error) {
			var errorMessage = 'resetPassword error: ' + JSON.stringify(error);
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			return res.status(500).send(responseError);
		});
};