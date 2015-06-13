// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();

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

// wechat services:
app.get('/wechat', wechatServices.requestValidate);

// This is the entry point for web messages
app.post('/wechat', wechatServices.reply);

// Entry points for deal/deals

var dealController = require('cloud/controller/deal_controller');
app.get('/api/deal/:dealId?', dealController.getDeal);
// Use bodyparser to parse form input first and then call putDeal
app.put('/api/deal/:dealId?', express.bodyParser(), dealController.putDeal);
app.delete('/api/deal/:dealId?', dealController.deleteDeal);

var dealsController = require('cloud/controller/deals_controller');
// get 2 lists: one for deals owned; the other for deals followed
app.get('/api/deals/', dealsController.getDeals);

// Custom menus
app.get('/wechat/create_menus', wechatServices.createMenus);

// Attach the Express app to Cloud Code.
app.listen();
