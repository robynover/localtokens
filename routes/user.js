"use strict";
var express = require('express');
var router = express.Router();

var Config = require('../config.js');
//DB
var Sequelize = require('sequelize');
var sequelize = new Sequelize(Config.pg);
// models
var User = sequelize.import('../models/user.js');
var Coin = sequelize.import('../models/coin.js');
var Ledger = sequelize.import('../models/ledger.js');

// controllers
var Issue = require('../controllers/issue.js');

// ======= USER routes ======= //

router.get('/',function(req,res,next){
	console.log(req.user);
	if (req.user){
		res.redirect('/user/profile/'+req.user.username);
	} else {
		next();
	}
	
});

router.get('/dashboard',function(req,res){
	if (req.user){
		User.findById(req.user.id).then(u=>{
			var context = {};
			context.username = u.username;
			context.greeting = "Welcome "+ u.username + "!";
			u.getAcctBalance().then(b=>{
				context.balance = b[0].count;
				u.getUserLedger(6).then(l=>{
					context.ledger = l;
					context.loggedin = true;
					context.success = req.flash('success')
					res.render('dashboard',context);
				});
			});
			
		});	
	} else {
		res.redirect('/login');
	}
});

router.get('/profile/:username',function(req,res,next){
	if (req.user){
		User.getByUsername(req.params.username).then(u=>{
			if (!u){
				// go to 404
				next();
			} else{
				u.getAcctBalance().then(ct=>{
					var context = {};
					context.pagetitle = u.username;
					context.balance = ct[0].count;
					context.username = u.username;
					context.loggedin = true;
					res.render('profile',context);
					
				});
			}	
		});
	} else {
		res.redirect('/login');
	}
});


module.exports = router;