var ParseMessage = Parse.Object.extend('Message');
var messageModel = require('cloud/tuangoubao/message');

module.exports.putStatus = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser for put message status: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		return res.status(401).send();
	}

	var messageId = req.params.messageId;
	if (!messageId) {
		return res.status(404).send();
	}

	var status = req.query.status;
	if (!status || (status != 'read' && status != 'unread')) {
		return res.status(404).send();
	}

	console.log('put messageId: ' + messageId);
	var parseMessagePromise = new ParseMessage();
	parseMessagePromise.id = messageId;
	return parseMessagePromise.fetch()
		.then(function(parseMessage) {
			var message = messageModel.convertToMessageModel(parseMessage);
			if (message.receiverId != currentUser.id) {
				return 'Not authorized';
			}
			console.log('set status: ' + (status == 'read'));
			parseMessage.set('isRead', status=='read');
			return parseMessage.save();
		})
		.then(function(savedParseMessage) {
			if (savedParseMessage == 'Not authorized') {
				return res.status(401).end();
			}
			var message = messageModel.convertToMessageModel(savedParseMessage);
			return res.status(200).send(message);
		}, function(error) {
			console.log('error: ' + JSON.stringify(error));
			return res.status(500).end();
		});
}