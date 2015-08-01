var ParseDeal = Parse.Object.extend('Deal');
var ParseOrder= Parse.Object.extend('Order');
var ParseFollowDeal = Parse.Object.extend('FollowDeal');

var utils = require('cloud/lib/utils');
var dealModel = require('cloud/tuangoubao/deal');
var orderModel = require('cloud/tuangoubao/order');

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

module.exports.putStatus = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		return res.status(401).send();
	}

	var dealId = req.params.dealId;
	if (!dealId) {
		return res.status(404).send();
	}

	var status = req.query.status;
	if (!status || (status != 'closed' && status != 'active')) {
		return res.status(404).send();
	}

	var parseDealPromise = new ParseDeal();
	parseDealPromise.id = dealId;
	return parseDealPromise.fetch()
		.then(function(parseDeal) {
			var deal = dealModel.convertToDealModel(parseDeal);
			if (deal.creatorId != currentUser.id) {
				return 'Not authorized';
			}
			parseDeal.set('status', status);
			return parseDeal.save();
		})
		.then(function(savedPareseDeal) {
			if (savedPareseDeal == 'Not authorized') {
				return res.status(401).end();
			}
			var deal = dealModel.convertToDealModel(savedPareseDeal);
			return res.status(200).send(deal);
		}, function(error) {
			console.log('error: ' + JSON.stringify(error));
			return res.status(500).end();
		});
};

module.exports.getDeal = function(req, res) {
	var currentUser = Parse.User.current();

	var dealId = req.params.dealId;
	if (!dealId) {
		// create a new deal
		return res.send('no dealId');
	}
	else {
		var parseDealPromise = new ParseDeal();
		parseDealPromise.id = dealId;
		return parseDealPromise.fetch()
			.then(function(parseDeal) {
				var creator = parseDeal.get('createdBy');
				var deal = dealModel.convertToDealModel(parseDeal);
				deal.owned = true;
				if (!currentUser || creator.id != currentUser.id) {
					console.log('send deal: ' + JSON.stringify(deal));
					deal.owned = false;
					return deal;
				}

				// return buyers list as well
				return orderModel.getOrdersByPickupOption(deal)
					.then(function(ordersByPickupOption) {
						console.log('ordersByPickupOption: ' + JSON.stringify(ordersByPickupOption));
						deal.summary = ordersByPickupOption.summary;
						deal.pickupOptions = ordersByPickupOption.pickupOptions;
						return deal;
					});
			})
			.then(function(deal) {
				if (!currentUser) {
					return deal;
				}

				// Adding followed information below.
				var query = new Parse.Query(ParseFollowDeal);
				console.log('query follow dealId:' + dealId + ' by userId: ' + currentUser.id);
			    query.equalTo('dealId', dealId);
			    query.equalTo('followerId', currentUser.id);
			    return query.first()
			    	.then(function(parseFollowDeal) {
			    		deal.followed = parseFollowDeal? true : false;
			    		return deal;
			    	});
			})
			.then(function(deal) {
				if (!currentUser) {
					return deal;
				}
				
				// Adding ordered information below.
				var query = new Parse.Query(ParseOrder);
				console.log('query order dealId:' + dealId + ' by userId: ' + currentUser.id);
			    query.equalTo('dealId', dealId);
			    query.equalTo('creatorId', currentUser.id);
			    return query.first()
			    	.then(function(parseOrder) {
			    		deal.ordered = false; 
			    		if (parseOrder) {
			    			var quantity = parseOrder.get('quantity');
			    			if (quantity > 0) {
			    				deal.ordered = true;
			    			}
			    		}
			    		return deal;
			    	});
			})
			.then(function(deal) {
				return res.status(201).send(deal);
			}, function(error) {
				console.log('error: ' + JSON.stringify(error));
				return res.status(500).end();
			});
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
};

var createDeal = function(req, user) {
	var parseDeal = new ParseDeal();
	// Set access permission: public read; current user write
	var acl = new Parse.ACL();
	acl.setPublicReadAccess(true);
	acl.setWriteAccess(user.id, true);
	parseDeal.setACL(acl);

	parseDeal.set('createdBy', user);

	return user.fetch()
		.then(function(instantiatedUser) { 
			var creatorName = instantiatedUser.get('nickname');
			if (creatorName) {
				parseDeal.set('creatorName', creatorName);
			}
		})
		.then(function() { 
			return saveDeal(parseDeal, req);
		});
};

var saveDeal = function(parseDeal, req) {
	var name = req.body.name;
	if (name) {
		parseDeal.set('name', name);
	}
	else {
		parseDeal.set('name', null);
	}

	var description = req.body.description;
	if (description) {
		parseDeal.set('description', description);
	}
	else {
		parseDeal.set('description', null);
	}

	var beginDate = req.body.beginDate;
	if (beginDate) {
		parseDeal.set('beginDate', new Date(beginDate));
	}
	else {
		parseDeal.set('beginDate', null);
	}

	var endDate = req.body.endDate;
	if (endDate) {
		parseDeal.set('endDate', new Date(endDate));
	}
	else {
		parseDeal.set('endDate', null);
	}

	var email = req.body.email;
	if (email) {
		parseDeal.set('email', email);
	}
	else {
		parseDeal.set('email', null);
	}

	var phoneNumber = req.body.phoneNumber;
	if (phoneNumber) {
		parseDeal.set('phoneNumber', phoneNumber);
	}
	else {
		parseDeal.set('phoneNumber', null);
	}

	var unitName = req.body.unitName;
	if (unitName) {
		parseDeal.set('unitName', unitName);
	}
	else {
		parseDeal.set('unitName', null);
	}

	var unitPrice = req.body.unitPrice;
	if (unitPrice) {
		parseDeal.set('unitPrice', parseFloat(unitPrice));
	}
	else {
		parseDeal.set('unitPrice', null);
	}

	var unitsPerPackage = req.body.unitsPerPackage;
	if (unitsPerPackage) {
		parseDeal.set('unitsPerPackage', unitsPerPackage);
	}
	else {
		parseDeal.set('unitsPerPackage', null);
	}

	var remarks = req.body.remarks;
	if (remarks) {
		parseDeal.set('remarks', remarks);
	}
	else {
		parseDeal.set('remarks', null);
	}

	// Pickup options are generated from frontend client and will have id's already setup
	// every time, we will just rewrite. 
	var pickupOptions = req.body.pickupOptions;
	if (pickupOptions) {
		parseDeal.set('pickupOptions', JSON.stringify(pickupOptions));
	}
	else {
		parseDeal.set('pickupOptions', null);
	}

	var regionId = req.body.regionId;
	if (regionId) {
		parseDeal.set('regionId', regionId);
	}
	else {
		parseDeal.set('regionId', null);
	}

	parseDeal.set('status', 'active');
	parseDeal.set('featured', false);

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
	if (imageType && !imageData) {
		console.log('save deal without image: ' + JSON.stringify(parseDeal));
		parseDeal.set('dealImage', null);
	}
	return parseDeal.save();
};