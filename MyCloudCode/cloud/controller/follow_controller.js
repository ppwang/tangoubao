var ParseFollowDeal = Parse.Object.extend('FollowDeal');
var ParseFollowUser = Parse.Object.extend('FollowUser');
var ParseDeal = Parse.Object.extend('Deal');
var logger = require('cloud/lib/logger');

module.exports.followDeal = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
    logger.debugLog('followDeal log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
        logger.logDiagnostics(correlationId, 'error', 'followDeal error (401): user not logged in.');
		return res.status(401).send(responseError);
	}

	var dealId = req.params.dealId;
	if (!dealId) {
		// not found
        logger.logDiagnostics(correlationId, 'error', 'followDeal error (404): dealId not provided in request');
		return res.status(404).send(responseError);
	}
	var query = new Parse.Query(ParseFollowDeal);
    logger.debugLog('followDeal log. follow dealId:' + dealId + ' by userId: ' + currentUser.id);
    query.equalTo('dealId', dealId);
    query.equalTo('followerId', currentUser.id);
    return query.first()
    	.then(function(parseFollowDeal) {
    		if (parseFollowDeal) {
    			// If there is already a followDeal, we will return false and do not proceed further.
    			return false;
    		}
    		return true;
    	})
    	.then(function(proceed) {
    		if (proceed) {
    			var parseFollowDeal = new ParseFollowDeal();
    			parseFollowDeal.set('dealId', dealId);
    			parseFollowDeal.set('followerId', currentUser.id);
    			return parseFollowDeal.save();
    		}
    		return;
    	})
    	.then(function(parseFollowDeal) {
    		if (parseFollowDeal) {
    			var parseDealPromise = new ParseDeal();
    			parseDealPromise.id = dealId;
    			return parseDealPromise.fetch();
    		}
    		return;
    	})
    	.then(function(parseDeal) {
    		if (!parseDeal) {
    			return;
    		}

    		var followCount = parseDeal.get('followCount');
			if (followCount || followCount == 0) {
				followCount++;
			}
			else {
				followCount = 0;
			}
			parseDeal.set('followCount', followCount);
            logger.debugLog('followDeal log. set followCount: ' + followCount);
			return parseDeal.save(null, {useMasterKey: true});
    	})
    	.then(function(savedDeal) {
    		return res.status(200).end();
    	}, function(error) {
            var errorMessage = 'followDeal error: ' + JSON.stringify(error);
            logger.debugLog(errorMessage);
            logger.logDiagnostics(correlationId, 'error', errorMessage);
    		return res.status(500).send(responseError);
    	});
};

module.exports.unfollowDeal = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
    logger.debugLog('unfollowDeal log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
        logger.logDiagnostics(correlationId, 'error', 'unfollowDeal error: user not logged in');
		return res.status(401).send(responseError);
	}

	var dealId = req.params.dealId;
	if (!dealId) {
		// not found
        logger.logDiagnostics(correlationId, 'error', 'unfollowDeal error: dealId not provided in request');
		return res.status(404).send(responseError);
	}
	var query = new Parse.Query(ParseFollowDeal);
    logger.debugLog('unfollowDeal log. dealId: ' + dealId + ' by userId: ' + currentUser.id);
    query.equalTo('dealId', dealId);
    query.equalTo('followerId', currentUser.id);
    return query.first()
    	.then(function(parseFollowDeal) {
    		if (parseFollowDeal) {
    			return parseFollowDeal.destroy({});
    		}
    		return;
    	})
    	.then(function(deletedFollowDeal) {
    		if (deletedFollowDeal) {
    			var parseDealPromise = new ParseDeal();
    			parseDealPromise.id = dealId;
    			return parseDealPromise.fetch();
    		}
    		return;
    	})
    	.then(function(parseDeal) {
    		if (!parseDeal) {
    			return;
    		}
    		var followCount = parseDeal.get('followCount');
			if (followCount) {
				followCount = 0;
			}
			else {
				followCount--;
			}
            if (followCount < 0) {
                followCount = 0;
            }
			parseDeal.set('followCount', followCount);
            logger.debugLog('unfollowDeal log. set followCount: ' + followCount);
			return parseDeal.save(null, {useMasterKey: true});
    		
    	})
    	.then(function(savedDeal) {
    		return res.status(200).end();
    	}, function(error) {
            var errorMessage = 'unfollowDeal error: ' + JSON.stringify(error);
            logger.debugLog(errorMessage);
            logger.logDiagnostics(correlationId, 'error', errorMessage);
    		return res.status(500).send(responseError);
    	});
};

module.exports.followUser = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
    logger.debugLog('followUser log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
        logger.logDiagnostics(correlationId, 'error', 'followUser error (401): user not logged in');
		return res.status(401).send(responseError);
	}

	var userId = req.params.userId;
	if (!userId) {
		// not found
        logger.logDiagnostics(correlationId, 'error', 'userId not provided in request');
		return res.status(404).send(responseError);
	}

	var query = new Parse.Query(ParseFollowUser);
	query.equalTo('userId', userId);
	query.equalTo('followerId', currentUser.id);
	return query.first()
		.then(function(parseFollowUser) {
			if (parseFollowUser) {
				// If there is already a followUser, we will return false and do not proceed further.
    			return false;
    		}
    		return true;
    	})
    	.then(function(proceed) {
    		if (proceed) {
    			var parseFollowUser = new ParseFollowUser();
    			parseFollowUser.set('userId', userId);
    			parseFollowUser.set('followerId', currentUser.id);
    			return parseFollowUser.save();
    		}
    		return;
    	})
    	.then(function() {
    		return res.status(200).end();
    	}, function(error) {
            var errorMessage = 'followUser error: ' + JSON.stringify(error);
            logger.debugLog(errorMessage);
            logger.logDiagnostics(correlationId, 'error', errorMessage);
    		return res.status(500).send(responseError);
    	});
};

module.exports.unfollowUser = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
    logger.debugLog('unfollowUser log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
        logger.logDiagnostics(correlationId, 'error', 'unfollowUser error (401): user not logged in');
		return res.status(401).send(responseError);
	}

	var userId = req.params.userId;
	if (!userId) {
		// not found
        var errorMessage = 'unfollowUser error: no userId provided from request'; 
        logger.debugLog(errorMessage);
        logger.logDiagnostics(correlationId, 'error', errorMessage);
		return res.status(404).send(responseError);
	}

	var query = new Parse.Query(ParseFollowUser);
	query.equalTo('userId', userId);
	query.equalTo('followerId', currentUser.id);

	return query.first()
		.then(function(parseFollowUser) {
			if (parseFollowUser) {
				return parseFollowUser.destroy({});
			}
			return;
		})
		.then(function() {
    		return res.status(200).end();
    	}, function(error) {
            var errorMessage = 'unfollowUser error: ' + JSON.stringify(error);
            logger.debugLog(errorMessage);
            logger.logDiagnostics(correlationId, 'error', errorMessage);
    		return res.status(500).send(responseError);
    	});
};