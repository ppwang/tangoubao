var dealModel = require('cloud/tuangoubao/deal');
var ParseDeal = Parse.Object.extend('Deal');
var ParseFollowDeal = Parse.Object.extend('FollowDeal');
var ParseOrder = Parse.Object.extend('Order');

module.exports.getPublicDeals = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		return res.status(401).send();
	}

	var query = new Parse.Query(ParseDeal);
	// we are sorting the results by creation date
	query.addDescending('createdAt');
	return query.find()
    	.then(function(parseDeals) {
    		console.log('parseDeals: ' + JSON.stringify(parseDeals));
    		var deals = [];

    		parseDeals.forEach(function(parseDeal) {
				var deal = dealModel.convertToDealModel(parseDeal, null);
				console.log('Convert parseDeal to: ' + JSON.stringify(deal));
				deals.push(deal);
			});

			return deals;
    	})
    	.then(function(deals) {
    		var responseData = {};
			responseData.deals = deals;
			return res.status(200).send(JSON.stringify(responseData));
	    }, function(error) {
	    	console.log('error is: ' + JSON.stringify(error));
	    	return res.status(500).end();
	    });
}

module.exports.getDeals = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		return res.status(401).send();
	}

	var promises = [
		getOwnedDeals(currentUser),
		getFollowedDeals(currentUser),
		getOrderedDeals(currentUser)
	];

	return Parse.Promise.when(promises)
		.then(function(ownedDeals, followedDeals, orderedDeals) {
			var deals = [];

			console.log('ownedDeals: ' + JSON.stringify(ownedDeals));
			console.log('followedDeals: ' + JSON.stringify(followedDeals));
			console.log('orderedDeals: ' + JSON.stringify(orderedDeals));
			
			ownedDeals.forEach(function(ownedDeal) {
				var deal = dealModel.convertToDealModel(ownedDeal, 'own');
				console.log('Convert parseDeal to: ' + JSON.stringify(deal));
				deals.push(deal);
			});

			followedDeals.forEach(function(followedDeal) {
				var deal = dealModel.convertToDealModel(followedDeal, 'follow');
				console.log('Convert parseDeal to: ' + JSON.stringify(deal));
				deals.push(deal);
			});

			orderedDeals.forEach(function(orderedDeal) {
				var deal = dealModel.convertToDealModel(orderedDeal, 'order');
				console.log('Convert parseDeal to: ' + JSON.stringify(deal));
				deals.push(deal);
			});

			return deals;
		})
		.then(function(allDeals) {
			var responseData = {};
			responseData.deals = allDeals;
			return res.status(200).send(JSON.stringify(responseData));
	    }, function(error) {
	    	console.log('error is: ' + JSON.stringify(error));
	    	return res.status(500).end();
	    });
};

var getOwnedDeals = function(currentUser) {
	console.log('get owned deals');
	var query = new Parse.Query(ParseDeal);
    query.equalTo('createdBy', currentUser);
    return query.find()
    	.then(function(parseDeals) {
    		console.log('parseDeals: ' + JSON.stringify(parseDeals));
    		return parseDeals;
    	});
};

var getFollowedDeals = function(currentUser) {
	console.log('get followed deals');
	var query = new Parse.Query(ParseFollowDeal);
	query.equalTo('followerId', currentUser.id);
	return query.find()
		.then(function(parseFollowDeals) {
			var promises = [];
			parseFollowDeals.forEach(function(parseFollowDeal) {
				var dealId = parseFollowDeal.get('dealId');
				console.log('to fetch deal id: ' + dealId);
				var followedDeal = new ParseDeal();
				followedDeal.id = dealId;
				promises.push(followedDeal.fetch());
			});
			return Parse.Promise.when(promises);
		})
		.then(function() {
			console.log('arguments: ' + arguments);
			var followedDeals = [];
			for(var i=0; i<arguments.length; i++) {
				var followedDeal = arguments[i];
				console.log('argument followed deal: ' + JSON.stringify(followedDeal));
				followedDeals.push(followedDeal);
			}
			console.log('return followed deals: ' + JSON.stringify(followedDeals));
			return followedDeals;
		});
};

var getOrderedDeals = function(currentUser) {
	console.log('get ordered deals');
	var query = new Parse.Query(ParseOrder);
	query.equalTo('creatorId', currentUser.id);
	return query.find()
		.then(function(parseOrders) {
			var promises = [];
			parseOrders.forEach(function(parseOrder) {
				var dealId = parseOrder.get('dealId');
				var orderedDeal = new ParseDeal();
				orderedDeal.id = dealId;
				promises.push(orderedDeal.fetch());
			});
			return Parse.Promise.when(promises);
		})
		.then(function() {
			var orderedDeals = [];
			for(var i=0; i<arguments.length; i++) {
				var orderedDeal = arguments[i];
				orderedDeals.push(orderedDeal);
			}
			return orderedDeals;
		});
};