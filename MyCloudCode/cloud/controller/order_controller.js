var ParseOrder= Parse.Object.extend('Order');
var orderModel = require('cloud/tuangoubao/order');
var userModel = require('cloud/tuangoubao/user');
var ParseDeal = Parse.Object.extend('Deal');
var tgbDeal = require('cloud/tuangoubao/deal');
var notificationController = require('cloud/controller/notification_controller');
var tgbAdminUser = require('cloud/app.config.js').settings.tgbAdminUser;

module.exports.putOrder = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		return res.status(401).send();
	}

	var dealId = req.body.dealId;
	if (!dealId) {
		// not found
		return res.status(404).end();
	}

	var orderId = req.body.id;
	if (!orderId) {
		return createOrder(dealId, currentUser, req)
			.then(function(parseOrder) {
				console.log('after create order');
				if (parseOrder == 'Invalid order') {
					return 'Invalid order';
				}
				if (parseOrder) {
					var order = orderModel.convertToOrderModel(parseOrder);
					console.log('create order: ' + JSON.stringify(order));
					return order;
				}
				return;
			})
			.then(function(responseData) {
				if (responseData == 'Invalid order') {
					return res.status(404).send('Invalid order');
				}
				return res.status(200).send(responseData);
			}, function(error) {
				console.log('create order: ' + JSON.stringify(error));
				return res.status(500).end();
			});
	}
	return modifyOrder(orderId, currentUser, req)
		.then(function(parseOrder) {
			if (parseOrder == 'Invalid order') {
				return 'Invalid order';
			}
			if (parseOrder) {
				var order = orderModel.convertToOrderModel(parseOrder);
				console.log('modify order to: ' + JSON.stringify(order));
				return order;
			}
			return;
		})
		.then(function(responseData) {
			if (responseData == 'Invalid order') {
				return res.status(404).send('Invalid order');
			}
			return res.status(200).send(responseData);
		}, function(error) {
			console.log('modify order: ' + JSON.stringify(error));
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

	var orderId = req.params.orderId;
	if (!orderId) {
		return res.status(404).send();
	}

	var status = req.query.status;
	if (!status || (status != 'closed' && status != 'active')) {
		return res.status(404).send();
	}

	console.log('put orderId: ' + orderId);
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
				return res.status(401).end();
			}
			var order = orderModel.convertToOrderModel(savedParseOrder);
			return res.status(200).send(order);
		}, function(error) {
			console.log('error: ' + JSON.stringify(error));
			return res.status(500).end();
		});
};

module.exports.getOrder = function(req, res) {
	// TBD: do we need the user to log in?
	// var currentUser = Parse.User.current();
	// if (!currentUser) {
	// 	// require user to log in
	// 	return res.status(401).send();
	// }

	var orderId = req.params.orderId;
	if (!orderId) {
		// create a new deal
		return res.send('no orderId');
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
				console.log('save new order: ' + JSON.stringify(order));
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
				console.log('get fresh user: ' + JSON.stringify(parseUser));
				deal = tgbDeal.convertToDealModel(parseDeal);
				creator = userModel.convertToUserModel(parseUser);
				parseOrder.set('dealName', deal.name);
				parseOrder.set('dealImageUrl', deal.dealImageUrl);
				parseOrder.set('creatorName', creator.nickname);
				parseOrder.set('creatorImageUrl', creator.headimgurl);
				console.log('to save parseOrder: ' + JSON.stringify(parseOrder));
				return parseOrder.save()
			})
			.then(function(savedParseOrder) {
				var order = orderModel.convertToOrderModel(parseOrder);
				console.log('sending back order model: ' + JSON.stringify(order));
				console.log('sending back deal model: ' + JSON.stringify(deal));
				console.log('sending back creator model: ' + JSON.stringify(creator));
				order.deal = deal;
				order.creator = creator;
				return res.status(201).send(order);
			}, function(error) {
				console.log('error: ' + JSON.stringify(error));
				return res.status(500).end();
			});
	}
};

var createOrder = function(dealId, currentUser, req) {
	console.log('create order begin:' + JSON.stringify(currentUser));
	console.log('create order begin:' + JSON.stringify(req.body));

	// Get all the fields from the post form data
	var phoneNumber = req.body.phoneNumber;
	var quantity = req.body.quantity;
	var pickupOptionId = req.body.pickupOptionId;
	var creatorName = req.body.creatorName;
	var creatorImageUrl = req.body.creatorImageUrl;

	if (!phoneNumber || !quantity || (pickupOptionId == null)) {
		console.log('phoneNumber: ' + phoneNumber + '; quantity: ' + quantity + '; pickupOptionId:' + pickupOptionId);
		throw new Error('Missing data');
	}
	console.log('currentUser:' + JSON.stringify(currentUser));

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
				console.log('Invalid order');
				return 'Invalid order';
			}
			
			var userPhone = parseUser.get('phoneNumber');
			if (!userPhone) {
				console.log('set phoneNumber:' + phoneNumber);
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
			console.log('create new order');
			var parseOrder = new ParseOrder();
			parseOrder.set('dealId', dealId);
			parseOrder.set('creatorId', currentUser.id);
			parseOrder.set('quantity', quantity);
			parseOrder.set('pickupOptionId', pickupOptionId);
			parseOrder.set('phoneNumber', phoneNumber);
			parseOrder.set('dealName', deal.name);
			parseOrder.set('dealImageUrl', deal.dealImageUrl);
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
			console.log('save order');
			savedOrder = savedParseOrder;
			var orderCount = parseDeal.get('orderCount');
			if (orderCount || orderCount == 0) {
				orderCount++;
			}
			else {
				orderCount = 0;
			}
			parseDealPromise.set('orderCount', orderCount);
			console.log('set orderCount: ' + orderCount);
			return parseDealPromise.save(null, { useMasterKey: true });
		})
		.then(function(savedDeal) {
			if (savedDeal == 'Invalid order') {
				return 'Invalid order';
			}
			console.log('parseDealPromise save');
			console.log('savedOrder: ' + JSON.stringify(savedOrder));
			var messageCreatorId = tgbAdminUser.userId;
			var messageCreatorName = tgbAdminUser.userName;
			// TODO: add order message with more details
			console.log('send notification from message creator id: ' + messageCreatorId + ', messageCreatorName: ' + messageCreatorName);
			var orderToNotify = orderModel.convertToOrderModel(savedOrder);
			return notificationController.notifyBuyer(messageCreatorId, messageCreatorName, orderToNotify, 'general', 'Your order is successful!')
				.then(function() {
					return savedOrder;
				});
		});
};

var modifyOrder = function(orderId, currentUser, req) {
	var phoneNumber = req.body.phoneNumber;
	var quantity = req.body.quantity;
	var pickupOptionId = req.body.pickupOptionId;
	var creatorName = req.body.creatorName;
	var creatorImageUrl = req.body.creatorImageUrl;
    var dealId = req.body.dealId;

	if (!phoneNumber || !quantity || (pickupOptionId == null)) {
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
				console.log('Invalid order');
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
			// TBD: do we allow deal unitprice change from seller?
			// total order price:
			var totalPrice = deal.unitPrice * quantity;
			parseOrder.set('price', totalPrice);
			return parseOrder.save();
		});
};

module.exports.deleteOrder = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		return res.status(401).send();
	}

	var orderId = req.params.orderId;
	if (!orderId) {
		// not found
		return res.status(404).end();
	}

	var existingParseOrder = new ParseOrder();
   	existingParseOrder.id = orderId;
   	var dealId;
   	return existingParseOrder.fetch()
		.then( function(parseOrder) {
			if (parseOrder && parseOrder.creatorId == currentUser.id) {
				console.log('Delete orderId:' + orderId + ' by userId: ' + currentUser.id);
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
			parseDeal.set('orderCount', orderCount);
			return parseDeal.save(null, {useMasterKey: true});
    	})
    	then(function(savedDeal) {
    		if (message == 'Not authorized') {
				return res.status(401).end();
			}
			return res.status(200).end();
    	}, function(error) {
    		console.log('Delete order error: ' + JSON.stringify(error));
    		return res.status(500).end();
    	});
};