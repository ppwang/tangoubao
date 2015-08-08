var ParseOrder= Parse.Object.extend('Order');
var orderModel = require('cloud/tuangoubao/order');
var userModel = require('cloud/tuangoubao/user');
var ParseDeal = Parse.Object.extend('Deal');
var tgbDeal = require('cloud/tuangoubao/deal');
var notificationController = require('cloud/controller/notification_controller');
var tgbAdminUser = require('cloud/app.config.js').settings.tgbAdminUser;
var logger = require('cloud/lib/logger');

module.exports.putOrder = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
	logger.debugLog('putOrder log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		logger.logDiagnostics(correlationId, 'error', 'putOrder error (401): user not logged in.');
		return res.status(404).send(responseError);
	}

	var dealId = req.body.dealId;
	if (!dealId) {
		// not found
		logger.logDiagnostics(correlationId, 'error', 'putOrder error (404): dealId not provided in request.');
		return res.status(404).send(responseError);
	}

	var orderId = req.body.id;
	if (!orderId) {
		return createOrder(correlationId, dealId, currentUser, req)
			.then(function(parseOrder) {
				if (parseOrder == 'Invalid order') {
					return 'Invalid order';
				}
				if (parseOrder) {
					var order = orderModel.convertToOrderModel(parseOrder);
					logger.debugLog('putOrder log. create order: ' + JSON.stringify(order));
					return order;
				}
				return;
			})
			.then(function(responseData) {
				if (responseData == 'Invalid order') {
					logger.logDiagnostics(correlationId, 'error', 'putOrder error: Invalid order');
					return res.status(404).send(responseError);
				}
				return res.status(200).send(responseData);
			}, function(error) {
				var errorMessage = 'Create order error: ' + JSON.stringify(error);
				logger.log(correlationId, 'error', errorMessage);
				return res.status(500).send(responseError);
			});
	}
	return modifyOrder(correlationId, orderId, currentUser, req)
		.then(function(parseOrder) {
			if (parseOrder == 'Invalid order') {
				return 'Invalid order';
			}
			if (parseOrder) {
				var order = orderModel.convertToOrderModel(parseOrder);
				logger.debugLog('putOrder log. modify order to: ' + JSON.stringify(order));
				return order;
			}
			return;
		})
		.then(function(responseData) {
			if (responseData == 'Invalid order') {
				logger.logDiagnostics(correlationId, 'error', 'putOrder error: Invalid order');
				return res.status(404).send(responseError);
			}
			return res.status(200).send(responseData);
		}, function(error) {
			var errorMessage = 'modify order error: ' + JSON.stringify(error);
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			return res.status(500).send(responseError);
		});
};

module.exports.putStatus = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
	logger.debugLog('putStatus log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		logger.logDiagnostics(correlationId, 'error', 'order putStatus error (401): user not logged in');
		return res.status(401).send(responseError);
	}

	var orderId = req.params.orderId;
	if (!orderId) {
		logger.logDiagnostics(correlationId, 'error', 'order putStatus error (404): orderId not provided in request');
		return res.status(404).send(responseError);
	}

	var status = req.query.status;
	if (!status || (status != 'closed' && status != 'active')) {
		logger.logDiagnostics(correlationId, 'error', 'order putStatus error (404): status not correct: ' + status);
		return res.status(404).send(responseError);
	}

	var parseOrderPromise = new ParseOrder();
	parseOrderPromise.id = orderId;
	return parseOrderPromise.fetch()
		.then(function(parseOrder) {
			var order = orderModel.convertToOrderModel(parseOrder);
			if (order.creatorId != currentUser.id) {
				return 'Not authorized';
			}
			parseOrder.set('status', status);
			return parseOrder.save();
		})
		.then(function(savedParseOrder) {
			if (savedParseOrder == 'Not authorized') {
				var errorMessage = 'order putStatus error: not authorized';
				logger.logDiagnostics(correlationId, 'error', errorMessage);
				return res.status(401).send(responseError);
			}
			var order = orderModel.convertToOrderModel(savedParseOrder);
			return res.status(200).send(order);
		}, function(error) {
			var errorMessage = 'order putStatus error: ' + JSON.stringify(error);
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			return res.status(500).send(responseError);
		});
};

module.exports.getOrder = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	// TBD: do we need the user to log in?
	// var currentUser = Parse.User.current();
	// if (!currentUser) {
	// 	// require user to log in
	// 	return res.status(401).send();
	// }

	var orderId = req.params.orderId;
	if (!orderId) {
		// create a new deal
		logger.logDiagnostics(correlationId, 'error', 'getOrder error: no orderId provided in request');
		return res.send(responseError);
	}
	else {
		var tmpOrder = new ParseOrder();
		tmpOrder.id = orderId;
		var parseOrder;
		var deal;
		var creator;
		return tmpOrder.fetch()
			.then(function(_parseOrder) {
				parseOrder = _parseOrder;
				var order = orderModel.convertToOrderModel(parseOrder);
				logger.debugLog('getOrder log. save new order: ' + JSON.stringify(order));
				var dealId = order.dealId;
				var creatorId = order.creatorId;

				// Create two jobs to get deal / buyer info
				var promises = [];
				var parseDealPromise = new ParseDeal();
				parseDealPromise.id = dealId;
				promises.push(parseDealPromise.fetch());
				var parseUserPromise = new Parse.User();
				parseUserPromise.id = creatorId;
				promises.push(parseUserPromise.fetch());

				return Parse.Promise.when(promises);
			})
			.then(function(parseDeal, parseUser) {
				logger.debugLog('getOrder log. get fresh user: ' + JSON.stringify(parseUser));
				deal = tgbDeal.convertToDealModel(parseDeal);
				creator = userModel.convertToUserModel(parseUser);
				parseOrder.set('dealName', deal.name);
				parseOrder.set('dealImageUrl', deal.dealImageUrl);
				parseOrder.set('creatorName', creator.nickname);
				parseOrder.set('creatorImageUrl', creator.headimgurl);
				logger.debugLog('getOrder log. to save parseOrder: ' + JSON.stringify(parseOrder));
				return parseOrder.save()
			})
			.then(function(savedParseOrder) {
				var order = orderModel.convertToOrderModel(parseOrder);
				order.deal = deal;
				order.creator = creator;
				return res.status(201).send(order);
			}, function(error) {
				var errorMessage = 'getOrder error: ' + JSON.stringify(error);
				logger.logDiagnostics(correlationId, 'error', errorMessage);
				return res.status(500).send(responseError);
			});
	}
};

var createOrder = function(correlationId, dealId, currentUser, req) {

	// Get all the fields from the post form data
	var phoneNumber = req.body.phoneNumber;
	var quantity = req.body.quantity;
	var pickupOptionId = req.body.pickupOptionId;
	var creatorName = req.body.creatorName;
	var creatorImageUrl = req.body.creatorImageUrl;
	var email = req.body.email;

	if (!phoneNumber || !quantity || (pickupOptionId == null)) {
		var errorMessage = 'createOrder error. Missing data:  phoneNumber: ' + phoneNumber + '; quantity: ' + quantity + '; pickupOptionId:' + pickupOptionId; 
		logger.logDiagnostics(correlationId, 'error', errorMessage);
		throw new Error('Missing data');
	}

	var promises = [];
	promises.push(currentUser.fetch());
	var parseDealPromise = new ParseDeal();
	parseDealPromise.id = dealId;
	promises.push(parseDealPromise.fetch());
	var deal;

	var parseUser;
	var parseDeal;
	var savedOrder;

	return Parse.Promise.when(promises)
		.then(function(instantiatedUser, instantiatedDeal) {
			parseUser = instantiatedUser;
			parseDeal = instantiatedDeal;

			deal = tgbDeal.convertToDealModel(parseDeal);
			if (!tgbDeal.isValidOrder(deal, new Date())) {
				logger.logDiagnostics(correlationId, 'error', 'Invalid order from deal validation');
				return 'Invalid order';
			}
			
			var userPhone = parseUser.get('phoneNumber');
			if (!userPhone) {
				parseUser.set('bypassClaim', 'true');
				parseUser.set('phoneNumber', phoneNumber);
				return parseUser.save();
			}
			return;
		})
		.then(function(savedUser) {
			if (savedUser == 'Invalid order') {
				return 'Invalid order';
			}
			var parseOrder = new ParseOrder();
			parseOrder.set('dealId', dealId);
			parseOrder.set('creatorId', currentUser.id);
			parseOrder.set('quantity', quantity);
			parseOrder.set('pickupOptionId', pickupOptionId);
			parseOrder.set('phoneNumber', phoneNumber);
			parseOrder.set('dealName', deal.name);
			parseOrder.set('dealImageUrl', deal.dealImageUrl);
			parseOrder.set('email', email);
			parseOrder.set('creatorName', creatorName);
			parseOrder.set('creatorImageUrl', creatorImageUrl);
			// total order price:
			var totalPrice = deal.unitPrice * quantity;
			parseOrder.set('price', totalPrice);
			return parseOrder.save();
		})
		.then(function(savedParseOrder) {
			if (savedParseOrder == 'Invalid order') {
				return 'Invalid order';
			}
			savedOrder = savedParseOrder;
			var orderCount = parseDeal.get('orderCount');
			if (orderCount || orderCount == 0) {
				orderCount++;
			}
			else {
				orderCount = 0;
			}
			parseDealPromise.set('orderCount', orderCount);
			return parseDealPromise.save(null, { useMasterKey: true });
		})
		.then(function(savedDeal) {
			if (savedDeal == 'Invalid order') {
				return 'Invalid order';
			}
			logger.debugLog('createOrder log. savedOrder: ' + JSON.stringify(savedOrder));
			var messageCreatorId = tgbAdminUser.userId;
			var messageCreatorName = tgbAdminUser.userName;
			// TODO: add order message with more details
			logger.debugLog('createOrder log. savedOrder: send notification from message creator id: ' + messageCreatorId + ', messageCreatorName: ' + messageCreatorName);
			var orderToNotify = orderModel.convertToOrderModel(savedOrder);
			return notificationController.notifyBuyer(messageCreatorId, messageCreatorName, orderToNotify, 'general', 'Your order is successful!')
				.then(function() {
					return savedOrder;
				});
		});
};

var modifyOrder = function(correlationId, orderId, currentUser, req) {
	var phoneNumber = req.body.phoneNumber;
	var quantity = req.body.quantity;
	var pickupOptionId = req.body.pickupOptionId;
	var creatorName = req.body.creatorName;
	var creatorImageUrl = req.body.creatorImageUrl;
    var dealId = req.body.dealId;
    var email = req.body.email;

	if (!phoneNumber || !quantity || (pickupOptionId == null)) {
		var errorMessage = 'modifyOrder error. Missing data:  phoneNumber: ' + phoneNumber + '; quantity: ' + quantity + '; pickupOptionId:' + pickupOptionId; 
		logger.logDiagnostics(correlationId, 'error', errorMessage);
		throw new Error('Missing data');
	}

	var promises = [];
	promises.push(currentUser.fetch());
	var parseDealPromise = new ParseDeal();
	parseDealPromise.id = dealId;
	promises.push(parseDealPromise.fetch());
	var deal;

	return Parse.Promise.when(promises)
		.then(function(instantiatedUser, instantiatedDeal) {
			deal = tgbDeal.convertToDealModel(instantiatedDeal);
			if (!tgbDeal.isValidOrder(deal, new Date())) {
				logger.logDiagnostics(correlationId, 'error', 'Invalid order from deal validation');
				return 'Invalid order';
			}
			var userPhone = instantiatedUser.get('phoneNumber');
			if (!userPhone) {
				instantiatedUser.set('bypassClaim', 'true');
				instantiatedUser.set('phoneNumber', phoneNumber);
				return instantiatedUser.save();
			}
			return;
		})
		.then(function(savedUser) {
			if (savedUser == 'Invalid order') {
				return 'Invalid order';
			}

			var parseOrder = new ParseOrder();
			parseOrder.id = orderId;
			return parseOrder.fetch();
		})
		.then(function(parseOrder) {
			if (parseOrder == 'Invalid order') {
				return 'Invalid order';
			}
			parseOrder.set('quantity', quantity);
			parseOrder.set('pickupOptionId', pickupOptionId);
			parseOrder.set('phoneNumber', phoneNumber);
			parseOrder.set('dealName', deal.name);
			parseOrder.set('dealImageUrl', deal.dealImageUrl);
			parseOrder.set('creatorName', creatorName);
			parseOrder.set('creatorImageUrl', creatorImageUrl);
			parseOrder.set('email', email);
			// TBD: do we allow deal unitprice change from seller?
			// total order price:
			var totalPrice = deal.unitPrice * quantity;
			parseOrder.set('price', totalPrice);
			return parseOrder.save();
		});
};

module.exports.deleteOrder = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		logger.logDiagnostics(correlationId, 'error', 'deleteOrder error (401): user not logged in');
		return res.status(401).send(responseError);
	}

	var orderId = req.params.orderId;
	if (!orderId) {
		// not found
		logger.logDiagnostics(correlationId, 'error', 'deleteOrder error (404): orderId not provided in request');
		return res.status(404).send(responseError);
	}

	var existingParseOrder = new ParseOrder();
   	existingParseOrder.id = orderId;
   	var dealId;
   	return existingParseOrder.fetch()
		.then( function(parseOrder) {
			if (parseOrder && parseOrder.creatorId == currentUser.id) {
				logger.debugLog('deleteOrder log. Delete orderId:' + orderId + ' by userId: ' + currentUser.id);
				dealId = parseOrder.get('dealId');
				return existingParseOrder.destroy({});
			}
			return 'Not authorized';
		})
		.then(function(message) {
			if (message == 'Not authorized') {
				return message;
			}
			var parseDealPromise = new ParseDeal();
			parseDealPromise.id = dealId;
			return parseDealPromise.fetch();
    	})
    	.then(function(parseDeal) {
    		if (message == 'Not authorized') {
				return message;
			}

    		var orderCount = parseDeal.get('orderCount');
			if (orderCount) {
				orderCount--;
			}
			else {
				orderCount = 0;
			}
			if (orderCount < 0) {
				orderCount = 0;
			}
 			parseDeal.set('orderCount', orderCount);
			return parseDeal.save(null, {useMasterKey: true});
    	})
    	then(function(savedDeal) {
    		if (message == 'Not authorized') {
    			logger.logDiagnostics(correlationId, 'error', 'deleteOrder error: not authorized');
				return res.status(401).send(responseError);
			}
			return res.status(200).end();
    	}, function(error) {
    		var errorMessage = 'deleteOrder error: ' + JSON.stringify(error);
    		logger.logDiagnostics(correlationId, 'error', errorMessage)
    		return res.status(500).send(responseError);
    	});
};