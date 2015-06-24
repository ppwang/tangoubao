var dealModel = require('cloud/tuangoubao/deal');
var ParseDeal = Parse.Object.extend('Deal');

module.exports.getDeals = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		return res.status(401).send();
	}

	var query = new Parse.Query(ParseDeal);
    query.equalTo('createdBy', currentUser);
    return query.find()
    .then( function(parseDeals) {
    	// Collect one promise for each save into an array.
    	console.log('found deals: ' + JSON.stringify(parseDeals));
		var deals = [];
		parseDeals.forEach(function(parseDeal) {
			console.log('owned parseDeal');
			var deal = dealModel.convertToDealModel(parseDeal);
			console.log('Convert parseDeal to: ' + JSON.stringify(deal));
			deals.push(deal);
		});
		return res.status(200).send(JSON.stringify(deals));
    }, function(error) {
    	console.log('error is: ' + JSON.stringify(error));
    	return res.status(500).end();
    });
};