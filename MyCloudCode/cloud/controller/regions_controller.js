var ParseRegion = Parse.Object.extend('Region');
var logger = require('cloud/lib/logger');

module.exports.getRegions = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

	var query = new Parse.Query(ParseRegion);
    return query.find()
    .then( function(parseRegions) {
    	// Collect one promise for each save into an array.
		var regions = [];
		parseRegions.forEach(function(parseRegion) {
			var region = convertToRegionModel(parseRegion);
			regions.push(region);
		});
		var responseData = {};
		responseData.regions = regions;
		return res.status(200).send(JSON.stringify(responseData));
    }, function(error) {
    	var errorMessage = 'getRegions error: ' + JSON.stringify(error);
    	logger.logDiagnostics(correlationId, 'error', errorMessage);
    	return res.status(500).send(responseError);
    });
};

var convertToRegionModel = function(parseRegion) {
	var region = {};
	region.id = parseRegion.id;
	region.name = parseRegion.get('name');
	region.location = parseRegion.get('location');
	return region;
};