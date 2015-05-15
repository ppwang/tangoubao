var url = require('url');

module.exports.getAppUrl = function (req, user) {
    var hostname = req.headers.host; 
    var pathname = url.parse(req.url).pathname; 
    return 'http://' + hostname + pathname + '?user=' + user;
};

module.exports.getNewGUID = function() {
	return s4() + s4() + '-' 
		+ s4() + '-' 
		+ s4() + '-' 
		+ s4() + '-' 
		+ s4() + s4() + s4();
};

var s4 = function() {
    return Math.floor((1 + Math.random()) * 0x10000)
    	.toString(16)
     	.substring(1);	
};