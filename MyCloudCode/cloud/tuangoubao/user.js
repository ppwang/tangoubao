var WechatUser = Parse.Object.extend('WechatUser');
var currentUser;

Parse.Cloud.beforeSave(Parse.User, function(request, response) {
	currentUser = request.object;
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
    return query.first()
    .then( function(wechatUser) {
    	console.log('Current user is: ' + JSON.stringify(currentUser)); 
    	if (typeof wechatUser === 'undefined') {
        	throw new Error('User ' + currentUser.username + ' is claiming non-existent wechatUser ' 
        		+ currentUser.wechatId);
    	}
    	console.log('wechatUser is: ' + JSON.stringify(wechatUser)); 
    	wechatUser.claimtoken = wechatUser.get('claimtoken');
        if (wechatUser.claimtoken != currentUser.claimtoken) {
        	throw new Error('User ' + currentUser.username + ' is using wrong claimtoken to claim wechatUser.' +
        		' wechat claimtoken: ' + wechatUser.claimtoken + ' user claimtoken:' + currentUser.claimtoken);
        }
        wechatUser.set('status', 'active');
        wechatUser.set('claimtoken', null);
        return wechatUser.save();
    })
    .then( function(username) {
    	if (!currentUser.existed()) {
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
});