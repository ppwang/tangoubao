var ParseOrder= Parse.Object.extend('Order');
var orderModel = require('cloud/tuangoubao/order');
var userModel = require('cloud/tuangoubao/user');
var ParseDeal = Parse.Object.extend('Deal');
var tgbDeal = require('cloud/tuangoubao/deal');

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
				if (parseOrder) {
					var order = orderModel.convertToOrderModel(parseOrder);
					console.log('create order: ' + JSON.stringify(order));
					return order;
				}
				return;
			})
			.then(function(responseData) {
				res.status(200).send(responseData);
			}, function(error) {
				console.log('order: ' + JSON.stringify(error));
				res.status(500).end();
			});
	}
	return modifyOrder(orderId, currentUser, req)
		.then(function(parseOrder) {
			if (parseOrder) {
				var order = orderModel.convertToOrderModel(parseOrder);
				console.log('modify order to: ' + JSON.stringify(order));
				return order
			}
			return;
		})
		.then(function(responseData) {
			res.status(200).send(responseData);
		}, function(error) {
			console.log('order: ' + JSON.stringify(error));
			res.status(500).end();
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
	var currentUser = Parse.User.current();
	if (!currentUser) {
		// require user to log in
		return res.status(401).send();
	}

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
	var dealName = req.body.dealName;
	var dealImageUrl = req.body.dealImageUrl;
	var creatorName = req.body.creatorName;
	var creatorImageUrl = req.body.creatorImageUrl;

	if (!phoneNumber || !quantity || (pickupOptionId == null)) {
		console.log('phoneNumber: ' + phoneNumber + '; quantity: ' + quantity + '; pickupOptionId:' + pickupOptionId);
		throw new Error('Missing data');
	}
	console.log('currentUser:' + JSON.stringify(currentUser));

	return currentUser.fetch()
		.then(function(instantiatedUser) {
			var userPhone = instantiatedUser.get('phoneNumber');
			if (!userPhone) {
				console.log('set phoneNumber:' + phoneNumber);
				instantiatedUser.set('bypassClaim', 'true');
				instantiatedUser.set('phoneNumber', phoneNumber);
				return instantiatedUser.save();
			}
			return;
		})
		.then(function() {
			console.log('create new deal');
			var parseOrder = new ParseOrder();
			parseOrder.set('dealId', dealId);
			parseOrder.set('creatorId', currentUser.id);
			parseOrder.set('quantity', quantity);
			parseOrder.set('pickupOptionId', pickupOptionId);
			parseOrder.set('phoneNumber', phoneNumber);
			parseOrder.set('dealName', dealName);
			parseOrder.set('dealImageUrl', dealImageUrl);
			parseOrder.set('creatorName', creatorName);
			parseOrder.set('creatorImageUrl', creatorImageUrl);
			return parseOrder.save();
		});
};

var modifyOrder = function(orderId, currentUser, req) {
	var phoneNumber = req.body.phoneNumber;
	var quantity = req.body.quantity;
	var pickupOptionId = req.body.pickupOptionId;
	var dealName = req.body.dealName;
	var dealImageUrl = req.body.dealImageUrl;
	var creatorName = req.body.creatorName;
	var creatorImageUrl = req.body.creatorImageUrl;

	if (!phoneNumber || !quantity || (pickupOptionId == null)) {
		throw new Error('Missing data');
	}

	return currentUser.fetch()
		.then(function(instantiatedUser) {
			var userPhone = instantiatedUser.get('phoneNumber');
			if (!userPhone) {
				instantiatedUser.set('bypassClaim', 'true');
				instantiatedUser.set('phoneNumber', phoneNumber);
				return instantiatedUser.save();
			}
			return;
		})
		.then(function() {
			var parseOrder = new ParseOrder();
			parseOrder.id = orderId;
			return parseOrder.fetch();
		})
		.then(function(parseOrder) {
			parseOrder.set('quantity', quantity);
			parseOrder.set('pickupOptionId', pickupOptionId);
			parseOrder.set('phoneNumber', phoneNumber);
			parseOrder.set('dealName', dealName);
			parseOrder.set('dealImageUrl', dealImageUrl);
			parseOrder.set('creatorName', creatorName);
			parseOrder.set('creatorImageUrl', creatorImageUrl);
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
   	return existingParseOrder.fetch()
		.then( function(parseOrder) {
			if (parseOrder) {
				console.log('Delete orderId:' + orderId + ' by userId: ' + currentUser.id);
				return existingParseOrder.destroy({});
			}
			return;
		})
		.then(function() {
    		return res.status(200).end();
    	}, function(error) {
    		console.log('Delete order error: ' + JSON.stringify(error));
    		return res.status(500).end();
    	});
};