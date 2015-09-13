var ParseDeal = Parse.Object.extend('Deal');
var ParseOrder= Parse.Object.extend('Order');
var ParseFollowDeal = Parse.Object.extend('FollowDeal');
var ParseDealImage = Parse.Object.extend('DealImage');

var utils = require('cloud/lib/utils');
var dealModel = require('cloud/tuangoubao/deal');
var orderModel = require('cloud/tuangoubao/order');
var logger = require('cloud/lib/logger');

module.exports.putDeal = function(req, res) {
	var correlationId = logger.newCorrelationId();
	var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
	logger.debugLog('putDeal log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		logger.logDiagnostics(correlationId, 'error', 'putDeal error (401): user not logged in.');
		return res.status(401).send(responseError);
	}

	var objectId = req.body.id;
	if (!objectId) {
		// create a new deal
		logger.debugLog('putDeal log. create deal.');
		return createDeal(req, currentUser)
			.then(function(parseDeal) {
				logger.debugLog('putDeal log. createDeal is done.');
				var deal = dealModel.convertToDealModel(parseDeal);
				var dealData = JSON.stringify(deal);
				logger.debugLog('putDeal log. send deal: ' + dealData);
				logger.logUsage(currentUser.id, 'createDeal', deal.id, dealData);
				// Cannot use end to send data!! Must use send for json.
				return res.status(201).send(deal);
			}, function(error) {
				var errorMessage = 'putDeal error: ' + JSON.stringify(error);
				logger.logDiagnostics(correlationId, 'error', errorMessage);
				return res.status(500).send(responseError);
			});
	}

	logger.debugLog('putDeal log. modify deal.');
	return modifyDeal(objectId, req, currentUser)
		.then(function(parseDeal) {
			var deal = dealModel.convertToDealModel(parseDeal);
			var dealData = JSON.stringify(deal);
			logger.debugLog('putDeal log. send deal: ' + dealData);
			logger.logUsage(currentUser.id, 'modifyDeal', deal.id, dealData);
			// Cannot use end to send data!! Must use send for json.
			return res.status(201).send(deal);
		}, function(error) {
			var errorMessage = 'putDeal error: ' + JSON.stringify(error);
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			return res.status(500).send(responseError);
		});
};

module.exports.putStatus = function(req, res) {
	var correlationId = logger.newCorrelationId();
	var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
	logger.debugLog('deal putStatus log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		logger.logDiagnostics(correlationId, 'error', 'deal putStatus error (401): user not logged in');
		return res.status(401).send(responseError);
	}

	var dealId = req.params.dealId;
	if (!dealId) {
		logger.logDiagnostics(correlationId, 'error', 
			'deal putStatus error (400): dealId not provided in request');
		return res.status(400).send(responseError);
	}

	var status = req.query.status;
	if (!status || (status != 'closed' && status != 'active')) {
		logger.logDiagnostics(correlationId, 'error', 'deal putStatus error (400): status not correct: ' + status);
		return res.status(400).send(responseError);
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
				logger.logDiagnostics(correlationId, 'error', 
					'deal putStatus error (401): user not authorized, userId is not deal creatorId.');
				return res.status(401).send(responseError);
			}
			var deal = dealModel.convertToDealModel(savedPareseDeal);
			var data = {status: status};
			logger.logUsage(currentUser.id, 'deal putStatus', dealId, JSON.stringify(data));
			return res.status(200).send(deal);
		}, function(error) {
			var errorMessage = 'deal putStatus error: ' + JSON.stringify(error);
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			return res.status(500).send(responseError);
		});
};

module.exports.getDeal = function(req, res) {
	var correlationId = logger.newCorrelationId();
	var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();

	var dealId = req.params.dealId;
	if (!dealId) {
		// create a new deal
		logger.logDiagnostics(correlationId, 'error', 'getDeal error (400): dealId not provided in request.');
		return res.status(400).send(responseError);
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
					logger.debugLog('getDeal log: ' + JSON.stringify(deal));
					deal.owned = false;
					return deal;
				}

				// return buyers list as well
				return orderModel.getOrdersByPickupOption(deal)
					.then(function(ordersByPickupOption) {
						logger.debugLog('getDeal log. ordersByPickupOption: ' + JSON.stringify(ordersByPickupOption));
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
				logger.debugLog('getDeal log. query follow dealId:' + dealId + ' by userId: ' + currentUser.id);
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
				logger.debugLog('getDeal log. query order dealId:' + dealId + ' by userId: ' + currentUser.id);
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
				var userId = currentUser? currentUser.id : 'anonymous'; 
				logger.logUsage(userId, 'getDeal', deal.id, JSON.stringify(deal));
				return res.status(200).send(deal);
			}, function(error) {
				var errorMessage = 'getDeal error: ' + JSON.stringify(error);
				logger.logDiagnostics(correlationId, 'error', errorMessage);
				return res.status(500).send(responseError);
			});
	}
};

var modifyDeal = function(objectId, req, user) {
	var existingParseDeal = new ParseDeal();
	existingParseDeal.id = objectId;
    return existingParseDeal.fetch()
	    .then( function(parseDeal) {
	    	logger.debugLog('modifyDeal log. Current deal is: ' + JSON.stringify(parseDeal));
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

	var originalUnitPrice = req.body.originalUnitPrice;
	if (originalUnitPrice && originalUnitPrice > 0) {
		parseDeal.set('originalUnitPrice', originalUnitPrice);
	}
	else {
		parseDeal.set('originalUnitPrice', null);
	}

	var quantityLimit = req.body.quantityLimit;
	if (quantityLimit && quantityLimit > 0) {
		parseDeal.set('quantityLimit', quantityLimit);
	}
	else {
		parseDeal.set('quantityLimit', null);
	}

	var totalQuantityLimit = req.body.totalQuantityLimit;
	if (totalQuantityLimit && totalQuantityLimit > 0) {
		parseDeal.set('totalQuantityLimit', totalQuantityLimit);
	}
	else {
		parseDeal.set('totalQuantityLimit', null);
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

	// Do not reser featured field
	//parseDeal.set('featured', false);

	var bannerData = req.body.bannerImageBase64;
	var bannerType = req.body.bannerImageType;
	if (bannerData && bannerType) {
		var imgFileName;
		if (bannerType == 'image/png') {
			imgFileName = 'deal_image.png';
		}
		else if (bannerType == 'image/jpeg') {
			imgFileName = 'deal_image.jpg';
		}
		else {
			logger.debugLog('saveDeal log. Unsupported image type: ' + bannerType);
			throw new Error('Unsupported image type: ' + bannerType);
		}
		var targetImageFile = new Parse.File(imgFileName, {base64: bannerData}, bannerType);
		// TODO: resize for icon
		return targetImageFile.save()
			.then(function(imgFile) {
				parseDeal.set('dealBanner', imgFile);
				logger.debugLog('saveDeal log. deal is: ' + JSON.stringify(parseDeal));
				return parseDeal.save();
			})
			.then(function(savedDeal) {
				var dealImages = req.body.dealImages;
				logger.debugLog('saveDeal log. dealImages count: ' + dealImages.length);
				if (dealImages && dealImages.length > 0) {
					return setDealImages(dealImages, savedDeal);
				}
				return savedDeal;
			});
	}
	else {
		var dealImages = req.body.dealImages;
		logger.debugLog('saveDeal log. dealImages count: ' + dealImages.length);
		if (dealImages && dealImages.length > 0) {
			return setDealImages(dealImages, parseDeal);
		}
	}

	if (bannerType && !bannerData) {
		logger.debugLog('saveDeal log. save deal without image: ' + JSON.stringify(parseDeal));
		parseDeal.set('dealBanner', null);
	}
	logger.debugLog('saveDeal log. before sending back deal save promise');
	return parseDeal.save();
};

var setDealImages = function(dealImages, parseDeal) {
	var imageFilepromises = [];
	dealImages.forEach(function(dealImage) {
		var imageData = dealImage.imageBase64;
		var imageType = dealImage.imageType;
		logger.debugLog('setDealImages log. imageType: ' + imageType);
		if (imageData && imageType) {
			if (imageType == 'image/png') {
				imgFileName = 'deal_image.png';
			}
			else if (imageType == 'image/jpeg') {
				imgFileName = 'deal_image.jpg';
			}
			else {
				logger.debugLog('saveDeal log. Unsupported image type: ' + imageType);
				throw new Error('Unsupported image type: ' + imageType);
			}
			var targetImageFile = new Parse.File(imgFileName, {base64: imageData}, imageType);
			imageFilepromises.push(targetImageFile.save());
		}
	});
	return Parse.Promise.when(imageFilepromises)
		.then(function() {
			logger.debugLog('setDealImages log. imageFile saved promises');
			var parseImagePromises = [];
			for(var i=0; i<arguments.length; i++) {
				var imageFile = arguments[i];
				var parseImage = new ParseDealImage();
				parseImage.set('imageFile', imageFile);
				parseImage.set('dealId', parseDeal.id);
				parseImagePromises.push(parseImage.save());
			}
			return Parse.Promise.when(parseImagePromises);
		})
		.then(function() {
			logger.debugLog('setDealImages log. parseImage saved promises');
			if (arguments.length == 0) {
				return parseDeal;
			}
			var dealImageUrls = [];
			for (var i = 0; i < arguments.length; i++) {
				var parseImage = arguments[i];
				var parseImageFile = parseImage.get('imageFile');
				var imageUrl = parseImageFile? parseImageFile.url() : null;
				logger.debugLog('setDealImages log. imageUrl: ' + imageUrl);
				dealImageUrls.push(imageUrl);
			}
			logger.debugLog('setDealImages log. dealImageUrls: ' + JSON.stringify(dealImageUrls));
			parseDeal.set('dealImages', dealImageUrls);
			return parseDeal.save();
		});
}