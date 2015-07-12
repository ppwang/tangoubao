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

module.exports.getDeal = function(req, res) {
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
	else {
		var deal = new ParseDeal();
		deal.id = dealId;
		return deal.fetch()
			.then(function(parseDeal) {
				var creator = parseDeal.get('createdBy');
				var deal = dealModel.convertToDealModel(parseDeal);
				deal.owned = true;
				if (creator.id != currentUser.id) {
					console.log('send deal: ' + JSON.stringify(deal));
					deal.owned = false;
					return deal;
				}

				// return buyers list as well
				return orderModel.getOrders(deal, dealId)
					.then(function(orders) {
						deal.orders = orders;
						return deal;
					});
			})
			.then(function(deal) {
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

	var description = req.body.description;
	if (description) {
		parseDeal.set('description', description);
	}

	var beginDate = req.body.beginDate;
	if (beginDate) {
		parseDeal.set('beginDate', new Date(beginDate));
	}

	var endDate = req.body.endDate;
	if (endDate) {
		parseDeal.set('endDate', new Date(endDate));
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
		parseDeal.set('unitPrice', parseFloat(unitPrice));
	}

	var unitsPerPackage = req.body.unitsPerPackage;
	if (unitsPerPackage) {
		parseDeal.set('unitsPerPackage', unitsPerPackage);
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

	var regionId = req.body.regionId;
	if (regionId) {
		parseDeal.set('regionId', regionId);
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
};