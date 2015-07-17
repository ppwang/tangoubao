
// Deal type is in the following format:
//    deal = {id, name, beginDate, endDate, dealImageUrl, description, email, phoneNumber, unitName, unitPrice, 
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
		+ 'Package (' + dealData.unitName + ')\n';
	result +=  escapeStr(dealData.name) + separator 
		+ escapeStr(dealData.description) + separator 
		+ escapeStr(dealData.unitPrice) + separator 
		+ escapeStr(dealData.unitName) + separator 
		+ escapeStr(dealData.unitsPerPackage) + ' ' + escapeStr(dealData.unitName) + '\n';

	result += '\n';
	result += '\n';

	console.log('order constructor: ' + dealData.orders.forEach);
	console.log('orders: ' + JSON.stringify(dealData.orders));
	if (dealData.orders && dealData.orders.forEach) {
		// Orders section
		result += 'Orders Summary: \n';
		result += 'Name' + separator 
			+ 'PhoneNumber' + separator
			+ 'Email' + separator
			+ 'Pickup contact=' + separator
			+ 'Pickup address' + separator
			+ 'Pickup phone\n';
		dealData.orders.forEach(function(order) {
			var buyer = order.buyer;
			var pickupOption = order.pickupOption;
			result += escapeStr(buyer.nickname) + separator 
				+ escapeStr(buyer.phoneNumber) + separator
				+ escapeStr(buyer.email) + separator
				+ escapeStr(pickupOption.contactName) + separator
				+ escapeStr(pickupOption.address) + separator
				+ escapeStr(pickupOption.phoneNumber) + '\n';
		});
	}
	else {
		result += 'No order for this deal yet!\n';
	}

	return result;
}

var escapeStr = function(value) {
	if (!value || !value.replace) {
		return value;
	}
	return value.replace('/\t/g', '    ');
}