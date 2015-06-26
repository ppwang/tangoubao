var ParseDeal = Parse.Object.extend('Deal');
var utils = require('cloud/lib/utils');
var dealModel = require('cloud/tuangoubao/deal');

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
			.then(function(parseDeal) {
				var deal = dealModel.convertToDealModel(parseDeal);
				console.log('send deal: ' + JSON.stringify(deal));
				// Cannot use end to send data!! Must use send for json.
				return res.status(201).send(deal);
			}, function(error) {
				console.log('error: ' + JSON.stringify(error));
				return res.status(500).end();
			});
	}

	console.log('modify deal');
	return modifyDeal(objectId, req, currentUser)
		.then(function(parseDeal) {
			var deal = dealModel.convertToDealModel(parseDeal);
			console.log('send deal: ' + JSON.stringify(deal));
			// Cannot use end to send data!! Must use send for json.
			return res.status(201).send(deal);
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
	var existingParseDeal = new ParseDeal();
	existingParseDeal.id = objectId;
    return existingParseDeal.fetch()
	    .then( function(parseDeal) {
	    	console.log('Current deal is: ' + JSON.stringify(parseDeal)); 
	    	if (parseDeal) {
	    		return saveDeal(parseDeal, req);
	    	}
	    	throw new Error('ParseDeal not found with dealId: ' + objectId);
	    });
}

var createDeal = function(req, user) {
	var parseDeal = new ParseDeal();
	// Set access permission: public read; current user write
	var acl = new Parse.ACL();
	acl.setPublicReadAccess(true);
	acl.setWriteAccess(user.id, true);
	parseDeal.setACL(acl);

	parseDeal.set('createdBy', user);

	return saveDeal(parseDeal, req)
}

var saveDeal = function(parseDeal, req) {
	var name = req.body.name;
	if (name) {
		parseDeal.set('name', name);
	}

	var subtitle = req.body.subtitle;
	if (subtitle) {
		parseDeal.set('subtitle', subtitle);
	}

	var detailedDescription = req.body.detailedDescription;
	if (detailedDescription) {
		parseDeal.set('detailedDescription', detailedDescription);
	}

	var beginDate = req.body.beginDate;
	if (beginDate) {
		parseDeal.set('beginDate', beginDate);
	}

	var endDate = req.body.endDate;
	if (endDate) {
		parseDeal.set('endDate', endDate);
	}

	var email = req.body.email;
	if (email) {
		parseDeal.set('email', email);
	}

	var phoneNumber = req.body.phoneNumber;
	if (phoneNumber) {
		parseDeal.set('phoneNumber', phoneNumber);
	}

	var unitName = req.body.unitName;
	if (unitName) {
		parseDeal.set('unitName', unitName);
	}

	var unitPrice = req.body.unitPrice;
	if (unitPrice) {
		parseDeal.set('unitPrice', unitPrice);
	}

	var remarks = req.body.remarks;
	if (remarks) {
		parseDeal.set('remarks', remarks);
	}

	// Pickup options are generated from frontend client and will have id's already setup
	// every time, we will just rewrite. 
	var pickupOptions = req.body.pickupOptions;
	if (pickupOptions) {
		parseDeal.set('pickupOptions', JSON.stringify(pickupOptions));
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
				parseDeal.set('dealImage', imgFile);
				console.log('deal is: ' + JSON.stringify(parseDeal));
				return parseDeal.save();
			});
	}

	console.log('save deal without image: ' + JSON.stringify(parseDeal));
	return parseDeal.save();
}