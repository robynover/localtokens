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
					context.success = req.flash('success');
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

router.get('/transactions',function(req,res,next){
	if (req.user){
		var perPg = 10;
		var pg = 0;
		if (req.query.pg){
			pg = parseInt(req.query.pg) - 1;
		}
		var offset = pg * perPg;
		var uid = req.user.id;
		User.findById(req.user.id).then(u=>{
			u.getUserLedger(perPg,offset).then(l=>{
				var total_entries = l[0].total_entries;
				var total_pages = Math.ceil(l[0].total_entries / perPg);
				pg = pg + 1;
				var context = {};
				context.ledger = l;
				context.loggedin = true;
				if (pg + 1 <= total_pages){
					context.nextpage = pg + 1;
				}
				if (pg - 1 > 0){
					context.prevpage = pg - 1;
				}
				context.page = pg;
				context.total_entries = total_entries;
				context.total_pages = total_pages;
				res.render('transactions',context);
			});
		});
		
	} else {
		res.redirect('/login');
	}
});


module.exports = router;