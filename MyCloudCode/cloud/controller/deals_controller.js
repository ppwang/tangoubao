var Deal = Parse.Object.extend('Deal');

module.exports.getDeals = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		return res.status(401).send();
	}

	var query = new Parse.Query(Deal);
    query.equalTo('createdBy', currentUser);
    return query.find()
    .then( function(deals) {
    	// Collect one promise for each save into an array.
    	console.log('found deals: ' + JSON.stringify(deals));
		var dealModels = [];
		deals.forEach(function(deal) {
			console.log('owned deal');
			var dealModel = convertFrom(deal);
			dealModels.push(dealModel);
		});
		return res.status(200).send(dealModels);
    }, function(error) {
    	console.log('error is: ' + JSON.stringify(error));
    	return res.status(500).end();
    });
};

// Convert from backend (Parse) deal model to data frontend consumes
var convertFrom = function(deal) {
	var dealModel = {};
	dealModel.id = deal.id;
	dealModel.name = deal.get('name');
	dealModel.subtitle = deal.get('subtitle');
	dealModel.beginDate = deal.get('beginDate');
	dealModel.endDate = deal.get('endDate');
	var dealImage = deal.get('dealImage');
	dealModel.dealImgeUrl = dealImage? dealImage.url() : null;
	dealModel.detailedDescription = deal.get('detailedDescription');
	dealModel.email = deal.get('email');
	dealModel.phoneNumber = deal.get('phoneNumber');
	dealModel.unitName = deal.get('unitName');
	dealModel.unitPrice = deal.get('unitPrice');
	dealModel.createdAt = deal.get('createdAt');
	dealModel.type = 'own';
	return dealModel;
}