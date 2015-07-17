var ParseOrder= Parse.Object.extend('Order');
var tgbUser = require('cloud/tuangoubao/user');
var utils = require('cloud/lib/utils');

module.exports.getOrders = function(deal) {
	console.log('get deal orders, dealId: ' + deal.id);
	var query = new Parse.Query(ParseOrder);
	query.equalTo('dealId', deal.id);
	query.ascending('pickupOptionId');
	
	var pickupOptionsDictionary = new Array();
	var pickupOptionsData = deal.pickupOptions;

	if (pickupOptionsData) {
		console.log('pickupOptionsData: ' + pickupOptionsData);
		var pickupOptions = JSON.parse(pickupOptionsData);
		if (pickupOptions.forEach) {
			pickupOptions.forEach(function(pickupOption) {
				if (!pickupOptionsDictionary[pickupOption.id]) {
					pickupOptionsDictionary[pickupOption.id] = pickupOption;
				}
			});
		}
	}
	var orders = [];
	return query.find()
		.then(function(parseOrders) {
			var promises = [];
			var userPromises = new Array();
			parseOrders.forEach(function(parseOrder) {
				var order = convertToOrderModel(parseOrder);
				console.log('order: ' + JSON.stringify(order));
				order.pickupOption = pickupOptionsDictionary[order.pickupOptionId];
				orders.push(order);
				if (!userPromises[order.creatorId]) {
					var userQuery = new Parse.Query(Parse.User);
					userQuery.equalTo('objectId', order.creatorId);
					userPromises[order.creatorId] = userQuery.first();
				}
			});
			for (var creatorId in userPromises) {
				if (userPromises.hasOwnProperty(creatorId)) {
					promises.push(userPromises[creatorId]);
				}
			};
			return Parse.Promise.when(promises);
		})
		.then(function() {
			var buyerDictionary = new Array();
			for(var i=0; i<arguments.length; i++) {
				var parseBuyer = arguments[i];
				if (parseBuyer) {
					var creatorId = parseBuyer.id;
					if (!buyerDictionary[creatorId]) {
						buyerDictionary[creatorId] = tgbUser.convertToUserModel(parseBuyer);
					}
				}
			}

			orders.forEach(function(order) {
				order.buyer = buyerDictionary[order.creatorId];
			});
			return orders;
		});
};

module.exports.getOrdersByPickupOption = function(deal) {
	console.log('get deal orders, dealId: ' + deal.id);
	var query = new Parse.Query(ParseOrder);
	query.equalTo('dealId', deal.id);
	query.ascending('pickupOptionId');

	var result = {};
	result.summary = {};
	result.pickupOptions = new Array();

	var buyerOrderQuantity = new Array();
	var pickupOptionBuyerOrderQuantity = [];
	var pickupOptionsData = deal.pickupOptions;
	if (pickupOptionsData) {
		console.log('pickupOptionsData: ' + pickupOptionsData);
		var pickupOptions = JSON.parse(pickupOptionsData);
		if (pickupOptions.forEach) {
			pickupOptions.forEach(function(pickupOption) {
				if (!result.pickupOptions[pickupOption.id]) {
					result.pickupOptions[pickupOption.id] = pickupOption;
					result.pickupOptions[pickupOption.id].summary = {};
					result.pickupOptions[pickupOption.id].orders = [];

					pickupOptionBuyerOrderQuantity[pickupOption.id] = new Array();
				}
			});
		}
	}

	var orders = [];
	var pickupOptionsDictionary = new Array();
	var buyerOrderDictionary = new Array();
	return query.find()
		.then(function(parseOrders) {
			var userPromises = new Array();
			var promises = [];
			parseOrders.forEach(function(parseOrder) {
				var order = convertToOrderModel(parseOrder);
				console.log('order: ' + JSON.stringify(order));
				order.pickupOption = pickupOptionsDictionary[order.pickupOptionId];
				orders.push(order);

				if (!userPromises[order.creatorId]) {
					var userQuery = new Parse.Query(Parse.User);
					userQuery.equalTo('objectId', order.creatorId);
					userPromises[order.creatorId] = userQuery.first();
				}

				// stats
				if (!buyerOrderQuantity[order.creatorId]) {
					console.log('order creatorId: ' + order.creatorId + ' quantity: ' + order.quantity);
					buyerOrderQuantity[order.creatorId] = order.quantity;
					console.log('Adding buyerorder: ' + JSON.stringify(buyerOrderQuantity));
				}
				else {
					buyerOrderQuantity[order.creatorId] += order.quantity;
				}

				if (!pickupOptionBuyerOrderQuantity[order.pickupOptionId][order.creatorId]) {
					pickupOptionBuyerOrderQuantity[order.pickupOptionId][order.creatorId] = order.quantity;
				}
				else {
					pickupOptionBuyerOrderQuantity[order.pickupOptionId][order.creatorId] += order.quantity;
				}
			});
			
			for (var creatorId in userPromises) {
				if (userPromises.hasOwnProperty(creatorId)) {
					promises.push(userPromises[creatorId]);
				}
			};

			return Parse.Promise.when(promises);
		})
		.then(function() {
			var buyerDictionary = new Array();
			for(var i=0; i<arguments.length; i++) {
				var parseBuyer = arguments[i];
				if (parseBuyer) {
					var creatorId = parseBuyer.id;
					if (!buyerDictionary[creatorId]) {
						buyerDictionary[creatorId] = tgbUser.convertToUserModel(parseBuyer);
					}
				}
			}

			orders.forEach(function(order) {
				order.buyer = buyerDictionary[order.creatorId];
			});
			return orders;
		})
		.then(function() {
			// assemble the result
			console.log('buyerOrderQuantity: ' + JSON.stringify(buyerOrderQuantity));
			result.summary.buyerCount = utils.getArrayLength(buyerOrderQuantity);
			result.summary.quantity = result.summary.buyerCount > 0 ? 
				utils.getArraySum(buyerOrderQuantity) : 0; 
			for (var pickupOptionKey in pickupOptionBuyerOrderQuantity) {
				result.pickupOptions[pickupOptionKey].summary.buyerCount = 
					utils.getArrayLength(pickupOptionBuyerOrderQuantity[pickupOptionKey]);
				result.pickupOptions[pickupOptionKey].summary.quantity = result.pickupOptions[pickupOptionKey].summary.buyerCount > 0?
					utils.getArraySum(pickupOptionBuyerOrderQuantity[pickupOptionKey]) : 0;
			}
			// iterate orders
			orders.forEach(function(order) {
				result.pickupOptions[order.pickupOptionId].orders.push(order);
			});
			return result;
		});
}

module.exports.convertToOrderModel = function(parseOrder) {
	return convertToOrderModel(parseOrder);
};

var convertToOrderModel = function(parseOrder) {
	var order = {};
	order.id = parseOrder.id;
	order.dealId = parseOrder.get('dealId');
	order.creatorId = parseOrder.get('creatorId');
	order.quantity = parseOrder.get('quantity');
	order.orderTime = parseOrder.createdAt;
	order.pickupOptionId = parseOrder.get('pickupOptionId');
	order.phoneNumber = parseOrder.get('phoneNumber');
	order.dealName = parseOrder.get('dealName');
	order.dealImageUrl = parseOrder.get('dealImageUrl');
	order.creatorName = parseOrder.get('creatorName');
	order.creatorImageUrl = parseOrder.get('creatorImageUrl');
	order.status = parseOrder.get('status');
	order.price = parseOrder.get('price');
	return order;
};