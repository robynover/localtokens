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

router.get('/',function(req,res){
	var context = {};
	context.msg = "Hello and welcome";
	context.layout = "home"
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

	res.render('login',{pagetitle:'Login', error: error});
});

router.get('/signup',function(req,res){
	res.render('signup',{pagetitle:'Signup', error: req.flash('err')});
});

router.post('/signup',function(req,res){
	User.create({
		username: req.body.username,
		password: User.encryptPassword(req.body.password),
		email: req.body.email,
		firstname: req.body.firstname,
		lastname: req.body.lastname
	}).then(user=>{
		console.log(user);
		// flash success ?
		res.send('successfully registered!');
	}).catch(Sequelize.ValidationError, err => {
		//console.log('----ValidationError******');
		console.log(err);
		var msg = '';
		for(var i in err.errors){
			msg += err.errors[i].message += ', ';
		}
		msg = msg.substring(0,msg.length - 2);
		
		// flash msg
		req.flash('err',msg);
		res.redirect('signup');

	}).catch(err => {
		console.log();
	});
});

module.exports = router;
