var WechatUser = Parse.Object.extend('WechatUser');
var _ = require('underscore');
var currentUser;

Parse.Cloud.beforeSave(Parse.User, function(request, response) {
	Parse.Cloud.useMasterKey();
	currentUser = request.object;
	// workaround for master save path also going through before save
	var masterRequest = currentUser.get('masterRequest');
	if (typeof masterRequest !== 'undefined') {
		currentUser.set('masterRequest', undefined);
		return response.success();
	}

	if (typeof currentUser === 'undefined') {
		console.log('Current user is undefined:' + JSON.stringify(currentUser));
		return response.error();
	}
	currentUser.wechatId = currentUser.get('wechatId');
	currentUser.claimtoken = currentUser.get('claimtoken');

	console.log('Current user is new: ' + currentUser.isNew() + ' data: ' + JSON.stringify(currentUser));
	if ( (typeof currentUser.wechatId === 'undefined') && (typeof currentUser.claimtoken === 'undefined') ) {
		console.log('Save normal login/signup user: ' + JSON.stringify(currentUser));
		return response.success()
	}
	if ( (typeof currentUser.wechatId === 'undefined') || (typeof currentUser.claimtoken === 'undefined') ) {
		console.log('Wrong url with missing wechatId/claimtoken: ' + JSON.stringify(currentUser));
		return response.error()
	}

	var query = new Parse.Query(WechatUser);
	console.log('claimtoken: ' + currentUser.claimtoken);
	console.log('wechatId:' + currentUser.wechatId);
    query.equalTo('wechatId', currentUser.wechatId);
    query.equalTo('claimtoken', currentUser.claimtoken);
    return query.first()
    .then( function(wechatUser) {
    	console.log('Current user is: ' + JSON.stringify(currentUser)); 
		var currentUserName = currentUser.get('username');
    	if (typeof wechatUser === 'undefined') {
        	throw new Error('User ' + currentUserName + ' is claiming wrong wechatUser. Request wechatId: ' 
        		+ currentUser.wechatId + '; request claimtoken: ' + currentUser.claimtoken);
    	}
    	else {
	    	console.log('wechatUser is: ' + JSON.stringify(wechatUser)); 
	        wechatUser.set('status', 'active');
	        wechatUser.set('claimtoken', undefined);
	        return wechatUser.save();
	    }
    })
    .then( function(wechatUser) {
    	// remove any existing user who already claimed the same wechat user
    	var userQuery = new Parse.Query(Parse.User);
    	userQuery.equalTo('wechatId', currentUser.wechatId);
    	userQuery.notEqualTo('username', currentUser.get('username'));
    	console.log('query: wechatId: ' + currentUser.wechatId + '; username: ' + currentUser.get('username'));
    	return userQuery.find();
    })
    .then( function(claimedUsers) {
    	// Collect one promise for each save into an array.
    	console.log('claimedUsers: ' + JSON.stringify(claimedUsers));
		var promises = [];
		_.each(claimedUsers, function(claimedUser) {
			console.log('saving claimedUser');
			claimedUser.set('wechatId', undefined);
			claimedUser.set('masterRequest', 'true');
			console.log('claimedUser: ' + JSON.stringify(claimedUser));
			promises.push(claimedUser.save());
		});
		return Parse.Promise.when(promises);
    })
    .then( function() {
    	if (!currentUser.existed()) {
			console.log('User sign up');
		}
		else {
			console.log('User modify');
		}
    	return response.success();
    }, function(error) {
    	console.error('Sign up with new claim token error: ' + JSON.stringify(error));
    	return response.error();
    });
});