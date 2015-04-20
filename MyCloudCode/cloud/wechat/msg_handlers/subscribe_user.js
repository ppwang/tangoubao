var subscribeUser = function (userId, appId, createTime, res) {
    var query = new Parse.Query(WechatUser);
    query.first({
        success: function(result) {
            if (result != null) {
                result.set('status', 'active');
                result.save(null, {
                    success: function(user) {
                        console.log('Existing user rejoined');
                    },
                    error: function(user, error) {
                        console.error(error.message);
                    }
                });
            }
            else {
                var user = new WechatUser();
                user.set('status', 'active');
                user.set('wechatId', userId);
                user.save();
            }
            //getAccessToken();
            
            var message = createInvitationCard(userId);
            res.contentType('application/xml');
            var str = vsprintf(wcMsgFormats.basicReplyXmlFormat, [
                    userId,
                    appId,
                    createTime+1,
                    'text',
                    message
                ]);
            console.log(str);
            res.send(str);
        },

        error: function(error) {
            console.log('error');
            console.log(error.message);
            res.error();
        }
    });
};
