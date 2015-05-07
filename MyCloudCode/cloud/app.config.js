module.exports.settings =
{
	"parse": {
		"applicationId": "eYJZf0smVo3qebzNpQsj90vOmJuSV8u0i2HdnDfw",
		"masterKey" : "ySm60w9R1by0m5CkZ9GDmd6U4ByQfIhiRO7B2e1s",
		"javascriptKey": "bCbz40aJB88n4GUNnvQIUBPOawNcmtu5eviWqpYP"
	},
  	"wechat": {
		"weChatAppId": "wx9c7c39cc1974737f",
		"weChatAppSecret": "c94f424e801ef527a0a0f9b9f7e535f7",
		"weChatAppToken": "tuangoubao"
	},
	"webservice": {
    	"ServiceBaseUrl": "http://tuangoubao.parseapp.com"
  }
};

module.exports.WechatUser = Parse.Object.extend('WechatUser');