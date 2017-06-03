var config = require('./config/config.js');
module.exports = {

  setUp: function(to,subject,textType,content){
    var type = 'text/plain';
    if (textType == 'html'){
      type = 'text/html';
    }
    var helper = require('sendgrid').mail;
    var fromEmail = new helper.Email('info@localtokens.trade');
    var toEmail = new helper.Email(to);
    var subject = subject;
    var content = new helper.Content(type, content);
    var mail = new helper.Mail(fromEmail, subject, toEmail, content);
    return mail.toJSON();
  },

  send: function(mailObj){
    var sg = require('sendgrid')(config[process.env.NODE_ENV].sendgrid);
    var request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: mailObj
    });

    return sg.API(request);
  }
  
};


/*
// With promise
sg.API(request)
  .then(function (response) {
    console.log(response.statusCode);
    console.log(response.body);
    console.log(response.headers);
  })
  .catch(function (error) {
    // error is an instance of SendGridError
    // The full response is attached to error.response
    console.log(error.response.statusCode);
  });
 */



