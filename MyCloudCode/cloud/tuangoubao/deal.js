var ParseDeal = Parse.Object.extend('Deal');
var logger = require('cloud/lib/logger');

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
	deal.originalUnitPrice = parseDeal.get('originalUnitPrice');
	deal.quantityLimit = parseDeal.get('quantityLimit');
	deal.totalQuantityLimit = parseDeal.get('totalQuantityLimit');
	deal.createdAt = parseDeal.createdAt;
	deal.creatorName = parseDeal.get('creatorName');
	deal.pickupOptions = parseDeal.get('pickupOptions');
	deal.regionId = parseDeal.get('regionId');
	deal.unitsPerPackage = parseDeal.get('unitsPerPackage');
	deal.orderCount = parseDeal.get('orderCount');
	deal.orderQuantity = parseDeal.get('orderQuantity');
	deal.followCount = parseDeal.get('followCount');
	deal.status = parseDeal.get('status');
	var creator = parseDeal.get('createdBy');
	deal.creatorId = creator.id;
	deal.type = type;
	deal.featured = parseDeal.get('featured');
	return deal;
};

module.exports.isValidOrder = function(dealModel, orderDate) {
	logger.debugLog('isValidOrder log. check valid order: ' + JSON.stringify(dealModel));
	logger.debugLog('isValidOrder log. deal status: ' + dealModel.status);
	logger.debugLog('isValidOrder log. order date: ' + orderDate);
	if (dealModel.status == 'closed') {
		logger.debugLog('isValidOrder log. invalid due to status');
		return false;
	}
	var endDate = dealModel.endDate;
	if (endDate) {
		logger.debugLog('isValidOrder log. orderDate: ' + orderDate.getFullYear() + '/' + orderDate.getMonth() + '/' + orderDate.getDate());
		logger.debugLog('isValidOrder log. endDate: ' + endDate.getFullYear() + '/' + endDate.getMonth() + '/' + endDate.getDate());
		if (orderDate.getFullYear() == endDate.getFullYear() 
			&& orderDate.getMonth() == endDate.getMonth()
			&& orderDate.getDate() == endDate.getDate()) {
			return true;
		}
		return orderDate <= endDate;
	}
	return true;
};

module.exports.withinTotalQuantityLimit = function(dealModel, quantity) {
	logger.debugLog('withinTotalQuantityLimit log. dealModel: ' + JSON.stringify(dealModel));
	logger.debugLog('withinTotalQuantityLimit log. quantity: ' + quantity);
	var total = dealModel.orderQuantity + quantity;
	logger.debugLog('withinTotalQuantityLimit log. total: ' + total);
	if (total > dealModel.totalQuantityLimit) {
		return false;
	}
	return true;
};