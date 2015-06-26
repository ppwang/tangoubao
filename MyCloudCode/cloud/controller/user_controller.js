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
    		// TODO return http status code to indicate user has not verified email
    		Parse.User.logOut();
    		return res.status(401).end('User email not verified');
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
    		// TODO return http status code to indicate user has not verified email
    		Parse.User.logOut();
    		throw new Error('Email not verified');			
		}
		if (wechatId && claimtoken) {
        	parseUser.set("wechatId", wechatId);
        	parseUser.set("claimtoken", claimtoken);
        	return parseUser.save();
    	}
	})
	.then(function(currentUser) {
		// Login succeeded, redirect to homepage.
		// parseExpressCookieSession will automatically set cookie.
		return res.status(200).send(convertToUserResponseData(currentUser));
	},
	function(error) {
		console.log('error: ' + JSON.stringify(error));
		if (error.code == Parse.Error.INVALID_SESSION_TOKEN) {
			Parse.User.logOut();
			return res.status(401).end();
		}
		return res.error();
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
    return JSON.stringify(responseData);
}