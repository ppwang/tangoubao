var Deal = Parse.Object.extend('Deal');

module.exports.getDeals = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		return res.status(401).send();
	}

	//TODO: add functionality
};