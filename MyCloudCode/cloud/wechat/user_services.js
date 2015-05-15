module.exports = function(req, res) {
	newUser(req, res);
};

var newUser = function (req, res) {
    var wechatId = req.query.wechatid;
    console.log('id: ' + wechatId);
    res.render('wechat', { wechatId: wechatId});
}