var ParseDeal = Parse.Object.extend('Deal');

module.exports.convertToDealModel = function(parseDeal, type) {
	var deal = {};
	deal.id = parseDeal.id;
	deal.name = parseDeal.get('name');
	deal.beginDate = parseDeal.get('beginDate');
	deal.endDate = parseDeal.get('endDate');
	var dealImage = parseDeal.get('dealImage');
	var dealImageUrl = dealImage? dealImage.url() : null;
	if (dealImageUrl) {
		// This is because parse does not server https url to its files.
		// See for reference: http://hackingtheimpossible.com/quick-tip-serve-parse-files-via-https/
		deal.dealImageUrl = dealImageUrl.replace("http://", "https://s3.amazonaws.com/")
	}
	else {
		deal.dealImageUrl = null;
	}
	deal.description = parseDeal.get('description');
	deal.email = parseDeal.get('email');
	deal.phoneNumber = parseDeal.get('phoneNumber');
	deal.unitName = parseDeal.get('unitName');
	deal.unitPrice = parseDeal.get('unitPrice');
	deal.createdAt = parseDeal.createdAt;
	deal.creatorName = parseDeal.get('creatorName');
	deal.pickupOptions = parseDeal.get('pickupOptions');
	deal.regionId = parseDeal.get('regionId');
	deal.unitsPerPackage = parseDeal.get('unitsPerPackage');
	deal.status = parseDeal.get('status');
	var creator = parseDeal.get('createdBy');
	deal.creatorId = creator.id;
	deal.type = type;
	return deal;
};