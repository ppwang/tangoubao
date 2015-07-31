var serviceSetting = require('cloud/app.config.js').settings.webservice;
var ParseMessage = Parse.Object.extend('Message');

module.exports.convertToMessageModel = function(parseMessage) {
	var message = {};
	message.id = parseMessage.id;
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

module.exports.addWelcomeMessage = function(signedUpUser) {
	var parseMessage = new ParseMessage();
	parseMessage.set('creatorId', 'parse_admin');
	parseMessage.set('receiverId', signedUpUser.id);
	parseMessage.set('creatorName', 'Your friend at Tuan Gou Bao');
	parseMessage.set('messageType', 'sendEmailVerification');
	parseMessage.set('messageTitle', '');
	parseMessage.set('messageBody', '');
	parseMessage.set('isRead', false);
	return parseMessage.save();
};

module.exports.constructMessageTitle = function(order, messageType, messageText) {
	return constructMessageTitle(order, messageType, messageText);
};

module.exports.constructMessageBody = function(order, messageType, messageText) {
	return constructMessageBody(order, messageType, messageText);
};

module.exports.constructHtmlMessageBody = function(order, messageType, messageText) {
	var orderUrl = serviceSetting.baseUrl + '/#/orderDetail/' + order.id;
	var messageBody = messageText? 'Message from seller:\n' + messageText : '';
	if (messageType == 'productArrived') {
		return 'Your order for ' 
			+ '<a href="' + orderUrl + '">'
			+      order.dealName 
			+ '</a>'
			+ ' is ready to pick up.\n'
			+ messageBody;
	}
	if (messageType == 'general') {
		return 'We have a new message for the deal you ordered, ' 
			+ '<a href="' + orderUrl + '">'
			+      order.dealName 
			+ '</a>\n';
			+ messageBody;
	}
	return null; 
};

var constructMessageBody = function(order, messageType, messageText) {
	// TBD: add message similar to what we show on UI for order
	var messageBody = messageText? 'Message from seller:\n' + messageText : '';
	if (messageType == 'productArrived') {
		return messageBody;
	}
	if (messageType == 'general') {
		return messageBody;
	}
	return null; 

};

var constructMessageTitle = function(order, messageType, messageText) {
	if (messageType == 'productArrived') {
		return 'Your order for ' + order.dealName + ' is ready to pick up';
	}
	if (messageType == 'general') {
		return 'We have a new message for the deal you ordered, ' + order.dealName + '.';
	}
	return null;
};