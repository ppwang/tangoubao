var Deal = Parse.Object.extend('Deal');
var utils = require('cloud/lib/utils');

module.exports.putDeal = function(req, res) {
	console.log('put deal request');
	var currentUser = Parse.User.current();
	if (typeof currentUser === 'undefined') {
		// require user to log in
		res.status(401).send();
	}

	var dealId = req.params.dealId;
	if (typeof dealId === 'undefined') {
		// create a new deal
		console.log('create deal');
		createDeal(req, res, currentUser);
	}
	else {
		console.log('modify deal');
		modifyDeal(res, res, currentUser);
	}
};

module.exports.deleteDeal = function(req, res) {

};

module.exports.getDeal = function(req, res) {
	var currentUser = Parse.User.current();
	if (typeof currentUser === 'undefined') {
		// require user to log in
		res.status(401).send();
	}

	var dealId = req.params.dealId;
	if (typeof dealId === 'undefined') {
		// create a new deal
		res.send('no dealId');
	}
	else {
		res.send('dealId is: ' + dealId);
	}
};

module.exports.modifyDeal = function(req, res, user) {
	// TODO: add modif
	res.send('dealId is: ' + dealId);
}

var createDeal = function(req, res, user) {
	var deal = new Deal();

	var dealId = req.body.dealId;
	if (typeof dealId === 'undefined') {
		// this is a new deal
		dealId = utils.getNewGUID();
		deal.set('dealId', dealId);

	}

	var name = req.body.name;
	if (typeof name !== 'undefined') {
		deal.set('name', name);
	}

	var subtitle = req.body.subtitle;
	if (typeof subtitle !== 'undefined') {
		deal.set('subtitle', subtitle);
	}

	var detailedDescription = req.body.detailedDescription;
	if (typeof detailedDescription !== 'undefined') {
		deal.set('detailedDescription', detailedDescription);
	}

	var beginDate = req.body.beginDate;
	if (typeof beginDate !== 'undefined') {
		deal.set('beginDate', beginDate);
	}

	var endDate = req.body.endDate;
	if (typeof endDate !== 'undefined') {
		deal.set('endDate', endDate);
	}

	var email = req.body.email;
	if (typeof email !== 'undefined') {
		deal.set('email', email);
	}

	var phoneNumber = req.body.phoneNumber;
	if (typeof phoneNumber !== 'undefined') {
		deal.set('phoneNumber', phoneNumber);
	}

	var unitName = req.body.unitName;
	if (typeof unitName !== 'undefined') {
		deal.set('unitName', unitName);
	}

	var unitPrice = req.body.unitPrice;
	if (typeof unitPrice !== 'undefined') {
		deal.set('unitPrice', unitPrice);
	}

	var remarks = req.body.remarks;
	if (typeof remarks !== 'undefined') {
		deal.set('remarks', remarks);
	}

	var imageData = req.body.imageBase64;
	var imageType = req.body.imageType;
	if (typeof imageData !== 'undefined' && typeof imageType !== 'undefined') {
		var imgFileName;
		if (imageType == 'image/png') {
			imgFileName = 'deal_image.png';
		}
		else if (imageType == 'image/jpeg') {
			imgFileName = 'deal_image.jpg';
		}
		else {
			console.log('Unsupported image type: ' + imageType);
			res.status(500).end();
			return;
		}
		console.log(imageData);
		var targetImageFile = new Parse.File(imgFileName, {base64: imageData}, imageType);
		// TODO: resize for icon
		targetImageFile.save()
		.then(function(imgFile) {
			deal.set('dealImage', imgFile);
			return deal.save();
		})
		.then( function(deal) {
			console.log('save deal: ' + JSON.stringify(deal));
			res.status(200).send(dealId);
		}, function(error) {
			console.error('picture save to parse error: ' + error);
			res.status(500).end();
		});
	}
	else {
		console.log('save deal: ' + JSON.stringify(deal));
		deal.save()
		.then(function() {
			res.status(200).send(dealId);
		}, function(error) {
			console.error('error: ' + error);
			res.status(500).end();
		});
	}
}