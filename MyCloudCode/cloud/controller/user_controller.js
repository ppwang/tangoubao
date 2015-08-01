var wechatSetting = require('cloud/app.config.js').settings.wechat;
var tgbWechatUser = require('cloud/tuangoubao/wechat_user');
var tgbUser = require('cloud/tuangoubao/user');
var _ = require('underscore');
var Buffer = require('buffer').Buffer;
var ParseMessage = Parse.Object.extend('Message');
var userModel = require('cloud/tuangoubao/user');
var messageModel = require('cloud/tuangoubao/message');
var emailController = require('cloud/controller/email_controller');

module.exports.getCurrentUser = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		return res.status(401).send();
	}
	return convertToUserResponseData(currentUser)
		.then(function(responseData) {
    		return res.status(200).send(responseData);
		}, function(error) {
			console.log('get currentUser error: ' + JSON.stringify(error));
			return res.status(500).end();
		});
}

module.exports.signUp = function(req, res) {
	console.log('signUp');
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
		    		console.log('signUp user: ' + responseData);
    				return res.status(200).send(responseData);
    			});
    	}, function(error) {
			console.log('error: ' + JSON.stringify(error));
			Parse.User.logOut();
			return res.status(500).end();
		});
};

module.exports.logIn = function(req, res) {
	console.log('log in: ' + JSON.stringify(req.body));
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
		console.log('no user');
		return res.status(401).end();
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
            		return res.status(200).send(responseData);
				});
		}
		return res.status(401).end();
	},
	function(error) {
		console.log('error: ' + JSON.stringify(error));
		if (error.code == Parse.Error.INVALID_SESSION_TOKEN) {
			Parse.User.logOut();
			return res.status(401).end();
		}
		return res.status(401).end();
	});	
};

module.exports.logOut = function(req, res) {
	Parse.User.logOut();
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
			console.log('unreadMessageCount: ' + unreadMessageCount);
			var responseData = {};
		    responseData.user = tgbUser.convertToUserModel(instantiatedUser);
		    responseData.user.unreadMessageCount = unreadMessageCount;
		    console.log('convertToUserResponseData: ' + JSON.stringify(responseData));
		    return JSON.stringify(responseData);
		});
}

module.exports.obtainUserInfo = function(req, res) {
	Parse.Cloud.useMasterKey();
	var authProvider = req.params.authProvider;
	
	// We are supporting only wechat for now
	if (authProvider != 'wechat' || !req.query.code) {
		var currentUser = Parse.User.current();
		if (currentUser) {
			return convertToUserResponseData(currentUser)
				.then(function(responseData) {
            		return res.status(200).send(responseData);
				});
		}
		return res.status(401).end();
	}

	var redirUrl = req.query.redir;
	console.log('user controller obtainUserInfo redirUrl: ' + redirUrl);

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
	        console.log('usercontroller got token: ' + httpResponse.text);
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
				console.log('user info request: ' + wechatUesrInfoUrl);
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
    			console.log('Got tgbWechatUser: ' + JSON.stringify(parseWechatUser));
	    		return tgbWechatUser.convertToWechatUserModel(parseWechatUser);
	    	}
	    	return null;
		})
		.then(function(wechatUser) {
			if (wechatUser) {
				console.log('usercontroller querying parseUser');
				var parseUserQuery = new Parse.Query(Parse.User);
				parseUserQuery.equalTo('wechatId', wechatUser.wechatId);
				return parseUserQuery.first()
					.then(function(parseUser) {
						if (parseUser) {
							console.log('Got parseUser');
							var parseUserName = parseUser.get('username');
							// log in on user's behalf now
							if (parseUserName == 'wechat_' + wechatUser.wechatId) {
								console.log('username: ' + parseUserName);
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
							console.log('usercontroller create a new user');
							var newUser = new Parse.User();
						  	var passwordBuffer = new Buffer(24);
						  	_.times(24, function(i) {
							    passwordBuffer.set(i, _.random(0, 255));
							});
							var username = 'wechat_' + wechatUser.wechatId;
							var password = passwordBuffer.toString('base64')
							console.log('usercontroller create new user. username: ' + username + ', password: ' + password);
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
							console.log('send back user model: ' + JSON.stringify(loggedInUserModel));
							console.log('usercontroller redirUrl: ' + redirUrl); 
							return res.redirect(redirUrl);
						}
						console.log('cannot find sessionToken for existing user');
						return res.status(500).end();
					});

			}
			console.log('Not valid wechat oauth request. Need to ask user to auth again.');
			return res.status(401).end();
		}, function(error) {
			console.log('error: ' + JSON.stringify(error));
			return res.status(500).end();
		});
};

module.exports.sendEmailVerification = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		return res.status(401).send();
	}
	
	var email;
	return currentUser.fetch()
		.then(function(parseUser) {
			var user = tgbUser.convertToUserModel(parseUser);
			email = user.email;
			console.log('set user email to empty');
			parseUser.set('email', '');
			return parseUser.save(null, {useMasterKey: true});
		})
		.then(function(savedUser) {
			console.log('reset email: ' + email);
			savedUser.set('email', email);
			return savedUser.save(null, {useMasterKey: true});
		})
		.then(function(updatedUser) {
			return res.status(200).end();
		}, function(error) {
			console.log('sendEmailVerification error: ' + JSON.stringify(error));
			return res.status(500).end();
		});
};

module.exports.sendContactUsEmail = function (req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		return res.status(401).send();
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
				console.log('sendContactUsEmail succeeded');
				return res.status(200).end();
			}, function(error) {
				console.log('sendContactUsEmail error: ' + JSON.stringify(error));
				return res.status(500).end();
			});
	}
	return res.status(404).end();
};

module.exports.resetPassword = function(req, res) {
	var currentUser = Parse.User.current();
	
	var email = req.body.email;
	if (!email) {
		console.log('No email provided');
		return res.status(404).end();
	}
	return Parse.User.requestPasswordReset(email)
		.then(function() {
			console.log('password reset email sent for: ' + email);
			if (currentUser) {
				return Parse.User.logOut()
					.then(function() {
						return res.status(200).end();
					});
			}
			return res.status(200).end();
		}, function(error) {
			console.log('password reset email sent failure: ' + JSON.stringify(error));
			return res.status(500).end();
		});
};