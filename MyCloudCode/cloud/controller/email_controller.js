var mandrill = require('mandrill');
mandrill.initialize('GnOE5NED9Ad5002hrjyZ0Q');

module.exports.sendEmail = function(emailAddress, sendeeName) {
	return mandrill.sendEmail({
		message: {
			text: "Your order is ready!",
			subject: "Your tuangoubao order is ready!",
			from_email: "info@tuangoubao.parseapps.com",
			from_name: "Your friend at Tuan Gou Bao",
			to: [
				{
				  email: emailAddress,
				  name: sendeeName
				}
	      	]
	    },
	    async: true
	  }, {
	    success: function() { console.log("Email sent!"); },
	    error: function() { console.log("Uh oh, something went wrong"); }
	  });
};