var ParseOrder= Parse.Object.extend('Order');
var tgbUser = require('cloud/tuangoubao/user');

module.exports.getOrders = function(dealId, deal) {
	console.log('get deal orders');
	var query = new Parse.Query(ParseOrder);
	query.equalTo('dealId', dealId);
	query.ascending('pickupOptionId');
	
	var pickupOptionsDictionary = new Array();
	var pickupOptionsData = deal.pickupOptions;
	if (pickupOptionsData) {
		console.log('pickupOptionsData: ' + pickupOptionsData);
		var pickupOptions = JSON.parse(pickupOptionsData);
		if (pickupOptions.constructor === Array) {
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
			parseOrders.forEach(function(parseOrder) {
				var order = convertToOrderModel(parseOrder);
				order.pickupOption = pickupOptionsDictionary[order.pickupOptionId];
				orders.push(order);
				var buyer = new Parse.User();
				buyer.id = order.creatorId;
				promises.push(buyer.fetch());
			});
			return Parse.Promise.when(promises);
		})
		.then(function() {
			var buyerDictionary = new Array();
			for(var i=0; i<arguments.length; i++) {
				var parseBuyer = arguments[i];
				var creatorId = parseBuyer.id;
				if (!buyerDictionary[creatorId]) {
					buyerDictionary[creatorId] = tgbUser.convertToUserModel(parseBuyer);
				}
			}

			orders.forEach(function(order) {
				order.buyer = buyerDictionary[order.creatorId];
			});
			return orders;
		});
};

module.exports.convertToOrderModel = function(parseOrder) {
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
	return order;
};