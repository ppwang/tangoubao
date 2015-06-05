var Deal = Parse.Object.extend('Deal');

module.exports.putDeal = function(req, res) {
	var currentUser = Parse.User.current();
	if (typeof currentUser === 'undefined') {
		// require user to log in
		res.status(401).send();
	}

	var dealId = req.params.dealId;
	if (typeof dealId === 'undefined') {
		// create a new deal
		createDeal(req, res, currentUser);
	}
	else {
		modifyDeal(res, res, currentUser);
	}
};

module.exports.deleteDeal = function(req, res) {

};

module.exports.getDeal = function(req, res) {
	var currentUser = Parse.User.current();
	if (typeof currentUser === 'undefined') {
		// require user to log in
		res.status(401).send();
	}

	var dealId = req.params.dealId;
	if (typeof dealId === 'undefined') {
		// create a new deal
		res.send('no dealId');
	}
	else {
		res.send('dealId is: ' + dealId);
	}
};

module.exports.modifyDeal = function(req, res, user) {
	// TODO: add modif
	res.send('dealId is: ' + dealId);
}

var createDeal = function(req, res, user) {
	var deal = new Deal();

	var title = req.body.title;
	if (typeof title !== 'undefined') {
		deal.set('title', title);
	}

	var subtitle = req.body.subtitle;
	if (typeof subtitle !== 'undefined') {
		deal.set('subtitle', subtitle);
	}

	var details = req.body.details;
	if (typeof details !== 'undefined') {
		deal.set('details', details);
	}

	var startDate = req.body.startDate;
	if (typeof startDate !== 'undefined') {
		deal.set('startDate', startDate);
	}

	var endDate = req.body.endDate;
	if (typeof endDate !== 'undefined') {
		deal.set('endDate', endDate);
	}

	var contactName = req.body.contactName;
	if (typeof contactName !== 'undefined') {
		deal.set('contactName', contactName);
	}

	var contactPhone = req.body.contactPhone;
	if (typeof contactPhone !== 'undefined') {
		deal.set('contactPhone', contactPhone);
	}

	var picture = req.body.image;
	if (typeof picture !== 'undefined' && typeof picture.type !== 'undefined') {
		var targetPicFile = new Parse.File('deal_image.png', picture.data);
		// TODO: resize for icon
		targetPicFile.save()
		.then(function() {
			deal.save();
		})
		.then( function() {
			res.status(200).end();
		}, function(error) {
			console.error('picture save to parse error: ' + error);
			res.status(500).end();
		});
	}

}