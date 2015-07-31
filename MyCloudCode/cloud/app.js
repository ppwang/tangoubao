// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var parseExpressCookieSession = require('parse-express-cookie-session');
var app = express();

// Entry points for deal/deals
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "http://127.0.0.1");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header("Access-Control-Allow-Credentials", 'true');
	res.header("Access-Control-Allow-Methods", 'GET,POST,PUT,DELETE');
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
app.get('/api/user/:authProvider?', userController.obtainUserInfo);
app.get('/api/user/current', userController.getCurrentUser);
app.post('/api/user/sendEmailVerification', userController.sendEmailVerification);

// OAuth connection endpoints
var oauthController = require('cloud/controller/oauth_controller');
app.get('/api/oauth/:authProvider?', oauthController.oauthConnect);

// wechat services:
app.get('/wechat', wechatServices.requestValidate);

// This is the entry point for web messages
app.post('/wechat', wechatServices.reply);

// Entry points for getting wechat js sdk config's
var wechatJsConfigController = require('cloud/controller/wechat_jsconfig_controller');
app.post('/api/wechatJsConfig', express.bodyParser(), wechatJsConfigController.getConfigs);

// Entry points for deal/deals
var dealController = require('cloud/controller/deal_controller');
app.get('/api/deal/:dealId?', dealController.getDeal);
// Use bodyparser to parse form input first and then call putDeal
app.put('/api/deal', express.bodyParser(), dealController.putDeal);
// Set deal status: active/closed
app.put('/api/dealStatus/:dealId?', dealController.putStatus);

// Send deal report to owner
var emailController = require('cloud/controller/email_controller');
app.get('/api/dealReport/:dealId?', express.bodyParser(), emailController.sendDealReport);

var dealsController = require('cloud/controller/deals_controller');
// get a list: one for deals owned; the other for deals followed
app.get('/api/deals', dealsController.getDeals);
app.get('/api/publicDeals', dealsController.getPublicDeals);

// Entry points for follow
var followController = require('cloud/controller/follow_controller');
app.put('/api/followDeal/:dealId?', followController.followDeal);
app.delete('/api/followDeal/:dealId?', followController.unfollowDeal);
app.put('/api/followUser/:userId?', followController.followUser);
app.delete('/api/followUser/:userId?', followController.unfollowUser);

// Entry points for order
var orderController = require('cloud/controller/order_controller');
// Use bodyparser to parse form input first
app.put('/api/order', express.bodyParser(), orderController.putOrder);
app.get('/api/order/:orderId?', orderController.getOrder);
app.delete('/api/order/:orderId?', orderController.deleteOrder);
app.put('/api/orderStatus/:orderId?', orderController.putStatus);

// Entry points for orders
var ordersController = require('cloud/controller/orders_controller');
app.get('/api/myOrders', ordersController.getMyOrders);
app.get('/api/orders/:dealId?', ordersController.getOrders);

// Entry points for notification
var notificationController = require('cloud/controller/notification_controller');
app.post('/api/notifyBuyers', express.bodyParser(), notificationController.notifyBuyers);

// Entry points for comment
var commentController = require('cloud/controller/comment_controller');
app.put('/api/comment/:dealId?', express.bodyParser(), commentController.putComment);
app.delete('/api/comment/:commentId?', commentController.deleteComment);

// Entry points for comments
var commentsController = require('cloud/controller/comments_controller');
app.get('/api/comments/:dealId?', commentsController.getComments);

// Entry points for message
var messageController = require('cloud/controller/message_controller');
app.put('/api/messageStatus/:messageId?', messageController.putStatus);

// Entry points for messages
var messagesController = require('cloud/controller/messages_controller');
app.get('/api/messages', messagesController.getMessages);

// Regions
var regionsController = require('cloud/controller/regions_controller');
app.get('/api/regions', regionsController.getRegions);

var userProfileController = require('cloud/controller/user_profile_controller');
app.get('/api/userProfile', userProfileController.getCurrentUserProfile);
app.put('/api/userProfile', express.bodyParser(), userProfileController.putCurrentUserProfile);

// Custom menus
app.get('/wechat/create_menus', wechatServices.createMenus);

// Attach the Express app to Cloud Code.
app.listen();
