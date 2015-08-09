var logger = require('cloud/lib/logger');

module.exports.stripeConnect = function(req, res) {
    var correlationId = logger.newCorrelationId();
    var responseError = {correlationId: correlationId};

    logger.debugLog('stripeConnect log. req.body: ' + JSON.stringify(req.body));

}