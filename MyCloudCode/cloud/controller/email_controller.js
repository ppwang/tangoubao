var ParseDeal = Parse.Object.extend('Deal');
var dealModel = require('cloud/tuangoubao/deal');
var orderModel = require('cloud/tuangoubao/order');
var messageModel = require('cloud/tuangoubao/message');
var excelHelper = require('cloud/lib/excel_helper');
var Buffer = require('buffer').Buffer;

var mandrillSetting = require('cloud/app.config.js').settings.mandrill;
var mandrill = require('mandrill');
mandrill.initialize(mandrillSetting.apiKey);

module.exports.sendEmail = function(emailAddress, sendeeName, order, messageType, messageText) {
	var messageTitle = messageModel.constructMessageTitle(order, messageType, messageText);
	var messageBody = messageModel.constructHtmlMessageBody(order, messageType, messageText);
	
	console.log('messageTitle: ' + messageTitle);
	console.log('messageBody: ' + messageBody);
	return mandrill.sendEmail({
		message: {
			html: messageBody,
			subject: messageTitle,
			from_email: "info@tuangoubao.parseapps.com",
			from_name: "Your friend at Tuan Gou Bao",
			to: [
				{
				  email: emailAddress,
				  name: sendeeName
				}
	      	]
	    },
	    async: true
	  }, {
	    success: function() { console.log("Email sent!"); },
	    error: function() { console.log("Uh oh, something went wrong"); }
	  });
};

module.exports.sendDealReport = function(req, res) {
	var currentUser = Parse.User.current();
	if (!currentUser) {
		// require user to log in
		return res.status(401).send();
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
				console.log('send deal: ' + JSON.stringify(deal));
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
			console.log('deal data: ' + JSON.stringify(deal));
			console.log('deal order data: ' + JSON.stringify(deal.orders));
			dealName = deal.name;
			var excelData = excelHelper.exportDealToExcel(deal);

			var buffer = new Buffer(excelData);
			emailData = buffer.toString('base64');
			console.log('emailData: ' + emailData);
			return currentUser.fetch();
		})
		.then(function(instantiatedUser) {
			var emailAddress = instantiatedUser.get('email');
			var sendeeName = instantiatedUser.get('username');
			console.log('emailData: ' + emailData);
			// Add 
			return mandrill.sendEmail({
				message: {
					text: "Deal summary for " + dealName,
					subject: "Your tuangoubao deal summary file is attached",
					from_email: "info@tuangoubao.parseapps.com",
					from_name: "Your friend at Tuan Gou Bao",
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
			    success: function() { console.log("Email sent!"); },
			    error: function() { console.log("Uh oh, something went wrong"); }
			  });
		})
		.then(function() {
			res.status(200).end();
		}, function(error) {
			console.log('error: ' + JSON.stringify(error));
			return res.status(500).end();
		});
};