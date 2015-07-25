var WechatUser = Parse.Object.extend('WechatUser');
var ParseOrder = Parse.Object.extend('Order');
var ParseDeal = Parse.Object.extend('Deal');
var wechatAccessToken = require('cloud/wechat/utils/wechat_access_token');
var emailController = require('cloud/controller/email_controller');
var serviceSetting = require('cloud/app.config.js').settings.webservice;
var orderModel = require('cloud/tuangoubao/order');
var messageModel = require('cloud/tuangoubao/message');
var dealModel = require('cloud/tuangoubao/deal');

module.exports.notifyBuyers = function (req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser for notifyBuyers: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		return res.status(401).send();
	}

	var postData = req.body;
	var dealId = postData.dealId;
	console.log('notify buyers for dealId: ' + dealId);
	if (!dealId) {
		// not found
		return res.status(404).end();
	}

	var messageType = postData.messageType;
	var messageText = postData.messageText;
	if (!messageType || (messageType != 'dealClosed' && messageType != 'productArrived')) {
		return res.status(404).send();
	}

	var parseDealPromise = new ParseDeal();
    parseDealPromise.id = dealId;
    return parseDealPromise.fetch()
    	.then(function(parseDeal) {
    		var deal = dealModel.convertToDealModel(parseDeal);
    		console.log('notification fetch deal: ' + JSON.stringify(deal));
    		if (deal.creatorId != currentUser.id) {
    			return res.status(401).send();
    		}

    		var parseOrdersQuery = new Parse.Query(ParseOrder);
			parseOrdersQuery.equalTo('dealId', dealId);
			parseOrdersQuery.notEqualTo('status', 'closed');
			return parseOrdersQuery.find()
				.then(function(parseOrders) {
					var promises = [];
					parseOrders.forEach(function(parseOrder) {
						var order = orderModel.convertToOrderModel(parseOrder);
						promises.push(notifyBuyer(currentUser.id, deal.creatorName, order, messageType, messageText));
					});
					return Parse.Promise.when(promises);
				})
				.then(function() {
					res.status(200).end();
				}, function(error) {
					console.log('notification buyers error: ' + JSON.stringify(error));
					res.status(500).end();
				});
    	});
};

var notifyBuyer = function(creatorId, creatorName, order, messageType, messageText) {
	var receiverId = order.creatorId;
	var parseUserPromise = new Parse.User();
	parseUserPromise.id = receiverId;
	return parseUserPromise.fetch()
		.then(function(parseUser) {
			var messageBody = messageModel.constructMessageBody(order, messageType, messageText);
			var messageTitle = messageModel.constructMessageTitle(order, messageType, messageText);
			
			var promises = [];
			
			// Add to message
			promises.push(messageModel.addMessage(creatorId, receiverId, creatorName, order, messageType, messageText));
			
			console.log('notifyBuyer parseUser: ' + JSON.stringify(parseUser));
			// Send email
			var emailNotify = parseUser.get('emailNotify');
			if (emailNotify) {
				var email = parseUser.get('email');
				console.log('notify email: ' + email);
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
		    console.log('url: '+ url);
		    var postData = getWechatNotificationPostBody(wechatId, order, messageType, messageText);
		    console.log('postData for wechat: ' + JSON.stringify(postData));
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
    var orderUrl = serviceSetting.baseUrl + '/#/orderDetail/' + order.id;
	var postData = null;
	if (messageType == 'productArrived') {
		postData = {
	    	"touser": wechatId,
	    	"template_id": "8USkiY6ugFj2GbUWgfl3nVCcuBx7XT1gFNV02oLGuFg",
	    	"url": orderUrl,
	    	"topcolor":"#FF0000",
	    	"data":{
	    		"first": {
	               "value":"您订的货物已到达",
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
	else if (messageType == 'dealClosed') {
		postData = {
	    	"touser": wechatId,
	    	"template_id": "YtP8hgjKBfiMdSfLhNnzg4Obj4DLsrt2yz50amnpWqg",
	    	"url": orderUrl,
	    	"topcolor":"#FF0000",
	    	"data":{
	    		"first": {
	               "value":"Deal closed",
	               "color":"#173177"
	           },
	           "keyword1":{
	               "value":order.dealName, 
	               "color":"#173177"
	           },
	           "keyword2":{
	               "value":order.createdAt, 
	               "color":"#173177"
	           },
	           "keyword3":{
	               "value":order.id,
	               "color":"#173177"
	           },
	           "keyword4":{
	               "value":"",
	               "color":"#173177"
	           },
	           "keyword5":{
	               "value":order.price,
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