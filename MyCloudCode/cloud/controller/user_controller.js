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
        parseUser.set("wechatId", wechatId);
        parseUser.set("claimtoken", claimtoken);
    }
    return parseUser.signUp()
    	.then(function() {
    		Parse.User.logOut();
    		// Send 401.2 to indicate user has not verified email
    		return res.status(401.2).end();
    	}, function(error) {
			console.log('error: ' + JSON.stringify(error));
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
            return res.status(200).send(convertToUserResponseData(currentUser));
		}
		return res.status(401).end();
	}

	Parse.User.logIn(req.body.username, req.body.password)
	.then(function(parseUser) {
		var emailVerified = parseUser.get('emailVerified');
		console.log('emailVerified:  ' + emailVerified);
		if (!emailVerified) {
    		// Send 401.2 to indicate user has not verified email
    		Parse.User.logOut();
    		return 'Email not verified';			
		}
		if (wechatId && claimtoken) {
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
			return res.status(401.2).end();
		}
		return res.status(200).send(convertToUserResponseData(currentUser));
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
    var responseData = {};
    responseData.user = {};
    responseData.user.id = parseUser.id;
    responseData.user.username = parseUser.get('username');
    responseData.user.email = parseUser.get('email');
    responseData.user.phone = parseUser.get('phone');
    responseData.user.headimgurl = parseUser.get('headimgurl');
    return JSON.stringify(responseData);
}