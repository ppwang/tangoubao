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

module.exports.getArrayLength = function(someArray) {
    var len = 0;
    for (var key in someArray) {
        if (someArray.hasOwnProperty(key)) {
            len++;
        }
    };
    return len;
};

module.exports.getArraySum = function(someArray) {
    var sum = 0;
    for (var key in someArray) {
        if (someArray.hasOwnProperty(key)) {
            var val = someArray[key];
            if (typeof val === 'number') {
                sum += val;
            }
        }
    }
    return sum;
};

module.exports.formatDateString = function(date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return year + '年' + month + '月' + day + '日';
};

var s4 = function() {
    return Math.floor((1 + Math.random()) * 0x10000)
    	.toString(16)
     	.substring(1);	
};
