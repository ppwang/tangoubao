var Deal = Parse.Object.extend('Deal');
var utils = require('cloud/lib/utils');

module.exports.putDeal = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		return res.status(401).send();
	}

	var objectId = req.body.id;
	if (!objectId) {
		// create a new deal
		console.log('create deal');
		return createDeal(req, currentUser)
			.then(function(deal) {
				console.log('send deal: ' + JSON.stringify(deal));
				var newDealId = deal.id;
				return res.status(201).end(newDealId);
			}, function(error) {
				console.log('error: ' + JSON.stringify(error));
				return res.status(500).end();
			});
	}

	console.log('modify deal');
	return modifyDeal(objectId, req, currentUser)
		.then(function(deal) {
			console.log('send deal: ' + JSON.stringify(deal));
			return res.status(201).end(deal.id);
		}, function(error) {
			console.log('error: ' + JSON.stringify(error));
			return res.status(500).end();
		});
};

module.exports.deleteDeal = function(req, res) {

};

module.exports.getDeal = function(req, res) {
	var currentUser = Parse.User.current();
	if (!currentUser) {
		// require user to log in
		return res.status(401).send();
	}

	var objectId = req.params.dealId;
	if (!objectId) {
		// create a new deal
		return res.send('no dealId');
	}
	else {
		return res.send('dealId is: ' + objectId);
	}
};

var modifyDeal = function(objectId, req, user) {
	var existingDeal = new Deal();
	existingDeal.id = objectId;
    return existingDeal.fetch()
	    .then( function(deal) {
	    	console.log('Current deal is: ' + JSON.stringify(deal)); 
	    	if (deal) {
	    		return saveDeal(deal, req);
	    	}
	    	throw new Error('Deal not found with dealId: ' + objectId);
	    });
}

var createDeal = function(req, user) {
	var deal = new Deal();
	// Set access permission: public read; current user write
	var acl = new Parse.ACL();
	acl.setPublicReadAccess(true);
	acl.setWriteAccess(user.id, true);
	deal.setACL(acl);

	return saveDeal(deal, req)
}

var saveDeal = function(deal, req) {
	var name = req.body.name;
	if (name) {
		deal.set('name', name);
	}

	var subtitle = req.body.subtitle;
	if (subtitle) {
		deal.set('subtitle', subtitle);
	}

	var detailedDescription = req.body.detailedDescription;
	if (detailedDescription) {
		deal.set('detailedDescription', detailedDescription);
	}

	var beginDate = req.body.beginDate;
	if (beginDate) {
		deal.set('beginDate', beginDate);
	}

	var endDate = req.body.endDate;
	if (endDate) {
		deal.set('endDate', endDate);
	}

	var email = req.body.email;
	if (email) {
		deal.set('email', email);
	}

	var phoneNumber = req.body.phoneNumber;
	if (phoneNumber) {
		deal.set('phoneNumber', phoneNumber);
	}

	var unitName = req.body.unitName;
	if (unitName) {
		deal.set('unitName', unitName);
	}

	var unitPrice = req.body.unitPrice;
	if (unitPrice) {
		deal.set('unitPrice', unitPrice);
	}

	var remarks = req.body.remarks;
	if (remarks) {
		deal.set('remarks', remarks);
	}

	var imageData = req.body.imageBase64;
	var imageType = req.body.imageType;
	if (imageData && imageType) {
		var imgFileName;
		if (imageType == 'image/png') {
			imgFileName = 'deal_image.png';
		}
		else if (imageType == 'image/jpeg') {
			imgFileName = 'deal_image.jpg';
		}
		else {
			console.log('Unsupported image type: ' + imageType);
			throw new Error('Unsupported image type: ' + imageType);
		}
		var targetImageFile = new Parse.File(imgFileName, {base64: imageData}, imageType);
		// TODO: resize for icon
		return targetImageFile.save()
			.then(function(imgFile) {
				deal.set('dealImage', imgFile);
				console.log('deal is: ' + JSON.stringify(deal));
				return deal.save();
			});
	}

	console.log('save deal without image: ' + JSON.stringify(deal));
	return deal.save();
}