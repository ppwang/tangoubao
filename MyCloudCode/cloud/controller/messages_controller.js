var ParseMessage = Parse.Object.extend('Message');
var messageModel = require('cloud/tuangoubao/message');
var logger = require('cloud/lib/logger');

module.exports.getMessages = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();

	logger.debugLog('getMessages log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		logger.logDiagnostics(correlationId, 'error', 'getMessages error (401): user not logged in');
		return res.status(401).send(responseError);
	}

	var query = new Parse.Query(ParseMessage);
	query.equalTo('receiverId', currentUser.id);
	// we are sorting the results by creation date
	query.addDescending('createdAt');

	return query.find()
		.then(function(parseMessages) {
			var messages = [];
			parseMessages.forEach(function(parseMessage) {
				var message = messageModel.convertToMessageModel(parseMessage);
				messages.push(message);
			});
			logger.logUsage(currentUser.id, 'getMessages', '', '');
			return res.status(200).send(messages);
		}, function(error) {
			var errorMessage = 'getMessages error: ' + JSON.stringify(error);
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			return res.status(500).send(responseError);
		});

}