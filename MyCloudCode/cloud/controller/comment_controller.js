var ParseComment = Parse.Object.extend('Comment');
var userModel = require('cloud/tuangoubao/user');
var commentModel = require('cloud/tuangoubao/comment');

module.exports.putComment = function (req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		return res.status(401).send();
	}

	var dealId = req.params.dealId;
	if (!dealId) {
		// not found
		return res.status(404).end();
	}

	// Add rating / commentText
	console.log('req.body: ' + JSON.stringify(req.body));
	var rating = req.body.rating;
	if (typeof rating != 'number') {
		rating = parseFloat(rating);
	}
	var commentText = req.body.commentText;

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
			console.log('error: ' + JSON.stringify(error));
			return res.status(500).end();
		});
}

module.exports.deleteComment = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		return res.status(401).send();
	}
	var commentId = req.params.commentId;
	if (!commentId) {
		// not found
		return res.status(404).end();
	}

	var parseCommentPromise = new ParseComment();
   	parseCommentPromise.id = commentId;
   	return parseCommentPromise.fetch()
		.then( function(parseComment) {
			if (parseComment && parseComment.creatorId == currentUser.id) {
				console.log('Delete commentId:' + commentId + ' by userId: ' + currentUser.id);
				return parseComment.destroy({});
			}
			return 'Not authorized';
		})
		.then(function(message) {
			if (message == 'Not authorized') {
				console.log('User:  ' + current.id + ' is not allowed to delete commentId: ' + commentId);
				return res.status(401).end;
			}
    		return res.status(200).end();
    	}, function(error) {
    		console.log('Delete comment error: ' + JSON.stringify(error));
    		return res.status(500).end();
    	});
}