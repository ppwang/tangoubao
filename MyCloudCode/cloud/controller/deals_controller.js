var Deal = Parse.Object.extend('Deal');

module.exports.getDeals = function(req, res) {
	var currentUser = Parse.User.current();
	if (typeof currentUser === 'undefined') {
		// require user to log in
		res.status(401).send();
	}

	//TODO: add functionality
};