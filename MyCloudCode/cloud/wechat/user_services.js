module.exports.newUser = function (req, res) {
    var wechatId = req.query.wechatid;
    console.log('id: ' + wechatId);
    res.render('wechat', { wechatId: wechatId});
}