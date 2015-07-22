var ParseComment = Parse.Object.extend('Comment');
var userModel = require('cloud/tuangoubao/user');
var commentModel = require('cloud/tuangoubao/comment');

module.exports.getComments = function (req, res) {
	var dealId = req.params.dealId;
	if (!dealId) {
		// not found
		return res.status(404).end();
	}

	var query = new Parse.Query(ParseComment);
	query.equalTo('dealId', dealId);
	// we are sorting the results by creation date
	query.addDescending('createdAt');

	return query.find()
		.then(function(parseComments) {
			var comments = [];
			parseComments.forEach(function(parseComment) {
				var comment = commentModel.convertToCommentModel(parseComment);
				comments.push(comment);
			});
			return res.status(200).send(comments);
		}, function(error) {
			console.log('error: ' + JSON.stringify(error));
			return res.status(500).end();
		});
}