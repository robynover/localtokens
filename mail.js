var config = require('./config/config.js');
var sg = require('sendgrid')(config['production'].sendgrid);
var sgListId = config['production'].sendgridListId;

module.exports = {

  setUp: function(to,subject,textType,content){
    var type = 'text/plain';
    if (textType == 'html'){
      type = 'text/html';
    }
    var helper = require('sendgrid').mail;
    var fromEmail = new helper.Email('info@communitycred.com','Community Cred');
    var toEmail = new helper.Email(to);
    var subject = subject;
    var content = new helper.Content(type, content);
    var mail = new helper.Mail(fromEmail, subject, toEmail, content);
    return mail.toJSON();
  },

  send: function(mailObj){
    var request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: mailObj
    });

    return sg.API(request);
  },

  addUser: function(email){
    var request = sg.emptyRequest();
    request.body = [
      {
        "email": email
      }
    ];
    request.method = 'POST';
    request.path = '/v3/contactdb/recipients';
    return sg.API(request);
  },

  addRecipientToList: function(listId,recipientId){
    var request = sg.emptyRequest();
    request.method = 'POST';
    request.path = '/v3/contactdb/lists/' + listId + '/recipients/' + recipientId;
    return sg.API(request);
  },

  addEmailToUserList: function(email){
    return this.addUser(email)
      .then(r=>{
        if (r.body.persisted_recipients[0]){
          var recipientId = r.body.persisted_recipients[0];
          return this.addRecipientToList(sgListId,recipientId);
        } else {
          throw new Error("Email could not be added");
          return false;
        }
      })
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



