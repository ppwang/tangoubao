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
    		return res.redirect('/');
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

	Parse.User.logIn(req.body.username, req.body.password)
	.then(function(parseUser) {
		if (wechatId && claimtoken) {
        	parseUser.set("wechatId", wechatId);
        	parseUser.set("claimtoken", claimtoken);
        	return parseUser.save();
    	}
	})
	.then(function() {
		// Login succeeded, redirect to homepage.
		// parseExpressCookieSession will automatically set cookie.
		return res.redirect('/');
	},
	function(error) {
		console.log('error: ' + JSON.stringify(error));
		if (error.code == Parse.Error.INVALID_SESSION_TOKEN) {
			Parse.User.logOut();
			return res.redirect('/');
		}
		return res.error();
	});	
};

module.exports.logOut = function(req, res) {
	Parse.User.logOut();
	return res.redirect('/');
};