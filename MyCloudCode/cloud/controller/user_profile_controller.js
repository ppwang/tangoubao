
module.exports.getCurrentUserProfile = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		return res.status(401).send();
	}

	return currentUser.fetch()
		.then(function(parseUser) {
			var userProfile = convertToUserProfileModel(parseUser);
			console.log('get userProfile: ' + JSON.stringify(userProfile));
			return res.status(200).send(userProfile);
		}, function(error) {
			console.log('get userProfile error: ' + JSON.stringify(error));
			return res.status(500).end();
		})
}

module.exports.putCurrentUserProfile = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		return res.status(401).send();
	}

	return currentUser.fetch()
		.then(function(parseUser) {
			var nickname = req.body.nickname;
			var email = req.body.email;
			var phoneNumber = req.body.phoneNumber;
			parseUser.set('nickname', nickname);
			parseUser.set('email', email);
			parseUser.set('phoneNumber', phoneNumber);

			var emailNotify = req.body.emailNotify;
			if (emailNotify !== null && emailNotify !== undefined) {
				console.log('emailNotify: ' + emailNotify);
				var notify = emailNotify.toString() === 'true';
				parseUser.set('emailNotify', notify);
			}
			var wechatNotify = req.body.wechatNotify; 
			if (wechatNotify !== null && wechatNotify !== undefined) {
				var notify = wechatNotify.toString() === 'true';
				parseUser.set('wechatNotify', notify);
			}
			parseUser.set('bypassClaim', 'true');
			return parseUser.save();
		})
		.then(function(savedUser) {
			return currentUser.fetch();
		})
		.then(function(updatedUser) {
			var userProfile = convertToUserProfileModel(updatedUser);
			return res.status(200).send(userProfile);
		}, function(error) {
			console.log('get userProfile error: ' + JSON.stringify(error));
			return res.status(500).end();
		});
}

var convertToUserProfileModel = function(parseUser) {
	var userProfile = {};
	userProfile.id = parseUser.id;
	userProfile.nickname = parseUser.get('nickname');
	userProfile.email = parseUser.get('email');
	userProfile.phoneNumber = parseUser.get('phoneNumber');
	userProfile.emailNotify = parseUser.get('emailNotify');
	console.log('emailNotify: ' + userProfile.emailNotify);
	userProfile.wechatNotify = parseUser.get('wechatNotify');
	console.log('wechatNotify: ' + userProfile.wechatNotify);
	return userProfile;
};
