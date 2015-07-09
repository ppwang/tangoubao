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
		var pickupOptions = JSON.parse(pickupOptionsData);
		pickupOptions.forEach(function(pickupOption) {
			if (!pickupOptionsDictionary[pickupOption.id]) {
				pickupOptionsDictionary[pickupOption.id] = pickupOption;
			}
		});
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
				buyer.id = order.buyerId;
				promises.push(buyer.fetch());
			});
			return Parse.Promise.when(promises);
		})
		.then(function() {
			var buyerDictionary = new Array();
			for(var i=0; i<arguments.length; i++) {
				var parseBuyer = arguments[i];
				var buyerId = parseBuyer.id;
				if (!buyerDictionary[buyerId]) {
					buyerDictionary[buyerId] = tgbUser.convertToUserModel(parseBuyer);
				}
			}

			orders.forEach(function(order) {
				order.buyer = buyerDictionary[order.buyerId];
			});
			return orders;
		});
};

module.exports.convertToOrderModel = function(parseOrder) {
	var order = {};
	order.id = parseOrder.id;
	order.dealId = parseOrder.get('dealId');
	order.buyerId = parseOrder.get('buyerId');
	order.orderAmount = parseOrder.get('orderAmount');
	order.orderTime = parseOrder.get('orderTime');
	order.pickupOptionId = parseOrder.get('pickupOptionId');
	return order;
};