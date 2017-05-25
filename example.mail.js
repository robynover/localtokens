var helper = require('sendgrid').mail;
var fromEmail = new helper.Email('test@example.com');
var toEmail = new helper.Email('test@example.com');
var subject = 'Hello World from the SendGrid Node.js Library!';
var content = new helper.Content('text/plain', 'Hello, Email!');
var mail = new helper.Mail(fromEmail, subject, toEmail, content);

var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
var request = sg.emptyRequest({
  method: 'POST',
  path: '/v3/mail/send',
  body: mail.toJSON()
});

sg.API(request, function (error, response) {
  if (error) {
    console.log('Error response received');
  }
  console.log(response.statusCode);
  console.log(response.body);
  console.log(response.headers);
});

function send(toSend){
  console.log(JSON.stringify(toSend, null, 2))
  //console.log(JSON.stringify(toSend))

  var sg = require('sendgrid')(process.env.SENDGRID_API_KEY)

  var requestBody = toSend
  var emptyRequest = require('sendgrid-rest').request
  var requestPost = JSON.parse(JSON.stringify(emptyRequest))
  requestPost.method = 'POST'
  requestPost.path = '/v3/mail/send'
  requestPost.body = requestBody
  sg.API(requestPost, function (error, response) {
    console.log(response.statusCode)
    console.log(response.body)
    console.log(response.headers)
  })
}

function helloEmail(){
  var helper = require('sendgrid').mail

  from_email = new helper.Email("test@example.com")
  to_email = new helper.Email("test@example.com")
  subject = "Hello World from the SendGrid Node.js Library"
  content = new helper.Content("text/plain", "some text here")
  mail = new helper.Mail(from_email, subject, to_email, content)
  //email = new helper.Email("test2@example.com")
  //mail.personalizations[0].addTo(email)

  return mail.toJSON()
}