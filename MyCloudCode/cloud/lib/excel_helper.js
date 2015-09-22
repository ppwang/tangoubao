var logger = require('cloud/lib/logger');

// Deal type is in the following format:
//    deal = {id, name, beginDate, endDate, dealBannerUrl, description, email, phoneNumber, unitName, unitPrice, 
//         unitsPerPackage, creatorName, regionId
//         , orders }
//     orders = [ order ]
//     order = {orderAmount, orderTime, orderAmount, pickupOption, buyer}
//	   pickupOption = {id, address, contactName, phoneNumber}
//	   buyer = {id, username, nickname, email, phoneNumber, headimgurl}

var separator = '\t';
module.exports.exportDealToExcel = function (dealData) {
	// TODO: convert to xlsx later. For now, use csv for simplicity
	var result = '';
	
	// Header section
	result += 'Deal Summary: \n';
	result += 'Name' + separator 
		+ 'Description' + separator
		+ 'Price' + separator
		+ 'Package\n';
	result +=  escapeStr(dealData.name) + separator 
		+ escapeStr(dealData.description) + separator 
		+ '$' + dealData.unitPrice + separator
		+ dealData.unitsPerPackage + ' ' + escapeStr(dealData.unitName) + '\n';

	logger.debugLog('exportDealToExcel log. unitPrice: ' + dealData.unitPrice + ' escapeStr: ' + escapeStr(dealData.unitPrice));

	result += '\n';
	result += '\n';

	if (dealData.orders && dealData.orders.forEach && dealData.orders.length > 0) {
		// Orders section
		result += 'Orders Summary: \n';
		result += 'Order time' + separator
			+ 'Order Id' + separator
			+ 'Name' + separator 
			+ 'PhoneNumber' + separator
			+ 'Email' + separator
			+ 'Pickup contact' + separator
			+ 'Pickup address' + separator
			+ 'Pickup phone' + separator
			+ 'Quantity' + separator
			+ 'Price' + separator
			+ 'Order status\n';

		dealData.orders.forEach(function(order) {
			var buyer = order.buyer;
			var pickupOption = order.pickupOption;
			var dateString = getDateString(order.orderTime);
			result += escapeStr(dateString) + separator
				+ order.id + separator
				+ escapeStr(buyer.nickname) + separator
				+ buyer.phoneNumber + separator
				+ escapeStr(buyer.email) + separator
				+ escapeStr(pickupOption.contactName) + separator
				+ escapeStr(pickupOption.address) + separator
				+ escapeStr(pickupOption.phoneNumber) + separator
				+ escapeStr(order.quantity.toString()) + separator
				+ escapeStr(order.price.toString()) + separator
				+ escapeStr(order.status) + '\n';
		});
	}
	else {
		result += 'No order for this deal yet!\n';
	}

	return result;
}

var getDateString = function(dateTime) {
	if (!dateTime) {
		return '';
	}
	var yyyy = dateTime.getFullYear().toString();
    var mm = (dateTime.getMonth()+1).toString(); // getMonth() is zero-based
   	var dd  = dateTime.getDate().toString();
   	return yyyy + '/' + (mm[1]?mm:mm[0]) + '/' + (dd[1]?dd:dd[0]); // padding
}

var escapeStr = function(value) {

	if (!value) {
		return '';
	}
	if (!value.replace) {
		return value;
	}
	return value.replace('/\t/g', '    ');
}