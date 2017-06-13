"use strict";
var striptags = require('striptags');
var Sequelize = require('sequelize');
var passport = require('passport');
var config = require('../config/config.js')[process.env.NODE_ENV];
var mail = require('../mail.js');

module.exports = function(express,app){

	var router = express.Router();
	
	var User = app.get('models').user;
	var Invitation = require('../models/mongoose/invitation.js');
	var InvitationAllotment = require('../models/mongoose/invitationAllotment.js');
	var Feedback = require('../models/mongoose/feedback.js');
	var InviteRequest = require('../models/mongoose/inviteRequest.js');
	
	router.get('/',function(req,res){
		var context = {};
		context.layout = "home";
		if (req.user){
			context.username = req.user.username;
			context.loggedin = true;
			context.is_admin = req.user.is_admin;
		}
		res.render('generic',context);
	});

	router.get('/signin',(req,res)=>{
		var error = '';
		var err = req.flash();
		if (err){
			error = err.error;
		}
		res.render('login',{pagetitle:'Sign In', error: error});
	});

	app.post('/signin', function (req, res, next) {
		var redirectTo = '/user/dashboard';
		if (req.session.lastVisited){
			redirectTo = req.session.lastVisited;
		}
	    passport.authenticate('local', { successRedirect: redirectTo,
	                                   failureRedirect: '/signin',
	                                   failureFlash: true })(req,res,next);
	});
	
	router.get('/signout',(req,res)=>{
		req.logout();
		res.render('generic',{msg:"You've been successfully logged out."});
	});

	/*router.get('/signup',(req,res)=>{
		if (req.user){
			req.logout();
		}
		var context = {};
		context.pagetitle = 'Sign Up';
		context.error = req.flash('err');
		context.loggedin = false;
		res.render('signup',context);
	});*/

	router.post('/signup', (req,res)=>{
		// set up variables to return in errors, if needed
		var context = {};
		context.username = striptags(req.body.username.toLowerCase());
		context.email = striptags(req.body.email);
		context.firstname = striptags(req.body.firstname);
		context.lastname = striptags(req.body.lastname);
		context.pagetitle = 'Sign Up';
		context.loggedin = false;

		// check password before encryption,
		//    because Model.create() function takes the encrypted version
		try{
			if (req.body.password.length < 6){
				throw new Error("Password must be at least 6 characters");
			}
		} catch(err){
			context.error = err.message;
			res.render('signup',context);
			return;
		}
		// make sure code is valid
		Invitation.findByCode(req.body.code)
			.then(inv=>{
				if (inv.redeemed){
					res.render('generic',{msg:'That code has already been used'});
					return;
				} else {
					// redeem code
					inv.redeemed = true;
					inv.save()
						.then( ()=>{
							User.create({
								username: req.body.username.toLowerCase(),
								password: User.encryptPassword(req.body.password),
								email: req.body.email,
								firstname: striptags(req.body.firstname),
								lastname: striptags(req.body.lastname),
								max_negative_balance: 5,
								is_active: true
							})
							.then(user=>{
								// set up invitation allotment
								var ia = new InvitationAllotment({
									userid: user.id,
									username: user.username,
									limit: 5
								});
								ia.save()
									.then( ()=>{
										// add to sendgrid users list
										mail.addEmailToUserList(user.email)
											.then(r=>{
												if (r.statusCode == 201){
													//console.log('success');
												} else {
													//console.log('failed to add email to list');
												}
											});
										});
								
								res.render('generic',{msg:'Signup successful! Sign in with your password.'});

								
								
							})
							.catch(Sequelize.ValidationError, err => {
								var msg = '';
								for(var i in err.errors){
									msg += err.errors[i].message += ', ';
								}
								msg = msg.substring(0,msg.length - 2);
								
								context.error = msg;
								res.render('signup',context);

							}).catch(err => {
								console.log(err);
								context.error = err.message;
								res.render('signup',context);
							});
						});
					
				}
			});	
	});

	router.get('/feedback', (req,res)=>{
		if (req.user){
			var context = {};
			context.loggedin = true;
			context.username = req.user.username;
			context.pagetitle = "Feedback";
			context.is_admin = req.user.is_admin;
			res.render('feedbackform',context);
		} else {
			res.redirect('/signin');
		}
	});

	router.post('/feedback', (req,res)=>{
		if (req.user){
			var context = {};
			context.loggedin = true;
			context.username = req.user.username;
			context.pagetitle = "Feedback";
			context.is_admin = req.user.is_admin;

			Feedback.create({
				username: req.user.username,
				content: req.body.feedback
			})
				.then(f=>{
					context.msg = "Thank you for your feedback!";
					res.render('feedbackform',context);
				})

			
		} else {
			res.redirect('/signin');
		}
	});

	router.get('/request', (req,res)=>{
		var context = {};
		context.pagetitle = "Request an Invite";
		res.render('invite-request-form',context); 
	});

	router.post('/request', (req,res)=>{
		var context = {};
		context.pagetitle = "Request an Invite";
		InviteRequest.create({
			email:req.body.email
		})
			.then(ir=>{
				context.success = "Thank you! Your request has been submitted.";
				res.render('invite-request-form',context);
			})
			.catch(err=>{
				res.render('generic',{msg:err});
			})
		 
	});

	return router;
};