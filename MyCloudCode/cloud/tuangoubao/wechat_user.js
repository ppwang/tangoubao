// module for tuangoubao wechat user model
var WechatUser = Parse.Object.extend('WechatUser');

module.exports.activate = function(wechatId, wechatUserRawData) {
   	var query = new Parse.Query(WechatUser);
    query.equalTo('wechatId', wechatId);
    return query.first().then( function(wechatUser) {
        if (wechatUser == null) {
            console.log('New wechat user rejoined.');
            wechatUser = new WechatUser();
            initWechatUser(wechatUser, wechatId, wechatUserRawData);
        }
        else {
        	console.log('Existing wechat user rejoined.');
            initWechatUser(wechatUser, wechatId, wechatUserRawData);
        }

        wechatUser.set('status', 'active');
        return wechatUser.save();
	});
};

module.exports.update = function(wechatId, wechatUserRawData) {
    var query = new Parse.Query(WechatUser);
    query.equalTo('wechatId', wechatId);
    return query.first().then( function(wechatUser) {
        if (wechatUser == null) {
            console.log('Update new wechat user.');
            wechatUser = new WechatUser();
            initWechatUser(wechatUser, wechatId, wechatUserRawData);
        }
        else {
            console.log('Update existing wechat user.');
            initWechatUser(wechatUser, wechatId, wechatUserRawData);
        }

        wechatUser.set('status', 'active');
        return wechatUser.save();
    });
};

module.exports.deactivate = function(wechatId) {
   	var query = new Parse.Query(WechatUser);
    query.equalTo('wechatId', wechatId);
	query.equalTo('status', 'active');

	return query.first().then( function(wechatUser) {
        if (wechatUser == null) {
            console.log('Unexpected in querying existing wechat user: ' + wechatId);
            wechatUser = new WechatUser();
            wechatUser.set('wechatId', wechatId);
        }
        else {
        	console.log('Deactivate wechat user: ' + wechatId);
        }

        wechatUser.set('status', 'inactive');
        return wechatUser.save();
	});
};

var initWechatUser = function(wechatUser, wechatId, wechatUserRawData) {
    wechatUser.set('wechatId', wechatId);
    wechatUser.set('data', wechatUserRawData); // raw data field
    var wechatUserData = JSON.parse(wechatUserRawData);
    if (wechatUserData.nickname !== undefined) {
        wechatUser.set('nickname', wechatUserData.nickname);
        wechatUser.nickname = wechatUserData.nickname;
    }
    if (wechatUserData.sex !== undefined) {
        wechatUser.set('sex', wechatUserData.sex); // 1 for male; 2 for female; 0 for unknown
    }
    if (wechatUserData.city !== undefined) {
        wechatUser.set('city', wechatUserData.city);
    }
    if (wechatUserData.province !== undefined) {
        wechatUser.set('province', wechatUserData.province);
    }
    if (wechatUserData.country !== undefined) {
        wechatUser.set('country', wechatUserData.country);
    }
    if (wechatUserData.headimgurl !== undefined) {
        wechatUser.set('headimgurl', wechatUserData.headimgurl);
    }
    if (wechatUserData.subscribe_time !== undefined) {
        wechatUser.set('subscribe_time', wechatUserData.subscribe_time);
    }
    if (wechatUserData.remark !== undefined) {
        wechatUser.set('remark', wechatUserData.remark);
    }
    if (wechatUserData.remark !== undefined) {
       wechatUser.set('groupid', wechatUserData.groupid);
    }
};