var utils = require('cloud/lib/utils');

module.exports.newCorrelationId = function() {
	var correlationId = utils.getNewGUID();
	return correlationId;
}

module.exports.logDiagnostics = function(correlationId, type, message) {
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
module.exports.logUsage = function(type, message) {
	var dimensions = {
		type: type,
		message: message,
	};
	// Send the dimensions to Parse along with the 'diagnostics' event
	Parse.Analytics.track('usage', dimensions);
};

module.exports.debugLog = function(message) {
	// For now, use parse log dashboard for all the debug logs.
	console.log(message);
}