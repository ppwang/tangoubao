var wechatSetting = require('cloud/app.config.js').settings.wechat;
var tgbWechatUser = require('cloud/tuangoubao/wechat_user');
var tgbUser = require('cloud/tuangoubao/user');

module.exports.signUp = function(req, res) {
	var parseUser = new Parse.User();
	var username = req.body.username;
	var password = req.body.password;
	var email = req.body.email;
	var wechatId = req.body.wechatId;
	var claimtoken = req.body.claimtoken;

    parseUser.set("username", username);
    parseUser.set("password", password);
    parseUser.set("email", email);
    
    if (wechatId && claimtoken) {
    	parseUser.set('action', 'signUp');
        parseUser.set("wechatId", wechatId);
        parseUser.set("claimtoken", claimtoken);
    }
    return parseUser.signUp()
    	.then(function() {
    		Parse.User.logOut();
    		// Send message 'Email not verified!' to indicate user has not verified email
    		return res.status(401).end('Email not verified!');
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
		return res.status(401).end();
	}

	Parse.User.logIn(req.body.username, req.body.password)
	.then(function(parseUser) {
		var emailVerified = parseUser.get('emailVerified');
		console.log('emailVerified:  ' + emailVerified);
		if (!emailVerified) {
    		Parse.User.logOut();
    		return 'Email not verified';			
		}
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
		console.log('currentUser: ' + JSON.stringify(currentUser));
		if (currentUser == 'Email not verified') {
			return res.status(401.2).end('Email not verified!');
		}
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
	return parseUser.fetch()
		.then(function(instantiatedUser) {
			var responseData = {};
		    responseData.user = tgbUser.convertToUserModel(instantiatedUser);
		    console.log('convertToUserResponseData: ' + JSON.stringify(responseData));
		    return JSON.stringify(responseData);
		});
}

module.exports.getUserInfo = function(req, res) {
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
	    		return tgbWechatUser.convertToWechatUserModel(parseWechatUser);
	    	}
	    	return null;
		})
		.then(function(wechatUser) {
			if (wechatUser) {
				return res.status(200).send(wechatUser);
			}
			console.log('Not valid wechat oauth request. Need to ask user to auth again.');
			return res.status(401).end();
		}, function(error) {
			console.log('error: ' + JSON.stringify(error));
			return res.status(500).end();
		});
};