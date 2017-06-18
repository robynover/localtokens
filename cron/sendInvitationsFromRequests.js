"use strict";
var config = require('../config/config.js')['production'];
var mongoose = require('mongoose');
var db = mongoose.connect(config.mongo);
mongoose.Promise = require('bluebird');

var mail = require('../mail.js');

var Invitation = require('../models/mongoose/invitation.js');
var InviteRequest = require('../models/mongoose/inviteRequest.js');
/*
  Send invitations from requests
 */

var numSent = 0;

InviteRequest.find({
	   status: 'send',
    })
	.or([{sent: false},{sent: null}])
	.exec()
	.then(docs=>{
		if (docs.length > 0){
			var promises = [];
			var updatePromises = [];
			numSent = docs.length;
			
			for(var i in docs){
				promises.push(doInvite(docs[i]));
			}

			Promise.all(promises)
				.then( ()=>{
					console.log('sent '+ numSent);
					db.disconnect();
					process.exit();
				});

			
		} else {
			console.log('no docs to process');
			db.disconnect();
			process.exit();
		}

	});

var doInvite = function(doc){
	return Invitation.create({
		invitee_email: doc.email,
		inviter_username: null,
		sent: true // set sent to true so that it doesn't get sent by the other cron script
	})
		.then(inv=>{
			
			inv.generateCode();
			return inv.save()
				.then(inv2=>{
					
					// send
					var url = 'http://communitycred.com/invite/'+inv2.code;
					var body = "You're invited to join Community Cred! ";
					body += "To sign up, use this URL, which contains your invite code: "+url;
					body += "\n\nBest wishes!\n\nThe Community Cred Team";
					var mailObj = mail.setUp(
						inv2.invitee_email,
						"Here's your invitation to Community Cred",
						'text',
						body);
					return mail.send(mailObj)
						.then( ()=>{
							doc.sent = true;
							return doc.save();
						});	
				})
		});
};

