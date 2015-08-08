var logger = require('cloud/lib/logger');
var ParseComment = Parse.Object.extend('Comment');

module.exports.convertToCommentModel = function(parseComment) {
	var comment = {};
	comment.id = parseComment.id;
	comment.creatorId = parseComment.get('creatorId');
	comment.dealId = parseComment.get('dealId');
	comment.nickname = parseComment.get('creatorNickname');
	comment.creatorHeadimgurl = parseComment.get('creatorHeadimgurl');
	comment.commentText = parseComment.get('commentText');
	comment.rating = parseComment.get('rating');
	comment.createdAt = parseComment.createdAt;

	return comment;
}