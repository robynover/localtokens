"use strict";
var striptags = require('striptags');
var Sequelize = require('sequelize');
var passport = require('passport');
var config = require('../config/config.js')[process.env.NODE_ENV];

module.exports = function(express,app){

	var router = express.Router();
	
	var User = app.get('models').user;
	
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

	/*router.post('/signin',passport.authenticate('local'),(req,res)=>{
		// If this function gets called, authentication was successful.
		// 401 status is sent if authentication fails
		res.redirect('/user/dashboard');

	});*/
	router.post('/signin',
	  passport.authenticate('local', { successRedirect: '/user/dashboard',
	                                   failureRedirect: '/signin',
	                                   failureFlash: true })
	);


	router.get('/signout',(req,res)=>{
		req.logout();
		res.render('generic',{msg:"You've been successfully logged out."});
	});

	router.get('/signup',(req,res)=>{
		if (req.user){
			req.logout();
		}
		var context = {};
		context.pagetitle = 'Sign Up';
		context.error = req.flash('err');
		context.loggedin = false;
		res.render('signup',context);
	});

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
		
		User.create({
			username: req.body.username.toLowerCase(),
			password: User.encryptPassword(req.body.password),
			email: req.body.email,
			firstname: striptags(req.body.firstname),
			lastname: striptags(req.body.lastname)
		}).then(user=>{
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



	return router;
};