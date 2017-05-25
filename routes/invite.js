"use strict";

var config = require('../config/config.js')[process.env.NODE_ENV];

module.exports = function(express){
	var router = express.Router();

	var Invitation = require('../models/mongoose/invitation.js');
	var InvitationAllotment = require('../models/mongoose/invitationAllotment.js');

	// === require users to be logged in for this section=== //
	router.all('/*',function(req,res,next){
		if (req.user){
			next();
		} else {
			res.status(401);
			res.render('generic',{msg:'You must be logged in to view this page'});
		}	
	});

	router.get('/',(req,res)=>{
		InvitationAllotment.findByUsername(req.user.username)
			.then( (doc) =>{
				var context = {};
				context.username = req.user.username;
				context.is_admin = req.user.is_admin;
				context.loggedin = true;
				context.numLeft = doc.left;
				if (context.numLeft < 0){
					context.numLeft = 0;
				}

				res.render('inviteform',context);
			})
			.catch(err=>{
				console.log(err);
				res.render('generic',{msg:err});
			});
	});

	router.post('/',(req,res)=>{
		var context = {};
		context.username = req.user.username;
		context.is_admin = req.user.is_admin;
		context.loggedin = true;

		// how many invitations does the user have available?
		InvitationAllotment.findByUsername(req.user.username)
			.then( (doc) =>{
				var numLeft = doc.left;

				
				// get emails from form, trim and validate
				var emails = req.body.emails.split(',').map(function(x) {
				   return x.trim();
				}).filter(function(v){
					return /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(v);
				});
				
				if (emails.length <= numLeft){
					
					var promises = [];

					for (var i in emails){
						var obj = {};
						obj.invitee_email = emails[i];
						obj.inviter_id = req.user.id;
						obj.inviter_username = req.user.username;
						obj.inviter_firstname = req.user.firstname;

						var invitation = new Invitation(obj);
						invitation.generateCode();
						invitation.save()
							.then(inv=>{
								// save to invitation allotment record
								promises.push(doc.addInvite(inv._id));	
							})
							.catch(err=>{
								console.log(err.message);
							});
							
					}
					return Promise.all(promises).then( ()=>{
						var word = 'invitations';
						if (email.length == 1){ word = 'invitation';}
						context.result = emails.length + " " + word + " sent";
						context.numLeft = numLeft - emails.length;
						if (context.numLeft < 0){
							context.numLeft = 0;
						}
						console.log(doc.left);
					    res.render('inviteform',context);	
					})
						.catch(err=>{
							context.result = err;
							res.render('inviteform',context);
							console.log(err);
						});
				} else {
					context.result = "You do not have enough invites to invite "+emails.length+ " people";
					res.render('inviteform',context);
				}
			});

	});

	router.get('/:code', (req,res)=>{
		// check if code has been used
		Invitation.findByCode(req.params.code)
			.then(inv=>{
				if (inv.redeemed){
					res.render('generic',{msg:'That code has already been used'});
					return;
				} else {
					var context = {};
					context.pagetitle = 'Sign Up';
					context.error = req.flash('err');
					context.loggedin = false;
					context.code = inv.code;
					res.render('signup',context);
				}
			})
	})

	return router;
}