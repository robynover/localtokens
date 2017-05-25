"use strict";
var striptags = require('striptags');
var Sequelize = require('sequelize');
var passport = require('passport');
var config = require('../config/config.js')[process.env.NODE_ENV];

module.exports = function(express,app){

	var router = express.Router();
	
	var User = app.get('models').user;
	var Invitation = require('../models/mongoose/invitation.js');
	var InvitationAllotment = require('../models/mongoose/invitationAllotment.js');
	
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
	/*router.post('/signin',passport.authenticate('local'),(req,res)=>{
		// If this function gets called, authentication was successful.
		// 401 status is sent if authentication fails
		var redirectTo = '/user/dashboard';
		if (req.session.lastVisited){
			redirectTo = req.session.lastVisited;
		}
		res.redirect(redirectTo);

	});*/
	/*router.post('/signin',
		passport.authenticate('local', { successRedirect: '/user/dashboard',
	                                   failureRedirect: '/signin',
	                                   failureFlash: true })
	);*/


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
								lastname: striptags(req.body.lastname)
							}).then(user=>{
								// set up invitation allotment
								var ia = new InvitationAllotment({
									userid: user.id,
									username: user.username,
									limit: 5
								});
								ia.save();
								// TODO: send email verification
								res.render('generic',{msg:'Signup successful! We will be in touch shortly to activate your account.'});
							}).catch(Sequelize.ValidationError, err => {
								var msg = '';
								for(var i in err.errors){
									msg += err.errors[i].message += ', ';
								}
								msg = msg.substring(0,msg.length - 2);
								
								context.error = msg;
								res.render('signup',context);

							}).catch(err => {
								console.log(err);
								//res.render('signup');
							});
						});
					
				}
			});	
	});

	/*router.get('/mailtest',(req,res)=>{
		var mail = require('../mail.js');
		var mailObj = mail.setUp(
			'robyn@nyu.edu',
			'Hello from your app',
			'text',
			'Hello. This is from SendGrid');
		mail.send(mailObj)
			.then(function (response) {
			  console.log(response.statusCode);
			  console.log(response.body);
			  console.log(response.headers);
			  res.render('generic',{msg:"Mail test"});
			})
			.catch(function (error) {
			  // error is an instance of SendGridError
			  // The full response is attached to error.response
			  console.log(error.response.statusCode);
			  res.render('generic',{msg:error.response});
			});
		
	});*/


	return router;
};