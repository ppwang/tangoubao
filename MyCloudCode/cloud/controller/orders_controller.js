var orderModel = require('cloud/tuangoubao/order');
var dealModel = require('cloud/tuangoubao/deal');
var ParseOrder = Parse.Object.extend('Order');
var ParseDeal = Parse.Object.extend('Deal');

module.exports.getMyOrders = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		return res.status(401).send();
	}

	var query = new Parse.Query(ParseOrder);
	query.equalTo('creatorId', currentUser.id);
	// we are sorting the results by creation date
	query.addDescending('createdAt');
	return query.find()
    	.then(function(parseOrders) {
    		console.log('parseOrders: ' + JSON.stringify(parseOrders));
    		var orders = [];

    		parseOrders.forEach(function(parseOrder) {
				var order = orderModel.convertToOrderModel(parseOrder);
				console.log('Convert parseOrder to: ' + JSON.stringify(order));
				orders.push(order);
			});

			return orders;
    	})
    	.then(function(orders) {
    		var responseData = {};
			responseData.orders = orders;
			return res.status(200).send(JSON.stringify(responseData));
	    }, function(error) {
	    	console.log('error is: ' + JSON.stringify(error));
	    	return res.status(500).end();
	    });
};

module.exports.getOrders = function(req, res) {
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

	var parseDealPromise = new ParseDeal();
	console.log('get orders call: ' + dealId);
	parseDealPromise.id = dealId;
	return parseDealPromise.fetch()
		.then(function(parseDeal) {
			console.log('got ParseDeal: ' + JSON.stringify(parseDeal));
			var deal = dealModel.convertToDealModel(parseDeal);
			if (deal.creatorId != currentUser.id) {
				return 'Not authorized';
			}
			console.log('got deal: ' + JSON.stringify(deal));
			var query = new Parse.Query(ParseOrder);
			query.equalTo('dealId', dealId);
			query.addDescending('createdAt');
			return query.find();
		})
		.then(function(parseOrders) {
			if (parseOrders === 'Not authorized') {
				return 'Not authorized';
			}
			console.log('parseOrders: ' + JSON.stringify(parseOrders));
    		var orders = [];

    		parseOrders.forEach(function(parseOrder) {
				var order = orderModel.convertToOrderModel(parseOrder);
				console.log('Convert parseOrder to: ' + JSON.stringify(order));
				orders.push(order);
			});

			return orders;
		})
		.then(function(orders) {
			if (orders === 'Not authorized') {
				return res.status(401).end();
			}
			var responseData = {};
			responseData.orders = orders;
			return res.status(200).send(JSON.stringify(responseData));
		}, function(error) {
	    	return res.status(404).end();
	    });
};