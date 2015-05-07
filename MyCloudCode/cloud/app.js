// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();
var appSettings = require('cloud/app.config.js').settings;
var parseApplicationId = appSettings.applicationId;
var parseJavascriptKey = appSettings.javascriptKey;
Parse.initialize(parseApplicationId, parseJavascriptKey);

var wechatServices = require('cloud/wechat/wechat_services');
var userServices = require('cloud/wechat/user_services');

var xmlParser = require('cloud/lib/xml/xmlbodyparser');
app.use(xmlParser());
//app.use(express.bodyParser());    // Middleware for reading request body

// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(function (req, res, next) {
    req.rawBody = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
        req.rawBody += chunk;
    });

    next();
});

// wechat services:
app.get('/wechat', wechatServices.requestValidate);

// This is the entry point for web messages
app.post('/wechat', wechatServices.reply);

app.get('/newuser', userServices.newUser);

// Custom menus
app.get('/wechat/create_menus', wechatServices.createMenus);

// Attach the Express app to Cloud Code.
app.listen();
