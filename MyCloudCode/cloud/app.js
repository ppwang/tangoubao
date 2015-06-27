// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var parseExpressCookieSession = require('parse-express-cookie-session');
var app = express();

// Entry points for deal/deals
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "http://127.0.0.1");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header("Access-Control-Allow-Credentials", 'true');
	if ('OPTIONS' == req.method) {
		res.send(200);
	}
	else {
		next();
	}
});

var wechatServices = require('cloud/wechat/wechat_services');

var xmlParser = require('cloud/lib/xml/xmlbodyparser');
app.use('/wechat', xmlParser());
// Middleware for reading request body; please do not enable since it will break wechat which is using xml
//app.use(express.bodyParser());    

app.use('/wechat', function (req, res, next) {
    req.rawBody = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
        req.rawBody += chunk;
    });

    next();
});

// endpoints for signup / login
app.use(express.cookieParser('TUANGOUBAO'));
app.use(parseExpressCookieSession({ cookie: { maxAge: 360000000 } }));

// Clicking submit on the login form triggers this.
var userController = require('cloud/controller/user_controller');
app.post('/signup', express.bodyParser(), userController.signUp);
app.post('/login', express.bodyParser(), userController.logIn);
app.get('/logout', userController.logOut);

// wechat services:
app.get('/wechat', wechatServices.requestValidate);

// This is the entry point for web messages
app.post('/wechat', wechatServices.reply);

// Entry points for deal/deals

var dealController = require('cloud/controller/deal_controller');
app.get('/api/deal/:dealId?', dealController.getDeal);
// Use bodyparser to parse form input first and then call putDeal
app.put('/api/deal', express.bodyParser(), dealController.putDeal);

var dealsController = require('cloud/controller/deals_controller');
// get a list: one for deals owned; the other for deals followed
app.get('/api/deals', dealsController.getDeals);

// Entry points for follow
var followController = require('cloud/controller/follow_controller');
app.put('/api/followDeal/:dealId?', followController.followDeal);
app.delete('/api/followDeal/:dealId?', followController.unfollowDeal);
app.put('/api/followUser/:userId?', followController.followUser);
app.delete('/api/followUser/:userId?', followController.unfollowUser);

// Entry points for orders
var orderController = require('cloud/controller/order_controller');
// Use bodyparser to parse form input first
app.put('/api/orderDeal', express.bodyParser(), orderController.orderDeal);
app.delete('/api/orderDeal/:orderId?', orderController.deleteOrder);

// Entry points for notification
var notificationController = require('cloud/controller/notification_controller');
app.get('/api/notifyUser/:userId?', notificationController.notifyUser);

// Regions
var regionsController = require('cloud/controller/regions_controller');
app.get('/api/regions', regionsController.getRegions);

// Custom menus
app.get('/wechat/create_menus', wechatServices.createMenus);

// Attach the Express app to Cloud Code.
app.listen();
