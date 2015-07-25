var WechatUser = Parse.Object.extend('WechatUser');
var _ = require('underscore');
var currentUser;

Parse.Cloud.beforeSave(Parse.User, function(request, response) {
	Parse.Cloud.useMasterKey();
	currentUser = request.object;
	// workaround for master save path also going through before save
	var masterRequest = currentUser.get('masterRequest');
	var bypassClaim = currentUser.get('bypassClaim');
	if (masterRequest) {
		currentUser.set('masterRequest', undefined);
		return response.success();
	}

	if (bypassClaim) {
		currentUser.set('bypassClaim', undefined);
		return response.success();
	}

	if (!currentUser) {
		console.log('Current user is null:' + JSON.stringify(currentUser));
		return response.error();
	}
	currentUser.wechatId = currentUser.get('wechatId');
	currentUser.claimtoken = currentUser.get('claimtoken');

	console.log('Current user is new: ' + currentUser.isNew() + ' data: ' + JSON.stringify(currentUser));
	if ( !currentUser.wechatId && !currentUser.claimtoken ) {
		console.log('Save normal login/signup user: ' + JSON.stringify(currentUser));
		return response.success()
	}
	if ( !currentUser.wechatId || !currentUser.claimtoken ) {
		console.log('Wrong url with missing wechatId/claimtoken: ' + JSON.stringify(currentUser));
		return response.error()
	}

	var query = new Parse.Query(WechatUser);
	console.log('claimtoken: ' + currentUser.claimtoken);
	console.log('wechatId:' + currentUser.wechatId);
    query.equalTo('wechatId', currentUser.wechatId);
    
    return query.first()
    .then( function(wechatUser) {
    	console.log('Current user is: ' + JSON.stringify(currentUser)); 
		var currentUserName = currentUser.get('username');
    	if (!wechatUser) {
        	throw new Error('User ' + currentUserName + ' is claiming wrong wechatUser. Request wechatId: ' 
        		+ currentUser.wechatId + '; request claimtoken: ' + currentUser.claimtoken);
    	}
    	else {
			var wechatUserClaimtoken = wechatUser.get('claimtoken');
			if (wechatUserClaimtoken != currentUser.claimtoken) {
				throw new Error('User ' + currentUserName + ' is using wrong claimtoken. Request claimtoken: ' 
        		+ currentUser.claimtoken + '; wechatUser claimtoken: ' + wechatUserClaimtoken);
			}

	    	console.log('wechatUser is: ' + JSON.stringify(wechatUser)); 
	        wechatUser.set('status', 'active');
	        // Check the action this change is coming from. If for signup, we do not remove the claim token 
	        //  since we are still waiting for login after email verified.
	        // It is weird: parse only change the field if you set it to be 'null'
	        var action = currentUser.get('action');
	        if (action != 'signUp') {
		        wechatUser.set('claimtoken', null);
		        currentUser.set('claimtoken', null);
		    }
	        // Add wechatUser image to user image
	        var headimgurl = wechatUser.get('headimgurl');
	        if (headimgurl) {
		        currentUser.set('headimgurl', headimgurl);
		    }
		    var nickname = wechatUser.get('nickname');
		    if (nickname) {
		    	currentUser.set('nickname', nickname);
		    }
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
	        // It is weird: parse only change the field if you set it to be 'null'
			claimedUser.set('wechatId', null);
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

module.exports.convertToUserModel = function(parseUser) {
	var user = {};
	user.id = parseUser.id;
    user.username = parseUser.get('username');
    user.nickname = parseUser.get('nickname');
    user.email = parseUser.get('email');
    user.phoneNumber = parseUser.get('phoneNumber');
    user.headimgurl = parseUser.get('headimgurl');
    return user;
};