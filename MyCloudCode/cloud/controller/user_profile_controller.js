var logger = require('cloud/lib/logger');

module.exports.getCurrentUserProfile = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
	logger.debugLog('getCurrentUserProfile log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		logger.logDiagnostics(correlationId, 'error', 'getCurrentUserProfile error: usre not logged in');
		return res.status(401).send(responseError);
	}

	return currentUser.fetch()
		.then(function(parseUser) {
			var userProfile = convertToUserProfileModel(parseUser);
			var userProfileData = JSON.stringify(userProfile);
			logger.debugLog('getCurrentUserProfile log. get userProfile: ' + userProfileData);	
			logger.logUsage(currentUser.id, 'getCurrentUserProfile', currentUser.id, userProfileData);
			return res.status(200).send(userProfile);
		}, function(error) {
			var errorMessage = 'getCurrentUserProfile error: ' + JSON.stringify(error);
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			return res.status(500).send(responseError);
		})
}

module.exports.putCurrentUserProfile = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
	logger.debugLog('putCurrentUserProfile log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		var errorMessage = 'putCurrentUserProfile error: user not logged in';
		logger.logDiagnostics(correlationId, 'error', errorMessage);
		return res.status(401).send(responseError);
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
				logger.debugLog('putCurrentUserProfile log. emailNotify: ' + emailNotify);
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
			logger.logUsage(currentUser.id, 'putCurrentUserProfile', currentUser.id, JSON.stringify(userProfile));
			return res.status(200).send(userProfile);
		}, function(error) {
			var errorMessage = 'putCurrentUserProfile error: ' + JSON.stringify(error);
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			return res.status(500).send(responseError);
		});
}

var convertToUserProfileModel = function(parseUser) {
	var userProfile = {};
	userProfile.id = parseUser.id;
	userProfile.nickname = parseUser.get('nickname');
	userProfile.email = parseUser.get('email');
	userProfile.phoneNumber = parseUser.get('phoneNumber');
	userProfile.emailNotify = parseUser.get('emailNotify');
	userProfile.wechatNotify = parseUser.get('wechatNotify');
	return userProfile;
};
