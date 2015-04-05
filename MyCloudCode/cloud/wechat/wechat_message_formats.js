var xmlOpenTag = "<xml>";
var xmlCloseTag = "</xml>";
var toUserXmlElementFormat = "<ToUserName>%s</ToUserName>"; // to user openid
var fromUserXmlElementFormat = "<FromUserName>%s</FromUserName>"; // from user openid
var createTimeXmlElementFormat = "<CreateTime>%d</CreateTime>"; // create time
var msgTypeXmlElementFormat = "<MsgType>%s</MsgType>"; // message type
var contentXmlElementFormat = "<Content><![CDATA[%s]]></Content>"; // content

// news
var articleCountXmlElementFormat = "<ArticleCount>%d</ArticleCount>"; // article count
var articlesOpenTag = "<Articles>";
var articlesCloseTag = "</Articles>";
var itemOpenTag = "<item>";
var itemCloseTag = "</item>";
var itemTitleXmlElementFormat = "<Title><![CDATA[%s]]></Title>"; // article item title
var itemDescriptionXmlElementFormat = "<Description><![CDATA[%s]]></Description>"; // article item description
var itemPicUrlXmlElementFormat = "<PicUrl><![CDATA[%s]]></PicUrl>"; // article item pic url
var itemUrlXmlElementFormat = "<Url><![CDATA[%s]]></Url>"; // article item url

// example of usage: 
// str = vsprintf(wcMsgFormats.basicReplyXmlFormat, [
//                    fromUser,
//                    toUser,
//                    createTime+1,
//                    'text',
//                    content
//                ]);
// url can be included in content as: '<a href="http://www.google.com">Google!</a>'
module.exports.basicReplyXmlFormat = 
    xmlOpenTag + 
        toUserXmlElementFormat + 
        fromUserXmlElementFormat +
        createTimeXmlElementFormat +
        msgTypeXmlElementFormat +
        contentXmlElementFormat +
    xmlCloseTag;

// example of usage:
// str = vsprintf(wcMsgFormats.pictureTxtReplyXmlFormat, [
//                    fromUser,
//                    toUser,
//                    createTime+1,
//                    'news',
//                    1,
//                    'this is a title',
//                    'description',
//                    '',
//                    utils.getAppUrl(req, fromUser)
//                ]);
module.exports.pictureTxtReplyXmlFormat = 
    xmlOpenTag +
        toUserXmlElementFormat +
        fromUserXmlElementFormat +
        createTimeXmlElementFormat +
        msgTypeXmlElementFormat +
        articleCountXmlElementFormat +
        articlesOpenTag +
            itemOpenTag +
                itemTitleXmlElementFormat +
                itemDescriptionXmlElementFormat +
                itemPicUrlXmlElementFormat +
                itemUrlXmlElementFormat +
            itemCloseTag +
        articlesCloseTag +
    xmlCloseTag;

