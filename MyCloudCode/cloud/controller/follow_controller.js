var ParseFollowDeal = Parse.Object.extend('FollowDeal');
var ParseFollowUser = Parse.Object.extend('FollowUser');
var ParseDeal = Parse.Object.extend('Deal');

module.exports.followDeal = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		return res.status(401).send();
	}

	var dealId = req.params.dealId;
	if (!dealId) {
		// not found
		return res.status(404).end();
	}
	var query = new Parse.Query(ParseFollowDeal);
	console.log('follow dealId:' + dealId + ' by userId: ' + currentUser.id);
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
			console.log('set followCount: ' + followCount);
			return parseDeal.save(null, {useMasterKey: true});
    	})
    	.then(function(savedDeal) {
    		return res.status(200).end();
    	}, function(error) {
    		console.log('Follow deal error: ' + JSON.stringify(error));
    		return res.status(500).end();
    	});
};

module.exports.unfollowDeal = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		return res.status(401).send();
	}

	var dealId = req.params.dealId;
	if (!dealId) {
		// not found
		return res.status(404).end();
	}
	var query = new Parse.Query(ParseFollowDeal);
	console.log('unfollow dealId:' + dealId + ' by userId: ' + currentUser.id);
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
			parseDeal.set('followCount', followCount);
			console.log('set followCount: ' + followCount);
			return parseDeal.save(null, {useMasterKey: true});
    		
    	})
    	.then(function(savedDeal) {
    		return res.status(200).end();
    	}, function(error) {
    		console.log('Delete followDeal error: ' + JSON.stringify(error));
    		return res.status(500).end();
    	});
};

module.exports.followUser = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		return res.status(401).send();
	}

	var userId = req.params.userId;
	if (!userId) {
		// not found
		return res.status(404).end();
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
    		console.log('Follow user error: ' + JSON.stringify(error));
    		return res.status(500).end();
    	});
};

module.exports.unfollowUser = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		return res.status(401).send();
	}

	var userId = req.params.userId;
	if (!userId) {
		// not found
		return res.status(404).end();
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
    		console.log('Delete followUser error: ' + JSON.stringify(error));
    		return res.status(500).end();
    	});
};