var ParseMessage = Parse.Object.extend('Message');
var messageModel = require('cloud/tuangoubao/message');

module.exports.getMessages = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser for getMessages: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		return res.status(401).send();
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
				console.log(JSON.stringify(message));
				messages.push(message);
			});
			return res.status(200).send(messages);
		}, function(error) {
			console.log('getMessages error: ' + JSON.stringify(error));
			return res.status(500).end();
		});

}