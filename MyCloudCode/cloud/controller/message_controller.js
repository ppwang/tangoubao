var ParseMessage = Parse.Object.extend('Message');
var messageModel = require('cloud/tuangoubao/message');
var logger = require('cloud/lib/logger');

module.exports.putStatus = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
	logger.debugLog('message putStatus log. currentUser for put message status: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		var errorMessage = 'message putStatus error: user not logged in';
		logger.logDiagnostics(correlationId, 'error', errorMessage);
		return res.status(401).send(responseError);
	}

	var messageId = req.params.messageId;
	if (!messageId) {
		var errorMessage = 'message putStatus error: no messageId provided in request';
		logger.logDiagnostics(correlationId, 'error', errorMessage);
		return res.status(400).send(responseError);
	}

	var status = req.query.status;
	if (!status || (status != 'read' && status != 'unread')) {
		var errorMessage = 'message putStatus error. wrong status. status:  ' + status;
		logger.logDiagnostics(correlationId, 'error', errorMessage);
		return res.status(400).send(responseError);
	}

	logger.debugLog('message putStatus log. put messageId: ' + messageId);
	var parseMessagePromise = new ParseMessage();
	parseMessagePromise.id = messageId;
	return parseMessagePromise.fetch()
		.then(function(parseMessage) {
			var message = messageModel.convertToMessageModel(parseMessage);
			if (message.receiverId != currentUser.id) {
				return 'Not authorized';
			}
			logger.debugLog('message putStatus log. set status: ' + (status == 'read'));
			parseMessage.set('isRead', status=='read');
			return parseMessage.save();
		})
		.then(function(savedParseMessage) {
			if (savedParseMessage == 'Not authorized') {
				logger.logDiagnostics(correlationId, 'error', 'message putStatus error (401): not authorized');
				return res.status(401).send(responseError);
			}
			var message = messageModel.convertToMessageModel(savedParseMessage);
			logger.logUsage(currentUser.id, 'message putStatus', dealId, '');
			return res.status(200).send(message);
		}, function(error) {
			var errorMessage = 'message putStatus error: ' + JSON.stringify(error);
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			return res.status(500).send(responseError);
		});
}