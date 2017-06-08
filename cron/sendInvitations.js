"use strict";
var fs = require('fs');
var config = require('../config/config.js')['production'];
var mongoose = require('mongoose');
var db = mongoose.connect(config.mongo);
mongoose.Promise = require('bluebird');

var mail = require('../mail.js');

var Invitation = require('../models/mongoose/invitation.js');

// get current path
var pathArr = __filename.split('/');
pathArr.pop();
var pathToBody = pathArr.join('/') + '/invitationbody.txt';

var invitationBody = fs.readFileSync(pathToBody).toString();

function doReplacements(text,name,url){
	var t = text.replace('%firstname%',name);
	return t.replace('%url%',url);
}

Invitation.find({sent:false})
	.then( docs=>{
		//console.log(docs);
		var promises = [];
		var updatePromises = [];

		if (docs.length > 0){
			for (var i in docs){
				var url = 'http://communitycred.com/invite/'+docs[i].code;
				var body = doReplacements(invitationBody,docs[i].inviter_firstname,url);
				var mailObj = mail.setUp(
					docs[i].invitee_email,
					docs[i].inviter_firstname + ' invited you to join Community Cred',
					'text',
					body);
				promises.push(mail.send(mailObj));
				
				docs[i].sent = true;
				updatePromises.push(docs[i].save());
			}
		} else {
			console.log('no docs to process');
			db.disconnect();
			process.exit();

		}
		

		Promise.all(promises)
			.then( ()=>{
				Promise.all(updatePromises)
					.then( ()=>{
						console.log('sent');
						db.disconnect();
						process.exit();
					});
			})
			.catch(function (error) {
			  // error is an instance of SendGridError
			  // The full response is attached to error.response
			  console.log("ERROR ___________________");
			  console.log(error.response);
			  db.disconnect();
			  process.exit();
			});
		
	});
