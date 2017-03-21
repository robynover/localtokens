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
					res.render('dashboard',context);
				});
			});
			
		});	
	} else {
		res.redirect('/login');
	}
});
router.get('/all',function(req,res){
	User.findAll().then(users=>{
		res.render('users',{users:users});
	});
});
router.get('/profile/:username',function(req,res,next){
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
				// if user is logged in, show them the ledger
				
				if (req.user && u.id == req.user.id){
					u.getUserLedger(0).then(l=>{
						//console.log(l);
						context.ledger = l;
						res.render('profile',context);
					});
				} else {
					// otherwise, just show the basic profile
					res.render('profile',context);
				}
				
				
			});
		}	
	});
});


module.exports = router;