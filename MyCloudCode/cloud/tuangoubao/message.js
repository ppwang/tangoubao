var ParseMessage = Parse.Object.extend('Message');

module.exports.convertToMessageModel = function(parseMessage) {
	var message = {};
	message.creatorId = parseMessage.get('creatorId');
	message.receiverId = parseMessage.get('receiverId');
	message.creatorName = parseMessage.get('creatorName');
	message.messageType = parseMessage.get('messageType');
	message.messageTitle = parseMessage.get('messageTitle');
	message.messageBody = parseMessage.get('messageBody');
	message.createdAt = parseMessage.createdAt;
	message.isRead = parseMessage.get('isRead');
	return message;
};

module.exports.addMessage = function(creatorId, receiverId, creatorName, order, messageType, messageText) {
	var parseMessage = new ParseMessage();
	parseMessage.set('creatorId', creatorId);
	parseMessage.set('receiverId', receiverId);
	parseMessage.set('creatorName', creatorName);
	parseMessage.set('messageType', messageType);
	var messageTitle = constructMessageTitle(order, messageType, messageText);
	parseMessage.set('messageTitle', messageTitle);
	var messageBody = constructMessageBody(order, messageType, messageText);
	parseMessage.set('messageBody', messageBody);
	parseMessage.set('isRead', false);
	return parseMessage.save();
};

module.exports.constructMessageTitle = function(order, messageType, messageText) {
	return constructMessageTitle(order, messageType, messageText);
};

module.exports.constructMessageBody = function(order, messageType, messageText) {
	return constructMessageBody(order, messageType, messageText);
};

var constructMessageBody = function(order, messageType, messageText) {
	// TBD: add message similar to what we show on UI for order
	if (messageType == 'productArrived') {
		return 'Your order for ' + order.dealName + ' is ready to pick up.\n'
			+ 'Message from seller:\n' 
			+ messageText;
	}
	if (messageType == 'dealClosed') {
		return 'The deal you ordered, ' + order.dealName + ', is closed.\n';
			+ 'Message from seller:\n'
			+ messageText;
	}
	return null; 

};

var constructMessageTitle = function(order, messageType, messageText) {
	if (messageType == 'productArrived') {
		return 'Your order for ' + order.dealName + ' is ready to pick up';
	}
	if (messageType == 'dealClosed') {
		return 'The deal you ordered, ' + order.dealName + ', is closed';
	}
	return null;
};