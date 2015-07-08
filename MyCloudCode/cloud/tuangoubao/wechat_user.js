// module for tuangoubao wechat user model
var WechatUser = Parse.Object.extend('WechatUser');
var utils = require('cloud/lib/utils');

module.exports.activate = function(wechatId, wechatUserRawData) {
   	var query = new Parse.Query(WechatUser);
    query.equalTo('wechatId', wechatId);
    return query.first().then( function(wechatUser) {
        if (!wechatUser) {
            console.log('New wechat user rejoined.');
            wechatUser = new WechatUser();
            initWechatUser(wechatUser, wechatId, wechatUserRawData, true);
        }
        else {
        	console.log('Existing wechat user rejoined.');
            initWechatUser(wechatUser, wechatId, wechatUserRawData, true);
        }

        wechatUser.set('status', 'active');
        return wechatUser.save();
	});
};

module.exports.update = function(wechatId, wechatUserRawData, refreshClaimToken) {
    var query = new Parse.Query(WechatUser);
    query.equalTo('wechatId', wechatId);
    return query.first().then( function(wechatUser) {
        if (!wechatUser) {
            console.log('Update new wechat user.');
            wechatUser = new WechatUser();
            initWechatUser(wechatUser, wechatId, wechatUserRawData, true);
        }
        else {
            console.log('Update existing wechat user.');
            initWechatUser(wechatUser, wechatId, wechatUserRawData, refreshClaimToken);
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
        if (!wechatUser) {
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

module.exports.convertToWechatUserModel = function(parseWechatUser) {
    var wechatUser = {};
    wechatUser.wechatId = parseWechatUser.get('wechatId');
    wechatUser.nickname = parseWechatUser.get('nickname');
    wechatUser.headimgurl = parseWechatUser.get('headimgurl');
    return wechatUser;
};

var initWechatUser = function(wechatUser, wechatId, wechatUserRawData, refreshClaimToken) {
    wechatUser.set('wechatId', wechatId);
    wechatUser.set('data', wechatUserRawData); // raw data field
    var wechatUserData = JSON.parse(wechatUserRawData);

    // Before, the following is an error situation: we found a user who is not following us. 
    //    Could be someone try to hack this wechat user entity?
    // Now, for webpage oauth, we can have users who are not following us.
    // if (!wechatUserData.subscribe || wechatUserData.subscribe == 0) {
    //     throw new Error('Query from wechat a unsubscribed user.');
    // }

    // For new user, we will generate a one time claim token for binding with user instance.
    if (refreshClaimToken) {
        var claimtoken = utils.getNewGUID();
        wechatUser.set('claimtoken', claimtoken);
        wechatUser.claimtoken = claimtoken;
    }

    if (wechatUserData.nickname) {
        wechatUser.set('nickname', wechatUserData.nickname);
        wechatUser.nickname = wechatUserData.nickname;
    }
    if (wechatUserData.sex) {
        wechatUser.set('sex', wechatUserData.sex); // 1 for male; 2 for female; 0 for unknown
    }
    if (wechatUserData.city) {
        wechatUser.set('city', wechatUserData.city);
    }
    if (wechatUserData.province) {
        wechatUser.set('province', wechatUserData.province);
    }
    if (wechatUserData.country) {
        wechatUser.set('country', wechatUserData.country);
    }
    if (wechatUserData.headimgurl) {
        wechatUser.set('headimgurl', wechatUserData.headimgurl);
        wechatUser.headimgurl = wechatUserData.headimgurl;
    }
    if (wechatUserData.subscribe_time) {
        wechatUser.set('subscribe_time', wechatUserData.subscribe_time);
    }
    if (wechatUserData.remark) {
        wechatUser.set('remark', wechatUserData.remark);
    }
    if (wechatUserData.groupid) {
       wechatUser.set('groupid', wechatUserData.groupid);
    }
};