module.exports.orderDeal = function(req, res) {
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
};

module.exports.deleteOrder = function(req, res) {
	var currentUser = Parse.User.current();
	console.log('currentUser: ' + JSON.stringify(currentUser));
	if (!currentUser) {
		// require user to log in
		// TODO: client side code asks user to sign in
		return res.status(401).send();
	}

	var orderId = req.params.orderId;
	if (!orderId) {
		// not found
		return res.status(404).end();
	}

};