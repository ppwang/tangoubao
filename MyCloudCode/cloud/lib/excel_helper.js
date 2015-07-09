
// Deal type is in the following format:
//    deal = {id, name, beginDate, endDate, dealImageUrl, description, email, phoneNumber, unitName, unitPrice, 
//         unitsPerPackage, creatorName, regionId
//         , orders }
//     orders = [ order ]
//     order = {orderAmount, orderTime, orderAmount, pickupOption, buyer}
//	   pickupOption = {id, address, contactName, phoneNumber}
//	   buyer = {id, username, nickname, email, phone, headimgurl}
module.exports.exportDealToExcel = function (dealData) {
	// TODO: convert to xlsx later. For now, use csv for simplicity
	var result = '';
	
	// Header section
	result += 'Deal Summary: \n';
	result += 'Name,Description,Price,Package (' + dealData.unitName + ')\n';
	result +=  dealData.name + ',' + dealData.description + ',' 
		+ dealData.unitPrice + '/' + dealData.unitName + ',' 
		+ dealData.unitsPerPackage + ' ' + dealData.unitName + '\n';

	result += '\n';
	result += '\n';

	if (dealData.orders && dealData.orders.constructor === Array) {
		// Orders section
		result += 'Orders Summary: \n';
		result += 'Name,Phone,Email,Pickup contact,Pickup address,Pickup phone\n';
		dealData.orders.forEach(function(order) {
			var buyer = order.buyer;
			var pickupOption = order.pickupOption;
			result += buyer.nickname + ',' + buyer.phone + ',' + buyer.email + ',' 
				+ pickupOption.contactName + ',' + pickupOption.address + ',' + pickupOption.phoneNumber + '\n';
		});
	}
	else {
		result += 'No order for this deal yet!\n';
	}

	return result;
}