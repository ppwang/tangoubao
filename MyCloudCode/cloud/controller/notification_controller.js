var WechatUser = Parse.Object.extend('WechatUser');
var ParseOrder = Parse.Object.extend('Order');
var ParseDeal = Parse.Object.extend('Deal');
var wechatAccessToken = require('cloud/wechat/utils/wechat_access_token');
var emailController = require('cloud/controller/email_controller');
var serviceSetting = require('cloud/app.config.js').settings.webservice;
var orderModel = require('cloud/tuangoubao/order');
var messageModel = require('cloud/tuangoubao/message');
var dealModel = require('cloud/tuangoubao/deal');
var utils = require('cloud/lib/utils');
var logger = require('cloud/lib/logger');
var wechatSetting = require('cloud/app.config.js').settings.wechat;

module.exports.notifyBuyers = function (req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
	logger.debugLog('notifyBuyers log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		logger.logDiagnostics(correlationId, 'error', 'notifyBuyers error (401): user not logged in');
		return res.status(401).send(responseError);
	}

	var postData = req.body;
	var dealId = postData.dealId;
	logger.debugLog('notifyBuyers log. notify buyers for dealId: ' + dealId);
	if (!dealId) {
		// not found
		logger.logDiagnostics(correlationId, 'error', 'notifyBuyers error (400): dealId not provided in request');
		return res.status(400).send(responseError);
	}

	var messageType = postData.messageType;
	var messageText = postData.messageText;
	if (!messageType || (messageType != 'general' && messageType != 'productArrived')) {
		logger.logDiagnostics(correlationId, 'error', 'notifyBuyers error (400): messageType not correct: ' + messageType);
		return res.status(400).send(responseError);
	}

	var parseDealPromise = new ParseDeal();
    parseDealPromise.id = dealId;
    return parseDealPromise.fetch()
    	.then(function(parseDeal) {
    		var deal = dealModel.convertToDealModel(parseDeal);
    		logger.debugLog('notifyBuyers log. notification fetch deal: ' + JSON.stringify(deal));
    		if (deal.creatorId != currentUser.id) {
    			logger.logDiagnostics(correlationId, 'error', 'notifyBuyers error: deal creatorId not equal to currentUser id');
    			return res.status(401).send(responseError);
    		}

    		var parseOrdersQuery = new Parse.Query(ParseOrder);
			parseOrdersQuery.equalTo('dealId', dealId);
			parseOrdersQuery.notEqualTo('status', 'closed');
			parseOrdersQuery.limit(200); // TODO!!!
			return parseOrdersQuery.find()
				.then(function(parseOrders) {
					var promises = [];
					parseOrders.forEach(function(parseOrder) {
						var order = orderModel.convertToOrderModel(parseOrder);
						promises.push(notifyBuyer(currentUser.id, deal.creatorName, order.creatorId, order, messageType, messageText));
					});
					return Parse.Promise.when(promises);
				})
				.then(function() {
					logger.logUsage(currentUser.id, 'notifyBuyers', dealId, '');
					res.status(200).end();
				}, function(error) {
					var errorMessage = 'notifyBuyers error: ' + JSON.stringify(error);
					logger.logDiagnostics(correlationId, 'error', errorMessage);
					res.status(500).send(responseError);
				});
    	});
};

module.exports.notifyBuyer = function(creatorId, creatorName, receiverId, order, messageType, messageText) {
	return notifyBuyer(creatorId, creatorName, receiverId, order, messageType, messageText);
};

var notifyBuyer = function(creatorId, creatorName, receiverId, order, messageType, messageText) {
	logger.debugLog('notifyBuyer log. receiverId: ' + receiverId);
	var parseUserPromise = new Parse.Query(Parse.User);
	parseUserPromise.equalTo('objectId', receiverId);
	return parseUserPromise.first()
		.then(function(parseUser) {
			if (!parseUser) {
				logger.debugLog('notifyBuyer log. no parseUser');
				return;
			}
			
			var messageBody = messageModel.constructMessageBody(order, messageType, messageText);
			var messageTitle = messageModel.constructMessageTitle(order, messageType, messageText);
			logger.debugLog('notifyBuyer log. receiverId: messageBody: ' + messageBody + ', messageTitle: ' + messageTitle);
			
			var promises = [];
			
			// Add to message
			promises.push(messageModel.addMessage(creatorId, receiverId, creatorName, order, messageType, messageText));
			
			logger.debugLog('notifyBuyer log. notifyBuyer parseUser: ' + JSON.stringify(parseUser));
			// Send email
			var emailNotify = parseUser.get('emailNotify');
			if (emailNotify) {
				var email = parseUser.get('email');
				logger.debugLog('notifyBuyer log. notify email: ' + email);
				if (email) {
					promises.push(emailController.sendEmail(email, creatorName, order, messageType, messageText));
				}
			}
			// Send wechat notification
			var wechatNotify = parseUser.get('wechatNotify');
			var wechatId = parseUser.get('wechatId');
			if (wechatNotify && wechatId) {
				promises.push(sendWechatNotification(wechatId, order, messageType, messageText));
			}
			return Parse.Promise.when(promises);
		});
};

var sendWechatNotification = function(wechatId, order, messageType, messageText) {
	return wechatAccessToken.getAccessToken()
		.then(function(accessToken) {
			var url = 'https://api.weixin.qq.com/cgi-bin/message/template/send?'
		        + 'access_token=' + accessToken.token;
		    logger.debugLog('sendWechatNotification log. url: ' + url);
		    var postData = getWechatNotificationPostBody(wechatId, order, messageType, messageText);
		    logger.debugLog('sendWechatNotification log. url: postData for wechat: ' + JSON.stringify(postData));
		    return Parse.Cloud.httpRequest( { 
		    	method: 'POST', 
		    	url: url, 
		    	headers: {
				    'Content-Type': 'application/json;charset=utf-8'
				  },
		    	body: JSON.stringify(postData) 
		    } );
		});
};

var getWechatNotificationPostBody = function(wechatId, order, messageType, messageText) {
    var orderUrl = order? serviceSetting.baseUrl + '/#/orderDetail/' + order.id : serviceSetting.baseUrl;
	var postData = null;
	if (messageType == 'productArrived') {
		postData = {
	    	"touser": wechatId,
	    	"template_id": wechatSetting.notificationTemplate_productArrived,
	    	"url": orderUrl,
	    	"topcolor":"#FF0000",
	    	"data":{
	    		"first": {
	               "value":"您团购的商品已可领取",
	               "color":"#173177"
	           },
	           "keyword1":{
	               "value":order.quantity, // quantity
	               "color":"#173177"
	           },
	           "keyword2":{
	               "value":order.price, // order price
	               "color":"#173177"
	           },
	           "remark":{
	               "value":messageText,
	               "color":"#173177"
	           }
	    	}
	    };
	}
	else if (messageType == 'general') {
		if (order) {
			logger.debugLog('getWechatNotificationPostBody log. orderTime: ' + order.orderTime);
		}
		else {
			logger.debugLog('getWechatNotificationPostBody log.');	
		}
		var creationDateString = order? utils.formatDateString(order.orderTime): '';
		logger.debugLog('getWechatNotificationPostBody log. creationDateString: ' + creationDateString);
		postData = {
	    	"touser": wechatId,
	    	"template_id": wechatSetting.notificationTemplate_general,
	    	"url": orderUrl,
	    	"topcolor":"#FF0000",
	    	"data":{
	    		"first": {
	               "value":"来自团主的信息",
	               "color":"#173177"
	           },
	           "keyword1":{
	               "value": order? order.dealName : '', 
	               "color":"#173177"
	           },
	           "keyword2":{
	               "value":creationDateString, 
	               "color":"#173177"
	           },
	           "keyword3":{
	               "value": order? order.id : '',
	               "color":"#173177"
	           },
	           "keyword4":{
	               "value":"团主发布信息",
	               "color":"#173177"
	           },
	           "keyword5":{
	               "value": order? order.price : '',
	               "color":"#173177"
	           },
	           "remark":{
	               "value":messageText,
	               "color":"#173177"
	           }
	    	}
	    };
	}

	return postData;        
};