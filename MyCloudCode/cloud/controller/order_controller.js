var ParseOrder= Parse.Object.extend('Order');
var orderModel = require('cloud/tuangoubao/order');

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
			var order = orderModel.convertToOrderModel(parseOrder);
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
	var pickupOptionId = req.body.pickupOptionId;
	var orderTime = req.body.orderTime;

	if (!phone || !orderAmount || !pickupOptionId) {
		return;
	}

	currentUser.set('phone', phone);
	return currentUser.save()
		.then(function() {
			var parseOrder = new ParseOrder();
			parseOrder.set('dealId', dealId);
			parseOrder.set('buyerId', currentUser.id);
			parseOrder.set('orderAmount', orderAmount);
			parseOrder.set('orderTime', orderTime);
			parseOrder.set('pickupOptionId', pickupOptionId);
			return parseOrder.save();
		});
};

var modifyOrder = function(orderId, currentUser, req) {
	var phone = req.body.phone;
	var orderAmount = req.body.amount;
	var pickupOptionId = req.body.pickupOptionId;
	var orderTime = req.body.orderTime;

	if (!phone || !orderAmount || !pickupOptionId) {
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
			parseOrder.set('pickupOptionId', pickupOptionId);
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