var orderModel = require('cloud/tuangoubao/order');
var dealModel = require('cloud/tuangoubao/deal');
var ParseOrder = Parse.Object.extend('Order');
var logger = require('cloud/lib/logger');

module.exports.getMyOrders = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
	logger.debugLog('getMyOrders log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		logger.logDiagnostics(correlationId, 'error', 'getMyOrders error: user not logged in');

		return res.status(401).send(responseError);
	}

	var query = new Parse.Query(ParseOrder);
	query.equalTo('creatorId', currentUser.id);
	// we are sorting the results by creation date
	query.addDescending('createdAt');
	return query.find()
    	.then(function(parseOrders) {
    		var orders = [];

    		parseOrders.forEach(function(parseOrder) {
				var order = orderModel.convertToOrderModel(parseOrder);
				orders.push(order);
			});

			return orders;
    	})
    	.then(function(orders) {
    		var responseData = {};
			responseData.orders = orders;
			return res.status(200).send(JSON.stringify(responseData));
	    }, function(error) {
	    	var errorMessage = 'getMyOrders error: ' + JSON.stringify(error);
	    	logger.logDiagnostics(correlationId, 'error', errorMessage);
	    	return res.status(500).send(responseError);
	    });
};

module.exports.getOrders = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var dealId = req.params.dealId;
	if (!dealId) {
		logger.logDiagnostics(correlationId, 'error', 'getOrders error: no dealId provided in request');
		return res.send('no dealId');
	}

	var parseDealPromise = new ParseDeal();
	parseDealPromise.id = dealId;
	var query = new Parse.Query(ParseOrder);
	query.equalTo('dealId', dealId);
	query.addDescending('createdAt');

	return query.find()
		.then(function(parseOrders) {
    		var orders = [];

    		parseOrders.forEach(function(parseOrder) {
				var order = orderModel.convertToOrderModel(parseOrder);
				orders.push(order);
			});

			return orders;
		})
		.then(function(orders) {
			var responseData = {};
			responseData.orders = orders;
			return res.status(200).send(JSON.stringify(responseData));
		}, function(error) {
			var errorMessage = 'getOrders error: ' + JSON.stringify(error);
			logger.logDiagnostics(correlationId, 'error', errorMessage);
	    	return res.status(500).send(responseError);
	    });
};