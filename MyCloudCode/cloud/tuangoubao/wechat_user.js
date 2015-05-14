// module for tuangoubao wechat user model
var WechatUser = Parse.Object.extend('WechatUser');

module.exports.activate = function(wechatId, wechatUserData) {
   	var query = new Parse.Query(WechatUser);
    query.equalTo('wechatId', wechatId);
    return query.first().then( function(user) {
        if (user == null) {
            user = new WechatUser();
            user.set('wechatId', wechatId);
            console.log('Creating new wechat user: ' + wechatUserData);
        }
        else {
        	console.log('Existing wechat user rejoined: ' + wechatUserData);
        }

        user.set('status', 'active');
        return user.save();
	});
};

module.exports.deactivate = function(wechatId) {
   	var query = new Parse.Query(WechatUser);
    query.equalTo('wechatId', wechatId);
	query.equalTo('status', 'active');

	return query.first().then( function(user) {
        if (user == null) {
            console.log('Unexpected in querying existing wechat user: ' + wechatId);
            user = new WechatUser();
            user.set('wechatId', wechatId);
        }
        else {
        	console.log('Deactivate wechat user: ' + wechatId);
        }

        user.set('status', 'inactive');
        return user.save();
	});
};