"use strict";
var express = require('express');
var router = express.Router();
var passport = require('passport');

var Config = require('../config.js');
//DB
var Sequelize = require('sequelize');
var sequelize = new Sequelize(Config.pg);
// models
var User = sequelize.import('../models/user.js');

var striptags = require('striptags');

router.get('/',function(req,res){
	var context = {};
	context.msg = "Hello and welcome";
	context.layout = "home";
	res.render('generic',context);
});
router.post('/login',
  passport.authenticate('local', { successRedirect: '/user/dashboard',
                                   failureRedirect: '/login',
                                   failureFlash: 'Invalid username or password' })
);
router.get('/login',function(req,res){
	var error = '';
	var err = req.flash();
	if (err){
		error = err.error;
	}
	var loggedin = false;
	if (req.user){
		loggedin = true;
	}
	res.render('login',{pagetitle:'Login', error: error, loggedin:loggedin});
});

router.get('/logout', function(req, res){
  req.logout();
  res.render('generic',{msg:"You've been successfully logged out."});
});

router.get('/signup',function(req,res){
	var loggedin = false;
	if (req.user){
		loggedin = true;
	}
	res.render('signup',{pagetitle:'Sign Up', error: req.flash('err'), loggedin:loggedin});
});

router.post('/signup',function(req,res){
	// set up variables to return in errors, if needed
	var context = {};
	context.username = striptags(req.body.username);
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
		username: req.body.username,
		password: User.encryptPassword(req.body.password),
		email: req.body.email,
		firstname: striptags(req.body.firstname),
		lastname: striptags(req.body.lastname)
	}).then(user=>{
		// TODO: send email verification
		res.render('generic',{msg:'Signup successful! Check your inbox for a confirmation.'});
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

module.exports = router;
