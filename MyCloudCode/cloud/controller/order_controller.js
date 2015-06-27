var ParseOrder= Parse.Object.extend('Order');

module.exports.orderDeal = function(req, res) {
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
					var order = convertToOrderModel(parseOrder);
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
			var order = convertToOrderModel(parseOrder);
			console.log('modify order to: ' + JSON.stringify(order));
			return order
		})
		.then(function(responseData) {
			res.status(200).send(responseData);
		}, function(error) {
			console.log('order: ' + JSON.stringify(error));
			res.status(500).end();
		});
};

var createOrder = function(dealId, currentUser, req) {
	var phone = req.body.phone;
	var orderAmount = req.body.amount;
	var pickupLocationId = req.body.pickupLocationId;
	var orderTime = req.body.orderTime;

	if (!phone || !orderAmount || !pickupLocationId) {
		return;
	}

	currentUser.set('phone', phone);
	return currentUser.save()
		.then(function() {
			var parseOrder = new ParseOrder();
			parseOrder.set('dealId', dealId);
			parseOrder.set('purchaserId', currentUser.id);
			parseOrder.set('orderAmount', orderAmount);
			parseOrder.set('orderTime', orderTime);
			parseOrder.set('pickupLocationId', pickupLocationId);
			return parseOrder.save();
		});
};

var modifyOrder = function(orderId, currentUser, req) {
	var phone = req.body.phone;
	var orderAmount = req.body.amount;
	var pickupLocationId = req.body.pickupLocationId;
	var orderTime = req.body.orderTime;

	if (!phone || !orderAmount || !pickupLocationId) {
		return;
	}

	currentUser.set('phone', phone);
	return currentUser.save()
		.then(function() {
			var parseOrder = new ParseOrder();
			parseOrder.id = orderId;
			return parseOrder.fetch();
		})
		.then(function(parseOrder) {
			parseOrder.set('orderAmount', orderAmount);
			parseOrder.set('orderTime', orderTime);
			parseOrder.set('pickupLocationId', pickupLocationId);
			return parseOrder.save();
		});
};

var convertToOrderModel = function(parseOrder) {
	var order = {};
	order.id = parseOrder.id;
	order.dealId = parseOrder.get('dealId');
	order.purchaserId = parseOrder.get('purchaserId');
	order.orderAmount = parseOrder.get('orderAmount');
	order.orderTime = parseOrder.get('orderTime');
	order.pickupLocationId = parseOrder.get('pickupLocationId');
	return order;
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