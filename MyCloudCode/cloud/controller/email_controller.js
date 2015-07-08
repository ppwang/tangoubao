var ParseDeal = Parse.Object.extend('Deal');
var dealModel = require('cloud/tuangoubao/deal');
var Buffer = require('buffer').Buffer;

var mandrillSetting = require('cloud/app.config.js').settings.mandrill;
var mandrill = require('mandrill');
mandrill.initialize(mandrillSetting.apiKey);

module.exports.sendEmail = function(emailAddress, sendeeName) {
	return mandrill.sendEmail({
		message: {
			text: "Your order is ready!",
			subject: "Your tuangoubao order is ready!",
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
			return dealModel.getBuyers(dealId)
				.then(function(buyers) {
					deal.buyers = buyers;
					return deal;
				});
		})
		.then(function(deal) {
			var dealData = JSON.stringify(deal);
			var buffer = new Buffer(dealData);
			emailData = buffer.toString('base64');
			console.log('emailData: ' + emailData);
			return currentUser.fetch();
		})
		.then(function(instantiatedUser) {
			var emailAddress = instantiatedUser.get('email');
			var sendeeName = instantiatedUser.get('username');
			console.log('emailData: ' + emailData);
			return mandrill.sendEmail({
				message: {
					text: "Your order is ready!",
					subject: "Your tuangoubao order is ready!",
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
			                "name": "myfile.txt",
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