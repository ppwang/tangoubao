var dealModel = require('cloud/tuangoubao/deal');
var ParseDeal = Parse.Object.extend('Deal');
var ParseFollowDeal = Parse.Object.extend('FollowDeal');
var ParseOrder = Parse.Object.extend('Order');
var logger = require('cloud/lib/logger');

module.exports.getPublicDeals = function(req, res) {
	var correlationId = logger.newCorrelationId();
	var responseError = {correlationId: correlationId};

	var query = new Parse.Query(ParseDeal);
	// we are sorting the results by creation date
	query.addDescending('createdAt');
	return query.find()
    	.then(function(parseDeals) {
    		logger.debugLog('getPublicDeals log. parseDeals: ' + JSON.stringify(parseDeals));
    		var deals = [];

    		parseDeals.forEach(function(parseDeal) {
				var deal = dealModel.convertToDealModel(parseDeal, null);
				logger.debugLog('getPublicDeals log. Convert parseDeal to: ' + JSON.stringify(deal));
				deals.push(deal);
			});

			return deals;
    	})
    	.then(function(deals) {
    		var responseData = {};
			responseData.deals = deals;
			return res.status(200).send(JSON.stringify(responseData));
	    }, function(error) {
	    	var errorMessage = 'getPublicDeals error: ' + JSON.stringify(error);
	    	logger.debugLog(errorMessage);
	    	logger.logDiagnostics(correlationId, 'error', errorMessage);
	    	return res.status(500).send(responseError);
	    });
}

module.exports.getDeals = function(req, res) {
	var correlationId = logger.newCorrelationId();
	var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
	logger.debugLog('getDeals log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		logger.logD(correlationId, 'error', 'getDeals error (401): user logged in.');
		return res.status(401).send(responseError);
	}

	var promises = [
		getOwnedDeals(currentUser),
		getFollowedDeals(currentUser),
		getOrderedDeals(currentUser)
	];

	return Parse.Promise.when(promises)
		.then(function(ownedDeals, followedDeals, orderedDeals) {
			var deals = [];

			logger.debugLog('getDeals log. ownedDeals: ' + JSON.stringify(ownedDeals));
			logger.debugLog('getDeals log. followedDeals: ' + JSON.stringify(followedDeals));
			logger.debugLog('getDeals log. orderedDeals: ' + JSON.stringify(orderedDeals));
			
			ownedDeals.forEach(function(ownedDeal) {
				var deal = dealModel.convertToDealModel(ownedDeal, 'own');
				logger.debugLog('getDeals log. ownedDeals: Convert parseDeal to: ' + JSON.stringify(deal));
				deals.push(deal);
			});

			followedDeals.forEach(function(followedDeal) {
				var deal = dealModel.convertToDealModel(followedDeal, 'follow');
				logger.debugLog('getDeals log. ownedDeals: Convert parseDeal to: ' + JSON.stringify(deal));
				deals.push(deal);
			});

			orderedDeals.forEach(function(orderedDeal) {
				var deal = dealModel.convertToDealModel(orderedDeal, 'order');
				logger.debugLog('getDeals log. ownedDeals: Convert parseDeal to: ' + JSON.stringify(deal));
				deals.push(deal);
			});

			return deals;
		})
		.then(function(allDeals) {
			var responseData = {};
			responseData.deals = allDeals;
			return res.status(200).send(JSON.stringify(responseData));
	    }, function(error) {
	    	var errorMessage = 'getDeals error: ' + JSON.stringify(error);
	    	logger.debugLog(errorMessage);
	    	logger.logDiagnostics(correlationId, 'error', errorMessage);
	    	return res.status(500).send(errorMessage);
	    });
};

var getOwnedDeals = function(currentUser) {
	logger.debugLog('getOwnedDeals log.');
	var query = new Parse.Query(ParseDeal);
    query.equalTo('createdBy', currentUser);
    return query.find()
    	.then(function(parseDeals) {
    		logger.debugLog('getOwnedDeals log. parseDeals: ' + JSON.stringify(parseDeals));
    		return parseDeals;
    	});
};

var getFollowedDeals = function(currentUser) {
	logger.debugLog('getfollowdDeals log.');
	var query = new Parse.Query(ParseFollowDeal);
	query.equalTo('followerId', currentUser.id);
	return query.find()
		.then(function(parseFollowDeals) {
			var promises = [];
			parseFollowDeals.forEach(function(parseFollowDeal) {
				var dealId = parseFollowDeal.get('dealId');
				logger.debugLog('getfollowdDeals log. Fetching dealId: ' + dealId);
				var followedDeal = new ParseDeal();
				followedDeal.id = dealId;
				promises.push(followedDeal.fetch());
			});
			return Parse.Promise.when(promises);
		})
		.then(function() {
			logger.debugLog('getfollowdDeals log. arguments: ' + arguments);
			var followedDeals = [];
			for(var i=0; i<arguments.length; i++) {
				var followedDeal = arguments[i];
				logger.debugLog('getfollowdDeals log. argument followed deal: ' + JSON.stringify(followedDeal));
				followedDeals.push(followedDeal);
			}
			logger.debugLog('getfollowdDeals log. Return followed deals: ' + JSON.stringify(followedDeals));
			return followedDeals;
		});
};

var getOrderedDeals = function(currentUser) {
	logger.debugLog('getOrderedDeals log.');
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