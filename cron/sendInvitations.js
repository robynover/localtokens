"use strict";

var config = require('../config/config.js')[process.env.NODE_ENV];
var mongoose = require('mongoose');
mongoose.connect(config.mongo);
mongoose.Promise = require('bluebird');

var mail = require('../mail.js');

var Invitation = require('../models/mongoose/invitation.js');

Invitation.find({sent:false})
	.then( docs=>{
		//console.log(docs);
		var promises = [];
		var updatePromises = [];

		if (docs.length > 0){
			for (var i in docs){
				var url = 'http://localhost:3000/invite/'+docs[i].code;
				var mailObj = mail.setUp(
					docs[i].invitee_email,
					docs[i].inviter_username + ' invited you to Local Tokens',
					'text',
					"Hello there! Here's your invitation code for Local Tokens. Go to this URL to sign up: "+ url);
				promises.push(mail.send(mailObj));
				
				docs[i].sent = true;
				updatePromises.push(docs[i].save());
			}
		} else {
			console.log('no docs to process');
			process.exit();
		}
		

		Promise.all(promises)
			.then( ()=>{
				Promise.all(updatePromises)
					.then( ()=>{
						console.log('sent');
						process.exit();
					});
			})
			.catch(function (error) {
			  // error is an instance of SendGridError
			  // The full response is attached to error.response
			  console.log("ERROR ___________________");
			  console.log(error.response);
			  process.exit();
			});
		
	});
