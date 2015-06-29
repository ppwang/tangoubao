var ParseDeal = Parse.Object.extend('Deal');

module.exports.convertToDealModel = function(parseDeal, type) {
	var deal = {};
	deal.id = parseDeal.id;
	deal.name = parseDeal.get('name');
	deal.subtitle = parseDeal.get('subtitle');
	deal.beginDate = parseDeal.get('beginDate');
	deal.endDate = parseDeal.get('endDate');
	var dealImage = parseDeal.get('dealImage');
	deal.dealImgeUrl = dealImage? dealImage.url() : null;
	deal.detailedDescription = parseDeal.get('detailedDescription');
	deal.email = parseDeal.get('email');
	deal.phoneNumber = parseDeal.get('phoneNumber');
	deal.unitName = parseDeal.get('unitName');
	deal.unitPrice = parseDeal.get('unitPrice');
	deal.createdAt = parseDeal.get('createdAt');
	deal.creatorName = parseDeal.get('creatorName');
	deal.type = type;
	return deal;
};