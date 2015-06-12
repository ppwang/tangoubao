var Deal = Parse.Object.extend('Deal');

module.exports.putDeal = function(req, res) {
	console.log('put deal request');
	var currentUser = Parse.User.current();
	if (typeof currentUser === 'undefined') {
		// require user to log in
		res.status(401).send();
	}

	var dealId = req.params.dealId;
	if (typeof dealId === 'undefined') {
		// create a new deal
		console.log('create deal');
		createDeal(req, res, currentUser);
	}
	else {
		console.log('modify deal');
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
	console.log(req.query);
	console.log(req.body);
	console.log(req.rawBody);
	var deal = new Deal();

	var name = req.body.name;
	if (typeof name !== 'undefined') {
		deal.set('name', name);
	}

	var subtitle = req.body.subtitle;
	if (typeof subtitle !== 'undefined') {
		deal.set('subtitle', subtitle);
	}

	var detailedDescription = req.body.detailedDescription;
	if (typeof detailedDescription !== 'undefined') {
		deal.set('detailedDescription', detailedDescription);
	}

	var beginDate = req.body.beginDate;
	if (typeof startDate !== 'undefined') {
		deal.set('beginDate', beginDate);
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

	var imageData = req.body.imageBase64;
	var imageType = req.body.imageType;
	if (typeof imageData !== 'undefined' && typeof imageType !== 'undefined') {
		// TODO: support jpg besides png
		if (imageType != 'image/png') {
			console.log('Unsupported image type: ' + imageType);
			res.status(500).end();
			return;
		}
		var targetImageFile = new Parse.File('deal_image.png', picture.data, imageType);
		// TODO: resize for icon
		targetImageFile.save()
		.then(function(imgFile) {
			deal.set('dealImage', imgFile);
			return deal.save();
		})
		.then( function(deal) {
			console.log('save deal: ' + JSON.stringify(deal));
			res.status(200).end();
		}, function(error) {
			console.error('picture save to parse error: ' + error);
			res.status(500).end();
		});
	}
	else {
		console.log('save deal: ' + JSON.stringify(deal));
		deal.save()
		.then(function() {
			res.status(200).end();
		}, function(error) {
			console.error('error: ' + error);
			res.status(500).end();
		});
	}
}