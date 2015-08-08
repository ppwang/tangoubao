var ParseComment = Parse.Object.extend('Comment');
var userModel = require('cloud/tuangoubao/user');
var commentModel = require('cloud/tuangoubao/comment');
var logger = require('cloud/lib/logger');

module.exports.putComment = function (req, res) {
	var correlationId = logger.newCorrelationId();
	var responseError = {correlationId: correlationId};
	var currentUser = Parse.User.current();
	logger.debugLog('putComment log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		logger.logDiagnostics(correlationId, 'error', 'putComment error (401): User not logged in.');
		return res.status(401).send(responseError);
	}

	var dealId = req.params.dealId;
	if (!dealId) {
		// not found
		logger.logDiagnostics(correlationId, 'error', 'putComment error (404): dealId not provided in request.');
		return res.status(404).send(responseError);
	}

	// Add rating / commentText
	logger.debugLog('putComment log. req.body: ' + JSON.stringify(req.body));
	var rating = req.body.rating;
	if (rating && typeof rating != 'number') {
		rating = parseFloat(rating);
	}
	var commentText = req.body.commentText;
	if (commentText && commentText.length > 500) {
		commentText = commentText.substring(0, 500);
	}

	return currentUser.fetch()
		.then(function(parseUser) {
			var parseComment = new ParseComment();
			var user = userModel.convertToUserModel(parseUser);
			parseComment.set('creatorId', currentUser.id);
			parseComment.set('dealId', dealId);
			parseComment.set('creatorNickname', user.nickname);
			parseComment.set('creatorHeadimgurl', user.headimgurl);
			parseComment.set('commentText', commentText);
			parseComment.set('rating', rating);
			return parseComment.save();
		})
		.then(function(parseComment) {
			var comment = commentModel.convertToCommentModel(parseComment);
			return res.status(200).send(comment);
		}, function(error) {
			var errorMessage = 'putComment error: ' + JSON.stringify(error);
			// This would be parse error message.
			logger.logDiagnostics(correlationId, 'error', errorMessage);
			return res.status(500).send(responseError);
		});
}

module.exports.deleteComment = function(req, res) {
	var correlationId = logger.newCorrelationId();
	var responseError = {correlationId: correlationId};

	var currentUser = Parse.User.current();
	logger.debugLog('deleteComment log. currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		logger.logDiagnostics(correlationId, 'error', 'deleteComment error (401): user not logged in.');
		return res.status(401).send(responseError);
	}
	var commentId = req.params.commentId;
	if (!commentId) {
		// not found
		logger.logDiagnostics(correlationId, 'error', 
			'deleteComment error (404): commentId not provided from request');
		return res.status(404).send(responseError);
	}

	var parseCommentPromise = new ParseComment();
   	parseCommentPromise.id = commentId;
   	return parseCommentPromise.fetch()
		.then( function(parseComment) {
			if (parseComment && parseComment.creatorId == currentUser.id) {
				logger.debugLog('deleteComment log. commentId: ' + commentId +  ', by userId: ' + currentUser.id);
				return parseComment.destroy({});
			}
			return 'Not authorized';
		})
		.then(function(message) {
			if (message == 'Not authorized') {
				var errorMessage = 'deleteComment log. User:  ' + current.id 
					+ ' is not allowed to delete commentId: ' + commentId;
				logger.logDiagnostics(correlationId, 'error', errorMessage);
				return res.status(401).send(responseError);
			}
    		return res.status(200).end();
    	}, function(error) {
    		var errorMessage = 'deleteComment log. error:  ' + JSON.stringify(error);
    		logger.logDiagnostics(correlationId, 'error', errorMessage);
    		return res.status(500).send(responseError);
    	});
}