var http = require('http');
var url = require('url');

module.exports.getAppUrl = function (req, user) {
    var hostname = req.headers.host; 
    var pathname = url.parse(req.url).pathname; 
    return 'http://' + hostname + pathname + '?user=' + user;
}