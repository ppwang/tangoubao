var wechatSetting = require('cloud/app.config.js').settings.wechat;
var wechatUser = Parse.Object.extend('WechatUser');

module.exports.unsubscribe = function (userId, appId, createTime, res) {
    console.log('remove user ' + userId);
    var query = new Parse.Query(wechatUser);
    query.equalTo('wechatId', userId);
    query.equalTo('status', 'active');
    query.first({
        success: function(result) {
            console.log('success');
            if (result != null) {
                result.set('status', 'inactive');
                result.save(null, {
                    success: function(user) {
                        console.log('Existing user left');
                    },
                    error: function(user, error) {
                        console.error(error.message);
                    }
                });
            }
            else {
                console.log('Unexpected in querying existing user' + error.message);
                var user = new wechatUser();
                user.set('wechatId', userId);
                user.set('status', 'inactive');
                user.save(null, {
                    success: function(user) {
                        console.log('Create an inactive user');
                    },
                    error: function(user, error) {
                        console.error(error.message);
                    }
                });
            }
            res.end();
        },

        error: function(error) {  
            res.error();
        }
    });
}

var unsubscribeMsg = function (userId) {
    return userId;
};
