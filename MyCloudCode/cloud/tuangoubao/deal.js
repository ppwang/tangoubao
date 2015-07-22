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
	deal.orderCount = parseDeal.get('orderCount');
	deal.followCount = parseDeal.get('followCount');
	deal.status = parseDeal.get('status');
	var creator = parseDeal.get('createdBy');
	deal.creatorId = creator.id;
	deal.type = type;
	return deal;
};

module.exports.isValidOrder = function(dealModel, orderDate) {
	console.log('check valid order: ' + JSON.stringify(dealModel));
	console.log('deal status: ' + dealModel.status);
	console.log('order date: ' + orderDate);
	if (dealModel.status == 'closed') {
		console.log('invalid due to status');
		return false;
	}
	var endDate = dealModel.endDate;
	if (endDate) {
		// TBD: Only date (no time) compare?
		console.log('orderDate: ' + orderDate.getFullYear() + '/' + orderDate.getMonth() + '/' + orderDate.getDate());
		console.log('endDate: ' + endDate.getFullYear() + '/' + endDate.getMonth() + '/' + endDate.getDate());
		if (orderDate.getFullYear() == endDate.getFullYear() 
			&& orderDate.getMonth() == endDate.getMonth()
			&& orderDate.getDate() == endDate.getDate()) {
			return true;
		}
		return orderDate <= endDate;
	}
	return true;
};