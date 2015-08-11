var appConfig = require('cloud/app.config.js').settings.config;
var utils = require('cloud/lib/utils');

module.exports.newCorrelationId = function() {
	var correlationId = utils.getNewGUID();
	return correlationId;
}

module.exports.logDiagnostics = function(correlationId, type, message) {
	debugLog(message);

	// type is error / info / warning
	var dimensions = {
		correlationId: correlationId,
		type: type,
		message: message,
	};
	// Send the dimensions to Parse along with the 'diagnostics' event
	Parse.Analytics.track('diagnostics', dimensions);
};

// TODO: more metadata to 
module.exports.logUsage = function(userId, action, objectId, data) {
	var dimensions = {
		userId: userId,
		action: action,
		objectId: objectId,
		data: data,
	};
	// Send the dimensions to Parse along with the 'diagnostics' event
	Parse.Analytics.track('usage', dimensions);
};

module.exports.debugLog = function(message) {
	debugLog(message);
};

var debugLog = function(message) {
	// For now, use parse log dashboard for all the debug logs.
	if (appConfig.debug) {
		console.log(message);
	}	
};