var ParseComment = Parse.Object.extend('Comment');
var userModel = require('cloud/tuangoubao/user');
var commentModel = require('cloud/tuangoubao/comment');
var logger = require('cloud/lib/logger');

module.exports.getComments = function (req, res) {
	var correlationId = logger.newCorrelationId();
	var responseError = {correlationId: correlationId};

	var dealId = req.params.dealId;
	if (!dealId) {
		// not found
		logger.logDiagnostics(correlationId, 'error', 'getComments error (404): dealId not provided in request.');
		return res.status(404).send(responseError);
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
			var errorMessage = 'getComments error. currentUser: ' + JSON.stringify(error);
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			return res.status(500).send(responseError);
		});
}