var ParseDeal = Parse.Object.extend('Deal');
var ParseOrder= Parse.Object.extend('Order');

module.exports.convertToDealModel = function(parseDeal, type) {
	var deal = {};
	deal.id = parseDeal.id;
	deal.name = parseDeal.get('name');
	deal.subtitle = parseDeal.get('subtitle');
	deal.beginDate = parseDeal.get('beginDate');
	deal.endDate = parseDeal.get('endDate');
	var dealImage = parseDeal.get('dealImage');
	deal.dealImageUrl = dealImage? dealImage.url() : null;
	deal.detailedDescription = parseDeal.get('detailedDescription');
	deal.email = parseDeal.get('email');
	deal.phoneNumber = parseDeal.get('phoneNumber');
	deal.unitName = parseDeal.get('unitName');
	deal.unitPrice = parseDeal.get('unitPrice');
	deal.createdAt = parseDeal.createdAt;
	deal.creatorName = parseDeal.get('creatorName');
	var creator = parseDeal.get('createdBy');
	deal.creatorId = creator.id;
	deal.type = type;
	return deal;
};

module.exports.getBuyers = function(dealId) {
	console.log('get ordered deals');
	var query = new Parse.Query(ParseOrder);
	query.equalTo('dealId', dealId);
	return query.find()
		.then(function(parseOrders) {
			var promises = [];
			parseOrders.forEach(function(parseOrder) {
				var buyerId = parseOrder.get('buyerId');
				var buyer = new Parse.User();
				buyer.id = dealId;
				promises.push(orderedDeal.fetch());
			});
			return Parse.Promise.when(promises);
		})
		.then(function() {
			var buyers = [];
			for(var i=0; i<arguments.length; i++) {
				var buyer = {};
				var parseBuyer = arguments[i];
				buyer.id = parseBuyer.id;
				buyer.username = parseBuyer.get('username');
				buyer.email = parseBuyer.get('email');
				buyer.phone = parseBuyer.get('phone');
				buyer.headimgurl = parseBuyer.get('headimgurl');
				buyers.push(buyer);
			}
			return buyers;
		});
};