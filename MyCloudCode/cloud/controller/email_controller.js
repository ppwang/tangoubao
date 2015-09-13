var ParseDeal = Parse.Object.extend('Deal');
var dealModel = require('cloud/tuangoubao/deal');
var orderModel = require('cloud/tuangoubao/order');
var messageModel = require('cloud/tuangoubao/message');
var excelHelper = require('cloud/lib/excel_helper');
var Buffer = require('buffer').Buffer;
var tgbContact = require('cloud/app.config.js').settings.tgbContact;
var logger = require('cloud/lib/logger');

var mandrillSetting = require('cloud/app.config.js').settings.mandrill;
var mandrill = require('mandrill');
mandrill.initialize(mandrillSetting.apiKey);

module.exports.sendEmail = function(emailAddress, sendeeName, order, messageType, messageText) {
	var correlationId = logger.newCorrelationId();
	var responseError = {correlationId: correlationId};

	var messageTitle = messageModel.constructMessageTitle(order, messageType, messageText);
	var messageBody = messageModel.constructHtmlMessageBody(order, messageType, messageText);
	
	logger.debugLog('sendEmail log. messageTitle: ' + messageTitle + ', messageBody: ' + messageBody);
	return mandrill.sendEmail({
		message: {
			html: messageBody,
			subject: messageTitle,
			from_email: "info@wephoon.com",
			from_name: "来自微蜂团购的消息",
			to: [
				{
				  email: emailAddress,
				  name: sendeeName
				}
	      	]
	    },
	    async: true
	  }, {
		success: function() { 
			logger.debugLog('sendEmail log. Email sent.');
		},
		error: function() { 
			var errorMessage = 'sendEmail log. Email sent error.';
			logger.logDiagnostics(correlationId, 'error', errorMessage);
		}
	  });
};

module.exports.sendContactUsEmail = function(senderName, messageTitle, messageBody) {
	var correlationId = logger.newCorrelationId();
	var responseError = {correlationId: correlationId};

	var emailAddress = tgbContact.email;
	var sendeeName = '微蜂团购';
	logger.debugLog('sendContactUsEmail log. messageTitle: ' + messageTitle + ', messageBody: ' + messageBody);
	return mandrill.sendEmail({
		message: {
			html: messageBody,
			subject: messageTitle,
			from_email: "info@wephoon.com",
			from_name: senderName,
			to: [ {
				  email: emailAddress,
				  name: sendeeName
				} ]
	    },
	    async: true
	  }, {
	    success: function() { 
	    	logger.debugLog('sendContactUsEmail log. Email sent.');
	    },
	    error: function() { 
	    	var errorMessage = 'sendEmail log. Email sent error.';
			logger.logDiagnostics(correlationId, 'error', errorMessage);
	    }
	  });
};

module.exports.sendDealReport = function(req, res) {
	var correlationId = logger.newCorrelationId();
	var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
	if (!currentUser) {
		// require user to log in
		logger.logDiagnostics(correlationId, 'error', 'sendDealReport error (401): user not logged in.');
		return res.status(401).send(responseError);
	}

	var dealId = req.params.dealId;
	if (!dealId) {
		// create a new deal
		return res.send('no dealId');
	}
	var emailData;
	var dealName;

	var tmpDeal = new ParseDeal();
	tmpDeal.id = dealId;
	return tmpDeal.fetch()
		.then(function(parseDeal) {
			var creator = parseDeal.get('createdBy');
			var deal = dealModel.convertToDealModel(parseDeal);
			if (creator.id != currentUser.id) {
				logger.debugLog('sendDealReport log. send deal: ' + JSON.stringify(deal));
				return deal;
			}
			// return buyers list as well
			return orderModel.getOrders(deal)
				.then(function(orders) {
					deal.orders = orders;
					return deal;
				});
		})
		.then(function(deal) {
			logger.debugLog('sendDealReport log. deal data: ' + JSON.stringify(deal));
			logger.debugLog('sendDealReport log. deal order data: ' + JSON.stringify(deal.orders));
			dealName = deal.name;
			var excelData = excelHelper.exportDealToExcel(deal);

			var buffer = new Buffer(excelData);
			emailData = buffer.toString('base64');
			return currentUser.fetch();
		})
		.then(function(instantiatedUser) {
			var emailAddress = instantiatedUser.get('email');
			var sendeeName = instantiatedUser.get('username');
			logger.debugLog('sendDealReport log. emailData: ' + emailData);
			// Add 
			return mandrill.sendEmail({
				message: {
					text: "微蜂团购名称: " + dealName,
					subject: "微蜂团购",
					from_email: "info@wephoon.com",
					from_name: "微蜂团购",
					to: [
						{
						  email: emailAddress,
						  name: sendeeName
						}
			      	],
			      	"attachments": [
			            {
			                "type": "text/plain",
			                "name": "deal_summary.tsv",
			                "content": emailData
			            }
			        ],
			    },
			    async: true
			  }, {
			    success: function() { 
			    	logger.debugLog('sendDealReport log. Email sent.');
			    },
			    error: function() { 
			    	var errorMessage = 'sendEmail log. Email sent error.';
					logger.logDiagnostics(correlationId, 'error', errorMessage);
			    }
			  });
		})
		.then(function() {
			res.status(200).end();
		}, function(error) {
			var errorMessage = 'sendDealReport error: ' + JSON.stringify(error);
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			return res.status(500).send(errorMessage);
		});
};