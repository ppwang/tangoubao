var ParseRegion = Parse.Object.extend('Region');

module.exports.getRegions = function(req, res) {
	var query = new Parse.Query(ParseRegion);
    return query.find()
    .then( function(parseRegions) {
    	// Collect one promise for each save into an array.
    	console.log('found regions: ' + JSON.stringify(parseRegions));
		var regions = [];
		parseRegions.forEach(function(parseRegion) {
			var region = convertToRegionModel(parseRegion);
			console.log('Convert parseRegion to: ' + JSON.stringify(region));
			regions.push(region);
		});
		var responseData = {};
		responseData.regions = regions;
		return res.status(200).send(JSON.stringify(responseData));
    }, function(error) {
    	console.log('error is: ' + JSON.stringify(error));
    	return res.status(500).end();
    });
};

var convertToRegionModel = function(parseRegion) {
	var region = {};
	region.id = parseRegion.id;
	region.name = parseRegion.get('name');
	region.location = parseRegion.get('location');
	return region;
};