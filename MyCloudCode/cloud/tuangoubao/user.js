var WechatUser = Parse.Object.extend('WechatUser');

Parse.Cloud.beforeSave(Parse.User, function(request, response) {
	var user = request.object;
	if (typeof user === undefined) {
		return response.error();
	}

	console.log('user new: ' + user.isNew() + ' data: ' + JSON.stringify(user));
	var wechatId = user.get('wechatId');
	var claimToken = user.get('claimToken');

	if (wechatId && claimToken) {
		var query = new Parse.Query(WechatUser);
		console.log('claimToken: ' + claimToken);
		console.log('wechatId:' + wechatId);
	    query.equalTo('wechatId', wechatId);
	    return query.first()
	    .then( function(wechatUser, user, claimToken) {
	    	console.log('user is: ' + JSON.stringify(user)); 
	    	if (typeof wechatUser === undefined) {
	        	throw new Error('User ' + user.username + ' is claiming non-existent wechatUser ' + wechatId);
	    	}
            var expectedClaimToken = wechatUser.claimToken;
            if (expectedClaimToken != claimToken) {
            	throw new Error('User ' + user.username + ' is using wrong claimToken to claim wechatUser.' +
            		' expectedClaimToken: ' + expectedClaimToken + ' claimToken: claimToken');
            }
	        wechatUser.set('status', 'active');
	        wechatUser.set('wechatId', wechatId);
	        wechatUser.set('claimToken', null);
	        return wechatUser.save();
	    })
	    .then( function(username) {
	    	if (!user.existed()) {
				console.log('User sign up');
			}
			else {
				console.log('User modify');
			}
	    	return response.success();
	    })
        .fail( function(error) {
        	console.error('Sign up with new claim token error: ' + error.message);
        	return response.error();
        });
	}
});